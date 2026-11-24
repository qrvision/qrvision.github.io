/**
 * QR Vision Shared QR Scanner Controller
 * Parameterized via window.QR_I18N for localized scanner pages.
 */
document.addEventListener('DOMContentLoaded', () => {
  const i18n = Object.assign({
    loadingLib: 'Scanner library is still loading. Please try again in a moment.',
    noCamera: 'No camera detected on this device. Try uploading or pasting an image.',
    cameraFailed: 'Camera access failed: ',
    noQrFound: 'No QR code found in this image. Please try a clearer image.',
    copyLabel: 'Copy'
  }, window.QR_I18N || {});

  let html5Qr = null;
  let isScanning = false;
  let torchOn = false;
  let lastResult = '';

  const startBtn = document.getElementById('start-button');
  const stopBtn = document.getElementById('stop-button');
  const torchBtn = document.getElementById('torch-button');
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

  function ensureScannerReady() {
    if (typeof Html5Qrcode === 'undefined') {
      showStatus(i18n.loadingLib, true);
      return false;
    }
    if (!html5Qr) {
      html5Qr = new Html5Qrcode('reader');
    }
    return true;
  }

  async function startScanning() {
    if (isScanning || !ensureScannerReady()) return;
    hideStatus();
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || !cameras.length) {
        showStatus(i18n.noCamera, true);
        return;
      }
      readerContainer.classList.add('active');
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {}
      );
      isScanning = true;
      torchOn = false;
      try {
        const caps = html5Qr.getRunningTrackCapabilities();
        if (torchBtn) torchBtn.hidden = !(caps && caps.torch);
      } catch {
        if (torchBtn) torchBtn.hidden = true;
      }
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
    readerContainer.classList.remove('active');
  }

  function handleDecoded(decodedText) {
    lastResult = decodedText;
    if (window.QRVision) {
      window.QRVision.saveToHistory(decodedText);
      refreshHistory();
      window.QRVision.openResultDialog(resultDialog, resultText, actionSlot, decodedText);
    }
  }

  function onScanSuccess(decodedText) {
    if (decodedText && decodedText !== lastResult) {
      handleDecoded(decodedText);
      stopScanning();
    }
  }

  async function scanImageFile(file) {
    if (!file || !ensureScannerReady()) return;
    hideStatus();
    if (isScanning) await stopScanning();
    try {
      const decodedText = await html5Qr.scanFile(file, false);
      handleDecoded(decodedText);
    } catch {
      showStatus(i18n.noQrFound, true);
    }
  }

  startBtn.addEventListener('click', startScanning);
  if (stopBtn) stopBtn.addEventListener('click', stopScanning);

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
    if (e.target.files && e.target.files[0]) {
      scanImageFile(e.target.files[0]);
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
      const file = e.dataTransfer?.files?.[0];
      if (file) scanImageFile(file);
    });
  }

  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) scanImageFile(file);
        break;
      }
    }
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

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isScanning) {
      stopScanning();
    }
  });

  refreshHistory();
});
