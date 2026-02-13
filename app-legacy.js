// SecureFace Legacy (Optimized for Speed)
console.log("Legacy Fast App Starting...");
// --- Configuration ---
var firebaseConfig = {
    apiKey: "AIzaSyCzyyMmTPRBB4SMog88mlTcZFI9rMDxr4Y",
    authDomain: "atpro-system.firebaseapp.com",
    projectId: "atpro-system",
    storageBucket: "atpro-system.firebasestorage.app",
    messagingSenderId: "166556913424",
    appId: "1:166556913424:web:4eeb80e329f01dcf3c9f95"
};
// --- Globals ---
var db;
var video = document.getElementById('webcam');
var statusDiv = document.getElementById('connection-status');
var scanner = null;
var faceMatcher = null;
var isProcessing = false;
// --- Init ---
function init() {
    startClock();
    // 1. Start Camera IMMEDIATELY (Don't wait for DB/AI)
    startCameraFast();
    // 2. Load Firebase in Background
    setTimeout(function () {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            console.log("DB Connected");
            loadUsersForMatching();
        } catch (e) {
            console.error("DB Error", e);
        }
    }, 500);
    // 3. Load Face AI (Heavy) - Delay slightly to let camera start
    setTimeout(loadFaceAPI, 2000);
}
// --- Fast Camera Logic (Native First) ---
function startCameraFast() {
    statusDiv.innerText = "Starting Camera...";
    var constraints = {
        video: { facingMode: "user" }, // Front camera preferred for Face ID
        audio: false
    };
    // A. Modern API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                video.srcObject = stream;
                video.play();
                statusDiv.innerText = "Camera Active (Modern)";
                startQR(); // Start scanning logic
            })
            .catch(function (err) {
                console.error(err);
                tryLegacyCamera();
            });
    } else {
        tryLegacyCamera();
    }
}
function tryLegacyCamera() {
    // B. Legacy API (Webkit/Moz)
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!getUserMedia) {
        statusDiv.innerText = "Camera Not Supported";
        return;
    }
    getUserMedia.call(navigator, { video: true }, function (stream) {
        if (window.webkitURL) {
            video.src = window.webkitURL.createObjectURL(stream);
        } else {
            video.src = stream;
        }
        video.play();
        statusDiv.innerText = "Camera Active (Legacy)";
        startQR();
    }, function (err) {
        statusDiv.innerText = "Camera Denied: " + err.name;
    });
}
// --- QR Logic (Instascan as fallback or secondary?) ---
// Actually, Instascan might conflict with manual getUserMedia on old devices.
// Let's use a simpler approach for QR if standard camera is running.
// We will use a lightweight JSQR library if possible, but Instascan handles the camera itself.
// To fix "Camera not enabling", let's use Instascan ONLY if manual fail, OR rely on manual video + canvas scan.
function startQR() {
    // We already have video running.
    // Let's try to scan the video feed 
    // Load Instascan later? No, let's use a simple distinct QR lib or just rely on Face for now?
    // User asked for QR too.
    // Instascan usually wants to control the camera.
    // Let's try to initialize it on the EXISTING video element if possible, 
    // or just let it take over?
    // Only start scanner if camera didn't start manually?
    // Actually, Instascan is robust. Let's try to use it for *everything* (QR + Video Feed)
    if (!video.srcObject && !video.src) {
        // If manual failed, try Instascan
        try {
            scanner = new Instascan.Scanner({ video: video, mirror: true });
            scanner.addListener('scan', function (content) {
                processAttendance(content, 'QR');
            });
            Instascan.Camera.getCameras().then(function (cameras) {
                if (cameras.length > 0) {
                    scanner.start(cameras[0]); // Front?
                    statusDiv.innerText = "QR Scanner Active";
                }
            });
        } catch (e) { console.error(e); }
    }
}
// --- Face API Logic ---
function loadFaceAPI() {
    statusDiv.innerText = "Loading AI..."; // Feedback
    // Load ONLY the tiny detector first for speed
    faceapi.nets.tinyFaceDetector.loadFromUri('./models').then(function () {
        console.log("TinyFace Ready");
        statusDiv.innerText = "Face ID Ready";
        // Start Loop
        setInterval(detectFace, 500); // 2 FPS is fast enough for old tab
        // Load others in background
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models');
        faceapi.nets.faceRecognitionNet.loadFromUri('./models');
    }).catch(function (e) {
        statusDiv.innerText = "Face ID Failed (QR Only)";
    });
}
function loadUsersForMatching() {
    db.collection('users').get().then(function (snapshot) {
        var labeledDescriptors = [];
        snapshot.forEach(function (doc) {
            var data = doc.data();
            if (data.descriptor) {
                // Convert object/array to Float32Array
                var arr = [];
                for (var k in data.descriptor) arr.push(data.descriptor[k]);
                var floatArr = new Float32Array(arr);
                labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(doc.id, [floatArr]));
            }
        });
        if (labeledDescriptors.length > 0) {
            faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
            console.log("Face Matcher Ready with " + labeledDescriptors.length + " users.");
        }
    }).catch(function (err) {
        console.error("User Load Error:", err);
    });
}
function detectFace() {
    if (isProcessing || !faceMatcher || video.paused || video.ended) return;
    // Extremely lightweight options
    var opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
    faceapi.detectSingleFace(video, opts)
        .withFaceLandmarks(true) // Need landmarks for recognition
        .withFaceDescriptor()
        .then(function (result) {
            if (result) {
                var best = faceMatcher.findBestMatch(result.descriptor);
                if (best.label !== 'unknown') {
                    processAttendance(best.label, 'FACE');
                }
            }
        }).catch(function (e) { /* ignore */ });
}
// --- Attendance Logic ---
function processAttendance(scannedId, method) {
    if (isProcessing) return; // Debounce
    isProcessing = true;
    // Immediate Visual Feedback
    statusDiv.innerText = "Found: " + scannedId.substring(0, 5) + "...";
    statusDiv.style.color = "#4a90e2";
    // 1. Find User (Optimized)
    // Assume scannedId is a Doc ID first (fastest)
    db.collection('users').doc(scannedId).get().then(function (doc) {
        if (doc.exists) {
            doLog(doc.id, doc.data(), method);
        } else {
            // Fallback: Query by Emp ID
            db.collection('users').where('empId', '==', scannedId).limit(1).get()
                .then(function (snap) {
                    if (!snap.empty) {
                        var d = snap.docs[0];
                        doLog(d.id, d.data(), method);
                    } else {
                        statusDiv.innerText = "Unknown User";
                        isProcessing = false;
                    }
                });
        }
    }).catch(function (e) {
        isProcessing = false;
    });
}
function doLog(uid, userData, method) {
    // 2. Determine IN/OUT (Fastest: default to IN, check last log in background?)
    // To be super fast, we can just log it. But toggle is nicer.
    db.collection('attendance_logs')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()
        .then(function (snap) {
            var type = 'IN';
            if (!snap.empty) {
                var last = snap.docs[0].data();
                if (last.type === 'IN') type = 'OUT';
            }
            // 3. Write Log
            db.collection('attendance_logs').add({
                userId: uid,
                name: userData.name,
                empId: userData.empId,
                type: type,
                method: method, // 'FACE' or 'QR'
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            // 4. Show Success (Don't wait for write completion)
            showSuccess(userData, type);
        }).catch(function (e) {
            // If offline or error, default to IN and show success anyway
            showSuccess(userData, 'IN (Offline?)');
        });
}
// --- UI Feedback ---
function showSuccess(user, type) {
    var overlay = document.getElementById('result-overlay');
    var badge = document.getElementById('res-badge');
    document.getElementById('res-photo').src = user.photo || 'https://via.placeholder.com/150';
    document.getElementById('res-name').innerText = user.name;
    document.getElementById('res-id').innerText = user.empId;
    badge.innerText = type;
    badge.style.background = (type === 'IN') ? '#28a745' : '#dc3545'; // Green / Red
    overlay.style.display = 'block';
    // Hide after 3s
    setTimeout(function () {
        overlay.style.display = 'none';
        isProcessing = false;
        statusDiv.innerText = "System Ready (Scan Next)";
    }, 3000);
}
function showError(msg) {
    statusDiv.innerText = "Error: " + msg;
    statusDiv.style.color = "red";
    setTimeout(function () {
        isProcessing = false;
        statusDiv.innerText = "System Ready";
        statusDiv.style.color = "#aaa";
    }, 2000);
}
function startClock() {
    setInterval(function () {
        document.getElementById('clock').innerText = new Date().toLocaleTimeString();
    }, 1000);
}
// Start
init();
