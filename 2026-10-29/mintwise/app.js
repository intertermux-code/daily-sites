/* =========================================================
   Mintwise — shared script
   Every block is guarded by an element-existence check so a
   page can load without touching code it does not use.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* ---------- primary nav (mobile) ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setOpen(false); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) { setOpen(false); }
    });
  }

  /* ---------- signature motion #2: cursor spotlight ---------- */
  var stages = document.querySelectorAll('[data-spotlight]');
  if (stages.length && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    stages.forEach(function (stage) {
      var queued = false;
      var last = { x: 0, y: 0 };
      var paint = function () {
        queued = false;
        var rect = stage.getBoundingClientRect();
        var x = ((last.x - rect.left) / rect.width) * 100;
        var y = ((last.y - rect.top) / rect.height) * 100;
        stage.style.setProperty('--mx', x.toFixed(2) + '%');
        stage.style.setProperty('--my', y.toFixed(2) + '%');
      };
      stage.addEventListener('pointermove', function (e) {
        last.x = e.clientX;
        last.y = e.clientY;
        if (!queued) {
          queued = true;
          window.requestAnimationFrame(paint);
        }
      });
      stage.addEventListener('pointerleave', function () {
        stage.style.setProperty('--mx', '');
        stage.style.setProperty('--my', '');
      });
    });
  }

  /* ---------- pinned narrative index ---------- */
  var pinList = document.getElementById('pin-index');
  var pinSteps = document.querySelectorAll('.pin__step');
  if (pinList && pinSteps.length) {
    var items = pinList.querySelectorAll('li');
    var setActive = function (n) {
      items.forEach(function (li) {
        li.classList.toggle('is-active', li.getAttribute('data-step') === String(n));
      });
    };
    setActive(0);
    if ('IntersectionObserver' in window) {
      var seen = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var idx = Array.prototype.indexOf.call(pinSteps, entry.target);
          seen[idx] = entry.isIntersecting;
        });
        for (var i = 0; i < pinSteps.length; i++) {
          if (seen[i]) { setActive(i); break; }
        }
      }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
      pinSteps.forEach(function (step) { io.observe(step); });
    }
  }

  /* ---------- helpers ---------- */
  var usd = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  });
  var usdCents = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  var num = function (value) {
    var n = parseFloat(value);
    return isFinite(n) && n > 0 ? n : 0;
  };
  var C_OUTER = 2 * Math.PI * 92;   /* r = 92  */
  var C_INNER = 2 * Math.PI * 64;   /* r = 64  */

  /* ---------- interactive budget calculator ---------- */
  var calcForm = document.getElementById('calc-form');
  if (calcForm) {
    var rowsWrap = document.getElementById('exp-rows');
    var rowTemplate = rowsWrap ? rowsWrap.querySelector('.row') : null;
    var uid = rowsWrap ? rowsWrap.querySelectorAll('.row').length : 0;
    var defaults = [
      ['Rent / mortgage', 1450, 'essential'],
      ['Groceries', 480, 'essential'],
      ['Utilities & bills', 196, 'essential'],
      ['Transit & fuel', 210, 'essential'],
      ['Eating out & hobbies', 320, 'lifestyle'],
      ['Subscriptions', 74, 'lifestyle']
    ];

    var makeRow = function (name, amount, type) {
      if (!rowsWrap || !rowTemplate) { return; }
      uid += 1;
      var clone = rowTemplate.cloneNode(true);
      var nameIn = clone.querySelector('.js-name');
      var amtIn = clone.querySelector('.js-amt');
      var typeIn = clone.querySelector('.js-type');
      var btn = clone.querySelector('.js-remove');
      nameIn.id = 'exp-name-' + uid;
      amtIn.id = 'exp-amt-' + uid;
      typeIn.id = 'exp-type-' + uid;
      clone.querySelectorAll('label.sr-only').forEach(function (label, i) {
        label.setAttribute('for', i === 0 ? nameIn.id : (i === 1 ? amtIn.id : typeIn.id));
      });
      nameIn.value = name;
      amtIn.value = amount;
      typeIn.value = type;
      btn.setAttribute('aria-label', 'Remove ' + name + ' line');
      rowsWrap.appendChild(clone);
    };

    /* add default rows if the page shipped an empty list */
    if (rowsWrap && !rowsWrap.querySelector('.row')) {
      defaults.forEach(function (d) { makeRow(d[0], d[1], d[2]); });
    }

    var collect = function () {
      var list = [];
      if (!rowsWrap) { return list; }
      rowsWrap.querySelectorAll('.row').forEach(function (row) {
        var label = (row.querySelector('.js-name') || {}).value || 'Untitled';
        var amount = num((row.querySelector('.js-amt') || {}).value);
        var type = (row.querySelector('.js-type') || {}).value || 'essential';
        if (amount > 0) { list.push({ label: label.trim() || 'Untitled', amount: amount, type: type }); }
      });
      return list;
    };

    var setRing = function (el, ratio, circumference) {
      if (!el) { return; }
      var len = Math.max(0, Math.min(1, ratio)) * circumference;
      el.setAttribute('stroke-dasharray', len.toFixed(1) + ' ' + circumference.toFixed(1));
    };
    var text = function (id, value) {
      var el = document.getElementById(id);
      if (el) { el.textContent = value; }
    };

    var render = function () {
      var income = num((document.getElementById('income') || {}).value) +
                   num((document.getElementById('extra') || {}).value);
      var cash = num((document.getElementById('cash') || {}).value);
      var targetEl = document.getElementById('target');
      var target = targetEl ? parseFloat(targetEl.value) / 100 : 0.2;
      var targetOut = document.getElementById('target-out');
      if (targetOut) { targetOut.textContent = Math.round(target * 100) + '% of income'; }

      var expenses = collect();
      var spent = expenses.reduce(function (s, e) { return s + e.amount; }, 0);
      var essentials = expenses.filter(function (e) { return e.type === 'essential'; })
        .reduce(function (s, e) { return s + e.amount; }, 0);
      var lifestyle = spent - essentials;
      var keep = income - spent;
      var rate = income > 0 ? keep / income : 0;
      var essentialShare = income > 0 ? essentials / income : 0;

      text('out-spent', usd.format(spent));
      text('out-keep', keep >= 0 ? usd.format(keep) : '−' + usd.format(Math.abs(keep)));
      text('out-rate', income > 0 ? (rate * 100).toFixed(1) + '%' : '—');
      text('out-year', usd.format(Math.max(0, keep) * 12));
      var weekly = income > 0 ? Math.max(0, (income - essentials - income * target)) / 4.333 : 0;
      text('out-weekly', income > 0 ? usdCents.format(weekly) : '—');
      var runway = spent > 0 ? cash / spent : 0;
      text('out-runway', cash > 0 && spent > 0 ? runway.toFixed(1) + ' months' : '—');

      var gapEl = document.getElementById('out-gap');
      var gapNote = document.getElementById('out-gap-note');
      var gapPct = (target - rate) * 100;
      if (gapEl && gapNote) {
        if (income <= 0) {
          gapEl.textContent = '—';
          gapNote.textContent = 'set your target above';
        } else if (gapPct > 0.05) {
          gapEl.textContent = usd.format(income * (target - rate));
          gapNote.textContent = 'a month to reach ' + Math.round(target * 100) + '%';
        } else {
          gapEl.textContent = '+' + Math.abs(gapPct).toFixed(1) + ' pts';
          gapNote.textContent = 'ahead of your target';
        }
      }
      text('out-share', income > 0 ? Math.round((spent / income) * 100) + '%' : '0%');

      setRing(document.getElementById('ring-save'), rate, C_OUTER);
      setRing(document.getElementById('ring-spend'), essentialShare, C_INNER);
      var centre = document.getElementById('donut-num');
      if (centre) { centre.textContent = income > 0 ? (rate * 100).toFixed(1) + '%' : '0.0%'; }
      var centreSub = document.getElementById('donut-sub');
      if (centreSub) { centreSub.textContent = income > 0 ? Math.round(essentialShare * 100) + '% essentials' : 'Add income'; }

      var verdict = document.getElementById('verdict');
      if (verdict) {
        var cls = 'verdict';
        var copy;
        if (income <= 0) {
          copy = 'Enter your take-home pay to see the rings move.';
          cls += ' verdict--warn';
        } else if (keep < 0) {
          copy = 'You are ' + usd.format(Math.abs(keep)) + ' over each month. Trim lifestyle spend first — ' +
                 usd.format(lifestyle) + ' is flowing through that line today.';
          cls += ' verdict--warn';
        } else if (rate < target) {
          copy = 'You keep ' + (rate * 100).toFixed(1) + '% now and target ' + Math.round(target * 100) +
                 '%. Closing that gap is ' + usd.format(income * (target - rate)) + ' a month — roughly ' +
                 usd.format((income * (target - rate)) / 4.333) + ' a week of lifestyle spend.';
        } else if (rate >= 0.35) {
          copy = 'A ' + (rate * 100).toFixed(1) + '% savings rate buys back about one working year for every two you earn. Protect it from lifestyle creep.';
        } else {
          copy = 'On target. Hold the weekly figure and your runway grows to ' +
                 (cash > 0 ? runway.toFixed(1) + ' months' : 'its next milestone') + ' by December.';
        }
        verdict.className = cls;
        verdict.textContent = copy;
      }

      var breakdown = document.getElementById('breakdown');
      if (breakdown) {
        breakdown.textContent = '';
        var sorted = expenses.slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 6);
        if (!sorted.length) {
          var emptyNote = document.createElement('p');
          emptyNote.className = 'calc-note';
          emptyNote.textContent = 'Add an expense line to see where the money actually goes.';
          breakdown.appendChild(emptyNote);
        }
        sorted.forEach(function (e) {
          var pct = (e.amount / spent) * 100;
          var bar = document.createElement('div');
          bar.className = 'breakdown__bar';

          var term = document.createElement('dt');
          term.textContent = e.label;

          var trackCell = document.createElement('dd');
          var track = document.createElement('span');
          track.className = 'breakdown__track';
          var fill = document.createElement('span');
          fill.className = 'breakdown__fill' + (e.type === 'lifestyle' ? ' breakdown__fill--alt' : '');
          fill.style.width = pct.toFixed(1) + '%';
          track.appendChild(fill);
          trackCell.appendChild(track);

          var pctCell = document.createElement('dd');
          pctCell.textContent = usd.format(e.amount) + ' · ' + pct.toFixed(0) + '%';

          bar.appendChild(term);
          bar.appendChild(trackCell);
          bar.appendChild(pctCell);
          breakdown.appendChild(bar);
        });
      }
    };

    calcForm.addEventListener('input', render);
    calcForm.addEventListener('change', render);

    var addBtn = document.getElementById('add-row');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        makeRow('New expense', 0, 'lifestyle');
        var rows = rowsWrap.querySelectorAll('.row');
        var latest = rows[rows.length - 1];
        if (latest) { latest.querySelector('.js-name').focus(); }
        render();
      });
    }
    if (rowsWrap) {
      rowsWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('.js-remove');
        if (!btn) { return; }
        var rows = rowsWrap.querySelectorAll('.row');
        if (rows.length <= 1) { return; }
        var row = btn.closest('.row');
        var goneLabel = (row.querySelector('.js-name') || {}).value || 'line';
        row.parentNode.removeChild(row);
        render();
        var live = document.getElementById('calc-live');
        if (live) { live.textContent = 'Removed ' + goneLabel + '.'; }
      });
    }
    var resetBtn = document.getElementById('reset-calc');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var income = document.getElementById('income');
        if (income) { income.value = 4200; }
        var extra = document.getElementById('extra');
        if (extra) { extra.value = 0; }
        var cash = document.getElementById('cash');
        if (cash) { cash.value = 9800; }
        var target = document.getElementById('target');
        if (target) { target.value = 20; }
        if (rowsWrap) { rowsWrap.innerHTML = ''; }
        uid = 0;
        defaults.forEach(function (d) { makeRow(d[0], d[1], d[2]); });
        render();
        var live = document.getElementById('calc-live');
        if (live) { live.textContent = 'Example budget restored.'; }
      });
    }
    render();
  }

  /* ---------- pricing billing cycle ---------- */
  var cycle = document.querySelector('[data-cycle-switch]');
  if (cycle) {
    var buttons = cycle.querySelectorAll('button');
    var prices = document.querySelectorAll('[data-price-monthly]');
    var unitNotes = document.querySelectorAll('[data-cycle-note]');
    var annualSaving = document.getElementById('annual-saving');
    var apply = function (mode) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-mode') === mode ? 'true' : 'false');
      });
      prices.forEach(function (p) {
        var value = mode === 'annual' ? p.getAttribute('data-price-annual') : p.getAttribute('data-price-monthly');
        p.textContent = value === '0' ? 'Free' : '$' + value;
      });
      unitNotes.forEach(function (n) {
        n.textContent = mode === 'annual' ? '/mo, billed yearly' : '/month, billed monthly';
      });
      if (annualSaving) {
        annualSaving.textContent = mode === 'annual'
          ? 'Annual billing saves two months on every paid plan.'
          : 'Switch to annual billing to save 20% on every paid plan.';
      }
    };
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-mode')); });
    });
    apply('monthly');
  }

  /* ---------- support form ---------- */
  var form = document.getElementById('support-form');
  if (form) {
    var status = document.getElementById('form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var fail = function (id, message) {
      var input = document.getElementById(id);
      var err = document.getElementById('err-' + id);
      if (input) { input.setAttribute('aria-invalid', 'true'); }
      if (err) { err.textContent = message; }
      return input;
    };
    var pass = function (id) {
      var input = document.getElementById(id);
      var err = document.getElementById('err-' + id);
      if (input) { input.removeAttribute('aria-invalid'); }
      if (err) { err.textContent = ''; }
    };
    ['name', 'email', 'subject', 'message'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', function () { pass(id); });
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      var name = (document.getElementById('name') || {}).value || '';
      var email = (document.getElementById('email') || {}).value || '';
      var subject = (document.getElementById('subject') || {}).value || '';
      var message = (document.getElementById('message') || {}).value || '';
      var consent = document.getElementById('consent');

      ['name', 'email', 'subject', 'message'].forEach(pass);

      if (name.trim().length < 2) { firstBad = firstBad || fail('name', 'Tell us who we are replying to.'); }
      if (!emailRe.test(email.trim())) { firstBad = firstBad || fail('email', 'Enter a valid email address.'); }
      if (!subject) { firstBad = firstBad || fail('subject', 'Pick the closest topic.'); }
      if (message.trim().length < 20) { firstBad = firstBad || fail('message', 'Add a little more detail — 20 characters minimum.'); }
      if (consent && !consent.checked) {
        if (status) { status.textContent = 'Please tick the box so we can reply to you.'; }
        if (!firstBad) { firstBad = consent; }
      }

      if (firstBad) {
        if (status) { status.className = 'form__status form__status--err'; status.textContent = 'Check the highlighted fields above.'; }
        firstBad.focus();
        return;
      }

      var ref = 'MW-' + String(Math.floor(1000 + Math.random() * 8999));
      form.reset();
      if (status) {
        status.className = 'form__status';
        status.textContent = 'Ticket ' + ref + ' created. A human replies within 4 business hours, Monday to Friday.';
      }
    });
  }

  /* ---------- smooth-scroll for same-page anchors ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="#"]');
    if (!link) { return; }
    var href = link.getAttribute('href');
    if (href.indexOf('#') !== 0) { return; }
    var target = document.querySelector(href);
    if (!target) { return; }
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  });
}());
