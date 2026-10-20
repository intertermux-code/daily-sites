/* ==========================================================================
   Verdant — shared behaviour
   Cart drawer · magnetic buttons · spring accordions · quiz · filters · forms
   Vanilla JS only. Signature motion honours prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (c) { return '$' + (c / 100).toFixed(2); };

  /* ---------- Catalog (single source of truth for the cart) ---------- */
  var IMG = 'https://images.unsplash.com/photo-';
  var Q = '?auto=format&fit=crop&w=800&h=1000&q=80';
  var CATALOG = {
    'gel-cleanser':   { name: 'Dew Point Gel Cleanser',        price: 2800, size: '150 ml', cat: 'cleanse', img: IMG + '1556228720-195a672e8a03' + Q },
    'toner-mist':     { name: 'Cedarwater Toner Mist',         price: 2400, size: '120 ml', cat: 'prep',    img: IMG + '1612817288484-6f916006741a?auto=format&fit=crop&w=800&h=1000&crop=left&q=80' },
    'niacinamide':    { name: 'Niacinamide 5% Clear Serum',    price: 4200, size: '30 ml',  cat: 'treat',   img: IMG + '1612817288484-6f916006741a?auto=format&fit=crop&w=800&h=1000&crop=right&q=80' },
    'night-balm':     { name: 'Marula Night Balm',             price: 4600, size: '50 ml',  cat: 'seal',    img: IMG + '1612817288484-6f916006741a?auto=format&fit=crop&w=800&h=1000&crop=top&q=80' },
    'oat-cream':      { name: 'Oat Milk Moisturiser',          price: 3600, size: '60 ml',  cat: 'seal',    img: IMG + '1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&h=1000&crop=top&q=80' },
    'eye-concentrate':{ name: 'Green Tea Eye Concentrate',     price: 3200, size: '15 ml',  cat: 'treat',   img: IMG + '1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&h=1000&crop=left&q=80' },
    'clay-mask':      { name: 'Clay + Aloe Weekly Mask',       price: 3000, size: '75 ml',  cat: 'weekly',  img: IMG + '1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&h=1000&crop=right&q=80' },
    'squalane-oil':   { name: 'Squalane + Fig Face Oil',       price: 4000, size: '30 ml',  cat: 'seal',    img: IMG + '1707910393331-0145331bc039?auto=format&fit=crop&w=800&h=1000&crop=center&q=80' },
    'travel-set':     { name: 'The Three-Step Travel Set',     price: 4900, size: '3 × 40 ml', cat: 'sets',  img: IMG + '1612817288484-6f916006741a?auto=format&fit=crop&w=800&h=1000&crop=bottom&q=80' },
    'refill-cleanser':{ name: 'Dew Point Refill Pouch',        price: 2100, size: '150 ml', cat: 'refills', img: IMG + '1556228720-195a672e8a03' + Q },
    'refill-cream':   { name: 'Oat Milk Refill Pouch',         price: 2700, size: '60 ml',  cat: 'refills', img: IMG + '1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&h=1000&crop=bottom&q=80' },
    'mini-serum':     { name: 'Niacinamide Mini',              price: 1900, size: '10 ml',  cat: 'minis',   img: IMG + '1612817288484-6f916006741a?auto=format&fit=crop&w=800&h=1000&crop=left&q=80' },
    'mini-oil':       { name: 'Squalane Mini',                 price: 1800, size: '10 ml',  cat: 'minis',   img: IMG + '1707910393331-0145331bc039?auto=format&fit=crop&w=800&h=1000&crop=center&q=80' },
    'linen-cloth':    { name: 'Organic Cotton Muslin Cloths',  price: 1600, size: 'Pack of 6', cat: 'tools', img: IMG + '1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&h=1000&crop=center&q=80' },
    'scalp-drops':    { name: 'Rosemary Scalp Drops',          price: 3400, size: '50 ml',  cat: 'body',    img: IMG + '1707910393331-0145331bc039?auto=format&fit=crop&w=800&h=1000&crop=bottom&q=80' },
    'body-balm':      { name: 'Cold-Pressed Body Balm',        price: 3200, size: '120 ml', cat: 'body',    img: IMG + '1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&h=1000&crop=top&q=80' }
  };

  /* ---------- Cart store ---------- */
  var KEY = 'verdant.cart.v2';
  var FREE_SHIP = 6000;
  var SHIP_COST = 500;

  function readCart() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw), out = {};
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(function (k) {
          if (CATALOG[k]) {
            var q = parseInt(obj[k], 10);
            if (q > 0 && q < 99) out[k] = q;
          }
        });
      }
      return out;
    } catch (e) { return {}; }
  }
  function writeCart(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* private mode */ }
  }

  var cart = readCart();

  function cartLines() {
    return Object.keys(cart).map(function (id) {
      return { id: id, qty: cart[id], p: CATALOG[id] };
    }).filter(function (l) { return l.p; });
  }
  function cartCount() {
    return cartLines().reduce(function (a, l) { return a + l.qty; }, 0);
  }
  function cartSubtotal() {
    return cartLines().reduce(function (a, l) { return a + l.p.price * l.qty; }, 0);
  }

  /* ---------- DOM refs ---------- */
  var drawer, scrim, cartBody, cartFoot, badges, countSlots;

  function el(sel) { return document.querySelector(sel); }
  function els(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------- Render ---------- */
  function render() {
    var lines = cartLines();
    var n = cartCount();

    badges.forEach(function (b) {
      b.textContent = n;
      b.classList.toggle('is-empty', n === 0);
    });
    countSlots.forEach(function (s) {
      s.textContent = n === 1 ? '1 item' : n + ' items';
    });

    if (!lines.length) {
      cartBody.innerHTML =
        '<div class="cart__empty">' +
        '<span class="mono mono--sm">Bag · empty</span>' +
        '<p>Nothing filed yet. Your three-step routine starts with a cleanser.</p>' +
        '<a class="btn btn--sm btn--ghost" href="shop.html">Browse the catalogue</a>' +
        '</div>';
      cartFoot.hidden = true;
      return;
    }
    cartFoot.hidden = false;

    var sub = cartSubtotal();
    var toFree = Math.max(0, FREE_SHIP - sub);
    var pct = Math.min(100, Math.round((sub / FREE_SHIP) * 100));
    var ship = sub >= FREE_SHIP ? 0 : SHIP_COST;

    cartBody.innerHTML =
      '<div class="cart__note">' +
      (toFree > 0
        ? 'Add <b>' + money(toFree) + '</b> more for complimentary shipping.'
        : '<b>Complimentary shipping</b> unlocked on this order.') +
      '</div>' +
      lines.map(function (l) {
        return '<article class="ci">' +
          '<img class="ci__img" src="' + l.p.img + '" width="74" height="92" alt="' + l.p.name + '">' +
          '<div>' +
            '<h3 class="ci__name">' + l.p.name + '</h3>' +
            '<p class="ci__meta">' + l.p.size + ' · ' + money(l.p.price) + ' each</p>' +
            '<div class="ci__row">' +
              '<div class="qty">' +
                '<button type="button" data-dec="' + l.id + '" aria-label="Decrease quantity of ' + l.p.name + '">−</button>' +
                '<span aria-live="polite">' + l.qty + '</span>' +
                '<button type="button" data-inc="' + l.id + '" aria-label="Increase quantity of ' + l.p.name + '">+</button>' +
              '</div>' +
              '<span class="ci__price">' + money(l.p.price * l.qty) + '</span>' +
            '</div>' +
            '<div class="ci__row"><button type="button" class="ci__rm" data-rm="' + l.id + '">Remove</button></div>' +
          '</div>' +
        '</article>';
      }).join('');

    cartFoot.querySelector('.ship-bar i').style.width = pct + '%';
    cartFoot.querySelector('.ship-bar').classList.toggle('is-done', toFree === 0);
    cartFoot.querySelector('.ship-msg').innerHTML = toFree > 0
      ? money(toFree) + ' away from free shipping'
      : 'Free shipping applied';
    cartFoot.querySelector('[data-sum-subtotal]').textContent = money(sub);
    cartFoot.querySelector('[data-sum-shipping]').textContent = ship === 0 ? 'Complimentary' : money(ship);
    cartFoot.querySelector('[data-sum-total]').textContent = money(sub + ship);
  }

  function add(id, qty) {
    if (!CATALOG[id]) return;
    cart[id] = Math.min(99, (cart[id] || 0) + (qty || 1));
    writeCart(cart); render();
    toast(CATALOG[id].name, 'added to your bag');
  }
  function dec(id) {
    if (!cart[id]) return;
    cart[id] -= 1;
    if (cart[id] <= 0) delete cart[id];
    writeCart(cart); render();
  }
  function remove(id) {
    var nm = CATALOG[id] ? CATALOG[id].name : 'Item';
    delete cart[id];
    writeCart(cart); render();
    toast(nm, 'removed from your bag');
  }

  /* ---------- Drawer ---------- */
  var lastFocus = null;
  function drawerFocusables() {
    return Array.prototype.filter.call(
      drawer.querySelectorAll('a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (n) { return !!(n.offsetWidth || n.offsetHeight || n.getClientRects().length); }
    );
  }
  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    document.body.classList.add('no-scroll');
    drawer.setAttribute('aria-hidden', 'false');
    var f = drawer.querySelector('button, a, input');
    if (f) f.focus();
  }
  function closeCart() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    drawer.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function trapDrawer(e) {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key !== 'Tab') return;
    var f = drawerFocusables();
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1], inDrawer = drawer.contains(document.activeElement);
    if (e.shiftKey) {
      if (!inDrawer || document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else if (!inDrawer || document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  function toast(title, sub) {
    if (!toastEl) return;
    toastEl.innerHTML = '<b>✓</b><span>' + title + ' · ' + sub + '</span>';
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  /* ---------- Spring accordion (one panel open per group) ---------- */
  function initAccordion(root) {
    var triggers = (root || document).querySelectorAll('[data-acc-trigger]:not([data-acc-bound])');
    Array.prototype.forEach.call(triggers, function (btn) {
      btn.setAttribute('data-acc-bound', '1');
      btn.addEventListener('click', function () {
        var row = btn.closest('[data-acc-row]') || btn.parentElement;
        var open = btn.getAttribute('aria-expanded') === 'true';
        var group = btn.getAttribute('data-acc-group') || 'default';

        Array.prototype.forEach.call(
          document.querySelectorAll('[data-acc-group="' + group + '"]'),
          function (other) {
            if (other === btn) return;
            other.setAttribute('aria-expanded', 'false');
            var orow = other.closest('[data-acc-row]') || other.parentElement;
            if (orow) orow.classList.remove('is-open');
          }
        );

        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (row) row.classList.toggle('is-open', !open);
      });
    });
  }

  /* ---------- Magnetic buttons (rAF lerp, 120px radius) ---------- */
  var MAG = { items: [], bound: [], running: false, wired: false, mx: 0, my: 0 };
  var MAG_R = 120, MAG_SCALE = 1.04, MAG_LERP = 0.18;

  function magnetScan() {
    els('[data-magnetic]').forEach(function (node) {
      if (MAG.bound.indexOf(node) > -1) return;
      MAG.bound.push(node);
      MAG.items.push({ node: node, x: 0, y: 0, tx: 0, ty: 0, s: 1, ts: 1, active: false });
    });
  }

  function magnetLoop() {
    var settle = true;
    MAG.items.forEach(function (it) {
      it.x += (it.tx - it.x) * MAG_LERP;
      it.y += (it.ty - it.y) * MAG_LERP;
      it.s += (it.ts - it.s) * MAG_LERP;
      var near = Math.abs(it.tx - it.x) < 0.05 && Math.abs(it.ty - it.y) < 0.05 && Math.abs(it.ts - it.s) < 0.0008;
      if (near) {
        it.x = it.tx; it.y = it.ty; it.s = it.ts;
        if (!it.tx && !it.ty && it.ts === 1) { it.node.style.transform = ''; return; }
      } else { settle = false; }
      it.node.style.transform = 'translate3d(' + it.x.toFixed(2) + 'px,' + it.y.toFixed(2) + 'px,0) scale(' + it.s.toFixed(4) + ')';
    });
    if (settle) { MAG.running = false; return; }
    requestAnimationFrame(magnetLoop);
  }

  function magnetKick() {
    if (!MAG.running) { MAG.running = true; requestAnimationFrame(magnetLoop); }
  }

  function magnetReleaseAll() {
    var any = false;
    MAG.items.forEach(function (it) {
      if (it.active || it.tx || it.ty) any = true;
      it.tx = 0; it.ty = 0; it.ts = 1; it.active = false;
    });
    if (any) magnetKick();
  }

  function initMagnetic() {
    if (REDUCED) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    magnetScan();
    if (MAG.wired || !MAG.items.length) return;
    MAG.wired = true;

    document.addEventListener('mousemove', function (e) {
      MAG.mx = e.clientX; MAG.my = e.clientY;
      var hit = false;
      MAG.items.forEach(function (it) {
        var r = it.node.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = MAG.mx - cx, dy = MAG.my - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var reach = MAG_R + Math.max(r.width, r.height) / 2;
        if (dist < reach) {
          var pull = 1 - dist / reach;
          var max = Math.min(r.width, r.height) * 0.16;
          it.tx = Math.max(-max, Math.min(max, dx * pull * 0.42));
          it.ty = Math.max(-max, Math.min(max, dy * pull * 0.42));
          it.ts = 1 + (MAG_SCALE - 1) * pull;
          it.active = true; hit = true;
        } else if (it.active) {
          it.tx = 0; it.ty = 0; it.ts = 1; it.active = false;
        }
      });
      if (hit || MAG.items.some(function (i) { return i.active; })) magnetKick();
    }, { passive: true });

    window.addEventListener('scroll', function () {
      MAG.items.forEach(function (it) {
        var r = it.node.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) {
          it.tx = 0; it.ty = 0; it.ts = 1; it.active = false;
        }
      });
      magnetKick();
    }, { passive: true });

    document.addEventListener('mouseleave', magnetReleaseAll);
    window.addEventListener('blur', magnetReleaseAll);
  }

  /* ---------- Hairline rule draw on scroll ---------- */
  function initRules() {
    var rules = els('.rule-draw');
    if (!rules.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      rules.forEach(function (r) { r.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    rules.forEach(function (r) { io.observe(r); });
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var burger = el('.burger'), panel = el('.mnav');
    if (!burger || !panel) return;
    var open = false;
    function set(v) {
      open = v;
      panel.classList.toggle('is-open', v);
      burger.setAttribute('aria-expanded', v ? 'true' : 'false');
    }
    burger.addEventListener('click', function () { set(!open); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
    document.addEventListener('click', function (e) {
      if (!open) return;
      if (panel.contains(e.target) || burger.contains(e.target)) return;
      set(false);
    });
    Array.prototype.forEach.call(panel.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { set(false); });
    });
  }

  /* ---------- Announcement bar ---------- */
  function initAnn() {
    var bar = el('.ann'), btn = el('.ann__close');
    if (!bar || !btn) return;
    try { if (sessionStorage.getItem('verdant.ann') === 'off') bar.classList.add('is-hidden'); } catch (e) {}
    btn.addEventListener('click', function () {
      bar.classList.add('is-hidden');
      try { sessionStorage.setItem('verdant.ann', 'off'); } catch (e) {}
    });
  }

  /* ---------- Shop: filters + sort ---------- */
  function initShop() {
    var grid = el('#pgrid');
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.pc'));
    var count = el('#shopCount');
    var chips = els('[data-filter]');
    var select = el('#shopSort');
    var active = 'all';

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var okCat = active === 'all' || c.getAttribute('data-cat') === active;
        c.classList.toggle('is-hidden', !okCat);
        if (okCat) shown += 1;
      });
      if (count) count.textContent = shown + (shown === 1 ? ' product' : ' products');
      var label = el('#shopFilterLabel');
      if (label) {
        var chip = chips.filter(function (x) { return x.getAttribute('data-filter') === active; })[0];
        label.textContent = chip ? chip.textContent.replace(/\s*\d+\s*$/, '').trim() : 'All';
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        active = chip.getAttribute('data-filter');
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === chip ? 'true' : 'false'); });
        apply();
      });
    });

    if (select) {
      var host = select.getAttribute('data-sort-host') ? document.querySelector(select.getAttribute('data-sort-host')) : grid;
      select.addEventListener('change', function () {
        var mode = select.value;
        var list = cards.slice();
        list.sort(function (a, b) {
          var pa = parseInt(a.getAttribute('data-price'), 10), pb = parseInt(b.getAttribute('data-price'), 10);
          if (mode === 'price-asc') return pa - pb;
          if (mode === 'price-desc') return pb - pa;
          if (mode === 'name') return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'));
          return parseInt(a.getAttribute('data-order'), 10) - parseInt(b.getAttribute('data-order'), 10);
        });
        list.forEach(function (c) { host.appendChild(c); });
      });
    }
    apply();
  }

  /* ---------- Routine quiz ---------- */
  var QUIZ = {
    skin: {
      dry:      { label: 'Tight, flaky, thirsty', base: ['gel-cleanser', 'oat-cream', 'squalane-oil'] },
      oily:     { label: 'Shine by midday',       base: ['gel-cleanser', 'niacinamide', 'toner-mist'] },
      combo:    { label: 'Oily T-zone, dry cheeks', base: ['gel-cleanser', 'niacinamide', 'oat-cream'] },
      sensitive:{ label: 'Red, reactive, stings', base: ['gel-cleanser', 'eye-concentrate', 'night-balm'] }
    },
    concern: {
      dull:     { label: 'dullness',  add: ['niacinamide', 'clay-mask'], swap: 'for visible bounce and an even tone.' },
      lines:    { label: 'fine lines', add: ['squalane-oil', 'night-balm'], swap: 'to plump fine lines overnight.' },
      spots:    { label: 'breakouts', add: ['niacinamide', 'toner-mist'], swap: 'to keep congestion under control.' },
      redness:  { label: 'redness',   add: ['oat-cream', 'eye-concentrate'], swap: 'to calm flushing and reduce itching.' }
    },
    time: {
      quick:    { label: 'three-minute', note: 'Three steps, under four minutes.', drop: null },
      full:     { label: 'full',         note: 'The full ritual, including a weekly mask.', drop: 'clay-mask' },
      travel:   { label: 'travel-size',  note: 'Compact and cabin-bag friendly.', drop: 'travel-set' }
    }
  };

  function initQuiz() {
    var root = el('#quiz');
    if (!root) return;
    var answers = { skin: null, concern: null, time: null };
    var steps = Array.prototype.slice.call(root.querySelectorAll('.quiz__step'));
    var bars = Array.prototype.slice.call(root.querySelectorAll('.qb'));
    var result = root.querySelector('#quizResult');

    function show(i) {
      steps.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
      bars.forEach(function (b, k) {
        b.classList.toggle('is-active', k === i);
        b.classList.toggle('is-done', k < i);
      });
      var first = steps[i] && steps[i].querySelector('.opt');
      if (first) first.focus();
    }

    root.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-pick]');
      if (opt) {
        var q = opt.getAttribute('data-q'), v = opt.getAttribute('data-pick');
        answers[q] = v;
        Array.prototype.forEach.call(root.querySelectorAll('[data-q="' + q + '"]'), function (o) {
          o.classList.toggle('is-picked', o === opt);
        });
        var idx = { skin: 0, concern: 1, time: 2 }[q];
        setTimeout(function () {
          if (idx < 2) show(idx + 1); else build();
        }, 220);
        return;
      }
      var back = e.target.closest('[data-back]');
      if (back) { show(parseInt(back.getAttribute('data-back'), 10)); return; }
      var restart = e.target.closest('[data-restart]');
      if (restart) {
        answers = { skin: null, concern: null, time: null };
        Array.prototype.forEach.call(root.querySelectorAll('.opt'), function (o) { o.classList.remove('is-picked'); });
        if (result) result.hidden = true;
        root.querySelector('[data-step="0"]').classList.add('is-current');
        show(0);
        root.scrollIntoView({ block: 'start' });
        return;
      }
      var addOne = e.target.closest('[data-add]');
      if (addOne) { add(addOne.getAttribute('data-add'), 1); }
      var addAll = e.target.closest('[data-add-all]');
      if (addAll) {
        var ids = addAll.getAttribute('data-add-all').split(',');
        ids.forEach(function (id) { if (CATALOG[id]) cart[id] = Math.min(99, (cart[id] || 0) + 1); });
        writeCart(cart); render();
        toast('Routine of ' + ids.length, 'added to your bag');
        openCart();
      }
    });

    function build() {
      var skin = QUIZ.skin[answers.skin], concern = QUIZ.concern[answers.concern], time = QUIZ.time[answers.time];
      var ids = [];
      skin.base.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      concern.add.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      if (time.drop === 'travel-set') ids = ['gel-cleanser', 'niacinamide', 'travel-set'];
      else if (time.drop === 'clay-mask' && ids.indexOf('clay-mask') < 0) ids.push('clay-mask');
      ids = ids.slice(0, 4);

      var total = ids.reduce(function (a, id) { return a + CATALOG[id].price; }, 0);
      var roles = { 'gel-cleanser': 'Step 01 · Cleanse', 'toner-mist': 'Step 02 · Prep', 'niacinamide': 'Step 03 · Treat',
        'oat-cream': 'Step 04 · Seal', 'squalane-oil': 'Step 04 · Seal', 'night-balm': 'Step 04 · Seal',
        'eye-concentrate': 'Step 03 · Treat', 'clay-mask': 'Weekly · Reset', 'travel-set': 'Carry · All three' };

      var summary = '<div class="rsummary"><p><b>' + QUIZ.skin[answers.skin].label + ' skin · ' +
        QUIZ.concern[answers.concern].label + ' · ' + QUIZ.time[answers.time].label + ' routine.</b> ' +
        time.note + ' We filed ' + ids.length + (ids.length === 1 ? ' product' : ' products') +
        ' — ' + money(total) + ' for the set — and no more; each one earns its place.</p></div>';

      var rows = ids.map(function (id) {
        var p = CATALOG[id];
        return '<article class="rcard">' +
          '<img src="' + p.img + '" width="800" height="1000" alt="' + p.name + '">' +
          '<div><span class="rcard__role">' + (roles[id] || 'Verdant pick') + '</span>' +
          '<h4>' + p.name + '</h4><p>' + p.size + ' · ' + reason(id) + '</p></div>' +
          '<div class="rcard__act"><span class="rcard__price">' + money(p.price) + '</span>' +
          '<button type="button" class="btn btn--sm btn--ghost" data-add="' + id + '">Add one</button></div>' +
        '</article>';
      }).join('');

      var actions = '<div class="flex-between" style="margin-top:26px">' +
        '<button type="button" class="btn" data-magnetic data-add-all="' + ids.join(',') + '">Add all ' + ids.length + ' · ' + money(total) + '</button>' +
        '<button type="button" class="btn btn--sm btn--ghost" data-restart>Retake the quiz</button></div>';

      if (result) {
        result.innerHTML = summary + rows + actions;
        result.hidden = false;
        initMagnetic();
        result.scrollIntoView({ block: 'nearest' });
      }
    }

    show(0);
  }

  function reason(id) {
    var m = {
      'gel-cleanser': 'clears without stripping',
      'toner-mist': 'rebalances in ten seconds',
      'niacinamide': 'tightens the look of pores',
      'oat-cream': 'locks in overnight comfort',
      'squalane-oil': 'mimics skin’s own lipids',
      'night-balm': 'melts into a soft seal',
      'eye-concentrate': 'depuffs by morning',
      'clay-mask': 'draws out weekend congestion',
      'travel-set': 'cabin-bag approved'
    };
    return m[id] || 'a Verdant staple';
  }

  /* ---------- Contact form ---------- */
  function initForms() {
    var form = el('#contactForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        [['#cfName', 'Please tell us your name.'],
         ['#cfEmail', 'Enter a valid email address.'],
         ['#cfMsg', 'Add a few words so we can help.']].forEach(function (pair) {
          var input = form.querySelector(pair[0]);
          if (!input) return;
          var field = input.closest('.field');
          var bad = !input.value.trim() || (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim()));
          if (field) {
            field.classList.toggle('is-bad', bad);
            var err = field.querySelector('.field__err');
            if (err) err.textContent = bad ? pair[1] : '';
          }
          input.setAttribute('aria-invalid', bad ? 'true' : 'false');
          if (bad) { ok = false; }
        });
        var done = el('#contactOk');
        if (!ok) {
          if (done) done.hidden = true;
          var firstBad = form.querySelector('.is-bad input, .is-bad textarea');
          if (firstBad) firstBad.focus();
          return;
        }
        var nameEl = form.querySelector('#cfName');
        if (done) {
          done.hidden = false;
          done.innerHTML = '<strong>Thank you, ' + escapeHtml(nameEl.value.trim().split(' ')[0]) + '.</strong>' +
            '<p style="margin:0">Your note is filed under ' +
            escapeHtml(form.querySelector('#cfTopic').value) + '. A member of the studio replies within one working day — ' +
            'usually much sooner.</p>';
          done.setAttribute('tabindex', '-1');
          done.focus();
        }
        form.reset();
        return;
      });
      Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (i) {
        i.addEventListener('input', function () {
          var f = i.closest('.field');
          if (f && f.classList.contains('is-bad')) { f.classList.remove('is-bad'); var e = f.querySelector('.field__err'); if (e) e.textContent = ''; }
        });
      });
    }

    var news = els('.newsletter');
    news.forEach(function (n) {
      n.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = n.querySelector('input[type="email"]');
        var field = n.querySelector('.field');
        var valid = input && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        if (field) field.classList.toggle('is-bad', !valid);
        var err = n.querySelector('.field__err');
        if (err) err.textContent = valid ? '' : 'Enter a valid email address.';
        if (!valid) { if (input) input.focus(); return; }
        n.innerHTML = '<p class="form__ok" style="grid-column:1/-1"><strong>You’re on the list.</strong>' +
          'Look for the first dispatch on the first Tuesday of next month.</p>';
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Global delegated actions ---------- */
  function initDelegates() {
    document.addEventListener('click', function (e) {
      var addBtn = e.target.closest('[data-add]');
      if (addBtn && !addBtn.closest('#quiz')) {
        add(addBtn.getAttribute('data-add'), 1);
        var label = addBtn.querySelector('[data-label]') || addBtn;
        var prev = label.textContent;
        addBtn.classList.add('is-added');
        label.textContent = 'Added ✓';
        setTimeout(function () { label.textContent = prev; addBtn.classList.remove('is-added'); }, 1500);
        return;
      }
      if (e.target.closest('[data-open-cart]')) { openCart(); return; }
      if (e.target.closest('[data-close-cart]')) { closeCart(); return; }
      var inc = e.target.closest('[data-inc]');
      if (inc) { add(inc.getAttribute('data-inc'), 1); return; }
      var decB = e.target.closest('[data-dec]');
      if (decB) { dec(decB.getAttribute('data-dec')); return; }
      var rm = e.target.closest('[data-rm]');
      if (rm) { remove(rm.getAttribute('data-rm')); return; }
      var co = e.target.closest('[data-checkout]');
      if (co) {
        if (!cartLines().length) { toast('Your bag is empty', 'add a product first'); return; }
        co.disabled = true;
        co.textContent = 'Reserving…';
        setTimeout(function () {
          co.disabled = false;
          co.textContent = 'Checkout';
          toast('Order of ' + money(cartSubtotal()), 'reserved for 30 minutes');
        }, 900);
        return;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeCart(); }
    });
    document.addEventListener('keydown', trapDrawer);
    if (scrim) scrim.addEventListener('click', closeCart);
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    els('[data-year]').forEach(function (y) { y.textContent = String(new Date().getFullYear()); });
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    drawer = el('#cartDrawer');
    scrim = el('#cartScrim');
    cartBody = el('#cartBody');
    cartFoot = el('#cartFoot');
    badges = els('.cart-count');
    countSlots = els('[data-cart-count-text]');
    toastEl = el('#toast');

    if (drawer && cartBody && cartFoot) {
      render();
      initDelegates();
    }
    initNav();
    initAnn();
    initAccordion(document);
    initMagnetic();
    initRules();
    initShop();
    initQuiz();
    initForms();
    initYear();
  });
})();
