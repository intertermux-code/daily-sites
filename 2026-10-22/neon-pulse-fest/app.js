/* ==========================================================================
   NEON PULSE — shared behaviour
   Guarded per page: every block checks for its own elements first.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- 1. NAV */
  function initNav() {
    var toggle = $('#navToggle');
    var nav = $('#siteNav');
    if (!toggle || !nav) return;

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      nav.setAttribute('data-open', String(open));
    };

    setOpen(false);

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var links = $$('a', nav);
      if (!links.length) return;
      var last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === links[0]) {
        e.preventDefault();
        toggle.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1080) setOpen(false);
    });
  }

  /* ------------------------------------------------- 2. REVEAL OBSERVERS */
  function initReveals() {
    var items = $$('.reveal, .clip-in');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    // Siblings inside the same group stagger by 80ms.
    items.forEach(function (el) {
      if (el.style.getPropertyValue('--d')) return;
      var parent = el.parentElement;
      var sibs = parent ? $$('.reveal, .clip-in', parent) : [el];
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', (i * 80) + 'ms');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------- 3. COUNTDOWN CLOCK */
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function initCountdown() {
    var box = $('#countdown');
    if (!box) return;

    var targetAttr = box.getAttribute('data-target') || '2026-12-18T18:00:00';
    var target = new Date(targetAttr);
    if (isNaN(target.getTime())) target = new Date('2026-12-18T18:00:00');

    var cells = {
      days: $('[data-unit="days"]', box),
      hours: $('[data-unit="hours"]', box),
      minutes: $('[data-unit="minutes"]', box),
      seconds: $('[data-unit="seconds"]', box)
    };
    var live = $('#countdownText');
    var lastSentence = '';

    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff < 0) diff = 0;

      var totalSec = Math.floor(diff / 1000);
      var days = Math.floor(totalSec / 86400);
      var hours = Math.floor((totalSec % 86400) / 3600);
      var mins = Math.floor((totalSec % 3600) / 60);
      var secs = totalSec % 60;

      if (cells.days) cells.days.textContent = pad(days);
      if (cells.hours) cells.hours.textContent = pad(hours);
      if (cells.minutes) cells.minutes.textContent = pad(mins);
      if (cells.seconds) cells.seconds.textContent = pad(secs);

      if (live && secs % 30 === 0) {
        var sentence = diff === 0
          ? 'Neon Pulse 2026 is live — the gates at Kilnworks Yard are open.'
          : days + ' days, ' + hours + ' hours and ' + mins + ' minutes until the gates open at Kilnworks Yard.';
        if (sentence !== lastSentence) {
          live.textContent = sentence;
          lastSentence = sentence;
        }
      }

      if (diff === 0) {
        var label = $('.countdown-label b', box);
        if (label) label.textContent = 'Live now';
        clearInterval(handle);
      }
    }

    tick();
    var handle = setInterval(tick, 1000);
  }

  /* ------------------------------------------------- 4. LINEUP FILTERING */
  function initLineupFilter() {
    var grid = $('#lineupGrid');
    var bar = $('#lineupFilters');
    if (!grid || !bar) return;

    var cards = $$('.act', grid);
    var state = { day: 'all', stage: 'all', sort: 'time' };
    var countOut = $('#lineupCount');
    var emptyOut = $('#lineupEmpty');

    function matches(card) {
      var okDay = state.day === 'all' || card.getAttribute('data-day') === state.day;
      var okStage = state.stage === 'all' || card.getAttribute('data-stage') === state.stage;
      return okDay && okStage;
    }

    function orderValue(card) {
      if (state.sort === 'name') return card.getAttribute('data-name') || '';
      if (state.sort === 'day') return (card.getAttribute('data-day-order') || '9') + (card.getAttribute('data-start') || '');
      return (card.getAttribute('data-day-order') || '9') + (card.getAttribute('data-start') || '');
    }

    function render() {
      var visible = cards.filter(matches);

      if (state.sort !== 'default') {
        visible.sort(function (a, b) {
          var av = orderValue(a), bv = orderValue(b);
          if (av < bv) return -1;
          if (av > bv) return 1;
          return 0;
        });
        visible.forEach(function (card) { grid.appendChild(card); });
      }

      cards.forEach(function (card) {
        var hidden = visible.indexOf(card) === -1;
        card.classList.toggle('is-hidden', hidden);
        card.setAttribute('aria-hidden', String(hidden));
        if (!hidden && reduceMotion) card.classList.add('in');
      });

      if (countOut) {
        countOut.textContent = visible.length === cards.length
          ? cards.length + ' acts · full lineup'
          : visible.length + ' of ' + cards.length + ' acts';
      }
      if (emptyOut) emptyOut.hidden = visible.length !== 0;

      // keep any newly-shown cards revealed
      if (!reduceMotion) {
        visible.forEach(function (card) {
          if (!card.classList.contains('in')) {
            requestAnimationFrame(function () { card.classList.add('in'); });
          }
        });
      }
    }

    bar.addEventListener('click', function (e) {
      var pill = e.target.closest ? e.target.closest('.pill') : null;
      if (!pill) return;
      var group = pill.getAttribute('data-group');
      var value = pill.getAttribute('data-value');
      if (!group) return;

      if (group === 'sort') {
        state.sort = value;
      } else {
        state[group] = value;
      }

      $$('.pill[data-group="' + group + '"]', bar).forEach(function (p) {
        p.setAttribute('aria-pressed', String(p === pill));
      });
      render();
    });

    var reset = $('#lineupReset');
    if (reset) {
      reset.addEventListener('click', function () {
        state = { day: 'all', stage: 'all', sort: 'time' };
        $$('.pill', bar).forEach(function (p) {
          var g = p.getAttribute('data-group');
          var v = p.getAttribute('data-value');
          var on = (g === 'day' && v === 'all') || (g === 'stage' && v === 'all') || (g === 'sort' && v === 'time');
          p.setAttribute('aria-pressed', String(on));
        });
        render();
      });
    }

    render();
  }

  /* ---------------------------------------------------- 5. FAQ ACCORDION */
  function initAccordion() {
    var items = $$('.acc-item');
    if (!items.length) return;

    items.forEach(function (item, i) {
      var btn = $('.acc-btn', item);
      var panel = $('.acc-panel', item);
      if (!btn || !panel) return;

      var id = 'acc-panel-' + (i + 1);
      panel.id = id;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', id);
      panel.setAttribute('data-open', 'false');

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.setAttribute('data-open', String(!open));
      });
    });

    var deepId = window.location.hash.replace('#', '');
    if (deepId) {
      var target = document.getElementById(deepId);
      if (target) {
        var host = target.closest ? target.closest('.acc-item') : null;
        if (host) {
          var b = $('.acc-btn', host);
          var p = $('.acc-panel', host);
          if (b && p) {
            b.setAttribute('aria-expanded', 'true');
            p.setAttribute('data-open', 'true');
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------ 6. FORMS */
  function wireForm(formId, statusId, successText) {
    var form = document.getElementById(formId);
    if (!form) return;
    var status = statusId ? document.getElementById(statusId) : null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = form.querySelector('[required]');
      var bad = null;

      $$('[required]', form).forEach(function (input) {
        var empty = !String(input.value || '').trim();
        var emailBad = input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value);
        input.setAttribute('aria-invalid', String(empty || emailBad));
        if ((empty || emailBad) && !bad) bad = input;
      });

      var check = form.querySelector('[data-require-check]');
      if (check && !check.checked && !bad) bad = check;

      if (bad) {
        bad.focus();
        if (status) {
          status.hidden = false;
          status.style.color = 'var(--danger)';
          status.textContent = 'Check the highlighted field — it needs a valid answer before we can send this.';
          return;
        }
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      window.setTimeout(function () {
        form.reset();
        $$('[aria-invalid]', form).forEach(function (input) { input.removeAttribute('aria-invalid'); });
        $$('input', form).forEach(function (input) {
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (status) {
          status.hidden = false;
          status.style.color = '';
          status.textContent = successText;
        }
      }, 550);
    });
  }

  function initForms() {
    wireForm('newsForm', 'newsStatus', '[OK] You are on the list. First signal drop lands Thursday.');
    wireForm('waitlistForm', 'waitlistStatus', '[OK] Return-queue slot saved. We will email the moment a Tier 1 seat frees.');
    wireForm('contactForm', 'contactStatus', '[OK] Message queued. The crew answers within two working days.');
    wireForm('basketForm', 'basketStatus', '[OK] Order held for 15 minutes. Secure checkout opens with your wristband details.');
  }

  /* ----------------------------------------------------------- 7. TICKETS */
  function initTicketQty() {
    var rows = $$('[data-qty]');
    if (!rows.length) return;

    rows.forEach(function (row) {
      var input = $('input', row);
      var minus = $('[data-step="-1"]', row);
      var plus = $('[data-step="1"]', row);
      var out = $('[data-qty-out]', row);
      var max = parseInt(row.getAttribute('data-qty-max') || '6', 10);
      if (!input) return;

      var clamp = function (v) {
        v = parseInt(v, 10);
        if (isNaN(v) || v < 1) v = 1;
        if (v > max) v = max;
        return v;
      };
      var paint = function () {
        var v = clamp(input.value);
        input.value = v;
        if (out) out.textContent = '× ' + v;
        var price = parseFloat(row.getAttribute('data-price') || '0');
        var totalOut = $('[data-total-out]', row);
        if (totalOut) totalOut.textContent = '£' + (price * v).toFixed(2);
        if (minus) minus.disabled = v <= 1;
        if (plus) plus.disabled = v >= max;
      };

      if (minus) minus.addEventListener('click', function () { input.value = clamp(input.value) - 1; paint(); });
      if (plus) plus.addEventListener('click', function () { input.value = clamp(input.value) + 1; paint(); });
      input.addEventListener('change', paint);
      paint();
    });

    var summary = $('#basketTotal');
    if (summary) {
      var recompute = function () {
        var sum = 0;
        $$('[data-qty]').forEach(function (row) {
          var input = $('input', row);
          var price = parseFloat(row.getAttribute('data-price') || '0');
          var qty = parseInt(input && input.value, 10) || 0;
          if (row.getAttribute('data-included') !== 'false') sum += price * qty;
        });
        var total = '£' + sum.toFixed(2);
        summary.textContent = total;
        $$('[data-grand]').forEach(function (el) { el.textContent = total; });
      };
      $$('[data-qty] input').forEach(function (i) { i.addEventListener('change', recompute); });
      $$('[data-qty] [data-step]').forEach(function (b) { b.addEventListener('click', recompute); });
      recompute();
    }
  }

  /* ------------------------------------------------------- 8. LIGHTBOX */
  function initLightbox() {
    var shots = $$('.shot[data-lightbox]');
    if (!shots.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.hidden = true;
    box.innerHTML =
      '<button class="lb-close" type="button" aria-label="Close photo viewer">✕</button>' +
      '<button class="lb-nav lb-prev" type="button" aria-label="Previous photo">‹</button>' +
      '<button class="lb-nav lb-next" type="button" aria-label="Next photo">›</button>' +
      '<figure><img alt="" width="1400" height="933"><figcaption><span></span><span></span></figcaption></figure>';
    document.body.appendChild(box);

    var img = $('img', box);
    var caps = $$('figcaption span', box);
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + shots.length) % shots.length;
      var src = shots[index].getAttribute('data-full') || $('img', shots[index]).src;
      img.src = src;
      img.alt = shots[index].getAttribute('data-alt') || $('img', shots[index]).getAttribute('alt') || '';
      caps[0].textContent = shots[index].getAttribute('data-caption') || '';
      caps[1].textContent = 'Photo ' + (index + 1) + ' of ' + shots.length;
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      $('.lb-close', box).focus();
      document.body.style.overflow = 'hidden';
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    shots.forEach(function (shot, i) {
      shot.addEventListener('click', function (e) {
        e.preventDefault();
        open(i);
      });
    });

    $('.lb-close', box).addEventListener('click', close);
    $('.lb-prev', box).addEventListener('click', function () { show(index - 1); });
    $('.lb-next', box).addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ------------------------------------------------ 9. CRT BOOT SEQUENCE */
  function initBoot() {
    var node = $('[data-boot]');
    if (!node || reduceMotion) return;

    var lines = (node.getAttribute('data-boot') || '').split('|');
    node.textContent = '';
    var i = 0;

    var step = function () {
      if (i >= lines.length) return;
      if (i > 0) node.appendChild(document.createElement('br'));
      var prompt = document.createElement('span');
      prompt.className = 'k';
      prompt.textContent = '$ ';
      var out = document.createElement('span');
      out.textContent = lines[i] + ' ';
      var ok = document.createElement('span');
      ok.className = 'ok';
      ok.textContent = '[ok]';
      node.appendChild(prompt);
      node.appendChild(out);
      node.appendChild(ok);
      i += 1;
      window.setTimeout(step, 260);
    };
    step();
  }

  /* ---------------------------------------------------------- 10. SCROLL */
  function initScrollProgress() {
    var bar = $('#scrollBar');
    if (!bar || reduceMotion) return;
    var ticking = false;
    var update = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.transform = 'scaleX(' + (pct / 100) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* --------------------------------------------------------------- BOOT */
  var start = function () {
    initNav();
    initReveals();
    initCountdown();
    initLineupFilter();
    initAccordion();
    initForms();
    initTicketQty();
    initLightbox();
    initBoot();
    initScrollProgress();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
