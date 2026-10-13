/**
 * FORGE S&C — Shared Client Application
 * Handles: Motion signatures (Clip-Path reveal, counter animation),
 * filterable schedule matrix, interactive BMI calculator, pass booking.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initClipPathReveal();
  initCounterAnimations();

  // Page-specific initializations
  const page = document.body.dataset.page;
  if (page === 'schedule') initScheduleFilters();
  if (page === 'membership') {
    initBmiCalculator();
    initTrialForm();
  }
});

/* -------------------------------------------------------------------------- */
/* 1. MOBILE NAVIGATION TOGGLE                                               */
/* -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('#primary-nav');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('is-open');
  });
}

/* -------------------------------------------------------------------------- */
/* 2. SIGNATURE MOTION: CLIP-PATH IMAGE REVEAL                                */
/* -------------------------------------------------------------------------- */
function initClipPathReveal() {
  const revealElements = document.querySelectorAll('.reveal-image');
  if (!revealElements.length) return;

  // Check prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealElements.forEach(el => el.classList.add('is-inview'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => observer.observe(el));
}

/* -------------------------------------------------------------------------- */
/* 3. SIGNATURE MOTION: ANIMATED COUNTERS                                     */
/* -------------------------------------------------------------------------- */
function initCounterAnimations() {
  const counterElements = document.querySelectorAll('[data-counter-target]');
  if (!counterElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counterElements.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-counter-target'), 10);
  const duration = 1200; // ms
  const startTime = performance.now();

  function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutExpo(progress);
    const currentValue = Math.floor(easedProgress * target);

    el.textContent = currentValue.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

/* -------------------------------------------------------------------------- */
/* 4. SCHEDULE FILTERING SYSTEM                                              */
/* -------------------------------------------------------------------------- */
function initScheduleFilters() {
  const dayPills = document.querySelectorAll('#day-pills .pill-btn');
  const disciplineSelect = document.querySelector('#discipline-filter');
  const rows = document.querySelectorAll('#schedule-body tr');
  const emptyState = document.querySelector('#no-sessions');
  const resetBtn = document.querySelector('#reset-filters');

  if (!rows.length) return;

  let activeDay = 'all';
  let activeDiscipline = 'all';

  // Handle URL query parameters if coming from programs page
  const urlParams = new URLSearchParams(window.location.search);
  const paramProgram = urlParams.get('program');
  if (paramProgram && disciplineSelect) {
    disciplineSelect.value = paramProgram;
    activeDiscipline = paramProgram;
  }

  function filterTable() {
    let visibleCount = 0;

    rows.forEach(row => {
      const rowDay = row.getAttribute('data-day');
      const rowDiscipline = row.getAttribute('data-discipline');

      const matchesDay = (activeDay === 'all' || rowDay === activeDay);
      const matchesDiscipline = (activeDiscipline === 'all' || rowDiscipline === activeDiscipline);

      if (matchesDay && matchesDiscipline) {
        row.classList.remove('hidden');
        visibleCount++;
      } else {
        row.classList.add('hidden');
      }
    });

    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }
  }

  dayPills.forEach(pill => {
    pill.addEventListener('click', () => {
      dayPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeDay = pill.getAttribute('data-day');
      filterTable();
    });
  });

  if (disciplineSelect) {
    disciplineSelect.addEventListener('change', (e) => {
      activeDiscipline = e.target.value;
      filterTable();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeDay = 'all';
      activeDiscipline = 'all';
      dayPills.forEach(p => p.classList.remove('active'));
      if (dayPills[0]) dayPills[0].classList.add('active');
      if (disciplineSelect) disciplineSelect.value = 'all';
      filterTable();
    });
  }

  filterTable();
}

/* -------------------------------------------------------------------------- */
/* 5. INTERACTIVE ATHLETIC BMI CALCULATOR                                     */
/* -------------------------------------------------------------------------- */
function initBmiCalculator() {
  const form = document.querySelector('#bmi-calculator');
  const unitsSelect = document.querySelector('#calc-units');
  const lblWeight = document.querySelector('#lbl-weight');
  const lblHeight = document.querySelector('#lbl-height');
  const weightInput = document.querySelector('#calc-weight');
  const heightInput = document.querySelector('#calc-height');
  const resultPanel = document.querySelector('#calc-result');
  const bmiVal = document.querySelector('#bmi-value');
  const bmiStatus = document.querySelector('#bmi-status');
  const bmiNote = document.querySelector('#bmi-note');

  if (!form) return;

  unitsSelect.addEventListener('change', () => {
    if (unitsSelect.value === 'metric') {
      lblWeight.textContent = 'WEIGHT (KG)';
      lblHeight.textContent = 'HEIGHT (CM)';
      weightInput.placeholder = 'e.g. 85';
      heightInput.placeholder = 'e.g. 178';
    } else {
      lblWeight.textContent = 'WEIGHT (LBS)';
      lblHeight.textContent = 'HEIGHT (INCHES)';
      weightInput.placeholder = 'e.g. 185';
      heightInput.placeholder = 'e.g. 70';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);

    if (!weight || !height || weight <= 0 || height <= 0) return;

    let bmi = 0;
    if (unitsSelect.value === 'imperial') {
      bmi = (weight / (height * height)) * 703;
    } else {
      const heightInMeters = height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }

    const roundedBmi = bmi.toFixed(1);
    bmiVal.textContent = roundedBmi;

    let category = '';
    let note = '';

    if (bmi < 18.5) {
      category = 'UNDERWEIGHT / LOW MASS';
      note = 'Recommendation: Focus on caloric surplus & hyper-trophy block periodization.';
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'OPTIMAL HEALTH SPECTRUM';
      note = 'Recommendation: Balanced metabolic and heavy powerlifting integration.';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'ATHLETIC HEAVY / OVERWEIGHT';
      note = 'Note for strength athletes: BMI does not measure muscle density. For powerlifters, higher BMI can reflect elite lean tissue mass.';
    } else {
      category = 'SUPER-HEAVYWEIGHT / HIGH BMI';
      note = 'Recommendation: Combined aerobic conditioning (HIIT Engine) with heavy compound loading.';
    }

    bmiStatus.textContent = category;
    bmiNote.textContent = note;
    resultPanel.classList.remove('hidden');
  });
}

/* -------------------------------------------------------------------------- */
/* 6. TRIAL FORM HANDLING & VALIDATION                                       */
/* -------------------------------------------------------------------------- */
function initTrialForm() {
  const form = document.querySelector('#pass-form');
  const feedback = document.querySelector('#form-feedback');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();

    if (!name || !email || !phone) {
      feedback.className = 'form-feedback error-msg';
      feedback.textContent = '// ERROR: PLEASE FILL ALL REQUIRED DISPATCH FIELDS.';
      feedback.classList.remove('hidden');
      return;
    }

    // Simulate submission state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'DISPATCHING REQUEST...';

    setTimeout(() => {
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'DISPATCH PASS REQUEST';

      feedback.className = 'form-feedback success-msg';
      feedback.innerHTML = '<strong>// DISPATCH SUCCESSFUL:</strong> Your 3-Day Pass confirmation code has been transmitted to ' + email + '. Show this code at the front counter.';
      feedback.classList.remove('hidden');
    }, 800);
  });
}