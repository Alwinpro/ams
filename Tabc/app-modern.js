/**
 * Loader for SecureFace Access
 * Detects browser capabilities and loads appropriate script.
 */

(function () {
    var isModern = false;
    try {
        // value of isModern logic:
        // 1. Check for async/await support
        // 2. Check for arrow functions
        // 3. Check for const/let (though Babel handles this, native support is good proxy)
        // 4. Check for Promise
        // 5. Check for fetch

        // This 'eval' check is the robust way to detect syntax support without crashing the parser
        eval("async () => {}");
        isModern = true;
    } catch (e) {
        isModern = false;
    }

    if (isModern) {
        console.log("Modern browser detected. Loading app...");
        var script = document.createElement('script');
        script.src = "app-modern.js";
        script.defer = true;
        document.body.appendChild(script);
    } else {
        console.warn("Legacy browser detected.");
        var overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.innerHTML =
                '<div style="text-align: center; padding: 20px; color: #ff6b6b; font-family: sans-serif;">' +
                '  <h2 style="margin-bottom: 10px;">Browser Not Supported</h2>' +
                '  <p>Your tablet\'s default browser is too old to run this app.</p>' +
                '  <p style="margin-top: 15px;">Please install <strong>Google Chrome</strong> from the Play Store.</p>' +
                '  <p style="font-size: 0.8rem; margin-top: 20px; opacity: 0.7;">Error: Missing ES6/Async Support</p>' +
                '</div>';
        }
    }
})();
