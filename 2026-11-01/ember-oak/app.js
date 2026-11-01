/* ==========================================================================
   Ember & Oak — shared behaviour
   Signature motion: Decode Text (hero) + Spring Accordion (panels)
   Structure: Pinned Narrative scroll drive
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var prefersStill = reduce.matches;
  reduce.addEventListener('change', function (e) { prefersStill = e.matches; });

  /* ---------- Header state + mobile nav ---------- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    var toggle = document.querySelector('.nav-toggle');
    var list = document.querySelector('[data-nav-list]');
    if (!header) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle('is-stuck', window.scrollY > 40);
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!toggle || !list) return;

    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      var sr = toggle.querySelector('.sr-only');
      if (sr) sr.textContent = open ? 'Close main menu' : 'Open main menu';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    list.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---------- Decode Text: one hero keyword resolves on load ---------- */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@*+=/\\<>▮▯';

  function initDecode() {
    var nodes = document.querySelectorAll('[data-decode]');
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      var final = node.getAttribute('data-final') || node.textContent.trim();
      if (prefersStill) { node.textContent = final; return; }

      var len = final.length;
      node.setAttribute('data-decoding', 'true');
      var start = null;
      var LOCK_AT = 90;   // ms per character revealed
      var NOISE_AT = 45;  // ms per glyph swap

      function scramble(revealed) {
        var out = final.slice(0, revealed);
        for (var i = revealed; i < len; i++) {
          var ch = final[i];
          out += ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        node.textContent = out;
      }

      function frame(ts) {
        if (start === null) start = ts;
        var elapsed = ts - start;
        var revealed = Math.min(len, Math.floor(elapsed / LOCK_AT));
        if (Math.floor(elapsed / NOISE_AT) !== frame._last || revealed !== frame._rev) {
          frame._last = Math.floor(elapsed / NOISE_AT);
          frame._rev = revealed;
          scramble(revealed);
        }
        if (revealed < len) {
          requestAnimationFrame(frame);
        } else {
          node.textContent = final;
          node.removeAttribute('data-decoding');
        }
      }
      scramble(0);
      requestAnimationFrame(frame);
    });
  }

  /* ---------- Pinned Narrative: scroll drive for sticky scenes ---------- */
  function initPins() {
    var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-pin-scene]'));
    if (!scenes.length) return;

    var ticking = false;
    function measure() {
      scenes.forEach(function (scene) {
        var rect = scene.getBoundingClientRect();
        var total = rect.height - window.innerHeight;
        var progress = total > 0 ? (0 - rect.top) / total : 0;
        progress = Math.min(1, Math.max(0, progress));
        scene.style.setProperty('--pin', progress.toFixed(4));
      });
      ticking = false;
    }
    function request() {
      if (!ticking) { ticking = true; requestAnimationFrame(measure); }
    }
    measure();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  }

  /* ---------- Spring Accordion: one panel per group ---------- */
  function initAccordions() {
    document.querySelectorAll('[data-accordion]').forEach(function (group) {
      var items = Array.prototype.slice.call(group.querySelectorAll('.acc__item'));
      if (!items.length) return;

      function close(item) {
        var btn = item.querySelector('.acc__trigger');
        var panel = item.querySelector('.acc__panel');
        if (!btn || !panel) return;
        btn.setAttribute('aria-expanded', 'false');
        panel.classList.remove('is-open');
      }
      function open(item) {
        var btn = item.querySelector('.acc__trigger');
        var panel = item.querySelector('.acc__panel');
        if (!btn || !panel) return;
        btn.setAttribute('aria-expanded', 'true');
        panel.classList.add('is-open');
      }

      items.forEach(function (item) {
        var btn = item.querySelector('.acc__trigger');
        if (!btn) return;
        btn.addEventListener('click', function () {
          var isOpen = btn.getAttribute('aria-expanded') === 'true';
          items.forEach(close);
          if (!isOpen) open(item);
        });
      });

      var preopened = group.querySelector('.acc__trigger[aria-expanded="true"]');
      if (!preopened) open(items[0]);
    });
  }

  /* ---------- Menu tabs ---------- */
  function initTabs() {
    var sets = document.querySelectorAll('[data-tabs]');
    sets.forEach(function (root) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
      var bar = root.querySelector('.tabs__list');
      var indicator = root.querySelector('.tabs__indicator');
      if (!tabs.length) return;

      function moveIndicator(tab) {
        if (!indicator || !bar) return;
        indicator.style.setProperty('--tx', tab.offsetLeft + 'px');
        indicator.style.setProperty('--tw', tab.offsetWidth + 'px');
      }

      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.setAttribute('tabindex', on ? '0' : '-1');
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        moveIndicator(tab);
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(tab, false); });
        tab.addEventListener('keydown', function (e) {
          var last = tabs.length - 1;
          var next = null;
          if (e.key === 'ArrowRight') next = tabs[i === last ? 0 : i + 1];
          else if (e.key === 'ArrowLeft') next = tabs[i === 0 ? last : i - 1];
          else if (e.key === 'Home') next = tabs[0];
          else if (e.key === 'End') next = tabs[last];
          if (!next) return;
          e.preventDefault();
          select(next, true);
        });
      });

      select(tabs[0], false);
      window.addEventListener('resize', function () {
        var active = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
        if (active) moveIndicator(active);
      });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          var active = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
          if (active) moveIndicator(active);
        });
      }
    });
  }

  /* ---------- Gallery lightbox ---------- */
  function initLightbox() {
    var grids = document.querySelectorAll('[data-gallery]');
    var box = document.getElementById('lightbox');
    if (!grids.length || !box) return;

    var figs = Array.prototype.slice.call(box.parentElement.querySelectorAll('[data-gallery] .g-item'));
    var img = box.querySelector('.lightbox__img');
    var cap = box.querySelector('[data-lb-cap]');
    var num = box.querySelector('[data-lb-num]');
    var closeBtn = box.querySelector('[data-lb-close]');
    var prevBtn = box.querySelector('[data-lb-prev]');
    var nextBtn = box.querySelector('[data-lb-next]');
    var index = 0;
    var opener = null;

    function paint(i) {
      index = (i + figs.length) % figs.length;
      var f = figs[index];
      var src = f.getAttribute('data-full') || f.querySelector('img').src;
      img.src = src;
      img.alt = f.getAttribute('data-alt') || f.querySelector('img').alt;
      if (cap) cap.textContent = f.getAttribute('data-caption') || '';
      if (num) num.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(figs.length).padStart(2, '0');
    }

    function show(i, trigger) {
      opener = trigger || null;
      paint(i);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function hide() {
      box.hidden = true;
      document.body.style.overflow = '';
      if (opener) opener.focus();
    }

    figs.forEach(function (f, i) {
      var btn = f.querySelector('.g-item__btn');
      if (!btn) return;
      btn.addEventListener('click', function () { show(i, btn); });
    });

    closeBtn.addEventListener('click', hide);
    prevBtn.addEventListener('click', function () { paint(index - 1); });
    nextBtn.addEventListener('click', function () { paint(index + 1); });

    box.addEventListener('click', function (e) {
      if (e.target === box) hide();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') hide();
      else if (e.key === 'ArrowLeft') paint(index - 1);
      else if (e.key === 'ArrowRight') paint(index + 1);
      else if (e.key === 'Tab') {
        var focusables = [closeBtn, prevBtn, nextBtn];
        var at = focusables.indexOf(document.activeElement);
        e.preventDefault();
        var step = e.shiftKey ? -1 : 1;
        var next = at === -1 ? 0 : (at + step + focusables.length) % focusables.length;
        focusables[next].focus();
      }
    });
  }

  /* ---------- Reservations form ---------- */
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function prettyDate(value) {
    var d = new Date(value + 'T12:00:00');
    if (isNaN(d)) return value;
    return DAY_NAMES[d.getDay()] + ', ' + d.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function prettyTime(value) {
    if (!value) return '';
    var parts = value.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1] || '00';
    var suffix = h >= 12 ? 'p.m.' : 'a.m.';
    var hour = h % 12 === 0 ? 12 : h % 12;
    return hour + ':' + m + ' ' + suffix;
  }

  function initBooking() {
    var form = document.querySelector('[data-booking-form]');
    if (!form) return;

    var confirmCard = document.querySelector('[data-booking-confirm]');
    var sidePanel = document.querySelector('[data-booking-side]');
    var status = form.querySelector('[data-form-status]');
    var dateInput = form.querySelector('#res-date');

    if (dateInput) {
      var today = new Date();
      var max = new Date(today.getTime() + 120 * 864e5);
      dateInput.min = today.toISOString().slice(0, 10);
      dateInput.max = max.toISOString().slice(0, 10);
    }

    var rules = {
      'res-name': function (v) {
        if (!v) return 'We need a name to hold the table.';
        if (v.trim().length < 2) return 'Please write the full name.';
        return '';
      },
      'res-phone': function (v) {
        var digits = v.replace(/\D/g, '');
        if (!v) return 'A phone number lets us reach you if the fire runs late.';
        if (digits.length < 10) return 'Enter at least 10 digits, including area code.';
        if (digits.length > 15) return 'That number looks too long.';
        return '';
      },
      'res-email': function (v) {
        if (!v) return '';
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return 'Check the email address for a typo.';
        return '';
      },
      'res-date': function (v) {
        if (!v) return 'Pick the night you would like to join us.';
        var d = new Date(v + 'T12:00:00');
        if (isNaN(d)) return 'That date could not be read.';
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d < today) return 'Please choose tonight or a date after it.';
        if (d.getDay() === 1) return 'The hearth rests on Mondays — try Tuesday instead.';
        return '';
      },
      'res-time': function (v) {
        if (!v) return 'Choose a seating time.';
        return '';
      },
      'res-party': function (v) {
        if (!v) return 'How many will be at the table?';
        var n = parseInt(v, 10);
        if (n > 8) return 'Tables of nine or more are booked through the private room — see visit details.';
        return '';
      }
    };

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input, force) {
      var rule = rules[input.id];
      if (!rule) return '';
      var msg = rule(input.value);
      var field = fieldOf(input);
      var errorNode = field && field.querySelector('.field__error');
      if (field && (force || input.dataset.touched === 'true')) {
        field.classList.toggle('is-invalid', Boolean(msg));
        field.classList.toggle('is-valid', !msg && input.value.trim() !== '');
      }
      if (errorNode) errorNode.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return msg;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
    inputs.forEach(function (input) {
      if (!rules[input.id]) return;
      input.addEventListener('blur', function () {
        input.dataset.touched = 'true';
        validate(input, true);
      });
      input.addEventListener('input', function () {
        if (input.dataset.touched === 'true' || fieldOf(input).classList.contains('is-invalid')) {
          validate(input, true);
        }
      });
      input.addEventListener('change', function () {
        if (input.tagName === 'SELECT' || input.type === 'date') {
          input.dataset.touched = 'true';
          validate(input, true);
        }
      });
    });

    if (status) {
      inputs.forEach(function (input) {
        input.addEventListener('input', function () {
          status.textContent = 'Guests of nine or more: call the room and we will build the evening around you.';
          status.classList.remove('is-error');
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      var ok = true;
      inputs.forEach(function (input) {
        if (!rules[input.id]) return;
        input.dataset.touched = 'true';
        var msg = validate(input, true);
        if (msg) {
          ok = false;
          if (!firstBad) firstBad = input;
        }
      });

      if (!ok) {
        if (status) {
          status.textContent = 'A few details need attention before we can hold the table.';
          status.classList.add('is-error');
        }
        if (firstBad) firstBad.focus();
        return;
      }

      var data = {};
      inputs.forEach(function (input) { data[input.id] = input.value.trim(); });

      var seatingEl = form.querySelector('input[name="seating"]:checked');
      var seating = seatingEl ? seatingEl.value : 'Dining Room';
      var occasionEl = form.querySelector('#res-occasion');
      var code = 'EO-' + Math.random().toString(36).slice(2, 6).toUpperCase();

      var set = function (sel, text) {
        var node = document.querySelector('[data-confirm-' + sel + ']');
        if (node) node.textContent = text;
      };
      set('name', data['res-name']);
      set('date', prettyDate(data['res-date']));
      set('time', prettyTime(data['res-time']));
      set('party', data['res-party'] + (parseInt(data['res-party'], 10) === 1 ? ' guest' : ' guests'));
      set('seating', seating);
      set('phone', data['res-phone']);
      set('occasion', occasionEl && occasionEl.value ? occasionEl.value : 'None');
      set('code', code);

      form.classList.add('is-hidden');
      if (sidePanel) sidePanel.classList.add('is-hidden');
      if (confirmCard) {
        confirmCard.classList.remove('is-hidden');
        confirmCard.setAttribute('tabindex', '-1');
        confirmCard.focus();
        confirmCard.scrollIntoView({ block: 'center', behavior: prefersStill ? 'auto' : 'smooth' });
      }
    });

    form.addEventListener('reset', function () {
      setTimeout(function () {
        inputs.forEach(function (input) {
          input.dataset.touched = '';
          var field = fieldOf(input);
          if (field) field.classList.remove('is-invalid', 'is-valid');
          var err = field && field.querySelector('.field__error');
          if (err) err.textContent = '';
        });
        if (status) {
          status.textContent = 'Guests of nine or more: call the room and we will build the evening around you.';
          status.classList.remove('is-error');
        }
      }, 0);
    });

    var again = document.querySelector('[data-booking-reset]');
    if (again) {
      again.addEventListener('click', function () {
        if (confirmCard) confirmCard.classList.add('is-hidden');
        form.classList.remove('is-hidden');
        if (sidePanel) sidePanel.classList.remove('is-hidden');
        inputs.forEach(function (input) {
          input.dataset.touched = '';
          var field = fieldOf(input);
          if (field) field.classList.remove('is-invalid', 'is-valid');
          var err = field && field.querySelector('.field__error');
          if (err) err.textContent = '';
        });
        form.reset();
        var name = form.querySelector('#res-name');
        if (name) name.focus();
      });
    }
  }

  /* ---------- Footer newsletter ---------- */
  function initNewsletter() {
    document.querySelectorAll('[data-news-form]').forEach(function (form) {
      var input = form.querySelector('input[type="email"]');
      var msg = form.querySelector('[data-news-msg]');
      if (!input || !msg) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value.trim();
        var bad = !v ? 'Please enter an email address.' :
          (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? 'That address does not look complete.' : '');
        msg.classList.toggle('is-error', Boolean(bad));
        msg.classList.toggle('is-ok', !bad);
        if (bad) { input.focus(); msg.textContent = bad; return; }
        msg.textContent = 'You are on the list — the next letter fires on the first of the month.';
        form.reset();
      });
      input.addEventListener('input', function () {
        if (msg.classList.contains('is-error')) { msg.textContent = ''; msg.classList.remove('is-error'); }
      });
    });
  }

  /* ---------- Visit: today’s hours + live status ---------- */
  function initHours() {
    var table = document.querySelector('[data-hours-table]');
    if (!table) return;
    var now = new Date();
    var day = now.getDay();
    var rows = Array.prototype.slice.call(table.querySelectorAll('[data-day]'));
    rows.forEach(function (row) {
      if (parseInt(row.getAttribute('data-day'), 10) === day) {
        row.classList.add('is-today');
        var flag = document.createElement('span');
        flag.textContent = ' — today';
        flag.style.color = 'var(--ember)';
        row.querySelector('dt').appendChild(flag);
      }
    });

    var chip = document.querySelector('[data-open-status]');
    if (!chip) return;
    /* Kitchen hours keyed by weekday as [open, close] in 24h decimals; null = closed */
    var schedule = [
      [16.5, 21],   // Sunday
      null,         // Monday
      [17, 22],     // Tuesday
      [17, 22],     // Wednesday
      [17, 22],     // Thursday
      [17, 23],     // Friday
      [17, 23]      // Saturday
    ];
    var clock = function (decimal) {
      var h = Math.floor(decimal);
      var m = Math.round((decimal - h) * 60);
      return prettyTime(h + ':' + (m < 10 ? '0' + m : m));
    };
    var tonight = schedule[day];
    var decimal = now.getHours() + now.getMinutes() / 60;
    var isOpen = tonight && decimal >= tonight[0] && decimal < tonight[1];

    if (!tonight) {
      chip.textContent = 'Closed Mondays · the hearth rests';
    } else if (isOpen) {
      chip.textContent = 'Fire lit · serving until ' + clock(tonight[1]);
    } else if (decimal < tonight[0]) {
      chip.textContent = 'Opens tonight at ' + clock(tonight[0]);
    } else {
      chip.textContent = 'Service closed · bar until eleven';
    }
    chip.classList.toggle('is-open', Boolean(isOpen));
  }

  /* ---------- Year stamp ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initHeader();
    initDecode();
    initPins();
    initAccordions();
    initTabs();
    initLightbox();
    initBooking();
    initNewsletter();
    initHours();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
