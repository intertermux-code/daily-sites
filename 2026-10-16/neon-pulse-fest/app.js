/**
 * NEON PULSE 2026 — MAIN APPLICATION SCRIPT
 * Handles signature motion, filters, live countdown, modal checkout, and interactive UI states.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initBlurFadeObserver();
  initAnimatedCounters();
  initCountdownTimer();
  initLineupFilters();
  initCheckoutModal();
  initFaqAccordion();
  initNewsletterForms();
});

/* -------------------------------------------------------------------------- */
/* 1. MOBILE NAVIGATION TOGGLE                                                */
/* -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('.primary-nav');

  if (!toggleBtn || !nav) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    nav.classList.toggle('active');
  });
}

/* -------------------------------------------------------------------------- */
/* 2. SIGNATURE MOTION: BLUR-FADE ASCEND                                      */
/* -------------------------------------------------------------------------- */
function initBlurFadeObserver() {
  const elements = document.querySelectorAll('.blur-fade');
  if (!elements.length) return;

  // Honor prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger sibling elements by 80ms
        setTimeout(() => {
          entry.target.classList.add('in');
        }, index * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
}

/* -------------------------------------------------------------------------- */
/* 3. SIGNATURE MOTION: ANIMATED COUNTERS                                     */
/* -------------------------------------------------------------------------- */
function initAnimatedCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        animateValue(el, 0, target, 1200, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(num => observer.observe(num));
}

function animateValue(element, start, end, duration, suffix) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // easeOutExpo formula
    const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentValue = Math.floor(easedProgress * (end - start) + start);
    
    element.textContent = currentValue.toLocaleString() + suffix;
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

/* -------------------------------------------------------------------------- */
/* 4. LIVE FESTIVAL COUNTDOWN TIMER                                           */
/* -------------------------------------------------------------------------- */
function initCountdownTimer() {
  const countdownEl = document.getElementById('festival-countdown');
  if (!countdownEl) return;

  const targetDateStr = countdownEl.getAttribute('data-target') || '2026-12-18T18:00:00';
  const targetDate = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      countdownEl.innerHTML = "<div class='pill-tag'>TRANSMISSION IS LIVE!</div>";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* -------------------------------------------------------------------------- */
/* 5. LINEUP FILTER SYSTEM                                                    */
/* -------------------------------------------------------------------------- */
function initLineupFilters() {
  const dayBtns = document.querySelectorAll('[data-filter-day]');
  const stageBtns = document.querySelectorAll('[data-filter-stage]');
  const artistCards = document.querySelectorAll('.artist-schedule-card');
  const noResultsMsg = document.getElementById('no-results-msg');
  const resetBtn = document.getElementById('reset-filters-btn');

  if (!dayBtns.length && !stageBtns.length) return;

  let activeDay = 'all';
  let activeStage = 'all';

  function applyFilters() {
    let visibleCount = 0;

    artistCards.forEach(card => {
      const cardDay = card.getAttribute('data-day');
      const cardStage = card.getAttribute('data-stage');

      const matchesDay = (activeDay === 'all' || cardDay === activeDay);
      const matchesStage = (activeStage === 'all' || cardStage === activeStage);

      if (matchesDay && matchesStage) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (noResultsMsg) {
      if (visibleCount === 0) {
        noResultsMsg.classList.remove('hidden');
      } else {
        noResultsMsg.classList.add('hidden');
      }
    }
  }

  dayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dayBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      activeDay = btn.getAttribute('data-filter-day');
      applyFilters();
    });
  });

  stageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stageBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      activeStage = btn.getAttribute('data-filter-stage');
      applyFilters();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeDay = 'all';
      activeStage = 'all';

      dayBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter-day') === 'all'));
      stageBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter-stage') === 'all'));

      applyFilters();
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 6. CHECKOUT MODAL SIMULATION                                               */
/* -------------------------------------------------------------------------- */
function initCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const openBtns = document.querySelectorAll('.open-checkout-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const form = document.getElementById('checkout-form');
  const successBlock = document.getElementById('checkout-success');
  const resetBtn = document.getElementById('modal-reset-btn');

  if (!modal) return;

  const tierDisplay = document.getElementById('checkout-tier-name');
  const summaryTierDisplay = document.getElementById('summary-tier-display');
  const qtySelect = document.getElementById('pass-qty');
  const totalPriceEl = document.getElementById('summary-total-price');

  let basePrice = 329;

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tierName = btn.getAttribute('data-tier') || 'Tier 2 Pass';
      basePrice = parseFloat(btn.getAttribute('data-price')) || 329;

      if (tierDisplay) tierDisplay.textContent = tierName;
      if (summaryTierDisplay) summaryTierDisplay.textContent = tierName;

      updateTotal();
      modal.classList.remove('hidden');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (qtySelect) {
    qtySelect.addEventListener('change', updateTotal);
  }

  function updateTotal() {
    if (!qtySelect || !totalPriceEl) return;
    const qty = parseInt(qtySelect.value, 10);
    const fee = 12.50;
    const total = (basePrice * qty) + fee;
    totalPriceEl.textContent = `$${total.toFixed(2)}`;
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.add('hidden');
      if (successBlock) successBlock.classList.remove('hidden');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      if (form) form.classList.remove('hidden');
      if (successBlock) successBlock.classList.add('hidden');
      if (form) form.reset();
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 7. FAQ ACCORDION TOGGLE                                                    */
/* -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  if (!accordionHeaders.length) return;

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = document.getElementById(header.getAttribute('aria-controls'));
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      // Close all others
      accordionHeaders.forEach(h => {