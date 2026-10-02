/* ==========================================================================
   SIGNAL — site behavior
   Vanilla JS, feature-gated. Honors prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll Progress Bar ---------- */
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    let lastY = -1;
    let ticking = false;

    const updateBar = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        if (motionOK) {
          requestAnimationFrame(updateBar);
        } else {
          updateBar();
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateBar();
  }

  /* ---------- Spring Accordion (single-open) ---------- */
  const accordions = document.querySelectorAll('[data-accordion]');
  if (accordions.length) {
    accordions.forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // close siblings (single-open within same .accordion parent)
        const parent = item.closest('.accordion');
        if (parent) {
          parent.querySelectorAll('[data-accordion].is-open').forEach((sibling) => {
            if (sibling !== item) {
              sibling.classList.remove('is-open');
              const sibTrigger = sibling.querySelector('.accordion-trigger');
              if (sibTrigger) sibTrigger.setAttribute('aria-expanded', 'false');
            }
          });
        }

        if (isOpen) {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      // keyboard: Home/End for first/last, ArrowUp/ArrowDown between triggers
      trigger.addEventListener('keydown', (e) => {
        const parent = item.closest('.accordion');
        if (!parent) return;
        const triggers = Array.from(parent.querySelectorAll('.accordion-trigger'));
        const idx = triggers.indexOf(trigger);

        let target = null;
        if (e.key === 'ArrowDown') target = triggers[(idx + 1) % triggers.length];
        else if (e.key === 'ArrowUp') target = triggers[(idx - 1 + triggers.length) % triggers.length];
        else if (e.key === 'Home') target = triggers[0];
        else if (e.key === 'End') target = triggers[triggers.length - 1];

        if (target) {
          e.preventDefault();
          target.focus();
        }
      });
    });
  }

  /* ---------- Newsletter form validation (subscribe page) ---------- */
  const signup('signup-form');
  if (signupForm) {
    const nameInput = signupForm.querySelector('#name');
    const emailInput = signupForm.querySelector('#email');
    const consentBox = signupForm.querySelector('input[name="consent"]');
    const submitBtn = signupForm.querySelector('.submit-btn');
    const statusBox = signupForm.querySelector('.form-status');

    const setRowError = (row, message) => {
      if (!row) return;
      const errEl = row.querySelector('.form-error');
      const input = row.querySelector('input[type="text"], input[type="email"]');
      if (errEl) errEl.textContent = message || '';
      if (input) input.classList.toggle('is-invalid', !!message);
    };

    const validateName = () => {
      const v = (nameInput.value || '').trim();
      if (!v) return 'Please tell us how to address you.';
      if (v.length < 2) return 'A touch too short — full name preferred.';
      if (v.length > 80) return 'That is longer than we can print.';
      return '';
    };

    const validateEmail = () => {
      const v = (emailInput.value || '').trim();
      if (!v) return 'We need an address to deliver the Dispatch.';
      // Reasonable email regex
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (!ok) return 'That does not look like a deliverable address.';
      return '';
    };

    const validateConsent = () => {
      return consentBox && !consentBox.checked
        ? 'Please confirm the consent to continue.'
        : '';
    };

    const validateAll = () => {
      let ok = true;
      const nameRow = nameInput ? nameInput.closest('.form-row') : null;
      const emailRow = emailInput ? emailInput.closest('.form-row') : null;
      const consentRow = consentBox ? consentBox.closest('.form-row') : null;

      const nameErr = validateName();
      const emailErr = validateEmail();
      const consentErr = validateConsent();

      setRowError(nameRow, nameErr);
      setRowError(emailRow, emailErr);
      if (consentRow) {
        const err = consentRow.querySelector('.form-error');
        if (err) err.textContent = consentErr || '';
      }
      if (nameErr || emailErr || consentErr) ok = false;
      return ok;
    };

    if (nameInput) {
      nameInput.addEventListener('blur', () => setRowError(nameInput.closest('.form-row'), validateName()));
      nameInput.addEventListener('input', () => {
        if (nameInput.classList.contains('is-invalid')) {
          setRowError(nameInput.closest('.form-row'), validateName());
        }
      });
    }
    if (emailInput) {
      emailInput.addEventListener('blur', () => setRowError(emailInput.closest('.form-row'), validateEmail()));
      emailInput.addEventListener('input', () => {
        if (emailInput.classList.contains('is-invalid')) {
          setRowError(emailInput.closest('.form-row'), validateEmail());
        }
      });
    }
    if (consentBox) {
      consentBox.addEventListener('change', () => {
        const row = consentBox.closest('.form-row');
        const err = row ? row.querySelector('.form-error') : null;
        if (err) err.textContent = validateConsent() || '';
      });
    }

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateAll()) {
        statusBox.classList.remove('is-success', 'is-loading');
        statusBox.textContent = 'Please correct the items above.';
        // Focus first invalid
        const firstInvalid = signupForm.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Simulate async submit
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enrolling…';
      statusBox.classList.add('is-loading');
      statusBox.classList.remove('is-success');
      statusBox.textContent = 'Sending to the desk…';

      window.setTimeout(() => {
        submitBtn.textContent = 'Subscribed ✓';
        statusBox.classList.remove('is-loading');
        statusBox.classList.add('is-success');
        statusBox.textContent = `Welcome aboard, ${(nameInput.value || '').split(' ')[0]}. Your first Dispatch arrives Thursday.`;

        // Undo option: restore form within 8 seconds
        const restoreToken = window.setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Subscribe — free →';
          statusBox.textContent = '';
          statusBox.classList.remove('is-success');
        }, 8000);

        // Allow undo via clicking button again (treated as confirmation dismissal)
        submitBtn.addEventListener('click', () => {
          window.clearTimeout(restoreToken);
          signupForm.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = 'Subscribe — free →';
          statusBox.textContent = '';
          statusBox.classList.remove('is-success');
        }, { once: true });
      }, 900);
    });
  }

  /* ---------- Tool buttons (article page) — graceful, non-destructive ---------- */
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const label = (btn.textContent || '').trim().toLowerCase();
      if (label.startsWith('print')) {
        window.print();
        return;
      }
      const original = btn.innerHTML;
      btn.innerHTML = original.replace(/^([\s\S]*?)(Save|Share|Listen)/, (_, pre, word) => {
        return pre + (word === 'Save' ? 'Saved ✓' : word === 'Share' ? 'Link copied ✓' : 'Playing · 28′');
      });
      btn.disabled = true;
      window.setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2200);
    });
  });

  /* ---------- Gentle entrance choreography (subtle) ---------- */
  if (motionOK && 'IntersectionObserver' in window) {
    const items = document.querySelectorAll('.story, .mosaic-cell, .staff, .ethics-list li, .briefing-list li');
    items.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = `opacity 0.5s ease ${Math.min(i * 0.04, 0.4)}s, transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) ${Math.min(i * 0.04, 0.4)}s`;
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    items.forEach((el) => io.observe(el));
  }

  /* ---------- Live clock in masthead (dateline) ---------- */
  const weather = document.querySelector('.masthead-top .weather');
  if (weather) {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      const base = (weather.textContent || '').split('·')[0].trim();
      weather.textContent = `${base} · ${hh}:${mm} UTC`;
    };
    tick();
    window.setInterval(tick, 30000);
  }
})();