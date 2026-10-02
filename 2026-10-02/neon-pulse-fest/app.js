// Neon Pulse — app.js
// Page-specific logic, guarded by element existence checks.

(function () {
  'use strict';

  // =========================================
  // Mobile menu toggle
  // =========================================
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      mobileNav.classList.toggle('open');
    });
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
    // Close when clicking a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // =========================================
  // Countdown to 2026-12-18T18:00:00 PST
  // =========================================
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMins = document.getElementById('cd-mins');
  const cdSecs = document.getElementById('cd-secs');

  if (cdDays && cdHours && cdMins && cdSecs) {
    const target = new Date('2026-12-18T18:00:00-08:00').getTime();

    const pad = (n) => String(n).padStart(2, '0');

    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        cdDays.textContent = '00';
        cdHours.textContent = '00';
        cdMins.textContent = '00';
        cdSecs.textContent = '00';
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      cdDays.textContent = pad(days);
      cdHours.textContent = pad(hours);
      cdMins.textContent = pad(mins);
      cdSecs.textContent = pad(secs);
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // =========================================
  // Word-Stagger Headline (signature motion #2)
  // =========================================
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.stagger-word').forEach(el => {
    const text = el.textContent.trim();
    if (!text) return;
    el.textContent = '';
    const words = text.split(/\s+/);
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.textContent = word;
      if (!prefersReduced) {
        span.style.animationDelay = `${i * 60}ms`;
      }
      el.appendChild(span);
      if (i < words.length - 1) {
        // Preserve visual space but keep words separate
        // (padding-right in CSS handles word gap)
      }
    });
  });

  // =========================================
  // Clip-Path Image Reveal (signature motion #1)
  // =========================================
  if ('IntersectionObserver' in window && !prefersReduced) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Slight stagger based on entry order within viewport
          const delay = Math.min(idx * 30, 300);
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.clip-reveal').forEach(el => {
      revealObserver.observe(el);
    });
  } else {
    // Reduced motion or no IO: show all immediately
    document.querySelectorAll('.clip-reveal').forEach(el => {
      el.classList.add('revealed');
    });
  }

  // =========================================
  // Lineup Filter
  // =========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lineupGrid = document.getElementById('lineup-grid');
  const lineupEmpty = document.querySelector('.lineup-empty');

  if (filterBtns.length && lineupGrid) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');

        const cards = lineupGrid.querySelectorAll('.lineup-card');
        let visibleCount = 0;
        cards.forEach(card => {
          const match = filter === 'all' ||
                        card.dataset.night === filter ||
                        card.dataset.stage === filter;
          if (match) {
            card.hidden = false;
            card.removeAttribute('hidden');
            visibleCount++;
          } else {
            card.hidden = true;
            card.setAttribute('hidden', '');
          }
        });

        if (lineupEmpty) {
          lineupEmpty.hidden = visibleCount > 0;
        }
      });
    });

    // Keyboard navigation within filter bar
    filterBtns.forEach((btn, idx) => {
      btn.addEventListener('keydown', (e) => {
        let target = null;
        if (e.key === 'ArrowRight') {
          target = filterBtns[(idx + 1) % filterBtns.length];
        } else if (e.key === 'ArrowLeft') {
          target = filterBtns[(idx - 1 + filterBtns.length) % filterBtns.length];
        }
        if (target) {
          e.preventDefault();
          target.focus();
          target.click();
        }
      });
    });
  }

  // =========================================
  // FAQ Accordion
  // =========================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-question');
    const content = item.querySelector('.faq-answer');
    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const open = item.classList.contains('open');
      // Close all others in same group
      const group = item.parentElement;
      group.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherTrigger = other.querySelector('.faq-question');
          const otherContent = other.querySelector('.faq-answer');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.hidden = true;
        }
      });
      item.classList.toggle('open', !open);
      trigger.setAttribute('aria-expanded', String(!open));
      content.hidden = open;
    });
  });

  // =========================================
  // Ticket tier selection
  // =========================================
  const tierButtons = document.querySelectorAll('.ticket-tier .btn');
  tierButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tier = btn.dataset.tier;
      const soldOut = btn.dataset.soldOut === 'true';
      if (soldOut) {
        const ok = confirm(`${tier} is currently sold out. Would you like to be added to the waitlist?`);
        if (ok) {
          alert(`You've been added to the ${tier} waitlist. We'll email you if a pass opens.`);
        }
        return;
      }
      const confirmed = confirm(`Secure a ${tier} pass? You will be redirected to our checkout.`);
      if (confirmed) {
        // In production, redirect to checkout
        alert(`Initiating secure checkout for ${tier} pass… (demo)`);
      }
    });
  });

  // =========================================
  // Gallery Lightbox
  // =========================================
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('.lightbox-img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
  let lastFocused = null;

  const openLightbox = (img) => {
    if (!lightbox || !lightboxImg) return;
    lastFocused = document.activeElement;
    // Swap in higher-res variant
    const hiRes = img.src.replace(/w=\d+/, 'w=2000');
    lightboxImg.src = hiRes;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    if (lightboxClose) {
      setTimeout(() => lightboxClose.focus(), 100);
    }
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  };

  if (galleryItems.length && lightbox) {
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) openLightbox(img);
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
      }
    });
  }

  // =========================================
  // Newsletter form
  // =========================================
  document.querySelectorAll('.newsletter').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button[type="submit"]');
      if (!input || !btn || !input.value) return;

      const originalText = btn.textContent;
      const originalBg = btn.style.background;
      btn.textContent = '✓';
      btn.style.background = 'var(--cyan)';
      btn.disabled = true;

      setTimeout(() => {
        input.value = '';
        btn.textContent = originalText;
        btn.style.background = originalBg;
        btn.disabled = false;
      }, 2400);
    });
  });

  // =========================================
  // Smooth anchor scroll offset for fixed header
  // =========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 90;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

})();