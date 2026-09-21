/**
 * Careers page: renders vacancies from assets/js/jobs-data.js,
 * with category filtering and keyword search.
 *
 * All user-visible strings go through window.t() — see assets/js/i18n.js.
 * Re-renders when language changes via window._bam_on_lang_change.
 */
(async function () {
  "use strict";

  const t = (key) => {
    if (window.t) return window.t(key);
    if (window.dictAr && window.dictAr[key] != null) return window.dictAr[key];
    if (window.dictEn) return window.dictEn[key];
    return key;
  };

  const list = document.querySelector('#job-list');
  if (!list) return;

  if (window.BAM_JOBS_READY) { try { await window.BAM_JOBS_READY; } catch (e) {} }

  const jobs = (window.BAM_JOBS || []).filter((j) => j.active !== false);
  const filterBar = document.querySelector('#job-filters');
  const searchBox = document.querySelector('#job-search');
  const countEl  = document.querySelector('#job-result-count');
  const emptyEl  = document.querySelector('#job-empty');
  const noneEl   = document.querySelector('#job-none');

  let activeCat = 'All';
  let term = '';

  /* ---- helpers ---- */

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function daysAgo(dateStr) {
    const then = new Date(dateStr + 'T00:00:00');
    if (isNaN(then)) return '';
    const diff = Math.floor((Date.now() - then.getTime()) / 86400000);
    if (diff <= 0)  return t('careers.postedToday');
    if (diff === 1) return t('careers.postedYesterday');
    if (diff < 7)   return t('careers.postedDaysAgo', [diff]);
    if (diff < 14)  return t('careers.postedWeeksAgo', [1]);
    if (diff < 60)  return t('careers.postedWeeksAgo', [Math.floor(diff / 7)]);
    return t('careers.postedMonthsAgo', [Math.floor(diff / 30)]);
  }

  /* ---- headline stats ---- */

  function setStats() {
    const openings = jobs.length;
    const positions = jobs.reduce((n, j) => n + (parseInt(j.vacancies, 10) || 0), 0);
    const urgent = jobs.filter((j) => j.urgent).length;
    const set = (id, val) => {
      const el = document.querySelector(id);
      if (el) countUp(el, val);
    };
    set('#stat-openings', openings);
    set('#stat-positions', positions);
    set('#stat-urgent', urgent);
  }

  function countUp(el, target) {
    const dur = 900, t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = String(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    }
    requestAnimationFrame(tick);
  }

  /* ---- filters ---- */

  function buildFilters() {
    const cats = ['All', ...Array.from(new Set(jobs.map((j) => j.category)))];
    filterBar.innerHTML = cats.map((c) => {
      const n = c === 'All' ? jobs.length : jobs.filter((j) => j.category === c).length;
      return '<button type=\"button\" data-cat=\"' + esc(c) + '\"'
        + (c === 'All' ? ' class=\"active\"' : '') + '>'
        + esc(c)
        + ' <span style=\"opacity:.65\">(' + n + ')</span></button>';
    }).join('');

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      activeCat = btn.dataset.cat;
      filterBar.querySelectorAll('button').forEach((b) =>
        b.classList.toggle('active', b === btn));
      render();
    });
  }

  /* ---- card markup ---- */

  function card(j) {
    const reqs = (j.requirements || []).map((r) => '<li>' + esc(r) + '</li>').join('');
    const bens = (j.benefits || []).map((b) => '<li>' + esc(b) + '</li>').join('');
    const posText = j.vacancies > 1
      ? j.vacancies + ' ' + t('careers.positionsPlural')
      : '1 ' + t('careers.positionsSingular');

    return ''
      + '<div class=\"col-lg-6\">'
      +   '<article class=\"job-card\">'
      +     '<div class=\"job-card-head\">'
      +       '<div>'
      +         '<h3>' + esc(j.title) + '</h3>'
      +         '<span class=\"job-ref\">' + t('careers.ref') + ' '
      +           esc(j.id) + ' \u00b7 ' + esc(j.category) + '</span>'
      +       '</div>'
      +       (j.urgent
      +         ? '<span class=\"job-urgent\">' + t('careers.urgent') + '</span>'
      +         : '') +
      +     '</div>'

      +     '<div class=\"job-meta\">'
      +       '<span><i class=\"bi bi-geo-alt\"></i>' + esc(j.location) + '</span>'
      +       '<span><i class=\"bi bi-briefcase\"></i>' + esc(j.type) + '</span>'
      +       '<span><i class=\"bi bi-bar-chart\"></i>' + esc(j.experience) + '</span>'
      +       '<span><i class=\"bi bi-people\"></i>' + posText + '</span>'
      +       '<span><i class=\"bi bi-cash-coin\"></i>' + esc(j.salary) + '</span>'
      +     '</div>'

      +     '<p class=\"job-summary\">' + esc(j.summary) + '</p>'

      +     '<div class=\"job-detail\" id=\"detail-' + esc(j.id) + '\">'
      +       (reqs
      +         ? '<h5>' + t('careers.requirements') + '</h5><ul>' + reqs + '</ul>'
      +         : '') +
      +       (bens
      +         ? '<h5>' + t('careers.whatWeOffer') + '</h5><ul>' + bens + '</ul>'
      +         : '') +
      +     '</div>'

      +     '<div class=\"job-actions\">'
      +       '<a class=\"btn-brand\" href=\"apply.html?job='
      +         + encodeURIComponent(j.id) + '\">' + t('careers.applyNow') + '</a>'
      +       '<button type=\"button\" class=\"job-toggle\" aria-expanded=\"false\" '
      +         + 'aria-controls=\"detail-' + esc(j.id) + '\" data-toggle=\"' + esc(j.id) + '\">'
      +         + '<span class=\"t\">' + t('careers.viewDetails') + '</span>'
      +         + ' <i class=\"bi bi-chevron-down\"></i>'
      +       '</button>'
      +       '<span class=\"job-posted\">' + daysAgo(j.posted) + '</span>'
      +     '</div>'
      +   '</article>'
      + '</div>';
  }

  /* ---- render ---- */

  function render() {
    let out = jobs.slice();

    if (activeCat !== 'All')
      out = out.filter((j) => j.category === activeCat);

    if (term) {
      const lc = term.toLowerCase();
      out = out.filter((j) =>
        (j.title + ' ' + j.location + ' ' + j.category + ' '
         + j.id + ' ' + j.type + ' ' + j.summary)
          .toLowerCase().includes(lc));
    }

    out.sort((a, b) =>
      (b.urgent - a.urgent)
      || (new Date(b.posted) - new Date(a.posted)));

    list.innerHTML = out.map(card).join('');

    const noneAtAll = jobs.length === 0;
    if (noneEl) noneEl.hidden = !noneAtAll;
    if (emptyEl) emptyEl.hidden = noneAtAll || out.length !== 0;

    const toolbar = document.querySelector('.job-toolbar');
    if (toolbar)
      toolbar.style.display = noneAtAll ? 'none' : '';

    countEl.textContent = out.length
      ? t('careers.showingCount', [out.length, jobs.length])
      : '';
  }

  /* ---- expand / collapse ---- */

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.job-toggle');
    if (!btn) return;
    const panel = document.querySelector(
      '#detail-' + CSS.escape(btn.dataset.toggle));
    const open = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.t').textContent
      = open ? t('careers.hideDetails') : t('careers.viewDetails');
  });

  /* ---- search (debounced) ---- */

  let timer;
  if (searchBox) {
    searchBox.addEventListener('input', (e) => {
      clearTimeout(timer);
      const v = e.target.value.trim();
      timer = setTimeout(() => { term = v; render(); }, 180);
    });
  }

  /* ---- clear filters ---- */

  const clearBtn = document.querySelector('#job-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      term = '';
      activeCat = 'All';
      if (searchBox) searchBox.value = '';
      filterBar.querySelectorAll('button').forEach((b) =>
        b.classList.toggle('active', b.dataset.cat === 'All'));
      render();
    });
  }

  buildFilters();
  render();
  setStats();

  /* ---- re-render when language changes ---- */
  window._bam_on_lang_change = () => { render(); buildFilters(); };
})();
