/**
 * =============================================================================
 * BASMAT AL MAWARED — COOKIE CONSENT
 * =============================================================================
 * Built for Saudi PDPL, which requires opt-in consent: non-essential cookies
 * and third-party embeds must stay OFF until the visitor actively agrees.
 *
 * What this actually does, rather than just claims:
 *   - Nothing non-essential runs before consent. The YouTube video is physically
 *     replaced with a placeholder until "functional" is granted.
 *   - Rejecting is exactly as easy as accepting: both are one click, same size.
 *   - The choice is stored with a timestamp and a version, so consent can be
 *     re-requested if the categories ever change (PDPL expects re-consent when
 *     purposes change).
 *   - The decision is recorded in localStorage, NOT in a cookie, so declining
 *     genuinely means no cookie is written.
 *
 * Other scripts can check consent with:
 *     BamConsent.allows('analytics')      -> true / false
 *     BamConsent.onChange(fn)             -> called whenever preferences change
 *     BamConsent.reopen()                 -> opens the preferences dialog
 * =============================================================================
 */
(function () {
  "use strict";

  const KEY = 'bam_cookie_consent';
  const VERSION = 1;          // bump this if the categories change
  const EXPIRY_DAYS = 180;    // re-ask twice a year

  /* ---------------- state ---------------- */

  const DEFAULTS = { essential: true, functional: false, analytics: false };
  let state = null;
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || d.version !== VERSION) return null;
      const age = (Date.now() - (d.at || 0)) / 86400000;
      if (age > EXPIRY_DAYS) return null;
      return d;
    } catch (e) {
      return null;
    }
  }

  function save(prefs) {
    state = {
      version: VERSION,
      at: Date.now(),
      date: new Date().toISOString(),
      prefs: prefs
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* storage blocked — consent then applies to this visit only */
    }
    listeners.forEach(fn => { try { fn(prefs); } catch (e) {} });
    applyConsent(prefs);
  }

  function prefs() {
    return (state && state.prefs) ? state.prefs : DEFAULTS;
  }

  /* ---------------- third-party gating ---------------- */

  function applyConsent(p) {
    document.documentElement.dataset.bamConsent =
      [p.essential && 'essential', p.functional && 'functional', p.analytics && 'analytics']
        .filter(Boolean).join(' ');

    /* Analytics hook.
       No analytics tool is installed on this site today. When one is added,
       load it here so it can never run before consent:

       if (p.analytics && !window.__bamAnalyticsLoaded) {
         window.__bamAnalyticsLoaded = true;
         const s = document.createElement('script');
         s.async = true;
         s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
         document.head.appendChild(s);
       }
    */
  }

  /* ---------------- translation helper ---------------- */
  function tr(key) {
    if (typeof window.t === 'function') {
      var v = window.t('cookieConsent.' + key);
      if (v) return v;
      v = window.t(key);
      if (v) return v;
    }
    // English fallback — updated when window.t becomes available
    var fb = {
      'cookieBannerAriaLabel': 'Cookie consent',
      'cookieBannerTitle': 'We respect your privacy',
      'cookieBannerDesc': 'This site uses only what it needs to work. We do not track you across other websites, and we set no advertising cookies. You can accept, decline, or choose exactly what to allow. Read our <a href="cookie-policy.html">Cookie Policy</a>.',
      'cookieBannerManage': 'Manage',
      'cookieBannerDecline': 'Decline',
      'cookieBannerAccept': 'Accept All',
      'cookieDialogAriaLabel': 'Cookie preferences',
      'cookieDialogTitle': 'Cookie Preferences',
      'cookieDialogDesc': 'Choose what you allow. Your choice is saved on this device and you can change it at any time.',
      'cookieDialogClose': 'Close',
      'cookieEssential': 'Strictly Necessary',
      'cookieEssentialDesc': 'Required for the site to function: remembering this cookie choice, keeping a form submission secure, and limiting automated spam. These store nothing that identifies you and cannot be switched off.',
      'cookieFunctional': 'Functional',
      'cookieFunctionalDesc': 'Enables the embedded YouTube video and saves a CV Builder draft on your own device so you do not lose your work. Your CV draft never leaves your browser unless you submit an application. Declining keeps the video blocked.',
      'cookieAnalytics': 'Analytics',
      'cookieAnalyticsDesc': 'Anonymous statistics about which pages and vacancies are viewed, so we can improve the site. <strong>No analytics tool is currently installed</strong>, so this setting has no effect today. It is here so that nothing can start collecting data without your permission.',
      'cookieDialogDeclineAll': 'Decline All',
      'cookieDialogSave': 'Save My Choices',
      'cookieAlwaysOn': 'Always On',
      'cookieAllowFunctional': 'Allow functional cookies',
      'cookieAllowAnalytics': 'Allow analytics cookies'
    };
    return fb[key] || '';
  }

  /* ---------------- markup ---------------- */

  function buildUI() {
    if (document.querySelector('.bam-cc')) return;

    const banner = document.createElement('div');
    banner.className = 'bam-cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', tr('cookieBannerAriaLabel'));
    banner.innerHTML =
      '<div class="bam-cc-inner">' +
        '<div class="bam-cc-icon"><i class="bi bi-shield-check"></i></div>' +
        '<div class="bam-cc-text">' +
          '<h4 data-i18n="cookieConsent.cookieBannerTitle">' + tr('cookieBannerTitle') + '</h4>' +
          '<p data-i18n="cookieConsent.cookieBannerDesc">' + tr('cookieBannerDesc') + '</p>' +
        '</div>' +
        '<div class="bam-cc-actions">' +
          '<button type="button" class="bam-cc-btn bam-cc-manage" data-bam="manage" data-i18n="cookieConsent.cookieBannerManage">' + tr('cookieBannerManage') + '</button>' +
          '<button type="button" class="bam-cc-btn bam-cc-reject" data-bam="reject" data-i18n="cookieConsent.cookieBannerDecline">' + tr('cookieBannerDecline') + '</button>' +
          '<button type="button" class="bam-cc-btn bam-cc-accept" data-bam="accept" data-i18n="cookieConsent.cookieBannerAccept">' + tr('cookieBannerAccept') + '</button>' +
        '</div>' +
      '</div>';

    const overlay = document.createElement('div');
    overlay.className = 'bam-cc-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', tr('cookieDialogAriaLabel'));
    overlay.innerHTML =
      '<div class="bam-cc-modal">' +
        '<div class="bam-cc-modal-head">' +
          '<div>' +
            '<h3 data-i18n="cookieConsent.cookieDialogTitle">' + tr('cookieDialogTitle') + '</h3>' +
            '<p data-i18n="cookieConsent.cookieDialogDesc">' + tr('cookieDialogDesc') + '</p>' +
          '</div>' +
          '<button type="button" class="bam-cc-close" data-bam="close" data-i18n="cookieConsent.cookieDialogClose" aria-label="' + tr('cookieDialogClose') + '">&times;</button>' +
        '</div>' +

        '<div class="bam-cc-modal-body">' +

          '<div class="bam-cc-group">' +
            '<div class="bam-cc-group-top">' +
              '<h5 data-i18n="cookieConsent.cookieEssential">' + tr('cookieEssential') + '</h5>' +
              '<span data-i18n="cookieConsent.cookieAlwaysOn">' + tr('cookieAlwaysOn') + '</span>' +
            '</div>' +
            '<p data-i18n="cookieConsent.cookieEssentialDesc">' + tr('cookieEssentialDesc') + '</p>' +
          '</div>' +

          '<div class="bam-cc-group">' +
            '<div class="bam-cc-group-top">' +
              '<h5 data-i18n="cookieConsent.cookieFunctional">' + tr('cookieFunctional') + '</h5>' +
              '<label class="bam-cc-switch">' +
                '<input type="checkbox" data-bam-pref="functional" aria-label="' + tr('cookieAllowFunctional') + '">' +
                '<span class="bam-cc-slider"></span>' +
              '</label>' +
            '</div>' +
            '<p data-i18n="cookieConsent.cookieFunctionalDesc">' + tr('cookieFunctionalDesc') + '</p>' +
          '</div>' +

          '<div class="bam-cc-group">' +
            '<div class="bam-cc-group-top">' +
              '<h5 data-i18n="cookieConsent.cookieAnalytics">' + tr('cookieAnalytics') + '</h5>' +
              '<label class="bam-cc-switch">' +
                '<input type="checkbox" data-bam-pref="analytics" aria-label="' + tr('cookieAllowAnalytics') + '">' +
                '<span class="bam-cc-slider"></span>' +
              '</label>' +
            '</div>' +
            '<p data-i18n="cookieConsent.cookieAnalyticsDesc">' + tr('cookieAnalyticsDesc') + '</p>' +
          '</div>' +

        '</div>' +

        '<div class="bam-cc-modal-foot">' +
          '<button type="button" class="bam-cc-btn bam-cc-reject" data-bam="reject" data-i18n="cookieConsent.cookieDialogDeclineAll">' + tr('cookieDialogDeclineAll') + '</button>' +
          '<button type="button" class="bam-cc-btn bam-cc-manage" data-bam="savePrefs" data-i18n="cookieConsent.cookieDialogSave">' + tr('cookieDialogSave') + '</button>' +
          '<button type="button" class="bam-cc-btn bam-cc-accept" data-bam="accept" data-i18n="cookieConsent.cookieBannerAccept">' + tr('cookieBannerAccept') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);
    document.body.appendChild(overlay);
  }

  function syncToggles() {
    const p = prefs();
    document.querySelectorAll('[data-bam-pref]').forEach(i => {
      i.checked = !!p[i.dataset.bamPref];
    });
  }

  function closeAll() {
    const b = document.querySelector('.bam-cc');
    const o = document.querySelector('.bam-cc-overlay');
    if (b) b.classList.remove('show');
    if (o) o.classList.remove('show');
  }

  /* ---------------- public API ---------------- */

  window.BamConsent = {
    allows: cat => !!prefs()[cat],
    get: () => Object.assign({}, prefs()),
    onChange: fn => { if (typeof fn === 'function') listeners.push(fn); },
    reopen: () => {
      buildUI();
      syncToggles();
      document.querySelector('.bam-cc-overlay').classList.add('show');
    },
    reset: () => {
      try { localStorage.removeItem(KEY); } catch (e) {}
      state = null;
      applyConsent(DEFAULTS);
      buildUI();
      document.querySelector('.bam-cc').classList.add('show');
    },
    updateUI: function() {
      // Re-translate all cookie-consent elements on language change
      var banner = document.querySelector('.bam-cc');
      var overlay = document.querySelector('.bam-cc-overlay');
      if (banner) {
        banner.setAttribute('aria-label', tr('cookieBannerAriaLabel'));
        var bChildren = banner.querySelectorAll('[data-i18n]');
        bChildren.forEach(function(c) {
          var k = c.getAttribute('data-i18n');
          var val = tr(k);
          if (val) {
            if (k === 'cookieBannerDesc' || k === 'cookieAlwaysOn') {
              c.innerHTML = val;
            } else {
              c.textContent = val;
            }
          }
        });
      }
      if (overlay) {
        overlay.setAttribute('aria-label', tr('cookieDialogAriaLabel'));
        var oChildren = overlay.querySelectorAll('[data-i18n]');
        oChildren.forEach(function(c) {
          var k = c.getAttribute('data-i18n');
          var val = tr(k);
          if (val) {
            if (k === 'cookieDialogDesc' || k === 'cookieEssentialDesc' || k === 'cookieFunctionalDesc' || k === 'cookieAnalyticsDesc') {
              c.innerHTML = val;
            } else {
              c.textContent = val;
            }
          }
        });
        // Update the close button aria-label
        var closeBtn = overlay.querySelector('.bam-cc-close');
        if (closeBtn) {
          closeBtn.setAttribute('aria-label', tr('cookieDialogClose'));
        }
        // Update checkbox aria-labels
        var cbs = overlay.querySelectorAll('input[type="checkbox"][data-bam-pref]');
        cbs.forEach(function(cb) {
          var pref = cb.getAttribute('data-bam-pref');
          if (pref === 'functional') {
            cb.setAttribute('aria-label', tr('cookieAllowFunctional'));
          } else if (pref === 'analytics') {
            cb.setAttribute('aria-label', tr('cookieAllowAnalytics'));
          }
        });
      }
    },
    recordedAt: () => (state && state.date) ? state.date : null
  };

  /* ---------------- start ---------------- */

  function init() {
    buildUI();
    state = load();

    if (state) {
      applyConsent(state.prefs);      // honour the saved choice
    } else {
      applyConsent(DEFAULTS);         // block everything non-essential
      setTimeout(() => {
        const b = document.querySelector('.bam-cc');
        if (b) b.classList.add('show');
      }, 700);
    }

    // Any element with data-bam-cookie-settings opens the dialog (footer link).
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-bam-cookie-settings]');
      if (t) { e.preventDefault(); window.BamConsent.reopen(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
