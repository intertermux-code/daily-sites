/* ============================================
   FORGE — app.js
   Vanilla JS: counters, accordions, schedule
   filter, BMI, clock, reveal, forms
   ============================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Live Clock ---------- */
  const clockEl = document.getElementById('liveClock');
  if (clockEl) {
    const tick = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      clockEl.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Mobile Nav ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('navList');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('is-open', !expanded);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navList.classList.contains('is-open') &&
          !navList.contains(e.target) &&
          !navToggle.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        navList.classList.remove('is-open');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navList.classList.remove('is-open');
        navToggle.focus();
      }
    });
  }

  /* ---------- Animated Counters (easeOutExpo) ---------- */
  const counterEls = document.querySelectorAll('[data-counter]');
  if (counterEls.length && !prefersReducedMotion) {
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const format = (n) => n.toLocaleString();

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.counter, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1200;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = easeOutExpo(progress);
        const current = Math.floor(target * eased);
        el.textContent = format(current) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = format(target) + suffix;
      };
      requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counterEls.forEach((el) => counterObserver.observe(el));
  } else if (counterEls.length) {
    counterEls.forEach((el) => {
      const target = parseInt(el.dataset.counter, 10);
      const suffix = el.dataset.suffix || '';
      el.textContent = target.toLocaleString() + suffix;
    });
  }

  /* ---------- Reveal on scroll (stagger) ---------- */
  if (!prefersReducedMotion) {
    const revealEls = document.querySelectorAll(
      '.panel, .program-card, .stat-card, .coach-card, .price-card, .philosophy-card, .note'
    );
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    document.querySelectorAll(
      '.panel, .program-card, .stat-card, .coach-card, .price-card, .philosophy-card, .note'
    ).forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Spring Accordion ---------- */
  document.querySelectorAll('.accordion').forEach((accordion) => {
    const items = accordion.querySelectorAll('.accordion-item');
    items.forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.getAttribute('data-open') === 'true';
        // Only-one-open rule: close siblings
        items.forEach((sibling) => {
          const sTrigger = sibling.querySelector('.accordion-trigger');
          sibling.setAttribute('data-open', 'false');
          if (sTrigger) sTrigger.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.setAttribute('data-open', 'true');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      // Keyboard: Home / End / arrows
      trigger.addEventListener('keydown', (e) => {
        const triggers = Array.from(accordion.querySelectorAll('.accordion-trigger'));
        const idx = triggers.indexOf(trigger);
        let target = null;
        if (e.key === 'ArrowDown') target = triggers[(idx + 1) % triggers.length];
        else if (e.key === 'ArrowUp') target = triggers[(idx - 1 + triggers.length) % triggers.length];
        else if (e.key === 'Home') target = triggers[0];
        else if (e.key === 'End') target = triggers[triggers.length - 1];
        if (target) {
          e.preventDefault();
          target.focus();
        }
      });
    });
  });

  /* ---------- Schedule Filter ---------- */
  const scheduleTable = document.querySelector('.schedule-table');
  const dayFilters = document.querySelectorAll('[data-filter]');
  const disciplineFilters = document.querySelectorAll('[data-discipline]');
  const scheduleEmpty = document.getElementById('scheduleEmpty');
  const resetFiltersBtn = document.getElementById('resetFilters');

  let currentDay = 'all';
  let currentDiscipline = 'all';

  function applyScheduleFilters() {
    if (!scheduleTable) return;
    let visibleCells = 0;

    scheduleTable.querySelectorAll('tbody tr').forEach((row) => {
      row.classList.remove('dim', 'hidden');
      row.querySelectorAll('td[data-day]').forEach((cell) => {
        cell.classList.remove('dim', 'hidden');
        const cellDay = cell.getAttribute('data-day');
        const cellDiscipline = cell.getAttribute('data-discipline');
        const dayMatch = currentDay === 'all' || cellDay === currentDay;
        const discMatch = currentDiscipline === 'all' || cellDiscipline === currentDiscipline;

        if (!dayMatch || !discMatch) {
          if (currentDay !== 'all' || currentDiscipline !== 'all') {
            cell.classList.add('dim');
          }
        } else {
          visibleCells++;
        }
      });
    });

    // Hide day columns entirely if filtering by day
    scheduleTable.querySelectorAll('th[data-day]').forEach((th) => {
      const day = th.getAttribute('data-day');
      if (currentDay !== 'all' && day !== currentDay) {
        th.classList.add('hidden');
      } else {
        th.classList.remove('hidden');
      }
    });
    scheduleTable.querySelectorAll('td[data-day]').forEach((cell) => {
      const day = cell.getAttribute('data-day');
      if (currentDay !== 'all' && day !== currentDay) {
        cell.classList.add('hidden');
      } else {
        cell.classList.remove('hidden');
      }
    });

    if (scheduleEmpty) {
      scheduleEmpty.hidden = !(visibleCells === 0 && (currentDay !== 'all' || currentDiscipline !== 'all'));
    }
  }

  dayFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      dayFilters.forEach((b) => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      currentDay = btn.getAttribute('data-filter');
      applyScheduleFilters();
    });
  });

  disciplineFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      disciplineFilters.forEach((b) => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      currentDiscipline = btn.getAttribute('data-discipline');
      applyScheduleFilters();
    });
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      dayFilters.forEach((b) => {
        if (b.getAttribute('data-filter') === 'all') b.classList.add('filter-btn--active');
        else b.classList.remove('filter-btn--active');
      });
      disciplineFilters.forEach((b) => {
        if (b.getAttribute('data-discipline') === 'all') b.classList.add('filter-btn--active');
        else b.classList.remove('filter-btn--active');
      });
      currentDay = 'all';
      currentDiscipline = 'all';
      applyScheduleFilters();
    });
  }

  /* ---------- BMI Calculator ---------- */
  const bmiForm = document.getElementById('bmiForm');
  const bmiOutput = document.getElementById('bmiOutput');
  const weightInput = document.getElementById('bmiWeight');
  const heightInput = document.getElementById('bmiHeight');
  const weightUnit = document.getElementById('weightUnit');
  const heightUnit = document.getElementById('heightUnit');
  const unitBtns = document.querySelectorAll('.unit-btn');

  let bmiUnit = 'imperial';

  function setUnit(unit) {
    bmiUnit = unit;
    unitBtns.forEach((b) => {
      b.classList.toggle('unit-btn--active', b.getAttribute('data-unit') === unit);
    });
    if (unit === 'imperial') {
      weightUnit.textContent = 'lb';
      heightUnit.textContent = 'in';
      if (weightInput && weightInput.placeholder === '80') weightInput.placeholder = '180';
      if (heightInput && heightInput.placeholder === '175') heightInput.placeholder = '70';
    } else {
      weightUnit.textContent = 'kg';
      heightUnit.textContent = 'cm';
      if (weightInput) weightInput.placeholder = '80';
      if (heightInput) heightInput.placeholder = '175';
    }
    if (bmiOutput && bmiOutput.querySelector('.bmi-result')) {
      computeBmi();
    }
  }

  unitBtns.forEach((btn) => {
    btn.addEventListener('click', () => setUnit(btn.getAttribute('data-unit')));
  });

  function categorize(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', note: 'BMI below 18.5. Population data suggests lower body mass relative to height. Talk to a coach for a body-composition baseline.', color: '#7aa2ff' };
    if (bmi < 25) return { label: 'Healthy Range', note: 'BMI within 18.5–24.9. Population-level "normal." Remember: BMI says nothing about muscle mass, strength, or performance.', color: '#4aff9e' };
    if (bmi < 30) return { label: 'Overweight', note: 'BMI 25–29.9. Population flag. Often benign in strength athletes with high muscle mass. Get a body-fat reading before drawing conclusions.', color: '#d4ff3f' };
    return { label: 'Obese', note: 'BMI 30+. Population health flag. Again, a lifter at 6\'2" and 240lb lean may read obese on BMI. Get proper body-composition data before reacting.', color: '#ff8c42' };
  }

  function computeBmi() {
    if (!bmiOutput || !weightInput || !heightInput) return;
    const w = parseFloat(weightInput.value);
    const h = parseFloat(heightInput.value);
    if (!w || !h || w <= 0 || h <= 0) {
      bmiOutput.innerHTML = '<div class="bmi-output__placeholder mono">INVALID.INPUT</div>';
      return;
    }

    let bmi;
    if (bmiUnit === 'imperial') {
      bmi = (w / (h * h)) * 703;
    } else {
      const hMeters = h / 100;
      bmi = w / (hMeters * hMeters);
    }

    bmi = Math.round(bmi * 10) / 10;
    const cat = categorize(bmi);

    // Marker position: BMI 15 to 40 range, clamped
    const markerPct = Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100));

    bmiOutput.innerHTML = `
      <div class="bmi-result">
        <div class="bmi-result__value tabular">${bmi.toFixed(1)}</div>
        <div class="bmi-result__category" style="color:${cat.color}">${cat.label}</div>
        <div class="bmi-bar">
          <div class="bmi-bar__marker" style="left:${markerPct}%"></div>
        </div>
        <p class="bmi-result__note">${cat.note}</p>
      </div>
    `;
  }

  if (bmiForm) {
    bmiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      computeBmi();
    });
    // Live compute on change
    [weightInput, heightInput].forEach((input) => {
      if (input) input.addEventListener('input', () => {
        if (weightInput.value && heightInput.value) computeBmi();
      });
    });
  }

  /* ---------- Trial Form (fake submit) ---------- */
  const trialForm = document.getElementById('trialForm');
  const trialSuccess = document.getElementById('trialSuccess');

  if (trialForm && trialSuccess) {
    trialForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Basic validation
      const first = trialForm.querySelector('#trialFirst');
      const last = trialForm.querySelector('#trialLast');
      const email = trialForm.querySelector('#trialEmail');
      let valid = true;
      [first, last, email].forEach((input) => {
        if (!input.value.trim()) {
          input.style.borderColor = 'var(--danger)';
          valid = false;
        } else {
          input.style.borderColor = '';
        }
      });
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.style.borderColor = 'var(--danger)';
        valid = false;
      }
      if (!valid) return;

      // Show success
      trialForm.hidden = true;
      trialSuccess.hidden = false;
      trialSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---------- Schedule page week label ---------- */
  const weekLabel = document.getElementById('weekLabel');
  if (weekLabel) {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const pad = (n) => String(n).padStart(2, '0');
    weekLabel.textContent = `WEEK OF ${pad(monday.getDate())}.${pad(monday.getMonth() + 1)}.${monday.getFullYear()}`;
  }

  /* ---------- Quick trial form on index (link to membership with email) ---------- */
  const quickTrial = document.querySelector('.hero form.trial-form');
  if (quickTrial) {
    quickTrial.addEventListener('submit', (e) => {
      const emailInput = quickTrial.querySelector('input[name="email"]');
      if (emailInput && emailInput.value) {
        // Pass email via querystring to membership page's trial form
        const url = new URL(quickTrial.action, window.location.href);
        url.searchParams.set('prefill_email', emailInput.value);
        quickTrial.action = url.toString();
      }
    });
  }

  // Prefill from querystring on membership page
  if (window.location.pathname.endsWith('membership.html')) {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('prefill_email');
    if (prefill && trialForm) {
      const emailInput = trialForm.querySelector('#trialEmail');
      if (emailInput) emailInput.value = prefill;
    }
  }

})();