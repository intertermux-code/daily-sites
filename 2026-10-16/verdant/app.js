/* ==========================================================================
   Verdant — shared behaviour
   Cart drawer · mobile index · filters · routine quiz · forms · motion
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  var FREE_SHIP = 75;
  var SHIP_COST = 6;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function fmt(n) { return money.format(n); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ----------------------------------------------------------------------
     1. Product catalogue (used by the routine quiz results)
     ---------------------------------------------------------------------- */
  var PRODUCTS = {
    p01: { name: "Cleansing Milk", sub: "First Light", price: 28, size: "200 ml", img: "img/p01-cleansing-milk.jpg", notes: "Oat and apricot kernel milk that lifts sunscreen without stripping the barrier." },
    p02: { name: "Clay Reset Cleanser", sub: "Second Cleanse", price: 32, size: "120 ml", img: "img/p02-clay-cleanser.jpg", notes: "White kaolin in a low-foam gel for congested, oil-prone skin." },
    p03: { name: "Green Tea Toner", sub: "Hydrate No. 3", price: 26, size: "150 ml", img: "img/p03-green-tea-toner.jpg", notes: "Cold-brewed matcha at 4% with panthenol. Slip for the steps that follow." },
    p04: { name: "Niacinamide Serum", sub: "Clear Index 5%", price: 42, size: "30 ml", img: "img/p04-niacinamide-serum.jpg", notes: "5% niacinamide with 1% zinc PCA for tone, oil and visible pores." },
    p05: { name: "Barrier Repair Cream", sub: "Ceramide Field", price: 48, size: "50 ml", img: "img/p05-barrier-cream.jpg", notes: "Three ceramides, squalane and 2% glycerin in a weightless emulsion." },
    p06: { name: "Retinal Night Emulsion", sub: "0.04% After Dark", price: 56, size: "30 ml", img: "img/p06-night-emulsion.jpg", notes: "Encapsulated retinaldehyde buffered with bisabolol. Nights only." },
    p07: { name: "Mineral Fluid SPF 30", sub: "Daylight", price: 38, size: "50 ml", img: "img/p07-mineral-spf.jpg", notes: "Non-nano zinc that dries clear on deep tones and disappears under makeup." },
    p08: { name: "Azelaic Corrector", sub: "10% Marks", price: 34, size: "20 ml", img: "img/p08-azelaic-corrector.jpg", notes: "Azelaic acid suspension for post-blemish marks and flushed areas." },
    p09: { name: "Peptide Eye Balm", sub: "Quiet Lids", price: 30, size: "12 ml", img: "img/p09-eye-balm.jpg", notes: "Caffeine 3% with a peptide complex for thin, puffy lid skin." }
  };

  /* ----------------------------------------------------------------------
     2. Cart state
     ---------------------------------------------------------------------- */
  var STORE_KEY = "verdant.cart.v1";

  var cart = {
    items: [],
    load: function () {
      try {
        var raw = window.localStorage.getItem(STORE_KEY);
        var parsed = raw ? JSON.parse(raw) : [];
        this.items = Array.isArray(parsed) ? parsed.filter(function (i) {
          return i && i.id && typeof i.price === "number" && i.qty > 0;
        }) : [];
      } catch (e) {
        this.items = [];
      }
    },
    save: function () {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(this.items));
      } catch (e) { /* storage unavailable — cart stays in memory */ }
    },
    find: function (id) {
      for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].id === id) return this.items[i];
      }
      return null;
    },
    add: function (line, qty) {
      var existing = this.find(line.id);
      if (existing) {
        existing.qty += qty || 1;
      } else {
        this.items.push({
          id: line.id,
          name: line.name,
          sub: line.sub || "",
          price: line.price,
          size: line.size || "",
          img: line.img || "",
          qty: qty || 1
        });
      }
      this.save();
    },
    setQty: function (id, qty) {
      var line = this.find(id);
      if (!line) return;
      if (qty <= 0) { this.remove(id); return; }
      line.qty = Math.min(qty, 30);
      this.save();
    },
    remove: function (id) {
      this.items = this.items.filter(function (l) { return l.id !== id; });
      this.save();
    },
    clear: function () { this.items = []; this.save(); },
    count: function () {
      return this.items.reduce(function (n, l) { return n + l.qty; }, 0);
    },
    subtotal: function () {
      return this.items.reduce(function (n, l) { return n + l.qty * l.price; }, 0);
    },
    shipping: function () {
      var s = this.subtotal();
      if (s === 0) return 0;
      return s >= FREE_SHIP ? 0 : SHIP_COST;
    },
    total: function () { return this.subtotal() + this.shipping(); }
  };

  /* ----------------------------------------------------------------------
     3. Cart drawer (injected once, present on every page)
     ---------------------------------------------------------------------- */
  var drawer = null;
  var backdrop = null;
  var lastFocus = null;

  function buildDrawer() {
    var wrap = doc.createElement("div");
    wrap.innerHTML =
      '<div class="cart-backdrop" data-cart-close hidden></div>' +
      '<aside class="cart" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1" hidden>' +
        '<header class="cart-head">' +
          '<h2 id="cart-title">Your Selection</h2>' +
          '<button class="icon-btn" type="button" data-cart-close aria-label="Close cart panel">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.4"/></svg>' +
          '</button>' +
        '</header>' +
        '<div class="cart-items" id="cart-items"></div>' +
        '<footer class="cart-foot" id="cart-foot"></footer>' +
      '</aside>';
    while (wrap.firstChild) { doc.body.appendChild(wrap.firstChild); }
    drawer = $("#cart");
    backdrop = $(".cart-backdrop");
    drawer.addEventListener("keydown", trapTab);
    backdrop.addEventListener("click", closeCart);
    $$("[data-cart-close]", drawer).forEach(function (b) {
      b.addEventListener("click", closeCart);
    });
  }

  function trapTab(event) {
    if (event.key !== "Tab") return;
    var focusables = $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", drawer)
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  function openCart(trigger) {
    if (!drawer) return;
    lastFocus = trigger || doc.activeElement;
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
    });
    doc.body.classList.add("nav-locked");
    var close = $("[data-cart-close]", drawer);
    if (close) close.focus();
  }

  function closeCart() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    doc.body.classList.remove("nav-locked");
    window.setTimeout(function () {
      drawer.hidden = true;
      backdrop.hidden = true;
    }, reduceMotion.matches ? 0 : 500);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function renderCart() {
    var count = cart.count();
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = count < 10 ? "0" + count : String(count);
    });
    if (!drawer) return;

    var itemsEl = $("#cart-items");
    var footEl = $("#cart-foot");

    if (!cart.items.length) {
      itemsEl.innerHTML =
        '<div class="cart-empty">' +
          '<p class="mono" style="color:var(--sage-deep)">Section 00 — Empty</p>' +
          '<p style="max-width:32ch">Nothing selected yet. The index opens with the three products most people start from.</p>' +
          '<a class="btn btn-ghost" href="shop.html">Read the Index</a>' +
        '</div>';
      footEl.innerHTML =
        '<div class="cart-lines"><div class="cart-line"><span>Subtotal</span><strong>' + fmt(0) + '</strong></div></div>' +
        '<p class="cart-note">Free shipping on orders over ' + fmt(FREE_SHIP) + '.</p>';
      return;
    }

    itemsEl.innerHTML = cart.items.map(function (l) {
      var id = esc(l.id);
      var name = esc(l.name);
      return '<article class="cart-item">' +
        (l.img ? '<img src="' + esc(l.img) + '" alt="' + name + ' bottle" width="886" height="1100" loading="lazy">' : "<div></div>") +
        '<div><h3>' + name + "</h3>" +
          '<p class="ci-meta">' + (l.sub ? esc(l.sub) + " · " : "") + esc(l.size) + "</p></div>" +
        '<div class="ci-right">' +
          '<span class="ci-price">' + fmt(l.price * l.qty) + "</span>" +
          '<div class="qty" role="group" aria-label="Quantity for ' + name + '">' +
            '<button type="button" data-dec="' + id + '" aria-label="Decrease quantity of ' + name + '">−</button>' +
            '<span class="n" aria-live="off">' + l.qty + "</span>" +
            '<button type="button" data-inc="' + id + '" aria-label="Increase quantity of ' + name + '">+</button>' +
          "</div>" +
          '<button type="button" class="ci-remove" data-remove="' + id + '">Remove</button>' +
        "</div></article>";
    }).join("");

    var remaining = Math.max(0, FREE_SHIP - cart.subtotal());
    var pct = Math.min(100, (cart.subtotal() / FREE_SHIP) * 100);

    footEl.innerHTML =
      '<div class="ship-meter" aria-hidden="true"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
      '<p class="cart-note">' + (remaining > 0
        ? "Add " + fmt(remaining) + " more for free shipping."
        : "Free shipping unlocked.") + "</p>" +
      '<div class="cart-lines">' +
        '<div class="cart-line"><span>Subtotal · ' + cart.count() + " pcs</span><strong>" + fmt(cart.subtotal()) + "</strong></div>" +
        '<div class="cart-line"><span>Shipping</span><strong>' + (cart.shipping() === 0 ? "Free" : fmt(cart.shipping())) + "</strong></div>" +
        '<div class="cart-line is-total"><span>Total</span><strong>' + fmt(cart.total()) + "</strong></div>" +
      "</div>" +
      '<button class="btn btn-block" type="button" data-checkout>Checkout — ' + fmt(cart.total()) + "</button>" +
      '<p class="mono" style="color:var(--ink-3);text-align:center;font-size:0.625rem">Duties and taxes included. Carbon-neutral delivery.</p>';
  }

  function bindCartDelegates() {
    doc.addEventListener("click", function (event) {
      var open = event.target.closest("[data-cart-open]");
      if (open) {
        event.preventDefault();
        openCart(open);
        return;
      }
      var add = event.target.closest("[data-add]");
      if (add) {
        event.preventDefault();
        addToCartFromButton(add);
        return;
      }
      var inc = event.target.closest("[data-inc]");
      if (inc) {
        var lineInc = cart.find(inc.getAttribute("data-inc"));
        if (lineInc) { cart.setQty(lineInc.id, lineInc.qty + 1); renderCart(); }
        return;
      }
      var dec = event.target.closest("[data-dec]");
      if (dec) {
        var lineDec = cart.find(dec.getAttribute("data-dec"));
        if (lineDec) { cart.setQty(lineDec.id, lineDec.qty - 1); renderCart(); }
        return;
      }
      var rm = event.target.closest("[data-remove]");
      if (rm) {
        var gone = cart.find(rm.getAttribute("data-remove"));
        cart.remove(rm.getAttribute("data-remove"));
        renderCart();
        if (gone) showToast(gone.name + " removed", "Undo", function () {
          cart.add(gone, gone.qty);
          renderCart();
        });
        return;
      }
      var all = event.target.closest("[data-add-all]");
      if (all) {
        var ids = all.getAttribute("data-add-all").split(",").filter(Boolean);
        var added = 0;
        ids.forEach(function (id) {
          var p = PRODUCTS[id.trim()];
          if (p && !cart.find(id.trim())) {
            cart.add({ id: id.trim(), name: p.name, sub: p.sub, price: p.price, size: p.size, img: p.img }, 1);
            added += 1;
          } else if (p) {
            var ex = cart.find(id.trim());
            ex.qty += 1;
            cart.save();
            added += 1;
          }
        });
        renderCart();
        if (added) {
          showToast(added + " products added", "View", function () { openCart(all); });
          bumpCartButton();
        }
        return;
      }
      var checkout = event.target.closest("[data-checkout]");
      if (checkout) {
        checkout.textContent = "Order placed — thank you";
        window.setTimeout(function () {
          cart.clear();
          renderCart();
          closeCart();
          showToast("Sample order confirmed", "Shop", function () { window.location.href = "shop.html"; });
        }, 1100);
      }
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (drawer && !drawer.hidden) closeCart();
        else closeMobileNav();
      }
    });
  }

  function addToCartFromButton(button) {
    var id = button.getAttribute("data-id");
    var line = {
      id: id,
      name: button.getAttribute("data-name") || (PRODUCTS[id] && PRODUCTS[id].name) || "Product",
      sub: button.getAttribute("data-sub") || (PRODUCTS[id] && PRODUCTS[id].sub) || "",
      price: parseFloat(button.getAttribute("data-price")) || 0,
      size: button.getAttribute("data-size") || (PRODUCTS[id] && PRODUCTS[id].size) || "",
      img: button.getAttribute("data-img") || (PRODUCTS[id] && PRODUCTS[id].img) || ""
    };
    var qty = parseInt(button.getAttribute("data-qty"), 10) || 1;
    cart.add(line, qty);
    renderCart();
    bumpCartButton();
    showToast(line.name + " added", "Open Cart", function () { openCart(button); });

    if (button.classList.contains("p-add")) {
      var label = $(".label", button);
      var original = label ? label.textContent : "";
      if (label) label.textContent = "Added";
      button.classList.add("is-added");
      window.setTimeout(function () {
        button.classList.remove("is-added");
        if (label) label.textContent = original;
      }, 1600);
    }
  }

  function bumpCartButton() {
    var btn = $("[data-cart-open]");
    if (!btn) return;
    btn.classList.remove("is-bumped");
    void btn.offsetWidth;
    btn.classList.add("is-bumped");
  }

  /* ----------------------------------------------------------------------
     4. Toast
     ---------------------------------------------------------------------- */
  var toastEl = null;
  var toastTimer = null;

  function showToast(message, actionLabel, action) {
    if (!toastEl) {
      toastEl = doc.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      doc.body.appendChild(toastEl);
    }
    toastEl.innerHTML = "";
    var text = doc.createElement("span");
    text.textContent = message;
    toastEl.appendChild(text);
    if (actionLabel && action) {
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.textContent = actionLabel;
      btn.addEventListener("click", action);
      toastEl.appendChild(btn);
    }
    requestAnimationFrame(function () { toastEl.classList.add("is-shown"); });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-shown");
    }, 4200);
  }

  /* ----------------------------------------------------------------------
     5. Mobile index nav
     ---------------------------------------------------------------------- */
  var navToggle = null;
  var navPanel = null;

  function closeMobileNav() {
    if (!navPanel || !navPanel.classList.contains("is-open")) return;
    navPanel.classList.remove("is-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    doc.body.classList.remove("nav-locked");
  }

  function initMobileNav() {
    navToggle = $("[data-nav-toggle]");
    navPanel = $("[data-nav-panel]");
    if (!navToggle || !navPanel) return;

    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMobileNav();
      } else {
        navPanel.classList.add("is-open");
        navToggle.setAttribute("aria-expanded", "true");
        doc.body.classList.add("nav-locked");
        var first = $("a", navPanel);
        if (first) first.focus();
      }
    });

    $$("a", navPanel).forEach(function (link) {
      link.addEventListener("click", closeMobileNav);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) closeMobileNav();
    });
  }

  /* ----------------------------------------------------------------------
     6. Shop filters
     ---------------------------------------------------------------------- */
  function initFilters() {
    var bar = $("[data-filter-bar]");
    if (!bar) return;
    var buttons = $$("[data-filter]", bar);
    var cards = $$("[data-cat]");
    var counter = $("[data-filter-count]");
    var emptyNote = $("[data-filter-empty]");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var want = button.getAttribute("data-filter");
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", b === button ? "true" : "false");
        });
        var shown = 0;
        cards.forEach(function (card) {
          var match = want === "all" || card.getAttribute("data-cat") === want;
          card.hidden = !match;
          if (match) shown += 1;
        });
        if (counter) counter.textContent = shown + (shown === 1 ? " product" : " products");
        if (emptyNote) emptyNote.hidden = shown !== 0;
      });
    });
  }

  /* ----------------------------------------------------------------------
     7. Routine quiz
     ---------------------------------------------------------------------- */
  function productCardHTML(id, index) {
    var p = PRODUCTS[id];
    if (!p) return "";
    return '<article class="p-card reveal" style="--i:' + (index || 0) + '">' +
      '<div class="p-media"><img src="' + p.img + '" alt="' + p.name + " — " + p.sub + ' container on paper" width="886" height="1100" loading="lazy">' +
      '<span class="p-index">' + id.toUpperCase() + "</span></div>" +
      '<div class="p-body"><div class="p-meta"><span>' + p.size + "</span><span>Treat</span></div>" +
      '<h3 class="p-name">' + p.name + "</h3>" +
      '<p class="p-notes">' + p.notes + "</p>" +
      '<div class="p-foot"><span class="p-price">' + fmt(p.price) + "</span>" +
      '<button class="p-add" type="button" data-add data-id="' + id + '" data-name="' + p.name + '" data-sub="' + p.sub + '" data-price="' + p.price + '" data-size="' + p.size + '" data-img="' + p.img + '">' +
      '<span class="plus" aria-hidden="true">+</span> <span class="label">Add</span></button></div></div></article>';
  }

  function initQuiz() {
    var quiz = $("[data-quiz]");
    if (!quiz) return;

    var steps = $$("[data-step]", quiz);
    var pips = $$("[data-pip]", quiz);
    var prevBtn = $("[data-quiz-prev]", quiz);
    var nextBtn = $("[data-quiz-next]", quiz);
    var restartBtn = $("[data-quiz-restart]", quiz);
    var errorEl = $("[data-quiz-error]", quiz);
    var liveEl = $("[data-quiz-live]", quiz);
    var resultsEl = $("[data-quiz-results]", quiz);
    var summaryEl = $("[data-quiz-summary]", quiz);
    var addAllBtn = $("[data-quiz-add-all]", quiz);
    var current = 0;
    var answers = {};

    function show(index) {
      current = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach(function (step, i) {
        step.hidden = i !== current;
      });
      pips.forEach(function (pip, i) {
        pip.classList.toggle("is-done", i < current);
        pip.classList.toggle("is-current", i === current);
      });
      var done = current === steps.length - 1;
      if (prevBtn) prevBtn.hidden = current === 0;
      if (nextBtn) nextBtn.hidden = done;
      if (restartBtn) restartBtn.hidden = !done;
      if (errorEl) errorEl.textContent = "";
      var heading = $("h3", steps[current]);
      if (liveEl && heading) liveEl.textContent = "Step " + (current + 1) + " of " + steps.length + ": " + heading.textContent;
    }

    $$('input[type="radio"]', quiz).forEach(function (input) {
      input.addEventListener("change", function () {
        var name = input.name;
        answers[name] = input.value;
        $$('input[name="' + name + '"]', quiz).forEach(function (sibling) {
          var tile = sibling.closest(".opt");
          if (tile) tile.classList.toggle("is-picked", sibling.checked);
        });
        if (errorEl) errorEl.textContent = "";
      });
    });

    function validateStep() {
      var step = steps[current];
      var groups = {};
      $$('input[type="radio"]', step).forEach(function (i) { groups[i.name] = true; });
      var missing = Object.keys(groups).filter(function (name) { return !answers[name]; });
      if (missing.length) {
        if (errorEl) errorEl.textContent = "Choose one option to continue.";
        var firstInput = $('input[name="' + missing[0] + '"]', step);
        if (firstInput) firstInput.focus();
        return false;
      }
      return true;
    }

    function buildResult() {
      var cleanse = answers.skin === "dry" || answers.skin === "sensitive" ? "p01" : "p02";
      var treat = { barrier: "p05", tone: "p08", texture: "p06", calm: "p03" }[answers.goal] || "p04";
      var third = { full: "p07", night: "p09", minimal: "p04", gap: "p07" }[answers.commitment] || "p04";

      var picks = [cleanse, treat];
      if (third !== cleanse && third !== treat) picks.push(third);
      else picks.push(treat === "p04" ? "p03" : "p04");
      if (picks.indexOf("p05") === -1 && picks.length < 3) picks.push("p05");
      picks = picks.slice(0, 3);

      var goalCopy = {
        barrier: "Your barrier wants less friction and more lipids, so the emulsion leads and actives stay quiet for four weeks.",
        tone: "Marks and uneven tone respond to azelaic acid used daily, with niacinamide as the slow, steady support.",
        texture: "Fine lines and rough texture need retinaldehyde, introduced twice weekly and built up over two months.",
        calm: "Redness settles when you remove fragrance and add panthenol, so this routine is short and cooling."
      }[answers.goal] || "A balanced three-step routine to build from.";

      var typeCopy = {
        dry: "Dry skin: keep the milk cleanser and never let your face fully dry between steps.",
        sensitive: "Sensitive skin: patch-test one product at a time for six days before adding the next.",
        oily: "Oily skin: the clay cleanser works best as a 60-second massage, not a quick rinse.",
        congested: "Congested skin: hold the retinaldehyde at twice weekly until flaking stops."
      }[answers.skin] || "";

      var timeCopy = {
        full: "You asked for morning and evening, so the mineral fluid closes the day routine and protects the actives.",
        night: "Evenings only: the balm sits last, and sunscreen stays non-negotiable each morning regardless.",
        minimal: "Three steps, five minutes: this set is deliberately short so you actually keep it going.",
        gap: "You already have the habit, so this picks the step most routines get wrong — the one that seals."
      }[answers.commitment] || "";

      if (summaryEl) {
        summaryEl.innerHTML =
          '<p class="mono" style="color:var(--sage-deep)">Section 04 — Your Selection</p>' +
          "<h3>“Less, but the right less.”</h3>" +
          "<p>" + goalCopy + "</p>" +
          "<p>" + typeCopy + " " + timeCopy + "</p>";
      }
      if (resultsEl) {
        resultsEl.innerHTML = picks.map(productCardHTML).join("");
        observeNew(resultsEl);
      }
      if (addAllBtn) addAllBtn.setAttribute("data-add-all", picks.join(","));
      var total = picks.reduce(function (n, id) { return n + PRODUCTS[id].price; }, 0);
      var totalEl = $("[data-quiz-total]", quiz);
      if (totalEl) totalEl.textContent = fmt(total);
      if (liveEl) liveEl.textContent = "Routine ready: " + picks.length + " products, total " + fmt(total) + ".";
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (!validateStep()) return;
        if (current === steps.length - 1) return;
        if (current === steps.length - 2) buildResult();
        show(current + 1);
        var focusTarget = $("h3", steps[current]);
        if (focusTarget) {
          focusTarget.setAttribute("tabindex", "-1");
          focusTarget.focus();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        show(current - 1);
        if (resultsEl) resultsEl.innerHTML = "";
        if (summaryEl) summaryEl.innerHTML = "";
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        answers = {};
        $$('input[type="radio"]', quiz).forEach(function (i) {
          i.checked = false;
          var tile = i.closest(".opt");
          if (tile) tile.classList.remove("is-picked");
        });
        if (resultsEl) resultsEl.innerHTML = "";
        if (summaryEl) summaryEl.innerHTML = "";
        show(0);
        var firstInput = $('input[type="radio"]', quiz);
        if (firstInput) firstInput.focus();
      });
    }

    show(0);
  }

  /* ----------------------------------------------------------------------
     8. Forms
     ---------------------------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function setError(field, message) {
    var input = $("input, select, textarea", field);
    var box = $(".error", field);
    if (box) box.textContent = message || "";
    field.classList.toggle("is-invalid", Boolean(message));
    if (input) {
      if (message) {
        input.setAttribute("aria-invalid", "true");
        if (box && box.id) input.setAttribute("aria-describedby", box.id);
      } else {
        input.removeAttribute("aria-invalid");
      }
    }
  }

  function validateField(field) {
    var input = $("input, select, textarea", field);
    if (!input) return true;
    var value = input.value.trim();
    var label = $("label", field);
    var name = label ? label.textContent.replace(/\s*\*$/, "").trim() : "This field";

    if (input.hasAttribute("required") && !value) {
      setError(field, name + " is required");
      return false;
    }
    if (input.type === "email" && value && !EMAIL_RE.test(value)) {
      setError(field, "Enter a valid email address");
      return false;
    }
    if (input.minLength && value && value.length < input.minLength) {
      setError(field, "Use at least " + input.minLength + " characters");
      return false;
    }
    if (input.tagName === "SELECT" && input.hasAttribute("required") && !value) {
      setError(field, "Choose a topic");
      return false;
    }
    setError(field, "");
    return true;
  }

  function initForm(form) {
    if (!form || form.dataset.bound === "1") return;
    form.dataset.bound = "1";
    var status = $("[data-form-status]", form);

    $$(".field", form).forEach(function (field) {
      var input = $("input, select, textarea", field);
      if (!input) return;
      input.addEventListener("blur", function () {
        if (input.value.trim() || input.hasAttribute("required")) validateField(field);
      });
      input.addEventListener("input", function () {
        if (field.classList.contains("is-invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var fields = $$(".field", form);
      var valid = true;
      var firstBad = null;
      fields.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstBad) firstBad = field;
        valid = valid && ok;
      });

      if (!valid) {
        if (status) {
          status.hidden = false;
          status.innerHTML = '<p class="mono" style="color:var(--clay)">Not sent — check the highlighted fields.</p>';
        }
        var bad = firstBad && $("input, select, textarea", firstBad);
        if (bad) bad.focus();
        return;
      }

      var nameField = $('[data-field="name"] input', form);
      var greeting = nameField ? nameField.value.trim().split(" ")[0].slice(0, 40) : "";
      if (status) {
        while (status.firstChild) status.removeChild(status.firstChild);

        var stamp = doc.createElement("p");
        stamp.className = "mono";
        stamp.style.color = "var(--sage-deep)";
        stamp.textContent = "Received — " + new Date()
          .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          .toUpperCase();
        status.appendChild(stamp);

        var heading = doc.createElement("h3");
        heading.textContent = greeting ? "Thank you, " + greeting + "." : "Thank you.";
        status.appendChild(heading);

        var body = doc.createElement("p");
        body.textContent = "A formulation advisor replies within one working day, Monday to Friday. If your question is urgent, call the studio on +45 32 14 09 88.";
        status.appendChild(body);

        status.hidden = false;
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      form.reset();
      $$(".field", form).forEach(function (field) { setError(field, ""); });
    });
  }

  function initForms() {
    $$("form[data-validate]").forEach(initForm);

    $$("form[data-newsletter]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = $("input[type=email]", form);
        var status = $("[data-newsletter-status]", form);
        if (!input || !status) return;
        if (!EMAIL_RE.test(input.value.trim())) {
          status.style.color = "var(--clay)";
          status.textContent = "Enter a valid email address";
          input.focus();
          return;
        }
        status.style.color = "var(--sage-deep)";
        status.textContent = "Subscribed — first note arrives on the 1st";
        form.reset();
      });
    });
  }

  /* ----------------------------------------------------------------------
     9. Motion: Blur-Fade Ascend + Parallax Layers
     ---------------------------------------------------------------------- */
  function assignStagger(el) {
    if (el.style.getPropertyValue("--i")) return;
    var siblings = $$(":scope > .reveal", el.parentElement || doc);
    var idx = siblings.indexOf(el);
    el.style.setProperty("--i", String(idx > -1 ? Math.min(idx, 6) : 0));
  }

  var revealObserver = null;

  function observeNew(scope) {
    if (!revealObserver) return;
    $$(".reveal", scope).concat(scope.classList && scope.classList.contains("reveal") ? [scope] : [])
      .forEach(function (el) {
        if (el.dataset.revealed === "1") return;
        assignStagger(el);
        revealObserver.observe(el);
      });
  }

  function initReveals() {
    var targets = $$(".reveal");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
          entry.target.dataset.revealed = "1";
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    targets.forEach(function (el) {
      assignStagger(el);
      revealObserver.observe(el);
    });
  }

  function initParallax() {
    var layers = $$("[data-speed]");
    if (!layers.length) return;
    if (reduceMotion.matches) return;

    var cached = layers.map(function (el) {
      return { el: el, speed: parseFloat(el.getAttribute("data-speed")) || 0, top: 0, height: 0 };
    });

    function measure() {
      var scroll = window.pageYOffset;
      cached.forEach(function (item) {
        var rect = item.el.getBoundingClientRect();
        item.top = rect.top + scroll;
        item.height = rect.height;
      });
    }

    var ticking = false;

    function apply() {
      ticking = false;
      var scroll = window.pageYOffset;
      var vh = window.innerHeight;
      cached.forEach(function (item) {
        if (item.top > scroll + vh || item.top + item.height < scroll - vh) return;
        var progress = scroll + vh / 2 - (item.top + item.height / 2);
        var y = Math.max(-160, Math.min(160, progress * item.speed));
        item.el.style.transform = "translate3d(0," + y.toFixed(2) + "px,0)";
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
    }

    measure();
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { measure(); apply(); }, { passive: true });
    window.addEventListener("load", function () { measure(); apply(); });
  }

  /* ----------------------------------------------------------------------
     10. Header state + misc
     ---------------------------------------------------------------------- */
  function initHeader() {
    var head = $(".site-head");
    if (!head) return;
    var ticking = false;
    function update() {
      ticking = false;
      head.classList.toggle("is-stuck", window.pageYOffset > 8);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function initProductLinks() {
    // Product names link to the shop index with the card focused.
    $$("[data-focus-product]").forEach(function (link) {
      link.addEventListener("click", function () {
        var id = link.getAttribute("data-focus-product");
        window.setTimeout(function () {
          var card = doc.getElementById(id);
          if (card) {
            card.setAttribute("tabindex", "-1");
            card.focus({ preventScroll: false });
          }
        }, 120);
      });
    });
  }

  /* ----------------------------------------------------------------------
     11. Spring Accordion — grid-template-rows 0fr -> 1fr, one open at a time
     ---------------------------------------------------------------------- */
  function initAccordion() {
    $$(".faq").forEach(function (group) {
      var items = $$(".faq-item", group);
      if (!items.length) return;

      function apply(item, open) {
        var trigger = $(".faq-trigger", item);
        var clip = $(".faq-clip", item);
        if (!trigger) return;
        item.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        if (clip) clip.inert = !open;
      }

      items.forEach(function (item) { apply(item, item.classList.contains("is-open")); });

      var triggers = items.map(function (item) { return $(".faq-trigger", item); });

      function toggle(item) {
        var open = item.classList.contains("is-open");
        items.forEach(function (other) { apply(other, other === item && !open); });
      }

      items.forEach(function (item) {
        var trigger = $(".faq-trigger", item);
        if (!trigger) return;
        trigger.addEventListener("click", function () { toggle(item); });
        trigger.addEventListener("keydown", function (event) {
          var key = event.key;
          var idx = triggers.indexOf(trigger);
          var next = -1;
          if (key === "ArrowDown") next = (idx + 1) % triggers.length;
          else if (key === "ArrowUp") next = (idx - 1 + triggers.length) % triggers.length;
          else if (key === "Home") next = 0;
          else if (key === "End") next = triggers.length - 1;
          if (next < 0) return;
          event.preventDefault();
          triggers[next].focus();
        });
      });

      // Open the panel that matches #faq1-p … style deep links, and keep it in view.
      if (window.location.hash) {
        var target = doc.getElementById(window.location.hash.slice(1));
        var deep = target && target.closest ? target.closest(".faq-item") : null;
        if (deep) toggle(deep);
      }
    });
  }

  /* ----------------------------------------------------------------------
     12. Animated Counters — easeOutExpo over 1.2 s, locale formatted
     ---------------------------------------------------------------------- */
  var numFmt = new Intl.NumberFormat("en-US");

  function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function paintCount(el, value) {
    var suffix = el.getAttribute("data-suffix") || "";
    el.textContent = numFmt.format(Math.round(value)) + suffix;
  }

  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length) return;

    els.forEach(function (el) {
      if (!isFinite(parseFloat(el.getAttribute("data-count")))) el.removeAttribute("data-count");
    });
    els = $$("[data-count]");
    if (!els.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { paintCount(el, parseFloat(el.getAttribute("data-count"))); });
      return;
    }

    var DURATION = 1200;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var goal = parseFloat(el.getAttribute("data-count"));
        var start = null;
        function frame(now) {
          if (start === null) start = now;
          var progress = Math.min((now - start) / DURATION, 1);
          paintCount(el, goal * easeOutExpo(progress));
          if (progress < 1) window.requestAnimationFrame(frame);
        }
        window.requestAnimationFrame(frame);
      });
    }, { threshold: 0.35 });

    els.forEach(function (el) {
      paintCount(el, 0);
      io.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  function init() {
    cart.load();
    buildDrawer();
    renderCart();
    bindCartDelegates();
    initMobileNav();
    initFilters();
    initQuiz();
    initForms();
    initAccordion();
    initCounters();
    initReveals();
    initParallax();
    initHeader();
    initYear();
    initProductLinks();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
