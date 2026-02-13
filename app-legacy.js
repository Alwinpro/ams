// Legacy JS for Android 4.4 (ES5 Syntax, No Async/Await)

// --- Firebase Config (Legacy V8) ---
var firebaseConfig = {
    apiKey: "AIzaSyCzyyMmTPRBB4SMog88mlTcZFI9rMDxr4Y",
    authDomain: "atpro-system.firebaseapp.com",
    projectId: "atpro-system",
    storageBucket: "atpro-system.firebasestorage.app",
    messagingSenderId: "166556913424",
    appId: "1:166556913424:web:4eeb80e329f01dcf3c9f95"
};

// Initialize
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Legacy Init");
} catch (e) {
    console.error("Firebase Init Error: " + e.message);
}

var db = firebase.firestore();
var video = document.getElementById('video-feed');
var statusMsg = document.getElementById('status-msg');

// Clock
setInterval(function () {
    var now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString();
}, 1000);

// Initialize Camera (Old Way)
function startCamera() {
    statusMsg.innerText = "Requesting Camera...";

    var constraints = { video: true, audio: false };

    // Modern API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                video.srcObject = stream;
                statusMsg.innerText = "Loading Models...";
                loadModels();
            })
            .catch(function (err) {
                console.error(err);
                tryLegacyGetUserMedia();
            });
    } else {
        tryLegacyGetUserMedia();
    }
}

function tryLegacyGetUserMedia() {
    // Deprecated API fallback
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!getUserMedia) {
        statusMsg.innerText = "Camera NOT Supported on this Browser.";
        return;
    }

    getUserMedia.call(navigator, { video: true }, function (stream) {
        if (window.webkitURL) {
            video.src = window.webkitURL.createObjectURL(stream);
        } else {
            video.src = stream;
        }
        video.play();
        statusMsg.innerText = "Loading Models...";
        loadModels();
    }, function (err) {
        statusMsg.innerText = "Camera Denied: " + err.name;
    });
}

// Load Scripts Logic
function loadModels() {
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models')
    ]).then(function () {
        statusMsg.innerText = "System Ready (Legacy)";
        document.getElementById('loading-overlay').style.display = 'none';
        startTracking();
    }).catch(function (err) {
        statusMsg.innerText = "Model Error: " + err;
    });
}

function startTracking() {
    video.addEventListener('play', function () {
        var canvas = document.getElementById('overlay-canvas');
        var displaySize = { width: video.width || 640, height: video.height || 480 };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(function () {
            faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .then(function (detections) {
                    var resizedDetections = faceapi.resizeResults(detections, displaySize);
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                });
        }, 500); // Slower interval for old device
    });
}

// Start
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(startCamera, 1000);
});
