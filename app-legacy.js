// Legacy JS for Android 4.4 (ES5 Syntax)

console.log("App-Legacy.js script starting...");

var firebaseConfig = {
    apiKey: "AIzaSyCzyyMmTPRBB4SMog88mlTcZFI9rMDxr4Y",
    authDomain: "atpro-system.firebaseapp.com",
    projectId: "atpro-system",
    storageBucket: "atpro-system.firebasestorage.app",
    messagingSenderId: "166556913424",
    appId: "1:166556913424:web:4eeb80e329f01dcf3c9f95"
};

// 1. Initialize Firebase
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
    } else {
        console.error("Firebase SDK not loaded!");
    }
} catch (e) {
    console.error("Firebase Init Failed: " + e.message);
}

var video = document.getElementById('video-feed');
var statusMsg = document.getElementById('status-msg');

// 2. Clock
setInterval(function () {
    var now = new Date();
    var el = document.getElementById('clock');
    if (el) el.innerText = now.toLocaleTimeString();
}, 1000);

// 3. Camera Logic
function startCamera() {
    console.log("Attempting to start camera...");
    statusMsg.innerText = "Requesting Camera...";

    var constraints = { video: true, audio: false };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("Using modern navigator.mediaDevices");
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                console.log("Camera stream obtained (Modern)");
                video.srcObject = stream;
                onCameraReady();
            })
            .catch(function (err) {
                console.error("Modern Camera Error: " + err);
                tryLegacyGetUserMedia();
            });
    } else {
        tryLegacyGetUserMedia();
    }
}

function tryLegacyGetUserMedia() {
    console.log("Trying legacy getUserMedia...");
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    if (!getUserMedia) {
        console.error("No getUserMedia support detected.");
        statusMsg.innerText = "Camera NOT Supported.";
        return;
    }

    getUserMedia.call(navigator, { video: true }, function (stream) {
        console.log("Camera stream obtained (Legacy)");
        if (window.webkitURL) {
            video.src = window.webkitURL.createObjectURL(stream);
        } else {
            video.src = stream;
        }
        video.play();
        onCameraReady();
    }, function (err) {
        console.error("Legacy Camera Error: " + err.name);
        statusMsg.innerText = "Camera Denied: " + err.name;
    });
}

function onCameraReady() {
    statusMsg.innerText = "Camera Active. Loading AI...";
    loadModels();
}

function loadModels() {
    console.log("Loading FaceAPI models...");

    // Timeout to prevent infinite spinner
    setTimeout(function () {
        document.getElementById('loading-overlay').style.display = 'none';
        if (statusMsg.innerText.indexOf("Ready") === -1) {
            console.log("Model loading timed out or finished.");
        }
    }, 5000);

    if (typeof faceapi === 'undefined') {
        console.error("FaceAPI script not loaded!");
        statusMsg.innerText = "AI Script Missing";
        return;
    }

    try {
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
            // Skip Landmarks/Recognition for now to test basic load
            // faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models'),
            // faceapi.nets.faceRecognitionNet.loadFromUri('./models')
        ]).then(function () {
            console.log("TinyFaceDetector loaded!");
            statusMsg.innerText = "System Ready (Lite Mode)";
            startTracking();
        }).catch(function (err) {
            console.error("Model Load Error: " + err);
            statusMsg.innerText = "AI Load Failed";
        });
    } catch (e) {
        console.error("Model Exception: " + e.message);
    }
}

function startTracking() {
    console.log("Starting Face Tracking...");
    var canvas = document.getElementById('overlay-canvas');

    setInterval(function () {
        if (video.paused || video.ended) return;

        var options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

        faceapi.detectSingleFace(video, options).then(function (detection) {
            if (detection) {
                // console.log("Face Detected!");
                var dims = faceapi.matchDimensions(canvas, video, true);
                faceapi.draw.drawDetections(canvas, faceapi.resizeResults(detection, dims));
            }
        }).catch(function (err) {
            // Suppress constant loop errors
        });

    }, 1000); // 1 Second interval (Very Slow for performance)
}

// Start immediately on load
window.onload = function () {
    console.log("Window loaded. Starting app...");
    setTimeout(startCamera, 1000);
};
