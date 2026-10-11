/**
 * FORGE SYSTEM ENGINE (app.js)
 * Core interactive protocols, Motion dynamics, and State Management.
 */

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initNavToggle();
  init3DCardTilt();
  initScheduleFilters();
  initBmiCalculator();
  initTrialForm();
});

/* ==========================================================================
   01. SYSTEM CLOCK
   ========================================================================== */
function initClock() {
  const clockEl = document.getElementById('clock-display');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const utcStr = now.toUTCString().split(' ')[4] + ' UTC';
    clockEl.textContent = utcStr;
  }
  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   02. MOBILE NAVIGATION TOGGLE
   ========================================================================== */
function initNavToggle() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');

  if (!toggleBtn || !nav) return;

  toggleBtn.addEventListener('click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !expanded);
    nav.classList.toggle('is-open');
  });
}

/* ==========================================================================
   03. ASSIGNED PRIMARY MOTION: 3D CARD TILT WITH LERP & GLARE
   ========================================================================== */
function init3DCardTilt() {
  // Honor reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.card-tilt');

  cards.forEach(card => {
    let glare = card.querySelector('.card-glare');
    let bounds;

    function onMouseMove(e) {
      if (!bounds) bounds = card.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;

      const percentX = (mouseX - centerX) / centerX;
      const percentY = (mouseY - centerY) / centerY;

      const maxTilt = 8; // Max 8 deg tilt as specified
      const rotateX = -percentY * maxTilt;
      const rotateY = percentX * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glare) {
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(212,255,63,0.15), transparent 70%)`;
      }
    }

    function onMouseEnter() {
      bounds = card.getBoundingClientRect();
      card.style.transition = 'transform 0.1s ease-out';
    }

    function onMouseLeave() {
      card.style.transition = 'transform 0.4s ease-out';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      if (glare) glare.style.opacity = '0';
    }

    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
  });
}

/* ==========================================================================
   04. SCHEDULE FILTER SYSTEM
   ========================================================================== */
function initScheduleFilters() {
  const tableBody = document.getElementById('schedule-body');
  if (!tableBody) return;

  const dayButtons = document.querySelectorAll('[data-filter-day]');
  const progButtons = document.querySelectorAll('[data-filter-prog]');
  const emptyState = document.getElementById('no-schedule-results');

  let activeDay = 'all';
  let activeProg = 'all';

  // Check URL params for pre-filter
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam) {
    activeProg = filterParam;
    progButtons.forEach(btn => {
      if (btn.getAttribute('data-filter-prog') === filterParam) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function applyFilters() {
    const rows = tableBody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const rowDay = row.getAttribute('data-day');
      const rowProg = row.getAttribute('data-prog');

      const matchDay = (activeDay === 'all' || rowDay === activeDay);
      const matchProg = (activeProg === 'all' || rowProg === activeProg);

      if (matchDay && matchProg) {
        row.classList.remove('d-none');
        visibleCount++;
      } else {
        row.classList.add('d-none');
      }
    });

    if (visibleCount === 0 && emptyState) {
      emptyState.classList.remove('d-none');
    } else if (emptyState) {
      emptyState.classList.add('d-none');
    }
  }

  dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dayButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDay = btn.getAttribute('data-filter-day');
      applyFilters();
    });
  });

  progButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      progButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeProg = btn.getAttribute('data-filter-prog');
      applyFilters();
    });
  });

  applyFilters();
}

/* ==========================================================================
   05. BMI & ATHLETIC CALCULATOR WIDGET
   ========================================================================== */
function initBmiCalculator() {
  const form = document.getElementById('bmi-form');
  const resultBox = document.getElementById('calc-result');
  const idleBox = document.querySelector('.calc-idle');

  if (!form || !resultBox) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const height = parseFloat(document.getElementById('height-input').value);
    const weight = parseFloat(document.getElementById('weight-input').value);

    if (!height || !weight || height <= 0 || weight <= 0) return;

    // Calculation
    const heightMeters = height / 100;
    const bmi = (weight / (heightMeters * heightMeters)).toFixed(1);

    let category = '';
    if (bmi < 18.5) category = 'UNDERWEIGHT / TISSUE DEFICIT';
    else if (bmi < 24.9) category = 'OPTIMAL ATHLETIC BASE';
    else if (bmi < 29.9) category = 'HYPERTROPHIC / HEAVY MASS';
    else category = 'HIGH MASS / POWER CATEGORY';

    // Estimated protein requirement: 2.2g per kg bodyweight for lifting
    const proteinEst = Math.round(weight * 2.2);

    // Update DOM
    document.getElementById('bmi-val').textContent = bmi;
    document.getElementById('bmi-category').textContent = category;
    document.getElementById('protein-recommendation').textContent = `${proteinEst}G / DAY`;

    if (idleBox) idleBox.classList.add('d-none');
    resultBox.classList.remove('d-none');
  });
}

/* ==========================================================================
   06. TRIAL SIGNUP FORM HANDLER
   ========================================================================== */
function initTrialForm() {
  const form = document.getElementById('trial-signup-form');
  const feedback = document.getElementById('form-feedback');

  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('full-name').value;
    const email = document.getElementById('email-address').value;