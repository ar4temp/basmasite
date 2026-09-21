/**
 * Multi-step job application form.
 * Opens the visitor's email client with the application details.
 * Attach a CV before sending.
 *
 * All user-visible strings go through window.t() — see assets/js/i18n.js.
 */
(async function () {
  "use strict";

  const t = (key, vars) => {
    if (window.t) return window.t(key, vars);
    if (window.dictAr && window.dictAr[key] != null) {
      let s = window.dictAr[key];
      if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
      return s;
    }
    if (window.dictEn) {
      let s = window.dictEn[key];
      if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
      return s;
    }
    return key;
  };

  const form = document.querySelector('#apply-form');
  if (!form) return;

  if (window.BAM_JOBS_READY) { try { await window.BAM_JOBS_READY; } catch (e) {} }

  const jobs = (window.BAM_JOBS || []).filter((j) => j.active !== false);
  const panels = Array.from(form.querySelectorAll('.form-panel'));
  const steps  = Array.from(document.querySelectorAll('#form-steps .step'));
  const btnBack   = document.querySelector('#btn-back');
  const btnNext   = document.querySelector('#btn-next');
  const btnSubmit = document.querySelector('#btn-submit');
  const alertBox  = document.querySelector('#form-alert');
  let current = 1;
  const LAST = panels.length;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const v   = (id) => (document.querySelector('#' + id) || {}).value || '';
  const txt = (id) => {
    const el = document.querySelector('#' + id);
    if (!el) return '';
    if (el.tagName === 'SELECT' && el.selectedIndex >= 0)
      return el.options[el.selectedIndex].text;
    return el.value;
  };

  /* ---- populate the position dropdown ---- */

  const sel = document.querySelector('#job_id');
  const byCat = {};
  jobs.forEach((j) => {
    (byCat[j.category] = byCat[j.category] || []).push(j);
  });

  Object.keys(byCat).forEach((cat) => {
    const g = document.createElement('optgroup');
    g.label = cat;
    byCat[cat].forEach((j) => {
      const o = document.createElement('option');
      o.value = j.id;
      o.textContent = j.title + ' \u2014 ' + j.location
        + ' (Ref ' + j.id + ')';
      g.appendChild(o);
    });
    sel.appendChild(g);
  });

  const spec = document.createElement('option');
  spec.value = 'SPECULATIVE';
  spec.textContent = t('apply.speculativeOption');
  sel.appendChild(spec);

  const wanted = new URLSearchParams(location.search).get('job');
  if (wanted && sel.querySelector(
      'option[value=\"' + CSS.escape(wanted) + '\"]'))
    sel.value = wanted;

  const brief = document.querySelector('#job-brief');
  function showBrief() {
    const j = jobs.find((x) => x.id === sel.value);
    document.querySelector('#job_title_hidden').value
      = j
        ? j.title
        : (sel.value === 'SPECULATIVE'
            ? t('apply.specApplicationHidden')
            : '');

    if (!j) {
      if (sel.value === 'SPECULATIVE') {
        brief.hidden = false;
        brief.innerHTML
          = '<div class=\"job-brief-alert\">'
          + '<div class=\"alert-body\">'
          + '<strong>' + t('apply.registeringFuture') + '</strong><br>'
          + '<span class=\"alert-muted\">'
          + t('apply.candidatePoolText') + '</span></div></div>';
      } else {
        brief.hidden = true;
      }
      return;
    }
    brief.hidden = false;
    brief.innerHTML
      = '<div class=\"job-brief-alert\">'
      + '<div class=\"alert-body\">'
      + '<strong>' + esc(j.title) + '</strong> '
      + t('apply.dot') + ' ' + esc(j.location) + '<br>'
      + '<span class=\"alert-muted\">'
      + esc(j.type) + ' \u00b7 ' + esc(j.experience)
      + ' \u00b7 ' + esc(j.salary) + '</span></div></div>';
  }
  sel.addEventListener('change', showBrief);
  showBrief();

  /* ---- ID validation ---- */

  const idType = document.querySelector('#id_type');
  const idNum  = document.querySelector('#id_number');
  const idHelp = document.querySelector('#id-help');
  const idErr  = document.querySelector('#id-error');

  idType.addEventListener('change', () => {
    idNum.value = '';
    if (idType.value === 'iqama') {
      idNum.placeholder = t('apply.iqamaPlaceholder');
      idHelp.textContent = t('apply.iqamaHelp');
    } else if (idType.value === 'national') {
      idNum.placeholder = t('apply.nationalPlaceholder');
      idHelp.textContent = t('apply.nationalHelp');
    } else if (idType.value === 'passport') {
      idNum.placeholder = t('apply.passportPlaceholder');
      idHelp.textContent = t('apply.passportHelp');
    } else {
      idNum.placeholder = t('apply.selectIdPlaceholder');
      idHelp.textContent = t('apply.selectIdHelp');
    }
  });

  idNum.addEventListener('input', () => {
    if (idType.value === 'iqama' || idType.value === 'national')
      idNum.value = idNum.value.replace(/\D/g, '').slice(0, 10);
  });

  function idValid() {
    const v = idNum.value.trim();
    if (!v) { idErr.textContent = ''; return true; }
    if (idType.value === 'iqama') {
      if (!/^2\d{9}$/.test(v)) {
        idErr.textContent = t('apply.iqamaInvalid');
        return false;
      }
    } else if (idType.value === 'national') {
      if (!/^1\d{9}$/.test(v)) {
        idErr.textContent = t('apply.nationalInvalid');
        return false;
      }
    } else if (idType.value === 'passport') {
      if (!/^[A-Za-z0-9]{5,15}$/.test(v)) {
        idErr.textContent = t('apply.passportInvalid');
        return false;
      }
    }
    return true;
  }

  /* ---- file upload ---- */

  const zone     = document.querySelector('#upload-zone');
  const fileInput = document.querySelector('#cv_file');
  const fileBox   = document.querySelector('#upload-file');
  const fileErr   = document.querySelector('#file-error');
  const MAXBYTES  = 5 * 1024 * 1024;
  const OK_EXT    = ['pdf', 'doc', 'docx'];

  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  ['dragenter', 'dragover'].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    }));
  ['dragleave', 'drop'].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
    }));
  zone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleFile();
    }
  });
  fileInput.addEventListener('change', handleFile);

  function handleFile() {
    fileErr.style.display = 'none';
    const f = fileInput.files[0];
    if (!f) { fileBox.classList.remove('show'); return; }
    const ext = f.name.split('.').pop().toLowerCase();
    if (OK_EXT.indexOf(ext) === -1) {
      fileErr.textContent = t('apply.fileTypeInvalid');
      fileErr.style.display = 'block';
      fileInput.value = '';
      fileBox.classList.remove('show');
      return;
    }
    if (f.size > MAXBYTES) {
      fileErr.textContent
        = t('apply.fileTooLarge')
        .replace('{size}', (f.size / 1048576).toFixed(1))
        .replace('{max}', '5');
      fileErr.style.display = 'block';
      fileInput.value = '';
      fileBox.classList.remove('show');
      return;
    }
    document.querySelector('#file-name').textContent = f.name;
    document.querySelector('#file-size').textContent
      = f.size < 1024 * 1024
        ? (f.size / 1024).toFixed(0) + ' KB'
        : (f.size / 1048576).toFixed(2) + ' MB';
    fileBox.classList.add('show');
  }

  document.querySelector('#file-remove')
    .addEventListener('click', () => {
      fileInput.value = '';
      fileBox.classList.remove('show');
    });

  /* ---- per-step validation ---- */

  function markError(el, on) {
    const grp = el.closest('.mb-3, .form-check, .col-md-6')
      || el.parentElement;
    grp.classList.toggle('has-error', on);
  }

  function validate(step) {
    const panel = panels[step - 1];
    let ok = true;
    panel.querySelectorAll('[required]').forEach((el) => {
      let good = true;
      if (el.type === 'checkbox') good = el.checked;
      else if (el.type === 'email')
        good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
          .test(el.value.trim());
      else if (el.type === 'tel')
        good = el.value.replace(/\D/g, '').length >= 9;
      else good = el.value.trim() !== '';

      if (el === idNum) good = idValid();

      markError(el, !good);
      if (!good && ok) {
        el.focus();
        ok = false;
      } else if (!good) ok = false;
    });
    return ok;
  }

  /* ---- review panel ---- */

  function buildReview() {
    const f = fileInput.files[0];

    const block = (title, rows) =>
      '<div class=\"review-block\"><h6>'
      + t(title) + '</h6>'
      + rows.filter((r) => r[1])
        .map((r) =>
          '<div class=\"review-row\">'
          + '<div class=\"k\">' + r[0] + '</div>'
          + '<div class=\"v\">' + esc(r[1]) + '</div>'
          + '</div>')
      .join('') + '</div>';

    document.querySelector('#review-out').innerHTML
      = block('review.position', [
          [t('apply.applyingFor'), txt('job_id')],
          [t('apply.availableFrom'), v('available_from')],
          [t('apply.currentStatus'), txt('current_location')]
        ])
      + block('review.personalDetails', [
          [t('apply.fullName'), v('full_name')],
          [t('apply.nationality'), v('nationality')],
          [t('apply.email'), v('email')],
          [t('apply.mobile'), v('phone')],
          [t('apply.idType'), txt('id_type')],
          [t('apply.idNumber'), v('id_number')],
          [t('apply.dateOfBirth'), v('dob')],
          [t('apply.city'), v('city')]
        ])
      + block('review.experience', [
          [t('apply.yearsExp'), txt('years_exp')],
          [t('apply.currentJobTitle'), v('current_job')],
          [t('apply.skills'), v('skills')],
          [t('apply.cvAttached'),
           f ? f.name : t('apply.noFileUploaded')],
          [t('apply.additionalNotes'), v('cover_note')]
        ]);
  }

  /* ---- step navigation ---- */

  function goTo(n) {
    current = n;
    panels.forEach((p) =>
      p.classList.toggle('active',
        +p.dataset.panel === n));
    steps.forEach((s) => {
      const i = +s.dataset.step;
      s.classList.toggle('active', i === n);
      s.classList.toggle('done', i < n);
    });
    btnBack.style.visibility
      = n === 1 ? 'hidden' : 'visible';
    btnNext.style.display
      = n === LAST ? 'none' : '';
    btnSubmit.style.display
      = n === LAST ? '' : 'none';
    if (n === LAST) buildReview();
    const top = document.querySelector('.form-wrap')
      .getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  btnNext.addEventListener('click', () => {
    if (validate(current)) goTo(current + 1);
  });
  btnBack.addEventListener('click', () => goTo(current - 1));

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(LAST)) return;
    if ((document.querySelector('#website') || {}).value) return;

    const now = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const ref = 'BMC'
      + String(now.getFullYear()).slice(-2)
      + p(now.getDate())
      + p(now.getMonth() + 1)
      + p(now.getHours())
      + p(now.getMinutes());

    const body = [
      t('apply.reference') + ': ' + ref,
      t('apply.position') + ': ' + txt('job_id'),
      t('apply.availableFrom') + ': ' + v('available_from'),
      t('apply.status') + ': ' + txt('current_location'),
      t('apply.name') + ': ' + v('full_name'),
      t('apply.nationality') + ': ' + v('nationality'),
      t('apply.email') + ': ' + v('email'),
      t('apply.mobile') + ': ' + v('phone'),
      t('apply.idType') + ': ' + txt('id_type'),
      t('apply.idNumber') + ': ' + v('id_number'),
      t('apply.city') + ': ' + v('city'),
      t('apply.experience') + ': ' + txt('years_exp'),
      t('apply.currentJob') + ': ' + v('current_job'),
      t('apply.skills') + ': ' + v('skills'),
      t('apply.notes') + ': ' + v('cover_note'),
      '',
      t('apply.attachCv')
    ].join('\n');

    window.location.href
      = 'mailto:info@basmat-almawared.com'
      + '?subject='
      + encodeURIComponent(
          t('apply.applicationSubject')
          + ' ' + ref
          + ' \u2014 '
          + (v('job_title_hidden') || txt('job_id')))
      + '&body='
      + encodeURIComponent(body);

    form.style.display = 'none';
    const intro = document.querySelector('#apply-intro');
    if (intro) intro.style.display = 'none';
    document.querySelector('#form-steps').style.display = 'none';
    document.querySelector('#success-ref').textContent = ref;
    const copyBtn = document.querySelector('#copy-ref');
    if (copyBtn && navigator.clipboard) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(ref).then(() => {
          copyBtn.innerHTML = '<i class=\"bi bi-check-lg\"></i>';
          setTimeout(() => {
            copyBtn.innerHTML
              = '<i class=\"bi bi-clipboard\"></i>';
          }, 1800);
        }).catch(() => {});
      });
    } else if (copyBtn) {
      copyBtn.style.display = 'none';
    }
    document.querySelector('#apply-success').style.display = 'block';
    window.scrollTo({
      top: document.querySelector('.form-wrap').offsetTop - 110,
      behavior: 'smooth'
    });
  });

  /* ---- re-render when language changes ---- */
  window._bam_on_lang_change = () => {
    showBrief();
    if (current === LAST) buildReview();
    idType.dispatchEvent(new Event('change'));
  };
})();
