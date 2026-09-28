/**
 * Bright Harvest Shared Scripts
 * Handles navigation, counters, forms, and scroll reveals
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initRevealObserver();
  
  // Page specific inits based on body class or element existence
  if (document.querySelector('.ledger-value')) initCounters();
  if (document.getElementById('donation-form')) initDonationForm();
  if (document.getElementById('volunteer-form')) initVolunteerForm();
});

/* --- NAVIGATION --- */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  
  if (!toggle || !navList) return;
  
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    navList.classList.toggle('open');
  });

  // Close menu when clicking outside or on link
  document.addEventListener('click', (e) => {
    if (!navList.contains(e.target) && !toggle.contains(e.target) && navList.classList.contains('open')) {
      toggle.setAttribute('aria-expanded', 'false');
      navList.classList.remove('open');
    }
  });
}

/* --- SCROLL REVEAL --- */
function initRevealObserver() {
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-on-scroll, .reveal-group').forEach(el => observer.observe(el));
}

/* --- IMPACT COUNTERS --- */
function initCounters() {
  const counters = document.querySelectorAll('.ledger-value');
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out quart
          const ease = 1 - Math.pow(1 - progress, 4);
          
          const current = Math.floor(ease * target);
          el.textContent = current.toLocaleString() + suffix;
          
          if (progress < 1) requestAnimationFrame(update);
        }
        
        requestAnimationFrame(update);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));
}

/* --- DONATION FORM LOGIC --- */
function initDonationForm() {
  const form = document.getElementById('donation-form');
  const amountRadios = form.querySelectorAll('input[name="amount"]');
  const customWrapper = document.getElementById('custom-amount-wrapper');
  const customInput = document.getElementById('custom-amount');
  const modal = document.getElementById('thank-you-modal');
  const closeBtn = modal.querySelector('.modal-close');

  // Handle Custom Amount Toggle
  amountRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      // Update visual selection state for parent labels if needed (CSS handles most via :checked)
      if (e.target.value === 'custom') {
        customWrapper.classList.remove('hidden');
        customInput.focus();
      } else {
        customWrapper.classList.add('hidden');
        customInput.value = '';
      }
    });
  });

  // Fake Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Loading State
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing…';
    
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      form.reset();
      customWrapper.classList.add('hidden');
      
      // Show Thank You Modal
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
    }, 1500);
  });

  // Close Modal
  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    window.location.href = 'index.html';
  };

  closeBtn.addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
}

/* --- VOLUNTEER FORM LOGIC --- */
function initVolunteerForm() {
  const form = document.getElementById('volunteer-form');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    btn.disabled = true;
    btn.textContent = 'Submitting…';
    
    setTimeout(() => {
      alert('Thank you for signing up! Our volunteer coordinator will contact you within 48 hours.');
      form.reset();
      btn.disabled = false;
      btn.textContent = originalText;
    }, 1200);
  });
}