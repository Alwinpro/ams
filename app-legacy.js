// SecureFace Legacy (Ultra-Light)
console.log("Ultra-Light App Starting...");
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
var canvas = document.createElement('canvas'); // Off-screen canvas for processing
var ctx = canvas.getContext('2d', { willReadFrequently: true });
var faceMatcher = null;
var isProcessing = false;
var debugLog = document.getElementById('debug-log');
function log(msg) {
    console.log(msg);
    if (debugLog.style.display === 'block') {
        debugLog.innerHTML += "<div>" + msg + "</div>";
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}
// --- Init ---
function init() {
    startClock();
    statusDiv.innerText = "Starting Camera...";
    // 1. Camera First
    startCamera();
    // 2. Firebase Async
    setTimeout(function () {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            log("DB Connected");
            loadUsers();
        } catch (e) { log("DB Error: " + e.message); }
    }, 1000);
    // 3. Face AI Async
    setTimeout(loadAI, 3000);
}
// --- Camera ---
function startCamera() {
    var constraints = { video: { facingMode: "user" }, audio: false };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(handleStream).catch(function () {
                log("Modern gum failed, trying legacy");
                tryLegacy();
            });
    } else {
        tryLegacy();
    }
}
function tryLegacy() {
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (getUserMedia) {
        getUserMedia.call(navigator, { video: true }, handleStream, function (e) {
            statusDiv.innerText = "Cam Fail: " + e.name;
        });
    } else {
        statusDiv.innerText = "Cam Not Supported";
    }
}
function handleStream(stream) {
    if (window.webkitURL) video.src = window.webkitURL.createObjectURL(stream);
    else video.srcObject = stream; // Modern browsers
    // Some old browsers need this
    if (video.srcObject) video.srcObject = stream;
    video.play();
    statusDiv.innerText = "Camera Active. Starting Scan...";
    // Start Scan Loop
    requestAnimationFrame(scanLoop);
}
// --- Scanning Loop (The Heart) ---
function scanLoop() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // 1. Setup Canvas if needed
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        // 2. Draw Frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // 3. Scan QR (Every Frame - It's fast)
        if (!isProcessing) {
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
            if (code) {
                log("QR Found: " + code.data);
                processAttendance(code.data, "QR");
            }
        }
    }
    // Loop
    requestAnimationFrame(scanLoop);
}
// --- Face AI (Separate Slow Loop) ---
function loadAI() {
    statusDiv.innerText = "Loading Face AI...";
    faceapi.nets.tinyFaceDetector.loadFromUri('./models').then(function () {
        log("Face AI Loaded");
        statusDiv.innerText = "Ready (Face + QR)";
        setInterval(detectFace, 800); // Check face every 800ms
        // Load descriptors later
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models');
        faceapi.nets.faceRecognitionNet.loadFromUri('./models');
    }).catch(function (e) { log("AI Fail: " + e); });
}
function detectFace() {
    if (isProcessing || !faceMatcher || video.paused || video.ended) return;
    // Ultra-tiny input size for speed on old Android
    var opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.5 });
    faceapi.detectSingleFace(video, opts)
        .withFaceLandmarks(true)
        .withFaceDescriptor()
        .then(function (res) {
            if (res) {
                var best = faceMatcher.findBestMatch(res.descriptor);
                if (best.label !== 'unknown') {
                    processAttendance(best.label, "FACE");
                }
            }
        });
}
function loadUsers() {
    db.collection('users').get().then(function (snap) {
        var descriptors = [];
        snap.forEach(function (doc) {
            var d = doc.data();
            if (d.descriptor) {
                var arr = []; // Convert format
                for (var k in d.descriptor) arr.push(d.descriptor[k]);
                descriptors.push(new faceapi.LabeledFaceDescriptors(doc.id, [new Float32Array(arr)]));
            }
        });
        if (descriptors.length > 0) {
            faceMatcher = new faceapi.FaceMatcher(descriptors, 0.5);
            log("Users Loaded: " + descriptors.length);
        }
    });
}
// --- Processing ---
function processAttendance(id, type) {
    if (isProcessing) return;
    isProcessing = true;
    statusDiv.innerText = "Verifying: " + id;
    statusDiv.style.color = "yellow";
    // Find scan in User DB
    findUser(id, function (user) {
        if (!user) {
            statusDiv.innerText = "User Not Found";
            setTimeout(resetState, 2000);
            return;
        }
        // Log it
        logAttendance(user, type);
    });
}
function findUser(id, cb) {
    // Check Doc ID
    var ref = db.collection('users');
    ref.doc(id).get().then(function (d) {
        if (d.exists) cb({ id: d.id, data: d.data() });
        else {
            // Check Emp ID
            ref.where('empId', '==', id).limit(1).get().then(function (s) {
                if (!s.empty) cb({ id: s.docs[0].id, data: s.docs[0].data() });
                else cb(null);
            });
        }
    });
}
function logAttendance(user, method) {
    // Determine IN/OUT (Blind Toggle)
    var logs = db.collection('attendance_logs');
    logs.where('userId', '==', user.id).orderBy('timestamp', 'desc').limit(1).get()
        .then(function (snap) {
            var mode = 'IN';
            if (!snap.empty && snap.docs[0].data().type === 'IN') mode = 'OUT';
            logs.add({
                userId: user.id,
                name: user.data.name,
                empId: user.data.empId,
                type: mode,
                method: method,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            showSuccess(user.data, mode);
        })
        .catch(function (e) {
            // Offline Fallback
            showSuccess(user.data, "IN (Offline)");
        });
}
function showSuccess(data, mode) {
    var overlay = document.getElementById('result-overlay');
    document.getElementById('res-name').innerText = data.name;
    document.getElementById('res-id').innerText = data.empId;
    document.getElementById('res-photo').src = data.photo || "";
    var b = document.getElementById('res-badge');
    b.innerText = mode;
    b.style.background = (mode === 'IN') ? 'green' : 'red';
    overlay.style.display = 'block';
    setTimeout(function () {
        overlay.style.display = 'none';
        resetState();
    }, 3000);
}
function resetState() {
    isProcessing = false;
    statusDiv.innerText = "System Ready";
    statusDiv.style.color = "#aaa";
}
function startClock() {
    setInterval(function () {
        document.getElementById('clock').innerText = new Date().toLocaleTimeString();
    }, 1000);
    // Hidden debug toggle (Tap clock 5 times?)
    document.getElementById('clock').onclick = function () {
        var d = document.getElementById('debug-log');
        d.style.display = (d.style.display === 'none') ? 'block' : 'none';
    };
}
// Start
window.onload = init;
