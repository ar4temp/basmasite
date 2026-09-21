window.BAM_JOBS = [];

const BAM_JOBS_FALLBACK = [
  {
    id: "WH-104",
    title: "Warehouse Operative",
    category: "Logistics",
    location: "Riyadh",
    type: "Full-time",
    experience: "1+ years",
    salary: "SAR 2,000 - 2,600 + accommodation",
    vacancies: 25,
    urgent: true,
    posted: "2026-08-26",
    active: true,
    summary: "Picking, packing and dispatch for a large distribution centre in Riyadh. Uniform, transport and accommodation provided.",
    requirements: [
      "Transferable Iqama or eligible for sponsorship transfer",
      "Able to lift up to 25 kg repeatedly through a shift",
      "Willing to work rotating shifts including nights"
    ],
    benefits: [
      "Shared accommodation and daily transport provided",
      "Overtime paid at the statutory rate through WPS",
      "Medical insurance and GOSI registration"
    ]
  }
];

window.BAM_JOBS_READY = (async function loadJobs() {
  try {
    const res = await fetch('data/jobs.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : (data.jobs || []);
    window.BAM_JOBS = jobs;
    window.BAM_JOBS_UPDATED = data.updated || null;
  } catch (e) {
    window.BAM_JOBS = BAM_JOBS_FALLBACK;
    window.BAM_JOBS_SOURCE = 'fallback';
  }
  return window.BAM_JOBS;
})();
