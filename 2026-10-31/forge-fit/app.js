/* ==========================================================================
   FORGE STRENGTH CLUB — shared behaviour
   Signature motion: (1) Magnetic primary buttons, (2) 3D card tilt + glare.
   Everything is guarded by element-existence checks so one file serves all pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var raf = window.requestAnimationFrame.bind(window);
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- 1. Mobile navigation ---------- */
  (function nav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("primary-nav");
    if (!toggle || !menu) return;

    var setOpen = function (open) {
      menu.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector(".nav-word").textContent = open ? "Close" : "Menu";
    };

    toggle.addEventListener("click", function () {
      setOpen(menu.getAttribute("data-open") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.getAttribute("data-open") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 940) setOpen(false);
    });
  })();

  /* ---------- 2. Keyboard chips: 1–5 jump to pages ---------- */
  (function hotkeys() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-key]"));
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("data-key")] = a.href; });

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      var url = map[e.key.toUpperCase()];
      if (url) { window.location.href = url; }
    });
  })();

  /* ---------- 3. Mission clock in the status bar ---------- */
  (function clock() {
    var el = document.querySelector("[data-clock]");
    if (!el) return;
    var start = Date.now();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var tick = function () {
      var s = Math.floor((Date.now() - start) / 1000);
      el.textContent = "T+" + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
      setTimeout(tick, 1000);
    };
    tick();

    var wall = document.querySelector("[data-wallclock]");
    if (wall) {
      var show = function () {
        var d = new Date();
        wall.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + " LOCAL";
      };
      show();
      setInterval(show, 1000);
    }
  })();

  /* ---------- 4. MAGNETIC BUTTONS ---------- */
  (function magnetic() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-magnetic]"));
    if (!nodes.length || reduce || !hoverable) return;

    var RADIUS = 120;
    var items = nodes.map(function (el) {
      return {
        el: el,
        rect: { cx: 0, cy: 0, hw: 0, hh: 0 },
        tx: 0, ty: 0, ts: 1,
        cx: 0, cy: 0, cs: 1,
        live: false
      };
    });
    var running = false;
    var px = -1e4, py = -1e4;

    var measure = function () {
      items.forEach(function (it) {
        var r = it.el.getBoundingClientRect();
        it.rect.cx = r.left + r.width / 2;
        it.rect.cy = r.top + r.height / 2;
        it.rect.hw = r.width / 2;
        it.rect.hh = r.height / 2;
      });
    };
    measure();

    var loop = function () {
      var busy = false;
      items.forEach(function (it) {
        it.cx = lerp(it.cx, it.tx, 0.2);
        it.cy = lerp(it.cy, it.ty, 0.2);
        it.cs = lerp(it.cs, it.ts, 0.2);
        var settled = Math.abs(it.cx - it.tx) < 0.08 && Math.abs(it.cy - it.ty) < 0.08 && Math.abs(it.cs - it.ts) < 0.0008;
        if (settled && it.tx === 0 && it.ty === 0) {
          it.cx = it.cy = 0;
          it.cs = 1;
        } else { busy = true; }
        it.el.style.transform = "translate3d(" + it.cx.toFixed(2) + "px," + it.cy.toFixed(2) + "px,0) scale(" + it.cs.toFixed(4) + ")";
      });
      if (busy) { raf(loop); } else { running = false; }
    };
    var start = function () { if (!running) { running = true; raf(loop); } };

    var target = function (it) {
      var dx = px - it.rect.cx;
      var dy = py - it.rect.cy;
      var ex = Math.max(Math.abs(dx) - it.rect.hw, 0);
      var ey = Math.max(Math.abs(dy) - it.rect.hh, 0);
      var edge = Math.hypot(ex, ey);
      if (edge > RADIUS) { it.tx = 0; it.ty = 0; it.ts = 1; return; }
      var pull = 1 - edge / RADIUS;
      var len = Math.hypot(dx, dy) || 1;
      var reach = 16 * pull * pull;
      it.tx = (dx / len) * reach;
      it.ty = (dy / len) * reach;
      it.ts = 1 + 0.04 * pull;
    };

    window.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      items.forEach(target);
      start();
    }, { passive: true });

    document.addEventListener("pointerleave", function () {
      px = py = -1e4;
      items.forEach(function (it) { it.tx = 0; it.ty = 0; it.ts = 1; });
      start();
    });

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
  })();

  /* ---------- 5. 3D CARD TILT + GLARE ---------- */
  (function tilt() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tilt]"));
    if (!cards.length || reduce || !hoverable) return;

    var MAX = 8;
    cards.forEach(function (card) {
      var st = { rx: 0, ry: 0, trx: 0, try_: 0, on: false, raf: 0 };

      var step = function () {
        st.rx = lerp(st.rx, st.trx, 0.16);
        st.ry = lerp(st.ry, st.try_, 0.16);
        var done = Math.abs(st.rx - st.trx) < 0.02 && Math.abs(st.ry - st.try_) < 0.02;
        if (done) {
          st.rx = st.trx; st.ry = st.try_;
          st.raf = 0;
          if (!st.on) { card.style.transform = ""; return; }
        }
        card.style.transform = "rotateX(" + st.rx.toFixed(2) + "deg) rotateY(" + st.ry.toFixed(2) + "deg) translateZ(0)";
        if (!done) st.raf = raf(step);
      };
      var kick = function () { if (!st.raf) st.raf = raf(step); };

      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width;
        var ny = (e.clientY - r.top) / r.height;
        st.trx = (0.5 - ny) * MAX * 2 * 0.8;
        st.try_ = (nx - 0.5) * MAX * 2 * 0.8;
        st.on = true;
        card.classList.add("is-tilting");
        card.style.setProperty("--gx", (nx * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (ny * 100).toFixed(1) + "%");
        kick();
      });

      card.addEventListener("pointerleave", function () {
        st.trx = 0; st.try_ = 0; st.on = false;
        card.classList.remove("is-tilting");
        kick();
      });
    });
  })();

  /* ---------- 6. Telemetry counters ---------- */
  (function counters() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!els.length) return;
    var fmt = function (n, dec) {
      return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    var run = function (el) {
      var to = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var dur = parseInt(el.getAttribute("data-dur") || "1200", 10);
      if (reduce) { el.textContent = fmt(to, dec); return; }
      var t0 = performance.now();
      var frame = function (now) {
        var p = Math.min((now - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e, dec);
        if (p < 1) raf(frame);
      };
      raf(frame);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 7. Schedule: filter by day ---------- */
  (function schedule() {
    var board = document.getElementById("week-grid");
    var filters = document.querySelectorAll("[data-day-filter]");
    if (!board || !filters.length) return;

    var rows = Array.prototype.slice.call(board.querySelectorAll("[data-day]"));
    var out = document.getElementById("week-count");
    var live = document.getElementById("week-status");

    var apply = function (day) {
      var shown = 0;
      rows.forEach(function (r) {
        var hit = day === "all" || r.getAttribute("data-day") === day;
        r.hidden = !hit;
        if (hit) shown++;
      });
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-day-filter") === day ? "true" : "false");
      });
      if (out) out.textContent = shown + (shown === 1 ? " Slot" : " Slots");
      if (live) live.textContent = "Showing " + shown + " slots for " + (day === "all" ? "the full week" : day) + ".";
    };

    filters.forEach(function (btn) {
      btn.addEventListener("click", function () { apply(btn.getAttribute("data-day-filter")); });
    });
    apply("all");

    var fromHash = function () {
      var d = (window.location.hash || "").replace("#", "").toLowerCase();
      if (d && d !== "main") {
        var hit = Array.prototype.some.call(filters, function (b) { return b.getAttribute("data-day-filter") === d; });
        if (hit) {
          apply(d);
          var target = document.getElementById(d);
          if (target) target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        }
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
  })();

  /* ---------- 8. Membership: billing cycle ---------- */
  (function cycle() {
    var btns = document.querySelectorAll("[data-cycle]");
    var prices = document.querySelectorAll("[data-monthly]");
    if (!btns.length || !prices.length) return;

    var set = function (mode) {
      prices.forEach(function (p) {
        var val = mode === "annual" ? p.getAttribute("data-annual") : p.getAttribute("data-monthly");
        p.textContent = val;
        var per = p.parentElement.querySelector("[data-per]");
        if (per) per.textContent = mode === "annual" ? "/year · billed once" : "/month";
      });
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-cycle") === mode ? "true" : "false"); });
      var note = document.getElementById("cycle-note");
      if (note) {
        note.textContent = mode === "annual"
          ? "Annual commitment. Two months on the house — cancel any time after month 12."
          : "Month to month. Pause up to 60 days a year for travel or injury blocks.";
      }
    };
    btns.forEach(function (b) {
      b.addEventListener("click", function () { set(b.getAttribute("data-cycle")); });
    });
    set("monthly");
  })();

  /* ---------- 9. BMI instrument ---------- */
  (function bmi() {
    var widget = document.getElementById("bmi-calc");
    if (!widget) return;

    var unitBtns = widget.querySelectorAll("[data-unit]");
    var hIn = widget.querySelector("#bmi-height");
    var wIn = widget.querySelector("#bmi-weight");
    var hLbl = widget.querySelector('label[for="bmi-height"]');
    var wLbl = widget.querySelector('label[for="bmi-weight"]');
    var hHint = widget.querySelector("#bmi-height-hint");
    var wHint = widget.querySelector("#bmi-weight-hint");
    var num = widget.querySelector("#bmi-value");
    var cat = widget.querySelector("#bmi-category");
    var rng = widget.querySelector("#bmi-range");
    var needle = widget.querySelector(".needle");
    var guidance = widget.querySelector("#bmi-guidance");

    var band = [
      { max: 18.5, name: "Sub-18.5 · Under-fuelled", note: "Calories are your limiting factor. Build the platform before the totals: eat at maintenance-plus and add condition first." },
      { max: 25, name: "18.5–24.9 · Working band", note: "Range looks healthy for a general population. With iron work you may sit higher on the scale and still be lean — measure waist, lifts, and recovery instead." },
      { max: 30, name: "25–29.9 · Carrying extra", note: "If this is mass from the platform, ignore the readout. If it is central weight and your conditioning is weak, run the engine block twice a week plus a 300 kcal deficit." },
      { max: Infinity, name: "30+ · Load-flagged", note: "Start with the chassis and engine tracks before heavy axial work — mobilities and low-impact condition first, then add the barbell." }
    ];

    var metric = true;

    var read = function () {
      var h = parseFloat(hIn.value);
      var w = parseFloat(wIn.value);
      if (!h || !w || h <= 0 || w <= 0) {
        num.textContent = "--.-";
        num.classList.remove("volt");
        cat.textContent = "Awaiting input";
        rng.textContent = "Enter a height and a weight to plot the readout.";
        guidance.textContent = "This is a screening tool, not a diagnosis. Body-fat percentage and lift totals tell us far more than BMI does.";
        needle.style.left = "0%";
        return;
      }

      var value, metres, kg;
      if (metric) {
        metres = h / 100;
        kg = w;
        value = kg / (metres * metres);
      } else {
        var inches = h;
        metres = inches * 0.0254;
        kg = w * 0.45359237;
        value = (kg / (metres * metres));
      }
      if (!isFinite(value) || value <= 0) return;

      num.textContent = value.toFixed(1);
      num.classList.add("volt");

      var b = band[0];
      for (var i = 0; i < band.length; i++) { if (value < band[i].max) { b = band[i]; break; } }
      cat.textContent = b.name;
      guidance.textContent = b.note;

      var lo = 18.5 * metres * metres;
      var hi = 24.9 * metres * metres;
      rng.textContent = metric
        ? "Reference mass for your frame: " + lo.toFixed(0) + "–" + hi.toFixed(0) + " kg."
        : "Reference mass for your frame: " + (lo / 0.45359237).toFixed(0) + "–" + (hi / 0.45359237).toFixed(0) + " lb.";

      var span = 40 - 14;
      var pos = Math.min(Math.max((value - 14) / span, 0), 1);
      needle.style.left = (pos * 100).toFixed(1) + "%";
    };

    var setUnit = function (isMetric) {
      metric = isMetric;
      hIn.placeholder = isMetric ? "178" : "70";
      wIn.placeholder = isMetric ? "86" : "190";
      hLbl.textContent = isMetric ? "Height (cm)" : "Height (inches)";
      wLbl.textContent = isMetric ? "Mass (kg)" : "Mass (lb)";
      hIn.setAttribute("aria-describedby", "bmi-height-hint");
      if (hHint) hHint.textContent = isMetric ? "Centimetres, e.g. 178." : "Total inches, e.g. 70 = 5 ft 10 in.";
      if (wHint) wHint.textContent = isMetric ? "Kilograms, e.g. 86." : "Pounds, e.g. 190.";
      unitBtns.forEach(function (u) { u.setAttribute("aria-pressed", (u.getAttribute("data-unit") === "metric") === isMetric ? "true" : "false"); });
      read();
    };

    unitBtns.forEach(function (btn) {
      btn.addEventListener("click", function () { setUnit(btn.getAttribute("data-unit") === "metric"); });
    });
    [hIn, wIn].forEach(function (i) { i.addEventListener("input", read); });
    setUnit(true);
  })();

  /* ---------- 10. Trial signup form ---------- */
  (function trial() {
    var form = document.getElementById("trial-form");
    if (!form) return;

    var status = document.getElementById("trial-status");
    var rules = {
      "full-name": function (v) { return v.trim().length >= 2 ? "" : "Enter the name on your membership."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email so we can send your gate code."; },
      mobile: function (v) { return v.replace(/\D/g, "").length >= 7 ? "" : "Enter a reachable mobile number."; },
      "goal-track": function (v) { return v ? "" : "Pick the track you want to start on."; },
      "start-day": function (v) { return v ? "" : "Pick a day for your first session."; },
      consent: function (v, el) { return el.checked ? "" : "We need this to book your facility tour."; }
    };

    var validate = function (input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var msg = rule(input.value, input);
      var field = input.closest(".field");
      if (field) {
        field.setAttribute("data-state", msg ? "invalid" : "valid");
        var err = field.querySelector(".err");
        if (err) err.textContent = msg || "";
      }
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
      var bad = inputs.filter(function (i) { return !validate(i); });
      if (bad.length) {
        status.setAttribute("data-tone", "err");
        status.textContent = "Hold — " + bad.length + " field" + (bad.length > 1 ? "s need" : " needs") + " attention.";
        bad[0].focus();
        return;
      }
      var name = (form.querySelector("#full-name") || {}).value || "";
      var track = form.querySelector("#goal-track");
      var day = form.querySelector("#start-day");
      status.setAttribute("data-tone", "ok");
      status.textContent = "Log received. See you on the platform.";
      var done = document.getElementById("trial-done");
      if (done) {
        done.hidden = false;
        done.querySelector("[data-done-name]").textContent = name.trim().split(/\s+/)[0];
        done.querySelector("[data-done-track]").textContent = track.options[track.selectedIndex].text;
        done.querySelector("[data-done-day]").textContent = day.options[day.selectedIndex].text;
        form.setAttribute("aria-hidden", "true");
        Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
        done.setAttribute("tabindex", "-1");
        done.focus();
      }
    });

    form.addEventListener("blur", function (e) {
      if (e.target.name && rules[e.target.name]) validate(e.target);
    }, true);
  })();

  /* ---------- 11. Footer year ---------- */
  (function year() {
    var els = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(els, function (el) { el.textContent = y; });
  })();

})();
