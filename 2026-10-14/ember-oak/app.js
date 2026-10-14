/**
 * EMBER & OAK — Interactive Functionality
 * Includes:
 * 1. Signature Motion: Magnetic Buttons (rAF lerp)
 * 2. Signature Motion: Parallax Layers (rAF scroll)
 * 3. IntersectionObserver Scroll Reveal
 * 4. Responsive Navigation Drawer
 * 5. Menu Category Tab Switching
 * 6. Lightbox Gallery Modal with keyboard accessibility
 * 7. Reservation Form Validation & Instant Confirmation State
 */

document.addEventListener('DOMContentLoaded', () => {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. NAVIGATION TOGGLE (MOBILE)
     ========================================================================== */
  const navToggle = document.getElementById('nav-toggle');
  const primaryNav = document.getElementById('primary-navigation');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !expanded);
      primaryNav.classList.toggle('is-open');
    });
  }

  /* ==========================================================================
     2. SIGNATURE MOTION: MAGNETIC BUTTONS
     ========================================================================== */
  if (!isReducedMotion) {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach((btn) => {
      let mouseX = 0, mouseY = 0;
      let currentX = 0, currentY = 0;
      let isHovered = false;

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        mouseX = e.clientX - (rect.left + rect.width / 2);
        mouseY = e.clientY - (rect.top + rect.height / 2);
        isHovered = true;
      });

      btn.addEventListener('mouseleave', () => {
        isHovered = false;
        mouseX = 0;
        mouseY = 0;
      });

      function animate() {
        if (isHovered) {
          currentX += (mouseX * 0.35 - currentX) * 0.15;
          currentY += (mouseY * 0.35 - currentY) * 0.15;
          btn.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.04)`;
        } else {
          currentX += (0 - currentX) * 0.15;
          currentY += (0 - currentY) * 0.15;
          btn.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;
        }
        requestAnimationFrame(animate);
      }
      animate();
    });
  }

  /* ==========================================================================
     3. SIGNATURE MOTION: PARALLAX LAYERS
     ========================================================================== */
  if (!isReducedMotion) {
    const parallaxLayers = document.querySelectorAll('.parallax-layer');

    function updateParallax() {
      const scrolled = window.pageYOffset;
      parallaxLayers.forEach((layer) => {
        const speed = parseFloat(layer.getAttribute('data-speed')) || 0.1;
        const yPos = scrolled * speed;
        layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
      requestAnimationFrame(updateParallax);
    }

    if (parallaxLayers.length > 0) {
      window.addEventListener('scroll', () => {
        requestAnimationFrame(updateParallax);
      }, { passive: true });
    }
  }

  /* ==========================================================================
     4. INTERSECTION OBSERVER SCROLL REVEALS
     ========================================================================== */
  const revealElements = document.querySelectorAll('[data-reveal]');

  if (revealElements.length > 0) {
    if (isReducedMotion) {
      revealElements.forEach(el => el.classList.add('revealed'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      revealElements.forEach((el) => observer.observe(el));
    }
  }

  /* ==========================================================================
     5. MENU TABS (MENU.HTML)
     ========================================================================== */
  const tabBtns = document.querySelectorAll('.menu-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabBtns.length > 0) {
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach(p => p.classList.add('hidden'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetId = btn.getAttribute('aria-controls');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
        }
      });
    });
  }

  /* ==========================================================================
     6. LIGHTBOX MODAL (GALLERY.HTML)
     ========================================================================== */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (galleryItems.length > 0 && lightboxModal) {
    galleryItems.forEach((item) => {
      item.addEventListener('click', () => {
        const fullSrc = item.getAttribute('data-full');
        const caption = item.getAttribute('data-caption');

        lightboxImg.setAttribute('src', fullSrc);
        lightboxImg.setAttribute('alt', caption || 'Gallery image');
        lightboxCaption.textContent = caption;

        lightboxModal.classList.remove('hidden');
        lightboxModal.setAttribute('aria-hidden', 'false');
        lightboxClose.focus();
      });
    });

    const closeLightbox = () => {
      lightboxModal.classList.add('hidden');
      lightboxModal.setAttribute('aria-hidden', 'true');
      lightboxImg.setAttribute('src', '');
    };

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.getAttribute('aria-hidden') === 'false') {
        closeLightbox();
      }
    });
  }

  /* ==========================================================================
     7. RESERVATION FORM VALIDATION & CONFIRMATION STATE (RESERVATIONS.HTML)
     ========================================================================== */
  const bookingForm = document.getElementById('booking-form');
  const bookingSuccess = document.getElementById('booking-success');
  const resetBtn = document.getElementById('reset-booking-btn');

  if (bookingForm) {
    // Set minimum date to today
    const dateInput = document.getElementById('res-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const fields = [
        { id: 'full-name', errId: 'err-fullName', validate: val => val.trim().length > 1 },
        { id: 'phone-number', errId: 'err-phone', validate: val => /^[0-9\-\+\s\(\)]{7,}$/.test(val.trim()) },
        { id: 'email-address', errId: 'err-email', validate: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) },
        { id: 'res-date', errId: 'err-date', validate: val => val !== '' },
        { id: 'party-size', errId: 'err-partySize', validate: val => val !== '' }
      ];

      fields.forEach(f => {
        const input = document.getElementById(f.id);
        const group = input.closest('.form-group');
        if (!f.validate(input.value)) {
          group.classList.add('has-error');
          isValid = false;
        } else {
          group.classList.remove('has-error');
        }
      });

      if (isValid) {
        // Collect Values
        const nameVal = document.getElementById('full-name').value;
        const dateVal = document.getElementById('res-date').value;
        const partyVal = document.getElementById('party-size').value;
        const seatingVal = document.getElementById('seating-area').options[document.getElementById('seating-area').selectedIndex].text;

        // Populate Success Card
        document.getElementById('conf-name').textContent = nameVal;
        document.getElementById('conf-date-time').textContent = `${dateVal} at 7:30 PM`;
        document.getElementById('conf-guests').textContent = `${partyVal} Guest${partyVal > 1 ? 's' : ''}`;
        document.getElementById('conf-seating').textContent = seatingVal;
        document.getElementById('conf-code').textContent = `#EO-${Math.floor(1000 + Math.random() * 9000)}`;

        // Toggle UI State
        bookingForm.classList.add('hidden');
        bookingSuccess.classList.remove('hidden');
        bookingSuccess.scrollIntoView({ behavior: 'smooth' });
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        bookingForm.reset();
        bookingForm.classList.remove('hidden');
        bookingSuccess.classList.add('hidden');
      });
    }
  }
});