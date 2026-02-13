// SecureFace Legacy (QR Focus)
var debugLog = document.getElementById('debug-log');
var dot = document.getElementById('heartbeat-dot');
function log(msg) {
    if (debugLog) {
        debugLog.innerHTML += "<div>" + msg + "</div>";
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}
log("JS Started.");
var video = document.getElementById('webcam');
var canvas = document.createElement('canvas'); // Off-screen
var ctx = canvas.getContext('2d');
var db = null;
var frameCount = 0;
// Configuration
var firebaseConfig = {
    apiKey: "AIzaSyCzyyMmTPRBB4SMog88mlTcZFI9rMDxr4Y",
    authDomain: "atpro-system.firebaseapp.com",
    projectId: "atpro-system",
    storageBucket: "atpro-system.firebasestorage.app",
    messagingSenderId: "166556913424",
    appId: "1:166556913424:web:4eeb80e329f01dcf3c9f95"
};
// 1. Start Camera
function startCamera() {
    log("Init Camera...");
    // Polyfill
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
        navigator.getUserMedia({ video: true, audio: false },
            function (stream) {
                log("Cam Allowed");
                if (window.webkitURL) video.src = window.webkitURL.createObjectURL(stream);
                else video.srcObject = stream;
                video.play();
                // Wait for dimensions
                video.addEventListener('loadedmetadata', function () {
                    log("Video Dims: " + video.videoWidth + "x" + video.videoHeight);
                    scanLoop();
                });
            },
            function (err) {
                log("Cam Err: " + err.name);
            }
        );
    } else {
        log("No getUserMedia API");
    }
}
// 2. Scan Loop
function scanLoop() {
    frameCount++;
    // Blink Dot every 30 frames (approx 1 sec)
    if (frameCount % 30 === 0) {
        dot.style.background = (dot.style.background === 'red') ? 'lime' : 'red';
        // log("Heartbeat " + frameCount);
    }
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
            // Resize Canvas
            if (canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
            // Draw
            ctx.drawImage(video, 0, 0);
            // Scan QR
            if (window.jsQR) {
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                var code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                if (code) {
                    log("FOUND QR: " + code.data);
                    // playSound?
                    // log success
                }
            } else {
                if (frameCount % 100 === 0) log("jsQR missing?");
            }
        } catch (e) {
            log("Loop Err: " + e.message);
        }
    } else {
        // log("Video Not Ready");
    }
    // Modern rAF or fallback
    if (window.requestAnimationFrame) requestAnimationFrame(scanLoop);
    else setTimeout(scanLoop, 33);
}
// 3. Connect DB
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    log("DB Init OK");
} catch (e) {
    log("DB Init Fail: " + e.message);
}
// Start
startCamera();
