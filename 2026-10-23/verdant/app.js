/* ==========================================================================
   Verdant — shared behaviour
   Cart drawer · sticky header · mobile nav · Decode Text · Parallax Layers ·
   Card Deck fan · page-specific shop filters, routine quiz, forms
   Vanilla JS only. Motion respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Catalog ---------------------------------------------------- */
  var CATALOG = {
    cleanser: {
      name: "Moss & Oat Cleanser",
      price: 26,
      size: "150 ml",
      category: "cleansers",
      image: "https://images.unsplash.com/photo-1612817288484-6f916006746a?auto=format&fit=crop&w=400&q=80"
    },
    serum: {
      name: "Dewpoint Serum",
      price: 48,
      size: "30 ml",
      category: "serums",
      image: "https://images.unsplash.com/photo-1571781926291-c477bbfd11f4?auto=format&fit=crop&w=400&q=80"
    },
    cream: {
      name: "Calica Cream",
      price: 52,
      size: "50 ml",
      category: "moisturisers",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80"
    },
    night: {
      name: "Nightbloom Bakuchiol",
      price: 58,
      size: "30 ml",
      category: "serums",
      image: "https://images.unsplash.com/photo-1585320806297-9794b3e46ae4?auto=format&fit=crop&w=400&q=80"
    },
    mist: {
      name: "Fernwater Mist",
      price: 30,
      size: "100 ml",
      category: "mists",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80"
    },
    eye: {
      name: "Root Cellar Eye Balm",
      price: 38,
      size: "15 ml",
      category: "moisturisers",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80"
    }
  };

  var FREE_SHIPPING = 60;
  var SHIPPING_FEE = 6;
  var STORAGE_KEY = "verdant-cart";

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function loadCart() {
    var stored;
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (err) { stored = []; }
    if (!Array.isArray(stored)) stored = [];
    return stored.filter(function (line) {
      return line && CATALOG[line.id] && line.qty > 0;
    }).map(function (line) {
      return { id: line.id, qty: Math.min(99, Math.round(line.qty)) };
    });
  }

  function saveCart(cart) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (err) { /* private mode */ }
  }

  var cart = loadCart();

  function findLine(id) {
    for (var i = 0; i < cart.length; i += 1) {
      if (cart[i].id === id) return cart[i];
    }
    return null;
  }

  function addToCart(id, qty) {
    if (!CATALOG[id]) return;
    var line = findLine(id);
    if (line) { line.qty = Math.min(99, line.qty + (qty || 1)); }
    else { cart.push({ id: id, qty: qty || 1 }); }
    commit();
    toast(CATALOG[id].name + " added to cart");
    openDrawer();
  }

  function setQty(id, qty) {
    var line = findLine(id);
    if (!line) return;
    if (qty <= 0) { removeLine(id); return; }
    line.qty = Math.min(99, qty);
    commit();
  }

  function removeLine(id) {
    cart = cart.filter(function (line) { return line.id !== id; });
    commit();
  }

  function subtotal() {
    return cart.reduce(function (sum, line) {
      return sum + CATALOG[line.id].price * line.qty;
    }, 0);
  }

  function itemCount() {
    return cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
  }

  function commit() {
    saveCart(cart);
    renderCart();
  }

  /* ---------- Cart drawer ------------------------------------------------ */
  var drawer = document.querySelector("[data-cart-drawer]");
  var backdrop = document.querySelector("[data-cart-backdrop]");
  var bodyEl = document.querySelector("[data-cart-body]");
  var countEl = document.querySelector("[data-cart-count]");
  var subtotalEl = document.querySelector("[data-cart-subtotal]");
  var shippingEl = document.querySelector("[data-cart-shipping]");
  var totalEl = document.querySelector("[data-cart-total]");
  var progressEl = document.querySelector("[data-cart-progress]");
  var noteEl = document.querySelector("[data-cart-note]");
  var lastFocused = null;

  var EMPTY_HTML =
    '<p class="cart-empty">Your cart is empty. Start with the <a href="routine.html">ninety-second routine quiz</a> or <a href="shop.html">browse all six products</a>.</p>';

  function lineMarkup(line) {
    var p = CATALOG[line.id];
    var rowTotal = p.price * line.qty;
    return '' +
      '<div class="cart-item" data-line="' + line.id + '">' +
        '<div class="cart-item-media"><img src="' + p.image + '" alt="' + p.name + '" width="68" height="68" loading="lazy"></div>' +
        '<div>' +
          '<div class="cart-item-top">' +
            '<div><h3>' + p.name + '</h3>' +
            '<p class="cart-item-price">' + money(p.price) + ' · ' + p.size + '</p></div>' +
            '<button class="line-remove" type="button" data-remove="' + line.id + '" aria-label="Remove ' + p.name + ' from cart">' +
              '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
            '<span class="qty">' +
              '<button type="button" data-dec="' + line.id + '" aria-label="Decrease quantity of ' + p.name + '">−</button>' +
              '<output aria-label="Quantity of ' + p.name + '">' + line.qty + '</output>' +
              '<button type="button" data-inc="' + line.id + '" aria-label="Increase quantity of ' + p.name + '">+</button>' +
            '</span>' +
            '<span class="line-total">' + money(rowTotal) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderCart() {
    if (!drawer || !bodyEl) return;

    if (cart.length === 0) {
      bodyEl.innerHTML = EMPTY_HTML;
    } else {
      bodyEl.innerHTML = cart.map(lineMarkup).join("");
    }

    var sub = subtotal();
    var count = itemCount();
    countEl.textContent = String(count);
    subtotalEl.textContent = money(sub);

    if (count === 0) {
      shippingEl.textContent = "Free over $60";
      totalEl.textContent = money(0);
      progressEl.innerHTML = "";
    } else if (sub >= FREE_SHIPPING) {
      shippingEl.textContent = "Free";
      totalEl.textContent = money(sub);
      progressEl.innerHTML = "Free shipping unlocked." + bar(1);
    } else {
      shippingEl.textContent = money(SHIPPING_FEE);
      totalEl.textContent = money(sub + SHIPPING_FEE);
      progressEl.innerHTML = "Add " + money(FREE_SHIPPING - sub) + " more for free shipping." + bar(sub / FREE_SHIPPING);
    }
  }

  function bar(ratio) {
    var pct = Math.max(0, Math.min(1, ratio)) * 100;
    return '<span class="cart-progress-bar"><i style="width:' + pct.toFixed(1) + '%"></i></span>';
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocused = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    backdrop.hidden = false;
    requestAnimationFrame(function () { backdrop.classList.add("is-open"); });
    document.body.classList.add("is-locked");
    var first = drawer.querySelector("[data-cart-close]");
    if (first) first.focus();
  }

  function closeDrawer() {
    if (!drawer || !drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    window.setTimeout(function () { backdrop.hidden = true; }, 320);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (drawer) {
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      var add = t.closest ? t.closest("[data-add]") : null;
      if (add) {
        var id = add.getAttribute("data-add") || add.getAttribute("data-id");
        if (!CATALOG[id]) return;
        addToCart(id, 1);
        add.classList.add("is-added");
        var prev = add.textContent;
        add.textContent = "Added";
        window.setTimeout(function () { add.classList.remove("is-added"); add.textContent = prev; }, 1400);
        return;
      }

      if (t.closest("[data-cart-open]")) { openDrawer(); return; }
      if (t.closest("[data-cart-close]")) { closeDrawer(); return; }
      if (t === backdrop) { closeDrawer(); return; }

      var inc = t.closest ? t.closest("[data-inc]") : null;
      if (inc) { var l1 = findLine(inc.getAttribute("data-inc")); if (l1) setQty(l1.id, l1.qty + 1); return; }
      var dec = t.closest ? t.closest("[data-dec]") : null;
      if (dec) { var l2 = findLine(dec.getAttribute("data-dec")); if (l2) setQty(l2.id, l2.qty - 1); return; }
      var rm = t.closest ? t.closest("[data-remove]") : null;
      if (rm) { removeLine(rm.getAttribute("data-remove")); return; }

      var checkout = t.closest ? t.closest("[data-cart-checkout]") : null;
      if (checkout) {
        if (cart.length === 0) {
          noteEl.textContent = "Add a product to check out.";
        } else {
          noteEl.textContent = "Reserved " + itemCount() + " item" + (itemCount() === 1 ? "" : "s") +
            " · " + money(subtotal()) + ". This preview saves your cart on this device — email hello@verdant.example and we will invoice you.";
        }
        window.setTimeout(function () { noteEl.textContent = ""; }, 6000);
      }
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && drawer.classList.contains("is-open")) { closeDrawer(); return; }
      if (ev.key === "Tab" && drawer.classList.contains("is-open")) {
        var focusables = drawer.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusables.length === 0) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    });
  }

  renderCart();

  /* ---------- Toast ------------------------------------------------------ */
  var toastEl = null;
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("p");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-shown");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.classList.remove("is-shown"); }, 2200);
    if (countEl) {
      countEl.classList.add("is-bumped");
      window.setTimeout(function () { countEl.classList.remove("is-bumped"); }, 260);
    }
  }

  /* ---------- Header + nav ---------------------------------------------- */
  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navList = document.getElementById("nav-list");

  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navList.classList.toggle("is-open", !open);
      document.body.classList.toggle("is-locked", !open);
    });
    navList.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) {
        navToggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
        document.body.classList.remove("is-locked");
      }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") navToggle.click();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 720 && navToggle.getAttribute("aria-expanded") === "true") navToggle.click();
    });
  }

  /* ---------- Signature motion: Decode Text ------------------------------ */
  function runDecode() {
    var el = document.querySelector("[data-decode]");
    if (!el) return;
    var finalText = el.getAttribute("data-final") || el.textContent.trim();
    if (reduceMotion) { el.textContent = finalText; return; }

    var pool = "abcdefghijklmnopqrstuvwxyzæœ·+*—";
    var frames = [];
    var settleStart = [2, 5, 8, 11, 14];
    for (var f = 0; f < 26; f += 1) {
      var out = "";
      for (var c = 0; c < finalText.length; c += 1) {
        if (finalText.charAt(c) === " ") { out += " "; continue; }
        if (f >= settleStart[c]) out += finalText.charAt(c);
        else out += pool.charAt(Math.floor(Math.random() * pool.length));
      }
      frames.push(out);
    }
    frames.push(finalText);

    el.classList.add("is-decoding");
    var i = 0;
    var tick = function () {
      el.textContent = frames[Math.min(i, frames.length - 1)];
      i += 1;
      if (i > frames.length) {
        el.classList.remove("is-decoding");
        el.textContent = finalText;
        return;
      }
      window.setTimeout(function () { requestAnimationFrame(tick); }, 48);
    };
    requestAnimationFrame(tick);
  }
  runDecode();

  /* ---------- Signature motion: Parallax Layers + Card Deck fan ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));
  var deck = document.querySelector("[data-deck]");
  var deckP = 0;
  var deckTarget = 0;
  var ticking = false;

  function deckProgress() {
    if (!deck) return 1;
    var rect = deck.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    // 0 when the deck enters the lower third, 1 once it clears the upper quarter
    var start = vh * 0.92;
    var end = vh * 0.24;
    var p = (start - rect.top) / (start - end);
    return Math.max(0, Math.min(1, p));
  }

  function applyFrame() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    if (!reduceMotion) {
      for (var i = 0; i < layers.length; i += 1) {
        var speed = parseFloat(layers[i].getAttribute("data-speed")) || 0;
        layers[i].style.transform = "translate3d(0," + (y * speed).toFixed(2) + "px,0)";
      }
    }

    if (deck && !reduceMotion) {
      deckTarget = deckProgress();
      deckP += (deckTarget - deckP) * 0.14;
      if (Math.abs(deckTarget - deckP) < 0.002) deckP = deckTarget;
      deck.style.setProperty("--deck-p", deckP.toFixed(3));
    }

    if (header) header.classList.toggle("is-stuck", y > 8);
    ticking = false;
  }

  function requestFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(applyFrame);
  }

  if (header) header.classList.toggle("is-stuck", (window.pageYOffset || 0) > 8);

  if (reduceMotion) {
    if (deck) deck.style.setProperty("--deck-p", "1");
  } else {
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();
  }

  /* ---------- Page: Shop filters --------------------------------------- */
  var shopGrid = document.querySelector("[data-product-grid]");
  if (shopGrid) {
    var cards = Array.prototype.slice.call(shopGrid.querySelectorAll("[data-product]"));
    var group = document.querySelectorAll("[data-filter-group]");
    var countEl2 = document.querySelector("[data-result-count]");
    var emptyMsg = document.querySelector("[data-filter-empty]");
    var sortSelect = document.querySelector("[data-sort]");

    function activeValues(which) {
      var out = [];
      for (var i = 0; i < which.length; i += 1) {
        var checked = which[i].querySelectorAll("input[type='checkbox']:checked");
        var vals = [];
        for (var j = 0; j < checked.length; j += 1) vals.push(checked[j].value);
        if (vals.length) out.push({ key: which[i].getAttribute("data-filter-group"), values: vals });
      }
      return out;
    }

    function applyFilters() {
      var filters = activeValues(group);
      var visible = cards.filter(function (card) {
        return filters.every(function (f) {
          var hay = (card.getAttribute("data-" + f.key) || "").split(/\s+/);
          return f.values.some(function (v) { return hay.indexOf(v) !== -1; });
        });
      });

      cards.forEach(function (card) { card.classList.toggle("is-hidden", visible.indexOf(card) === -1); });

      if (sortSelect && sortSelect.value !== "featured") {
        var sorted = visible.slice().sort(function (a, b) {
          var pa = parseFloat(a.getAttribute("data-price"));
          var pb = parseFloat(b.getAttribute("data-price"));
          return sortSelect.value === "price-low" ? pa - pb : pb - pa;
        });
        sorted.forEach(function (card) { shopGrid.appendChild(card); });
        cards.filter(function (c) { return visible.indexOf(c) === -1; })
          .forEach(function (card) { shopGrid.appendChild(card); });
      }

      if (countEl2) {
        countEl2.textContent = "Showing " + visible.length + " of " + cards.length + " products";
      }
      if (emptyMsg) emptyMsg.hidden = visible.length !== 0;
    }

    Array.prototype.forEach.call(group, function (g) {
      g.addEventListener("change", applyFilters);
    });
    if (sortSelect) sortSelect.addEventListener("change", applyFilters);
    applyFilters();
  }

  /* ---------- Page: Routine quiz --------------------------------------- */
  var quiz = document.querySelector("[data-quiz]");
  if (quiz) {
    var steps = Array.prototype.slice.call(quiz.querySelectorAll("[data-quiz-step]"));
    var result = document.querySelector("[data-quiz-result]");
    var answers = {};
    var current = 0;

    function paint() {
      steps.forEach(function (stepEl, i) {
        stepEl.hidden = i !== current;
        Array.prototype.forEach.call(stepEl.querySelectorAll("[data-quiz-dot]"), function (dot, j) {
          dot.classList.toggle("is-active", j === i && j === current);
          dot.classList.toggle("is-done", j < current);
        });
      });
    }

    function focusStep() {
      var heading = steps[current].querySelector(".quiz-q");
      if (heading) heading.focus();
    }

    quiz.addEventListener("click", function (ev) {
      var opt = ev.target.closest("[data-option]");
      if (opt) {
        var stepEl = opt.closest("[data-quiz-step]");
        var key = stepEl.getAttribute("data-key");
        answers[key] = opt.getAttribute("data-option");
        Array.prototype.forEach.call(stepEl.querySelectorAll("[data-option]"), function (o) {
          o.setAttribute("aria-pressed", o === opt ? "true" : "false");
        });
        var nextBtn = stepEl.querySelector("[data-next]");
        if (nextBtn) nextBtn.disabled = false;
        return;
      }

      var next = ev.target.closest("[data-next]");
      if (next) {
        if (current < steps.length - 1) { current += 1; paint(); focusStep(); }
        else { showResult(); }
        return;
      }
      var back = ev.target.closest("[data-back]");
      if (back && current > 0) { current -= 1; paint(); focusStep(); return; }
      var restart = ev.target.closest("[data-quiz-restart]");
      if (restart) {
        answers = {};
        current = 0;
        Array.prototype.forEach.call(quiz.querySelectorAll("[data-option]"), function (o) {
          o.setAttribute("aria-pressed", "false");
        });
        Array.prototype.forEach.call(quiz.querySelectorAll("[data-next]"), function (b) { b.disabled = true; });
        if (result) result.hidden = true;
        quiz.hidden = false;
        paint();
        var heading = quiz.querySelector("h2");
        if (heading) heading.focus();
      }
    });

    var LABELS = {
      feel: { dry: "Tight and dry by 4pm", oily: "Shine through by noon", reactive: "Red and stinging", steady: "Comfortable, mostly" },
      goal: { calm: "Calm the redness", tone: "Even out the tone", texture: "Smooth the texture", water: "Hold more water" },
      time: { quick: "Two minutes", medium: "Four minutes", full: "Eight minutes" }
    };

    var DAYPART = { cleanser: "Both", mist: "Both", serum: "Morning", cream: "Both", night: "Evening", eye: "Evening" };

    function recommend() {
      var picks = ["cleanser"];
      var feel = answers.feel, goal = answers.goal, time = answers.time;

      if (goal === "tone" || goal === "texture") picks.push("serum");
      if (goal === "calm") picks.push("cream");
      if (goal === "water") picks.push("mist");

      if (feel === "dry") { if (picks.indexOf("cream") === -1) picks.push("cream"); if (picks.indexOf("mist") === -1) picks.push("mist"); }
      if (feel === "reactive" && picks.indexOf("cream") === -1) picks.push("cream");
      if (feel === "oily" && picks.indexOf("serum") === -1) picks.push("serum");
      if (feel === "steady" && picks.indexOf("serum") === -1) picks.push("serum");

      if ((goal === "texture" || goal === "tone") && time !== "quick") picks.push("night");
      if (time === "full") picks.push("eye");

      var cap = time === "quick" ? 2 : time === "medium" ? 3 : 4;
      var seen = {};
      picks = picks.filter(function (id) {
        if (seen[id]) return false;
        seen[id] = true;
        return true;
      }).slice(0, cap);

      return picks.map(function (id) {
        return { id: id, p: CATALOG[id] };
      });
    }

    function showResult() {
      if (!result) return;
      var picks = recommend();
      var total = picks.reduce(function (s, r) { return s + r.p.price; }, 0);
      var rows = picks.map(function (r, i) {
        var when = DAYPART[r.id] || "Morning";
        return '' +
          '<li class="routine-line">' +
            '<img src="' + r.p.image + '" alt="' + r.p.name + '" width="72" height="72" loading="lazy">' +
            '<div><p class="routine-when">' + when + '</p><h4>' + r.p.name + '</h4>' +
            '<p>' + r.p.size + ' · ' + money(r.p.price) + '</p></div>' +
            '<button class="btn btn-line" type="button" data-add="' + r.id + '" data-id="' + r.id + '" data-name="' + r.p.name + '" data-price="' + r.p.price + '">Add</button>' +
          '</li>';
      }).join("");

      var advice = adviceText();
      var profile = '' +
        '<dl class="result-profile">' +
          '<div><dt>Mid-afternoon feel</dt><dd>' + LABELS.feel[answers.feel] + '</dd></div>' +
          '<div><dt>First priority</dt><dd>' + LABELS.goal[answers.goal] + '</dd></div>' +
          '<div><dt>Time you will spend</dt><dd>' + LABELS.time[answers.time] + '</dd></div>' +
        '</dl>';

      result.querySelector("[data-result-routine]").innerHTML = rows;
      result.querySelector("[data-result-profile]").innerHTML = profile;
      result.querySelector("[data-result-total]").textContent = money(total);
      result.querySelector("[data-result-advice]").innerHTML = advice;
      result.querySelector("[data-result-count]").textContent =
        "A " + picks.length + "-step ritual, " + (answers.time === "quick" ? "under two minutes" : answers.time === "medium" ? "about four minutes" : "a full evening pass");
      result.hidden = false;
      quiz.hidden = true;
      result.focus();
      result.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    }

    function adviceText() {
      var tips = [];
      if (answers.feel === "dry") tips.push("Apply Calica Cream to damp skin within sixty seconds of cleansing — the water you leave on does more than any extra layer.");
      if (answers.feel === "oily") tips.push("Skip the toner step entirely. Over-cleansing is the usual cause of the 2pm shine you are trying to fix.");
      if (answers.feel === "reactive") tips.push("Introduce one product at a time, seven days apart, and stop if stinging lasts beyond a minute.");
      if (answers.feel === "steady") tips.push("Your barrier is doing its job — keep the routine short and save the actives for nights you actually need them.");
      if (answers.goal === "calm") tips.push("Centella in Calica Cream works on visible redness over roughly six weeks. Photograph your face in the same light weekly rather than checking the mirror daily.");
      if (answers.goal === "tone") tips.push("Niacamide at 4% and alpha-arbutin at 2% are the doses the pigment studies report. SPF is the other half of the result — wear it every morning.");
      if (answers.goal === "texture") tips.push("Bakuchiol is slower than retinal but kinder: expect smoother-feeling skin around week eight, not week two.");
      if (answers.goal === "water") tips.push("Glycerin and fermented green tea in Fernwater Mist pull water in; the cream has to follow immediately or it evaporates back out.");
      return tips.map(function (t) { return "<li>" + t + "</li>"; }).join("");
    }

    var addAll = document.querySelector("[data-add-routine]");
    if (addAll) {
      addAll.addEventListener("click", function () {
        var ids = recommend().map(function (r) { return r.id; });
        ids.forEach(function (id) {
          var line = findLine(id);
          if (line) line.qty = Math.min(99, line.qty + 1);
          else cart.push({ id: id, qty: 1 });
        });
        commit();
        toast("Your " + ids.length + "-product ritual is in the cart");
        openDrawer();
      });
    }

    paint();
  }

  /* ---------- Page: Forms ----------------------------------------------- */
  var newsletter = document.querySelector("[data-newsletter]");
  if (newsletter) {
    newsletter.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = newsletter.querySelector("input[type='email']");
      var status = newsletter.querySelector("[data-newsletter-status]");
      var value = (input.value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(value)) {
        status.textContent = "Enter a full email address, like you@example.com.";
        input.focus();
        return;
      }
      status.textContent = "Thanks — the next formulation note lands on the first Tuesday.";
      input.value = "";
    });
  }

  var contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    contactForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var feedback = contactForm.querySelector("[data-form-feedback]");
      var ok = true;

      function check(name, test, message) {
        var field = contactForm.querySelector("[data-field='" + name + "']");
        var input = contactForm.elements[name];
        var err = field ? field.querySelector(".error") : null;
        var valid = test((input.value || "").trim());
        if (field) field.classList.toggle("has-error", !valid);
        if (err) err.textContent = valid ? "" : message;
        if (!valid && ok) { input.focus(); }
        ok = ok && valid;
      }

      check("name", function (v) { return v.length >= 2; }, "Tell us who to reply to.");
      check("email", function (v) { return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v); }, "We need a working email address.");
      check("message", function (v) { return v.length >= 15; }, "A sentence or two helps us route your note.");

      if (!ok) {
        feedback.textContent = "Check the highlighted fields and send again.";
        feedback.classList.add("has-error");
        return;
      }
      feedback.classList.remove("has-error");
      var who = contactForm.elements.topic.value;
      feedback.textContent = "Sent. A formulator on the " + who.toLowerCase() + " team answers within one working day.";
      contactForm.reset();
    });
  }
})();
