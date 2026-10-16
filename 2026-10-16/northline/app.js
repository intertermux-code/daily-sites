/**
 * NORTHLINE AGENCY — KINETIC INTERACTION & MOTION CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initParallax();
  init3DCardTilt();
  initStatsCounter();
  initAccordion();
  initWorkFilters();
  initProjectForm();
});

/* -------------------------------------------------------------------------- */
/* 1. MOBILE NAVIGATION TOGGLE                                                 */
/* -------------------------------------------------------------------------- */
function initNavigation() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.site-nav');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('is-open');
  });

  // Close nav on click outside
  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !navMenu.contains(e.target)) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-open');
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 2. PARALLAX LAYERS MOTION (rAF HANDLER)                                     */
/* -------------------------------------------------------------------------- */
function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const parallaxElements = document.querySelectorAll('[data-speed]');
  if (parallaxElements.length === 0) return;

  let latestScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    latestScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        parallaxElements.forEach((el) => {
          const speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
          const translateY = latestScrollY * speed;
          el.style.transform = `translate3d(0, ${translateY}px, 0)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 3. 3D CARD TILT SIGNATURE INTERACTION                                       */
/* -------------------------------------------------------------------------- */
function init3DCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('[data-tilt]');

  cards.forEach((card) => {
    const glare = card.querySelector('.card-glare');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8; // Max 8deg rotation
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glare) {
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, transparent 70%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      if (glare) {
        glare.style.opacity = '0';
      }
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 4. STATS ANIMATED COUNTER (INTERSECTION OBSERVER)                          */
/* -------------------------------------------------------------------------- */
function initStatsCounter() {
  const statValues = document.querySelectorAll('.stat-value');
  if (statValues.length === 0) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countTo = parseInt(target.getAttribute('data-target'), 10);
        let current = 0;
        const duration = 1500; // ms
        const stepTime = Math.abs(Math.floor(duration / countTo));

        const timer = setInterval(() => {
          current += 1;
          target.textContent = current;
          if (current >= countTo) {
            target.textContent = countTo;
            clearInterval(timer);
          }
        }, stepTime);

        obs.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  statValues.forEach((stat) => observer.observe(stat));
}

/* -------------------------------------------------------------------------- */
/* 5. SERVICES ACCORDION CONTROLLER                                            */
/* -------------------------------------------------------------------------- */
function initAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  if (accordionHeaders.length === 0) return;

  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      const panelId = header.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);

      // Close all other panels
      accordionHeaders.forEach((otherHeader) => {
        otherHeader.setAttribute('aria-expanded', 'false');
        const otherPanelId = otherHeader.getAttribute('aria-controls');
        const otherPanel = document.getElementById(otherPanelId);
        if (otherPanel) otherPanel.hidden = true;
      });

      // Toggle current
      if (!isExpanded && panel) {
        header.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 6. WORK CATEGORY FILTERING                                                  */
/* -------------------------------------------------------------------------- */
function initWorkFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const workCards = document.querySelectorAll('.archive-grid .work-card');

  if (filterBtns.length === 0 || workCards.length === 0) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Set active state
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filterValue = btn.getAttribute('data-filter');

      workCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 7. CONTACT FORM ASYNC SUBMISSION & VALIDATION                              */
/* -------------------------------------------------------------------------- */
function initProjectForm() {
  const form = document.getElementById('project-form');
  const feedback = document.getElementById('form-feedback');

  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic Validation
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const details = form.querySelector('[name="details"]').value.trim();

    if (!name || !email || !details) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'Please fill in all required fields (*) before submitting.';
      return;
    }

    // Simulate Network Request State
    const submitBtn = form.querySelector('.form-submit-btn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Encrypting & Sending...';

    setTimeout(() => {
      feedback.className = 'form-feedback success';
      feedback.textContent = '★ Inquiry received! A Northline director will reach out within 24 hours.';
      form.reset();
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Submit Project Brief';
    }, 1200);
  });
}