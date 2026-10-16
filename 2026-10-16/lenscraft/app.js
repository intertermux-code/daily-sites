/**
 * LENSCRAFT — Core Application Script
 * Clean vanilla JS governing interactive features and signature motions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initClipPathReveals();
  initLedgerRegistry();
  initGalleryFiltersAndLightbox();
  initBookingForm();
});

/* --------------------------------------------------------------------------
   Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !expanded);
    navMenu.classList.toggle('is-active');
  });

  // Close menu on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-active')) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-active');
    }
  });
}

/* --------------------------------------------------------------------------
   Signature Motion 2: Clip-Path Image Reveal via IntersectionObserver
   -------------------------------------------------------------------------- */
function initClipPathReveals() {
  const images = document.querySelectorAll('.reveal-image');
  if (!images.length) return;

  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    images.forEach(img => img.classList.add('is-revealed'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  images.forEach(img => observer.observe(img));
}

/* --------------------------------------------------------------------------
   Ledger / Registry Concept Interactivity
   -------------------------------------------------------------------------- */
function initLedgerRegistry() {
  const ledgerRows = document.querySelectorAll('.ledger-row');
  if (!ledgerRows.length) return;

  ledgerRows.forEach(row => {
    const summary = row.querySelector('.ledger-row-summary');
    if (!summary) return;

    summary.addEventListener('click', () => {
      const isOpen = row.hasAttribute('open');
      
      // Close other open rows for clean single-expansion registry feel
      ledgerRows.forEach(otherRow => {
        if (otherRow !== row) otherRow.removeAttribute('open');
      });

      if (isOpen) {
        row.removeAttribute('open');
      } else {
        row.setAttribute('open', 'true');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Gallery Filters & Lightbox System
   -------------------------------------------------------------------------- */
function initGalleryFiltersAndLightbox() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-card');
  const lightbox = document.getElementById('lightbox');
  
  // Filtering logic
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // Lightbox logic
  if (lightbox && galleryItems.length) {
    const lightboxImg = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const title = item.querySelector('.gallery-card-title')?.textContent || '';
        
        if (img && lightboxImg) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          if (lightboxCaption) lightboxCaption.textContent = title;
          lightbox.classList.add('is-open');
          lightbox.setAttribute('aria-hidden', 'false');
        }
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Booking Enquiry Form Validation & Simulation
   -------------------------------------------------------------------------- */
function initBookingForm() {
  const form = document.getElementById('booking-form');
  const statusDiv = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic HTML5 validation trigger check
    if (!form.checkValidity()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Simulate submission state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Transmitting Enquiry...';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      form.reset();

      if (statusDiv) {
        statusDiv.className = 'form-status success';
        statusDiv.textContent = 'Thank you. Your enquiry has been registered in our ledger. We will reach out within 24 hours.';
        statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 1200);
  });
}