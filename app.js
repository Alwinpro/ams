/**
 * SecureFace Access - Redirect Logic for Legacy Devices
 */
(function () {
    var ua = navigator.userAgent;
    var androidVersion = parseFloat(ua.slice(ua.indexOf("Android") + 8));
    if ((ua.indexOf("Android") >= 0 && androidVersion < 5.0) || !window.Promise || !window.fetch) {
        // Redirect to Legacy Version
        if (window.location.pathname.indexOf('index-legacy.html') === -1) {
            window.location.href = 'index-legacy.html';
        }
    }
})();
/**
 * SecureFace Access - Premium Attendance System (PC Version)
* Powered by Firebase, FaceAPI.js, and HTML5-QRCode
*/
// --- Firebase Configuration ---
// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyCzyyMmTPRBB4SMog88mlTcZFI9rMDxr4Y",
    authDomain: "atpro-system.firebaseapp.com",
    projectId: "atpro-system",
    storageBucket: "atpro-system.firebasestorage.app",
    messagingSenderId: "166556913424",
    appId: "1:166556913424:web:4eeb80e329f01dcf3c9f95"
};
// Initialize Firebase
let auth, db;
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized");
    auth = firebase.auth();
    db = firebase.firestore();
    // Check Firestore Access Immediately
    const testDoc = db.collection('test_permissions').doc('check');
    testDoc.set({ timestamp: new Date() })
        .then(() => console.log("Firestore Write Access: OK"))
        .catch(err => {
            console.warn("Firestore Write Access: DENIED (Check Rules)", err);
        });
} catch (e) {
    console.error("Firebase Init Error (Check Config):", e);
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Initialization Error</h3>
                <p>Could not connect to Firebase.</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">${e.message}</p>
                <p style="margin-top: 1rem; font-size: 0.8rem;">Check your <code>firebaseConfig</code> in app.js</p>
            </div>
        `;
    }
}
// Safety Timeout for Loading
setTimeout(() => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay && overlay.style.display !== 'none' && !overlay.innerHTML.includes('Error')) {
        overlay.innerHTML += `
            <div style="margin-top: 20px; color: #facc15; text-align: center;">
                <p><i class="fas fa-clock"></i> Taking longer than expected...</p>
                <p style="font-size: 0.8rem;">If this persists, check the browser console (F12) for errors.</p>
                <p style="font-size: 0.8rem;">Ensure you are running this via a server (e.g., <code>node server.js</code>) and not just opening the file.</p>
            </div>
        `;
    }
}, 8000);
// --- Constants & State ---
const MODEL_URL = './models/';
const MATCH_THRESHOLD = 0.5;
let faceMatcher = null;
let isScanning = false;
let scanMode = 'face'; // 'face' or 'qr'
let attendanceType = 'IN'; // 'IN' or 'OUT'
let html5QrCode = null;
// --- DOM Elements ---
const videoFeed = document.getElementById('video-feed');
const overlayCanvas = document.getElementById('overlay-canvas');
const statusMsg = document.getElementById('attendance-status');
const loadingOverlay = document.getElementById('loading-overlay');
const authModal = document.getElementById('auth-modal');
// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Models First (Critical for Kiosk)
    await loadFaceModels();
    setupNavigation();
    setupAuthListeners();
    setupRegisterListeners();
    setupUsersListeners();
    setupLogsListeners();
    setupScanControls();
    // 3. Check Auth State - Controls UI Visibility
    auth.onAuthStateChanged(user => {
        updateUIForUser(user);
        loadingOverlay.style.display = 'none';
        // Auto-refresh matcher if logged in (might have access to more data)
        // Note: For public kiosk, 'users' collection must be readable
        loadFaceMatcher();
    });
    // 4. Start Clock
    setInterval(updateClock, 1000);
    // 5. Start Scanning Immediately
    startScanning();
    // 6. Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log("PWA: Service Worker Registered", reg.scope);
                    // Ensure the sw is updated immediately
                    reg.update();
                })
                .catch(err => console.error("PWA: SW Registration Error:", err));
        });
    }
    // 7. PWA Install Logic
    setupInstallPrompt();
});
function updateClock() {
    const now = new Date();
    document.getElementById('current-time').innerText = now.toLocaleTimeString();
    document.getElementById('current-date').innerText = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
// --- Navigation & UI State ---
function updateUIForUser(user) {
    const adminItems = document.querySelectorAll('.admin-only');
    const loginBtn = document.getElementById('login-btn-nav');
    const logoutBtn = document.getElementById('logout-btn');
    if (user) {
        // Admin Mode
        adminItems.forEach(el => el.style.display = 'block'); // Or list-item
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        authModal.style.display = 'none'; // Close modal on success
    } else {
        // Kiosk Mode
        adminItems.forEach(el => el.style.display = 'none');
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        // If current view is restricted, switch to scan
        if (!document.getElementById('dashboard-view').classList.contains('active')) {
            document.querySelector('[data-target="dashboard-view"]').click();
        }
    }
    // Check if we should show the install button (PWA)
    updateInstallVisibility();
}
function updateInstallVisibility() {
    const installBtn = document.getElementById('install-app-btn');
    if (deferredPrompt && auth.currentUser) {
        installBtn.style.display = 'block';
    } else {
        installBtn.style.display = 'none';
    }
}
function setupNavigation() {
    const links = document.querySelectorAll('.nav-links li[data-target]');
    links.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active class
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            // Add active
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            // Logic Switches
            if (targetId === 'dashboard-view') startScanning();
            else stopScanning();
            if (targetId === 'logs-view') loadLogs();
        });
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut();
    });
    // Login Modal Triggers
    document.getElementById('login-btn-nav').addEventListener('click', () => {
        authModal.style.display = 'flex';
    });
    document.getElementById('close-auth-modal').addEventListener('click', () => {
        authModal.style.display = 'none';
    });
    // Mobile Menu Button Removed
}
// --- PWA Install Logic ---
let deferredPrompt;
function setupInstallPrompt() {
    const installBtn = document.getElementById('install-app-btn');
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        console.log('PWA: Running in standalone mode');
        return;
    }
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: beforeinstallprompt fired');
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI only if user is logged in
        updateInstallVisibility();
    });
    installBtn.addEventListener('click', (e) => {
        if (!deferredPrompt) {
            console.warn('PWA: No install prompt available');
            return;
        }
        // hide our user interface that shows our A2HS button
        installBtn.style.display = 'none';
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('PWA: User accepted install');
            } else {
                console.log('PWA: User dismissed install');
            }
            deferredPrompt = null;
        });
    });
    window.addEventListener('appinstalled', (event) => {
        console.log('PWA: App installed successfully');
        installBtn.style.display = 'none';
        alert("SecureFace App Installed! You can now launch it from your home screen.");
    });
}
// --- Face API Logic ---
async function loadFaceModels() {
    try {
        statusMsg.innerText = "Loading Face Detector...";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        statusMsg.innerText = "Loading Landmarks...";
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        statusMsg.innerText = "Loading Recognition...";
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("Models Loaded");
        window.isModelsLoaded = true;
        statusMsg.innerText = "System Ready";
    } catch (e) {
        console.error("Model Load Error:", e);
        statusMsg.innerText = "Error: " + e.message;
        statusMsg.style.color = "red";
        alert("Error loading AI models: " + e.message);
    }
}
async function loadFaceMatcher() {
    try {
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) return;
        const labeledDescriptors = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.descriptor) {
                const floatArray = new Float32Array(data.descriptor);
                labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(doc.id, [floatArray]));
            }
        });
        if (labeledDescriptors.length > 0) {
            faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);
        }
    } catch (err) {
        console.warn("Could not load users for matching (Permissions?):", err);
        // Depending on rules, public might fail reading users.
        // If so, scanning works but won't identify names.
    }
}
// --- Scanning Logic (Face/QR) ---
async function startScanning() {
    if (isScanning || document.getElementById('dashboard-view').style.display === 'none') return;
    isScanning = true;
    if (scanMode === 'face') {
        document.getElementById('qr-reader').style.display = 'none';
        videoFeed.style.display = 'block';
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            videoFeed.srcObject = stream;
            videoFeed.onloadedmetadata = () => {
                const displaySize = { width: videoFeed.videoWidth, height: videoFeed.videoHeight };
                faceapi.matchDimensions(overlayCanvas, displaySize);
                const processFrame = async () => {
                    if (!isScanning) return;
                    try {
                        const detections = await faceapi.detectAllFaces(videoFeed, new faceapi.TinyFaceDetectorOptions())
                            .withFaceLandmarks(true)
                            .withFaceDescriptors();
                        const resizedDetections = faceapi.resizeResults(detections, displaySize);
                        const ctx = overlayCanvas.getContext('2d');
                        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                        if (faceMatcher) {
                            for (const detection of resizedDetections) {
                                const match = faceMatcher.findBestMatch(detection.descriptor);
                                const box = detection.detection.box;
                                const drawBox = new faceapi.draw.DrawBox(box, { label: match.toString() });
                                drawBox.draw(overlayCanvas);
                                if (match.label !== 'unknown') {
                                    await handleVerify(match.label);
                                }
                            }
                        }
                    } catch (err) {
                        // console.log(err);
                    }
                    setTimeout(processFrame, 100); // 10 FPS
                };
                processFrame();
            };
        } catch (err) {
            console.error("Camera Error:", err);
            statusMsg.innerText = "Camera Access Denied";
        }
    } else {
        // QR Mode
        videoFeed.style.display = 'none';
        overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        document.getElementById('qr-reader').style.display = 'block';
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }
        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 30, // Faster scanning
                qrbox: { width: 280, height: 280 }, // Slightly larger box
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                videoConstraints: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    facingMode: "environment"
                }
            },
            async (decodedText, decodedResult) => {
                console.log(`QR Code: ${decodedText}`);
                try {
                    // Pause to prevent multiple triggers
                    if (html5QrCode.isScanning) html5QrCode.pause();
                    statusMsg.innerText = "Processing Details...";
                    await handleVerify(decodedText);
                } catch (e) {
                    console.error("QR Process Error:", e);
                    statusMsg.innerText = "Error: " + e.message;
                } finally {
                    // Resume after short delay to allow UI to show result
                    setTimeout(() => {
                        try {
                            // Use 'resume' if implementing pause, but some versions need restart
                            // However, pause/resume is cleanest if supported.
                            if (html5QrCode && html5QrCode.isScanning) html5QrCode.resume();
                        } catch (err) { console.log("Resume err", err); }
                        statusMsg.innerText = "Ready to Scan";
                    }, 3000);
                }
            },
            (errorMessage) => { }
        ).catch(err => {
            console.log(err);
        });
    }
}
function stopScanning() {
    isScanning = false;
    if (videoFeed.srcObject) {
        videoFeed.srcObject.getTracks().forEach(t => t.stop());
        videoFeed.srcObject = null;
    }
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.log(err));
    }
}
function setupScanControls() {
    const tabs = document.querySelectorAll('.scan-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            stopScanning();
            scanMode = tab.getAttribute('data-type');
            startScanning();
        });
    });
}
// --- Attendance Handling ---
let lastVerifyTime = {}; // Local debounce
const COOLDOWN = 60000; // 1 min debounce for SAME action
const MIN_CHECKOUT_TIME = 5 * 60 * 1000; // 5 Minutes
function playSuccessBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio Error:", e);
    }
}
async function handleVerify(scannedValue) {
    const now = Date.now();
    // basic debounce to prevent double scans in seconds
    if (lastVerifyTime[scannedValue] && (now - lastVerifyTime[scannedValue] < COOLDOWN)) {
        return;
    }
    lastVerifyTime[scannedValue] = now;
    // Fetch User Details
    let userName = "Unknown";
    let empId = "N/A";
    let userPhoto = null;
    let userId = scannedValue; // Default assume it is doc ID
    try {
        // 1. Try treating scannedValue as Document ID
        let userDoc = await db.collection('users').doc(scannedValue).get();
        // 2. If not found, try treating it as an Employee ID
        if (!userDoc.exists) {
            const querySnap = await db.collection('users').where('empId', '==', scannedValue).limit(1).get();
            if (!querySnap.empty) {
                userDoc = querySnap.docs[0];
                userId = userDoc.id; // Correct the userId to the real Doc ID
            }
        }
        if (userDoc.exists) {
            const d = userDoc.data();
            userName = d.name;
            empId = d.empId;
            userPhoto = d.photo || null;
            // Verify if the scanned value matches the user's EmpID (Security check for QR)
            if (scanMode === 'qr' && d.empId !== scannedValue && userDoc.id !== scannedValue) {
                // This implies we found a user, but the QR content didn't match perfectly? 
                // Actually if we found them via query, it matches.
                // If found via DocID, it matches.
                // This check is redundant if logic above is correct.
            }
        } else {
            console.warn("User not found for scan:", scannedValue);
            statusMsg.innerText = "User Not Found";
            statusMsg.style.color = "red";
            showScanResult(null, "Unknown", scannedValue, "User Not Found", 'error');
            return;
        }
    } catch (e) {
        console.log("Cannot read user details:", e);
        return;
    }
    // Auto-Detect Logic (IN vs OUT)
    let type = 'IN';
    let message = '';
    let valid = true;
    let useLocalFallback = false;
    try {
        // Query last log for this user
        const logsSnap = await db.collection('attendance_logs')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();
        if (!logsSnap.empty) {
            const lastLog = logsSnap.docs[0].data();
            const lastTime = lastLog.timestamp.toDate().getTime();
            if (lastLog.type === 'IN') {
                const diff = now - lastTime;
                if (diff < MIN_CHECKOUT_TIME) {
                    const remaining = Math.ceil((MIN_CHECKOUT_TIME - diff) / 60000);
                    message = `Wait ${remaining} min to Check Out.`;
                    showScanResult(userPhoto, userName, empId, message, 'warning');
                    valid = false;
                } else {
                    type = 'OUT';
                }
            } else {
                type = 'IN';
            }
        } else {
            type = 'IN';
        }
    } catch (readErr) {
        console.warn("Could not read logs (Kiosk Mode?):", readErr);
        // Fallback to LocalStorage for Kiosk toggle
        useLocalFallback = true;
        const lastLocal = JSON.parse(localStorage.getItem('last_log_' + userId) || 'null');
        if (lastLocal) {
            const lastTime = lastLocal.timestamp;
            if (lastLocal.type === 'IN') {
                const diff = now - lastTime;
                if (diff < MIN_CHECKOUT_TIME) {
                    const remaining = Math.ceil((MIN_CHECKOUT_TIME - diff) / 60000);
                    message = `Wait ${remaining} min to Check Out.`;
                    showScanResult(userPhoto, userName, empId, message, 'warning');
                    valid = false;
                } else {
                    type = 'OUT';
                }
            } else {
                type = 'IN';
            }
        } else {
            type = 'IN'; // Default first time
        }
    }
    try {
        if (valid) {
            const logData = {
                userId: userId,
                name: userName,
                empId: empId,
                type: type,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('attendance_logs').add(logData);
            // Update Local Cache for Kiosk Mode
            localStorage.setItem('last_log_' + userId, JSON.stringify({
                type: type,
                timestamp: now
            }));
            showScanResult(userPhoto, userName, empId, `Check ${type} Successful`, type);
            statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> Success: ${userName} (${type})`;
            statusMsg.style.color = type === 'IN' ? "#10b981" : "#ef4444"; // Green for IN, Red for OUT
            playSuccessBeep();
        }
    } catch (e) {
        console.error("Log Error:", e);
        const userStatus = firebase.auth().currentUser ? "Logged In" : "Not Logged In";
        showScanResult(null, "Error", null, `Err: ${e.message} (${userStatus})`, 'error');
    }
    setTimeout(() => {
        statusMsg.innerText = "System Ready";
        statusMsg.style.color = "#e2e8f0";
    }, 4000);
}
// --- Result Handling ---
function showScanResult(photo, name, empId, message, type) {
    // 1. Pause Scanning immediately prevents double-scan
    const wasScanning = isScanning;
    isScanning = false;
    const card = document.getElementById('scan-result-card');
    const resPhoto = document.getElementById('result-photo');
    const resName = document.getElementById('result-name');
    const resId = document.getElementById('result-emp-id');
    const resMsg = document.getElementById('result-message');
    const resBadge = document.getElementById('result-type-badge');
    // 2. Set Content
    resPhoto.src = photo || 'https://via.placeholder.com/150';
    resName.innerText = name || 'Unknown';
    resId.innerText = empId || 'N/A';
    resMsg.innerText = message;
    // Reset classes
    resMsg.className = 'result-status-msg';
    resBadge.className = 'result-type-badge';
    if (type === 'IN') {
        resMsg.classList.add('status-in');
        resBadge.classList.add('badge-in-bg');
        resBadge.innerText = 'IN';
    } else if (type === 'OUT') {
        resMsg.classList.add('status-out');
        resBadge.classList.add('badge-out-bg');
        resBadge.innerText = 'OUT';
    } else if (type === 'warning') {
        resMsg.classList.add('status-warning');
        resBadge.classList.add('badge-warning-bg');
        resBadge.innerText = 'WAIT';
    } else {
        resMsg.classList.add('status-error');
        resBadge.style.display = 'none';
        resName.innerText = "Error / Unknown";
    }
    // 3. Show Overlay (Use CSS Class for smooth transition)
    // Ensure display is block first if it was hidden by default style (it is)
    card.style.display = 'flex';
    // Small delay to allow display:flex to apply before adding opacity class
    requestAnimationFrame(() => {
        card.classList.add('active');
    });
    // 4. Wait & Resume
    setTimeout(() => {
        card.classList.remove('active');
        setTimeout(() => {
            card.style.display = 'none';
            resBadge.style.display = 'block'; // Reset badge visibility
            // Resume only if we were scanning before (and user didn't switch tabs)
            if (wasScanning && document.getElementById('dashboard-view').classList.contains('active')) {
                isScanning = true;
                // Re-trigger the recursive loop if it stopped? 
                // Actually startScanning() logic uses isScanning flag inside the loop.
                // But if the loop exited, we might need to restart it.
                // In my logic, processFrame checks 'isScanning'. If false, it just stops.
                // So we need to call startScanning() again or ensure the loop didn't die.
                // My previous processFrame logic was: if (!isScanning) return;
                // So the loop DIED. We must restart it.
                startScanning();
                statusMsg.innerText = "Ready to Scan";
                statusMsg.style.color = "#e2e8f0";
            }
        }, 300); // Match CSS transition time
    }, 2000); // 2 Seconds display time (Faster)
}
// --- Registration ---
function setupRegisterListeners() {
    const regVideo = document.getElementById('register-video');
    const btnStart = document.getElementById('btn-start-reg-cam');
    const btnCapture = document.getElementById('btn-capture-face');
    const btnUpload = document.getElementById('btn-upload-photo');
    const fileInput = document.getElementById('file-input-reg');
    const regVideoContainer = document.getElementById('reg-video-container');
    // Crop Modal Elements
    const cropModal = document.getElementById('crop-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const btnCancelCrop = document.getElementById('btn-cancel-crop');
    const btnConfirmCrop = document.getElementById('btn-confirm-crop');
    let captureStream;
    let cropper;
    // 1. Camera Handling with Real-time Detection
    let detectInterval;
    btnStart.addEventListener('click', async () => {
        if (!window.isModelsLoaded) {
            alert("Please wait for AI models to load...");
            return;
        }
        regVideoContainer.style.display = 'block';
        window.tempPhoto = null; // Clear previous
        try {
            captureStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } }); // Request better resolution
            regVideo.srcObject = captureStream;
            // Wait for video to play
            regVideo.onloadedmetadata = () => {
                btnCapture.innerText = "Align Face & Capture";
                btnCapture.disabled = false;
                startRegistrationLoop();
            };
        } catch (err) {
            console.error("Reg Cam Error:", err);
            alert("Camera Access Denied");
        }
    });
    function startRegistrationLoop() {
        if (detectInterval) clearInterval(detectInterval);
        // Simple check every 200ms to see if face is present and give feedback
        detectInterval = setInterval(async () => {
            if (regVideo.paused || regVideo.ended) return;
            const detection = await faceapi.detectSingleFace(regVideo, new faceapi.TinyFaceDetectorOptions());
            if (detection) {
                btnCapture.style.background = "var(--success)";
                btnCapture.innerText = "Face Detected - Click to Capture";
            } else {
                btnCapture.style.background = "var(--primary)";
                btnCapture.innerText = "Align Face...";
            }
        }, 200);
    }
    btnCapture.addEventListener('click', async () => {
        // Stop the loop
        if (detectInterval) clearInterval(detectInterval);
        // Perform high-quality detection one last time
        const detection = await faceapi.detectSingleFace(regVideo, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true)
            .withFaceDescriptor();
        if (detection) {
            window.tempDescriptor = Array.from(detection.descriptor);
            // Draw full quality frame
            const canvas = document.createElement('canvas');
            canvas.width = regVideo.videoWidth;
            canvas.height = regVideo.videoHeight;
            canvas.getContext('2d').drawImage(regVideo, 0, 0);
            const photoData = canvas.toDataURL('image/jpeg', 0.9);
            window.tempPhoto = photoData;
            document.getElementById('preview-img').src = photoData;
            document.getElementById('final-image-preview').style.display = 'block';
            // alert("Face Captured Successfully!");
            document.getElementById('btn-complete-reg').disabled = false;
            // Stop stream
            if (captureStream) captureStream.getTracks().forEach(t => t.stop());
            regVideoContainer.style.display = 'none';
        } else {
            alert("No face detected clearly. Please ensure good lighting and face the camera.");
            startRegistrationLoop(); // Restart loop
        }
    });
    // 2. Upload & Crop Handling
    btnUpload.addEventListener('click', () => {
        if (!window.isModelsLoaded) {
            alert("Please wait for AI models to load...");
            return;
        }
        fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1024 * 1024) { // 1MB Limit
            alert("File size exceeds 1MB limit. Please choose a smaller photo.");
            fileInput.value = ''; // Reset
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            imageToCrop.src = event.target.result;
            cropModal.style.display = 'flex';
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.8,
            });
        };
        reader.readAsDataURL(file);
    });
    btnCancelCrop.addEventListener('click', () => {
        cropModal.style.display = 'none';
        fileInput.value = '';
        if (cropper) cropper.destroy();
    });
    btnConfirmCrop.addEventListener('click', () => {
        if (!cropper) return;
        // Get cropped canvas
        const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 300
        });
        // Show as preview
        const dataUrl = canvas.toDataURL();
        window.tempPhoto = dataUrl;
        document.getElementById('preview-img').src = dataUrl;
        document.getElementById('final-image-preview').style.display = 'block';
        // Detect Face from this cropped image
        const img = document.createElement('img');
        // Disable confirm button while processing
        btnConfirmCrop.innerText = "Processing...";
        btnConfirmCrop.disabled = true;
        img.onload = async () => {
            try {
                const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks(true)
                    .withFaceDescriptor();
                if (detection) {
                    window.tempDescriptor = Array.from(detection.descriptor);
                    document.getElementById('btn-complete-reg').disabled = false;
                    document.getElementById('btn-complete-reg').innerText = "Complete Registration";
                    alert("Photo processed and face detected!");
                } else {
                    alert("No face detected. Please use a clear photo with a visible face.");
                    window.tempDescriptor = null;
                    document.getElementById('btn-complete-reg').disabled = true;
                }
            } catch (err) {
                console.error(err);
                alert("Error processing face: " + err.message);
            } finally {
                btnConfirmCrop.innerText = "Crop & Use";
                btnConfirmCrop.disabled = false;
                cropModal.style.display = 'none';
                if (cropper) cropper.destroy();
            }
        };
        // Set src AFTER defining onload to avoid race condition
        img.src = dataUrl;
    });
    // 3. Form Submit
    // 3. Form Submit
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const empId = document.getElementById('reg-empid').value;
        const descriptor = window.tempDescriptor;
        if (!descriptor) {
            alert("Please capture or upload a valid face photo first.");
            return;
        }
        const btnSubmit = document.getElementById('btn-complete-reg');
        const originalBtnText = btnSubmit.innerText;
        btnSubmit.innerText = "Registering...";
        btnSubmit.disabled = true;
        try {
            const docRef = await db.collection('users').add({
                name,
                empId,
                descriptor,
                photo: window.tempPhoto || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Update UI for Success
            const successContainer = document.getElementById('qr-display-area');
            successContainer.innerHTML = `
                <div style="display: flex; gap: 2rem; justify-content: center; align-items: center; background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 16px;">
                    <div style="text-align: center;">
                        <img src="${window.tempPhoto}" style="width: 150px; height: 150px; border-radius: 50%; border: 4px solid var(--success); object-fit: cover; margin-bottom: 0.5rem;">
                        <p style="color: var(--success); font-weight: bold;">Registered</p>
                    </div>
                    <div style="text-align: center;">
                        <div id="new-qrcode"></div>
                        <p style="margin-top: 0.5rem; color: var(--text-muted);">${empId}</p>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 1rem; color: var(--secondary);">Next registration in 3 seconds...</p>
            `;
            new QRCode(document.getElementById("new-qrcode"), {
                text: empId,
                width: 128,
                height: 128
            });
            successContainer.style.display = 'block';
            // alert("User Registered! QR Code Generated.");
            loadFaceMatcher(); // Reload AI
            // Auto-Reset for Next Person
            setTimeout(() => {
                // Reset Form
                document.getElementById('register-form').reset();
                window.tempDescriptor = null;
                window.tempPhoto = null;
                // Keep Camera Active? Or Reset UI?
                // Reset UI State
                document.getElementById('final-image-preview').style.display = 'none';
                document.getElementById('preview-img').src = "";
                document.getElementById('btn-complete-reg').disabled = true;
                successContainer.style.display = 'none';
                // If camera was used, maybe restart it immediately?
                // For now, let user click "Use Camera" again to be safe.
                // Or better: clear the success message.
            }, 3000);
        } catch (err) {
            console.error(err);
            const userStatus = firebase.auth().currentUser ? "Logged In" : "Not Logged In";
            alert(`Error saving user: ${err.message}\nAuth Status: ${userStatus}`);
        } finally {
            btnSubmit.innerText = originalBtnText;
            btnSubmit.disabled = false;
        }
    });
}
// --- Auth Login & Signup ---
function setupAuthListeners() {
    const errorMsg = document.getElementById('auth-message');
    // Check local storage for admin existence
    if (localStorage.getItem('adminCreated') === 'true') {
        document.getElementById('toggle-auth').style.display = 'none';
    }
    // Toggle Forms
    document.getElementById('toggle-auth').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
        errorMsg.innerText = '';
    });
    document.getElementById('toggle-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        errorMsg.innerText = '';
    });
    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, pass);
        } catch (err) {
            errorMsg.innerText = err.message;
        }
    });
    // Signup
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-password').value;
        try {
            await auth.createUserWithEmailAndPassword(email, pass);
            // Mark admin as created on this device
            localStorage.setItem('adminCreated', 'true');
            // Hide the option for future
            document.getElementById('toggle-auth').style.display = 'none';
        } catch (err) {
            errorMsg.innerText = err.message;
        }
    });
}
// --- Logs & PDF ---
async function loadLogs() {
    const tbody = document.querySelector('#logs-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    try {
        const snap = await db.collection('attendance_logs')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        window.currentLogs = [];
        let rows = "";
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No logs found.</td></tr>';
            return;
        }
        snap.forEach(doc => {
            const d = doc.data();
            // Handle missing timestamp gracefully
            const dateObj = d.timestamp ? d.timestamp.toDate() : new Date();
            rows += `
                <tr>
                    <td>${d.empId || 'N/A'}</td>
                    <td>${d.name}</td>
                    <td><span class="badge ${d.type === 'IN' ? 'badge-in' : 'badge-out'}">${d.type}</span></td>
                    <td>${dateObj.toLocaleTimeString()}</td>
                    <td>${dateObj.toLocaleDateString()}</td>
                     <td>Verified</td>
                     <td>
                        <button class="btn-delete-log" onclick="deleteLog('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            window.currentLogs.push([d.empId, d.name, d.type, dateObj.toLocaleTimeString(), dateObj.toLocaleDateString()]);
        });
        tbody.innerHTML = rows;
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="6" style="color: red; text-align: center;">Error loading logs. Check permissions.</td></tr>';
    }
}
function setupLogsListeners() {
    document.getElementById('btn-refresh-logs').addEventListener('click', loadLogs);
    // Clear All Logs Listener
    const btnClear = document.getElementById('btn-clear-logs');
    if (btnClear) {
        btnClear.addEventListener('click', clearAllLogs);
    }
    document.getElementById('btn-download-pdf').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Attendance Report", 14, 20);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.autoTable({
            head: [['Emp ID', 'Name', 'Status', 'Time', 'Date']],
            body: window.currentLogs || [],
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [74, 144, 226] }
        });
        doc.save("attendance_report.pdf");
    });
}
// --- User Management ---
function setupUsersListeners() {
    document.getElementById('btn-refresh-users').addEventListener('click', loadUsers);
    // Auto-load when tab is clicked
    const userTab = document.querySelector('[data-target="users-view"]');
    if (userTab) userTab.addEventListener('click', loadUsers);
    // Search Filter
    document.getElementById('user-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.user-card-wrapper'); // Wrapper for search
        cards.forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const id = card.getAttribute('data-empid').toLowerCase();
            if (name.includes(term) || id.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}
async function loadUsers() {
    const container = document.getElementById('users-list-container');
    container.innerHTML = '<p style="color:white; text-align:center;">Loading users...</p>';
    try {
        const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
        container.innerHTML = '';
        if (snap.empty) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No users registered yet.</p>';
            return;
        }
        snap.forEach(doc => {
            const data = doc.data();
            const photoUrl = data.photo || 'https://via.placeholder.com/150';
            const div = document.createElement('div');
            div.className = 'user-card-wrapper'; // Use wrapper for grid layout consistency if needed, or just append direct
            div.setAttribute('data-name', data.name || '');
            div.setAttribute('data-empid', data.empId || '');
            div.innerHTML = `
                <div class="user-card">
                    <img src="${photoUrl}" alt="${data.name}">
                    <div class="info">
                        <h4>${data.name}</h4>
                        <p>${data.empId}</p>
                    </div>
                    <button class="btn-delete-user" onclick="deleteUser('${doc.id}', '${data.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        console.error("Error loading users:", e);
        container.innerHTML = '<p style="color:red; text-align:center;">Error loading users. Check permissions.</p>';
    }
}
window.deleteUser = async function (docId, userName) {
    if (!confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) return;
    try {
        await db.collection('users').doc(docId).delete();
        alert("User deleted successfully.");
        loadUsers(); // Refresh
        loadFaceMatcher(); // Refresh AI matcher
    } catch (e) {
        console.error("Delete Error:", e);
        alert("Error deleting user: " + e.message);
    }
};
// --- Log Deletion Logic ---
window.deleteLog = async function (docId) {
    if (!confirm("Are you sure you want to delete this log entry?")) return;
    try {
        await db.collection('attendance_logs').doc(docId).delete();
        loadLogs();
    } catch (err) {
        console.error("Delete Log Error:", err);
        alert("Failed to delete log: " + err.message);
    }
};
async function clearAllLogs() {
    if (!confirm("WARNING: This will delete ALL attendance logs PERMANENTLY. Are you sure?")) return;
    if (!confirm("This action cannot be undone. Confirm DELETE ALL?")) return;
    const btn = document.getElementById('btn-clear-logs');
    if (btn) {
        var origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        btn.disabled = true;
    }
    try {
        const snap = await db.collection('attendance_logs').get();
        if (snap.empty) {
            alert("No logs to delete.");
            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
            return;
        }
        const batch = db.batch();
        snap.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        alert("All logs cleared successfully.");
        loadLogs();
    } catch (err) {
        console.error("Clear All Error:", err);
        alert("Failed to clear logs: " + err.message);
    } finally {
        if (btn) {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    }
}
