<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="A fast and simple web-based QR and barcode scanner that works on all devices. Scan your codes with ease, no installation required.">
    <title>QR Scanner</title>
    
    <!-- Preconnect to CDN -->
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    
    <!-- Minified and Critical CSS -->
    <style>
        :root {
            --modal-bg: rgba(0, 0, 0, 0.9);
            --button-success: #4CAF50;
            --button-danger: #f44336;
            --scanner-border: #4CAF50;
        }
        
        /* Critical CSS */
        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            width: 100vw;
            background: #f5f5f5;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
      
      	.main-container {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: start;
            min-height: 100vh;
            width: 100%;
            padding: 50px;
            box-sizing: border-box;
        }
        
        #reader-container {
            position: relative;
            width: 100%;
            max-width: 500px;
            height: 400px;
            margin: 20px 20px;
            margin-top: 70px;
            display: none;
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        #reader {
            width: 100%;
            height: 100%;
          	
        }
        
        #reader video {
            object-fit: cover;
            border-radius: 12px;
        }
        
        .scan-region-highlight {
            border: 2px solid var(--scanner-border) !important;
            border-radius: 8px !important;
        }
        
        .control-button {
            position: fixed;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 100;
            width: 40px;
            height: 40px;
        }
      	
      #page-content{
      	display:flex; 
        flex-direction: column;
        align-items: center;
        justify-content: start;
        padding-top: 100px;
      }
        
        #start-button {
            position: relative;
            margin: 20px;
            padding: 16px 32px;
            background: var(--button-success);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        #start-button:hover {
            transform: translateY(-2px);
        }

        #start-button:active {
            transform: translateY(0);
        }
        
        #info-button {
            top: 20px;
            left: 20px;
        }
      
      .info-content{
      	color:white;
        padding:5px;
      }
        
        #upload-button {
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
        }
        
        .modal {
            display: none;
            position: fixed;
            background: var(--modal-bg);
            z-index: 1000;
        }
        
        #result-modal {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            max-width: 80%;
            width: 400px;
          	overflow-wrap: break-word;
          	
        }
        
        .button-container {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            color: white;
        }
        
        .copy-btn {
            background: var(--button-success);
        }
        
        .close-btn {
            background: var(--button-danger);
        }
        
        #file-input {
            display: none;
        }
        
        .scan-instructions {
            text-align: center;
            color: #666;
            margin: 20px;
            font-size: 1.1rem;
        }
        
        /* Hide unnecessary HTML5 QR elements */
        #reader__dashboard_section_csr,
        #reader__status_span,
        #reader__camera_selection {
            display: none !important;
        }
        
        #reader div:first-child {
            border: none !important;
            margin: 0 !important;
        }

        #stop-button {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 24px;
            background: var(--button-danger);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            z-index: 101;
            display: none;
        }
    </style>
  
  
  
  	<meta name="format-detection" content="telephone=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#ffffff">
<meta name="viewport" content="width=device-width, initial-scale=1.0">


  
  
</head>
<body>
    
      	<div id="page-content">
          <h1 class="scan-instructions">QR Code Scanner</h1>
          <p class="scan-instructions">Click the button below to start scanning</p>

          <button id="start-button">Start Scanning</button>
        
        </div>
        
        <div id="reader-container">
            <div id="reader"></div>
            <button id="stop-button">Stop Scanning</button>
        </div>
    

    <div id="info-button" class="control-button" aria-label="Information">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12" y2="8"/>
        </svg>
    </div>

    <div id="info-modal" class="modal">
        <div class="info-content">
            <button class="info-close" aria-label="Close">&times;</button>
            <div class="info-section">
                <h3>About Us</h3>
                <p>We provide simple and efficient QR code scanning solutions.</p>
            </div>
            <div class="info-section">
                <h3>Contact</h3>
                <p>Email: hashtagfor@outlook.com</p>
            </div>
        </div>
    </div>

    <div id="result-modal" class="modal">
        <h3>Scanned Result</h3>
        <div class="result-content" id="result-text"></div>
        <div class="button-container">
            <button class="btn copy-btn">Copy</button>
            <button class="btn close-btn">Close</button>
        </div>
    </div>

    <label id="upload-button" class="control-button">
        <input type="file" id="file-input" accept="image/*">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    </label>

    <!-- Defer non-critical JavaScript -->
    <script async src="https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js"></script>
    <script>
        // Initialize variables
        let html5QrcodeScanner;
        let lastResult = '';
        const SCAN_FPS = 5;
        const SCAN_BOX_SIZE = 250;
        let isScanning = false;

        // DOM Elements
        const elements = {
            infoButton: document.getElementById('info-button'),
            infoModal: document.getElementById('info-modal'),
            resultModal: document.getElementById('result-modal'),
            resultText: document.getElementById('result-text'),
            fileInput: document.getElementById('file-input'),
            startButton: document.getElementById('start-button'),
            stopButton: document.getElementById('stop-button'),
            readerContainer: document.getElementById('reader-container'),
          	pageContent: document.getElementById('page-content')
        };

        // Event Listeners
        document.addEventListener('DOMContentLoaded', () => {
            setupEventListeners();
        });

        function setupEventListeners() {
            elements.infoButton.addEventListener('click', toggleInfo);
            elements.fileInput.addEventListener('change', handleFileUpload);
            elements.startButton.addEventListener('click', startScanning);
            elements.stopButton.addEventListener('click', stopScanning);
            document.querySelector('.copy-btn').addEventListener('click', copyResult);
            document.querySelector('.close-btn').addEventListener('click', closeModal);
          	document.querySelector('.info-close').addEventListener('click', toggleInfo);
        }

        // Scanner initialization
        async function initializeScanner() {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices?.length) {
                    html5QrcodeScanner = new Html5Qrcode("reader");
                    return true;
                }
                return false;
            } catch (err) {
                console.error("Camera initialization failed:", err);
                return false;
            }
        }

        async function startScanning() {
            if (isScanning) return;
            
            if (!html5QrcodeScanner) {
                const initialized = await initializeScanner();
                if (!initialized) {
                    alert('Failed to initialize camera');
                    return;
                }
            }

            elements.readerContainer.style.display = 'block';
          	elements.pageContent.style.display= 'none';
            elements.stopButton.style.display = 'block';

            const config = {
                fps: SCAN_FPS,
                qrbox: { width: SCAN_BOX_SIZE, height: SCAN_BOX_SIZE },
                aspectRatio: 1.0
            };

            html5QrcodeScanner.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanError
            ).then(() => {
                isScanning = true;
            });
        }

        async function stopScanning() {
            if (!isScanning) return;
            
            try {
                await html5QrcodeScanner.stop();
                elements.readerContainer.style.display = 'none';
                elements.pageContent.style.display= 'flex';
                elements.stopButton.style.display = 'none';
                isScanning = false;
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }

        // Event Handlers
        function onScanSuccess(decodedText) {
            if (decodedText !== lastResult) {
                lastResult = decodedText;
                showResult(decodedText);
                stopScanning();
            }
        }

        function onScanError(error) {
            // Suppress frequent error logging
            if (error !== 'QR code not found') {
                console.warn("Scan error:", error);
            }
        }

        function toggleInfo() {
            elements.infoModal.style.display = 
                elements.infoModal.style.display === 'block' ? 'none' : 'block';
        }

        async function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            try {
                if (!html5QrcodeScanner) {
                    await initializeScanner();
                }
                if (isScanning) {
                    await stopScanning();
                }
                const decodedText = await html5QrcodeScanner.scanFile(file, true);
                showResult(decodedText);
            } catch (err) {
                alert('Scanning failed: ' + err);
            }
        }

        function showResult(text) {
            elements.resultText.textContent = text;
          	
            elements.resultModal.style.display = 'block';
        }

        function closeModal() {
            elements.resultModal.style.display = 'none';
            lastResult = '';
        }

        async function copyResult() {
            try {
                await navigator.clipboard.writeText(elements.resultText.textContent);
                alert('Copied to clipboard!');
            } catch (err) {
                console.error('Copy failed:', err);
            }
        }
    </script>
</body>
</html>
