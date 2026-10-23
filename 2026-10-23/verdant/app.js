/* ==========================================================================
   Verdant — shared behaviour
   Vanilla JS, no dependencies. Every block is guarded by element checks.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Product registry (single source of truth) ---------- */
  var PRODUCTS = [
    { id: 'v-01', name: 'Dewpoint Gel Cleanser', cat: 'cleanse', price: 2800, size: '150 ml',
      img: 'https://images.unsplash.com/photo-1608248548383-b7b375b1f20c?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Pump bottle of Dewpoint Gel Cleanser on a linen cloth' },
    { id: 'v-02', name: 'Verdant Essence No. 4', cat: 'tone', price: 4200, size: '120 ml',
      img: 'https://images.unsplash.com/photo-1570194060602-10727914f09b?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Tall glass bottle of Verdant Essence No. 4 with a pale green label' },
    { id: 'v-03', name: 'Sage Renewal Serum', cat: 'treat', price: 5800, size: '30 ml',
      img: 'https://images.unsplash.com/photo-1620916569896-d1fd07c64d1d?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Dropper bottle of Sage Renewal Serum beside a sage sprig' },
    { id: 'v-04', name: 'Meadow Cream Rich', cat: 'moisturise', price: 4600, size: '50 ml',
      img: 'https://images.unsplash.com/photo-1585238341972-743b63f4a48d?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Ceramic jar of Meadow Cream Rich with a wooden lid' },
    { id: 'v-05', name: 'Nightleaf Repair Balm', cat: 'treat', price: 5200, size: '30 ml',
      img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa900?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Wide shallow jar of Nightleaf Repair Balm on a dark stone slab' },
    { id: 'v-06', name: 'Bare Botanical Oil', cat: 'oil', price: 3800, size: '30 ml',
      img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Amber bottle of Bare Botanical Oil lying on dried grasses' },
    { id: 'v-07', name: 'Clarity Clay Mask', cat: 'mask', price: 3400, size: '75 ml',
      img: 'https://images.unsplash.com/photo-1556228578-0c8ba9ada86f?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Tube of Clarity Clay Mask next to a bowl of green clay' },
    { id: 'v-08', name: 'Eye Meadow Compress', cat: 'eye', price: 4400, size: '15 ml',
      img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Slim pen applicator of Eye Meadow Compress against a sage card' },
    { id: 'v-09', name: 'Sun Veil SPF 30', cat: 'protect', price: 3600, size: '50 ml',
      img: 'https://images.unsplash.com/photo-1556229053-928a51d0c11d?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Slim tube of Sun Veil SPF 30 standing against a green wash' },
    { id: 'v-10', name: 'Meadow Cream Light', cat: 'moisturise', price: 4000, size: '50 ml',
      img: 'https://images.unsplash.com/photo-1585238976565-9493b2852b30?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Airless pump of Meadow Cream Light with a folded muslin cloth' },
    { id: 'v-11', name: 'Mist of Morning Dew', cat: 'mist', price: 3000, size: '100 ml',
      img: 'https://images.unsplash.com/photo-1526947432338-b68d3911fa06?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Fine-mist spray bottle of Mist of Morning Dew with water droplets' },
    { id: 'v-12', name: 'Hand & Husk Balm', cat: 'body', price: 2400, size: '75 ml',
      img: 'https://images.unsplash.com/photo-1547721064-da07968eb24e?auto=format&fit=crop&w=900&h=900&q=80',
      alt: 'Aluminium tube of Hand and Husk Balm resting on oat husks' }
  ];
  var BY_ID = {};
  PRODUCTS.forEach(function (p) { BY_ID[p.id] = p; });

  function money(cents) {
    return '$' + (cents / 100).toFixed(2);
  }
  function moneyShort(cents) {
    return cents % 100 === 0 ? '$' + (cents / 100) : money(cents);
  }
  function byId(id) { return document.getElementById(id); }

  /* ---------- Scroll progress (signature motion 1) ---------- */
  (function scrollProgress() {
    var bar = document.querySelector('.scroll-progress__bar');
    if (!bar) return;
    var queued = false;
    function paint() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      queued = false;
    }
    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; window.requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('resize', paint, { passive: true });
    paint();
  })();

  /* ---------- Decode text (signature motion 2) ---------- */
  (function decodeText() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.decode[data-decode]'));
    if (!nodes.length) return;
    var GLYPHS = 'abcdefghijklmnopqrstuvwxyz#%&*+=/\\<>';
    nodes.forEach(function (node) {
      var target = node.getAttribute('data-decode');
      if (reduceMotion) { node.textContent = target; return; }
      node.setAttribute('aria-label', target);
      var frame = 0;
      var total = 34;
      node.classList.add('is-decoding');
      function tick() {
        var progress = frame / total;
        var out = '';
        for (var i = 0; i < target.length; i++) {
          var ch = target[i];
          if (ch === ' ') { out += ' '; continue; }
          if (i < Math.floor(progress * target.length)) out += ch;
          else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        node.textContent = out;
        frame++;
        if (frame <= total) {
          window.requestAnimationFrame(function () {
            window.setTimeout(tick, 28);
          });
        } else {
          node.textContent = target;
          node.classList.remove('is-decoding');
        }
      }
      window.setTimeout(tick, 420);
    });
  })();

  /* ---------- Announcement bar ---------- */
  (function announce() {
    var bar = byId('announce');
    var close = byId('announce-close');
    if (!bar || !close) return;
    close.addEventListener('click', function () {
      bar.hidden = true;
    });
  })();

  /* ---------- Mobile navigation ---------- */
  (function nav() {
    var toggle = byId('nav-toggle');
    var menu = byId('main-nav');
    if (!toggle || !menu) return;
    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  })();

  /* ---------- Ledger row expansion ---------- */
  (function ledger() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('[data-ledger] .ledger-row'));
    if (!rows.length) return;
    rows.forEach(function (row) {
      var trigger = row.querySelector('[data-ledger-toggle]');
      var panel = row.querySelector('.ledger-row__detail');
      if (!trigger || !panel) return;
      if (!panel.id) panel.id = 'panel-' + (row.dataset.rowId || Math.random().toString(36).slice(2, 8));
      trigger.addEventListener('click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));
        row.classList.toggle('is-open', !open);
      });
    });

    // Deep link: #v-03 opens that product row.
    function openFromHash() {
      var id = decodeURIComponent(location.hash.replace('#', ''));
      if (!id) return;
      var target = document.querySelector('.ledger-row [id="' + id + '"]') ||
                   document.getElementById(id);
      if (!target) return;
      var row = target.closest('.ledger-row');
      if (!row) return;
      var trigger = row.querySelector('[data-ledger-toggle]');
      if (trigger && trigger.getAttribute('aria-expanded') !== 'true') {
        trigger.setAttribute('aria-expanded', 'true');
        row.classList.add('is-open');
      }
      window.setTimeout(function () {
        row.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }, 120);
    }
    window.addEventListener('hashchange', openFromHash);
    openFromHash();
  })();

  /* ---------- Cart ---------- */
  var cart = (function restore() {
    var items = [];
    try {
      var raw = window.localStorage.getItem('verdant-cart');
      if (raw) {
        JSON.parse(raw).forEach(function (entry) {
          if (entry && BY_ID[entry.id] && entry.qty > 0) {
            items.push({ id: entry.id, qty: Math.min(99, Math.floor(entry.qty)) });
          }
        });
      }
    } catch (err) { /* storage unavailable — cart stays in memory */ }
    return items;
  })();

  function persist() {
    try { window.localStorage.setItem('verdant-cart', JSON.stringify(cart)); } catch (err) { /* ignore */ }
  }
  function cartCount() {
    return cart.reduce(function (n, i) { return n + i.qty; }, 0);
  }
  function subtotal() {
    return cart.reduce(function (sum, i) { return sum + BY_ID[i.id].price * i.qty; }, 0);
  }
  var FREE_OVER = 6000;
  var FLAT = 450;
  function shipping() {
    if (!cart.length) return 0;
    return subtotal() >= FREE_OVER ? 0 : FLAT;
  }

  function addToCart(id, qty) {
    if (!BY_ID[id]) return;
    var line = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === id) { line = cart[i]; break; } }
    if (line) line.qty = Math.min(99, line.qty + (qty || 1));
    else cart.push({ id: id, qty: qty || 1 });
    persist();
    renderCart();
    bumpCartButton();
    toast(BY_ID[id].name + ' added to your cart.');
  }
  function setQty(id, qty) {
    var line = null, idx = -1;
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === id) { line = cart[i]; idx = i; break; } }
    if (!line) return;
    if (qty <= 0) cart.splice(idx, 1); else line.qty = Math.min(99, qty);
    persist();
    renderCart();
  }
  function removeLine(id) {
    setQty(id, 0);
    toast('Removed ' + BY_ID[id].name + '.');
  }

  var lastFocus = null;
  function renderCart() {
    var body = document.querySelector('[data-cart-body]');
    var foot = document.querySelector('[data-cart-foot]');
    var countNode = document.querySelector('[data-cart-count]');
    var openBtn = byId('cart-open');
    if (countNode) countNode.textContent = String(cartCount());
    if (openBtn) openBtn.setAttribute('aria-label', 'Open cart, ' + cartCount() + ' item' + (cartCount() === 1 ? '' : 's'));
    if (!body || !foot) return;

    if (!cart.length) {
      body.innerHTML = '<p class="cart-empty">Nothing on the list yet. <a href="shop.html">Open the registry</a> and add a formula.</p>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = cart.map(function (line) {
      var p = BY_ID[line.id];
      return '<div class="cart-item" data-line="' + p.id + '">' +
        '<div class="cart-item__media"><img src="' + p.img + '" alt="' + p.alt + '" width="66" height="66" loading="lazy"></div>' +
        '<div class="cart-item__info">' +
          '<p class="cart-item__name">' + p.name + '</p>' +
          '<p class="cart-item__meta mono">' + p.id.toUpperCase() + ' &middot; ' + p.size + ' &middot; ' + money(p.price) + ' each</p>' +
          '<div class="cart-item__qty" role="group" aria-label="Quantity for ' + p.name + '">' +
            '<button type="button" class="qty-btn" data-dec="' + p.id + '" aria-label="Decrease quantity of ' + p.name + '">&minus;</button>' +
            '<output aria-label="Quantity">' + line.qty + '</output>' +
            '<button type="button" class="qty-btn" data-inc="' + p.id + '" aria-label="Increase quantity of ' + p.name + '">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item__right">' +
          '<span class="cart-item__price mono">' + money(p.price * line.qty) + '</span>' +
          '<button type="button" class="cart-remove" data-remove="' + p.id + '">Remove</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var ship = shipping();
    document.querySelector('[data-cart-subtotal]').textContent = money(subtotal());
    document.querySelector('[data-cart-shipping]').textContent = cart.length && ship === 0 ? 'Free' : money(ship);
    document.querySelector('[data-cart-total]').textContent = money(subtotal() + ship);
    var note = document.querySelector('[data-cart-note]');
    if (ship > 0) {
      note.textContent = 'Add ' + money(FREE_OVER - subtotal()) + ' more for complimentary shipping.';
    } else {
      note.textContent = 'Complimentary shipping unlocked, plus three botanical samples.';
    }
  }

  function bumpCartButton() {
    var btn = byId('cart-open');
    if (!btn || reduceMotion) return;
    btn.classList.remove('is-bumped');
    void btn.offsetWidth;
    btn.classList.add('is-bumped');
  }

  function openCart() {
    var drawer = byId('cart-drawer');
    var backdrop = byId('drawer-backdrop');
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (backdrop) { backdrop.hidden = false; void backdrop.offsetWidth; backdrop.classList.add('is-visible'); }
    document.body.classList.add('is-locked');
    var close = byId('cart-close');
    if (close) close.focus();
  }
  function closeCart() {
    var drawer = byId('cart-drawer');
    var backdrop = byId('drawer-backdrop');
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) {
      backdrop.classList.remove('is-visible');
      window.setTimeout(function () { backdrop.hidden = true; }, 380);
    }
    document.body.classList.remove('is-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  (function cartWiring() {
    var drawer = byId('cart-drawer');
    if (!drawer) return;
    var open = byId('cart-open');
    var close = byId('cart-close');
    var backdrop = byId('drawer-backdrop');
    if (open) open.addEventListener('click', openCart);
    if (close) close.addEventListener('click', closeCart);
    if (backdrop) backdrop.addEventListener('click', closeCart);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCart();
      if (e.key === 'Tab' && drawer.classList.contains('is-open')) {
        var f = drawer.querySelectorAll('button,a[href],input,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    drawer.addEventListener('click', function (e) {
      var inc = e.target.closest('[data-inc]');
      var dec = e.target.closest('[data-dec]');
      var rm = e.target.closest('[data-remove]');
      if (inc) setQty(inc.getAttribute('data-inc'), (cart.filter(function (l) { return l.id === inc.getAttribute('data-inc'); })[0] || {}).qty + 1);
      if (dec) setQty(dec.getAttribute('data-dec'), (cart.filter(function (l) { return l.id === dec.getAttribute('data-dec'); })[0] || {}).qty - 1);
      if (rm) removeLine(rm.getAttribute('data-remove'));
    });

    var checkout = document.querySelector('[data-checkout]');
    if (checkout) checkout.addEventListener('click', function () {
      toast('Demo storefront — totals are live, checkout is not wired to a payment provider.');
    });

    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add-to-cart]');
      if (!add) return;
      addToCart(add.getAttribute('data-add-to-cart'), 1);
      if (add.classList.contains('quick-add')) {
        var label = add.textContent;
        add.textContent = 'Added \u2713';
        add.classList.add('is-added');
        window.setTimeout(function () { add.textContent = label; add.classList.remove('is-added'); }, 1400);
      }
    });

    renderCart();
  })();

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(message) {
    var el = byId('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  /* ---------- Hairline rule + ledger row reveals ---------- */
  (function reveals() {
    var watched = document.querySelectorAll('[data-rule], .reveal-rows');
    if (!watched.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(watched, function (n) { n.classList.add('is-drawn', 'is-live'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains('reveal-rows')) {
          var triggers = el.querySelectorAll('[data-ledger-toggle]');
          Array.prototype.forEach.call(triggers, function (t, i) {
            window.setTimeout(function () { t.style.transitionDelay = '0ms'; }, i * 90);
            t.style.transitionDelay = (i * 90) + 'ms';
          });
          el.classList.add('is-live');
        } else {
          el.classList.add('is-drawn');
        }
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    Array.prototype.forEach.call(watched, function (n) { io.observe(n); });
  })();

  /* ---------- Shop: filter the registry ---------- */
  (function shop() {
    var filters = byId('shop-filters');
    var rowsWrap = byId('registry');
    if (!filters || !rowsWrap) return;
    var rows = Array.prototype.slice.call(rowsWrap.querySelectorAll('.ledger-row'));
    var countNode = rowsWrap.querySelector('[data-visible-count]');
    function apply(cat) {
      var shown = 0;
      rows.forEach(function (row) {
        var match = cat === 'all' || row.getAttribute('data-cat') === cat;
        row.hidden = !match;
        if (match) shown++;
      });
      if (countNode) {
        countNode.textContent = shown + (shown === 1 ? ' formula' : ' formulas') + ' listed';
      }
    }
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-filter]');
      if (!chip) return;
      Array.prototype.forEach.call(filters.querySelectorAll('[data-filter]'), function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      apply(chip.getAttribute('data-filter'));
    });
    apply(new URLSearchParams(location.search).get('cat') || 'all');
    if (new URLSearchParams(location.search).get('cat')) {
      var chip = filters.querySelector('[data-filter="' + new URLSearchParams(location.search).get('cat') + '"]');
      if (chip) {
        Array.prototype.forEach.call(filters.querySelectorAll('[data-filter]'), function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });
      }
    }
  })();

  /* ---------- Routine quiz ---------- */
  (function quiz() {
    var root = byId('quiz');
    if (!root) return;
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-step]'));
    var result = byId('quiz-result');
    var bar = root.querySelector('[data-quiz-bar]');
    var answers = { feel: null, goal: null, time: null };
    var index = 0;

    function paintBar() {
      if (!bar) return;
      var segs = bar.querySelectorAll('.quiz__seg');
      Array.prototype.forEach.call(segs, function (s, i) {
        s.classList.toggle('is-done', i < index || (i === index && answers[steps[i].getAttribute('data-step')]));
      });
    }
    function show(i) {
      index = i;
      steps.forEach(function (s, n) { s.classList.toggle('is-current', n === i); });
      root.querySelectorAll('[data-back]').forEach(function (b) { b.disabled = i === 0; });
      root.querySelectorAll('[data-next]').forEach(function (b) {
        b.disabled = !answers[steps[i].getAttribute('data-step')];
        b.textContent = i === steps.length - 1 ? 'Build my routine' : 'Next question';
      });
      paintBar();
    }
    steps.forEach(function (step) {
      var key = step.getAttribute('data-step');
      step.addEventListener('change', function (e) {
        if (!e.target.name) return;
        answers[key] = e.target.value;
        var nextBtn = step.querySelector('[data-next]');
        if (nextBtn) nextBtn.disabled = false;
        paintBar();
      });
    });
    root.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!answers[steps[index].getAttribute('data-step')]) return;
        if (index < steps.length - 1) { show(index + 1); return; }
        buildRoutine();
      });
    });
    root.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (result && result.classList.contains('is-current')) {
          result.classList.remove('is-current');
          show(steps.length - 1);
          return;
        }
        if (index > 0) show(index - 1);
      });
    });

    function buildRoutine() {
      var picks = [];
      var feel = answers.feel, goal = answers.goal, time = answers.time;
      function pick(id) { if (id && picks.indexOf(id) === -1) picks.push(id); }

      pick('v-01');
      if (time !== 'quick') pick('v-02');
      if (goal === 'lines') pick('v-05');
      if (goal === 'glow' || goal === 'calm') pick('v-03');
      if (goal === 'barrier') pick('v-06');
      if (goal === 'lines' && time !== 'quick') pick('v-03');
      if (feel === 'dry' || feel === 'sensitive') pick('v-04');
      else if (feel === 'oily') pick('v-10');
      else pick(time === 'full' ? 'v-04' : 'v-10');
      if (goal === 'barrier') pick('v-04');
      pick('v-09');
      if (time === 'full') {
        if (feel === 'oily' || feel === 'combination') pick('v-07');
        if (goal === 'lines') pick('v-08');
        if (feel === 'dry') pick('v-11');
      }

      var total = picks.reduce(function (sum, id) { return sum + BY_ID[id].price; }, 0);
      var morning = 1, evening = 1;
      var html = picks.map(function (id, i) {
        var p = BY_ID[id];
        var slot;
        if (p.cat === 'protect') slot = 'AM only, final step';
        else if (p.cat === 'mask' || p.cat === 'body') slot = 'PM, twice weekly';
        else if (p.cat === 'treat' && p.id === 'v-05') slot = 'PM only';
        else if (p.cat === 'treat') slot = 'AM step ' + morning++ + ' &middot; PM step ' + evening++;
        else slot = 'AM step ' + morning++ + ' &middot; PM step ' + evening++;

        return '<article class="ledger-row" data-row-id="rec-' + i + '">' +
          '<h3 class="ledger-row__heading">' +
            '<button type="button" class="ledger-row__trigger" data-ledger-toggle aria-expanded="false">' +
              '<span class="ledger-row__index mono">' + String(i + 1).padStart(2, '0') + '</span>' +
              '<span class="ledger-row__name">' + p.name + '</span>' +
              '<span class="ledger-row__cat mono hide-sm">' + slot + '</span>' +
              '<span class="ledger-row__price mono">' + moneyShort(p.price) + '</span>' +
              '<span class="ledger-row__chev" aria-hidden="true"></span>' +
            '</button>' +
          '</h3>' +
          '<div class="ledger-row__detail"><div class="ledger-detail">' +
            '<div class="ledger-detail__media"><img src="' + p.img + '" alt="' + p.alt + '" width="450" height="450" loading="lazy"></div>' +
            '<div class="ledger-detail__body">' +
              '<p class="ledger-detail__lead">' + DETAIL[p.id] + '</p>' +
              '<dl class="ledger-spec">' +
                '<div><dt class="mono">Placement</dt><dd>' + slot + '</dd></div>' +
                '<div><dt class="mono">Size</dt><dd>' + p.size + '</dd></div>' +
                '<div><dt class="mono">Why it is here</dt><dd>' + REASON[p.id] + '</dd></div>' +
              '</dl>' +
              '<div class="ledger-detail__actions">' +
                '<button type="button" class="btn btn--sm btn--primary" data-add-to-cart="' + p.id + '">Add to cart &middot; ' + moneyShort(p.price) + '</button>' +
                '<a class="btn btn--sm btn--ghost" href="shop.html#' + p.id + '">Formula sheet</a>' +
              '</div>' +
            '</div>' +
          '</div></div>' +
        '</article>';
      }).join('');

      var heading = byId('result-title');
      if (heading) {
        heading.textContent = 'Your ' + (time === 'quick' ? 'two-minute' : time === 'core' ? 'five-minute' : 'full-ritual') + ' shelf, ' + picks.length + ' bottles';
      }
      var summary = byId('result-summary');
      if (summary) {
        summary.textContent = 'Built from ' + FEEL_LABEL[feel] + ' skin wanting ' + GOAL_LABEL[goal] + ', at ' + TIME_LABEL[time] + '.';
      }
      var totalNode = byId('result-total');
      if (totalNode) totalNode.textContent = 'Full routine ' + money(total);
      var addAll = byId('result-add-all');
      if (addAll) {
        addAll.removeAttribute('data-add-to-cart');
        addAll.setAttribute('data-add-all', picks.join(','));
        addAll.textContent = 'Add all ' + picks.length + ' to cart';
      }
      var list = byId('result-list');
      if (list) list.innerHTML = html;

      steps.forEach(function (s) { s.classList.remove('is-current'); });
      if (result) {
        result.classList.add('is-current');
        if (bar) Array.prototype.forEach.call(bar.querySelectorAll('.quiz__seg'), function (s) { s.classList.add('is-done'); });
        result.setAttribute('tabindex', '-1');
        result.focus();
      }
      rebindLedger(list);
    }

    var FEEL_LABEL = { dry: 'dry and tight', oily: 'oily by afternoon', combination: 'combination', sensitive: 'reactive and sensitive' };
    var GOAL_LABEL = { calm: 'less redness', glow: 'more even tone', barrier: 'a barrier that holds water', lines: 'smoother texture' };
    var TIME_LABEL = { quick: 'two minutes', core: 'five minutes', full: 'a full ten-minute ritual' };
    var DETAIL = {
      'v-01': 'A pH-5.5 gel that lifts SPF and city grime without the tight feeling afterwards.',
      'v-02': 'A watery essence layered under serum so the rest of the routine spreads further.',
      'v-03': 'A weightless antioxidant fluid that lifts the grey cast off tired skin.',
      'v-04': 'Oat ferment and sasanqua oil whipped into a cream that holds all night.',
      'v-05': 'A bakuchiol balm that resurfaces overnight without peeling weekend.',
      'v-06': 'Three cold-pressed oils that seal in whatever you layered underneath.',
      'v-07': 'A green clay and lactic mask that clears the congested zone in eight minutes.',
      'v-08': 'A caffeine-and-peptide compress for the orbital area, applied with the ring finger.',
      'v-09': 'A hybrid SPF 30 that disappears on every depth we tested it on.',
      'v-10': 'The same barrier blend as Rich, cut with more water for warm months.',
      'v-11': 'A fine mineral mist that resets makeup and rehydrates between washes.',
      'v-12': 'A husk-and-shea balm for hands that wash twenty times a day.'
    };
    var REASON = {
      'v-01': 'Every routine starts with a cleanser that does not strip.',
      'v-02': 'Adds water back before you ask anything else of skin.',
      'v-03': 'The even-tone and redness workhorse, morning and night.',
      'v-04': 'Seals the barrier so overnight water loss stops.',
      'v-05': 'Nightly renewal without retinol irritation.',
      'v-06': 'Occlusive oil layer for skin that loses water by midday.',
      'v-07': 'Weekly clear-out for congested areas.',
      'v-08': 'Targeted support where texture shows first.',
      'v-09': 'The single most effective product for tone and lines.',
      'v-10': 'Lightweight hydration that will not slide on oily skin.',
      'v-11': 'Midday hydration without disturbing what is underneath.',
      'v-12': 'Because hands show age first and wash most.'
    };
    root.addEventListener('click', function (e) {
      var retake = e.target.closest('[data-retake]');
      if (!retake) return;
      if (result) result.classList.remove('is-current');
      show(steps.length - 1);
      var panel = root.querySelector('.quiz__panel');
      if (panel) panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
    show(0);
  })();

  /* Add-all button on the routine result */
  document.addEventListener('click', function (e) {
    var all = e.target.closest('[data-add-all]');
    if (!all) return;
    var ids = all.getAttribute('data-add-all').split(',');
    ids.forEach(function (id) { if (BY_ID[id]) cart.push({ id: id, qty: 1 }); });
    persist();
    renderCart();
    bumpCartButton();
    toast(ids.length + ' bottles added. Open the cart to check the order.');
    openCart();
  });

  /* Re-bind ledger toggles on rows injected by the quiz */
  function rebindLedger(scope) {
    if (!scope) return;
    Array.prototype.forEach.call(scope.querySelectorAll('.ledger-row'), function (row) {
      var trigger = row.querySelector('[data-ledger-toggle]');
      if (!trigger || trigger.dataset.bound) return;
      trigger.dataset.bound = '1';
      trigger.addEventListener('click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));
        row.classList.toggle('is-open', !open);
      });
    });
  }

  /* ---------- Forms ---------- */
  (function forms() {
    Array.prototype.forEach.call(document.querySelectorAll('form[data-newsletter]'), function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var status = form.querySelector('[data-form-status]');
        if (!input || !input.value || input.validity.valid === false) {
          if (status) status.textContent = 'Please enter a valid email address.';
          if (input) input.focus();
          return;
        }
        form.reset();
        if (status) status.textContent = 'Added to the letter list — first note arrives on the 1st.';
        toast('You are on the Ledger Letter list.');
      });
    });

    var contact = byId('contact-form');
    if (contact) {
      contact.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        var required = contact.querySelectorAll('[data-required]');
        Array.prototype.forEach.call(required, function (field) {
          var wrap = field.closest('.field');
          var msg = wrap && wrap.querySelector('.field__error');
          var bad = !field.value.trim() || (field.type === 'email' && field.validity.valid === false);
          if (wrap) wrap.classList.toggle('field--error', bad);
          if (msg) msg.textContent = bad ? (field.type === 'email' ? 'Enter a valid email address.' : 'This field is required.') : '';
          if (bad) ok = false;
        });
        var consent = contact.querySelector('[data-consent]');
        if (consent && !consent.checked) {
          ok = false;
          var cwrap = consent.closest('.field');
          if (cwrap) cwrap.classList.add('field--error');
          var cmsg = cwrap && cwrap.querySelector('.field__error');
          if (cmsg) cmsg.textContent = 'Please tick the box so we can reply.';
        }
        var status = contact.querySelector('[data-form-status]');
        if (!ok) {
          if (status) status.textContent = 'Check the highlighted fields above.';
          var firstBad = contact.querySelector('.field--error input, .field--error textarea, .field--error select');
          if (firstBad) firstBad.focus();
          return;
        }
        contact.reset();
        Array.prototype.forEach.call(contact.querySelectorAll('.field'), function (f) { f.classList.remove('field--error'); });
        if (status) status.textContent = '';
        var panel = byId('contact-success');
        if (panel) {
          panel.hidden = false;
          panel.focus();
          var ref = byId('ticket-ref');
          if (ref) ref.textContent = 'VRD-' + String(Date.now()).slice(-5);
        }
        toast('Message logged — a reply follows within two working days.');
      });
    }
  })();

  /* ---------- Footer year ---------- */
  (function year() {
    var node = document.querySelector('[data-year]');
    if (node) node.textContent = String(new Date().getFullYear());
  })();

  /* ---------- Expose a couple of helpers for page markup ---------- */
  window.Verdant = { products: PRODUCTS, addToCart: addToCart, openCart: openCart, toast: toast };
})();
