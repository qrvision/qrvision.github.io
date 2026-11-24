/**
 * QR Vision Shared QR Scanner Controller
 * - On-demand lazy loading of html5-qrcode & pdf.js (keeps initial page TBT = 0ms)
 * - Camera selector, zoom slider, flashlight toggle, continuous scan + beep
 * - Multi-image batch scanning + PDF page scanning + Drag & Drop + Ctrl+V paste
 */
document.addEventListener('DOMContentLoaded', () => {
  const HTML5_QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
  const HTML5_QR_SRI = 'sha512-r6rDA7W6ZeQhvl8S7yRVQUKVHdexq+GAlNkNNqVC7YyIV+NwqCTJe2hDWCiffTyRNOeGEzRRJ9ifvRm/HCzGYg==';
  const PDF_JS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDF_JS_SRI = 'sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ==';
  const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const i18n = Object.assign({
    loadingLib: 'Loading scanner engine...',
    noCamera: 'No camera detected on this device. Try uploading or pasting an image.',
    cameraFailed: 'Camera access failed: ',
    noQrFound: 'No QR code found in this file. Please try a clearer image.',
    batchDone: 'Batch scan complete: ',
    copyLabel: 'Copy'
  }, window.QR_I18N || {});

  let html5Qr = null;
  let isScanning = false;
  let torchOn = false;
  let lastResult = '';
  let availableCameras = [];

  const startBtn = document.getElementById('start-button');
  const stopBtn = document.getElementById('stop-button');
  const torchBtn = document.getElementById('torch-button');
  const cameraSelect = document.getElementById('camera-select');
  const zoomWrap = document.getElementById('zoom-wrap');
  const zoomSlider = document.getElementById('zoom-slider');
  const continuousToggle = document.getElementById('continuous-toggle');
  const beepToggle = document.getElementById('beep-toggle');
  const uploadBtn = document.getElementById('upload-button');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const readerContainer = document.getElementById('reader-container');
  const statusBanner = document.getElementById('status-banner');
  const resultDialog = document.getElementById('result-modal');
  const resultText = document.getElementById('result-text');
  const actionSlot = document.getElementById('smart-action-slot');
  const copyBtn = document.getElementById('copy-result-btn');
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  if (!startBtn || !fileInput) return;

  function showStatus(msg, isError) {
    if (!statusBanner) return;
    statusBanner.textContent = msg;
    statusBanner.classList.toggle('error', Boolean(isError));
    statusBanner.classList.add('active');
  }

  function hideStatus() {
    if (!statusBanner) return;
    statusBanner.classList.remove('active', 'error');
  }

  function refreshHistory() {
    if (!window.QRVision) return;
    window.QRVision.renderHistory(historyList, historySection, (text) => {
      lastResult = text;
      window.QRVision.openResultDialog(resultDialog, resultText, actionSlot, text);
    });
  }

  async function ensureScannerReady() {
    if (typeof Html5Qrcode === 'undefined') {
      showStatus(i18n.loadingLib, false);
      await window.QRVision.loadExternalScript(HTML5_QR_SRC, HTML5_QR_SRI);
      hideStatus();
    }
    if (!html5Qr) {
      html5Qr = new Html5Qrcode('reader');
    }
    return true;
  }

  function configureTrackControls() {
    try {
      const caps = html5Qr.getRunningTrackCapabilities();
      if (torchBtn) torchBtn.hidden = !(caps && caps.torch);
      if (zoomWrap && zoomSlider && caps && caps.zoom) {
        zoomSlider.min = caps.zoom.min || 1;
        zoomSlider.max = caps.zoom.max || 4;
        zoomSlider.step = caps.zoom.step || 0.1;
        zoomSlider.value = caps.zoom.min || 1;
        zoomWrap.hidden = false;
      } else if (zoomWrap) {
        zoomWrap.hidden = true;
      }
    } catch {
      if (torchBtn) torchBtn.hidden = true;
      if (zoomWrap) zoomWrap.hidden = true;
    }
  }

  async function startStreamWithTarget(cameraTarget) {
    readerContainer.classList.add('active');
    await html5Qr.start(
      cameraTarget,
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
      onScanSuccess,
      () => {}
    );
    isScanning = true;
    torchOn = false;
    configureTrackControls();
  }

  async function startScanning() {
    if (isScanning) return;
    hideStatus();
    try {
      await ensureScannerReady();
      availableCameras = await Html5Qrcode.getCameras();
      if (!availableCameras || !availableCameras.length) {
        showStatus(i18n.noCamera, true);
        return;
      }
      if (cameraSelect && availableCameras.length > 1) {
        cameraSelect.replaceChildren();
        availableCameras.forEach((cam, idx) => {
          const opt = document.createElement('option');
          opt.value = cam.id;
          opt.textContent = cam.label || `Camera ${idx + 1}`;
          cameraSelect.appendChild(opt);
        });
        cameraSelect.hidden = false;
      }
      await startStreamWithTarget({ facingMode: 'environment' });
    } catch (err) {
      readerContainer.classList.remove('active');
      showStatus(i18n.cameraFailed + (err.message || err), true);
    }
  }

  async function stopScanning() {
    if (!isScanning || !html5Qr) return;
    try {
      await html5Qr.stop();
    } catch {
      // Ignore stop errors
    }
    isScanning = false;
    torchOn = false;
    if (torchBtn) torchBtn.hidden = true;
    if (zoomWrap) zoomWrap.hidden = true;
    readerContainer.classList.remove('active');
  }

  function handleDecoded(decodedText, showModal = true) {
    lastResult = decodedText;
    if (beepToggle?.checked) window.QRVision.playBeep();
    if (navigator.vibrate) navigator.vibrate(50);
    window.QRVision.saveToHistory(decodedText);
    refreshHistory();
    if (showModal) {
      window.QRVision.openResultDialog(resultDialog, resultText, actionSlot, decodedText);
    }
  }

  function onScanSuccess(decodedText) {
    if (decodedText && decodedText !== lastResult) {
      const continuous = Boolean(continuousToggle?.checked);
      handleDecoded(decodedText, !continuous);
      if (continuous) {
        showStatus('Scanned: ' + decodedText, false);
        setTimeout(() => { lastResult = ''; }, 1500);
      } else {
        stopScanning();
      }
    }
  }

  async function scanPdfFile(file) {
    if (typeof window.pdfjsLib === 'undefined') {
      showStatus('Loading PDF decoder...', false);
      await window.QRVision.loadExternalScript(PDF_JS_SRC, PDF_JS_SRI);
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
    }
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const found = [];
    const maxPages = Math.min(pdf.numPages, 5);
    for (let p = 1; p <= maxPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        try {
          const pdfImage = new File([blob], `page-${p}.png`, { type: 'image/png' });
          const text = await html5Qr.scanFile(pdfImage, false);
          if (text) found.push(text);
        } catch {
          // No QR on this page
        }
      }
    }
    return found;
  }

  async function scanFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    hideStatus();
    if (isScanning) await stopScanning();
    try {
      await ensureScannerReady();
      const results = [];
      for (const file of files.slice(0, 20)) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const pdfCodes = await scanPdfFile(file);
          pdfCodes.forEach((c) => results.push(c));
        } else {
          try {
            const text = await html5Qr.scanFile(file, false);
            if (text) results.push(text);
          } catch {
            // Skip unreadable image
          }
        }
      }
      if (!results.length) {
        showStatus(i18n.noQrFound, true);
        return;
      }
      results.forEach((txt, idx) => handleDecoded(txt, idx === results.length - 1 && results.length === 1));
      if (results.length > 1) {
        showStatus(`${i18n.batchDone}${results.length} QR codes saved to Recent Scans.`, false);
      }
    } catch (err) {
      showStatus(i18n.noQrFound, true);
    }
  }

  startBtn.addEventListener('click', startScanning);
  if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
  if (stopBtn) stopBtn.addEventListener('click', stopScanning);

  if (cameraSelect) {
    cameraSelect.addEventListener('change', async () => {
      if (!isScanning || !cameraSelect.value) return;
      await stopScanning();
      await startStreamWithTarget(cameraSelect.value);
    });
  }

  if (zoomSlider) {
    zoomSlider.addEventListener('input', async () => {
      if (!html5Qr || !isScanning) return;
      try {
        await html5Qr.applyVideoConstraints({ advanced: [{ zoom: Number(zoomSlider.value) }] });
      } catch {
        // Ignore unsupported zoom updates
      }
    });
  }

  if (torchBtn) {
    torchBtn.addEventListener('click', async () => {
      if (!html5Qr || !isScanning) return;
      torchOn = !torchOn;
      try {
        await html5Qr.applyVideoConstraints({ advanced: [{ torch: torchOn }] });
      } catch {
        torchBtn.hidden = true;
      }
    });
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      scanFiles(e.target.files);
      fileInput.value = '';
    }
  });

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer?.files?.length) scanFiles(e.dataTransfer.files);
    });
  }

  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) scanFiles(files);
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      window.QRVision.copyText(lastResult || resultText.textContent, copyBtn, i18n.copyLabel);
    });
  }

  if (resultDialog) {
    resultDialog.addEventListener('close', () => {
      lastResult = '';
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      window.QRVision.clearHistory();
      refreshHistory();
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      window.QRVision.exportHistoryCsv();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isScanning) {
      stopScanning();
    }
  });

  refreshHistory();
});
