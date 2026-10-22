/* ==========================================================================
   FORGE — shared behaviour
   Signature motion: clip-path image reveal + magnetic primary buttons
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* ---------- Primary motion: clip-path reveal ---------- */
  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Secondary motion: magnetic buttons ---------- */
  function initMagnetic() {
    var items = document.querySelectorAll("[data-magnetic]");
    if (!items.length || reduce || !fine) return;

    var RADIUS = 120;
    var MAX = 14;

    items.forEach(function (el) {
      var state = { tx: 0, ty: 0, cx: 0, cy: 0, scale: 1, cscale: 1, raf: null };

      function lerp(a, b, n) { return a + (b - a) * n; }

      function frame() {
        state.cx = lerp(state.cx, state.tx, 0.16);
        state.cy = lerp(state.cy, state.ty, 0.16);
        state.cscale = lerp(state.cscale, state.scale, 0.16);
        el.style.transform =
          "translate3d(" + state.cx.toFixed(2) + "px," + state.cy.toFixed(2) + "px,0) scale(" + state.cscale.toFixed(3) + ")";
        var settled =
          Math.abs(state.cx - state.tx) < 0.1 &&
          Math.abs(state.cy - state.ty) < 0.1 &&
          Math.abs(state.cscale - state.scale) < 0.001;
        if (settled) {
          state.cx = state.tx; state.cy = state.ty; state.cscale = state.scale;
          state.raf = null;
          if (state.tx === 0 && state.ty === 0 && state.scale === 1) el.style.transform = "";
          return;
        }
        state.raf = requestAnimationFrame(frame);
      }

      function run() { if (!state.raf) state.raf = requestAnimationFrame(frame); }

      function onMove(e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var dist = Math.hypot(dx, dy);
        var reach = Math.max(r.width, r.height) / 2 + RADIUS;
        if (dist > reach) { release(); return; }
        var pull = 1 - dist / reach;
        state.tx = Math.max(-MAX, Math.min(MAX, dx * 0.35 * pull));
        state.ty = Math.max(-MAX, Math.min(MAX, dy * 0.35 * pull));
        state.scale = 1 + 0.04 * pull;
        run();
      }

      function release() {
        state.tx = 0; state.ty = 0; state.scale = 1;
        run();
      }

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", release);
      el.addEventListener("focus", function () { state.scale = 1.02; run(); });
      el.addEventListener("blur", release);
    });

    /* Cursor proximity field: buttons attract pointer events from the grid */
    document.addEventListener("mouseleave", function () {
      items.forEach(function (el) { el.style.transform = ""; });
    });
  }

  /* ---------- Ledger rows: expand into detail view ---------- */
  function initLedger() {
    var heads = document.querySelectorAll("[data-ledger-head]");
    if (!heads.length) return;

    heads.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var entry = btn.closest("[data-ledger-entry]");
        if (!entry) return;
        var open = entry.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        var body = document.getElementById(btn.getAttribute("aria-controls"));
        if (body) body.hidden = !open;
      });
    });

    var allBtn = document.querySelector("[data-ledger-all]");
    if (allBtn) {
      allBtn.addEventListener("click", function () {
        var entries = document.querySelectorAll("[data-ledger-entry]");
        var expanding = allBtn.getAttribute("data-ledger-all") === "expand";
        entries.forEach(function (entry) {
          var head = entry.querySelector("[data-ledger-head]");
          var body = head ? document.getElementById(head.getAttribute("aria-controls")) : null;
          entry.classList.toggle("is-open", expanding);
          if (head) head.setAttribute("aria-expanded", expanding ? "true" : "false");
          if (body) body.hidden = !expanding;
        });
        allBtn.setAttribute("data-ledger-all", expanding ? "collapse" : "expand");
        allBtn.textContent = expanding ? "Collapse all rows" : "Expand all rows";
      });
    }
  }

  /* ---------- Schedule: filter by weekday ---------- */
  function initScheduleFilter() {
    var bar = document.querySelector("[data-schedule]");
    if (!bar) return;

    var chips = bar.querySelectorAll("[data-day]");
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-schedule-row]"));
    var out = document.querySelector("[data-schedule-count]");
    var empty = document.querySelector("[data-schedule-empty]");

    function apply(day) {
      var shown = 0;
      rows.forEach(function (row) {
        var match = day === "all" || row.getAttribute("data-day") === day;
        row.hidden = !match;
        if (match) shown += 1;
      });
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-day") === day ? "true" : "false");
      });
      if (out) {
        out.textContent = shown + (shown === 1 ? " session" : " sessions") +
          (day === "all" ? " · full week" : " · " + dayLabel(day));
      }
      if (empty) empty.hidden = shown !== 0;
    }

    function dayLabel(day) {
      var map = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
      return map[day] || day;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { apply(chip.getAttribute("data-day")); });
    });

    var preset = new URLSearchParams(window.location.search).get("day");
    if (preset && ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "all"].indexOf(preset) > -1) {
      apply(preset);
    } else {
      apply("all");
    }
  }

  /* ---------- BMI calculator ---------- */
  function initBmi() {
    var form = document.querySelector("[data-bmi]");
    if (!form) return;

    var heightEl = form.querySelector("[data-bmi-height]");
    var weightEl = form.querySelector("[data-bmi-weight]");
    var valueEl = document.querySelector("[data-bmi-value]");
    var bandEl = document.querySelector("[data-bmi-band]");
    var noteEl = document.querySelector("[data-bmi-note]");
    var scaleEl = document.querySelector("[data-bmi-scale]");
    var units = "metric";

    function bands(system) {
      return system === "metric"
        ? [
            { key: "under", label: "Under 18.5", test: function (v) { return v < 18.5; } },
            { key: "mid", label: "18.5 – 24.9", test: function (v) { return v >= 18.5 && v < 25; } },
            { key: "over", label: "25 – 29.9", test: function (v) { return v >= 25 && v < 30; } },
            { key: "high", label: "30+", test: function (v) { return v >= 30; } }
          ]
        : [
            { key: "under", label: "Under 18.5", test: function (v) { return v < 18.5; } },
            { key: "mid", label: "18.5 – 24.9", test: function (v) { return v >= 18.5 && v < 25; } },
            { key: "over", label: "25 – 29.9", test: function (v) { return v >= 25 && v < 30; } },
            { key: "high", label: "30+", test: function (v) { return v >= 30; } }
          ];
    }

    function setUnit(next) {
      if (next === units) return;
      units = next;
      form.querySelectorAll("[data-unit]").forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-unit") === next ? "true" : "false");
      });
      if (next === "metric") {
        heightEl.previousElementSibling.textContent = "Height (cm)";
        weightEl.previousElementSibling.textContent = "Body mass (kg)";
        heightEl.placeholder = "182";
        weightEl.placeholder = "88";
      } else {
        heightEl.previousElementSibling.textContent = "Height (in)";
        weightEl.previousElementSibling.textContent = "Body mass (lb)";
        heightEl.placeholder = "72";
        weightEl.placeholder = "194";
      }
      compute();
    }

    function compute() {
      var h = parseFloat(heightEl.value);
      var w = parseFloat(weightEl.value);
      var set = bands(units);

      if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) {
        valueEl.textContent = "––";
        bandEl.textContent = "Awaiting input";
        noteEl.textContent = "Enter a height and a body mass to calculate.";
        scaleEl.querySelectorAll("div").forEach(function (d) { d.classList.remove("is-active"); });
        return;
      }

      var bmi = units === "metric" ? w / Math.pow(h / 100, 2) : (703 * w) / Math.pow(h, 2);
      var rounded = Math.round(bmi * 10) / 10;
      valueEl.textContent = rounded.toFixed(1);

      var active = null;
      set.forEach(function (b) { if (b.test(bmi)) active = b; });
      bandEl.textContent = active ? "Band: " + active.label : "Out of range";

      noteEl.textContent = guidance(bmi, w, units);

      var cells = scaleEl.querySelectorAll("div");
      cells.forEach(function (cell, i) {
        cell.classList.toggle("is-active", set[i] === active);
      });
    }

    function guidance(bmi, mass, system) {
      var kg = system === "metric" ? mass : mass * 0.45359237;
      if (bmi < 18.5) {
        return "Below the reference band. Coaches front-load hypertrophy and a calorie surplus — expect 4 sessions per week plus the 07:00 mobility clinic.";
      }
      if (bmi < 25) {
        return "Inside the reference band at roughly " + kg.toFixed(0) + " kg. The standard Powerlifting track applies; no staging required.";
      }
      if (bmi < 30) {
        return "Above the reference band. Start on Metcon HIIT twice weekly and add two heavy compound sessions — body mass usually drops 6–9 kg across the first block.";
      }
      return "Well above the reference band. Book an In-Tent assessment first: we screen movement and load the barbell from chair height before any maximal work.";
    }

    form.addEventListener("input", compute);
    form.querySelectorAll("[data-unit]").forEach(function (btn) {
      btn.addEventListener("click", function () { setUnit(btn.getAttribute("data-unit")); });
    });
    compute();
  }

  /* ---------- Trial signup form ---------- */
  function initTrialForm() {
    var form = document.querySelector("[data-trial-form]");
    if (!form) return;

    var status = document.querySelector("[data-trial-status]");
    var fields = {
      name: form.querySelector("[name='name']"),
      email: form.querySelector("[name='email']"),
      phone: form.querySelector("[name='phone']"),
      goal: form.querySelector("[name='goal']"),
      slot: form.querySelector("[name='slot']"),
      consent: form.querySelector("[name='consent']")
    };

    function showError(input, message) {
      var wrap = input.closest(".field");
      var out = wrap ? wrap.querySelector(".error") : null;
      input.setAttribute("aria-invalid", "true");
      if (out) out.textContent = message;
    }

    function clearError(input) {
      var wrap = input.closest(".field");
      var out = wrap ? wrap.querySelector(".error") : null;
      input.removeAttribute("aria-invalid");
      if (out) out.textContent = "";
    }

    function validate() {
      var ok = true;
      var first = null;

      Object.keys(fields).forEach(function (key) {
        var el = fields[key];
        if (el) clearError(el);
      });

      if (fields.name && fields.name.value.trim().length < 2) {
        showError(fields.name, "Enter your full name");
        ok = false; first = first || fields.name;
      }

      if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.value.trim())) {
        showError(fields.email, "Enter a valid email address");
        ok = false; first = first || fields.email;
      }

      var digits = fields.phone ? fields.phone.value.replace(/\D/g, "") : "";
      if (fields.phone && digits.length < 10) {
        showError(fields.phone, "Enter 10 or more digits");
        ok = false; first = first || fields.phone;
      }

      if (fields.goal && !fields.goal.value) {
        showError(fields.goal, "Select a training track");
        ok = false; first = first || fields.goal;
      }

      if (fields.slot && !fields.slot.value) {
        showError(fields.slot, "Select a preferred slot");
        ok = false; first = first || fields.slot;
      }

      if (fields.consent && !fields.consent.checked) {
        var cwrap = fields.consent.closest(".check");
        var cout = cwrap ? cwrap.parentElement.querySelector(".error") : null;
        if (cout) cout.textContent = "Consent is required to book a slot";
        ok = false; first = first || fields.consent;
      }

      if (first) first.focus();
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (status) status.hidden = true;

      if (!validate()) {
        if (status) {
          status.hidden = false;
          status.textContent = "Request blocked — fix the highlighted fields and resend.";
          status.setAttribute("role", "alert");
        }
        return;
      }

      var name = fields.name ? fields.name.value.trim().split(/\s+/)[0] : "athlete";
      var goal = fields.goal ? fields.goal.options[fields.goal.selectedIndex].text : "your track";
      var slot = fields.slot ? fields.slot.options[fields.slot.selectedIndex].text : "the weekday AM block";

      if (status) {
        status.hidden = false;
        status.setAttribute("role", "status");
        status.textContent =
          "Logged. " + name + " — your free " + goal + " session is provisionally held for " +
          slot + ". A coach confirms by text within 3 working hours. Reference " + ref() + ".";
      }
      form.reset();
    });

    function ref() {
      var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      var s = "FRG-";
      for (var i = 0; i < 5; i += 1) s += chars.charAt(Math.floor(Math.random() * chars.length));
      return s;
    }
  }

  /* ---------- Footer stamp ---------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function init() {
    initNav();
    initReveal();
    initMagnetic();
    initLedger();
    initScheduleFilter();
    initBmi();
    initTrialForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
