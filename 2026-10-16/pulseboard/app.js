/**
 * PULSEBOARD - SHARED ARCHITECTURAL JAVASCRIPT
 * Includes Cursor Spotlight, 3D Tilt, Metric Counters, and Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. CURSOR SPOTLIGHT EFFECT (rAF Throttled)
  const spotlightContainer = document.querySelector('.spotlight-container');
  if (spotlightContainer) {
    let ticking = false;

    window.addEventListener('pointermove', (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = spotlightContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          spotlightContainer.style.setProperty('--mouse-x', `${x}px`);
          spotlightContainer.style.setProperty('--mouse-y', `${y}px`);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // 2. 3D CARD TILT MOTION IDENTITY
  const tiltCards = document.querySelectorAll('.tilt-card');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (tiltCards.length > 0 && !prefersReduced) {
    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Max 6 degree rotation angle for subtle depth
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  }

  // 3. ANIMATED METRIC COUNTERS
  const counters = document.querySelectorAll('.counter');
  if (counters.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-target'));
          const isFloat = target % 1 !== 0;
          const duration = 1500; // ms
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quad
            const current = progress * (2 - progress) * target;

            el.textContent = isFloat ? current.toFixed(2) : Math.floor(current).toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              el.textContent = isFloat ? target.toFixed(2) : target.toLocaleString();
            }
          };

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach((c) => observer.observe(c));
  }

  // 4. INTERACTIVE PRICING TOGGLE (PRICING PAGE)
  const billingSwitch = document.getElementById('billing-switch');
  if (billingSwitch) {
    billingSwitch.addEventListener('click', () => {
      const isYearly = billingSwitch.getAttribute('aria-checked') === 'true';
      const newChecked = !isYearly;

      billingSwitch.setAttribute('aria-checked', newChecked.toString());

      const priceValues = document.querySelectorAll('.price-val');
      priceValues.forEach((p) => {
        const monthly = p.getAttribute('data-monthly');
        const yearly = p.getAttribute('data-yearly');

        if (monthly && yearly) {
          p.textContent = newChecked ? yearly : monthly;
        }
      });
    });
  }

  // 5. DEMO FORM SUBMISSION (CONTACT PAGE)
  const demoForm = document.getElementById('demo-form');
  const formSuccess = document.getElementById('form-success');

  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('full-name');
      const email = document.getElementById('work-email');

      if (!name.value.trim() || !email.value.trim()) {
        alert('Please complete all required fields.');
        return;
      }

      // Simulate sending request
      demoForm.style.display = 'none';
      if (formSuccess) {
        formSuccess.style.display = 'block';
      }
    });
  }
});

<ElicitationsGroup message="Explore further details about the Pulseboard deployment:">
  <Elicitation label="Review technical eBPF kernel integration specs" query="Show me how the eBPF kernel agent works in Pulseboard"/>
  <Elicitation label="Calculate enterprise tier log storage costs" query="How is enterprise storage volume priced in Pulseboard?"/>
</ElicitationsGroup>