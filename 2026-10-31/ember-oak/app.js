/* Ember & Oak — shared behaviour
   Every block is guarded by an element-existence check so one file
   serves all five pages. Vanilla only, no dependencies. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. Word-stagger headline (signature motion) ---------- */
  function initWords() {
    var heads = $$('.words');
    if (!heads.length) return;
    heads.forEach(function (el) {
      if (el.dataset.split) return;
      el.dataset.split = '1';
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (w, i) {
        var span = document.createElement('span');
        span.className = 'w';
        span.style.setProperty('--i', i);
        span.textContent = w;
        el.appendChild(span);
        el.appendChild(document.createTextNode(' '));
      });
      if (reduce.matches) { el.classList.add('is-in'); return; }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add('is-in'); });
      });
    });
  }

  /* ---------- 2. Mobile navigation ---------- */
  function initNav() {
    var btn = $('.nav-toggle');
    var nav = $('#primary-nav');
    if (!btn || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open navigation menu');
    }
    function open() {
      nav.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close navigation menu');
    }
    btn.addEventListener('click', function () {
      nav.classList.contains('is-open') ? close() : open();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { close(); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) close();
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('focus', function () { nav.classList.add('is-open'); });
    });
  }

  /* ---------- 3. Instrument-panel entrance stagger (tiles & quotes) ---------- */
  function initReveal() {
    var items = $$('.dash .tile, .press .quote');
    if (!items.length || reduce.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (i) { i.classList.add('is-in'); });
      return;
    }
    items.forEach(function (i) { i.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = $$('.reveal', el.parentElement);
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 6) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------- 4. Live gauge readouts in the hero ---------- */
  function initGauges() {
    var cells = $$('[data-gauge]');
    if (!cells.length) return;
    cells.forEach(function (el) {
      var small = el.querySelector('small');
      var tail = small ? small.cloneNode(true) : null;
      var target = parseInt(el.textContent, 10);
      if (isNaN(target) || reduce.matches) return;
      var start = performance.now(), dur = 1100;
      function paint(n) {
        el.textContent = String(n);
        if (tail) el.appendChild(tail);
      }
      paint(0);
      requestAnimationFrame(function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        paint(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      });
    });
  }

  /* ---------- 5. Menu tabs (menu.html) ---------- */
  function initTabs() {
    var tablist = $('[data-tabs]');
    if (!tablist) return;
    var tabs = $$('[role="tab"]', tablist);
    if (!tabs.length) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      var shown = document.getElementById(tab.getAttribute('aria-controls'));
      if (shown) $$('.dish', shown).forEach(function (d) { d.classList.add('is-in'); });
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab), next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    var deep = window.location.hash.replace('#', '');
    var match = tabs.filter(function (t) { return t.getAttribute('aria-controls') === deep; })[0];
    select(match || tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0], false);

    /* filter a course by search box, if present */
    var search = $('[data-menu-search]');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.toLowerCase().trim();
        $$('.course:not([hidden]) .dish').forEach(function (d) {
          var hit = !q || d.textContent.toLowerCase().indexOf(q) > -1;
          d.style.display = hit ? '' : 'none';
        });
      });
    }
  }

  /* ---------- 6. Gallery: filters + lightbox ---------- */
  function initGallery() {
    var grid = $('[data-gallery]');
    if (!grid) return;
    var shots = $$('.shot', grid);

    var chips = $$('.chip[data-filter]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        shots.forEach(function (s) {
          s.hidden = !(want === 'all' || s.dataset.cat === want);
        });
        var live = $('[data-gallery-count]');
        if (live) live.textContent = shots.filter(function (s) { return !s.hidden; }).length + ' images';
      });
    });

    var lb = $('#lightbox');
    if (!lb) return;
    var img = $('img', lb), cap = $('.lb__cap b', lb), meta = $('.lb__cap span', lb),
        count = $('.lb__count', lb), last = null, index = 0;

    function visible() { return shots.filter(function (s) { return !s.hidden; }); }

    function render(i) {
      var list = visible();
      if (!list.length) return;
      index = (i + list.length) % list.length;
      var shot = list[index], src = $('img', shot);
      img.src = src.src;
      img.alt = src.alt;
      img.setAttribute('width', src.getAttribute('width') || 1200);
      img.setAttribute('height', src.getAttribute('height') || 800);
      var capEl = $('.shot__cap', shot);
      cap.textContent = $('b', capEl).textContent;
      meta.textContent = $('span', capEl).textContent;
      count.textContent = (index + 1) + ' / ' + list.length;
    }
    function open(shot) {
      last = document.activeElement;
      render(shots.indexOf(shot));
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      $('.lb__next', lb).focus();
    }
    function shut() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      if (last) last.focus();
    }
    shots.forEach(function (shot) {
      shot.addEventListener('click', function () { open(shot); });
    });
    $('.lb__close', lb).addEventListener('click', shut);
    $('.lb__prev', lb).addEventListener('click', function () { render(index - 1); });
    $('.lb__next', lb).addEventListener('click', function () { render(index + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) shut(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') shut();
      else if (e.key === 'ArrowLeft') render(index - 1);
      else if (e.key === 'ArrowRight') render(index + 1);
      else if (e.key === 'Tab') {
        var f = $$('button', lb), first = f[0], lastB = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
        else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 7. Reservation form ---------- */
  function initBooking() {
    var form = $('#booking-form');
    if (!form) return;

    var today = new Date();
    var minDate = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
    var maxDate = new Date(today.getTime() + 86400000 * 60).toISOString().slice(0, 10);
    var dateInput = form.elements['date'];
    if (dateInput) { dateInput.min = minDate; dateInput.max = maxDate; }

    var rules = {
      name: function (v) {
        if (!v.trim()) return 'Please give the name the table is held under.';
        if (v.trim().length < 2) return 'That looks too short to be a name.';
        return '';
      },
      phone: function (v) {
        var digits = v.replace(/\D/g, '');
        if (!v.trim()) return 'We call to confirm larger parties, so we need a number.';
        if (digits.length < 10) return 'Enter ten or more digits, including area code.';
        return '';
      },
      email: function (v) {
        if (!v.trim()) return 'We send the hold to this address.';
        return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'That address is missing an @ or a domain.';
      },
      date: function (v) {
        if (!v) return 'Pick a date within the next sixty days.';
        var d = new Date(v + 'T12:00:00');
        if (isNaN(d.getTime())) return 'That date could not be read.';
        if (v < minDate || v > maxDate) return 'The book opens one day ahead and closes sixty days out.';
        if (d.getDay() === 1) return 'Mondays the ovens are cold. Try Tuesday onwards.';
        return '';
      },
      time: function (v) { return v ? '' : 'Choose a seating time.'; },
      party: function (v) {
        if (!v) return 'How many are dining?';
        return Number(v) > 12 ? 'Parties over twelve are a buyout — use the private dining note.' : '';
      }
    };

    function fieldOf(el) { return el.closest('.field'); }
    function setError(el, msg) {
      var f = fieldOf(el);
      if (!f) return;
      var err = $('.field__err', f);
      f.classList.toggle('is-invalid', !!msg);
      f.classList.toggle('is-valid', !msg && !!el.value.trim());
      if (err) err.textContent = msg || '';
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    function validate(el) {
      var rule = rules[el.name];
      if (!rule) return true;
      var msg = rule(el.value);
      setError(el, msg);
      return !msg;
    }

    $$('input,select,textarea', form).forEach(function (el) {
      if (!el.name) return;
      el.addEventListener('blur', function () { validate(el); paintTicket(); });
      el.addEventListener('input', function () {
        if (fieldOf(el) && fieldOf(el).classList.contains('is-invalid')) validate(el);
        paintTicket();
      });
      if (el.tagName === 'SELECT') el.addEventListener('change', function () { validate(el); paintTicket(); });
    });

    /* live ticket */
    var ticket = $('.ticket');
    var out = {
      name: $('[data-out="name"]', ticket), party: $('[data-out="party"]', ticket),
      date: $('[data-out="date"]', ticket), time: $('[data-out="time"]', ticket),
      seat: $('[data-out="seat"]', ticket), room: $('[data-out="room"]', ticket)
    };
    if (!out.name) return;
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    function prettyDate(v) {
      if (!v) return '—';
      var d = new Date(v + 'T12:00:00');
      if (isNaN(d.getTime())) return '—';
      return DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }
    function paintTicket() {
      if (!out.name) return;
      var f = form.elements;
      out.name.textContent = f['name'].value.trim() || 'Unnamed party';
      out.party.textContent = f['party'].value ? f['party'].value + ' guests' : '—';
      out.date.textContent = prettyDate(f['date'].value);
      out.time.textContent = f['time'].value || '—';
      out.seat.textContent = f['seating'].value || 'Any seat';
      var n = Number(f['party'].value) || 0;
      out.room.textContent = n >= 7 ? 'Long Oak Table' : (f['seating'].value === 'Hearth counter' ? 'Fire Room' : 'Main Hall');
      var live = $$('.trow dd[data-live]', document);
      live.forEach(function (l) { l.setAttribute('data-filled', l.textContent !== '—' ? 'true' : 'false'); });
    }

    var status = $('[data-form-status]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('input,select', form).filter(function (el) { return rules[el.name]; });
      var bad = fields.filter(function (el) { return !validate(el); });
      if (bad.length) {
        if (status) { status.textContent = bad.length + ' field' + (bad.length > 1 ? 's need' : ' needs') + ' attention before we can hold the table.'; status.setAttribute('data-tone', 'error'); }
        bad[0].focus();
        return;
      }
      if (status) { status.textContent = 'Sending to the host desk…'; status.setAttribute('data-tone', 'busy'); }

      window.setTimeout(function () {
        var seq = String(Math.floor(1000 + Math.random() * 8999));
        var code = 'EO-' + prettyDate(form.elements['date'].value).slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') + '-' + seq;
        var done = $('#confirmation');
        if (!done) return;
        $$('[data-out]', done).forEach(function (el) {
          var key = el.getAttribute('data-out');
          if (key === 'code') { el.textContent = code; return; }
          var src = out[key];
          if (src) el.textContent = src.textContent;
        });
        done.classList.add('is-on');
        form.classList.add('is-done');
        done.setAttribute('tabindex', '-1');
        done.focus();
        if (status) { status.textContent = ''; status.removeAttribute('data-tone'); }
      }, 620);
    });

    paintTicket();
  }

  /* ---------- 8. Visit: today + live open state ---------- */
  function initVisit() {
    var table = $('[data-hours]');
    if (table) {
      var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      var t = days[new Date().getDay()];
      $$('tr[data-day]', table).forEach(function (row) {
        if (row.getAttribute('data-day').split(' ').indexOf(t) > -1) row.classList.add('is-today');
      });
    }
    var badge = $('[data-open-state]');
    if (badge) {
      var now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
      var open = false, why = '';
      if (day === 1) { why = 'Mondays the ovens are cold'; }
      else if (day === 0) { open = mins >= 660 && mins <= 1200; why = open ? 'Sunday hearth is on' : 'Sunday service ends at 20:00'; }
      else if (day === 5 || day === 6) { open = mins >= 1020 && mins <= 1410; why = open ? 'Fri–Sat until 23:30' : 'Doors 17:00–23:30'; }
      else { open = mins >= 1020 && mins <= 1320; why = open ? 'Tue–Thu service' : 'Doors at 17:00'; }
      badge.textContent = (open ? 'Open now · ' : 'Closed · ') + why;
      badge.classList.add(open ? 'badge--open' : 'badge--closed');
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    initWords(); initNav(); initReveal(); initGauges();
    initTabs(); initGallery(); initBooking(); initVisit();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
