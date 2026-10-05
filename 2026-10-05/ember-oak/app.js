/**
 * EMBER & OAK — Shared Application Logic
 * Handles: Nav, Decode Text Animation, 3D Tilt Cards, Tabs, Gallery Lightbox, Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initDecodeText();
  initTiltCards();
  initMenuTabs();
  initGalleryLightbox();
  initReservationForm();
});

/* -------------------------------------------
   1. MOBILE NAVIGATION
------------------------------------------- */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  
  if (!toggle || !navList) return;

  toggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    
    // Animate hamburger bars
    const bars = toggle.querySelectorAll('.bar');
    if (isOpen) {
      bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      bars[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      bars[0].style.transform = '';
      bars[1].style.transform = '';
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navList.classList.contains('open')) {
      toggle.click();
      toggle.focus();
    }
  });
}

/* -------------------------------------------
   2. DECODE TEXT ANIMATION (Signature Motion)
   Cycles random glyphs before resolving to final text
------------------------------------------- */
function initDecodeText() {
  const targets = document.querySelectorAll('.decode-target');
  if (!targets.length) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*<>{}[]|/\\~';
  
  targets.forEach(el => {
    const finalText = el.dataset.final || el.textContent;
    const duration = 1200; // ms
    const intervalTime = 40;
    const steps = duration / intervalTime;
    let step = 0;
    
    el.textContent = Array.from(finalText).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      // Resolve characters progressively from left to right
      const resolvedCount = Math.floor(progress * finalText.length);
      const current = finalText.slice(0, resolvedCount) + 
                      Array.from(finalText.slice(resolvedCount))
                        .map(() => chars[Math.floor(Math.random() * chars.length)])
                        .join('');
      
      el.textContent = current;
      
      if (step >= steps) {
        clearInterval(interval);
        el.textContent = finalText;
      }
    }, intervalTime);
  });
}

/* -------------------------------------------
   3. 3D CARD TILT EFFECT (Secondary Motion)
   Perspective tilt + glare follow on mousemove
------------------------------------------- */
function initTiltCards() {
  const wrappers = document.querySelectorAll('.card-tilt-wrapper');
  if (!wrappers.length) return;
  
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  wrappers.forEach(wrapper => {
    const card = wrapper.querySelector('.card-tilt');
    if (!card) return;

    let rafId = null;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;

    const maxDeg = 8;
    const lerpFactor = 0.1;

    const updateTransform = () => {
      // Lerp towards target
      currentRotateX += (targetRotateX - currentRotateX) * lerpFactor;
      currentRotateY += (targetRotateY - currentRotateY) * lerpFactor;

      // Apply if difference is significant enough
      if (Math.abs(targetRotateX - currentRotateX) > 0.01 || 
          Math.abs(targetRotateY - currentRotateY) > 0.01) {
        card.style.transform = `perspective(1000px) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
        rafId = requestAnimationFrame(updateTransform);
      } else {
        // Snap to final resting state
        if (targetRotateX === 0 && targetRotateY === 0) {
          card.style.transform = '';
        }
        rafId = null;
      }
    };

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate normalized rotation (-1 to 1)
      const normX = (x - centerX) / centerX;
      const normY = (y - centerY) / centerY;

      targetRotateY = normX * maxDeg;
      targetRotateX = -normY * maxDeg; // Invert Y for natural feel

      // Update glare position CSS vars
      const pctX = (x / rect.width) * 100;
      const pctY = (y / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${pctX}%`);
      card.style.setProperty('--mouse-y', `${pctY}%`);

      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform);
      }
    });

    wrapper.addEventListener('mouseleave', () => {
      targetRotateX = 0;
      targetRotateY = 0;
      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform);
      }
    });
  });
}

/* -------------------------------------------
   4. MENU TABS
------------------------------------------- */
function initMenuTabs() {
  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList) return;

  const tabs = tabList.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => {
        p.hidden = true;
        p.classList.remove('active');
      });

      // Activate clicked
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panelId = tab.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.hidden = false;
        panel.classList.add('active');
      }
    });

    // Keyboard navigation between tabs
    tab.addEventListener('keydown', (e) => {
      const tabArray = Array.from(tabs);
      const idx = tabArray.indexOf(tab);
      let newIdx = idx;

      if (e.key === 'ArrowRight') newIdx = (idx + 1) % tabArray.length;
      else if (e.key === 'ArrowLeft') newIdx = (idx - 1 + tabArray.length) % tabArray.length;
      else if (e.key === 'Home') newIdx = 0;
      else if (e.key === 'End') newIdx = tabArray.length - 1;
      else return;

      e.preventDefault();
      tabArray[newIdx].click();
      tabArray[newIdx].focus();
    });
  });
}

/* -------------------------------------------
   5. GALLERY LIGHTBOX
------------------------------------------- */
function initGalleryLightbox() {
  const dialog = document.getElementById('lightbox');
  const triggers = document.querySelectorAll('.gallery-trigger');
  if (!dialog || !triggers.length) return;

  const img = dialog.querySelector('#lightbox-img');
  const caption = dialog.querySelector('#lightbox-caption');
  const closeBtn = dialog.querySelector('.lightbox-close');
  const backdrop = dialog.querySelector('.lightbox-backdrop');

  let lastFocused = null;

  function openLightbox(src, alt) {
    lastFocused = document.activeElement;
    img.src = src;
    img.alt = alt;
    caption.textContent = alt;
    dialog.showModal();
    closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    dialog.close();
    img.src = '';
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const imgEl = btn.querySelector('img');
      if (imgEl) {
        // Use higher res version if possible (simple swap w parameter)
        const hiRes = imgEl.src.replace('w=800', 'w=1600').replace('w=1200', 'w=1600');
        openLightbox(hiRes, imgEl.alt);
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Trap focus inside modal
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeLightbox();
  });
}

/* -------------------------------------------
   6. RESERVATION FORM VALIDATION
------------------------------------------- */
function initReservationForm() {
  const form = document.getElementById('booking-form');
  const successState = document.getElementById('booking-success');
  if (!form || !successState) return;

  // Set min date to today
  const dateInput = document.getElementById('res-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  const validators = {
    name: (v) => v.trim().length >= 2 ? '' : 'Please enter your full name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.',
    phone: (v) => v.replace(/\D/g, '').length >= 10 ? '' : 'Please enter a valid phone number.',
    date: (v) => v ? '' : 'Please select a date.',
    time: (v) => v ? '' : 'Please select a time.',
    size: (v) => v ? '' : 'Please select party size.'
  };

  function showError(input, msg) {
    const errorEl = input.parentElement.querySelector('.error-msg');
    if (msg) {
      input.classList.add('error');
      if (errorEl) errorEl.textContent = msg;
    } else {
      input.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
    }
  }

  // Inline validation on blur
  Object.keys(validators).forEach(key => {
    const input = form.querySelector(`[name="${key}"]`) || document.getElementById(key) || 
                  form.querySelector(`#${key}`) || form.querySelector(`[id*="${key}"]`);
    if (input) {
      input.addEventListener('blur', () => {
        const validateFn = Object.entries(validators).find(([k]) => 
          input.name.includes(k) || input.id.includes(k)
        );
        if (validateFn) showError(input, validateFn[1](input.value));
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    // Validate all fields
    Object.entries(validators).forEach(([key, fn]) => {
      const input = form.querySelector(`[name="${key}"]`) || 
                    Array.from(form.elements).find(el => el.id.includes(key) || el.name.includes(key));
      if (input) {
        const err = fn(input.value);
        showError(input, err);
        if (err) isValid = false;
      }
    });

    if (!isValid) {
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    // Simulate submission
    const submitBtn = form.querySelector('#submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      // Populate success state
      const name = form.querySelector('[name="name"]').value.split(' ')[0];
      const date = new Date(form.querySelector('[name="date"]').value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const time = form.querySelector('[name="time"] option:checked').textContent;
      const size = form.querySelector('[name="size"] option:checked').textContent;
      const email = form.querySelector('[name="email"]').value;

      document.getElementById('confirm-name').textContent = name;
      document.getElementById('confirm-details').textContent = `${date} at ${time} (${size})`;
      document.getElementById('confirm-email').textContent = email;

      form.hidden = true;
      successState.hidden = false;
      successState.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1500);
  });
}