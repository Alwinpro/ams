:root {
    --primary: #4a90e2;
    --success: #10b981;
    --glass-border: rgba(255, 255, 255, 0.1);
}
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
}
body {
    background: #1e293b;
    /* Fallback for gradient */
    background: -webkit-radial-gradient(top left, circle, #1e293b, #0f172a);
    background: radial-gradient(circle at top left, #1e293b, #0f172a);
    color: #e2e8f0;
    min-height: 100vh;
    overflow-x: hidden;
}
/* Glassmorphism Utilities */
.glass-panel,
.glass-card,
.glass-nav {
    background: rgba(255, 255, 255, 0.05);
    /* backdrop-filter not supported on Android 4.4 */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
/* Loader */
#loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0f172a;
    z-index: 9999;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    flex-direction: column;
    -webkit-align-items: center;
    align-items: center;
    -webkit-justify-content: center;
    justify-content: center;
}
.glass-loader {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #4a90e2;
    -webkit-animation: spin 1s ease-in-out infinite;
    animation: spin 1s ease-in-out infinite;
}
@-webkit-keyframes spin {
    to {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
/* Dashboard - Full Screen Layout */
#dashboard-container {
    height: 100vh;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    flex-direction: column;
    overflow: hidden;
}
nav.glass-nav {
    -webkit-flex-shrink: 0;
    flex-shrink: 0;
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    -webkit-align-items: center;
    align-items: center;
    padding: 0.8rem 1.5rem;
    margin: 0.5rem 1rem;
    border-radius: 16px;
}
.nav-brand {
    font-size: 1.2rem;
    font-weight: 700;
    color: #4a90e2;
}
.nav-links ul {
    list-style: none;
    display: -webkit-flex;
    display: flex;
    gap: 1.5rem;
    /* Gap might not work on old flex, use margins if needed */
    -webkit-align-items: center;
    align-items: center;
}
/* Fallback for gap */
.nav-links ul li {
    margin-left: 1.5rem;
}
.nav-links ul li:first-child {
    margin-left: 0;
}
.nav-links li {
    font-size: 0.9rem;
    cursor: pointer;
    opacity: 0.7;
    transition: 0.3s;
}
/* Main Content */
main {
    -webkit-flex: 1;
    flex: 1;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    flex-direction: column;
    padding: 0 1rem 1rem 1rem;
    overflow: hidden;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
}
.view {
    display: none;
    height: 100%;
    -webkit-flex-direction: column;
    flex-direction: column;
}
.view.active {
    display: -webkit-flex;
    display: flex;
    -webkit-animation: fadeIn 0.5s;
    animation: fadeIn 0.5s;
    overflow-y: auto;
    /* Enable vertical scrolling */
    -webkit-overflow-scrolling: touch;
    /* Smooth scroll on iOS */
}
@-webkit-keyframes fadeIn {
    from {
        opacity: 0;
        -webkit-transform: translateY(10px);
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        -webkit-transform: translateY(0);
        transform: translateY(0);
    }
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
/* Attendance View */
#dashboard-view {
    /* gap: 0.8rem; */
}
#dashboard-view>* {
    margin-bottom: 0.8rem;
}
#dashboard-view>*:last-child {
    margin-bottom: 0;
}
.status-bar {
    -webkit-flex-shrink: 0;
    flex-shrink: 0;
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    padding: 0.8rem;
    margin-bottom: 0;
    text-align: center;
}
.scan-container {
    -webkit-flex: 1;
    flex: 1;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    flex-direction: column;
    padding: 0.8rem;
    min-height: 0;
}
.scan-tabs {
    -webkit-flex-shrink: 0;
    flex-shrink: 0;
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: center;
    justify-content: center;
    margin-bottom: 0.8rem;
    /* gap: 1rem; */
}
.scan-tabs button {
    margin: 0 0.5rem;
}
.camera-wrapper {
    -webkit-flex: 1;
    flex: 1;
    position: relative;
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
    max-height: 100%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    background: #000;
    border: 2px solid rgba(255, 255, 255, 0.1);
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: center;
    justify-content: center;
    -webkit-align-items: center;
    align-items: center;
}
.camera-wrapper video,
.camera-wrapper canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
}
#register-video {
    width: 300px;
    height: 300px;
    object-fit: cover;
    border-radius: 16px;
    background: #000;
    display: block;
    margin: 0 auto;
    border: 3px solid #4a90e2;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
#reg-video-container {
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    margin-top: 1rem;
    text-align: center;
    position: relative;
    display: none;
}
#qr-reader {
    width: 100% !important;
    height: 100% !important;
    border: none !important;
    position: absolute;
    top: 0;
    left: 0;
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: center;
    justify-content: center;
    -webkit-align-items: center;
    align-items: center;
    overflow: hidden;
}
#qr-reader video {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
}
canvas {
    z-index: 10;
}
.scan-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    pointer-events: none;
    z-index: 20;
}
.scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: #50e3c2;
    box-shadow: 0 0 10px #50e3c2;
    -webkit-animation: scan 2s linear infinite;
    animation: scan 2s linear infinite;
}
@-webkit-keyframes scan {
    0% {
        top: 0;
        opacity: 0;
    }
    20% {
        opacity: 1;
    }
    80% {
        opacity: 1;
    }
    100% {
        top: 100%;
        opacity: 0;
    }
}
@keyframes scan {
    0% {
        top: 0;
        opacity: 0;
    }
    20% {
        opacity: 1;
    }
    80% {
        opacity: 1;
    }
    100% {
        top: 100%;
        opacity: 0;
    }
}
.logs-panel {
    padding: 1.5rem;
}
.logs-header {
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    margin-bottom: 1rem;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}
th,
td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
th {
    color: #94a3b8;
    font-size: 0.9rem;
    letter-spacing: 1px;
}
tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
}
@media (max-width: 768px) {
    nav.glass-nav {
        -webkit-flex-direction: column;
        flex-direction: column;
        /* gap: 1rem; */
    }
    nav.glass-nav>* {
        margin-bottom: 1rem;
    }
    nav.glass-nav>*:last-child {
        margin-bottom: 0;
    }
    .nav-links ul {
        flex-wrap: wrap;
        -webkit-justify-content: center;
        justify-content: center;
    }
    .status-bar {
        -webkit-flex-direction: column;
        flex-direction: column;
    }
    .status-bar>* {
        margin-bottom: 1rem;
    }
}
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: center;
    justify-content: center;
    -webkit-align-items: center;
    align-items: center;
}
.close-modal-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
}
.close-modal-btn:hover {
    color: #ef4444;
}
/* Badge Styles */
.badge {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}
.badge-in {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
}
.badge-out {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
}
a {
    color: #4a90e2;
    text-decoration: none;
    transition: 0.3s;
}
a:hover {
    color: #50e3c2;
    text-decoration: underline;
}
.error-msg {
    color: #ef4444;
    margin-top: 1rem;
    font-size: 0.9rem;
    min-height: 1.2em;
}
.btn-secondary {
    background: transparent;
    border: 1px solid #4a90e2;
    color: #4a90e2;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
}
.btn-secondary:hover {
    background: rgba(74, 144, 226, 0.1);
}
.btn-success {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.8rem;
    width: 100%;
    margin-top: 1rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
}
.btn-success:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
#qrcode {
    background: white;
    padding: 10px;
    display: inline-block;
    border-radius: 8px;
    margin-top: 10px;
}
.scan-tab {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    cursor: pointer;
    transition: 0.3s;
}
.scan-tab.active {
    background: #4a90e2;
    color: white;
    border-color: #4a90e2;
}
.input-group {
    margin: 1rem 0;
    position: relative;
}
.input-group i {
    position: absolute;
    left: 1rem;
    top: 50%;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    color: #94a3b8;
}
input {
    width: 100%;
    padding: 0.8rem 1rem 0.8rem 2.5rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    outline: none;
    transition: 0.3s;
}
input:focus {
    border-color: #4a90e2;
    box-shadow: 0 0 10px rgba(74, 144, 226, 0.2);
}
button {
    cursor: pointer;
    font-weight: 600;
    transition: 0.3s;
}
.btn-primary {
    background: #4a90e2;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    width: 100%;
}
.btn-primary:hover {
    filter: brightness(1.1);
}
#login-btn-nav:hover {
    background: #4a90e2;
    color: white;
    border-color: #4a90e2;
    opacity: 1;
    box-shadow: 0 0 15px rgba(74, 144, 226, 0.5);
}
.result-card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: center;
    justify-content: center;
    -webkit-align-items: center;
    align-items: center;
    background: rgba(15, 23, 42, 0.85);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}
.result-card-overlay.active {
    opacity: 1;
    visibility: visible;
}
.result-content {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 2.5rem;
    border-radius: 24px;
    text-align: center;
    width: 80%;
    max-width: 400px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    -webkit-transform: scale(0.9);
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.result-card-overlay.active .result-content {
    -webkit-transform: scale(1);
    transform: scale(1);
}
.result-photo-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 1.5rem;
}
.result-photo-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    border: 4px solid #10b981;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}
.result-type-badge {
    position: absolute;
    bottom: 5px;
    right: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 800;
    color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
.result-info h4 {
    font-size: 1.8rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.5rem;
}
.result-info p {
    color: #94a3b8;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    letter-spacing: 1px;
}
.result-status-msg {
    font-size: 1.2rem;
    font-weight: 600;
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: inline-block;
    width: 100%;
}
.status-in {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
}
.status-out {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
}
.status-warning {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
}
.status-error {
    color: #ef4444;
}
.badge-in-bg {
    background: #10b981;
}
.badge-out-bg {
    background: #ef4444;
}
.badge-warning-bg {
    background: #f59e0b;
}
#install-app-btn {
    background: #50e3c2;
    /* Fallback */
    padding: 0.5rem 1.2rem;
    border-radius: 20px;
    color: #0f172a;
    font-weight: 700;
    box-shadow: 0 4px 15px rgba(80, 227, 194, 0.4);
    transition: 0.3s;
    display: none;
}
#install-app-btn:hover {
    -webkit-transform: translateY(-2px);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(80, 227, 194, 0.6);
    filter: brightness(1.1);
}
/* --- NEW WORLD DESIGN ALIGNMENT & SCROLLBAR --- */
/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
}
::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    transition: background 0.3s;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 144, 226, 0.5);
}
/* Enhanced Register View */
.register-card {
    max-width: 800px;
    margin: 0 auto;
    padding: 2.5rem;
    background: rgba(25, 35, 50, 0.6);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
}
.register-card h3 {
    text-align: center;
    font-size: 1.8rem;
    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 2rem;
}
.form-grid {
    display: -webkit-flex;
    display: flex;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
    gap: 1.5rem;
    /* justify-content: space-between; */
}
.form-grid>.input-group {
    -webkit-flex: 1 1 45%;
    flex: 1 1 45%;
    min-width: 250px;
}
.form-grid .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 500;
}
.form-grid .input-group input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    padding: 1rem 1rem 1rem 1rem;
    /* Removed left icon padding for generic inputs if no icon */
    border-radius: 12px;
    transition: all 0.3s ease;
}
.form-grid .input-group input:focus {
    background: rgba(15, 23, 42, 0.9);
    border-color: #4a90e2;
    box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.1);
}
/* Capture Area Styling */
.face-capture-area {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    text-align: center;
}
.capture-options {
    -webkit-justify-content: center;
    justify-content: center;
}
/* --- USERS GRID REVMAP --- */
.users-panel {
    height: 100%;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    flex-direction: column;
    overflow: hidden;
    /* For scrolling inside */
}
#users-list-container {
    -webkit-flex: 1;
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
    gap: 1.5rem;
    -webkit-align-content: flex-start;
    align-content: flex-start;
}
/* Modern User Card */
.user-card {
    -webkit-flex: 1 1 300px;
    flex: 1 1 300px;
    max-width: 400px;
    /* Limit expansion */
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.03) 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    display: -webkit-flex;
    display: flex;
    -webkit-align-items: center;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 0;
    /* Handled by gap/flex-wrap */
    cursor: default;
    position: relative;
    overflow: hidden;
}
.user-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-color: rgba(74, 144, 226, 0.3);
}
.user-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: #4a90e2;
    opacity: 0;
    transition: 0.3s;
}
.user-card:hover::before {
    opacity: 1;
}
.user-card img {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.1);
    object-fit: cover;
    margin-right: 1.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
.u-info h4 {
    font-size: 1.1rem;
    color: #fff;
    margin-bottom: 0.3rem;
    font-weight: 600;
}
.u-info p {
    color: #94a3b8;
    font-size: 0.85rem;
    font-family: 'Courier New', monospace;
    /* ID style */
}
/* Delete Button on Card */
.btn-delete-user {
    margin-left: auto;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: none;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: -webkit-flex;
    display: flex;
    -webkit-align-items: center;
    align-items: center;
    -webkit-justify-content: center;
    justify-content: center;
    transition: 0.3s;
    cursor: pointer;
}
.btn-delete-user:hover {
    background: #ef4444;
    color: white;
    transform: rotate(90deg);
}
/* --- LOGS TABLE REDESIGN --- */
.logs-panel {
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    flex-direction: column;
    height: 100%;
    padding: 0;
    /* Reset padding, inner containers usually hold it */
    background: rgba(15, 23, 42, 0.6);
}
.logs-header {
    background: rgba(255, 255, 255, 0.03);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: -webkit-flex;
    display: flex;
    -webkit-align-items: center;
    align-items: center;
    gap: 1rem;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
}
.logs-header h3 {
    margin-right: auto;
    font-size: 1.4rem;
    color: #e2e8f0;
}
.table-responsive {
    -webkit-flex: 1;
    flex: 1;
    overflow-y: auto;
    /* Scrollable Table Body */
    padding: 0;
}
table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 0;
}
thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #0f172a;
    /* Solid background for sticky header */
}
th {
    padding: 1.2rem;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #64748b;
    border-bottom: 2px solid rgba(255, 255, 255, 0.05);
    letter-spacing: 0.05em;
}
td {
    padding: 1.2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    font-size: 0.95rem;
    vertical-align: middle;
    transition: background 0.2s;
}
tbody tr {
    transition: background 0.2s;
}
tbody tr:hover {
    background: rgba(255, 255, 255, 0.04);
}
/* User Avatar in Table */
.td-user {
    display: -webkit-flex;
    display: flex;
    -webkit-align-items: center;
    align-items: center;
    gap: 1rem;
}
.td-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.1);
}
/* Status Badges in Table */
.status-badge {
    padding: 0.35rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
    min-width: 80px;
    text-align: center;
}
.status-badge.in {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.2);
}
.status-badge.out {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.2);
}
/* Search Bar Styling */
#user-search {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    padding: 0.6rem 1.2rem;
    width: 250px;
    color: white;
}
#user-search:focus {
    width: 300px;
    border-color: #4a90e2;
}
/* Action Buttons */
.logs-actions button {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    display: -webkit-inline-flex;
    display: inline-flex;
    -webkit-align-items: center;
    align-items: center;
    gap: 0.5rem;
}
.user-card>*:last-child {
    margin-right: 0;
}
.user-card:hover {
    background: rgba(255, 255, 255, 0.1);
    -webkit-transform: translateY(-5px);
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
.user-card img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #4a90e2;
}
.user-card .info {
    -webkit-flex: 1;
    flex: 1;
}
.user-card h4 {
    margin: 0;
    color: #fff;
    font-size: 1.1rem;
}
.user-card p {
    margin: 0.2rem 0 0;
    color: #94a3b8;
    font-size: 0.9rem;
}
.btn-delete-user {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: -webkit-flex;
    display: flex;
    -webkit-align-items: center;
    align-items: center;
    -webkit-justify-content: center;
    justify-content: center;
    cursor: pointer;
    transition: 0.3s;
}
.btn-delete-user:hover {
    background: #ef4444;
    color: white;
}
.search-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 0.5rem 1rem;
    color: #fff;
    outline: none;
    transition: 0.3s;
}
.search-input:focus {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.15);
}
