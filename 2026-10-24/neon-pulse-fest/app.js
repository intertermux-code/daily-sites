/* =========================================================
   Neon Pulse 2026 — shared behaviour
   Vanilla JS, no libraries. Every feature is guarded by an
   element-existence check so one file serves all five pages.
   ========================================================= */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return motionQuery.matches; }

  /* ---------- 1. Mobile navigation ---------- */
  function initNav() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var toggle = header.querySelector('.nav__toggle');
    var nav = header.querySelector('.nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---------- 2. Countdown instrument ---------- */
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function initCountdowns() {
    var widgets = Array.prototype.slice.call(document.querySelectorAll('[data-countdown]'));
    if (!widgets.length) return;

    widgets.forEach(function (el) {
      el._target = new Date(el.getAttribute('data-countdown')).getTime();
      el._parts = {
        days: el.querySelector('[data-cd-days]'),
        hours: el.querySelector('[data-cd-hours]'),
        minutes: el.querySelector('[data-cd-minutes]'),
        seconds: el.querySelector('[data-cd-seconds]')
      };
    });

    function tick() {
      var now = Date.now();
      widgets.forEach(function (el) {
        var left = Math.max(0, el._target - now);
        var s = Math.floor(left / 1000);
        var d = Math.floor(s / 86400);
        var h = Math.floor((s % 86400) / 3600);
        var m = Math.floor((s % 3600) / 60);
        var sec = s % 60;
        var p = el._parts;
        if (p.days) p.days.textContent = pad(d);
        if (p.hours) p.hours.textContent = pad(h);
        if (p.minutes) p.minutes.textContent = pad(m);
        if (p.seconds) p.seconds.textContent = pad(sec);
      });
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- 3. Header gate clock (Pacific) ---------- */
  function initClock() {
    var out = document.querySelector('[data-header-clock]');
    if (!out) return;
    var fmt = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: 'America/Los_Angeles'
    });
    function tick() { out.textContent = fmt.format(new Date()) + ' PT'; }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- 4. Signature motion A: magnetic buttons ---------- */
  function initMagnetic() {
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-magnetic]'));
    if (!targets.length || reduced()) return;

    var RADIUS = 120;
    var items = targets.map(function (el) {
      return { el: el, tx: 0, ty: 0, cx: 0, cy: 0, scale: 1, cscale: 1, active: false, queued: false };
    });

    function frame() {
      var alive = false;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var k = it.active ? 0.18 : 0.12;
        it.cx += (it.tx - it.cx) * k;
        it.cy += (it.ty - it.cy) * k;
        it.cscale += (it.scale - it.cscale) * 0.2;
        var moving = Math.abs(it.tx - it.cx) > 0.05 || Math.abs(it.ty - it.cy) > 0.05 ||
                     Math.abs(it.scale - it.cscale) > 0.001;
        if (moving) alive = true;
        it.el.style.setProperty('--mx', it.cx.toFixed(2) + 'px');
        it.el.style.setProperty('--my', it.cy.toFixed(2) + 'px');
        it.el.style.setProperty('--ms', it.cscale.toFixed(3));
        if (!moving && !it.active) { it.queued = false; }
      }
      if (alive) window.requestAnimationFrame(frame);
      else running = false;
    }

    var running = false;
    function kick() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(frame);
    }

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var r = it.el.getBoundingClientRect();
        var px = r.left + r.width / 2;
        var py = r.top + r.height / 2;
        var dx = e.clientX - px;
        var dy = e.clientY - py;
        var dist = Math.hypot(dx, dy);
        var reach = RADIUS + Math.max(r.width, r.height) / 2;
        if (dist < reach) {
          var pull = 1 - dist / reach;
          it.active = true;
          it.tx = dx * 0.34 * pull;
          it.ty = dy * 0.34 * pull;
          it.scale = dist < RADIUS * 0.6 ? 1.04 : 1.015 + pull * 0.02;
        } else if (it.active) {
          it.active = false;
          it.tx = 0; it.ty = 0; it.scale = 1;
        }
      }
      kick();
    }, { passive: true });

    window.addEventListener('blur', function () {
      items.forEach(function (it) { it.active = false; it.tx = 0; it.ty = 0; it.scale = 1; });
      kick();
    });
  }

  /* ---------- 5. Signature motion B: cursor spotlight ---------- */
  function initSpotlight() {
    var zones = Array.prototype.slice.call(document.querySelectorAll('[data-spotlight]'));
    if (!zones.length || reduced()) return;

    var host = zones[0];
    var pending = false, nx = 0.5, ny = 0.36, t = 0, lastPointer = 0;

    function apply() {
      pending = false;
      host.style.setProperty('--spot-x', (nx * 100).toFixed(2) + '%');
      host.style.setProperty('--spot-y', (ny * 100).toFixed(2) + '%');
    }
    function queue() {
      if (!pending) { pending = true; window.requestAnimationFrame(apply); }
    }
    function onScreen() {
      var r = host.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !onScreen()) return;
      lastPointer = Date.now();
      var r = host.getBoundingClientRect();
      nx = (e.clientX - r.left) / r.width;
      ny = (e.clientY - r.top) / r.height;
      queue();
    }, { passive: true });

    /* idle drift so the panel never looks switched off */
    function drift() {
      if (!reduced() && Date.now() - lastPointer > 2600 && onScreen()) {
        t += 0.008;
        nx = 0.5 + Math.sin(t) * 0.17;
        ny = 0.4 + Math.cos(t * 0.8) * 0.11;
        queue();
      }
      window.requestAnimationFrame(drift);
    }
    window.requestAnimationFrame(drift);
  }

  /* ---------- 6. Lineup filters ---------- */
  function initFilters() {
    var bar = document.querySelector('[data-filter-bar]');
    var grid = document.querySelector('[data-lineup-grid]');
    if (!bar || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-day]'));
    var readout = document.querySelector('[data-filter-readout]');
    var empty = document.querySelector('[data-filter-empty]');
    var state = { day: 'all', stage: 'all' };

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var okDay = state.day === 'all' || card.getAttribute('data-day') === state.day;
        var okStage = state.stage === 'all' ||
          card.getAttribute('data-stage').split(' ').indexOf(state.stage) > -1;
        var show = okDay && okStage;
        if (show) shown++;
        card.hidden = !show;
      });
      if (readout) {
        readout.textContent = shown + (shown === 1 ? ' set' : ' sets') + ' in view';
      }
      if (empty) empty.hidden = shown > 0;
    }

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      var group = btn.getAttribute('data-filter-group');
      if (!group) return;
      state[group] = btn.getAttribute('data-filter');
      bar.querySelectorAll('[data-filter-group="' + group + '"]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      apply();
    });

    apply();
  }

  /* ---------- 7. FAQ accordion ---------- */
  function initAccordion() {
    var root = document.querySelector('[data-accordion]');
    if (!root) return;
    var triggers = Array.prototype.slice.call(root.querySelectorAll('.accordion__trigger'));

    function toggle(btn, force) {
      var open = force !== undefined ? force : btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.closest('.accordion__item').setAttribute('data-open', open ? 'true' : 'false');
    }

    triggers.forEach(function (btn, i) {
      btn.addEventListener('click', function () { toggle(btn); });
      btn.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown') next = triggers[(i + 1) % triggers.length];
        else if (e.key === 'ArrowUp') next = triggers[(i - 1 + triggers.length) % triggers.length];
        else if (e.key === 'Home') next = triggers[0];
        else if (e.key === 'End') next = triggers[triggers.length - 1];
        if (next) { e.preventDefault(); next.focus(); }
      });
    });

    if (triggers.length) toggle(triggers[0], true);
  }

  /* ---------- 8. Gallery marquee (duplicate track for a seamless loop) ---------- */
  function initMarquees() {
    var tracks = Array.prototype.slice.call(document.querySelectorAll('.marquee__track'));
    if (!tracks.length) return;
    tracks.forEach(function (track) {
      if (track.getAttribute('data-duplicated') === 'true') return;
      var frag = document.createDocumentFragment();
      Array.prototype.forEach.call(track.children, function (node) {
        var clone = node.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('img'), function (img) {
          img.setAttribute('loading', 'lazy');
          img.setAttribute('aria-hidden', 'true');
          img.alt = '';
        });
        frag.appendChild(clone);
      });
      track.appendChild(frag);
      track.setAttribute('data-duplicated', 'true');
    });
  }

  /* ---------- 9. Form validation ---------- */
  function initForms() {
    function setError(field, message) {
      var note = field.querySelector('.field__error');
      field.classList.toggle('field--error', !!message);
      var input = field.querySelector('input,select,textarea');
      if (message && !note && input) {
        note = document.createElement('p');
        note.className = 'field__error';
        note.id = (input.id || 'field') + '-error';
        input.setAttribute('aria-describedby', note.id);
        field.appendChild(note);
      }
      if (note) note.textContent = message || '';
      if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validate(form) {
      var ok = true;
      var fields = form.querySelectorAll('[data-required]');
      Array.prototype.forEach.call(fields, function (input) {
        var field = input.closest('.field');
        var value = (input.value || '').trim();
        var message = '';
        if (!value) message = 'This field is required';
        else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) message = 'Enter a valid email address';
        else if (input.minLength && value.length < input.minLength) message = 'At least ' + input.minLength + ' characters';
        setError(field, message);
        if (message && ok) { ok = false; input.focus(); }
        else if (message) ok = false;
      });
      return ok;
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-newsletter],[data-contact],[data-waitlist]'), function (form) {
      var status = form.querySelector('[data-form-status]') || form.querySelector('.form-note');
      form.setAttribute('novalidate', 'novalidate');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate(form)) {
          if (status) { status.textContent = 'Check the highlighted fields'; status.classList.remove('form-ok'); }
          return;
        }
        var first = form.querySelector('[data-required]');
        var name = first && first.name === 'name' ? first.value.trim().split(' ')[0] : null;
        form.reset();
        Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) { setError(f, ''); });
        if (status) {
          status.textContent = name
            ? 'Signal locked, ' + name + '. Confirmation sent.'
            : 'Signal locked. Confirmation on its way.';
          status.classList.add('form-ok');
        }
      });
    });
  }

  /* ---------- 10. Misc ---------- */
  function initMisc() {
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function boot() {
    initNav();
    initCountdowns();
    initClock();
    initMagnetic();
    initSpotlight();
    initFilters();
    initAccordion();
    initMarquees();
    initForms();
    initMisc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
