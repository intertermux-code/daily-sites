/* ==========================================================================
   VERDANT — shared behaviour for every page.
   01 motion  02 cart  03 nav  04 shop  05 routine quiz  06 forms  07 faq
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = function (n) { return "$" + n.toFixed(2); };

  /* ---------- 01. Scroll progress + Blur-Fade Ascend ---------- */
  var bar = document.querySelector(".progress__bar");
  if (bar) {
    var frame = 0;
    var paint = function () {
      frame = 0;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    };
    var onScroll = function () {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    paint();
  }

  var revealables = [].slice.call(document.querySelectorAll(".rv"));
  if (revealables.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("in"); });
    } else {
      revealables.forEach(function (el) {
        var host = el.parentElement;
        if (!host.dataset.rvInit) {
          host.dataset.rvInit = "1";
          host._rvIndex = 0;
        }
        var sibs = [].slice.call(host.children).filter(function (c) {
          return c.classList && c.classList.contains("rv");
        });
        var i = sibs.indexOf(el);
        el.style.setProperty("--d", (i > 0 ? i * 80 : 0) + "ms");
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- 02. Cart (JS only, localStorage) ---------- */
  var KEY = "verdant.cart.v1";
  var FREE_FROM = 75;
  var SHIP = 6;

  var read = function () {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (err) { return []; }
  };
  var write = function (items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (err) { /* private mode */ }
  };

  var cart = read();
  var drawer = document.getElementById("cart-drawer");
  var scrim = document.getElementById("cart-scrim");
  var body = document.getElementById("cart-body");
  var lastFocus = null;

  var announceEl = document.getElementById("cart-live");
  var say = function (msg) {
    if (!announceEl) return;
    announceEl.textContent = "";
    window.setTimeout(function () { announceEl.textContent = msg; }, 60);
  };

  var subtotal = function () {
    return cart.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
  };
  var count = function () {
    return cart.reduce(function (sum, it) { return sum + it.qty; }, 0);
  };

  function render() {
    var sub = subtotal();
    var ship = sub === 0 || sub >= FREE_FROM ? 0 : SHIP;

    var badge = document.getElementById("cart-count");
    if (badge) badge.textContent = String(count());

    if (body) {
      if (!cart.length) {
        body.innerHTML =
          '<div class="cart-empty"><h3>Your basket is empty</h3>' +
          "<p>Ten formulas, one shelf. Start with the Dew Point Serum — " +
          "it is the step every routine at Verdant begins with.</p>" +
          '<p><a class="link-arrow" href="shop.html">Browse the full index</a></p></div>';
      } else {
        body.innerHTML = cart.map(function (it) {
          return (
            '<div class="ci" data-cart-line="' + it.id + '">' +
            '<div class="ci__media"><img src="' + it.img + '" alt="' + it.name + '" width="66" height="83" loading="lazy"></div>' +
            "<div>" +
            '<p class="ci__name">' + it.name + "</p>" +
            '<p class="ci__meta">' + it.size + " &middot; " + money(it.price) + " each</p>" +
            '<div class="ci__row">' +
            '<div class="qty">' +
            '<button type="button" data-dec="' + it.id + '" aria-label="Decrease quantity of ' + it.name + '">&minus;</button>' +
            "<span aria-live=\"off\">" + it.qty + "</span>" +
            '<button type="button" data-inc="' + it.id + '" aria-label="Increase quantity of ' + it.name + '">+</button>' +
            "</div>" +
            '<span class="ci__total">' + money(it.price * it.qty) + "</span>" +
            '<button type="button" class="ci__rm" data-rm="' + it.id + '">Remove</button>' +
            "</div></div></div>"
          );
        }).join("");
      }
    }

    var set = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set("cart-subtotal", money(sub));
    set("cart-shipping", ship === 0 ? "Free" : money(ship));
    set("cart-total", money(sub + ship));

    var note = document.getElementById("cart-note");
    if (note) {
      note.textContent = sub === 0
        ? "Free shipping over $75.00"
        : sub >= FREE_FROM
          ? "Free shipping unlocked"
          : money(FREE_FROM - sub) + " away from free shipping";
    }

    var checkout = document.getElementById("cart-checkout");
    if (checkout) checkout.disabled = cart.length === 0;
    write(cart);
  }

  function addItem(data, btn) {
    var found = null;
    cart.forEach(function (it) { if (it.id === data.id) found = it; });
    if (found) found.qty += 1;
    else cart.push({ id: data.id, name: data.name, price: data.price, img: data.img, size: data.size, qty: 1 });
    render();
    say(data.name + " added to your basket. " + count() + " item" + (count() === 1 ? "" : "s") + " total.");
    if (btn) {
      var label = btn.querySelector(".add-btn__t");
      if (label) {
        var old = label.textContent;
        btn.classList.add("is-added");
        label.textContent = "Added";
        window.setTimeout(function () { btn.classList.remove("is-added"); label.textContent = old; }, 1400);
      }
    }
  }

  document.addEventListener("click", function (ev) {
    var add = ev.target.closest ? ev.target.closest("[data-add]") : null;
    if (add) {
      ev.preventDefault();
      addItem({
        id: add.getAttribute("data-add"),
        name: add.getAttribute("data-name"),
        price: parseFloat(add.getAttribute("data-price")),
        img: add.getAttribute("data-img"),
        size: add.getAttribute("data-size") || "30 ml"
      }, add);
      return;
    }

    var inc = ev.target.closest ? ev.target.closest("[data-inc]") : null;
    if (inc) {
      cart.forEach(function (it) { if (it.id === inc.getAttribute("data-inc")) it.qty += 1; });
      render();
      return;
    }
    var dec = ev.target.closest ? ev.target.closest("[data-dec]") : null;
    if (dec) {
      var id = dec.getAttribute("data-dec");
      cart.forEach(function (it) { if (it.id === id) it.qty -= 1; });
      cart = cart.filter(function (it) { return it.qty > 0; });
      render();
      return;
    }
    var rm = ev.target.closest ? ev.target.closest("[data-rm]") : null;
    if (rm) {
      var rid = rm.getAttribute("data-rm");
      var gone = null;
      cart.forEach(function (it) { if (it.id === rid) gone = it.name; });
      cart = cart.filter(function (it) { return it.id !== rid; });
      render();
      say((gone || "Item") + " removed from your basket.");
      return;
    }

    var open = ev.target.closest ? ev.target.closest("[data-open-cart]") : null;
    if (open) { openCart(); return; }
    if (drawer && !drawer.contains(ev.target) && !open) {
      if (scrim && scrim.contains(ev.target)) closeCart();
    }
  });

  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) scrim.classList.add("is-open");
    document.body.classList.add("is-locked");
    var f = drawer.querySelector(".drawer__close");
    if (f) f.focus();
  }
  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) scrim.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      if (drawer && drawer.classList.contains("is-open")) closeCart();
      closeMobileNav();
    }
    if (ev.key === "Tab" && drawer && drawer.classList.contains("is-open")) {
      var f = [].slice.call(drawer.querySelectorAll("button:not([disabled]), a[href], input, select, textarea"))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  });
  [].forEach.call(document.querySelectorAll("[data-close-cart]"), function (b) {
    b.addEventListener("click", closeCart);
  });
  var checkoutBtn = document.getElementById("cart-checkout");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      say("Checkout is a demonstration in this build. Your basket holds " + count() + " item" + (count() === 1 ? "" : "s") + ".");
    });
  }
  render();

  /* ---------- 03. Mobile nav ---------- */
  var burger = document.getElementById("burger");
  var mnav = document.getElementById("mobile-nav");
  function closeMobileNav() {
    if (!mnav || !burger) return;
    mnav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", open ? "false" : "true");
      mnav.classList.toggle("is-open", !open);
    });
  }

  /* ---------- 04. Shop: filter + sort ---------- */
  var grid = document.getElementById("product-grid");
  if (grid) {
    var cards = [].slice.call(grid.querySelectorAll(".p-card"));
    var chips = [].slice.call(document.querySelectorAll("[data-filter]"));
    var sortSel = document.getElementById("product-sort");
    var outEl = document.getElementById("result-count");
    var state = { cat: "all", sort: "featured" };

    var apply = function () {
      var shown = 0;
      cards.forEach(function (c) {
        var cats = (c.getAttribute("data-cat") || "").split(" ");
        var ok = state.cat === "all" || cats.indexOf(state.cat) > -1;
        c.classList.toggle("is-hidden", !ok);
        if (ok) shown += 1;
      });
      if (outEl) outEl.textContent = shown + " formula" + (shown === 1 ? "" : "s");
      if (state.sort !== "featured") {
        var sorted = cards.slice().sort(function (a, b) {
          var pa = parseFloat(a.getAttribute("data-price"));
          var pb = parseFloat(b.getAttribute("data-price"));
          return state.sort === "low" ? pa - pb : pb - pa;
        });
        sorted.forEach(function (c) { grid.appendChild(c); });
      } else {
        cards.forEach(function (c) { grid.appendChild(c); });
      }
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.cat = chip.getAttribute("data-filter");
        chips.forEach(function (o) { o.setAttribute("aria-pressed", o === chip ? "true" : "false"); });
        apply();
      });
    });
    if (sortSel) {
      sortSel.addEventListener("change", function () {
        state.sort = sortSel.value;
        apply();
      });
    }
    apply();
  }

  /* ---------- 05. Routine quiz ---------- */
  var quiz = document.getElementById("quiz");
  if (quiz) {
    var PRODUCTS = {
      "quiet-water": { name: "Quiet Water Cleanser", price: 34, size: "150 ml", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1600&q=80", why: "A pH 5.4 gel that lifts the day off without that tight, stripped feeling." },
      "bark-leaf": { name: "Bark & Leaf Tonic", price: 42, size: "100 ml", img: "https://images.unsplash.com/photo-1501004318641-b39e64c29183?auto=format&fit=crop&w=1600&q=80", why: "Willow bark and green tea re-water the surface between cleanser and serum." },
      "dew-point": { name: "Dew Point Serum", price: 52, size: "30 ml", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1600&q=80", why: "Three-weight hyaluronic complex plus centella — the hydration engine of any routine." },
      "meadow-cream": { name: "Meadow Cream", price: 58, size: "50 ml", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403328?auto=format&fit=crop&w=1600&q=80", why: "Oat lipids and squalane seal everything underneath in for twelve hours." },
      "mineral-veil": { name: "Mineral Veil SPF 30", price: 46, size: "40 ml", img: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1600&q=80", why: "Non-nano zinc with a matte finish; the only step that protects what the others build." },
      "night-press": { name: "Night Press Oil", price: 64, size: "30 ml", img: "https://images.unsplash.com/photo-1571781926291-c477ebfd6d6b?auto=format&fit=crop&w=1600&q=80", why: "Rosehip, sea buckthorn and 0.4% bakuchiol — a slow, overnight retinol alternative." },
      "root-balm": { name: "Root Balm", price: 44, size: "30 ml", img: "https://images.unsplash.com/photo-1441974231531-c6227db89f7b?auto=format&fit=crop&w=1600&q=80", why: "A dense ceramide repair for flaking patches and a compromised barrier." },
      "clay-reset": { name: "Clay Reset Mask", price: 38, size: "60 g", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80", why: "French green clay used once weekly to clear congestion without over-drying." },
      "slow-morning": { name: "Slow Morning Mist", price: 30, size: "75 ml", img: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1600&q=80", why: "A ferment mist that revives dry makeup and feeds the skin microbiome at 3pm." }
    };

    var steps = [].slice.call(quiz.querySelectorAll(".quiz__panel"));
    var stepMarks = [].slice.call(quiz.querySelectorAll(".quiz__step"));
    var answers = { skin: null, goal: null, time: null };
    var current = 0;
    var result = document.getElementById("quiz-result");

    var show = function (i) {
      current = i;
      steps.forEach(function (s, idx) { s.hidden = idx !== i; });
      stepMarks.forEach(function (m, idx) {
        m.setAttribute("data-state", idx === i ? "active" : idx < i ? "done" : "todo");
      });
      var panel = steps[i];
      var status = panel.querySelector("[data-status]");
      if (status) status.textContent = "Question " + (i + 1) + " of 3";
      var prev = panel.querySelector("[data-prev]");
      var next = panel.querySelector("[data-next]");
      if (prev) prev.disabled = i === 0;
      if (next) {
        next.disabled = !answers[panel.getAttribute("data-step")];
        var t = next.querySelector(".add-btn__t");
        if (t) t.textContent = i === 2 ? "See my routine" : "Next question";
      }
    };

    quiz.addEventListener("click", function (ev) {
      var opt = ev.target.closest ? ev.target.closest("[data-opt]") : null;
      if (opt) {
        var key = opt.parentNode.getAttribute("data-step");
        answers[key] = opt.getAttribute("data-opt");
        [].forEach.call(opt.parentNode.querySelectorAll("[data-opt]"), function (o) {
          o.setAttribute("aria-pressed", o === opt ? "true" : "false");
        });
        var next = steps[current].querySelector("[data-next]");
        if (next) next.disabled = false;
        var label = document.getElementById("answer-" + key);
        if (label) label.textContent = opt.getAttribute("data-label");
        return;
      }
      if (ev.target.closest && ev.target.closest("[data-prev]")) { if (current > 0) show(current - 1); return; }
      if (ev.target.closest && ev.target.closest("[data-next]")) {
        if (current < 2) show(current + 1);
        else finish();
      }
    });

    function pick() {
      var a = answers;
      if (a.time === "new") return ["quiet-water", "dew-point", "meadow-cream", "mineral-veil"];
      var list = ["quiet-water", "dew-point"];
      if (a.skin === "dry") list.push(a.goal === "glow" ? "night-press" : "root-balm");
      else if (a.skin === "oily") list.push("bark-leaf");
      else if (a.skin === "sensitive") list.push("root-balm");
      else list.push("meadow-cream");

      if (a.goal === "calm") list.push("root-balm");
      if (a.goal === "glow" && list.indexOf("night-press") === -1) list.push("night-press");
      if (a.goal === "barrier" && list.indexOf("meadow-cream") === -1) list.push("meadow-cream");
      if (a.time === "full") list.push("clay-reset");
      if (a.time === "full" || a.goal === "hydration") list.push("slow-morning");
      if (a.time !== "minimal") list.push("mineral-veil");
      if (a.time === "minimal") list = ["quiet-water", "dew-point", "meadow-cream"];

      var seen = [];
      return list.filter(function (id) {
        if (seen.indexOf(id) > -1) return false;
        seen.push(id);
        return true;
      });
    }

    function finish() {
      var ids = pick();
      var items = ids.map(function (id, i) {
        var p = PRODUCTS[id];
        return (
          '<div class="pick" data-pick="' + id + '">' +
          '<div class="pick__media"><img src="' + p.img + '" alt="' + p.name + '" width="84" height="105" loading="lazy"></div>' +
          "<div><p class=\"pick__no\">Step " + (i + 1) + " &middot; " + p.size + "</p><h4>" + p.name + "</h4><p>" + p.why + "</p></div>" +
          '<div class="pick__buy"><span class="pick__price">' + money(p.price) + "</span>" +
          '<button type="button" class="add-btn" data-add="' + id + '" data-name="' + p.name + '" data-price="' + p.price + '" data-size="' + p.size + '" data-img="' + p.img + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
          '<span class="add-btn__t">Add</span></button></div></div>'
        );
      });

      var total = ids.reduce(function (s, id) { return s + PRODUCTS[id].price; }, 0);
      var titleMap = {
        dry: "Deep hydration and barrier repair",
        oily: "Oil balance without stripping",
        sensitive: "Calming, low-actives recovery",
        combo: "Zone-aware balancing"
      };

      var bodyHtml =
        '<div class="result__head"><div><p class="mono">Your prescription</p>' +
        '<h3 class="result__title">' + titleMap[answers.skin] + "</h3></div>" +
        '<p class="serif-it">' + items.length + " steps &middot; " + money(total) + " &middot; about 90 seconds a day</p></div>" +
        '<div class="result__picks">' + items.join("") + "</div>" +
        '<div class="result__sum"><p class="serif-it">Re-test every 8 weeks — skin changes with the season, and your shelf should change with it.</p>' +
        '<div style="display:flex;gap:.7rem;flex-wrap:wrap">' +
        '<button type="button" class="btn btn--sage" id="add-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span class="add-btn__t">Add all ' + items.length + " steps</span></button>" +
        '<button type="button" class="btn btn--ghost" id="quiz-restart"><span class="add-btn__t">Retake</span></button></div></div>';

      if (result) {
        result.innerHTML = bodyHtml;
        result.hidden = false;
        result.classList.add("in");
        result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
        quiz.setAttribute("data-complete", "true");
        var addAll = document.getElementById("add-all");
        if (addAll) addAll.addEventListener("click", function () {
          ids.forEach(function (id) {
            var p = PRODUCTS[id];
            var found = null;
            cart.forEach(function (it) { if (it.id === id) found = it; });
            if (found) found.qty += 1;
            else cart.push({ id: id, name: p.name, price: p.price, img: p.img, size: p.size, qty: 1 });
          });
          render();
          say("All " + ids.length + " recommended steps added to your basket.");
          openCart();
        });
        var restart = document.getElementById("quiz-restart");
        if (restart) restart.addEventListener("click", function () {
          answers = { skin: null, goal: null, time: null };
          [].forEach.call(quiz.querySelectorAll("[data-opt]"), function (o) { o.setAttribute("aria-pressed", "false"); });
          result.hidden = true;
          result.innerHTML = "";
          quiz.removeAttribute("data-complete");
          ["skin", "goal", "time"].forEach(function (k) {
            var l = document.getElementById("answer-" + k);
            if (l) l.textContent = "—";
          });
          show(0);
        });
      }
    }

    show(0);
  }

  /* ---------- 06. Contact + newsletter forms ---------- */
  var contact = document.getElementById("contact-form");
  if (contact) {
    var validate = function (field) {
      var wrap = field.closest(".field");
      if (!wrap) return true;
      var ok = true;
      var msg = "";
      if (field.hasAttribute("required") && !field.value.trim()) { ok = false; msg = "This field is required."; }
      else if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value)) { ok = false; msg = "Enter a valid email address."; }
      else if (field.getAttribute("data-min") && field.value.trim().length < parseInt(field.getAttribute("data-min"), 10)) {
        ok = false; msg = "Please write at least " + field.getAttribute("data-min") + " characters.";
      }
      wrap.classList.toggle("has-error", !ok);
      var err = wrap.querySelector(".field__err");
      if (err) err.textContent = msg;
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    };

    contact.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fields = [].slice.call(contact.querySelectorAll("input, textarea, select"));
      var bad = fields.filter(function (f) { return !validate(f); });
      var okBox = document.getElementById("form-ok");
      if (bad.length) {
        if (okBox) okBox.hidden = true;
        bad[0].focus();
        say(bad.length + " field" + (bad.length === 1 ? "" : "s") + " need attention.");
        return;
      }
      var name = ((contact.querySelector("#c-name") || {}).value || "there").trim();
      var topic = (contact.querySelector("#c-topic") || {}).value || "your note";
      if (okBox) {
        okBox.querySelector("h3").textContent = "Thank you, " + name.split(" ")[0] + ".";
        var para = okBox.querySelector("p");
        para.textContent = "";
        var em = document.createElement("em");
        em.textContent = topic;
        para.append(
          "Your ",
          em,
          " enquiry is logged as reference VD-" + String(Math.floor(Math.random() * 9000) + 1000) +
          ". A member of the studio replies within one working day, Monday to Friday."
        );
        okBox.hidden = false;
        okBox.tabIndex = -1;
        okBox.focus();
      }
      contact.reset();
      [].forEach.call(contact.querySelectorAll(".field"), function (f) { f.classList.remove("has-error"); });
    });

    [].forEach.call(contact.querySelectorAll("input, textarea, select"), function (f) {
      f.addEventListener("blur", function () { if (f.value.trim() !== "") validate(f); });
    });
  }

  [].forEach.call(document.querySelectorAll("[data-newsletter]"), function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = form.querySelector("input[type=email]");
      var msg = form.querySelector(".nl__msg");
      if (!input || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value)) {
        if (msg) { msg.textContent = "Please enter a valid email address."; }
        if (input) input.focus();
        return;
      }
      if (msg) msg.textContent = "Subscribed — look for letter 01 on Sunday.";
      form.reset();
    });
  });

  /* ---------- 07. FAQ accordion ---------- */
  [].forEach.call(document.querySelectorAll(".faq__btn"), function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      panel.style.maxHeight = open ? "0px" : panel.scrollHeight + "px";
    });
  });

  /* ---------- 08. Footer year ---------- */
  [].forEach.call(document.querySelectorAll("[data-year]"), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
