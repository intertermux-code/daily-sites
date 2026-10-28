/* =====================================================================
   Bright Harvest — shared behaviour
   Signature motion: Cursor Spotlight (hero) + Magnetic Elements (buttons)
   Page logic: impact counters, donation widget, volunteer + newsletter forms
   All vanilla; every block is guarded by element-existence checks.
   ===================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* -------------------------------------------------------------
     1. Cursor Spotlight — radial glow tracking the pointer inside
        any [data-spotlight] region. Writes CSS custom properties,
        throttled to one write per animation frame.
     ------------------------------------------------------------- */
  function initSpotlight() {
    var zones = $$('[data-spotlight]');
    if (!zones.length || reduced.matches || !fine.matches) return;

    zones.forEach(function (zone) {
      var glow = $('.hero-spot', zone);
      if (!glow) return;

      var pending = false;
      var target = { x: 0.62, y: 0.28 };
      var current = { x: 0.62, y: 0.28 };

      function frame() {
        pending = false;
        current.x += (target.x - current.x) * 0.16;
        current.y += (target.y - current.y) * 0.16;
        glow.style.setProperty('--sx', (current.x * 100).toFixed(2) + '%');
        glow.style.setProperty('--sy', (current.y * 100).toFixed(2) + '%');
        if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
          pending = true;
          requestAnimationFrame(frame);
        }
      }

      function wake() {
        glow.style.setProperty('--spot', '1');
      }

      zone.addEventListener('pointermove', function (ev) {
        var rect = zone.getBoundingClientRect();
        target.x = (ev.clientX - rect.left) / rect.width;
        target.y = (ev.clientY - rect.top) / rect.height;
        wake();
        if (!pending) { pending = true; requestAnimationFrame(frame); }
      }, { passive: true });

      zone.addEventListener('pointerenter', function () { glow.style.setProperty('--spot', '1'); });
      zone.addEventListener('pointerleave', function () {
        glow.style.setProperty('--spot', '.55');
      });

      // Keyboard users get a slow drift instead of nothing at all.
      zone.addEventListener('focusin', function () {
        glow.style.setProperty('--spot', '1');
        glow.style.setProperty('--sx', '40%');
        glow.style.setProperty('--sy', '46%');
      });
    });
  }

  /* -------------------------------------------------------------
     2. Magnetic Elements — primary/secondary buttons lean toward
        the cursor within a 120px radius, lerp via rAF, spring back
        on leave, scale(1.04) at the closest approach.
     ------------------------------------------------------------- */
  function initMagnets() {
    var RADIUS = 120;
    var items = $$('[data-magnetic]');
    if (!items.length || reduced.matches || !fine.matches) return;

    items.forEach(function (el) {
      var state = { raf: null, tx: 0, ty: 0, cx: 0, cy: 0, scale: 1, cs: 1, active: false };

      function tick() {
        var k = state.active ? 0.22 : 0.14;
        state.cx += (state.tx - state.cx) * k;
        state.cy += (state.ty - state.cy) * k;
        state.cs += (state.scale - state.cs) * k;
        if (Math.abs(state.tx - state.cx) < 0.05 && Math.abs(state.ty - state.cy) < 0.05 &&
            Math.abs(state.scale - state.cs) < 0.001) {
          el.style.transform = 'translate3d(0,0,0) scale(1)';
          state.cx = state.cy = 0; state.cs = 1; state.raf = null;
          return;
        }
        el.style.transform = 'translate3d(' + state.cx.toFixed(2) + 'px,' +
          state.cy.toFixed(2) + 'px,0) scale(' + state.cs.toFixed(3) + ')';
        state.raf = requestAnimationFrame(tick);
      }

      function start() { if (state.raf === null) state.raf = requestAnimationFrame(tick); }

      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var mx = r.left + r.width / 2;
        var my = r.top + r.height / 2;
        var dx = ev.clientX - mx;
        var dy = ev.clientY - my;
        var dist = Math.hypot(dx, dy);
        var reach = RADIUS + Math.max(r.width, r.height) / 2;
        if (dist > reach) { el.dispatchEvent(new Event('pointerleave-magnet')); return; }
        var pull = 1 - dist / reach;                 // 0 far → 1 close
        state.active = true;
        state.tx = dx * 0.32 * pull;
        state.ty = dy * 0.32 * pull;
        state.scale = 1 + 0.04 * pull;
        start();
      }, { passive: true });

      function release() {
        state.active = false; state.tx = 0; state.ty = 0; state.scale = 1; start();
      }
      el.addEventListener('pointerleave', release);
      el.addEventListener('pointerleave-magnet', release);
      el.addEventListener('blur', release);
      el.addEventListener('focus', function () {
        state.active = true; state.tx = 0; state.ty = -3; state.scale = 1.03; start();
      });
    });
  }

  /* -------------------------------------------------------------
     3. Mobile contents drawer
     ------------------------------------------------------------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && nav.classList.contains('is-open')) { close(); toggle.focus(); }
    });
    $$('.nav-link', nav).forEach(function (link) {
      link.addEventListener('click', function () { if (nav.classList.contains('is-open')) close(); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) close();
    });
  }

  /* -------------------------------------------------------------
     4. Animated impact counters — count up once when the ledger
        scrolls into view, easing out over ~1.6s with rAF.
     ------------------------------------------------------------- */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function render(el, value) {
      el.textContent = value.toLocaleString('en-US');
    }

    function run(el) {
      var goal = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduced.matches) { render(el, goal); return; }
      var dur = 1600;
      var t0 = performance.now();
      function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        render(el, Math.round(goal * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    // Markup already carries the audited figures, so a page that is never
    // scrolled still reads correctly; the count-up only layers on top.
    nums.forEach(function (n) { render(n, parseInt(n.getAttribute('data-count'), 10) || 0); io.observe(n); });
  }

  /* -------------------------------------------------------------
     5. Donation widget (donate.html)
        Amount chips + custom field + frequency toggle → live meal
        readout → fake submit → thank-you receipt state.
     ------------------------------------------------------------- */
  var MEAL_COST = 0.42; // one pantry meal, our landed cost this quarter

  function initDonation() {
    var form = $('#donation-form');
    if (!form) return;

    var thanks = $('#donation-thanks');
    var readout = $('[data-meal-readout]');
    var readoutText = $('[data-meal-text]');
    var readoutSub = $('[data-meal-sub]');
    var submitAmount = $('[data-submit-amount]', form);
    var custom = $('#custom-amount');
    var chips = $$('input[name="amount"]', form);
    var freqs = $$('input[name="frequency"]', form);

    function isMonthly() {
      var f = freqs.filter(function (x) { return x.checked; })[0];
      return !!f && f.value === 'monthly';
    }

    function selectedAmount() {
      var picked = chips.filter(function (c) { return c.checked; })[0];
      if (!picked) return 0;
      if (picked.value === 'custom') return parseFloat(custom && custom.value) || 0;
      return parseFloat(picked.value) || 0;
    }

    function frequencyLabel() {
      return isMonthly() ? 'every month' : 'one time';
    }

    function update() {
      var amt = selectedAmount();
      if (isNaN(amt) || amt < 0) amt = 0;
      var meals = Math.round(amt / MEAL_COST);
      var yearly = meals * (isMonthly() ? 12 : 1);

      if (readout) readout.textContent = meals.toLocaleString('en-US');
      if (submitAmount) submitAmount.textContent = amt > 0 ? '$' + amt.toFixed(0) : '';
      if (readoutText) {
        readoutText.textContent = amt > 0
          ? 'pantry meals, ' + frequencyLabel() + '. Grown within forty miles wherever the season allows.'
          : 'Pick an amount and we’ll tell you exactly where it lands.';
      }
      if (readoutSub) {
        readoutSub.textContent = amt > 0 && isMonthly()
          ? 'That is ' + yearly.toLocaleString('en-US') + ' meals before next October.'
          : amt > 0
            ? 'Covered in full today — no pledge, no follow-up letter.'
            : '94¢ of every dollar reaches a plate.';
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('change', function () {
        if (custom) {
          custom.disabled = chip.value !== 'custom';
          if (chip.value === 'custom') custom.focus();
        }
        var fs = chip.closest('[data-amount-fieldset]');
        if (fs) fs.classList.remove('invalid');
        update();
      });
    });
    freqs.forEach(function (f) { f.addEventListener('change', update); });
    if (custom) {
      custom.disabled = true;
      custom.addEventListener('input', update);
      custom.addEventListener('focus', function () {
        var customChip = chips.filter(function (c) { return c.value === 'custom'; })[0];
        if (customChip) customChip.checked = true;
        update();
      });
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var amt = selectedAmount();
      var amountFieldset = $('[data-amount-fieldset]', form);
      if (!amt || amt < 5) {
        if (amountFieldset) amountFieldset.classList.add('invalid');
        var firstChip = chips.filter(function (c) { return c.value === 'custom'; })[0];
        if (firstChip) firstChip.focus();
        return;
      }
      if (amountFieldset) amountFieldset.classList.remove('invalid');

      var name = $('[name="donor_name"]', form);
      var first = name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : 'friend of the harvest';
      var monthly = isMonthly();
      var meals = Math.round(amt / MEAL_COST);

      var rName = $('#receipt-name', thanks);
      var rAmt = $('#receipt-amount', thanks);
      var rFreq = $('#receipt-freq', thanks);
      var rMeals = $('#receipt-meals', thanks);
      var rRef = $('#receipt-ref', thanks);
      if (rName) rName.textContent = first;
      if (rAmt) rAmt.textContent = '$' + amt.toFixed(2);
      if (rFreq) rFreq.textContent = monthly ? 'Monthly' : 'One time';
      if (rMeals) rMeals.textContent = meals.toLocaleString('en-US') + (monthly ? ' / month' : '');
      if (rRef) rRef.textContent = 'BH-' + String(Math.floor(Math.random() * 900000) + 100000);

      form.hidden = true;
      if (thanks) {
        thanks.hidden = false;
        thanks.setAttribute('tabindex', '-1');
        thanks.focus();
      }
      var again = $('#give-again', thanks);
      if (again && !again.dataset.bound) {
        again.dataset.bound = '1';
        again.addEventListener('click', function () {
          thanks.hidden = true;
          form.hidden = false;
          update();
          var chip0 = chips[0];
          if (chip0) chip0.focus();
        });
      }
    });

    update();
  }

  /* -------------------------------------------------------------
     6. Volunteer signup (volunteer.html) — inline validation,
        shift chips that echo into the summary, success state.
     ------------------------------------------------------------- */
  function initVolunteer() {
    var form = $('#volunteer-form');
    if (!form) return;

    var done = $('#volunteer-done');
    var required = $$('[data-required]', form);

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input) {
      var field = fieldOf(input);
      if (!field) return true;
      var value = (input.value || '').trim();
      var msg = $('.field-error', field);
      var ok = true;
      var text = '';

      if (input.dataset.required === 'email') {
        ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
        text = 'We need a working email to send your shift reminder.';
      } else if (input.dataset.required === 'phone') {
        ok = value.replace(/\D/g, '').length >= 10;
        text = 'Enter ten digits — a driver calls if a route runs long.';
      } else if (!value) {
        ok = false;
        text = 'This answer tells us where to put you on the floor.';
      }

      field.classList.toggle('invalid', !ok);
      if (msg && !ok) msg.textContent = text;
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }

    required.forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        var field = fieldOf(input);
        if (field && field.classList.contains('invalid')) validate(input);
      });
    });

    var chips = $$('input[name="role"]', form);
    var echo = $('[data-role-echo]');
    function echoRoles() {
      if (!echo) return;
      var picked = chips.filter(function (c) { return c.checked; }).map(function (c) {
        return c.parentElement.textContent.trim().replace(/\s+/g, ' ');
      });
      echo.textContent = picked.length
        ? 'You’ve asked for: ' + picked.join(' · ') + '. We never schedule more than two shifts a week.'
        : 'Tick at least one kind of work so we can match you to a crew.';
    }
    chips.forEach(function (c) { c.addEventListener('change', echoRoles); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bad = required.filter(function (i) { return !validate(i); });
      var rolePicked = chips.some(function (c) { return c.checked; });
      if (!rolePicked) {
        var box = $('.fieldset-roles');
        if (box) box.classList.add('invalid');
      } else {
        var box2 = $('.fieldset-roles');
        if (box2) box2.classList.remove('invalid');
      }
      if (bad.length) { bad[0].focus(); return; }
      if (!rolePicked) { chips[0].focus(); return; }

      var first = $('[name="first_name"]', form);
      var shift = $('select[name="shift"]', form);
      var nameOut = $('#volunteer-name', done);
      var shiftOut = $('#volunteer-shift', done);
      if (nameOut && first) nameOut.textContent = first.value.trim();
      if (shiftOut && shift) shiftOut.textContent = shift.options[shift.selectedIndex].text;
      var ref = $('#volunteer-ref', done);
      if (ref) ref.textContent = 'VOL-' + String(Math.floor(Math.random() * 9000) + 1000);

      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus();
      }
    });

    echoRoles();
  }

  /* -------------------------------------------------------------
     7. Footer newsletter — shared, fake success
     ------------------------------------------------------------- */
  function initNewsletter() {
    $$('[data-newsletter]').forEach(function (form) {
      var input = $('input[type=email]', form);
      var note = $('[data-newsletter-note]', form);
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!input || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim())) {
          if (note) { note.textContent = 'That address looks incomplete — try the full you@example.com.'; note.classList.remove('ok'); }
          if (input) input.focus();
          return;
        }
        if (note) {
          note.textContent = 'Filed. Look for the first Friday letter, signed by whoever drove the longest route.';
          note.classList.add('ok');
        }
        form.reset();
      });
    });
  }

  /* -------------------------------------------------------------
     8. Shared niceties: current year, deep-link heading focus
     ------------------------------------------------------------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  function initHeadingFocus() {
    if (!location.hash) return;
    var target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
    if (!target) return;
    var heading = target.matches('h1,h2,h3,h4') ? target : (target.querySelector('h1,h2,h3,h4') || target);
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  }

  function boot() {
    initSpotlight();
    initMagnets();
    initNav();
    initCounters();
    initDonation();
    initVolunteer();
    initNewsletter();
    initYear();
    initHeadingFocus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
