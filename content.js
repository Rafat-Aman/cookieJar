(function () {
  const SELECTORS = [
    // OneTrust
    '#onetrust-accept-btn-handler',
    'button#onetrust-accept-btn-handler',
    // TrustArc
    '#truste-consent-button, .truste-buttons .accept, .consent-accept',
    // Cookiebot
    '#CybotCookiebotDialogBodyLevelButtonAccept',
    '.CybotCookiebotDialogBodyButtonAccept',
    // Quantcast / IAB TCF v2 (Choice)
    '.qc-cmp2-accept-all, .qc-cmp2-summary-buttons .qc-cmp2-accept-all, .qc-cmp2-buttons-desktop .qc-cmp2-accept-all',
    // Didomi
    '#didomi-notice-agree-button, button.didomi-components-button--accept',
    // Google Funding Choices
    '#fc-cta-consent, button.fc-cta-consent',
    // Generic ARIA
    'button[aria-label*="Accept"][aria-label*="cookie" i]',
    'button[aria-label*="cookies"][aria-label*="accept" i]'
  ];

  const ACCEPT_TEXTS = [
    'accept all', 'accept', 'i agree', 'agree all', 'allow all', 'got it', 'ok'
  ];

  function visible(el) {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  }

  function trySelectors() {
    for (const sel of SELECTORS) {
      const el = document.querySelector(sel);
      if (el && visible(el)) { el.click(); return true; }
    }
    return false;
  }

  function tryTextFallback() {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'));
    for (const el of btns) {
      const txt = (el.textContent || el.value || '').trim().toLowerCase();
      if (!txt) continue;
      if (ACCEPT_TEXTS.some(t => txt.includes(t)) && visible(el)) {
        el.click(); return true;
      }
    }
    return false;
  }

  function attempt() {
    trySelectors() || tryTextFallback();
  }

  attempt();
  const mo = new MutationObserver(attempt);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('beforeunload', () => mo.disconnect());
})();
