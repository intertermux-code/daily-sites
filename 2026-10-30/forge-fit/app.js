/* ==========================================================================
   FORGE — shared behaviour
   Signature motion: (1) animated counters, (2) magnetic primary buttons.
   Everything else is progressive enhancement, guarded by element checks.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- 1. Nav */
  function initNav() {
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("primary-nav");
    var scrim = document.querySelector(".nav-scrim");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-locked", open);
      if (scrim) scrim.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    if (scrim) scrim.addEventListener("click", function () { setOpen(false); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 900) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* --------------------------------------------------- 2. Animated counters */
  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function formatCount(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    if (isNaN(target)) return;
    var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
    var prefix = el.getAttribute("data-count-prefix") || "";
    var suffix = el.getAttribute("data-count-suffix") || "";
    var duration = parseInt(el.getAttribute("data-count-duration") || "1200", 10);

    if (reduceMotion) {
      el.textContent = prefix + formatCount(target, decimals) + suffix;
      return;
    }

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      el.textContent = prefix + formatCount(target * easeOutExpo(progress), decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = prefix + formatCount(target, decimals) + suffix;
      }
    }
    el.textContent = prefix + formatCount(0, decimals) + suffix;
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-count-to]"));
    if (!nodes.length) return;

    nodes.forEach(function (el) {
      var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      var prefix = el.getAttribute("data-count-prefix") || "";
      var suffix = el.getAttribute("data-count-suffix") || "";
      el.textContent = prefix + formatCount(0, decimals) + suffix;
    });

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(runCounter);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        runCounter(entry.target);
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });

    nodes.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------- 3. Magnetic buttons */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-magnetic]"));
    if (!els.length) return;

    var RADIUS = 120;
    var MAX_SHIFT = 18;
    var buttons = els.map(function (el) {
      return {
        el: el,
        tx: 0, ty: 0, x: 0, y: 0,
        tscale: 1, scale: 1,
        rect: null,
        running: false
      };
    });

    function measure(b) {
      var r = b.el.getBoundingClientRect();
      b.rect = {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        w: r.width
      };
    }

    function tick() {
      var anyActive = false;

      for (var i = 0; i < buttons.length; i++) {
        var b = buttons[i];
        if (!b.rect) measure(b);

        b.x += (b.tx - b.x) * 0.18;
        b.y += (b.ty - b.y) * 0.18;
        b.scale += (b.tscale - b.scale) * 0.18;

        var settled = Math.abs(b.tx - b.x) < 0.05 &&
                      Math.abs(b.ty - b.y) < 0.05 &&
                      Math.abs(b.tscale - b.scale) < 0.001;

        if (settled) {
          if (b.x !== 0 || b.y !== 0 || b.scale !== 1) {
            b.x = b.y = 0;
            b.scale = 1;
            b.el.style.transform = "translate3d(0,0,0) scale(1)";
          }
          continue;
        }
        anyActive = true;
        b.el.style.transform =
          "translate3d(" + b.x.toFixed(2) + "px," + b.y.toFixed(2) + "px,0) scale(" + b.scale.toFixed(4) + ")";
      }

      if (anyActive) {
        window.__forgeMagneticRaf = requestAnimationFrame(tick);
      } else {
        window.__forgeMagneticRaf = null;
      }
    }

    function start() {
      if (!window.__forgeMagneticRaf) window.__forgeMagneticRaf = requestAnimationFrame(tick);
    }

    function onMove(e) {
      for (var i = 0; i < buttons.length; i++) {
        var b = buttons[i];
        if (!b.rect) measure(b);
        var dx = e.clientX - b.rect.cx;
        var dy = e.clientY - b.rect.cy;
        var edge = Math.max(b.rect.w / 2, 40);
        var nearest = Math.sqrt(Math.max(dx * dx - edge * edge, 0) + Math.max(dy * dy - edge * edge, 0));
        var dist = nearest;

        if (dist > RADIUS) {
          b.tx = 0; b.ty = 0; b.tscale = 1;
          continue;
        }
        var pull = 1 - dist / RADIUS;
        var eased = pull * pull;
        b.tx = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dx * 0.32 * eased));
        b.ty = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dy * 0.42 * eased));
        b.tscale = 1 + 0.04 * eased;
      }
      start();
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", function () {
      buttons.forEach(function (b) { b.rect = null; });
    }, { passive: true });
    window.addEventListener("resize", function () {
      buttons.forEach(function (b) { b.rect = null; });
    });
    window.addEventListener("blur", function () {
      buttons.forEach(function (b) { b.tx = 0; b.ty = 0; b.tscale = 1; });
      start();
    });
  }

  /* ------------------------------------------------ 4. Schedule filtering */
  function initScheduleFilter() {
    var table = document.getElementById("schedule-table");
    var dayBar = document.getElementById("day-filters");
    if (!table || !dayBar) return;

    var typeBar = document.getElementById("type-filters");
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-day]"));
    var countOut = document.getElementById("schedule-count");
    var liveOut = document.getElementById("schedule-live");
    var emptyOut = document.getElementById("schedule-empty");
    var day = dayBar.getAttribute("data-active") || "all";
    var type = typeBar ? typeBar.getAttribute("data-active") || "all" : "all";

    var hashDay = (location.hash || "").replace("#", "").toLowerCase();
    if (hashDay && dayBar.querySelector('.chip[data-day="' + hashDay + '"]')) {
      day = hashDay;
    }

    function labelOf(bar, value) {
      var chip = bar ? bar.querySelector('.chip[data-' + (bar === dayBar ? "day" : "type") + '="' + value + '"]') : null;
      return chip ? chip.textContent.trim() : value;
    }

    function typeOf(row) {
      if (row.getAttribute("data-type")) return row.getAttribute("data-type");
      var name = row.querySelector(".t-class");
      if (!name) return "open";
      var text = name.textContent.toLowerCase();
      if (text.indexOf("open floor") > -1) return "open";
      if (text.indexOf("mobility") > -1 || text.indexOf("rebuild") > -1) return "mobility";
      if (text.indexOf("hiit") > -1 || text.indexOf("conditioning") > -1) return "hiit";
      if (text.indexOf("powerlifting") > -1 || text.indexOf("barbell") > -1 || text.indexOf("meet") > -1) return "powerlifting";
      return "open";
    }

    function apply(bar, value, attr) {
      Array.prototype.forEach.call(bar.querySelectorAll(".chip"), function (chip) {
        chip.setAttribute("aria-pressed", chip.getAttribute("data-" + attr) === value ? "true" : "false");
      });
      bar.setAttribute("data-active", value);
    }

    function render() {
      var visible = 0;
      rows.forEach(function (row) {
        var okDay = day === "all" || row.getAttribute("data-day") === day;
        var okType = type === "all" || typeOf(row) === type;
        var show = okDay && okType;
        row.classList.toggle("is-hidden-row", !show);
        if (show) visible++;
      });
      if (countOut) {
        countOut.textContent = visible === 1 ? "1 class on the board" : visible + " classes on the board";
      }
      if (liveOut) {
        var scope = day === "all" ? "the whole week" : labelOf(dayBar, day);
        var disc = type === "all" ? "every discipline" : labelOf(typeBar, type).toLowerCase();
        liveOut.textContent = "Showing " + scope + " — " + disc + ". " +
          (visible === 1 ? "1 class matches." : visible + " classes match.");
      }
      if (emptyOut) emptyOut.classList.toggle("is-visible", visible === 0);
    }

    dayBar.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      day = chip.getAttribute("data-day");
      apply(dayBar, day, "day");
      render();
    });

    if (typeBar) {
      typeBar.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        type = chip.getAttribute("data-type");
        apply(typeBar, type, "type");
        render();
      });
    }

    window.addEventListener("hashchange", function () {
      var next = (location.hash || "").replace("#", "").toLowerCase();
      if (!next || !dayBar.querySelector('.chip[data-day="' + next + '"]')) return;
      day = next;
      apply(dayBar, day, "day");
      render();
    });

    apply(dayBar, day, "day");
    if (typeBar) apply(typeBar, type, "type");
    render();
  }

  /* ---------------------------------------------------- 5. BMI calculator */
  function initBmiCalc() {
    var form = document.getElementById("bmi-form");
    if (!form) return;

    var out = document.getElementById("bmi-value");
    var catOut = document.getElementById("bmi-category");
    var noteOut = document.getElementById("bmi-note");
    var marker = document.getElementById("bmi-marker");
    var facts = {
      healthy: document.getElementById("bmi-healthy"),
      mass: document.getElementById("bmi-mass"),
      bsa: document.getElementById("bmi-bsa")
    };
    var metric = true;

    function unitInputs() {
      return {
        h: parseFloat(form.elements[metric ? "height" : "heightImp"].value),
        w: parseFloat(form.elements[metric ? "weight" : "weightImp"].value)
      };
    }

    function setMode(isMetric) {
      metric = isMetric;
      Array.prototype.forEach.call(form.querySelectorAll("input[name='units']"), function (radio) {
        radio.checked = (radio.value === "metric") === isMetric;
      });
      var metricFields = form.querySelectorAll(".metric-only");
      var impFields = form.querySelectorAll(".imperial-only");
      Array.prototype.forEach.call(metricFields, function (f) {
        f.hidden = !isMetric;
        f.querySelectorAll("input").forEach(function (i) { i.disabled = !isMetric; });
      });
      Array.prototype.forEach.call(impFields, function (f) {
        f.hidden = isMetric;
        f.querySelectorAll("input").forEach(function (i) { i.disabled = isMetric; });
      });
    }

    function classify(bmi) {
      if (bmi < 18.5) return {
        label: "Underweight range",
        note: "Fuel first. We build mass with a supervised strength block and a calorie target you can actually eat."
      };
      if (bmi < 25) return {
        label: "Mid-range reference band",
        note: "BMI treats muscle and fat the same. If you lift, your number reads high — check our lifts and body-composition session instead."
      };
      if (bmi < 30) return {
        label: "Above reference band",
        note: "A good starting point for three sessions a week: two strength, one conditioning."
      };
      if (bmi < 35) return {
        label: "Class I — above reference band",
        note: "Start with mobility and machine-free strength work. Our Foundation track is built for exactly this."
      };
      return {
        label: "Class II — above reference band",
        note: "Book a movement screen with a coach before loading. We will progress from the floor up."
      };
    }

    function gaugePosition(bmi) {
      // Track spans BMI 14 → 40 across four segments.
      var pct = (Math.min(Math.max(bmi, 14), 40) - 14) / 26;
      return Math.round(pct * 100);
    }

    function render() {
      var vals = unitInputs();
      var h = vals.h, w = vals.w;
      var bmi;

      if (metric) {
        if (!h || !w || h < 100 || h > 230 || w < 30 || w > 250) return blank("Enter a height between 100–230 cm and a weight between 30–250 kg.");
        bmi = w / Math.pow(h / 100, 2);
      } else {
        if (!h || !w || h < 40 || h > 90 || w < 66 || w > 550) return blank("Enter a height between 40–90 in and a weight between 66–550 lb.");
        bmi = (703 * w) / Math.pow(h, 2);
      }

      var info = classify(bmi);
      out.textContent = bmi.toFixed(1);
      out.classList.remove("is-empty");
      catOut.textContent = info.label;
      noteOut.textContent = info.note;
      marker.classList.add("is-visible");
      marker.style.left = gaugePosition(bmi) + "%";

      if (metric) {
        var lo = (18.5 * Math.pow(h / 100, 2)).toFixed(1);
        var hi = (24.9 * Math.pow(h / 100, 2)).toFixed(1);
        facts.healthy.textContent = lo + "–" + hi + " kg";
        facts.mass.textContent = w.toFixed(1) + " kg";
        facts.bsa.textContent = (Math.sqrt((h * w) / 3600)).toFixed(2) + " m²";
      } else {
        var loI = ((18.5 * Math.pow(h, 2)) / 703).toFixed(1);
        var hiI = ((24.9 * Math.pow(h, 2)) / 703).toFixed(1);
        facts.healthy.textContent = loI + "–" + hiI + " lb";
        facts.mass.textContent = w.toFixed(1) + " lb";
        var cm = h * 2.54, kg = w * 0.4536;
        facts.bsa.textContent = (Math.sqrt((cm * kg) / 3600)).toFixed(2) + " m²";
      }
    }

    function blank(message) {
      out.textContent = "—";
      out.classList.add("is-empty");
      catOut.textContent = "Awaiting measurements";
      noteOut.textContent = message;
      marker.classList.remove("is-visible");
      facts.healthy.textContent = "—";
      facts.mass.textContent = "—";
      facts.bsa.textContent = "—";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      render();
    });
    form.addEventListener("input", function (e) {
      if (e.target.name === "units") {
        setMode(e.target.value === "metric");
      }
      render();
    });
    form.addEventListener("change", function (e) {
      if (e.target.name === "units") {
        setMode(e.target.value === "metric");
      }
      render();
    });

    setMode(true);
    blank("Enter your height and weight for a reference number.");
  }

  /* ------------------------------------------------------- 6. Form checks */
  function initForms() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("form[data-validate]"));
    if (!forms.length) return;

    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    function fieldOf(input) { return input.closest(".field"); }

    function setError(input, message) {
      var wrap = fieldOf(input);
      if (!wrap) return;
      wrap.classList.add("has-error");
      var box = wrap.querySelector(".field__error");
      if (box) box.textContent = message;
      input.setAttribute("aria-invalid", "true");
    }

    function clearError(input) {
      var wrap = fieldOf(input);
      if (!wrap) return;
      wrap.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
    }

    function validateInput(input) {
      if (input.type === "checkbox") {
        if (input.hasAttribute("required") && !input.checked) {
          setError(input, (input.getAttribute("data-label") || "This confirmation") + " is required before we can book you in.");
          return false;
        }
        clearError(input);
        return true;
      }
      var value = (input.value || "").trim();
      if (input.hasAttribute("required") && !value) {
        setError(input, (input.getAttribute("data-label") || "This field") + " is required.");
        return false;
      }
      if (!value) { clearError(input); return true; }
      if (input.type === "email" && !emailRe.test(value)) {
        setError(input, "Enter a valid email address, for example you@email.com.");
        return false;
      }
      if (input.type === "tel" && value.replace(/\D/g, "").length < 10) {
        setError(input, "Enter a phone number with at least 10 digits.");
        return false;
      }
      if (input.type === "number" && input.min && parseFloat(value) < parseFloat(input.min)) {
        setError(input, "Enter a value of " + input.min + " or more.");
        return false;
      }
      if (input.minLength && value.length < input.minLength) {
        setError(input, "Use at least " + input.minLength + " characters.");
        return false;
      }
      clearError(input);
      return true;
    }

    forms.forEach(function (form) {
      var status = form.querySelector(".form-status");
      var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));

      inputs.forEach(function (input) {
        input.addEventListener("blur", function () { validateInput(input); });
        input.addEventListener("input", function () {
          if (fieldOf(input) && fieldOf(input).classList.contains("has-error")) validateInput(input);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstBad = null;
        var ok = true;

        inputs.forEach(function (input) {
          if (input.disabled || input.hidden) return;
          if (!validateInput(input)) {
            ok = false;
            if (!firstBad) firstBad = input;
          }
        });

        if (!ok) {
          if (status) {
            status.setAttribute("data-status", "error");
            status.textContent = "Check the highlighted fields and send again.";
            status.classList.add("is-visible");
          }
          if (firstBad) firstBad.focus();
          return;
        }

        var name = (form.elements["firstname"] || {}).value || "";
        var chosen = (form.elements["program"] || {}).value || "";
        var when = (form.elements["date"] || {}).value || "";
        var message;

        if (form.hasAttribute("data-success-lead")) {
          message = form.getAttribute("data-success-lead");
        } else {
          message = "Request logged.";
        }
        if (name) message += " Thanks " + name.split(" ")[0] + " —";
        if (chosen) message += " " + chosen;
        if (when) message += ", preferred date " + new Date(when + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + ".";
        message += " A coach replies within one business day.";

        if (status) {
          status.setAttribute("data-status", "ok");
          status.textContent = message;
          status.classList.add("is-visible");
        }
        form.reset();
        inputs.forEach(clearError);
      });
    });
  }

  /* ------------------------------------------------------ 7. Small extras */
  function initFooterYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (n) { n.textContent = year; });
  }

  function initToTop() {
    var btn = document.querySelector(".to-top");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var skip = document.querySelector(".skip-link");
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  function initMinDates() {
    Array.prototype.forEach.call(document.querySelectorAll("input[type='date'][data-min-offset]"), function (input) {
      var offset = parseInt(input.getAttribute("data-min-offset"), 10) || 1;
      var d = new Date(Date.now() + offset * 86400000);
      input.setAttribute("min", d.toISOString().slice(0, 10));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initCounters();
    initMagnetic();
    initScheduleFilter();
    initBmiCalc();
    initForms();
    initFooterYear();
    initToTop();
    initMinDates();
  });
})();
