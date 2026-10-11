document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle
  const navToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
      navToggle.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('active');
    });
  }

  // 2. Cursor Spotlight (Secondary Motion)
  let rAF = null;
  window.addEventListener('pointermove', (e) => {
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--spotlight-x', `${x}%`);
      document.documentElement.style.setProperty('--spotlight-y', `${y}%`);
    });
  });

  // 3. Blur-Fade Ascend via IntersectionObserver (Primary Motion)
  const reveals = document.querySelectorAll('.reveal');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger sibling reveals
          const parent = entry.target.parentElement;
          const siblings = Array.from(parent.querySelectorAll('.reveal'));
          const index = siblings.indexOf(entry.target);
          const delay = index >= 0 ? index * 80 : 0;

          setTimeout(() => {
            entry.target.classList.add('in');
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback for older browsers
    reveals.forEach((el) => el.classList.add('in'));
  }

  // 4. Services Page Accordion Expansion
  const serviceRows = document.querySelectorAll('.service-row');
  if (serviceRows.length > 0) {
    serviceRows.forEach((row) => {
      const header = row.querySelector('.service-header');
      if (header) {
        header.addEventListener('click', () => {
          const isOpen = row.classList.contains('expanded');
          
          // Close all others
          serviceRows.forEach((r) => {
            r.classList.remove('expanded');
            const btn = r.querySelector('.service-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          });

          if (!isOpen) {
            row.classList.add('expanded');
            const btn = row.querySelector('.service-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'true');
          }
        });
      }
    });
  }

  // 5. Contact Form Simulation
  const contactForm = document.querySelector('#enquiry-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `Sending...`;

      setTimeout(() => {
        const formContainer = contactForm.parentElement;
        formContainer.innerHTML = `
          <div class="success-state reveal in" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">⚡</div>
            <h3 style="font-size: 2rem; margin-bottom: 12px;">Enquiry Received</h3>
            <p style="max-width: 450px; margin: 0 auto; color: var(--text-muted);">
              Thank you for initiating contact. Our strategy lead will review your brief and respond within 24 business hours.
            </p>
          </div>
        `;
      }, 1200);
    });
  }
});