// SecureFace Legacy (ES5 for Android 4.4)
console.log("Legacy App Starting...");
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
var overlay = document.getElementById('overlay');
var statusDiv = document.getElementById('connection-status');
var scanner = null; // InstaScan
var faceMatcher = null;
var isProcessing = false;
// --- Init ---
function init() {
    startClock();
    // 1. Firebase
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        statusDiv.innerText = "Database Connected.";
        // Load User Data for Face Matching
        loadUsersForMatching();
    } catch (e) {
        statusDiv.innerText = "DB Error: " + e.message;
        console.error(e);
    }
    // 2. Camera & QR
    startQRScanner(); // InstaScan handles camera access well on old devices
    // 3. Face API (Attempt to load later to avoid blocking UI)
    setTimeout(loadFaceAPI, 3000);
}
// --- Face API Logic ---
function loadFaceAPI() {
    statusDiv.innerText = "Loading AI Models...";
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models')
    ]).then(function () {
        console.log("Models Loaded");
        statusDiv.innerText = "System Ready (Face + QR)";
        startFaceDetectionLoop();
    }).catch(function (err) {
        console.error("FaceAPI Load Failed:", err);
        statusDiv.innerText = "FaceID Disabled (Using QR Only)";
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
function startFaceDetectionLoop() {
    setInterval(function () {
        if (isProcessing) return; // Don't detect if busy
        // Use Tiny options for speed
        var opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        faceapi.detectSingleFace(video, opts)
            .withFaceLandmarks()
            .withFaceDescriptor()
            .then(function (detection) {
                if (detection && faceMatcher) {
                    var match = faceMatcher.findBestMatch(detection.descriptor);
                    if (match.label !== 'unknown') {
                        // Found a match!
                        processAttendance(match.label, 'FACE');
                    }
                }
            });
    }, 1000); // Check every 1s (Slow but safe)
}
// --- QR Logic ---
function startQRScanner() {
    try {
        scanner = new Instascan.Scanner({ video: video, mirror: false });
        scanner.addListener('scan', function (content) {
            console.log("QR Found:", content);
            processAttendance(content, 'QR');
        });
        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                // Try back camera first (index 1?), else front (index 0)
                // Often 1 is back on mobile.
                var selectedCam = cameras[cameras.length > 1 ? 1 : 0];
                scanner.start(selectedCam);
            } else {
                statusDiv.innerText = "No Cameras Found";
            }
        }).catch(function (e) {
            console.error(e);
            statusDiv.innerText = "Camera Error: " + e;
        });
    } catch (e) {
        console.error("QR Init Error:", e);
        // Fallback to manual getUserMedia if Instascan fails?
    }
}
// --- Attendance Logic ---
function processAttendance(scannedId, method) {
    if (isProcessing) return;
    isProcessing = true;
    console.log("Processing:", scannedId);
    statusDiv.innerText = "Verifying ID...";
    // 1. Get User
    var docRef = db.collection('users').doc(scannedId);
    // Try Doc ID first
    docRef.get().then(function (doc) {
        if (doc.exists) {
            markLog(doc.id, doc.data(), method);
        } else {
            // Try EmpID Query
            db.collection('users').where('empId', '==', scannedId).limit(1).get()
                .then(function (snap) {
                    if (!snap.empty) {
                        var d = snap.docs[0];
                        markLog(d.id, d.data(), method);
                    } else {
                        showError("User Not Found");
                    }
                });
        }
    }).catch(function (err) {
        showError("DB Error");
    });
}
function markLog(uid, userData, method) {
    var now = new Date();
    // Simple IN/OUT Toggle Logic
    // Check last log
    db.collection('attendance_logs')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()
        .then(function (snap) {
            var type = 'IN';
            if (!snap.empty) {
                var last = snap.docs[0].data();
                if (last.type === 'IN') type = 'OUT'; // Toggle
            }
            // Add Log
            db.collection('attendance_logs').add({
                userId: uid,
                name: userData.name,
                empId: userData.empId,
                type: type,
                method: method,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function () {
                showSuccess(userData, type);
            });
        }).catch(function (err) {
            // Offline? Just force IN
            showError("Network Error");
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

