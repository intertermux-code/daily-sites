/* ============================================================
   Verdant — shared behaviour
   Ticker + reveals + nav + cart drawer + shop filters +
   routine quiz + form handling + image safety net
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Product registry (ids match data attributes in the HTML) ---------- */
  var IMG = "https://images.unsplash.com/photo-";
  var Q = "?auto=format&fit=crop&w=900&q=80";
  var PRODUCTS = {
    "p-clover":     { name: "Clover Milk Cleanser",   price: 32, note: "Cloud-milk gel cleanser, pH 5.2", img: IMG + "1556228578-8c89e6adf883" + Q },
    "p-morningdew": { name: "Morning Dew Essence",    price: 48, note: "Fermented oat water, first layer", img: IMG + "1620916566398-39f1143ab7be" + Q },
    "p-calendula":  { name: "Calendula Cushion Cream",price: 46, note: "Redness-soothing day moisturiser", img: IMG + "1571781926291-c477c6a7ac57" + Q },
    "p-sorrel":     { name: "Sorrel Night Balm",      price: 58, note: "Oxalis + shea overnight seal", img: IMG + "1612817265721-a940043a1f1d" + Q },
    "p-vervain":    { name: "Vervain Vitamin C Drops",price: 62, note: "12% derivatives + green tea", img: IMG + "1608298432030-a2262ff9670e" + Q },
    "p-fennel":     { name: "Fennel Squalane Seal",   price: 44, note: "Weightless oil-suffix step", img: IMG + "1629198733737-d70a629b94e0" + Q },
    "p-fern":       { name: "Fern Clay Refine Mask",  price: 36, note: "Weekly kaolin + wood fern", img: IMG + "1598440947619-2c35fc9aa901" + Q },
    "p-moss":       { name: "Sheet Moss Compress",    price: 28, note: "Cooling 10-minute veil, 4 ct", img: IMG + "1556228453-efd67c77b50b" + Q },
    "p-echo":       { name: "Echo Eye Renewal",       price: 52, note: "Caffeine + peptide, 15 ml", img: IMG + "1611930022073-b7a2ba819f98" + Q },
    "p-bloom":      { name: "Bloom Mineral SPF 30",   price: 40, note: "No-white-cast zinc finish", img: IMG + "1631729371279-11d3a0189279" + Q }
  };

  var FREE_SHIP = 60;
  var money = function (n) { return "$" + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, ""); };

  /* ---------- Storage with graceful fallback ---------- */
  var mem = {};
  var store = {
    get: function (k) {
      try { return window.localStorage.getItem(k); }
      catch (e) { return mem[k] || null; }
    },
    set: function (k, v) {
      mem[k] = v;
      try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ }
    }
  };

  function readCart() {
    var raw = store.get("verdant.cart");
    if (!raw) return {};
    try {
      var obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch (e) { return {}; }
  }
  function writeCart(c) { store.set("verdant.cart", JSON.stringify(c)); }

  var cart = readCart();

  function cartCount() {
    var n = 0;
    Object.keys(cart).forEach(function (id) { n += Math.max(0, cart[id] | 0); });
    return n;
  }
  function cartLines() {
    return Object.keys(cart).filter(function (id) {
      return cart[id] > 0 && PRODUCTS[id];
    }).map(function (id) {
      return { id: id, qty: cart[id], p: PRODUCTS[id] };
    });
  }
  function cartSubtotal() {
    return cartLines().reduce(function (s, l) { return s + l.p.price * l.qty; }, 0);
  }

  /* ---------- Image safety net: brand-tinted SVG tile if a photo fails ---------- */
  function leafPath(c) {
    return '<path d="M150 40c60 20 96 74 96 138-52 22-114 4-146-34-24-28-16-76 50-104z" fill="' + c + '" opacity=".5"/>' +
      '<path d="M150 40c22 62 60 108 118 130" stroke="' + c + '" stroke-width="4" fill="none" opacity=".7"/>';
  }
  function fallbackTile(label) {
    var txt = (label || "Verdant").toUpperCase().slice(0, 18);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f1f6ef"/><stop offset="1" stop-color="#d9e6d6"/></linearGradient></defs>' +
      '<rect width="300" height="400" fill="url(#g)"/>' +
      '<g transform="translate(30 60) scale(.8)">' + leafPath("#5b7d5a") + "</g>" +
      '<text x="150" y="330" font-family="Georgia,serif" font-size="19" fill="#3b5640" text-anchor="middle">' +
      txt.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function guardImages(root) {
    var imgs = (root || document).querySelectorAll("img[data-fallback]");
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.__vGuard) return;
      img.__vGuard = true;
      img.addEventListener("error", function () {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = "1";
        img.src = fallbackTile(img.getAttribute("alt") || img.dataset.fallback);
      });
      if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
    });
  }

  /* ---------- Blur-fade ascend reveals ---------- */
  function revealAll(nodes) {
    Array.prototype.forEach.call(nodes || document.querySelectorAll("[data-reveal]"), function (el) {
      el.classList.add("in");
    });
  }

  function initReveals() {
    /* a [data-stagger] container hands the reveal to its children, 80ms apart */
    Array.prototype.forEach.call(document.querySelectorAll("[data-stagger]"), function (group) {
      group.removeAttribute("data-reveal");
      Array.prototype.forEach.call(group.children, function (el, i) {
        el.setAttribute("data-reveal", "");
        el.style.transitionDelay = Math.min(i, 8) * 80 + "ms";
      });
    });

    var items = document.querySelectorAll("[data-reveal]");

    if (!("IntersectionObserver" in window)) { revealAll(items); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    /* safety: nothing may stay invisible if the page is never scrolled */
    window.addEventListener("load", function () {
      window.setTimeout(function () { revealAll(); io.disconnect(); }, 1600);
    });
  }

  /* ---------- Header + mobile nav ---------- */
  function initHeader() {
    var head = document.querySelector(".masthead");
    if (head) {
      var onScroll = function () { head.classList.toggle("is-stuck", window.scrollY > 12); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    var toggle = document.querySelector(".nav-toggle");
    var list = document.querySelector("#site-nav");
    if (!toggle || !list) return;
    var close = function () {
      list.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!list.classList.contains("is-open")) return;
      if (list.contains(e.target) || toggle.contains(e.target)) return;
      close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && list.classList.contains("is-open")) { close(); toggle.focus(); }
    });
  }

  /* ---------- Cart drawer ---------- */
  var drawer, overlay, itemsEl, footEl, badges;

  function lineTemplate(l) {
    var li = document.createElement("li");
    li.className = "cart-line";
    li.dataset.line = l.id;
    li.innerHTML =
      '<div class="cart-line__img"><img src="' + l.p.img + '" width="160" height="200" alt="' + l.p.name + '" data-fallback="' + l.p.name + '"></div>' +
      '<div><h3 class="cart-line__name">' + l.p.name + '</h3>' +
      '<p class="cart-line__sub">' + l.p.note + '</p>' +
      '<div class="qty">' +
      '<button type="button" data-qty="-1" aria-label="Decrease quantity of ' + l.p.name + '">−</button>' +
      '<span aria-live="polite">' + l.qty + '</span>' +
      '<button type="button" data-qty="1" aria-label="Increase quantity of ' + l.p.name + '">+</button>' +
      "</div></div>" +
      '<div class="cart-line__end"><p class="cart-line__price">' + money(l.p.price * l.qty) + "</p>" +
      '<button type="button" class="cart-line__rm" data-remove="' + l.id + '">Remove</button></div>';
    return li;
  }

  function renderCart() {
    var lines = cartLines();
    var n = cartCount();

    Array.prototype.forEach.call(badges, function (b) {
      b.textContent = n;
      b.dataset.empty = n === 0 ? "true" : "false";
      b.classList.remove("is-pop");
      void b.offsetWidth;
      if (n > 0) b.classList.add("is-pop");
    });

    if (!itemsEl) return;

    if (!lines.length) {
      itemsEl.innerHTML =
        '<li class="drawer__empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
        '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 1 1 6 0"/><path d="M12 13c2-1 3-3 3-5"/></svg>' +
        "<h3>Your bag is empty</h3><p>Ten formulas, one garden. Start with the cleanser everyone repurchases.</p>" +
        '<a class="btn btn--solid" href="shop.html">Browse the shop</a></li>';
      footEl.hidden = true;
      return;
    }

    if (footEl) footEl.hidden = false;
    itemsEl.innerHTML = "";
    lines.forEach(function (l) { itemsEl.appendChild(lineTemplate(l)); });
    guardImages(itemsEl);

    if (!footEl) return;
    var sub = cartSubtotal();
    var ship = sub >= FREE_SHIP ? 0 : 5;
    var pct = Math.min(100, Math.round((sub / FREE_SHIP) * 100));
    var sum = footEl.querySelector("[data-sum]");
    var shipEl = footEl.querySelector("[data-ship]");
    var totalEl = footEl.querySelector("[data-total]");
    var msg = footEl.querySelector("[data-progress-msg]");
    var barEl = footEl.querySelector("[data-bar]");
    if (sum) sum.textContent = money(sub);
    if (shipEl) shipEl.textContent = ship === 0 ? "Free" : money(ship);
    if (totalEl) totalEl.textContent = money(sub + ship);
    if (msg) {
      msg.textContent = ship === 0
        ? "Complimentary shipping unlocked."
        : "Add " + money(FREE_SHIP - sub) + " more for complimentary shipping.";
    }
    if (barEl) barEl.style.width = pct + "%";
  }

  function changeQty(id, delta) {
    if (!PRODUCTS[id]) return;
    var next = (cart[id] | 0) + delta;
    if (next <= 0) delete cart[id]; else cart[id] = Math.min(next, 9);
    writeCart(cart);
    renderCart();
  }

  function addToCart(id, name) {
    if (!PRODUCTS[id]) PRODUCTS[id] = { name: name || "Verdant item", price: 0, note: "", img: "" };
    cart[id] = Math.min((cart[id] | 0) + 1, 9);
    writeCart(cart);
    renderCart();
    toast(name || PRODUCTS[id].name);
  }

  var toastEl, toastTimer;
  function toast(name) {
    if (!toastEl) return;
    toastEl.querySelector("[data-toast-name]").textContent = name;
    toastEl.classList.add("is-show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.classList.remove("is-show"); }, 2600);
  }

  var lastFocus = null;
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("is-open");
    drawer.removeAttribute("aria-hidden");
    overlay.classList.add("is-open");
    document.body.classList.add("has-drawer-open");
    var first = drawer.querySelector("button, a");
    if (first) first.focus();
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("is-open");
    document.body.classList.remove("has-drawer-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initCart() {
    drawer = document.querySelector("#bag-drawer");
    overlay = document.querySelector("#bag-overlay");
    if (!drawer || !overlay) return;
    itemsEl = drawer.querySelector("[data-items]");
    footEl = drawer.querySelector("[data-foot]");
    badges = document.querySelectorAll("[data-cart-count]");
    toastEl = document.querySelector("#toast");

    Array.prototype.forEach.call(document.querySelectorAll("[data-open-bag]"), function (b) {
      b.addEventListener("click", openDrawer);
    });
    var closeBtn = drawer.querySelector("[data-close-bag]");
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

    /* quick-add / add-to-bag buttons anywhere */
    document.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) {
        e.preventDefault();
        addToCart(add.dataset.add, add.dataset.name);
        var label = add.querySelector("[data-add-label]");
        if (label) {
          var prev = label.textContent;
          label.textContent = "Added to bag";
          add.classList.add("is-done");
          window.setTimeout(function () { label.textContent = prev; add.classList.remove("is-done"); }, 1500);
        }
        return;
      }
      var rm = e.target.closest("[data-remove]");
      if (rm) { delete cart[rm.dataset.remove]; writeCart(cart); renderCart(); return; }
      var q = e.target.closest("[data-qty]");
      if (q) {
        var line = q.closest("[data-line]");
        if (line) changeQty(line.dataset.line, parseInt(q.dataset.qty, 10));
      }
    });

    renderCart();
  }

  /* ---------- Shop filters ---------- */
  function initShop() {
    var chips = document.querySelectorAll("[data-filter]");
    var grid = document.querySelector("[data-product-grid]");
    if (!chips.length || !grid) return;
    var counter = document.querySelector("[data-visible-count]");
    var cards = grid.querySelectorAll("[data-cat]");
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener("click", function () {
        Array.prototype.forEach.call(chips, function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var f = chip.dataset.filter;
        var shown = 0;
        Array.prototype.forEach.call(cards, function (card) {
          var hit = f === "all" || card.dataset.cat.split(" ").indexOf(f) > -1;
          card.classList.toggle("is-hidden", !hit);
          if (hit) shown += 1;
        });
        if (counter) counter.textContent = shown + (shown === 1 ? " formula" : " formulas");
      });
    });
  }

  /* ---------- Routine quiz ---------- */
  var RITUAL_NAMES = {
    calm: "The Quiet Calm Ritual",
    tone: "The First Light Ritual",
    texture: "The Smooth Canopy Ritual",
    hydration: "The Deep Rain Ritual"
  };
  var TREAT = {
    calm: "p-calendula",
    tone: "p-vervain",
    texture: "p-fern",
    hydration: "p-moss"
  };
  var SEAL = {
    quick: "p-bloom",
    medium: "p-fennel",
    slow: "p-sorrel"
  };
  var PACE_TEXT = {
    quick: "60 seconds, morning only",
    medium: "about 3 minutes, morning and night",
    slow: "an unhurried 8 minutes, at night"
  };

  function initQuiz() {
    var quiz = document.querySelector("#quiz");
    if (!quiz) return;
    var steps = quiz.querySelectorAll(".quiz__step");
    var bar = quiz.querySelector("[data-quiz-bar]");
    var countEl = quiz.querySelector("[data-quiz-count]");
    var result = quiz.querySelector(".quiz__result");
    var nextBtn = quiz.querySelector("[data-quiz-next]");
    var answers = {};
    var step = 0;

    function show(i) {
      step = i;
      Array.prototype.forEach.call(steps, function (s, idx) {
        s.classList.toggle("is-active", idx === i);
      });
      if (result) result.classList.toggle("is-active", i >= steps.length);
      var pct = Math.min(100, Math.round((i / steps.length) * 100));
      if (bar) bar.style.width = pct + "%";
      if (countEl) countEl.textContent = i >= steps.length ? "Complete" : "Step " + (i + 1) + " of " + steps.length;
      if (nextBtn) nextBtn.hidden = i >= steps.length;
      var active = steps[i];
      if (active) {
        var firstOpt = active.querySelector(".option");
        if (firstOpt) firstOpt.focus();
      } else if (result) {
        result.setAttribute("tabindex", "-1");
        result.focus();
      }
    }

    Array.prototype.forEach.call(quiz.querySelectorAll(".option"), function (opt) {
      opt.addEventListener("click", function () {
        var q = opt.dataset.q;
        answers[q] = opt.dataset.v;
        var group = opt.closest(".options");
        Array.prototype.forEach.call(group.querySelectorAll(".option"), function (o) {
          o.setAttribute("aria-pressed", o === opt ? "true" : "false");
        });
        window.setTimeout(function () {
          if (step < steps.length) show(step + 1);
          if (step >= steps.length) buildResult();
        }, 240);
      });
    });

    if (nextBtn) nextBtn.addEventListener("click", function () {
      if (step < steps.length) show(step + 1);
      if (step >= steps.length) buildResult();
    });

    var back = quiz.querySelector("[data-quiz-back]");
    if (back) back.addEventListener("click", function () {
      show(Math.max(0, step - 1));
    });

    var restart = document.querySelector("[data-quiz-restart]");
    if (restart) restart.addEventListener("click", function () {
      answers = {};
      Array.prototype.forEach.call(quiz.querySelectorAll(".option"), function (o) {
        o.setAttribute("aria-pressed", "false");
      });
      show(0);
    });

    function plan() {
      var ids = ["p-clover", "p-morningdew"];
      ids.push(TREAT[answers.goal] || "p-morningdew");
      ids.push(SEAL[answers.pace] || "p-fennel");
      var seen = {};
      return ids.filter(function (id) { if (seen[id]) return false; seen[id] = 1; return true; });
    }

    function buildResult() {
      if (!result) return;
      var ids = plan();
      var titleEl = result.querySelector("[data-ritual-name]");
      if (titleEl) {
        titleEl.textContent = RITUAL_NAMES[answers.goal] || "The Daily Verdant Ritual";
      }
      var paceEl = result.querySelector("[data-ritual-pace]");
      if (paceEl) paceEl.textContent = PACE_TEXT[answers.pace] || "about 3 minutes";

      var chips = result.querySelector("[data-quiz-summary]");
      if (chips) {
        var labels = {
          skin: { dry: "Tight, flaky skin", oily: "Shine by noon", combo: "Combination", sensitive: "Easily stirred" },
          goal: { calm: "Calms redness", tone: "Evens tone", texture: "Smooths texture", hydration: "Deep hydration" },
          pace: { quick: "60-second routine", medium: "3-minute routine", slow: "Unhurried routine" }
        };
        chips.innerHTML = ["skin", "goal", "pace"].filter(function (k) { return answers[k]; })
          .map(function (k) { return "<span>" + labels[k][answers[k]] + "</span>"; }).join("");
      }

      var list = result.querySelector(".ritual-list");
      var verbs = ["Cleanse", "Prepare", "Treat", "Seal"];
      if (list) {
        list.innerHTML = "";
        ids.forEach(function (id, i) {
          var p = PRODUCTS[id];
          if (!p) return;
          var row = document.createElement("li");
          row.className = "ritual-item";
          row.innerHTML =
            '<div class="ritual-item__img"><img src="' + p.img + '" width="160" height="200" alt="' + p.name + '" data-fallback="' + p.name + '"></div>' +
            "<div><span class=\"ritual-item__step\">Step " + (i + 1) + " · " + (verbs[i] || "Finish") + "</span>" +
            "<h4>" + p.name + "</h4><p>" + p.note + "</p></div>" +
            '<span class="ritual-item__price">' + money(p.price) + "</span>";
          list.appendChild(row);
        });
        guardImages(list);
      }
      var total = ids.reduce(function (s, id) { return s + (PRODUCTS[id] ? PRODUCTS[id].price : 0); }, 0);
      var totalEl = result.querySelector("[data-ritual-total]");
      if (totalEl) totalEl.textContent = money(total);

      var addAll = result.querySelector("[data-add-routine]");
      if (addAll) {
        addAll.onclick = function () {
          ids.forEach(function (id) { cart[id] = Math.min((cart[id] | 0) + 1, 9); });
          writeCart(cart);
          renderCart();
          toast("Full routine added to bag");
          openDrawer();
        };
      }
      var tipEl = result.querySelector("[data-ritual-tip]");
      if (tipEl) {
        tipEl.textContent = answers.skin === "sensitive"
          ? "Because your skin stirs easily, introduce one step every four days and patch-test the treatment behind the ear overnight."
          : "Give each step ten seconds to sink in before the next. Damp skin holds the essence better than dry.";
      }
    }

    show(0);
  }

  /* ---------- Forms ---------- */
  function initForms() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-form]"), function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        Array.prototype.forEach.call(form.querySelectorAll("[data-required]"), function (input) {
          var field = input.closest(".field");
          var value = input.value.trim();
          var valid = value.length > 0;
          if (valid && input.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
          if (field) field.classList.toggle("is-error", !valid);
          input.setAttribute("aria-invalid", valid ? "false" : "true");
          if (!valid) {
            ok = false;
            if (!field) input.focus();
            else { var f = field.querySelector(".field__input"); if (f) f.focus(); }
          }
        });
        if (!ok) return;
        var done = form.parentElement.querySelector("[data-form-done]");
        if (done) {
          done.textContent = form.dataset.done || "Thank you — we have your note and will reply within one working day.";
          done.classList.add("is-show");
        }
        form.reset();
      });
      Array.prototype.forEach.call(form.querySelectorAll(".field__input"), function (input) {
        input.addEventListener("input", function () {
          var field = input.closest(".field");
          if (field) field.classList.remove("is-error");
        });
      });
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    guardImages(document);
    initReveals();
    initHeader();
    initCart();
    initShop();
    initQuiz();
    initForms();
    initYear();
  });
})();
