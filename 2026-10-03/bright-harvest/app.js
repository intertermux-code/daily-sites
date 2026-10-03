/**
 * Bright Harvest — Shared JavaScript
 * Handles: Nav toggle, Cursor Spotlight, Clip-Path Reveals, Counter Animation, Forms
 */

document.documentElement.classList.remove('no-js');

// ============================================
// NAVIGATION TOGGLE
// ============================================
const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.getElementById('primary-nav');

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    primaryNav.classList.toggle('is-open', !isOpen);
  });

  // Close nav when clicking outside or pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && primaryNav.classList.contains('is-open')) {
      navToggle.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('is-open');
      navToggle.focus();
    }
  });

  // Close nav on link click (mobile)
  primaryNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        navToggle.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('is-open');
      }
    });
  });
}

// ============================================
// CURSOR SPOTLIGHT (Hero Only)
// ============================================
const spotlightSection = document.querySelector('[data-spotlight]');
if (spotlightSection) {
  let rafId = null;
  
  const updateSpotlight = (x, y) => {
    const rect = spotlightSection.getBoundingClientRect();
    const xPercent = ((x - rect.left) / rect.width) * 100;
    const yPercent = ((y - rect.top) / rect.height) * 100;
    
    spotlightSection.style.setProperty('--x', `${Math.max(0, Math.min(100, xPercent))}%`);
    spotlightSection.style.setProperty('--y', `${Math.max(0, Math.min(100, yPercent))}%`);
  };

  spotlightSection.addEventListener('pointermove', (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateSpotlight(e.clientX, e.clientY);
      rafId = null;
    });
  });

  // Reset on leave
  spotlightSection.addEventListener('pointerleave', () => {
    spotlightSection.style.setProperty('--x', '50%');
    spotlightSection.style.setProperty('--y', '50%');
  });
}

// ============================================
// CLIP-PATH IMAGE REVEAL (IntersectionObserver)
// ============================================
const revealElements = document.querySelectorAll('.reveal-clip');
if (revealElements.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));
} else {
  // If reduced motion or no observer support, show immediately
  revealElements.forEach(el => el.classList.add('is-visible'));
}

// ============================================
// ANIMATED COUNTERS (Index Page)
// ============================================
const counters = document.querySelectorAll('[data-target]');
if (counters.length > 0) {
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();
    
    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
    
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = Math.floor(easedProgress * target);
      
      el.textContent = current.toLocaleString() + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    };
    
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));
}

// ============================================
// DONATION FORM LOGIC
// ============================================
const donateForm = document.getElementById('donation-form');
const donateSuccess = document.getElementById('donate-success');
const customAmountInput = document.getElementById('custom-amount-input');

if (donateForm) {
  // Enable/disable custom amount input
  const amountRadios = donateForm.querySelectorAll('input[name="amount"]');
  amountRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'custom' && radio.checked) {
        customAmountInput.disabled = false;
        customAmountInput.focus();
      } else {
        customAmountInput.disabled = true;
        customAmountInput.value = '';
      }
    });
  });

  // Fake submit
  donateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('donate-submit');
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
      donateForm.hidden = true;
      donateSuccess.hidden = false;
      donateSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1800);
  });
}

// ============================================
// VOLUNTEER FORM LOGIC
// ============================================
const volForm = document.getElementById('volunteer-form');
const volSuccess = document.getElementById('vol-success');

if (volForm) {
  volForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('vol-submit');
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      volForm.hidden = true;
      volSuccess.hidden = false;
      volSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1500);
  });
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});