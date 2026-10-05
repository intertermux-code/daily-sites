/**
 * Chapter & Verse — Interaction Layer
 * Handles: Mobile Nav, Clip-Path Reveals, Animated Counters, Book Filtering, Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initClipReveals();
  initCounters();
  initBookFilter();
  initBookClubForm();
});

/* --- MOBILE NAVIGATION --- */
function initMobileNav() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const drawer = document.getElementById('mobile-nav');
  
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
    
    if (isOpen) {
      drawer.setAttribute('hidden', '');
    } else {
      drawer.removeAttribute('hidden');
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.click();
      toggle.focus();
    }
  });
}

/* --- CLIP-PATH IMAGE REVEAL --- */
function initClipReveals() {
  const targets = document.querySelectorAll('.clip-reveal');
  if (!targets.length) return;

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger based on CSS variable if present
        const delay = entry.target.style.getPropertyValue('--delay') || '0ms';
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  targets.forEach(target => observer.observe(target));
}

/* --- ANIMATED COUNTERS --- */
function initCounters() {
  const counters = document.querySelectorAll('.counter-trigger');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const numberEl = entry.target.querySelector('.stat-number');
        const target = parseInt(numberEl.dataset.target, 10);
        
        if (prefersReducedMotion) {
          number.toLocaleString();
        } else {
          animateCounter(numberEl, target);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
  const duration = 1200;
  const startTime = performance.now();

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutExpo(progress);
    const currentValue = Math.round(easedProgress * target);

    element.textContent = currentValue.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* --- BOOK FILTER (Ledger) --- */
function initBookFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.ledger-item');
  const emptyState = document.querySelector('.empty-state');
  const resetBtn = document.querySelector('.reset-filter');

  if (!filterBtns.length || !items.length) return;

  function filterBooks(genre) {
    let visibleCount = 0;
    
    items.forEach(item => {
      const itemGenre = item.dataset.genre;
      const shouldShow = genre === 'all' || itemGenre === genre;
      
      if (shouldShow) {
        item.hidden = false;
        visibleCount++;
      } else {
        item.hidden = true;
      }
    });

    // Handle empty state
    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }

    // Update active button states
    filterBtns.forEach(btn => {
      const isActive = btn.dataset.filter === genre;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBooks(btn.dataset.filter);
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => filterBooks('all'));
  }
}

/* --- BOOK CLUB FORM VALIDATION --- */
function initBookClubForm() {
  const form = document.getElementById('bookclub-form');
  if (!form) return;

  const feedback = form.querySelector('.form-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Basic validation
    const name = form.querySelector('#full-name');
    const email = form.querySelector('#email');
    let isValid = true;

    [name, email].forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--accent-burgundy)';
        isValid = false;
      } else {
        field.style.borderColor = 'var(--border-subtle)';
      }
    });

    if (email.value && !email.value.includes('@')) {
      email.style.borderColor = 'var(--accent-burgundy)';
      isValid = false;
    }

    if (!isValid) {
      feedback.textContent = 'Please complete all required fields correctly.';
      feedback.className = 'form-feedback error';
      return;
    }

    // Simulate submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing…';
    submitBtn.disabled = true;

    setTimeout(() => {
      feedback.textContent = 'Application received. Welcome to the circle.';
      feedback.className = 'form-feedback success';
      submitBtn.textContent = 'Submitted';
      form.reset();
      
      // Reset button after delay
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 3000);
    }, 1500);
  });
}