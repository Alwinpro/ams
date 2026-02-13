// SecureFace Legacy (Ultra-Stable QR + DB)
var debugLog = document.getElementById('debug-log');
var dot = document.getElementById('heartbeat-dot');
function log(msg) {
    if (debugLog) {
        debugLog.innerHTML += "<div>" + msg + "</div>";
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}
log("Legacy App Started (v4)");
var video = document.getElementById('webcam');
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var db = null;
var frameCount = 0;
var isProcessing = false;
// Config
var firebaseConfig = {
    apiKey: "AIzaSyCzyyMmTPRBB4SMog88mlTcZFI9rMDxr4Y",
    authDomain: "atpro-system.firebaseapp.com",
    projectId: "atpro-system",
    storageBucket: "atpro-system.firebasestorage.app",
    messagingSenderId: "166556913424",
    appId: "1:166556913424:web:4eeb80e329f01dcf3c9f95"
};
// 1. Camera Init
function startCamera() {
    log("Requesting Camera...");
    // Vendor Prefixes
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
        navigator.getUserMedia({ video: true, audio: false },
            function (stream) {
                log("Camera Access Granted");
                try {
                    if (window.webkitURL) video.src = window.webkitURL.createObjectURL(stream);
                    else video.srcObject = stream;
                } catch (e) {
                    video.src = stream; // Oldest fallback
                }
                video.play();
                requestNextFrame();
            },
            function (err) {
                log("Camera Err: " + err.name);
            }
        );
    } else {
        log("No Camera API Support");
    }
}
// 2. Scan Loop (With Safety Try-Catch)
function scanLoop() {
    try {
        frameCount++;
        // Blink Dot (Visual Heartbeat)
        if (frameCount % 30 === 0 && dot) {
            dot.style.background = (dot.style.background === 'red') ? 'lime' : 'red';
        }
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // A. Resize Canvas if needed
            if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
            // B. Draw Frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // C. Scan QR (Skip frames for speed)
            if (!isProcessing && frameCount % 4 === 0 && window.jsQR) {
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                var code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                if (code && code.data && code.data.length > 0) {
                    log("QR FOUND: " + code.data);
                    processAttendance(code.data, "QR");
                }
            }
        }
    } catch (e) {
        // Log sparingly
        if (frameCount % 60 === 0) log("Loop Err: " + e.message);
    }
    requestNextFrame();
}
function requestNextFrame() {
    if (window.requestAnimationFrame) requestAnimationFrame(scanLoop);
    else setTimeout(scanLoop, 33); // 30 FPS fallback
}
// 3. Process Attendance
function processAttendance(id, method) {
    if (isProcessing) return;
    isProcessing = true;
    log("Verifying ID: " + id);
    if (!db) {
        log("DB Not Ready Yet");
        isProcessing = false;
        return;
    }
    // Lookup User
    db.collection('users').doc(id).get().then(function (doc) {
        if (doc.exists) {
            logLog(doc.id, doc.data(), method);
        } else {
            // Try EmpID
            db.collection('users').where('empId', '==', id).limit(1).get()
                .then(function (snap) {
                    if (!snap.empty) {
                        logLog(snap.docs[0].id, snap.docs[0].data(), method);
                    } else {
                        log("User Not Found");
                        setTimeout(resetState, 2000);
                    }
                });
        }
    }).catch(function (e) {
        log("Lookup Error: " + e.message);
        setTimeout(resetState, 2000);
    });
}
function logLog(uid, data, method) {
    // Determine IN/OUT (Check last log)
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
            // Write Log
            db.collection('attendance_logs').add({
                userId: uid,
                name: data.name,
                empId: data.empId,
                type: type,
                method: method,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            showSuccess(data, type);
        })
        .catch(function (e) {
            // Offline Fallback
            showSuccess(data, "IN (Offline)");
        });
}
function showSuccess(data, type) {
    // Show Full Screen Success
    var overlay = document.getElementById('result-overlay');
    if (overlay) {
        document.getElementById('res-name').innerText = data.name;
        document.getElementById('res-id').innerText = data.empId;
        document.getElementById('res-photo').src = data.photo || "";
        var b = document.getElementById('res-badge');
        b.innerText = type;
        b.style.background = (type === 'IN') ? '#28a745' : '#dc3545';
        overlay.style.display = 'block';
    }
    log("SUCCESS: " + data.name + " (" + type + ")");
    setTimeout(function () {
        if (overlay) overlay.style.display = 'none';
        resetState();
    }, 3000);
}
function resetState() {
    isProcessing = false;
}
// 4. Delayed DB Init (Wait for Polyfills)
setTimeout(function () {
    try {
        if (typeof firebase === 'undefined') {
            log("Firebase Script Defaulted");
            return;
        }
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        log("DB Connected Successfully");
        // Populate Status bar
        var statusDiv = document.getElementById('connection-status');
        if (statusDiv) statusDiv.innerText = "System Ready";
    } catch (e) {
        log("DB Init Error: " + e.message);
    }
}, 2500);
// Start
startCamera();
