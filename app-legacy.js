// SecureFace Legacy (FaceBox + Loop Fix)
var debugLog = document.getElementById('debug-log');
var dot = document.getElementById('heartbeat-dot');
var scanBox = document.getElementById('scan-box');
var scanText = document.getElementById('scan-text');
function log(msg) {
    if (debugLog) {
        debugLog.innerHTML += "<div>" + msg + "</div>";
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}
log("App v5: Face+QR+Box");
var video = document.getElementById('webcam');
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var db = null;
var frameCount = 0;
var isProcessing = false;
var faceMatcher = null;
var firebaseConfig = {
    apiKey: "AIzaSyCzyyMmTPRBB4SMog88mlTcZFI9rMDxr4Y",
    authDomain: "atpro-system.firebaseapp.com",
    projectId: "atpro-system",
    storageBucket: "atpro-system.firebasestorage.app",
    messagingSenderId: "166556913424",
    appId: "1:166556913424:web:4eeb80e329f01dcf3c9f95"
};
// 1. Camera
function startCamera() {
    log("Starting Camera...");
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
        navigator.getUserMedia({ video: true, audio: false },
            function (stream) {
                log("Cam Success");
                if (window.webkitURL) video.src = window.webkitURL.createObjectURL(stream);
                else video.srcObject = stream;
                video.play();
                requestNextFrame();
            },
            function (err) { log("Cam Error: " + err.name); }
        );
    } else {
        log("No Cam API");
    }
}
// 2. Main Loop
function scanLoop() {
    frameCount++;
    // Heartbeat
    if (frameCount % 30 === 0 && dot) dot.style.background = (dot.style.background === 'red') ? 'lime' : 'red';
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
            // Resize (Safety Check)
            if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
            // Draw Video
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // ----- A. QR SCAN (Fast) -----
            if (!isProcessing && frameCount % 5 === 0 && window.jsQR) {
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                // "undefined is not a function" here usually means jsQR isn't loaded or ctx is wrong
                // We check window.jsQR first.
                var code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                if (code && code.data) {
                    highlightBox('yellow', "QR FOUND: " + code.data);
                    processAttendance(code.data, "QR");
                }
            }
            // ----- B. FACE DETECTION (Tracking.js / FaceAPI) -----
            // Doing FaceAPI every frame crashes old tabs. Do it every 15 frames (0.5s)
            if (!isProcessing && frameCount % 15 === 0 && window.faceapi) {
                detectFace();
            }
        } catch (e) {
            if (frameCount % 60 === 0) log("Loop: " + e.message);
        }
    }
    // Safest rAF
    if (window.requestAnimationFrame) window.requestAnimationFrame(scanLoop);
    else setTimeout(scanLoop, 33);
}
function highlightBox(color, text) {
    if (scanBox) {
        scanBox.style.borderColor = color;
        scanBox.style.boxShadow = "0 0 20px " + color;
    }
    if (scanText) {
        scanText.innerText = text || "PROCESSING...";
        scanText.style.color = color;
    }
    // Reset after 1s
    setTimeout(function () {
        if (scanBox) {
            scanBox.style.borderColor = "rgba(255,255,255,0.5)";
            scanBox.style.boxShadow = "none";
        }
        if (scanText) {
            scanText.innerText = "SCANNING...";
            scanText.style.color = "#4a90e2";
        }
    }, 1500);
}
// 3. Face AI
function detectFace() {
    // Check if TinyFace is loaded
    // We cannot use await here in legacy code
    try {
        var opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        faceapi.detectSingleFace(video, opts).withFaceLandmarks(true).withFaceDescriptor()
            .then(function (res) {
                if (res) {
                    // Draw Box on Canvas? No, stick to UI box for performance
                    // log("Face Found");
                    if (faceMatcher) {
                        var best = faceMatcher.findBestMatch(res.descriptor);
                        if (best.label !== 'unknown') {
                            highlightBox('lime', "FACE: " + best.label);
                            processAttendance(best.label, "FACE");
                        } else {
                            highlightBox('orange', "Unknown Face");
                        }
                    } else {
                        // Matcher not ready, but face found
                        highlightBox('cyan', "Face Found (Loading DB...)");
                    }
                }
            }).catch(function (e) {
                // Suppress promise errors
            });
    } catch (e) {
        // Ensure FaceAPI is initialized
    }
}
// 4. DB & Init
setTimeout(function () {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        log("DB Connected");
        // Load AI
        log("Loading AI...");
        faceapi.nets.tinyFaceDetector.loadFromUri('./models').then(function () {
            log("AI Loaded");
            // Load others
            faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models');
            faceapi.nets.faceRecognitionNet.loadFromUri('./models').then(loadUsers);
        });
    } catch (e) { log("Init Err: " + e.message); }
}, 2000);
function loadUsers() {
    db.collection('users').get().then(function (snap) {
        var descs = [];
        snap.forEach(function (d) {
            var data = d.data();
            if (data.descriptor) {
                var arr = [];
                for (var k in data.descriptor) arr.push(data.descriptor[k]);
                descs.push(new faceapi.LabeledFaceDescriptors(d.id, [new Float32Array(arr)]));
            }
        });
        if (descs.length > 0) {
            faceMatcher = new faceapi.FaceMatcher(descs, 0.5);
            log("Users: " + descs.length);
        }
    });
}
function requestNextFrame() {
    if (window.requestAnimationFrame) requestAnimationFrame(scanLoop);
    else setTimeout(scanLoop, 33);
}
// Process
function processAttendance(id, method) {
    if (isProcessing) return;
    isProcessing = true;
    // ... (Log Logic same as before)
    // For brevity, just simulating success UI call
    if (!db) { isProcessing = false; return; }
    db.collection('users').doc(id).get().then(function (doc) {
        if (doc.exists) logLog(doc.id, doc.data(), method);
        else {
            db.collection('users').where('empId', '==', id).limit(1).get().then(function (s) {
                if (!s.empty) logLog(s.docs[0].id, s.docs[0].data(), method);
                else isProcessing = false;
            });
        }
    }).catch(function () { isProcessing = false; });
}
function logLog(uid, data, method) {
    db.collection('attendance_logs').where('userId', '==', uid).orderBy('timestamp', 'desc').limit(1).get()
        .then(function (snap) {
            var type = 'IN';
            if (!snap.empty && snap.docs[0].data().type === 'IN') type = 'OUT';
            db.collection('attendance_logs').add({
                userId: uid, name: data.name, empId: data.empId, type: type, method: method, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            showSuccess(data, type);
        });
}
function showSuccess(data, type) {
    var overlay = document.getElementById('result-overlay');
    if (overlay) {
        document.getElementById('res-name').innerText = data.name;
        document.getElementById('res-badge').innerText = type;
        document.getElementById('res-badge').style.background = (type === 'IN') ? 'green' : 'red';
        document.getElementById('res-photo').src = data.photo || "";
        overlay.style.display = 'block';
    }
    setTimeout(function () {
        if (overlay) overlay.style.display = 'none';
        isProcessing = false;
    }, 3000);
}
startCamera();
