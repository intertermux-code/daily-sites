document.addEventListener('DOMContentLoaded', () => {

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. Mobile Navigation Toggle
     ========================================================================== */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('is-active');
    });
  }

  /* ==========================================================================
     2. Primary Motion: Clip-Path Image Reveal via IntersectionObserver
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal-clip');

  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.15
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  /* ==========================================================================
     3. Secondary Motion: Parallax Layering (Hero Elements)
     ========================================================================== */
  const parallaxTargets = document.querySelectorAll('[data-speed]');

  if (parallaxTargets.length > 0 && !prefersReducedMotion) {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          parallaxTargets.forEach(target => {
            const speed = parseFloat(target.getAttribute('data-speed')) || 0.1;
            const yPos = -(scrolled * speed);
            target.style.transform = `translate3d(0, ${yPos}px, 0)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ==========================================================================
     4. Journeys Detail Modal Implementation
     ========================================================================== */
  const modalTriggers = document.querySelectorAll('.modal-trigger');
  const modalCloseBtns = document.querySelectorAll('.modal-close');
  const modalBackdrops = document.querySelectorAll('.modal-backdrop');

  if (modalTriggers.length > 0) {
    modalTriggers.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetModal = document.getElementById(targetId);
        if (targetModal) {
          targetModal.classList.add('is-open');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    modalCloseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) {
          modal.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    });

    modalBackdrops.forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modalBackdrops.forEach(modal => modal.classList.remove('is-open'));
        document.body.style.overflow = '';
      }
    });
  }

  /* ==========================================================================
     5. Destination Guide: Interactive Month Picker
     ========================================================================== */
  const monthBtns = document.querySelectorAll('.month-btn');
  const monthTitle = document.getElementById('month-title');
  const monthDesc = document.getElementById('month-desc');

  const monthData = {
    jan: { title: "January — Quiet Winter Solitude", desc: "Crisp snowy landscapes in Kyoto temple gardens. Ideal for hot spring retreats with very few crowds.", score: "8.5 / 10", temp: "5°C (41°F)" },
    feb: { title: "February — Plum Blossom Season", desc: "Early fragrant plum blossoms bloom at Kitano Tenmangu shrine. Cold, serene, and intimate.", score: "8.8 / 10", temp: "7°C (45°F)" },
    mar: { title: "March — Spring Awakenings", desc: "Temperate weather with early weeping cherry blossoms appearing toward the end of the month.", score: "9.1 / 10", temp: "13°C (55°F)" },
    apr: { title: "April — Peak Cherry Blossom", desc: "Breathtaking pink canopy across philosopher's path. High visitor interest; early morning walks essential.", score: "8.9 / 10", temp: "19°C (66°F)" },
    may: { title: "May — Lush Fresh Greenery (Shinryoku)", desc: "Our favorite month. Brilliant fresh green maple leaves, perfect hiking weather, and moderate quiet.", score: "9.8 / 10", temp: "24°C (75°F)" },
    jun: { title: "June — Rainy Season & Moss Gardens", desc: "Gentle rain highlights the electric green of moss sanctuaries like Saiho-ji. Highly atmospheric.", score: "9.0 / 10", temp: "26°C (79°F)" },
    jul: { title: "July — Gion Matsuri Festival", desc: "Rich cultural heritage processions in the city center. Warm summer evenings with river dining.", score: "8.2 / 10", temp: "31°C (88°F)" },
    aug: { title: "August — Mountain Escapes", desc: "Escape to the cooler cedar forests of Kurama and Kibune for traditional riverbed dining.", score: "8.0 / 10", temp: "33°C (91°F)" },
    sep: { title: "September — Ideal Transition", desc: "Summer heat tapers off. Quiet temple gardens, early autumn breezes, and minimal tour groups.", score: "9.5 / 10", temp: "27°C (80°F)" },
    oct: { title: "October — Golden Autumn Days", desc: "Crisp blue skies and comfortable walking temperatures. Ideal for cycling through Arashiyama.", score: "9.7 / 10", temp: "21°C (70°F)" },
    nov: { title: "November — Peak Autumn Maple Foliage", desc: "Vibrant crimson and gold maple leaves across all temple gardens. Breathtaking visual wonder.", score: "9.6 / 10", temp: "15°C (59°F)" },
    dec: { title: "December — Winter Stillness", desc: "Peaceful end-of-year atmosphere with glowing lanterns and crisp starlit night skies.", score: "8.7 / 10", temp: "9°C (48°F)" }
  };

  if (monthBtns.length > 0 && monthTitle && monthDesc) {
    monthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        monthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const monthKey = btn.getAttribute('data-month');
        const data = monthData[monthKey];

        if (data) {
          monthTitle.textContent = data.title;
          monthDesc.innerHTML = `${data.desc}<br><span style="display:inline-block; margin-top:0.5rem; font-family:var(--font-mono); font-size:0.85rem;"><strong>Average Temp:</strong> ${data.temp} | <strong>Slow Travel Score:</strong> ${data.score}</span>`;
        }
      });
    });
  }

  /* ==========================================================================
     6. Traveler Stories Carousel Slider
     ========================================================================== */
  const track = document.getElementById('stories-track');
  const prevBtn = document.getElementById('prev-story');
  const nextBtn = document.getElementById('next-story');

  if (track && prevBtn && nextBtn) {
    let scrollAmount = 0;

    nextBtn.addEventListener('click', () => {
      const cardWidth = track.querySelector('.story-card').offsetWidth + 32;
      scrollAmount = Math.min(scrollAmount + cardWidth, track.scrollWidth - track.clientWidth);
      track.style.transform = `translateX(-${scrollAmount}px)`;
    });

    prevBtn.addEventListener('click', () => {
      const cardWidth = track.querySelector('.story-card').offsetWidth + 32;
      scrollAmount = Math.max(scrollAmount - cardWidth, 0);
      track.style.transform = `translateX(-${scrollAmount}px)`;
    });
  }

  /* ==========================================================================
     7. Enquiry Form Interactive Handling
     ========================================================================== */
  const enquiryForm = document.getElementById('enquiry-form');
  const formFeedback = document.getElementById('form-feedback');

  if (enquiryForm && formFeedback) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Simple client-side UX feedback
      const submitBtn = enquiryForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending Inquiry...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        formFeedback.className = 'form-notification success';
        formFeedback.innerHTML = '<strong>Thank you!</strong> Your journey inquiry has been received. A slow-travel designer will reach out within 24 hours.';
        
        enquiryForm.reset();
        formFeedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1200);
    });
  }

});