/* ============================================================
   Mintwise — shared behaviour
   Motions: Decode Text (hero keyword) + Magnetic primary buttons
   Structure: Pinned Narrative (sticky panels, active rails)
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Header state + mobile navigation ---------- */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    var nav = document.querySelector("[data-nav]");
    var toggle = document.querySelector("[data-nav-toggle]");
    if (!header) return;

    var lastKnown = 0;
    function onScroll() {
      lastKnown = window.scrollY || document.documentElement.scrollTop;
      header.classList.toggle("is-scrolled", lastKnown > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!nav || !toggle) return;

    function open() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close main menu");
      document.body.classList.add("is-locked");
      var first = nav.querySelector("a");
      if (first) first.focus();
    }
    function close(returnFocus) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open main menu");
      document.body.classList.remove("is-locked");
      if (returnFocus) toggle.focus();
    }
    function isOpen() { return nav.classList.contains("is-open"); }

    toggle.addEventListener("click", function () { isOpen() ? close(true) : open(); });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close(true);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 780 && isOpen()) close(false);
    });

    nav.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !isOpen()) return;
      var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
      if (!links.length) return;
      var first = links[0], last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); toggle.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Motion 1: Decode Text ---------- */
  var GLYPHS = "abcdefghijklmnopqrstuvwxyz";
  var SYMBOLS = "$#%&*+=/<>0123456789";

  function decodeElement(el) {
    var target = (el.getAttribute("data-decode") || el.textContent).trim();
    if (reduceMotion) { el.textContent = target; return; }

    el.setAttribute("data-decoding", "true");
    var perChar = 78;
    var start = performance.now();
    var resolveAt = target.split("").map(function (_, i) {
      return i * perChar * 0.62 + Math.random() * perChar;
    });
    var total = resolveAt[resolveAt.length - 1] + 320;

    function frame(now) {
      var t = now - start;
      var out = "";
      for (var i = 0; i < target.length; i++) {
        var ch = target.charAt(i);
        if (ch === " ") { out += " "; continue; }
        if (t >= resolveAt[i]) {
          out += ch;
        } else {
          out += (Math.random() > 0.72 ? SYMBOLS : GLYPHS).charAt(
            Math.floor(Math.random() * 26)
          );
        }
      }
      el.textContent = out;
      if (t < total) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = target;
        el.removeAttribute("data-decoding");
      }
    }
    requestAnimationFrame(frame);
  }

  function initDecode() {
    var nodes = document.querySelectorAll("[data-decode]");
    if (!nodes.length) return;
    // runs once on load, per page
    window.addEventListener("load", function () {
      Array.prototype.forEach.call(nodes, decodeElement);
    });
    // fallback if load already fired before this script ran
    if (document.readyState === "complete") {
      Array.prototype.forEach.call(nodes, decodeElement);
    }
  }

  /* ---------- Motion 2: Magnetic Elements ---------- */
  function initMagnets() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".magnetic"));
    if (!items.length || reduceMotion || !canHover) return;

    var RADIUS = 120;
    var pointer = { x: -9999, y: -9999 };
    var running = false;
    var idleFrames = 0;

    items.forEach(function (el) { el.__pos = { x: 0, y: 0, s: 1 }; el.__target = { x: 0, y: 0, s: 1 }; });

    function track() {
      var moving = false;
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = pointer.x - cx;
        var dy = pointer.y - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var t = el.__target;

        if (dist < RADIUS + Math.max(r.width, r.height) / 2.6) {
          var falloff = Math.max(0, 1 - dist / RADIUS);
          t.x = dx * 0.28 * falloff;
          t.y = dy * 0.28 * falloff;
          t.s = dist < RADIUS * 0.55 ? 1.04 : 1 + 0.03 * falloff;
          moving = moving || Math.abs(el.__pos.x - t.x) > 0.15 || Math.abs(el.__pos.y - t.y) > 0.15;
        } else {
          t.x = 0; t.y = 0; t.s = 1;
        }

        var p = el.__pos;
        p.x += (t.x - p.x) * 0.18;
        p.y += (t.y - p.y) * 0.18;
        p.s += (t.s - p.s) * 0.16;
        if (!moving) moving = Math.abs(p.x - t.x) > 0.15 || Math.abs(p.y - t.y) > 0.15;
        el.style.transform = "translate3d(" + p.x.toFixed(2) + "px," + p.y.toFixed(2) + "px,0) scale(" + p.s.toFixed(4) + ")";
      }
      return moving;
    }

    function loop() {
      var active = track();
      if (active) {
        idleFrames = 0;
        requestAnimationFrame(loop);
      } else if (idleFrames++ < 45) {
        requestAnimationFrame(loop);
      } else {
        running = false;
      }
    }
    function wake() {
      if (!running) { running = true; idleFrames = 0; requestAnimationFrame(loop); }
    }

    window.addEventListener("pointermove", function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; wake();
    }, { passive: true });
    window.addEventListener("pointerleave", function () { pointer.x = -9999; pointer.y = -9999; wake(); });
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake, { passive: true });
    document.addEventListener("pointerdown", wake);
  }

  /* ---------- Pinned Narrative: index.html rail ---------- */
  function initRail() {
    var steps = document.querySelectorAll("[data-step]");
    var rail = document.querySelectorAll("[data-rail]");
    if (!steps.length || !rail.length || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var key = entry.target.getAttribute("data-step");
        Array.prototype.forEach.call(steps, function (s) {
          s.classList.toggle("is-current", s === entry.target);
        });
        Array.prototype.forEach.call(rail, function (r) {
          r.classList.toggle("is-active", r.getAttribute("data-rail") === key);
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

    Array.prototype.forEach.call(steps, function (s) { io.observe(s); });
  }

  /* ---------- Features page: sticky index highlighting ---------- */
  function initFeatureIndex() {
    var links = document.querySelectorAll("[data-index-link]");
    var blocks = document.querySelectorAll("[data-feature]");
    if (!links.length || !blocks.length || !("IntersectionObserver" in window)) return;

    var map = {};
    Array.prototype.forEach.call(links, function (a) { map[a.getAttribute("data-index-link")] = a; });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        Array.prototype.forEach.call(links, function (a) {
          a.classList.toggle("is-active", a === map[id]);
        });
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });

    Array.prototype.forEach.call(blocks, function (b) { io.observe(b); });
  }

  /* ---------- Calculator ---------- */
  var DEFAULT_EXPENSES = [
    { id: "housing", label: "Rent or mortgage", amount: 1550 },
    { id: "groceries", label: "Groceries", amount: 420 },
    { id: "transport", label: "Getting around", amount: 180 },
    { id: "utilities", label: "Utilities & internet", amount: 150 },
    { id: "subscriptions", label: "Subscriptions", amount: 46 },
    { id: "dining", label: "Dining and nights out", amount: 235 },
    { id: "health", label: "Health & fitness", amount: 90 },
    { id: "care", label: "Family & dependants", amount: 130 }
  ];

  var PRESETS = {
    "single-salary": { income: 3600, savings: 260, expenses: { housing: 1180, groceries: 330, transport: 150, utilities: 130, subscriptions: 42, dining: 180, health: 60, care: 0 } },
    "dual-income": { income: 9200, savings: 1400, expenses: { housing: 2450, groceries: 720, transport: 340, utilities: 260, subscriptions: 88, dining: 520, health: 190, care: 640 } },
    "freelance": { income: 5200, savings: 900, expenses: { housing: 1550, groceries: 420, transport: 180, utilities: 150, subscriptions: 96, dining: 260, health: 140, care: 0 } },
    "new-parent": { income: 6400, savings: 520, expenses: { housing: 1720, groceries: 610, transport: 290, utilities: 190, subscriptions: 54, dining: 210, health: 220, care: 1150 } }
  };

  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var CIRC = 2 * Math.PI * 82;

  function num(value) {
    var n = parseFloat(value);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function initCalculator() {
    var form = document.querySelector("[data-calc]");
    if (!form) return;

    var incomeInput = form.querySelector("[data-income]");
    var savingsInput = form.querySelector("[data-savings]");
    var rowsHost = form.querySelector("[data-expense-rows]");
    var addButton = form.querySelector("[data-add-row]");
    var resetButton = form.querySelector("[data-reset]");
    var storeKey = "mintwise.budget.v1";

    var out = {
      rate: document.querySelector("[data-out-rate]"),
      cap: document.querySelector("[data-out-rate-caption]"),
      grade: document.querySelector("[data-out-grade]"),
      monthly: document.querySelector("[data-out-monthly]"),
      yearly: document.querySelector("[data-out-yearly]"),
      spending: document.querySelector("[data-out-spending]"),
      runway: document.querySelector("[data-out-runway]"),
      live: document.querySelector("[data-live]"),
      donutDesc: document.querySelector("[data-donut-desc]"),
      recs: document.querySelector("[data-recs]"),
      youBar: document.querySelector("[data-bench-you]"),
      youLabel: document.querySelector("[data-bench-label]"),
      warn: document.querySelector("[data-shortfall]")
    };

    var segs = {
      spend: form.ownerDocument.querySelector('[data-seg="spend"]'),
      save: form.ownerDocument.querySelector('[data-seg="save"]'),
      free: form.ownerDocument.querySelector('[data-seg="free"]')
    };

    /* ---- row factory ---- */
    var REMOVE_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 12h12"></path></svg>';

    function buildRow(opts) {
      var id = opts.id;
      var li = document.createElement("div");
      li.className = "expense-row";
      li.setAttribute("data-row", "");
      li.setAttribute("data-id", id);

      var amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.id = "exp-" + id;
      amountInput.min = "0";
      amountInput.step = "10";
      amountInput.inputMode = "decimal";
      amountInput.value = opts.amount;
      amountInput.placeholder = "0";
      amountInput.setAttribute("data-amount", "");
      amountInput.setAttribute("data-category", opts.label);

      if (opts.editable) {
        var wrap = document.createElement("div");
        var hiddenLabel = document.createElement("label");
        hiddenLabel.className = "visually-hidden";
        hiddenLabel.setAttribute("for", "name-" + id);
        hiddenLabel.textContent = "Expense name";
        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "name-" + id;
        nameInput.className = "row-name";
        nameInput.value = opts.label;
        nameInput.placeholder = "Expense name";
        nameInput.maxLength = 42;
        nameInput.autocomplete = "off";
        nameInput.setAttribute("data-name", "");
        wrap.appendChild(hiddenLabel);
        wrap.appendChild(nameInput);
        li.appendChild(wrap);

        var amountHidden = document.createElement("label");
        amountHidden.className = "visually-hidden";
        amountHidden.setAttribute("for", amountInput.id);
        amountHidden.textContent = "Monthly amount";
        amountInput.setAttribute("aria-label", "Monthly amount");
        li.__amountLabel = amountHidden;
      } else {
        var label = document.createElement("label");
        label.className = "row-label";
        label.setAttribute("for", amountInput.id);
        label.textContent = opts.label;
        li.appendChild(label);
      }

      var cell = document.createElement("div");
      cell.className = "money-cell";
      if (li.__amountLabel) cell.appendChild(li.__amountLabel);
      cell.appendChild(amountInput);
      li.appendChild(cell);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "row-remove";
      remove.setAttribute("data-remove", "");
      remove.setAttribute("aria-label", "Remove " + opts.label);
      remove.innerHTML = REMOVE_ICON; // static markup, no user data
      if (!opts.removable) remove.hidden = true;
      li.appendChild(remove);

      return li;
    }

    DEFAULT_EXPENSES.forEach(function (r) {
      rowsHost.appendChild(buildRow({ id: r.id, label: r.label, amount: r.amount, removable: false }));
    });

    var customCount = 0;
    function addCustomRow(label, amount, focus) {
      customCount += 1;
      var li = buildRow({
        id: "custom-" + customCount,
        label: label || "Extra cost",
        amount: amount || 0,
        removable: true,
        editable: true
      });
      rowsHost.appendChild(li);
      if (focus !== false) li.querySelector("[data-name]").focus();
      render();
    }

    /* ---- persistence ---- */
    function save() {
      var state = {
        income: num(incomeInput.value),
        savings: num(savingsInput.value),
        rows: Array.prototype.map.call(rowsHost.querySelectorAll("[data-row]"), function (li) {
          var input = li.querySelector("[data-amount]");
          var nameEl = li.querySelector("[data-name]");
          return {
            id: li.getAttribute("data-id"),
            label: nameEl ? nameEl.value : input.getAttribute("data-category"),
            amount: num(input.value),
            custom: !!nameEl
          };
        })
      };
      try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
    }

    function restore() {
      var raw = null;
      try { raw = localStorage.getItem(storeKey); } catch (e) { return false; }
      if (!raw) return false;
      var state;
      try { state = JSON.parse(raw); } catch (e) { return false; }
      if (!state || !Array.isArray(state.rows) || !state.rows.length) return false;

      rowsHost.innerHTML = "";
      customCount = 0;
      state.rows.forEach(function (r) {
        var custom = !!r.custom;
        if (custom) customCount += 1;
        rowsHost.appendChild(buildRow({
          id: custom && /^custom-\d+$/.test(String(r.id)) ? r.id : (r.id || "row-" + (customCount + 1)),
          label: String(r.label || "Extra cost"),
          amount: num(r.amount),
          removable: custom,
          editable: custom
        }));
      });
      incomeInput.value = num(state.income);
      savingsInput.value = num(state.savings);
      return true;
    }

    /* ---- calculation + paint ---- */
    function readRows() {
      var rows = [];
      Array.prototype.forEach.call(rowsHost.querySelectorAll("[data-row]"), function (li) {
        var input = li.querySelector("[data-amount]");
        if (!input) return;
        var nameEl = li.querySelector("[data-name]");
        rows.push({
          label: nameEl && nameEl.value.trim() ? nameEl.value.trim() : input.getAttribute("data-category"),
          amount: num(input.value)
        });
      });
      return rows;
    }

    function setSeg(el, start, length) {
      if (!el) return;
      el.setAttribute("stroke-dasharray", length.toFixed(2) + " " + (CIRC - length).toFixed(2));
      el.setAttribute("stroke-dashoffset", (-start).toFixed(2));
    }

    function grade(rate) {
      if (rate >= 40) return "Elite — you bank more than almost anyone on this income";
      if (rate >= 25) return "Strong — a genuinely comfortable margin";
      if (rate >= 15) return "Solid — the habit is forming";
      if (rate >= 5) return "Getting started — every point counts from here";
      if (rate > 0) return "Thin — the plan needs one structural change";
      return "Underwater — spending exceeds income";
    }

    function recommendations(rows, income, savings, kept, rate, leftover) {
      var list = [];
      var sorted = rows.filter(function (r) { return r.amount > 0; }).sort(function (a, b) { return b.amount - a.amount; });

      if (income <= 0) {
        list.push("Enter your monthly take-home pay to see your rate.");
        return list;
      }
      if (sorted.length) {
        var top = sorted[0];
        var trim = Math.round(top.amount * 0.1);
        list.push("<strong>" + esc(top.label) + "</strong> is your largest line at " + money.format(top.amount) +
          " a month. A 10% trim — " + money.format(trim) + " — would lift your rate to " +
          Math.min(99, Math.round(((kept + trim) / income) * 100)) + "%.");
      }
      if (leftover > 1) {
        list.push("<strong>" + money.format(leftover) + " is unallocated.</strong> Put it on an autoflow rule now; unallocated money is usually spent money.");
      } else if (rate < 20) {
        var gap = Math.round(income * 0.2 - kept);
        list.push("Reaching a 20% rate needs <strong>" + money.format(Math.max(gap, 0)) + " more</strong> moved on payday — two subscription cuts and a smaller weekly shop usually covers it.");
      } else {
        var toFifty = Math.round(income * 0.1);
        list.push("You are above 20%. The next step is worth <strong>" + money.format(toFifty) + " a month</strong> — Mintwise hides it in the high-yield ladder before it reaches checking.");
      }
      var subs = rows.filter(function (r) { return /subscription/i.test(r.label); })[0];
      var dining = rows.filter(function (r) { return /dining|nights/i.test(r.label); })[0];
      if (subs && subs.amount > 40) {
        list.push("<strong>" + money.format(subs.amount) + "/month in subscriptions</strong> is " + money.format(subs.amount * 12) +
          " a year. Members who audit once typically recover a third of it.");
      } else if (dining && dining.amount > income * 0.08) {
        list.push("Dining and nights out run <strong>" + money.format(dining.amount) + "</strong>, over 8% of take-home. A single weeknight rule trims roughly " + money.format(Math.round(dining.amount * 0.2)) + ".");
      } else {
        list.push("Keep your emergency fund at three months of spending — that is <strong>" + money.format(Math.round(rows.reduce(function (t, r) { return t + r.amount; }, 0) * 3)) + "</strong> sitting in an account you cannot tap from the card app.");
      }
      return list;
    }

    function render() {
      var income = num(incomeInput.value);
      var savings = num(savingsInput.value);
      var rows = readRows();
      var spent = rows.reduce(function (t, r) { return t + r.amount; }, 0);
      var kept = Math.max(income - spent, 0);
      var leftover = Math.max(kept - savings, 0);
      var shortfall = Math.max(spent - income, 0);
      var rate = income > 0 ? (kept / income) * 100 : 0;

      var spendPct = income > 0 ? Math.min(spent / income, 1) : 0;
      var savePct = income > 0 ? Math.min(savings / income, Math.max(1 - spendPct, 0)) : 0;
      var freePct = Math.max(1 - spendPct - savePct, 0);

      var a = spendPct * CIRC, b = savePct * CIRC, c = freePct * CIRC;
      setSeg(segs.spend, 0, a);
      setSeg(segs.save, a, b);
      setSeg(segs.free, a + b, c);

      if (out.rate) out.rate.textContent = (income > 0 ? Math.round(rate) : 0) + "%";
      if (out.cap) out.cap.textContent = income > 0 ? "of take-home kept" : "add an income";
      if (out.grade) out.grade.textContent = income > 0 ? grade(rate) : "Your rate appears here";
      if (out.monthly) out.monthly.textContent = money.format(kept);
      if (out.yearly) out.yearly.textContent = money.format(kept * 12);
      if (out.spending) out.spending.textContent = income > 0 ? Math.round((spent / income) * 100) + "%" : "0%";
      if (out.runway) out.runway.textContent = spent > 0 ? ((kept * 12) / spent).toFixed(1) + " mo" : "—";

      if (out.warn) {
        out.warn.hidden = shortfall <= 0;
        if (shortfall > 0) {
          out.warn.textContent = "Your listed costs exceed your income by " + money.format(shortfall) +
            " a month. That is a plan problem, not a discipline problem — start at " + featuresHref();
        }
      }

      if (out.donutDesc) {
        out.donutDesc.textContent = "Savings rate " + Math.round(rate) + " percent. Spent " +
          money.format(spent) + ", saved " + money.format(savings) + ", unallocated " + money.format(leftover) + ".";
      }
      if (out.live) {
        out.live.textContent = income > 0
          ? "Savings rate " + Math.round(rate) + " percent. You keep " + money.format(kept) + " of " + money.format(income) + " each month."
          : "Enter your monthly take-home pay to calculate a savings rate.";
      }
      if (out.recs) {
        var items = recommendations(rows, income, savings, kept, rate, leftover);
        out.recs.innerHTML = items.map(function (t) { return "<li>" + t + "</li>"; }).join("");
      }
      if (out.youBar) out.youBar.style.width = Math.max(2, Math.min(rate, 100)) + "%";
      if (out.youLabel) out.youLabel.textContent = income > 0 ? Math.round(rate) + "%" : "0%";

      save();
    }

    function featuresHref() { return "features.html#autoflow"; }

    /* ---- wiring ---- */
    form.addEventListener("input", function (e) {
      var input = e.target;
      if (input.matches("[data-amount]")) {
        var li = input.closest("[data-row]");
        var nameEl = li && li.querySelector("[data-name]");
        if (nameEl) input.setAttribute("data-category", nameEl.value || "Extra cost");
      }
      render();
    });

    form.addEventListener("click", function (e) {
      var remove = e.target.closest("[data-remove]");
      if (remove) {
        var row = remove.closest("[data-row]");
        row.parentNode.removeChild(row);
        render();
        return;
      }
      var presetBtn = e.target.closest("[data-preset]");
      if (presetBtn) {
        var key = presetBtn.getAttribute("data-preset");
        applyPreset(key, presetBtn);
      }
    });

    if (addButton) addButton.addEventListener("click", function () { addCustomRow("", 0); });

    if (resetButton) resetButton.addEventListener("click", function () {
      try { localStorage.removeItem(storeKey); } catch (e) { /* ignore */ }
      rowsHost.innerHTML = "";
      customCount = 0;
      DEFAULT_EXPENSES.forEach(function (r) {
        rowsHost.appendChild(buildRow({ id: r.id, label: r.label, amount: r.amount, removable: false }));
      });
      incomeInput.value = 4800;
      savingsInput.value = 600;
      Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
        b.setAttribute("aria-pressed", "false");
      });
      render();
      incomeInput.focus();
    });

    function applyPreset(key, btn) {
      var p = PRESETS[key];
      if (!p) return;
      incomeInput.value = p.income;
      savingsInput.value = p.savings;
      Array.prototype.forEach.call(rowsHost.querySelectorAll("[data-row]"), function (li) {
        var id = li.getAttribute("data-id");
        var input = li.querySelector("[data-amount]");
        if (p.expenses && Object.prototype.hasOwnProperty.call(p.expenses, id)) {
          input.value = p.expenses[id];
        } else if (li.querySelector("[data-name]")) {
          li.parentNode.removeChild(li);
        }
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      render();
    }

    var restored = restore();
    if (!restored) { incomeInput.value = 4800; savingsInput.value = 600; }
    render();
  }

  /* ---------- Pricing: billing toggle ---------- */
  function initPricing() {
    var switchEl = document.querySelector("[data-billing-switch]");
    if (!switchEl) return;

    function setBilling(mode) {
      switchEl.setAttribute("data-billing", mode);
      Array.prototype.forEach.call(switchEl.querySelectorAll(".switch__opt"), function (opt) {
        opt.setAttribute("aria-pressed", opt.getAttribute("data-for") === mode ? "true" : "false");
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-monthly]"), function (el) {
        var value = mode === "annual" ? el.getAttribute("data-annual") : el.getAttribute("data-monthly");
        var period = el.getAttribute("data-period");
        el.textContent = value;
        if (period && el.nextElementSibling === null) { /* price node holds only the figure */ }
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-billed-note]"), function (el) {
        el.textContent = mode === "annual"
          ? el.getAttribute("data-annual-note")
          : el.getAttribute("data-monthly-note");
      });
    }

    switchEl.addEventListener("click", function (e) {
      var opt = e.target.closest("[data-for]");
      if (!opt) return;
      setBilling(opt.getAttribute("data-for"));
    });
    switchEl.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setBilling(switchEl.getAttribute("data-billing") === "monthly" ? "annual" : "monthly");
      }
    });
    setBilling(switchEl.getAttribute("data-billing") || "monthly");
  }

  /* ---------- Contact form validation ---------- */
  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    var status = form.querySelector("[data-form-status]");

    function fieldOf(input) { return input.closest(".form-field"); }
    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      var slot = field.querySelector(".error");
      field.classList.toggle("is-invalid", !!message);
      if (slot) slot.textContent = message || "";
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validate(input) {
      var value = (input.value || "").trim();
      if (input.hasAttribute("data-required") && !value) {
        setError(input, input.getAttribute("data-empty") || "This field is needed.");
        return false;
      }
      if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setError(input, "That address looks incomplete — check the domain.");
        return false;
      }
      if (input.hasAttribute("data-minlen") && value.length < parseInt(input.getAttribute("data-minlen"), 10)) {
        setError(input, "A little more detail helps us answer properly.");
        return false;
      }
      if (input.type === "checkbox" && input.hasAttribute("data-required") && !input.checked) {
        setError(input, "Please tick this so we can reply to you.");
        return false;
      }
      setError(input, "");
      return true;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (fieldOf(input) && fieldOf(input).classList.contains("is-invalid")) validate(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      inputs.forEach(function (input) {
        var valid = validate(input);
        if (!valid && !firstBad) firstBad = input;
        ok = ok && valid;
      });

      if (!ok) {
        if (status) {
          status.textContent = "Almost there — the highlighted fields need one more look.";
          status.classList.add("is-visible");
          status.style.color = "#b4553f";
        }
        if (firstBad) firstBad.focus();
        return;
      }

      var name = (form.querySelector("[data-name-field]") || {}).value || "there";
      var first = String(name).trim().split(/\s+/)[0] || "there";
      var topic = (form.querySelector("[data-topic-field]") || {}).value || "your question";
      if (status) {
        status.style.color = "";
        status.textContent = "Thanks, " + first + ". Your note about " + topic +
          " is queued — a human replies within one business day, usually far sooner.";
        status.classList.add("is-visible");
      }
      form.reset();
      inputs.forEach(function (i) { setError(i, ""); });
    });
  }

  /* ---------- Footer newsletter ---------- */
  function initNewsletter() {
    var form = document.querySelector("[data-newsletter]");
    if (!form) return;
    var status = form.querySelector("[data-newsletter-status]");
    var input = form.querySelector("input[type=email]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        status.textContent = "Please enter a valid email address.";
        status.style.color = "#b4553f";
        input.focus();
        return;
      }
      status.style.color = "";
      status.textContent = "Subscribed — the next ledger lands Tuesday.";
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- boot ---------- */
  function boot() {
    initHeader();
    initDecode();
    initMagnets();
    initRail();
    initFeatureIndex();
    initCalculator();
    initPricing();
    initContactForm();
    initNewsletter();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
