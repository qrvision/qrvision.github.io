/**
 * QR Vision Shared Utilities
 * - Smart payload parsing (URL, Wi-Fi, Email, Phone, SMS, vCard, Geo)
 * - Local scan history (localStorage, max 30 entries)
 * - Native <dialog> result modal presentation
 * - Service Worker registration
 */
(function (window) {
  'use strict';

  const HISTORY_KEY = 'qrvision_history';
  const MAX_HISTORY = 30;

  function detectPayload(rawText) {
    const text = (rawText || '').trim();
    if (/^https?:\/\//i.test(text)) {
      return { type: 'URL', label: 'Open Link', href: text, isExternal: true };
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

  function openResultDialog(dialogEl, textEl, actionSlot, text, copyBtnLabel) {
    if (!dialogEl || !textEl) return;
    const parsed = detectPayload(text);
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

  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }

  window.QRVision = {
    detectPayload,
    getHistory,
    saveToHistory,
    clearHistory,
    renderHistory,
    openResultDialog,
    copyText,
    registerSW
  };

  registerSW();
})(window);
