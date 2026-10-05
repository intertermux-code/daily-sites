/**
 * EMBER & OAK — Shared JavaScript
 * Handles: Navigation, Parallax, Spring Accordions, Tabs, 
 * Gallery Lightbox, Reservation Form Validation, Scroll Reveals
 */

(function () {
  'use strict';

  // --- UTILITIES ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function qs(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  // --- MOBILE NAVIGATION ---
  const navToggle = qs('.nav-toggle');
  const navList = qs('.nav-list');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('is-open');
    });

    // Close nav when clicking a link
    qsa('a', navList).forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navList.classList.remove('is-open');
      });
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

  // --- PARALLAX (Hero only, disabled on reduced motion) ---
  if (!prefersReducedMotion) {
    const parallaxLayers = qsa('.parallax-layer[data-speed]');
    
    if (parallaxLayers.length > 0) {
      let ticking = false;

      function updateParallax() {
        const scrollY = window.scrollY;
        parallaxLayers.forEach(layer => {
          const speed = parseFloat(layer.dataset.speed) || 0;
          const yOffset = scrollY * speed;
          layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
        });
        ticking = false;
      }

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // --- SPRING ACCORDION ---
  const accordionTriggers = qsa('.accordion-trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      const panelId = trigger.getAttribute('aria-controls');
      const panel = qs(`#${panelId}`);

      // Close all others (single-open behavior)
      accordionTriggers.forEach(otherTrigger => {
        if (otherTrigger !== trigger) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          const otherPanelId = otherTrigger.getAttribute('aria-controls');
          const otherPanel = qs(`#${otherPanelId}`);
          if (otherPanel) {
            otherPanel.style.gridTemplateRows = '0fr';
            otherPanel.setAttribute('aria-hidden', 'true');
          }
        }
      });

      // Toggle current
      trigger.setAttribute('aria-expanded', String(!expanded));
      if (panel) {
        if (!expanded) {
          panel.style.gridTemplateRows = '1fr';
          panel.setAttribute('aria-hidden', 'false');
        } else {
          panel.style.gridTemplateRows = '0fr';
          panel.setAttribute('aria-hidden', 'true');
        }
      }
    });
  });

  // Initialize accordion panels as closed
  qsa('.accordion-panel').forEach(panel => {
    panel.style.gridTemplateRows = '0fr';
    panel.setAttribute('aria-hidden', 'true');
  });

  // --- MENU TABS ---
  const tabButtons = qsa('.tab-btn');
  const tabPanels = qsa('.menu-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');

      // Deactivate all
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => {
        p.classList.remove('active');
        p.hidden = true;
      });

      // Activate clicked
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetPanel = qs(`#${targetId}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.hidden = false;
      }
    });

    // Keyboard navigation for tabs
    btn.addEventListener('keydown', (e) => {
      const currentIndex = tabButtons.indexOf(btn);
      let newIndex;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (currentIndex + 1) % tabButtons.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = tabButtons.length - 1;
      }

      if (newIndex !== undefined) {
        tabButtons[newIndex].focus();
        tabButtons[newIndex].click();
      }
    });
  });

  // --- GALLERY LIGHTBOX ---
  const galleryItems = qsa('.gallery-item');
  const lightbox = qs('#gallery-lightbox');
  const lightboxImg = qs('#lightbox-img');
  const lightboxCaption = qs('#lightbox-caption');
  const lightboxClose = qs('.lightbox-close');
  const lightboxPrev = qs('.lightbox-prev');
  const lightboxNext = qs('.lightbox-next');

  let currentLightboxIndex = 0;
  let previousFocusElement = null;

  function openLightbox(index) {
    currentLightboxIndex = index;
    const item = galleryItems[index];
    const img = qs('img', item);
    const caption = qs('figcaption', item);

    lightboxImg.src = img.src.replace('w=600', 'w=1600').replace('w=800', 'w=1600').replace('w=1200', 'w=1600');
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = caption ? caption.textContent : '';

    previousFocusElement = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (previousFocusElement) previousFocusElement.focus();
  }

  function navigateLightbox(direction) {
    currentLightboxIndex = (currentLightboxIndex + direction + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentLightboxIndex];
    const img = qs('img', item);
    const caption = qs('figcaption', item);

    lightboxImg.src = img.src.replace('w=600', 'w=1600').replace('w=800', 'w=1600').replace('w=1200', 'w=1600');
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = caption ? caption.textContent : '';
  }

  galleryItems.forEach((item, index) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `View image: ${qs('figcaption', item)?.textContent || 'Gallery image'}`);

    item.addEventListener('click', () => openLightbox(index));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });
  });

  if (lightbox) {
    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', () => navigateLightbox(-1));
    lightboxNext?.addEventListener('click', () => navigateLightbox(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Trap focus inside lightbox
    lightbox.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', lightbox);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // --- RESERVATION FORM VALIDATION ---
  const bookingForm = qs('#booking-form');
  const successMessage = qs('#success-message');
  const bookAnotherBtn = qs('#book-another');

  if (bookingForm) {
    // Set min date to today
    const dateInput = qs('#res-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    function showError(input, message) {
      input.classList.add('invalid');
      const errorEl = input.parentElement.querySelector('.error-msg');
      if (errorEl) errorEl.textContent = message;
    }

    function clearError(input) {
      input.classList.remove('invalid');
      const errorEl = input.parentElement.querySelector('.error-msg');
      if (errorEl) errorEl.textContent = '';
    }

    function validateField(input) {
      const value = input.value.trim();
      const name = input.name;

      if (input.required && !value) {
        showError(input, 'This field is required.');
        return false;
      }

      if (name === 'phone') {
        const phoneRegex = /^[\d\s\-\(\)\+]{7,}$/;
        if (!phoneRegex.test(value)) {
          showError(input, 'Please enter a valid phone number.');
          return false;
        }
      }

      if (name === 'date') {
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
          showError(input, 'Please select a future date.');
          return false;
        }
        // Check if Monday (day 1)
        if (selected.getDay() === 1) {
          showError(input, 'We are closed on Mondays.');
          return false;
        }
      }

      clearError(input);
      return true;
    }

    // Inline validation on blur
    qsa('input, select, textarea', bookingForm).forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('invalid')) validateField(field);
      });
    });

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fields = qsa('input[required], select[required]', bookingForm);
      let isValid = true;

      fields.forEach(field => {
        if (!validateField(field)) isValid = false;
      });

      const statusEl = qs('.form-status');

      if (!isValid) {
        statusEl.className = 'form-status error';
        statusEl.textContent = 'Please correct the errors above.';
        // Focus first invalid field
        const firstInvalid = qs('.invalid', bookingForm);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Simulate submission
      statusEl.className = 'form-status loading';
      statusEl.textContent = 'Confirming your table…';

      const submitBtn = qs('[type="submit"]', bookingForm);
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing…';

      setTimeout(() => {
        // Show success state
        const name = qs('#guest-name').value.split(' ')[0];
        const size = qs('#party-size').value;
        const date = qs('#res-date').value;
        const time = qs('#res-time');
        const timeText = time.options[time.selectedIndex].text;
        const phone = qs('#guest-phone').value;

        qs('#confirm-name').textContent = name;
        qs('#confirm-details').textContent = `${size} guest${size > 1 ? 's' : ''} on ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${timeText}`;
        qs('#confirm-phone').textContent = phone;

        bookingForm.hidden = true;
        successMessage.hidden = false;
        successMessage.focus();
      }, 1500);
    });
  }

  if (bookAnotherBtn) {
    bookAnotherBtn.addEventListener('click', () => {
      successMessage.hidden = true;
      bookingForm.hidden = false;
      bookingForm.reset();
      const submitBtn = qs('[type="submit"]', bookingForm);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Reservation';
      qs('.form-status').textContent = '';
      qsa('.error-msg', bookingForm).forEach(el => el.textContent = '');
      qsa('.invalid', bookingForm).forEach(el => el.classList.remove('invalid'));
    });
  }

  // --- SCROLL REVEAL (IntersectionObserver) ---
  if (!prefersReducedMotion) {
    const revealElements = qsa('.reveal-on-scroll');

    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
      });

      revealElements.forEach(el => observer.observe(el));
    } else {
      // Fallback: show everything
      revealElements.forEach(el => el.classList.add('is-visible'));
    }
  } else {
    // Reduced motion: show everything immediately
    qsa('.reveal-on-scroll').forEach(el => el.classList.add('is-visible'));
  }

})();