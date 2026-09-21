(function () {
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'bam_lang';
  var currentLang = DEFAULT_LANG;
  var dictEn = {};
  var dictAr = {};
  var dictLoaded = { en: false, ar: false };

  function getPreferredLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
    var browser = navigator.language || navigator.userLanguage;
    if (browser && browser.startsWith('ar')) return 'ar';
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    var html = document.documentElement;
    html.setAttribute('lang', lang === 'ar' ? 'ar-SA' : 'en');
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.classList.toggle('active', lang === 'ar');
      // Update toggle innerHTML to show only the active language
      if (lang === 'ar') {
        toggle.innerHTML = '<span class="lang-label active" data-i18n-lang="ar">AR</span>';
        toggle.setAttribute('aria-label', 'Switch to English');
      } else {
        toggle.innerHTML = '<span class="lang-label active" data-i18n-lang="en">EN</span>';
        toggle.setAttribute('aria-label', 'Toggle to Arabic');
      }
    }
    // Update Swiper direction for RTL
    if (window.heroSwiper) {
      window.heroSwiper.params.direction = lang === 'ar' ? 'rtl' : 'ltr';
      window.heroSwiper.update();
    }
    if (window.BamConsent && window.BamConsent.updateUI) {
      window.BamConsent.updateUI();
    }
    window._bam_i18n_lang = lang;
    if (window._bam_on_lang_change) window._bam_on_lang_change(lang);
    translatePage();
  }

  function getCurrentDict() {
    if (currentLang === 'ar') {
      // Merge: start with English, overlay Arabic so missing keys fall back to English
      var merged = {};
      deepMerge(merged, dictEn);
      deepMerge(merged, dictAr);
      return merged;
    }
    return dictEn;
  }

  // Expose a global translator so page scripts (careers.js, apply.js)
  // can translate dynamic content without importing i18n internals.
  function t(key) {
    var dict = getCurrentDict();
    var parts = key.split('.');
    var val = dict;
    for (var i = 0; i < parts.length; i++) {
      if (val && typeof val === 'object' && parts[i] in val) { val = val[parts[i]]; }
      else { return undefined; }
    }
    return typeof val === 'string' ? val : undefined;
  }
  window.t = t;
  window._bam_i18n_lang = currentLang;

  function deepMerge(target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) && typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  function loadDicts() {
    Promise.all([
      fetch('assets/i18n/en.json').then(function(r){ return r.json(); }).then(function(d){ dictEn = d; dictLoaded.en = true; }),
      fetch('assets/i18n/ar.json').then(function(r){ return r.json(); }).then(function(d){ dictAr = d; dictLoaded.ar = true; })
    ]).then(function () { translatePage(); }).catch(function() {});
  }

  function translatePage() {
    if (!dictLoaded.en && !dictLoaded.ar) return;
    var dict = getCurrentDict();
    applyTranslations(dict);
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = resolveKey(dict, key);
      if (val !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
          if (!el.value || el.dataset.i18nPlaceholder) {
            el.placeholder = val;
          }
          if (el.dataset.i18nValue) el.value = val;
        } else {
          el.innerHTML = val;
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = resolveKey(dict, key);
      if (val !== undefined) el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      var val = resolveKey(dict, key);
      if (val !== undefined) el.title = val;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      var val = resolveKey(dict, key);
      if (val !== undefined) el.alt = val;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      var val = resolveKey(dict, key);
      if (val !== undefined) el.setAttribute('aria-label', val);
    });
    document.querySelectorAll('[data-i18n-lang]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-lang');
      if (key === currentLang) {
        el.style.fontWeight = '700';
        el.style.color = 'var(--accent-color)';
      } else {
        el.style.fontWeight = '';
        el.style.color = '';
      }
    });
    // Update lang toggle button labels
    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      var enLabel = toggle.querySelector('[data-i18n-lang="en"]');
      var arLabel = toggle.querySelector('[data-i18n-lang="ar"]');
      // The labels are static EN/AR, just update active styling via CSS class
    }
  }

  function resolveKey(dict, key) {
    var parts = key.split('.');
    var val = dict;
    for (var i = 0; i < parts.length; i++) {
      if (val && typeof val === 'object' && parts[i] in val) {
        val = val[parts[i]];
      } else {
        return undefined;
      }
    }
    return typeof val === 'string' ? val : undefined;
  }

  function bindToggle(toggle) {
    toggle.addEventListener('click', function () {
      setLang(currentLang === 'ar' ? 'en' : 'ar');
    });
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLang(currentLang === 'ar' ? 'en' : 'ar'); }
    });
  }

  function createToggle() {
    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      bindToggle(toggle);
      return;
    }
    var header = document.querySelector('.header .container-fluid');
    if (!header) return;
    toggle = document.createElement('div');
    toggle.id = 'lang-toggle';
    toggle.className = 'lang-switch';
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    if (currentLang === 'ar') {
      toggle.innerHTML = '<span class="lang-label active" data-i18n-lang="ar">AR</span>';
      toggle.setAttribute('aria-label', 'Switch to English');
    } else {
      toggle.innerHTML = '<span class="lang-label active" data-i18n-lang="en">EN</span>';
      toggle.setAttribute('aria-label', 'Toggle to Arabic');
    }
    bindToggle(toggle);
    header.appendChild(toggle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { createToggle(); loadDicts(); setLang(getPreferredLang()); });
  } else {
    createToggle(); loadDicts(); setLang(getPreferredLang());
  }
})();
