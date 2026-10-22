/* ═══════════════════════════════════════════════════════════════
   Mintwise — shared behaviour
   1. navigation   2. parallax layers   3. 3D card tilt
   4. card deck fan 5. savings calculator 6. pricing toggle
   7. FAQ accordion  8. support form
   Every module is guarded by element existence, so one file
   serves all five pages.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarseQuery = window.matchMedia("(pointer: coarse)");
  var motionOff = function () { return reduceQuery.matches; };

  var usd = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0
  });
  var clamp = function (n, lo, hi) { return Math.min(hi, Math.max(lo, n)); };
  var num = function (v) { var n = parseFloat(v); return isFinite(n) && n > 0 ? n : 0; };

  /* ─── 1. Navigation ─────────────────────────────────────── */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(nav.getAttribute("data-open") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        setOpen(false); toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 980 && nav.getAttribute("data-open") === "true") setOpen(false);
    });
  }

  /* ─── 2 + 4. Scroll engine: header state, parallax, deck ── */
  var header = document.querySelector("[data-header]");
  var layers = [].slice.call(document.querySelectorAll("[data-speed]"));
  var decks = [].slice.call(document.querySelectorAll("[data-deck]"));

  var measure = function () {
    var vh = window.innerHeight;
    layers.forEach(function (el) {
      var r = el.getBoundingClientRect();
      el.__mid = r.top + window.pageYOffset + r.height / 2;
      el.__span = r.height;
    });
    return vh;
  };
  var vh = measure();

  var drawParallax = function () {
    if (motionOff()) {
      layers.forEach(function (el) { el.style.setProperty("--py", "0px"); });
      return;
    }
    var scroll = window.pageYOffset;
    layers.forEach(function (el) {
      var delta = (scroll + vh / 2) - el.__mid;
      if (Math.abs(delta) > vh * 1.4) { return; }
      var speed = parseFloat(el.getAttribute("data-speed")) || 0;
      var shift = clamp(delta * speed, -170, 170);
      el.style.setProperty("--py", shift.toFixed(2) + "px");
    });
  };

  var ticking = false;
  var onScroll = function () {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      if (header) {
        header.setAttribute("data-elevate", window.pageYOffset > 8 ? "on" : "off");
      }
      drawParallax();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { vh = measure(); drawParallax(); });
  onScroll();
  drawParallax();

  /* Card deck: stacked until you reach it, then it fans out. */
  if (decks.length && "IntersectionObserver" in window) {
    var deckObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var deck = entry.target;
        if (motionOff()) {
          deck.classList.remove("is-stacked");
          deck.classList.add("is-open");
          return;
        }
        if (entry.isIntersecting) {
          deck.classList.remove("is-stacked");
          deck.classList.add("is-open");
        } else if (!entry.boundingClientRect.top) {
          deck.classList.remove("is-open");
          deck.classList.add("is-stacked");
        } else if (entry.boundingClientRect.top > 0) {
          deck.classList.remove("is-open");
        }
      });
    }, { threshold: 0.28, rootMargin: "0px 0px -8% 0px" });

    decks.forEach(function (deck) {
      if (motionOff()) { deck.classList.add("is-open"); return; }
      var box = deck.getBoundingClientRect();
      if (box.top > window.innerHeight * 0.8) { deck.classList.add("is-stacked"); }
      else { deck.classList.add("is-open"); }
      deckObserver.observe(deck);
    });
  } else {
    decks.forEach(function (deck) { deck.classList.add("is-open"); });
  }

  /* ─── 3. 3D card tilt (lerped) + glare ──────────────────── */
  var tiltItems = [].slice.call(document.querySelectorAll("[data-tilt]"));
  var tilting = [];

  tiltItems.forEach(function (el) {
    var state = {
      el: el,
      max: parseFloat(el.getAttribute("data-tilt-max")) || 8,
      tx: 0, ty: 0, rx: 0, ry: 0, on: false,
      glare: el.querySelector(".tilt-glare")
    };
    el.__tilt = state;

    el.addEventListener("pointerenter", function (e) {
      if (motionOff() || coarseQuery.matches) { return; }
      state.on = true;
      if (tilting.indexOf(state) === -1) { tilting.push(state); runTilt(); }
    });
    el.addEventListener("pointermove", function (e) {
      if (!state.on) { return; }
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      state.tx = clamp(px, 0, 1);
      state.ty = clamp(py, 0, 1);
      state.rx = (0.5 - state.ty) * 2 * state.max;
      state.ry = (state.tx - 0.5) * 2 * state.max;
    });
    el.addEventListener("pointerleave", function () {
      state.on = false;
      state.rx = 0; state.ry = 0;
      state.gx = 50; state.gy = 50;
    });
  });

  var tiltFrame = null;
  function runTilt() {
    if (tiltFrame) { return; }
    var step = function () {
      tiltFrame = null;
      for (var i = tilting.length - 1; i >= 0; i--) {
        var s = tilting[i];
        s.cx = (s.cx || 0) + ((s.rx || 0) - (s.cx || 0)) * 0.16;
        s.cy = (s.cy || 0) + ((s.ry || 0) - (s.cy || 0)) * 0.16;
        s.el.style.setProperty("--rx", s.cx.toFixed(3) + "deg");
        s.el.style.setProperty("--ry", s.cy.toFixed(3) + "deg");
        if (s.glare) {
          s.glare.style.setProperty("--gx", ((s.tx || 0.5) * 100).toFixed(1) + "%");
          s.glare.style.setProperty("--gy", ((s.ty || 0.5) * 100).toFixed(1) + "%");
        }
        var settled = !s.on && Math.abs(s.cx) < 0.02 && Math.abs(s.cy) < 0.02;
        if (settled) {
          s.el.style.setProperty("--rx", "0deg");
          s.el.style.setProperty("--ry", "0deg");
          tilting.splice(i, 1);
        }
      }
      if (tilting.length) { tiltFrame = window.requestAnimationFrame(step); }
    };
    tiltFrame = window.requestAnimationFrame(step);
  }

  /* ─── 5. Savings calculator ─────────────────────────────── */
  var calc = document.getElementById("budget-calculator");

  if (calc) {
    var incomeEl = document.getElementById("income");
    var incomeShown = document.getElementById("income-shown");
    var incomeRange = document.getElementById("income-range");
    var expenseEls = [].slice.call(calc.querySelectorAll(".expense input"));
    var rateOut = document.getElementById("rate-out");
    var rateSub = document.getElementById("rate-sub");
    var verdictTitle = document.getElementById("verdict-title");
    var verdictBody = document.getElementById("verdict-body");
    var savedMonth = document.getElementById("out-saved-month");
    var savedYear = document.getElementById("out-saved-year");
    var spendOut = document.getElementById("out-spend");
    var vsMedian = document.getElementById("out-median");
    var saveArc = document.getElementById("arc-save");
    var spendArc = document.getElementById("arc-spend");
    var boostEl = document.getElementById("boost");
    var boostOut = document.getElementById("boost-out");
    var bars = document.getElementById("forecast-bars");
    var boostLine = document.getElementById("boost-line");
    var live = document.getElementById("calc-live");
    var RADIUS = 92, CIRC = 2 * Math.PI * RADIUS;

    var VERDICTS = [
      { min: 40, title: "Exceptional discipline", body: "You are saving more than four in five high earners. At this rate, retirement arrives early — the risk now is under-spending, not over-spending." },
      { min: 25, title: "Strong and durable", body: "Above the top decile of Mintwise households. Keep the floor fixed and let raises flow straight to the vaults." },
      { min: 15, title: "Healthy, with room", body: "Comfortably above the 12.6% median. Two hundred dollars less on recurring bills would push you into the next band." },
      { min: 8, title: "Steady but fragile", body: "One surprise repair wipes out a month. Build a $1,000 buffer before optimising anything else." },
      { min: 1, title: "Running thin", body: "Every percentage point is worth finding here. The fastest win is usually a subscription or an insurance renewal, not a lifestyle cut." },
      { min: -Infinity, title: "Spending exceeds income", body: "You are short this month. Start with the three largest debits on the list — that is where the gap usually lives." }
    ];

    var paintRange = function (input) {
      var min = parseFloat(input.min) || 0, max = parseFloat(input.max) || 100;
      var pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
      input.style.setProperty("--pct", clamp(pct, 0, 100) + "%");
    };

    var verdictFor = function (rate) {
      for (var i = 0; i < VERDICTS.length; i++) {
        if (rate >= VERDICTS[i].min) { return VERDICTS[i]; }
      }
      return VERDICTS[VERDICTS.length - 1];
    };

    var render = function () {
      var income = num(incomeEl.value);
      var total = 0;
      expenseEls.forEach(function (input) {
        var v = num(input.value);
        total += v;
        var pctEl = input.closest(".expense").querySelector(".e-pct");
        if (pctEl) { pctEl.textContent = income > 0 ? Math.round((v / income) * 100) + "%" : "—"; }
      });

      var saved = income - total;
      var rate = income > 0 ? (saved / income) * 100 : 0;
      var ratePos = clamp(rate, 0, 100);
      var spendRatio = income > 0 ? clamp(total / income, 0, 1) : 1;
      var saveLen = CIRC * (ratePos / 100);
      var spendLen = CIRC * (income > 0 ? Math.min(spendRatio, 1) : 0);

      if (saveArc) {
        saveArc.setAttribute("stroke-dasharray", saveLen.toFixed(2) + " " + CIRC.toFixed(2));
        saveArc.setAttribute("stroke-dashoffset", (-spendLen).toFixed(2));
      }
      if (spendArc) {
        spendArc.setAttribute("stroke-dasharray", spendLen.toFixed(2) + " " + CIRC.toFixed(2));
        spendArc.setAttribute("stroke-dashoffset", "0");
      }
      if (rateOut) { rateOut.textContent = Math.round(rate) + "%"; }
      if (incomeShown) { incomeShown.textContent = usd.format(income); }
      if (rateSub) {
        rateSub.textContent = income > 0
          ? (saved >= 0 ? usd.format(saved) + " kept of " + usd.format(income)
                        : "short " + usd.format(Math.abs(saved)))
          : "Add an income figure to begin";
      }
      var verdict = verdictFor(rate);
      if (verdictTitle) { verdictTitle.textContent = verdict.title; }
      if (verdictBody) { verdictBody.textContent = verdict.body; }
      if (savedMonth) { savedMonth.textContent = usd.format(Math.max(saved, 0)); }
      if (savedYear) { savedYear.textContent = usd.format(Math.max(saved, 0) * 12); }
      if (spendOut) { spendOut.textContent = usd.format(total); }
      if (vsMedian) {
        var diff = rate - 12.6;
        vsMedian.textContent = (diff >= 0 ? "+" : "−") + Math.abs(diff).toFixed(1) + " pts";
        var vsNote = document.createElement("small");
        vsNote.textContent = " vs national median";
        vsMedian.appendChild(vsNote);
      }

      /* 12-month forecast with the optional boost */
      var boost = num(boostEl ? boostEl.value : 0);
      var monthly = Math.max(saved, 0) + boost;
      var twelve = monthly * 12;
      var MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
                          "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
      if (boostOut) { boostOut.textContent = "+" + usd.format(boost); }
      if (bars) {
        if (!bars.children.length) {
          var frag = document.createDocumentFragment();
          for (var m = 0; m < 12; m++) { frag.appendChild(document.createElement("li")); }
          bars.appendChild(frag);
        }
        [].slice.call(bars.children).forEach(function (li, idx) {
          var cum = monthly * (idx + 1);
          var pct = twelve > 0 ? (cum / twelve) * 100 : 0;
          li.style.height = clamp(pct, 2, 100) + "%";
          li.setAttribute("data-m", idx % 3 === 0 || idx === 11 ? MONTH_LABELS[idx] : "");
          li.setAttribute("aria-hidden", "true");
          li.title = "Month " + (idx + 1) + " · " + usd.format(cum) + " banked";
        });
      }
      if (boostLine) {
        boostLine.textContent = monthly > 0
          ? usd.format(monthly) + " a month reaches " + usd.format(monthly * 12) +
            " by next October — enough for " + (monthly * 12 > 6000 ? "a wedding deposit"
              : monthly * 12 > 2500 ? "three months of rent cover"
              : "a fully funded emergency buffer") + "."
          : "Set the slider to see what an extra push would compound into.";
      }
      if (live) {
        live.textContent = "Savings rate " + Math.round(rate) + " percent. " +
          usd.format(Math.max(saved, 0)) + " kept each month.";
      }
      if (incomeRange) { incomeRange.value = incomeEl.value; paintRange(incomeRange); }
    };

    [incomeEl].concat(expenseEls).forEach(function (input) {
      if (!input) { return; }
      input.addEventListener("input", render);
    });
    if (incomeRange) {
      incomeRange.addEventListener("input", function () {
        incomeEl.value = incomeRange.value;
        paintRange(incomeRange);
        render();
      });
      paintRange(incomeRange);
    }
    expenseEls.forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value === "" || parseFloat(input.value) < 0) { input.value = 0; render(); }
      });
    });
    if (boostEl) {
      boostEl.addEventListener("input", function () { paintRange(boostEl); render(); });
      paintRange(boostEl);
    }

    /* presets */
    var PRESETS = {
      steady:    { income: 4200, expenses: [1350, 620, 260, 310, 240, 420] },
      freelancer:{ income: 3600, expenses: [1200, 540, 210, 380, 420, 260] },
      couple:    { income: 7100, expenses: [2100, 1080, 520, 640, 700, 780] }
    };
    [].slice.call(calc.querySelectorAll(".chip[data-preset]")).forEach(function (chip) {
      chip.addEventListener("click", function () {
        var p = PRESETS[chip.getAttribute("data-preset")];
        if (!p) { return; }
        calc.querySelectorAll(".chip[data-preset]").forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        incomeEl.value = p.income;
        expenseEls.forEach(function (input, i) { input.value = p.expenses[i]; });
        if (incomeRange) { incomeRange.value = p.income; paintRange(incomeRange); }
        render();
      });
    });

    var reset = document.getElementById("calc-reset");
    if (reset) {
      reset.addEventListener("click", function () {
        calc.querySelectorAll(".chip[data-preset]").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        incomeEl.value = 3800;
        expenseEls.forEach(function (input, i) {
          input.value = [1200, 560, 240, 300, 260, 340][i];
        });
        if (boostEl) { boostEl.value = 0; paintRange(boostEl); }
        if (incomeRange) { incomeRange.value = incomeEl.value; paintRange(incomeRange); }
        render();
      });
    }

    render();
  }

  /* ─── 6. Pricing toggle ─────────────────────────────────── */
  var billing = document.querySelector("[data-billing-toggle]");
  if (billing) {
    var buttons = [].slice.call(billing.querySelectorAll("[data-cycle]"));
    var applyCycle = function (cycle) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-cycle") === cycle ? "true" : "false");
      });
      [].slice.call(document.querySelectorAll("[data-monthly]")).forEach(function (node) {
        var value = node.getAttribute(cycle === "annual" ? "data-annual" : "data-monthly");
        if (node.dataset.prefix) {
          node.textContent = node.dataset.prefix + value;
        } else {
          node.textContent = value;
        }
      });
      [].slice.call(document.querySelectorAll("[data-monthly-note]")).forEach(function (node) {
        node.textContent = node.getAttribute(cycle === "annual" ? "data-annual-note" : "data-monthly-note");
      });
    };
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { applyCycle(b.getAttribute("data-cycle")); });
    });
    applyCycle("monthly");
  }

  /* ─── 7. FAQ accordion ──────────────────────────────────── */
  var faqButtons = [].slice.call(document.querySelectorAll(".faq-q"));
  if (faqButtons.length) {
    faqButtons.forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) { return; }
      btn.__panel = panel;

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        if (open) {
          panel.style.height = panel.scrollHeight + "px";
          requestAnimationFrame(function () { panel.style.height = "0px"; });
          btn.setAttribute("aria-expanded", "false");
        } else {
          btn.setAttribute("aria-expanded", "true");
          panel.style.height = panel.scrollHeight + "px";
          panel.addEventListener("transitionend", function done(e) {
            if (e.propertyName !== "height") { return; }
            if (btn.getAttribute("aria-expanded") === "true") { panel.style.height = "auto"; }
            panel.removeEventListener("transitionend", done);
          });
        }
      });
    });
    window.addEventListener("resize", function () {
      faqButtons.forEach(function (btn) {
        var p = btn.__panel;
        if (btn.getAttribute("aria-expanded") === "true") { p.style.height = "auto"; }
      });
    });
    var openFromHash = function () {
      var id = location.hash.replace("#", "");
      if (!id) { return; }
      var target = document.querySelector('.faq-q[aria-controls="' + id + '"]');
      if (target && target.getAttribute("aria-expanded") !== "true") { target.click(); }
    };
    window.addEventListener("hashchange", openFromHash);
    openFromHash();
  }

  /* ─── 8. Support form ───────────────────────────────────── */
  var form = document.getElementById("support-form");
  if (form) {
    var status = document.getElementById("form-status");
    var EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var setError = function (wrap, message) {
      var out = wrap.querySelector(".err");
      wrap.setAttribute("data-invalid", message ? "true" : "false");
      if (out) { out.textContent = message || ""; }
      var field = wrap.querySelector("input, select, textarea");
      if (field) { field.setAttribute("aria-invalid", message ? "true" : "false"); }
    };

    var validateField = function (field) {
      var wrap = field.closest(".field-wrap") || field.closest(".check");
      if (!wrap) { return true; }
      var value = (field.value || "").trim();
      var message = "";

      if (field.hasAttribute("required") && !value) {
        message = "This field is required.";
      } else if (field.type === "email" && value && !EMAIL.test(value)) {
        message = "Enter a complete email address, like ada@example.com.";
      } else if (field.name === "message" && value && value.length < 20) {
        message = "A little more detail helps us answer in one reply — 20 characters minimum.";
      } else if (field.type === "checkbox" && field.hasAttribute("required") && !field.checked) {
        message = "Please confirm before sending.";
      }
      setError(wrap, message);
      return !message;
    };

    var fields = [].slice.call(form.querySelectorAll("input, select, textarea"));
    fields.forEach(function (field) {
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        var wrap = field.closest(".field-wrap");
        if (wrap && wrap.getAttribute("data-invalid") === "true") { validateField(field); }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      fields.forEach(function (field) {
        if (field.type === "checkbox" && !field.hasAttribute("required")) { return; }
        if (!validateField(field)) {
          ok = false;
          if (!firstBad) { firstBad = field; }
        }
      });
      if (!ok) {
        if (firstBad) { firstBad.focus(); }
        if (status) { status.setAttribute("data-show", "false"); }
        return;
      }
      var nameField = form.querySelector('[name="name"]');
      var firstName = String(nameField && nameField.value ? nameField.value : "there").split(" ")[0];
      var ticket = "MW-" + String(Math.floor(100000 + Math.random() * 899999));
      if (status) {
        while (status.firstChild) { status.removeChild(status.firstChild); }
        var lead = document.createElement("strong");
        lead.textContent = "Message sent, " + firstName + ".";
        status.appendChild(lead);
        status.appendChild(document.createTextNode(
          " Ticket " + ticket + " is queued — a human replies within four working hours, " +
          "and a copy lands in your inbox."
        ));
        status.setAttribute("data-show", "true");
        status.focus();
      }
      form.reset();
      fields.forEach(function (f) {
        var w = f.closest(".field-wrap");
        if (w) { setError(w, ""); }
      });
    });
  }
})();
