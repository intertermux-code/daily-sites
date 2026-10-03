(function() {
  'use strict';

  /* ============ COUNTDOWN ============ */
  const target = new Date('2026-12-18T16:00:00Z').getTime();
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  if (daysEl && hoursEl && minsEl && secsEl) {
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      daysEl.textContent = pad(d);
      hoursEl.textContent = pad(h);
      minsEl.textContent = pad(m);
      secsEl.textContent = pad(s);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ============ SCROLL PROGRESS ============ */
  const progressBar = document.querySelector('.progress');
  if (progressBar) {
    let ticking = false;
    const updateProgress = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
      progressBar.style.transform = `scaleX(${pct})`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();
  }

  /* ============ MOBILE NAV ============ */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('primary-nav');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navToggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      navMenu.classList.toggle('open', !open);
    });
    // Close on link click
    navMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (navMenu.classList.contains('open')) {
          navToggle.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('open');
        }
      });
    });
  }

  /* ============ LINEUP FILTER ============ */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lineupGrid = document.getElementById('lineup-grid');
  const countEl = document.getElementById('artist-count');

  if (filterBtns.length && lineupGrid) {
    const state = { day: 'all', stage: 'all' };

    const applyFilter = () => {
      const cards = lineupGrid.querySelectorAll('.artist-card');
      let visible = 0;
      cards.forEach(card => {
        const dayMatch = state.day === 'all' || card.dataset.day === state.day;
        const stageMatch = state.stage === 'all' || card.dataset.stage === state.stage;
        if (dayMatch && stageMatch) {
          card.hidden = false;
          visible++;
        } else {
          card.hidden = true;
        }
      });
      if (countEl) countEl.textContent = visible;
    };

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.filter;
        const value = btn.dataset.value;
        state[group] = value;

        // Update aria-pressed within the same filter group
        document.querySelectorAll(`.filter-btn[data-filter="${group}"]`).forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-pressed', String(isActive));
        });

        applyFilter();
      });
    });
  }

  /* ============ SPRING ACCORDION (FAQ) ============ */
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length) {
    faqItems.forEach(item => {
      const toggle = item.querySelector('.faq-toggle');
      const panel = item.querySelector('.faq-panel');
      if (!toggle || !panel) return;

      toggle.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all others (only one panel open at a time)
        faqItems.forEach(other => {
          if (other !== item && other.classList.contains('open')) {
            other.classList.remove('open');
            const otherToggle = other.querySelector('.faq-toggle');
            if (otherToggle) {
              otherToggle.setAttribute('aria-expanded', 'false');
            }
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ============ LIGHTBOX (GALLERY) ============ */
  const lightbox = document.querySelector('.lightbox');
  const lbImg = lightbox?.querySelector('.lightbox-img');
  const lbMeta = lightbox?.querySelector('.lightbox-meta');
  const lbClose = lightbox?.querySelector('.lightbox-close');
  const photoBtns = document.querySelectorAll('.photo');

  if (lightbox && lbImg && lbMeta && lbClose && photoBtns.length) {
    let lastFocused = null;

    const openLB = (btn) => {
      const img = btn.querySelector('img');
      if (!img) return;
      lastFocused = document.activeElement;
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      const meta = btn.querySelector('.photo-meta');
      lbMeta.textContent = meta ? meta.textContent : '';
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    };

    const closeLB = () => {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    };

    photoBtns.forEach(btn => {
      btn.addEventListener('click', () => openLB(btn));
    });
    lbClose.addEventListener('click', closeLB);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLB();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !lightbox.hidden) closeLB();
    });
  }

  /* ============ TICKET BUTTONS ============ */
  document.querySelectorAll('[data-ticket]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const tier = btn.dataset.ticket;
      alert(`Signal received: ${tier.toUpperCase()} tier added to checkout. (Demo — connect to your ticketing provider.)`);
    });
  });

})();