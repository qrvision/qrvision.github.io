/**
 * QR Vision Shared Core Utilities
 * - Deferred GA4 loading (zero impact on FCP/LCP/TBT for Lighthouse 100)
 * - Dynamic SRI-verified library loader (load heavy scanner libs only on demand)
 * - Anti-phishing ("quishing") URL safety inspection
 * - Smart payload parsing (URL, Wi-Fi, Email, Phone, SMS, vCard, Geo)
 * - Local scan history + CSV export
 * - Service Worker registration
 */
(function (window, document) {
  'use strict';

  const HISTORY_KEY = 'qrvision_history';
  const MAX_HISTORY = 30;
  const SHORTENERS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rb.gy', 'cutt.ly', 'shorturl.at'
  ]);
  const loadedScripts = new Map();

  function loadExternalScript(src, integrity) {
    if (loadedScripts.has(src)) return loadedScripts.get(src);
    const promise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
      }
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(script);
    });
    loadedScripts.set(src, promise);
    return promise;
  }

  function initAnalyticsIdle() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    let booted = false;
    const boot = () => {
      if (booted) return;
      booted = true;
      window.gtag('js', new Date());
      window.gtag('config', 'G-NMWK7FXYVR');
      loadExternalScript('https://www.googletagmanager.com/gtag/js?id=G-NMWK7FXYVR').catch(() => {});
    };
    ['pointerdown', 'keydown', 'scroll'].forEach((evt) => {
      window.addEventListener(evt, boot, { once: true, passive: true });
    });
    window.addEventListener('load', () => setTimeout(boot, 4000), { once: true });
  }

  function inspectUrlSafety(rawUrl) {
    try {
      const u = new URL(rawUrl);
      const host = u.hostname.toLowerCase();
      const warnings = [];
      if (u.protocol === 'http:') {
        warnings.push('Unencrypted HTTP link');
      }
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) {
        warnings.push('Raw IP address destination');
      }
      if (host.includes('xn--')) {
        warnings.push('Internationalized (Punycode) domain — verify spelling carefully');
      }
      if (SHORTENERS.has(host)) {
        warnings.push('Shortened URL hides final destination');
      }
      return {
        host: u.hostname,
        isWarning: warnings.length > 0,
        message: warnings.length
          ? 'Caution (' + u.hostname + '): ' + warnings.join(' • ')
          : 'Destination host: ' + u.hostname + ' (HTTPS)'
      };
    } catch {
      return null;
    }
  }

  function detectPayload(rawText) {
    const text = (rawText || '').trim();
    if (/^https?:\/\//i.test(text)) {
      return {
        type: 'URL',
        label: 'Open Link',
        href: text,
        isExternal: true,
        safety: inspectUrlSafety(text)
      };
    }
    if (/^WIFI:/i.test(text)) {
      const ssidMatch = text.match(/S:([^;]*)/i);
      const passMatch = text.match(/P:([^;]*)/i);
      const typeMatch = text.match(/T:([^;]*)/i);
      return {
        type: 'Wi-Fi',
        ssid: ssidMatch ? ssidMatch[1] : '',
        password: passMatch ? passMatch[1] : '',
        encryption: typeMatch ? typeMatch[1] : 'WPA',
        copyValue: passMatch ? passMatch[1] : text,
        label: passMatch && passMatch[1] ? 'Copy Password' : null
      };
    }
    if (/^mailto:/i.test(text)) {
      return { type: 'Email', label: 'Send Email', href: text };
    }
    if (/^tel:/i.test(text)) {
      return { type: 'Phone', label: 'Call Number', href: text };
    }
    if (/^(sms|smsto):/i.test(text)) {
      return { type: 'SMS', label: 'Send SMS', href: text };
    }
    if (/^BEGIN:VCARD/i.test(text)) {
      return { type: 'vCard', label: 'Download .vcf', vcard: text };
    }
    if (/^geo:/i.test(text)) {
      const coords = text.replace(/^geo:/i, '').split('?')[0];
      return {
        type: 'Location',
        label: 'Open in Maps',
        href: 'https://maps.google.com/?q=' + encodeURIComponent(coords),
        isExternal: true
      };
    }
    return { type: 'Text' };
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveToHistory(text) {
    if (!text) return;
    const parsed = detectPayload(text);
    const list = getHistory().filter((item) => item.text !== text);
    list.unshift({
      text: text,
      type: parsed.type,
      timestamp: new Date().toISOString()
    });
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
    } catch {
      // Ignore storage quota errors
    }
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore
    }
  }

  function exportHistoryCsv() {
    const items = getHistory();
    if (!items.length) return;
    const esc = (v) => '"' + String(v || '').replace(/"/g, '""') + '"';
    const rows = ['Type,Content,Timestamp', ...items.map((i) => `${esc(i.type)},${esc(i.text)},${esc(i.timestamp)}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrvision-scan-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderHistory(listEl, sectionEl, onSelect) {
    if (!listEl || !sectionEl) return;
    const items = getHistory();
    if (!items.length) {
      sectionEl.hidden = true;
      listEl.replaceChildren();
      return;
    }
    sectionEl.hidden = false;
    listEl.replaceChildren();
    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const badge = document.createElement('span');
      badge.className = 'history-badge';
      badge.textContent = item.type || 'Text';

      const span = document.createElement('span');
      span.className = 'history-text';
      span.textContent = item.text;
      span.title = item.text;

      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.className = 'btn btn-secondary btn-sm';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', () => onSelect(item.text));

      li.append(badge, span, viewBtn);
      listEl.appendChild(li);
    });
  }

  function openResultDialog(dialogEl, textEl, actionSlot, text) {
    if (!dialogEl || !textEl) return;
    const parsed = detectPayload(text);
    const safetyEl = dialogEl.querySelector('.safety-banner');
    if (safetyEl) {
      if (parsed.safety) {
        safetyEl.hidden = false;
        safetyEl.textContent = parsed.safety.message;
        safetyEl.classList.toggle('warn', parsed.safety.isWarning);
      } else {
        safetyEl.hidden = true;
      }
    }

    if (parsed.type === 'Wi-Fi' && parsed.ssid) {
      textEl.textContent =
        'Network (SSID): ' + parsed.ssid +
        '\nSecurity: ' + parsed.encryption +
        '\nPassword: ' + (parsed.password || '(none)') +
        '\n\nRaw: ' + text;
    } else {
      textEl.textContent = text;
    }

    if (actionSlot) {
      actionSlot.replaceChildren();
      if (parsed.href) {
        const a = document.createElement('a');
        a.href = parsed.href;
        a.className = 'btn btn-accent';
        a.textContent = parsed.label;
        if (parsed.isExternal) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
        actionSlot.appendChild(a);
      } else if (parsed.vcard) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-accent';
        btn.textContent = parsed.label;
        btn.addEventListener('click', () => {
          const blob = new Blob([parsed.vcard], { type: 'text/vcard' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'contact.vcf';
          link.click();
          URL.revokeObjectURL(url);
        });
        actionSlot.appendChild(btn);
      } else if (parsed.copyValue && parsed.label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-accent';
        btn.textContent = parsed.label;
        btn.addEventListener('click', async () => {
          await copyText(parsed.copyValue, btn, parsed.label);
        });
        actionSlot.appendChild(btn);
      }
    }

    if (typeof dialogEl.showModal === 'function') {
      if (!dialogEl.open) dialogEl.showModal();
    } else {
      dialogEl.setAttribute('open', '');
    }
  }

  async function copyText(text, btn, defaultLabel) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const prev = defaultLabel || btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = prev;
        }, 1600);
      }
    } catch {
      // Fallback ignored
    }
  }

  function playBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Ignore audio blocks
    }
  }

  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }

  window.QRVision = {
    loadExternalScript,
    inspectUrlSafety,
    detectPayload,
    getHistory,
    saveToHistory,
    clearHistory,
    exportHistoryCsv,
    renderHistory,
    openResultDialog,
    copyText,
    playBeep
  };

  initAnalyticsIdle();
  registerSW();
})(window, document);
