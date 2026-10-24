/* =========================================================
   VERDANT — shared behaviour
   01 nav  02 parallax  03 decode text  04 cart + drawer
   05 shop filters  06 routine quiz  07 forms  08 rule draw
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var money = function (n) { return 'US$' + n.toFixed(2); };

  /* ---------- catalogue (prices in USD) ---------- */
  var CATALOG = {
    'barrier-serum': {
      name: 'Barrier Serum 3.4', price: 48.00, size: '30 ml', cat: 'serum',
      img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
      alt: 'Barrier Serum 3.4 bottle in frosted glass'
    },
    'gel-cleanse': {
      name: 'Gel Cleanse pH 5.5', price: 32.00, size: '150 ml', cat: 'cleanse',
      img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=80',
      alt: 'Gel Cleanse pH 5.5 in a white ceramic jar'
    },
    'night-retinal': {
      name: 'Night Bakuchiol 1', price: 54.00, size: '30 ml', cat: 'treatment',
      img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80',
      alt: 'Night Bakuchiol 1 bottle with botanical styling'
    },
    'refill-cream': {
      name: 'Refill Cream 6', price: 38.00, size: '50 ml', cat: 'moisturise',
      img: 'https://images.unsplash.com/photo-1598440947619-2c3bfc18c29c?auto=format&fit=crop&w=400&q=80',
      alt: 'Refill Cream 6 jar with a aluminium refill pod'
    }
  };

  /* ================= 01 — NAVIGATION ================= */
  function initNav() {
    var toggle = $('.nav__toggle');
    var list = $('#primary-nav');
    if (!toggle || !list) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      list.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.click();
        toggle.focus();
      }
    });
  }

  /* ================= 02 — PARALLAX LAYERS ================= */
  /* Single rAF handler; every [data-speed] layer and [data-depth]
     element carries a different translate rate. */
  function initParallax() {
    var layers = $$('[data-speed]').map(function (el) {
      return { el: el, sp: parseFloat(el.getAttribute('data-speed')) };
    });
    var depths = $$('[data-depth]').map(function (el) {
      return { el: el, sp: parseFloat(el.getAttribute('data-depth')) };
    });
    if (!layers.length && !depths.length) return;
    if (reduce) return;

    var ticking = false;
    var head = $('#site-head');

    function apply() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var vh = window.innerHeight;
      layers.forEach(function (l) {
        var box = l.el.getBoundingClientRect();
        var mid = box.top + box.height / 2 - vh / 2;
        var shift = (mid * (l.sp - 1)) * -0.22;
        shift = Math.max(-160, Math.min(160, shift));
        l.el.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
      });
      depths.forEach(function (d) {
        var shift = y * d.sp * (head ? -0.34 : -0.2);
        shift = Math.max(-140, Math.min(140, shift));
        d.el.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply();
  }

  /* ================= 03 — DECODE TEXT ================= */
  /* One hero keyword resolves from scrambled glyphs, once per page load. */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+/<>≡';
  function initDecode() {
    var nodes = $$('.decode[data-decode]');
    if (!nodes.length) return;
    nodes.forEach(function (node) {
      var target = node.getAttribute('data-decode');
      node.textContent = target;
      if (reduce) return;
      var frame = 0;
      var total = target.length * 4 + 22;
      node.setAttribute('aria-label', target);
      function tick() {
        var out = '';
        for (var i = 0; i < target.length; i++) {
          var settleAt = i * 4 + 8;
          if (frame >= settleAt || target[i] === ' ') {
            out += target[i];
          } else {
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
        node.textContent = out;
        frame++;
        if (frame <= total) {
          window.setTimeout(function () { window.requestAnimationFrame(tick); }, 42);
        } else {
          node.textContent = target;
          node.removeAttribute('aria-label');
        }
      }
      window.requestAnimationFrame(tick);
    });
  }

  /* ================= 04 — CART + DRAWER ================= */
  var KEY = 'verdant.cart.v1';
  var cart = [];

  function readCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (r) { return CATALOG[r.id] && r.qty > 0; })
        .map(function (r) { return { id: r.id, qty: Math.min(9, Math.max(1, parseInt(r.qty, 10) || 1)) }; });
    } catch (e) { return []; }
  }
  function writeCart() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
  }
  function subtotal() {
    return cart.reduce(function (s, r) { return s + CATALOG[r.id].price * r.qty; }, 0);
  }
  function count() {
    return cart.reduce(function (s, r) { return s + r.qty; }, 0);
  }

  var FREE = 60;

  function renderCart() {
    var cBtn = $('#cart-count');
    if (cBtn) cBtn.textContent = String(count());
    var openBtn = $('#cart-btn');
    if (openBtn) openBtn.setAttribute('aria-label', 'Open cart, ' + count() + ' item' + (count() === 1 ? '' : 's'));

    var box = $('#drawer-items');
    if (!box) return;

    if (!cart.length) {
      box.innerHTML = '<div class="drawer__empty"><p class="eyebrow">Cart Empty</p>' +
        '<p>Your first formula is usually the cleanser. It is the one that decides whether everything after it works.</p>' +
        '<p><a class="btn btn--ghost btn--sm" href="shop.html" style="margin-top:16px">Browse The Four</a></p></div>';
    } else {
      box.innerHTML = cart.map(function (r) {
        var p = CATALOG[r.id];
        return '<article class="cart-item" data-id="' + r.id + '">' +
          '<div class="cart-item__media"><img src="' + p.img + '" alt="' + p.alt + '" width="200" height="266" loading="lazy"></div>' +
          '<div><h3 class="cart-item__name">' + p.name + '</h3>' +
          '<p class="cart-item__meta">' + p.size + ' · ' + money(p.price) + '</p>' +
          '<div class="qty"><button type="button" data-dec="' + r.id + '" aria-label="Decrease quantity of ' + p.name + '">−</button>' +
          '<span class="qty__n" aria-live="polite">' + r.qty + '</span>' +
          '<button type="button" data-inc="' + r.id + '" aria-label="Increase quantity of ' + p.name + '">+</button></div></div>' +
          '<div class="cart-item__right"><span class="cart-item__price">' + money(p.price * r.qty) + '</span>' +
          '<button type="button" class="cart-item__rm" data-rm="' + r.id + '" aria-label="Remove ' + p.name + ' from cart">Remove</button></div>' +
          '</article>';
      }).join('');
    }

    var sub = subtotal();
    $('#drawer-subtotal').textContent = money(sub);
    var ship = $('#drawer-ship');
    var fill = $('#drawer-bar-fill');
    if (sub >= FREE) {
      ship.textContent = 'Complimentary shipping unlocked.';
      fill.style.width = '100%';
    } else {
      ship.textContent = 'Add ' + money(FREE - sub) + ' more for complimentary shipping.';
      fill.style.width = Math.round((sub / FREE) * 100) + '%';
    }
    writeCart();
  }

  function addItem(id, btn) {
    if (!CATALOG[id]) return;
    var line = cart.filter(function (r) { return r.id === id; })[0];
    if (line) line.qty = Math.min(9, line.qty + 1);
    else cart.push({ id: id, qty: 1 });
    renderCart();
    if (btn) {
      var prev = btn.textContent;
      btn.classList.add('is-added');
      btn.textContent = 'Added ✓';
      window.setTimeout(function () { btn.classList.remove('is-added'); btn.textContent = prev; }, 1400);
    }
    var cb = $('#cart-btn');
    if (cb && !reduce) {
      cb.classList.remove('is-bump');
      void cb.offsetWidth;
      cb.classList.add('is-bump');
    }
  }

  var lastFocus = null;
  function openDrawer() {
    var d = $('#cart-drawer'), b = $('#backdrop');
    if (!d) return;
    lastFocus = document.activeElement;
    d.classList.add('is-open');
    d.setAttribute('aria-hidden', 'false');
    b.hidden = false;
    window.requestAnimationFrame(function () { b.classList.add('is-on'); });
    document.body.classList.add('no-scroll');
    var first = $('#drawer-close');
    if (first) first.focus();
  }
  function closeDrawer() {
    var d = $('#cart-drawer'), b = $('#backdrop');
    if (!d) return;
    d.classList.remove('is-open');
    d.setAttribute('aria-hidden', 'true');
    b.classList.remove('is-on');
    document.body.classList.remove('no-scroll');
    window.setTimeout(function () { b.hidden = true; }, 340);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initCart() {
    cart = readCart();
    if (!$('#cart-drawer')) return;

    $('#cart-btn').addEventListener('click', openDrawer);
    $('#drawer-close').addEventListener('click', closeDrawer);
    $('#backdrop').addEventListener('click', closeDrawer);
    $('#drawer-continue').addEventListener('click', closeDrawer);
    $('#drawer-checkout').addEventListener('click', function () {
      var note = $('#drawer-ship');
      note.textContent = cart.length
        ? 'Checkout opens in the store — ' + count() + ' item' + (count() === 1 ? '' : 's') + ', ' + money(subtotal()) + '.'
        : 'Add a formula before checking out.';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('#cart-drawer').classList.contains('is-open')) closeDrawer();
      if (e.key === 'Tab' && $('#cart-drawer').classList.contains('is-open')) {
        var f = $$('#cart-drawer a[href], #cart-drawer button, #cart-drawer input').filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    $('#drawer-items').addEventListener('click', function (e) {
      var t = e.target.closest('[data-inc],[data-dec],[data-rm]');
      if (!t) return;
      var id = t.getAttribute('data-inc') || t.getAttribute('data-dec') || t.getAttribute('data-rm');
      var line = cart.filter(function (r) { return r.id === id; })[0];
      if (!line) return;
      if (t.hasAttribute('data-inc')) line.qty = Math.min(9, line.qty + 1);
      if (t.hasAttribute('data-dec')) line.qty -= 1;
      if (t.hasAttribute('data-rm')) line.qty = 0;
      cart = cart.filter(function (r) { return r.qty > 0; });
      renderCart();
    });

    $$('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () { addItem(btn.getAttribute('data-add'), btn); });
    });
    $$('[data-buy]').forEach(function (btn) {
      btn.addEventListener('click', function () { addItem(btn.getAttribute('data-buy')); openDrawer(); });
    });

    renderCart();
  }

  /* ================= 05 — SHOP FILTERS ================= */
  function initFilters() {
    var chips = $$('.chip[data-filter]');
    if (!chips.length) return;
    var grid = $('#product-grid');
    var countEl = $('#filters-count');
    var emptyEl = $('#shop-empty');
    var cards = $$('.p-card', grid);

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var shown = 0;
        cards.forEach(function (card) {
          var ok = f === 'all' || card.getAttribute('data-cat') === f ||
            (f === 'pm' && card.getAttribute('data-pm') === '1');
          card.hidden = !ok;
          if (ok) shown++;
        });
        if (countEl) countEl.textContent = shown + ' Formula' + (shown === 1 ? '' : 's') + ' Shown';
        if (emptyEl) emptyEl.hidden = shown !== 0;
      });
    });
  }

  /* ================= 06 — ROUTINE QUIZ ================= */
  var PLANS = {
    repair: {
      tag: 'Protocol A — Barrier Repair',
      title: 'Rebuild The Wall First',
      blurb: 'Your answers point to a compromised barrier: tightness, flushing, or an active you started too fast. We treat the wall before we treat the concern. Expect calm by day 10 and a visible difference by week 4.',
      am: [['Gel Cleanse pH 5.5', 'Lukewarm water, 30 seconds, no cloth'], ['Barrier Serum 3.4', 'Four drops on damp skin'], ['Refill Cream 6', 'Seal while the serum is still tacky']],
      pm: [['Gel Cleanse pH 5.5', 'Second cleanse only if you wore SPF'], ['Barrier Serum 3.4', 'Same dose, one minute after cleansing'], ['Night Bakuchiol 1', 'Two drops, every third night for fortnight one']],
      items: ['gel-cleanse', 'barrier-serum', 'refill-cream']
    },
    calm: {
      tag: 'Protocol B — Calm & Clarify',
      title: 'Quiet The Redness, Then Even It',
      blurb: 'Reactive and congested at once. Niacinamide and madecassoside do the settling; bakuchiol handles texture only once the skin stops objecting. Introduce one variable at a time.',
      am: [['Gel Cleanse pH 5.5', 'Skip the morning cleanse on dry days'], ['Barrier Serum 3.4', 'Morning and night through week three'], ['Refill Cream 6', 'Thin layer over cheeks, heavier at the jaw']],
      pm: [['Night Bakuchiol 1', 'Nights 1, 3, 5 for two weeks, then nightly'], ['Barrier Serum 3.4', 'Always over the serum, never under'], ['Refill Cream 6', 'Only where the bakuchiol tightens']],
      items: ['gel-cleanse', 'barrier-serum', 'night-retinal']
    },
    steady: {
      tag: 'Protocol C — Steady Maintenance',
      title: 'Keep What You Already Have',
      blurb: 'Your barrier tolerates actives and your concern is long-term texture and tone. Two formulas, applied in a fixed order, is the entire assignment. Add the refill only in winter or hard-water months.',
      am: [['Gel Cleanse pH 5.5', 'One minute, rinse cool'], ['Barrier Serum 3.4', 'Daily, including weekends']],
      pm: [['Night Bakuchiol 1', 'Four nights weekly, more is not better'], ['Barrier Serum 3.4', 'Reapply over bakuchiol after five minutes'], ['Refill Cream 6', 'Optional: use it the morning after']],
      items: ['gel-cleanse', 'night-retinal', 'barrier-serum']
    },
    dry: {
      tag: 'Protocol D — Dry & Mature Support',
      title: 'Lipids Before Water',
      blurb: 'You read dry, cold or low humidity. The priority is occlusion and lipid replacement; actives move to twice weekly so nothing competes with the cream for the last word.',
      am: [['Barrier Serum 3.4', 'Apply to damp skin within 20 seconds of cleansing'], ['Refill Cream 6', 'Press, do not rub, while serum is tacky']],
      pm: [['Gel Cleanse pH 5.5', 'Evening only — never cleanse twice'], ['Night Bakuchiol 1', 'Two nights weekly, then build to four'], ['Barrier Serum 3.4', 'Between bakuchiol and cream, always']],
      items: ['barrier-serum', 'refill-cream', 'night-retinal']
    }
  };

  var answers = {};
  function initQuiz() {
    var quiz = $('#quiz');
    if (!quiz) return;
    var panels = $$('.quiz__panel', quiz);
    var railSteps = $$('.quiz__step', quiz);
    var result = $('#quiz-result');
    var current = 0;

    function show(i) {
      panels.forEach(function (p, k) { p.hidden = k !== i; });
      railSteps.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-done', k < i || (result && !result.hidden));
        var a = $('a', s);
        if (a) a.setAttribute('aria-current', k === i ? 'step' : 'false');
        if (a && k < i) { a.removeAttribute('aria-current'); }
      });
      current = i;
      var q = panels[i];
      if (q) {
        var firstInput = $('input', q);
        if (firstInput) firstInput.focus({ preventScroll: true });
      }
    }

    $$('input[type="radio"]', quiz).forEach(function (input) {
      input.addEventListener('change', function () {
        answers[input.getAttribute('data-q')] = input.value;
        var err = $('.quiz__err', input.closest('.quiz__panel'));
        if (err) err.textContent = '';
      });
    });

    $$('[data-next]', quiz).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = btn.closest('.quiz__panel');
        var key = panel.getAttribute('data-step');
        if (!answers[key]) {
          var err = $('.quiz__err', panel);
          if (err) err.textContent = 'Choose the option that fits you best.';
          return;
        }
        if (current < panels.length - 1) show(current + 1);
      });
    });
    $$('[data-back]', quiz).forEach(function (btn) {
      btn.addEventListener('click', function () { if (current > 0) show(current - 1); });
    });

    function planKey() {
      var q1 = answers.q1, q2 = answers.q2, q3 = answers.q3;
      if (q1 === 'tight') return 'repair';
      if (q1 === 'flush' || q3 === 'retinoid') return 'calm';
      if (q2 === 'cold' || q2 === 'dry') return 'dry';
      if (q1 === 'steady' || q1 === 'dull') return 'steady';
      return 'repair';
    }

    var submit = $('#quiz-submit');
    if (submit) {
      submit.addEventListener('click', function () {
        if (!answers.q3) {
          var err = $('.quiz__err', submit.closest('.quiz__panel'));
          if (err) err.textContent = 'Pick your current active habit to finish.';
          return;
        }
        var plan = PLANS[planKey()];
        result.innerHTML = '<div class="result__head"><p class="result__tag">' + plan.tag + '</p>' +
          '<h2>' + plan.title + '</h2><p>' + plan.blurb + '</p></div>' +
          '<div class="result__plan">' +
          col('Morning', plan.am) + col('Evening', plan.pm) + '</div>' +
          '<h3 class="h-md" style="margin-top:34px">Your Three Formulas</h3>' +
          recGrid(plan.items) +
          '<div class="quiz__nav"><button class="btn btn--ghost" type="button" id="quiz-restart">Retake The Quiz</button>' +
          '<a class="btn" href="shop.html">Adjust In The Shop</a></div>';
        panels.forEach(function (p) { p.hidden = true; });
        result.hidden = false;
        railSteps.forEach(function (s) { s.classList.remove('is-active'); s.classList.add('is-done'); });
        $$('[data-add]', result).forEach(function (b) {
          b.addEventListener('click', function () { addItem(b.getAttribute('data-add'), b); });
        });
        var restart = $('#quiz-restart');
        restart.addEventListener('click', function () {
          answers = {};
          $$('input[type="radio"]', quiz).forEach(function (i) { i.checked = false; });
          result.hidden = true;
          result.innerHTML = '';
          show(0);
        });
        result.setAttribute('tabindex', '-1');
        result.focus({ preventScroll: true });
      });
    }

    function col(label, rows) {
      return '<div class="plan__col"><p class="plan__when">' + label + '</p><ul class="plan__list">' +
        rows.map(function (r, i) {
          return '<li><span class="n">0' + (i + 1) + '</span><span><strong>' + r[0] + '</strong><em>' + r[1] + '</em></span></li>';
        }).join('') + '</ul></div>';
    }
    function recGrid(ids) {
      return '<div class="rec-grid">' + ids.map(function (id) {
        var p = CATALOG[id];
        return '<article class="p-card"><div class="p-card__media"><img src="' + p.img.replace('w=400', 'w=800') +
          '" alt="' + p.alt + '" width="800" height="1000" loading="lazy"></div><div class="p-card__body">' +
          '<h3 class="p-card__name">' + p.name + '</h3><p class="p-card__meta">' + p.size + '</p>' +
          '<div class="p-card__foot"><span class="p-card__price">' + money(p.price) + '</span>' +
          '<button class="quick-add" type="button" data-add="' + id + '">Quick Add</button></div></div></article>';
      }).join('') + '</div>';
    }

    show(0);
  }

  /* ================= 07 — FORMS ================= */
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v); }

  function initSignup() {
    var form = $('#signup-form');
    if (!form) return;
    var msg = $('#signup-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#signup-email');
      if (!validEmail(input.value.trim())) {
        input.setAttribute('aria-invalid', 'true');
        msg.textContent = 'Enter a valid email address.';
        msg.classList.add('is-error');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      msg.classList.remove('is-error');
      msg.textContent = 'Confirmed — you are on the batch list for ' + input.value.trim().toLowerCase() + '.';
      form.reset();
    });
  }

  function initContact() {
    var form = $('#contact-form');
    if (!form) return;
    var status = $('#form-status');

    function fail(el, text) {
      el.setAttribute('aria-invalid', 'true');
      var err = $('#' + el.getAttribute('aria-describedby').split(' ')[0]);
      if (err) err.textContent = text;
      return el;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('.f-err', form).forEach(function (n) { n.textContent = ''; });

      var name = $('#c-name'), email = $('#c-email'), msg = $('#c-msg'), sel = $('#c-topic');
      if (name.value.trim().length < 2) bad = bad || fail(name, 'Tell us what to call you.');
      if (!validEmail(email.value.trim())) bad = bad || fail(email, 'We need a reachable email address.');
      if (!sel.value) bad = bad || fail(sel, 'Choose the reason for writing.');
      if (msg.value.trim().length < 12) bad = bad || fail(msg, 'Add a little more detail (12 characters minimum).');

      if (bad) {
        status.classList.add('is-error');
        status.textContent = 'Check the highlighted fields above.';
        bad.focus();
        return;
      }
      status.classList.remove('is-error');
      var ref = 'VD-' + String(Date.now()).slice(-5);
      status.textContent = 'Message received, ' + name.value.trim().split(' ')[0] + '. Reference ' + ref + ' — we reply within one working day from Porto.';
      form.reset();
    });

    $$('#contact-form input, #contact-form textarea, #contact-form select').forEach(function (el) {
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') {
          el.removeAttribute('aria-invalid');
          var d = el.getAttribute('aria-describedby');
          if (d) { var n = $('#' + d.split(' ')[0]); if (n) n.textContent = ''; }
        }
      });
    });
  }

  /* ================= 08 — HAIRLINE RULE DRAW ================= */
  function initDraw() {
    var nodes = $$('.draw');
    if (!nodes.length || reduce || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-drawn'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-drawn'); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initCart();
    initFilters();
    initQuiz();
    initSignup();
    initContact();
    initDraw();
    initParallax();
    initDecode();
  });
})();
