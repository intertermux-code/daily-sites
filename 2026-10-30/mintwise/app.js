/* ==========================================================================
   Mintwise — shared behaviour
   Every block is guarded by element existence so one file serves all pages.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
  var usdCents = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* ------------------------------------------------------------------ 1. Nav */
  function initNav() {
    var toggle = $('.navtoggle');
    var nav = $('.nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var label = $('.navtoggle__label', toggle);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth < 1024) setOpen(false);
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && nav.getAttribute('data-open') === 'true') setOpen(false);
    });
  }

  /* ------------------------------------- 2. Clip-path image reveal (motion 1) */
  function initReveal() {
    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in', 'no-clip'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.16 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------- 3. Decode text (motion 2) */
  var GLYPHS = '0123456789$€£¥%#@&*+=/\\<>[]{}ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function initDecode() {
    var els = $$('.decode');
    if (!els.length) return;

    els.forEach(function (el) {
      var final = el.getAttribute('data-word') || el.textContent.trim();
      el.setAttribute('data-word', final);
      if (reduceMotion) { el.textContent = final; return; }

      var chars = final.split('');
      var settled = 0;
      var frame = 0;
      var holdFrames = 2;
      var start = null;
      var perCharMs = 95;

      el.setAttribute('data-decoded', 'false');

      function paint() {
        var out = '';
        for (var i = 0; i < chars.length; i++) {
          if (i < settled || chars[i] === ' ') out += chars[i];
          else out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
        el.textContent = out;
      }

      function tick(ts) {
        if (start === null) start = ts;
        frame++;
        if (frame % holdFrames === 0) paint();
        var target = Math.floor((ts - start) / perCharMs);
        if (target > settled) {
          settled = Math.min(chars.length, target);
          el.setAttribute('data-decoded', settled >= chars.length ? 'true' : 'false');
        }
        if (settled < chars.length) requestAnimationFrame(tick);
        else el.textContent = final;
      }

      setTimeout(function () { requestAnimationFrame(tick); }, 420);
    });
  }

  /* --------------------------------------------------- 4. Horizontal diorama */
  function buildDiorama(root) {
    var stage = $('.diorama__stage', root);
    var pin = $('.diorama__pin', root);
    var viewport = $('.diorama__viewport', root);
    var track = $('.diorama__track', root);
    var rail = $('.diorama__rail i', root);
    var count = $('.diorama__count', root);
    if (!stage || !viewport || !track) return;
    var exhibits = $$('.exhibit', track);

    function setProgress(p, dx) {
      p = clamp(p, 0, 1);
      if (dx !== undefined) track.style.setProperty('--dx', dx + 'px');
      if (rail) rail.style.transform = 'scaleX(' + (0.06 + p * 0.94) + ')';
      if (count && exhibits.length) {
        var idx = clamp(Math.round(p * (exhibits.length - 1)) + 1, 1, exhibits.length);
        var label = exhibits[idx - 1].getAttribute('data-label');
        count.textContent = 'Exhibit ' + String(idx).padStart(2, '0') + ' / ' +
          String(exhibits.length).padStart(2, '0') + (label ? ' — ' + label : '');
      }
    }

    /* Author-declared static rail: native horizontal scroll only, never pinned. */
    if (root.hasAttribute('data-manual') || !pin) {
      root.classList.add('diorama--rail');
      var onRailScroll = function () {
        var max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
        setProgress(viewport.scrollLeft / max);
      };
      viewport.addEventListener('scroll', onRailScroll, { passive: true });
      window.addEventListener('resize', onRailScroll);
      onRailScroll();
      return;
    }

    var mode = '';
    var overflow = 0;
    var queued = false;

    function update() {
      if (mode === 'pinned') {
        var rect = stage.getBoundingClientRect();
        var travel = Math.max(1, stage.offsetHeight - pin.offsetHeight);
        setProgress(-rect.top / travel, -clamp(-rect.top / travel, 0, 1) * overflow);
      } else {
        var max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
        setProgress(viewport.scrollLeft / max);
      }
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }

    function measure() {
      var canPin = window.innerWidth >= 1024 && !reduceMotion;
      var next = canPin ? 'pinned' : 'rail';
      if (next !== mode) {
        root.classList.remove('diorama--pinned', 'diorama--rail');
        root.classList.add('diorama--' + next);
        mode = next;
        stage.style.height = '';
        track.style.setProperty('--dx', '0px');
        if (mode === 'rail') viewport.addEventListener('scroll', onScroll, { passive: true });
      }
      if (mode === 'pinned') {
        overflow = Math.max(0, track.scrollWidth - viewport.clientWidth + 8);
        stage.style.height = (pin.offsetHeight + overflow) + 'px';
      }
      update();
    }

    var rt;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(measure, 140);
    });
    window.addEventListener('load', measure);
    measure();
  }

  function initDiorama() {
    $$('.diorama').forEach(buildDiorama);
  }

  /* ------------------------------------------------------- 5. Budget calculator */
  var CATS = [
    { key: 'housing', label: 'Housing', color: '#0c1512' },
    { key: 'food', label: 'Food & groceries', color: '#c2410c' },
    { key: 'transport', label: 'Transport', color: '#a8730b' },
    { key: 'utilities', label: 'Utilities & bills', color: '#3d4b46' },
    { key: 'subs', label: 'Subscriptions', color: '#7c9c93' },
    { key: 'health', label: 'Health & fitness', color: '#b3703f' },
    { key: 'wants', label: 'Lifestyle & fun', color: '#d6d9d0' }
  ];

  var PRESETS = {
    tight: { income: 3900, reserve: 1200, housing: 1350, food: 560, transport: 420, utilities: 265, subs: 130, health: 90, wants: 620 },
    balanced: { income: 5200, reserve: 6800, housing: 1450, food: 620, transport: 380, utilities: 240, subs: 95, health: 180, wants: 410 },
    fire: { income: 7400, reserve: 24500, housing: 1700, food: 700, transport: 340, utilities: 230, subs: 45, health: 260, wants: 300 }
  };

  function initCalculator() {
    var form = $('#budgetForm');
    if (!form) return;

    var R = $('#income'), S = $('#reserve');
    var segs = {};
    var legend = $('#legend');
    var rateOut = $('#savingsRate');
    var amountOut = $('#savingsAmount');
    var monthOut = $('#runwayMonths');
    var yearOut = $('#yearProjection');
    var verdict = $('#verdict');
    var bars = $('#benchBars');
    var spendOut = $('#monthlySpend');
    var circles = $$('circle[data-cat]', form.closest('main') || document);

    circles.forEach(function (c) { segs[c.getAttribute('data-cat')] = c; });

    function val(el) {
      if (!el) return 0;
      var n = parseFloat(el.value);
      return isFinite(n) ? Math.max(0, n) : 0;
    }

    function paintRange(el) {
      if (!el || el.type !== 'range') return;
      var min = parseFloat(el.min || 0), max = parseFloat(el.max || 100);
      var pct = ((parseFloat(el.value) - min) / Math.max(1, max - min)) * 100;
      el.style.setProperty('--fill', clamp(pct, 0, 100) + '%');
    }

    function render() {
      var income = val(R);
      var reserve = S ? val(S) : 0;
      var rows = CATS.map(function (c) {
        var el = document.getElementById('c-' + c.key);
        return { key: c.key, label: c.label, color: c.color, amount: el ? val(el) : 0 };
      });
      var spent = rows.reduce(function (t, r) { return t + r.amount; }, 0);
      var savings = Math.max(0, income - spent);
      var deficit = income > 0 && spent > income;
      var rate = income > 0 ? (savings / income) * 100 : 0;
      var C = 502.655;
      var base = income > 0 ? income : Math.max(spent, 1);
      var start = 0;

      rows.concat([{ key: 'savings', label: 'Saved', color: '#10b981', amount: savings }]).forEach(function (r) {
        var c = segs[r.key];
        if (!c) return;
        var len = (r.amount / base) * C;
        if (len < 0.4) len = 0;
        c.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + (C - len).toFixed(2));
        c.setAttribute('stroke-dashoffset', (-start).toFixed(2));
        c.setAttribute('opacity', len ? '1' : '0');
        start += len;
      });

      if (rateOut) rateOut.textContent = (income > 0 ? rate.toFixed(0) : '0') + '%';
      if (amountOut) amountOut.textContent = usd.format(savings);
      if (spendOut) spendOut.textContent = usd.format(spent);
      if (monthOut) {
        var avgSpend = spent > 0 ? spent : Math.max(1, income);
        monthOut.textContent = (reserve / avgSpend).toFixed(1);
      }
      if (yearOut) yearOut.textContent = usd.format(savings * 12);

      if (legend) {
        legend.innerHTML = rows.map(function (r) {
          var pc = income > 0 ? (r.amount / income) * 100 : 0;
          return '<li><span class="sw" style="background:' + r.color + '"></span>' +
            '<span>' + r.label + '</span>' +
            '<span class="pc">' + pc.toFixed(0) + '%</span>' +
            '<span class="vl">' + usd.format(r.amount) + '</span></li>';
        }).join('') +
          '<li><span class="sw" style="background:#10b981"></span><span>Untouched savings</span>' +
          '<span class="pc">' + (income > 0 ? ((savings / income) * 100).toFixed(0) : 0) + '%</span>' +
          '<span class="vl">' + usd.format(savings) + '</span></li>';
      }

      if (bars) {
        var needs = rows.reduce(function (t, r) {
          return t + (r.key === 'wants' || r.key === 'subs' ? 0 : r.amount);
        }, 0);
        var wants = rows.reduce(function (t, r) {
          return t + (r.key === 'wants' || r.key === 'subs' ? r.amount : 0);
        }, 0);
        var set = [
          { label: 'Needs', value: needs, target: income * 0.5, color: 'clay' },
          { label: 'Wants', value: wants, target: income * 0.3, color: 'gold' },
          { label: 'Savings', value: savings, target: income * 0.2, color: 'mint' }
        ];
        bars.innerHTML = set.map(function (b) {
          var share = income > 0 ? clamp((b.value / income) * 100, 0, 100) : 0;
          var delta = b.value - b.target;
          var sign = delta >= 0 ? '+' : '−';
          var word = b.label === 'Savings'
            ? (delta >= 0 ? 'ahead of' : 'short of')
            : (delta <= 0 ? 'under' : 'over');
          return '<div class="b"><div class="b__top"><span>' + b.label +
            ' — ' + share.toFixed(0) + '% of income</span><span>' + sign + '$' +
            Math.abs(Math.round(delta)).toLocaleString('en-US') + ' ' + word + ' target</span></div>' +
            '<div class="b__track"><div class="b__fill ' + b.color + '" style="transform:scaleX(' +
            (share / 100).toFixed(3) + ')"></div></div></div>';
        }).join('');
      }

      if (verdict) {
        var cls = 'verdict', msg;
        if (income <= 0) {
          msg = 'Add your monthly take-home pay to unlock the ring, the runway figure, and a category read.';
        } else if (deficit) {
          cls += ' verdict--bad';
          msg = 'Outgoings exceed income by ' + usd.format(spent - income) + ' a month. Mintwise would flag this as a redline week before the overdraft hits — start with the two largest bars above.';
        } else if (rate >= 30) {
          cls += '';
          msg = 'A ' + rate.toFixed(0) + '% savings rate puts you in the top decile of Mintwise households. At this pace you bank ' + usd.format(savings * 12) + ' a year.';
        } else if (rate >= 20) {
          msg = 'You are at ' + rate.toFixed(0) + '% — past the 20% benchmark most planners aim for. Trim ' + usd.format(Math.max(1, income * 0.02)) + ' from lifestyle and you clear 25%.';
        } else if (rate >= 8) {
          cls += ' verdict--warn';
          msg = 'You keep ' + rate.toFixed(0) + '% of what you earn. Workable, thin. One unplanned repair would eat a month of this buffer.';
        } else {
          cls += ' verdict--bad';
          msg = 'At ' + rate.toFixed(0) + '% there is no margin left. Move the savings transfer to payday morning and treat the rest as what is actually available.';
        }
        verdict.className = cls;
        verdict.innerHTML = '<strong>' + (rate >= 20 && !deficit && income > 0 ? 'Reading: strong.' : deficit ? 'Reading: redline.' : income > 0 ? 'Reading: watch.' : 'Reading: waiting.') + '</strong> ' + msg;
      }

      $$('input[type="range"]').forEach(paintRange);
    }

    /* Wire paired range + number inputs */
    $$('[data-pair]', form).forEach(function (input) {
      var other = document.getElementById(input.getAttribute('data-pair'));
      if (!other) return;
      input.addEventListener('input', function () {
        other.value = input.value;
        render();
      });
    });

    $$('button[data-preset]', form).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = PRESETS[btn.getAttribute('data-preset')];
        if (!p) return;
        $$('button[data-preset]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        Object.keys(p).forEach(function (k) {
          var id = (k === 'income') ? 'income' : (k === 'reserve') ? 'reserve' : 'c-' + k;
          $$('[id="' + id + '"]').forEach(function (el) { el.value = p[k]; });
        });
        render();
      });
    });

    form.addEventListener('input', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }

  /* --------------------------------------------------------- 6. Pricing toggle */
  function initPricing() {
    var group = $('.billtoggle');
    if (!group) return;

    var buttons = $$('button[data-cycle]', group);
    var prices = $$('.price[data-monthly]');
    var note = $('#cycleNote');

    function apply(cycle) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-cycle') === cycle ? 'true' : 'false');
      });
      prices.forEach(function (el) {
        var amount = cycle === 'year' ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
        var num = $('.price__n', el);
        if (num) num.textContent = usdCents.format(parseFloat(amount));
        var per = $('.per', el);
        if (per) per.textContent = cycle === 'year' ? '/month, billed yearly' : '/month';
      });
      if (note) {
        note.textContent = cycle === 'year'
          ? 'Annual plans are charged once and work out as two months free on Plus and Household.'
          : 'Monthly plans bill on the day you join and cancel any time from inside the app.';
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-cycle')); });
    });
    apply('month');
  }

  /* ---------------------------------------------------------- 7. Contact form */
  function initContact() {
    var form = $('#supportForm');
    if (!form) return;

    var status = $('#formStatus');
    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Tell us the name we should reply to.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter an email we can actually answer at.'; },
      topic: function (v) { return v ? '' : 'Pick the closest topic so we route you correctly.'; },
      message: function (v) { return v.trim().length >= 20 ? '' : 'A little more detail, please — 20 characters minimum.'; },
      consent: function (v, el) { return el.checked ? '' : 'We need your consent before we can write back.'; }
    };

    function validateField(el) {
      var rule = rules[el.name];
      if (!rule) return true;
      var msg = rule(el.value, el);
      var err = document.getElementById('err-' + el.name);
      if (msg) {
        el.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = msg; err.setAttribute('data-show', 'true'); }
        return false;
      }
      el.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.setAttribute('data-show', 'false'); }
      return true;
    }

    $$('input[name], select[name], textarea[name]', form).forEach(function (el) {
      el.addEventListener('blur', function () { if (rules[el.name]) validateField(el); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') validateField(el);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('input[name], select[name], textarea[name]', form).filter(function (el) {
        return !!rules[el.name];
      });
      var bad = fields.filter(function (el) { return !validateField(el); });
      if (bad.length) {
        if (status) {
          status.replaceChildren();
          status.setAttribute('data-state', 'err');
          status.textContent = bad.length === 1
            ? 'One field needs attention before we can send this.'
            : bad.length + ' fields need attention before we can send this.';
        }
        bad[0].focus();
        return;
      }
      var els = form.elements;
      var name = String(els.namedItem('name').value).trim().split(' ')[0];
      var email = String(els.namedItem('email').value).trim();
      var ref = 'MW-' + String(Math.floor(Math.random() * 9000) + 1000);
      if (status) {
        status.replaceChildren();
        var strong = document.createElement('strong');
        strong.textContent = 'Ticket ' + ref + ' is open.';
        status.appendChild(strong);
        status.appendChild(document.createTextNode(' ' + name +
          ', a human has it. Expect a reply within one business day on ' + email +
          '. Reference number is in the subject line.'));
        status.setAttribute('data-state', 'ok');
        status.setAttribute('tabindex', '-1');
        status.focus();
      }
      form.reset();
    });
  }

  /* ------------------------------------------------- 8. Footer newsletter + year */
  function initFooter() {
    var year = $('#footYear');
    if (year) year.textContent = String(new Date().getFullYear());

    var nf = $('#newsForm');
    if (nf) {
      var note = $('.note', nf.parentNode);
      nf.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = $('input[type="email"]', nf);
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        if (note) {
          note.setAttribute('data-state', ok ? 'ok' : 'err');
          note.textContent = ok
            ? 'Filed. The Ledger lands in your inbox the first Tuesday of each month.'
            : 'That address looks off — check it and try again.';
        }
        if (ok) nf.reset();
        else input.focus();
      });
    }
  }

  /* -------------------------------------------------------------- 9. Boot */
  function boot() {
    initNav();
    initReveal();
    initDecode();
    initDiorama();
    initCalculator();
    initPricing();
    initContact();
    initFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
