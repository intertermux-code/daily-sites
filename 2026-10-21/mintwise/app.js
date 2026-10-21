/* ============================================================
   Mintwise — shared behaviour
   Motion identity: Spring Accordion + 3D Card Tilt
   Structure: Pinned Narrative stage switching
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");

  if (header && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("nav-open") && !header.contains(e.target)) {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
    header.querySelectorAll(".primary-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Pinned Narrative stage ----------
     .pin-scene > .pin-scene__stage > .pin-layer[data-pin="0|1|2…"]
     .pin-scene > .pin-scene__steps > .pin-step
  ---------------------------------------------- */

  document.querySelectorAll(".pin-scene").forEach(function (scene) {
    var layers = scene.querySelectorAll(".pin-layer");
    var steps = scene.querySelectorAll(".pin-step");
    if (!layers.length || !steps.length) return;

    var counter = scene.querySelector("[data-pin-counter]");

    function activate(index) {
      layers.forEach(function (layer, i) {
        layer.classList.toggle("is-active", i === index);
      });
      if (counter) counter.textContent = ("0" + (index + 1)).slice(-2);
    }
    activate(0);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activate(Number(entry.target.getAttribute("data-step")));
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

    steps.forEach(function (step, i) {
      step.setAttribute("data-step", String(i));
      observer.observe(step);
    });
  });

  /* ---------- Spring Accordion (one panel open per group) ---------- */

  document.querySelectorAll(".accordion").forEach(function (group) {
    var triggers = group.querySelectorAll(".acc-trigger");

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var isOpen = trigger.getAttribute("aria-expanded") === "true";
        triggers.forEach(function (t) { t.setAttribute("aria-expanded", "false"); });
        trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });

      trigger.addEventListener("keydown", function (e) {
        var list = Array.prototype.slice.call(triggers);
        var idx = list.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); list[(idx + 1) % list.length].focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); list[(idx - 1 + list.length) % list.length].focus(); }
      });
    });
  });

  /* ---------- 3D Card Tilt with glare ---------- */

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (finePointer && !reduceMotion) {
    var MAX_DEG = 8;

    document.querySelectorAll(".tilt-card").forEach(function (card) {
      var state = { el: card, curX: 0, curY: 0, tgtX: 0, tgtY: 0, gx: 50, gy: 50, tgx: 50, tgy: 50, raf: 0, active: false };

      function tick() {
        state.curX += (state.tgtX - state.curX) * 0.14;
        state.curY += (state.tgtY - state.curY) * 0.14;
        state.gx += (state.tgx - state.gx) * 0.2;
        state.gy += (state.tgy - state.gy) * 0.2;

        card.style.transform =
          "rotateX(" + state.curX.toFixed(2) + "deg) rotateY(" + state.curY.toFixed(2) + "deg)";
        card.style.setProperty("--gx", state.gx.toFixed(1) + "%");
        card.style.setProperty("--gy", state.gy.toFixed(1) + "%");

        var settled =
          Math.abs(state.tgtX - state.curX) < 0.05 &&
          Math.abs(state.tgtY - state.curY) < 0.05;

        if (state.active || !settled) {
          state.raf = requestAnimationFrame(tick);
        } else {
          state.raf = 0;
          card.style.transform = "";
          card.classList.remove("is-tilting");
        }
      }

      function start() {
        if (!state.raf) state.raf = requestAnimationFrame(tick);
      }

      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        state.tgtX = (0.5 - py) * MAX_DEG;
        state.tgtY = (px - 0.5) * MAX_DEG;
        state.tgx = px * 100;
        state.tgy = py * 100;
        state.active = true;
        card.classList.add("is-tilting");
        start();
      });

      card.addEventListener("pointerleave", function () {
        state.tgtX = 0;
        state.tgtY = 0;
        state.tgx = 50;
        state.tgy = 50;
        state.active = false;
        start();
      });
    });
  }

  /* ---------- Pricing: billing toggle ---------- */

  var billingSwitch = document.querySelector("[data-billing-switch]");

  if (billingSwitch) {
    var priceEls = document.querySelectorAll("[data-price-monthly]");
    var noteEls = document.querySelectorAll("[data-note-monthly]");

    billingSwitch.addEventListener("click", function () {
      var annual = billingSwitch.getAttribute("aria-checked") !== "true";
      billingSwitch.setAttribute("aria-checked", annual ? "true" : "false");
      billingSwitch.setAttribute("aria-label", annual ? "Switch to monthly billing" : "Switch to annual billing");

      priceEls.forEach(function (el) {
        el.textContent = annual ? el.getAttribute("data-price-annual") : el.getAttribute("data-price-monthly");
      });
      noteEls.forEach(function (el) {
        el.textContent = annual ? el.getAttribute("data-note-annual") : el.getAttribute("data-note-monthly");
      });

      document.querySelector("[data-bill-label='monthly']").classList.toggle("is-on", !annual);
      document.querySelector("[data-bill-label='annual']").classList.toggle("is-on", annual);
    });
  }

  /* ---------- Budget Calculator ---------- */

  var calc = document.getElementById("budget-calculator");

  if (calc) {
    var incomeInput = calc.querySelector('[data-calc="income"]');
    var rowsHost = calc.querySelector('[data-calc="custom-rows"]');
    var addBtn = calc.querySelector('[data-calc="add"]');
    var donutEl = calc.querySelector(".donut__slices");
    var rateEl = calc.querySelector("[data-out='rate']");
    var verdictEl = calc.querySelector("[data-out='verdict']");
    var legendEl = calc.querySelector("[data-out='legend']");
    var sumSpentEl = calc.querySelector("[data-out='spent']");
    var sumSavedEl = calc.querySelector("[data-out='saved']");
    var sumYearEl = calc.querySelector("[data-out='year']");
    var sumLeftEl = calc.querySelector("[data-out='buffer']");

    var PALETTE = ["#10b981", "#38bdf8", "#8b5cf6", "#f59e0b", "#f472b6", "#2dd4bf", "#a3e635", "#fb923c"];
    var R = 80;
    var CIRC = 2 * Math.PI * R;
    var uid = 0;

    function money(el) {
      var v = parseFloat(el.value);
      return isFinite(v) && v > 0 ? v : 0;
    }

    function fmt(n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    }

    function addCustomRow() {
      uid += 1;
      var wrap = document.createElement("div");
      wrap.className = "calc__row";
      wrap.setAttribute("data-expense-row", "");

      var labelCell = document.createElement("div");
      labelCell.className = "label-cell";

      var nameId = "custom-name-" + uid;
      var nameLabel = document.createElement("label");
      nameLabel.setAttribute("for", nameId);
      nameLabel.className = "visually-hidden";
      nameLabel.textContent = "Custom expense name";

      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.id = nameId;
      nameInput.placeholder = "e.g. Dog grooming";
      nameInput.setAttribute("data-role", "label-input");
      nameInput.setAttribute("data-calc-input", "");

      var amountId = "custom-amount-" + uid;
      var amountLabel = document.createElement("label");
      amountLabel.setAttribute("for", amountId);
      amountLabel.textContent = "Custom expense";

      var moneyBox = document.createElement("div");
      moneyBox.className = "money-field";
      var cur = document.createElement("span");
      cur.className = "cur";
      cur.textContent = "$";
      cur.setAttribute("aria-hidden", "true");

      var amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.id = amountId;
      amountInput.min = "0";
      amountInput.step = "10";
      amountInput.placeholder = "0";
      amountInput.inputMode = "decimal";
      amountInput.setAttribute("data-role", "amount");
      amountInput.setAttribute("data-calc-input", "");

      moneyBox.appendChild(cur);
      moneyBox.appendChild(amountInput);

      var amountWrap = document.createElement("div");
      amountWrap.appendChild(amountLabel);
      amountWrap.appendChild(moneyBox);
      amountLabel.className = "visually-hidden";

      labelCell.appendChild(nameLabel);
      labelCell.appendChild(nameInput);
      labelCell.appendChild(amountWrap);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "row-remove";
      remove.setAttribute("aria-label", "Remove this expense");
      remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      remove.addEventListener("click", function () {
        wrap.remove();
        recalc();
      });

      wrap.appendChild(labelCell);
      wrap.appendChild(remove);
      rowsHost.appendChild(wrap);
      nameInput.focus();
    }

    if (addBtn) addBtn.addEventListener("click", addCustomRow);

    function visibleRows() {
      return Array.prototype.slice.call(calc.querySelectorAll("[data-expense-row]"));
    }

    function rowName(row, fallback) {
      var label = row.getAttribute("data-name");
      if (label) return label;
      var custom = row.querySelector('[data-role="label-input"]');
      if (custom && custom.value.trim()) return custom.value.trim();
      return fallback;
    }

    function recalc() {
      var income = money(incomeInput);
      var items = [];

      visibleRows().forEach(function (row, i) {
        var amountEl = row.querySelector('[data-role="amount"]');
        var amount = money(amountEl);
        if (amount > 0) {
          items.push({ name: rowName(row, "Expense"), amount: amount });
        }
      });

      var spent = items.reduce(function (s, x) { return s + x.amount; }, 0);
      var saved = income > 0 ? income - spent : -spent;
      var rate = income > 0 ? Math.max(0, saved / income) : 0;

      drawDonut(income, spent, items, saved);
      renderLegend(items, saved);

      rateEl.textContent = income > 0 ? Math.round(rate * 100) + "%" : "—";
      sumSpentEl.textContent = fmt(spent);
      sumSavedEl.textContent = fmt(Math.max(0, saved));
      sumYearEl.textContent = fmt(Math.max(0, saved) * 12);
      sumLeftEl.textContent = fmt(income);

      var verdict, cls;
      if (income <= 0) {
        verdict = "Add your monthly income to see your savings rate.";
        cls = "verdict--ok";
      } else if (saved < 0) {
        verdict = "Overspending by " + fmt(-saved) + " a month — let’s fix that.";
        cls = "verdict--neg";
      } else if (rate >= 0.2) {
        verdict = "Excellent — you’re saving " + Math.round(rate * 100) + "% of every paycheck.";
        cls = "verdict--great";
      } else if (rate >= 0.1) {
        verdict = "Solid footing — push past 20% to hit turbo mode.";
        cls = "verdict--ok";
      } else {
        verdict = "Thin margin — small cuts here compound fast.";
        cls = "verdict--low";
      }
      verdictEl.textContent = verdict;
      verdictEl.className = "verdict " + cls;

      var savedSum = calc.querySelector('[data-out-card="saved"]');
      if (savedSum) savedSum.classList.toggle("calc-sum--neg", saved < 0);
      if (savedSum) savedSum.querySelector("strong").textContent = saved < 0 ? "−" + fmt(-saved) : fmt(saved);
    }

    function drawDonut(income, spent, items, saved) {
      donutEl.replaceChildren();
      if (income <= 0 || spent + Math.max(0, saved) <= 0) return;

      var total = spent + Math.max(0, saved);
      var segments = items.map(function (x, i) {
        return { value: x.amount, color: PALETTE[(i + 1) % PALETTE.length] };
      });
      if (saved > 0) segments.push({ value: saved, color: "#10b981" });

      var offset = 0;
      segments.forEach(function (seg) {
        var frac = seg.value / total;
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "100");
        circle.setAttribute("cy", "100");
        circle.setAttribute("r", String(R));
        circle.setAttribute("stroke", seg.color);
        circle.setAttribute("stroke-dasharray", (frac * CIRC - 2) + " " + CIRC);
        circle.setAttribute("stroke-dashoffset", String(-offset));
        donutEl.appendChild(circle);
        offset += frac * CIRC;
      });
    }

    function renderLegend(items, saved) {
      legendEl.replaceChildren();
      if (saved > 0) {
        legendEl.appendChild(legendRow("#10b981", "Savings", fmt(saved) + " / mo"));
      }
      items.forEach(function (x, i) {
        legendEl.appendChild(legendRow(PALETTE[(i + 1) % PALETTE.length], x.name, fmt(x.amount) + " / mo"));
      });
      if (!items.length && saved <= 0) {
        legendEl.appendChild(legendRow("#cbd5d1", "No expenses entered yet", ""));
      }
    }

    function legendRow(color, name, value) {
      var row = document.createElement("div");
      row.className = "legend__row";
      var sw = document.createElement("span");
      sw.className = "legend__sw";
      sw.style.background = color;
      var nm = document.createElement("span");
      nm.textContent = name;
      var v = document.createElement("b");
      v.textContent = value;
      row.appendChild(sw);
      row.appendChild(nm);
      row.appendChild(v);
      return row;
    }

    calc.addEventListener("input", function (e) {
      if (e.target.hasAttribute("data-calc-input") || e.target.hasAttribute("data-role")) recalc();
    });

    calc.addEventListener("submit", function (e) { e.preventDefault(); });

    recalc();
  }

  /* ---------- Contact form (client-side confirmation) ---------- */

  var contactForm = document.getElementById("support-form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = contactForm.querySelector(".form-status");
      var name = contactForm.querySelector('[name="name"]');
      if (status) {
        status.querySelector("[data-status-name]").textContent =
          (name && name.value.trim()) ? name.value.trim().split(" ")[0] : "you";
        status.classList.add("is-visible");
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      contactForm.reset();
    });
  }
})();
