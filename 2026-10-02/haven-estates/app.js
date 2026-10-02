(() => {
  'use strict';

  // ========== MOBILE NAV ==========
  const navToggle = document.querySelector('.nav__toggle');
  const navList = document.querySelector('.nav__list');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navList.classList.toggle('is-open', !isOpen);
    });
    navList.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navList.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ========== BLUR-FADE ASCEND (Primary motion: secondary) ==========
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion) {
    const revealEls = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  // ========== ANIMATED COUNTERS (Primary motion) ==========
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const formatNum = new Intl.NumberFormat('en-US').format;

  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && !reducedMotion) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(el => {
      el.textContent = formatNum(parseInt(el.dataset.target, 10));
    });
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutExpo(progress);
      const value = Math.round(eased * target);
      el.textContent = formatNum(value);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ========== LISTINGS FILTER ==========
  const filtersForm = document.getElementById('filters-form');
  const listingsGrid = document.getElementById('listings-grid');
  const listingsEmpty = document.getElementById('listings-empty');
  const filtersCount = document.getElementById('filters-count');

  if (filtersForm && listingsGrid) {
    const cards = Array.from(listingsGrid.querySelectorAll('.card--listing'));
    const total = cards.length;

    function applyFilters() {
      const f = new FormData(filtersForm);
      const location = f.get('location') || 'all';
      const minPrice = parseInt(f.get('minprice') || '0', 10);
      const maxPrice = parseInt(f.get('maxprice') || '99999999', 10);
      const minBeds = parseInt(f.get('beds') || '0', 10);

      let shown = 0;
      cards.forEach(card => {
        const cLoc = card.dataset.location;
        const cPrice = parseInt(card.dataset.price, 10);
        const cBeds = parseInt(card.dataset.beds, 10);

        const matchLoc = location === 'all' || cLoc === location;
        const matchPrice = cPrice >= minPrice && cPrice <= maxPrice;
        const matchBeds = cBeds >= minBeds;
        const show = matchLoc && matchPrice && matchBeds;

        card.hidden = !show;
        if (show) shown++;
      });

      if (filtersCount) {
        filtersCount.textContent = `Showing ${shown} of ${total}`;
      }
      if (listingsEmpty) {
        listingsEmpty.hidden = shown > 0;
      }
    }

    filtersForm.addEventListener('change', applyFilters);
    filtersForm.addEventListener('input', applyFilters);

    const resetBtn = document.getElementById('filters-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        filtersForm.reset();
        applyFilters();
      });
    }
  }

  // ========== GALLERY (PROPERTY PAGE) ==========
  const mainImg = document.getElementById('gallery-main');
  const thumbs = document.querySelectorAll('.gallery__thumb');
  if (mainImg && thumbs.length) {
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = thumb.dataset.src;
          mainImg.alt = thumb.dataset.alt || '';
          mainImg.style.opacity = '1';
        }, 200);
      });
    });
  }

  // ========== TOUR PLAY ==========
  const tourPlay = document.querySelector('.tour-play');
  if (tourPlay) {
    tourPlay.addEventListener('click', () => {
      // Demo behavior — in production this opens a modal/lightbox
      alert('Virtual tour would launch here. For privacy, Haven shares tours only with qualified buyers upon request.');
    });
  }

  // ========== MORTGAGE CALCULATOR ==========
  const mortgageForm = document.getElementById('mortgage-form');
  const monthlyEl = document.getElementById('m-monthly');
  const piEl = document.getElementById('m-pi');
  const loanEl = document.getElementById('m-loan');
  const interestEl = document.getElementById('m-interest');

  if (mortgageForm && monthlyEl) {
    const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

    const termChips = mortgageForm.querySelectorAll('.term-chip');
    const yearsInput = mortgageForm.querySelector('#m-years');
    termChips.forEach(chip => {
      chip.addEventListener('click', () => {
        termChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        yearsInput.value = chip.dataset.years;
        calculateMortgage();
      });
    });

    function calculateMortgage() {
      const f = new FormData(mortgageForm);
      const price = parseFloat(f.get('price')) || 0;
      const downPct = parseFloat(f.get('down')) || 0;
      const annualRate = parseFloat(f.get('rate')) || 0;
      const years = parseFloat(f.get('years')) || 30;

      const loan = price * (1 - downPct / 100);
      const n = years * 12;
      const r = (annualRate / 100) / 12;

      let monthly = 0;
      if (r === 0) {
        monthly = loan / n;
      } else if (loan > 0 && n > 0) {
        monthly = loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      }

      const totalPaid = monthly * n;
      const totalInterest = Math.max(0, totalPaid - loan);

      if (monthlyEl) monthlyEl.textContent = '$' + fmt.format(monthly);
      if (piEl) piEl.textContent = '$' + fmt.format(monthly);
      if (loanEl) loanEl.textContent = '$' + fmt.format(loan);
      if (interestEl) interestEl.textContent = '$' + fmt.format(totalInterest);
    }

    mortgageForm.addEventListener('input', calculateMortgage);
    calculateMortgage();
  }

  // ========== ENQUIRY FORM ==========
  const enquiryForm = document.getElementById('enquiry-form');
  const formStatus = document.getElementById('form-status');
  if (enquiryForm && formStatus) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const required = enquiryForm.querySelectorAll('[required]');
      let valid = true;
      required.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = '#c84040';
          setTimeout(() => { input.style.borderColor = ''; }, 2500);
        }
      });

      const email = enquiryForm.querySelector('#f-email');
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        valid = false;
        email.style.borderColor = '#c84040';
        setTimeout(() => { email.style.borderColor = ''; }, 2500);
      }

      if (!valid) {
        formStatus.className = 'form-status form-status--error';
        formStatus.textContent = 'Please complete the highlighted fields.';
        return;
      }

      const submitBtn = enquiryForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      // Simulated send
      setTimeout(() => {
        formStatus.className = 'form-status form-status--success';
        formStatus.textContent = 'Thank you. A founding partner will be in touch within one business day.';
        submitBtn.textContent = 'Enquiry Sent';
        enquiryForm.reset();
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 4000);
      }, 900);
    });
  }

  // ========== HERO SEARCH ==========
  const heroSearch = document.getElementById('hero-search');
  if (heroSearch) {
    heroSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = heroSearch.value.trim();
        if (q) {
          window.location.href = 'listings.html?q=' + encodeURIComponent(q);
        } else {
          window.location.href = 'listings.html';
        }
      }
    });
  }

})();