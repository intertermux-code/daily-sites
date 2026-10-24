/* FORGE — shared behaviour. All features guarded by element checks. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      toggle.textContent = open ? "≡" : "×";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "≡";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") toggle.click();
    });
  }

  /* ---------- Cursor spotlight (hero) — rAF throttled ---------- */
  var heroes = document.querySelectorAll(".hero, .page-hero");
  if (heroes.length && !reduceMotion) {
    var pending = false;
    var last = { x: 0.7, y: 0.3 };
    function paint() {
      pending = false;
      heroes.forEach(function (h) {
        var spot = h.querySelector(".hero__spotlight");
        if (spot) {
          spot.style.setProperty("--mx", (last.x * 100).toFixed(1) + "%");
          spot.style.setProperty("--my", (last.y * 100).toFixed(1) + "%");
        }
      });
    }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      last.x = e.clientX / window.innerWidth;
      last.y = e.clientY / window.innerHeight;
      if (!pending) {
        pending = true;
        requestAnimationFrame(paint);
      }
    }, { passive: true });
  }

  /* ---------- Clip-path image reveal + content reveals ---------- */
  var revealTargets = document.querySelectorAll(".reveal-img, .reveal");
  if (revealTargets.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
      revealTargets.forEach(function (t) { io.observe(t); });
    } else {
      revealTargets.forEach(function (t) { t.classList.add("is-in"); });
    }
  }

  /* ---------- Stat count-up ---------- */
  var statNums = document.querySelectorAll("[data-count]");
  if (statNums.length) {
    function runCount(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion || !("requestAnimationFrame" in window)) {
        el.textContent = target + suffix;
        return;
      }
      var start = null;
      var dur = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCount(entry.target);
            sio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      statNums.forEach(function (n) { sio.observe(n); });
    } else {
      statNums.forEach(runCount);
    }
  }

  /* ---------- Schedule filter (schedule.html) ---------- */
  var dayButtons = document.querySelectorAll("[data-day-filter]");
  var schedRows = document.querySelectorAll("[data-day]");
  if (dayButtons.length && schedRows.length) {
    var emptyMsg = document.querySelector(".sched-empty");
    dayButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var day = btn.getAttribute("data-day-filter");
        dayButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        var shown = 0;
        schedRows.forEach(function (row) {
          var match = day === "all" || row.getAttribute("data-day") === day;
          row.hidden = !match;
          if (match) shown++;
        });
        if (emptyMsg) emptyMsg.hidden = shown > 0;
      });
    });
  }

  /* ---------- BMI calculator (membership.html) ---------- */
  var bmiForm = document.getElementById("bmi-form");
  if (bmiForm) {
    var heightIn = document.getElementById("bmi-height");
    var weightLb = document.getElementById("bmi-weight");
    var metricFields = bmiForm.querySelectorAll(".bmi-metric");
    var outNum = document.getElementById("bmi-num");
    var outCat = document.getElementById("bmi-cat");
    var outNote = document.getElementById("bmi-note");
    var marker = document.getElementById("bmi-marker");

    function setUnit(isMetric) {
      metricFields.forEach(function (f) { f.hidden = !isMetric; });
      bmiForm.querySelectorAll(".bmi-imperial").forEach(function (f) {
        f.hidden = isMetric;
      });
    }

    bmiForm.querySelectorAll("input[name='bmi-unit']").forEach(function (radio) {
      radio.addEventListener("change", function () {
        setUnit(radio.value === "metric");
        compute();
      });
    });

    function placeMarker(pct) {
      if (!marker) return;
      var bar = marker.parentElement;
      var w = bar ? bar.clientWidth : 0;
      marker.style.transform = "translateX(" + ((pct / 100) * Math.max(w - 4, 0)).toFixed(1) + "px)";
    }

    function compute() {
      var unitEl = bmiForm.querySelector("input[name='bmi-unit']:checked");
      var metric = unitEl && unitEl.value === "metric";
      var h, w;
      if (metric) {
        h = parseFloat(document.getElementById("bmi-cm").value);
        w = parseFloat(document.getElementById("bmi-kg").value);
      } else {
        h = parseFloat(heightIn.value);
        w = parseFloat(weightLb.value);
        if (h && w) { h = h * 2.54; w = w * 0.45359237; }
      }
      if (!h || !w || h <= 0 || w <= 0) {
        outNum.textContent = "—";
        outCat.textContent = "Enter height and weight";
        outNote.textContent = "";
        placeMarker(50);
        return;
      }
      var m = h / 100;
      var bmi = w / (m * m);
      var cat, note;
      if (bmi < 18.5) {
        cat = "Underweight — build phase";
        note = "Our Hypertrophy track adds lean mass with structured progressive overload.";
      } else if (bmi < 25) {
        cat = "Healthy range — train hard";
        note = "You are in a strong baseline. Rotate Powerlifting and Conditioning to keep advancing.";
      } else if (bmi < 30) {
        cat = "Above range — recomposition";
        note = "MetCon 45 plus two lift sessions per week is the typical Forge starting point.";
      } else {
        cat = "Above range — start low-impact";
        note = "Start with Mobility Lab and two Kettlebell Club sessions a week, then add conditioning. A coach review comes with every membership.";
      }
      outNum.textContent = bmi.toFixed(1);
      outCat.textContent = cat;
      outNote.textContent = note;
      placeMarker(((bmi - 14) / (36 - 14)) * 100);
    }

    ["bmi-height", "bmi-weight", "bmi-cm", "bmi-kg"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", compute);
    });
    compute();
  }

  /* ---------- Trial signup form (membership.html) ---------- */
  var trialForm = document.getElementById("trial-form");
  if (trialForm) {
    trialForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      trialForm.querySelectorAll("[data-required]").forEach(function (input) {
        var err = input.closest(".field").querySelector(".err");
        var ok = input.value.trim() !== "";
        if (input.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        input.setAttribute("aria-invalid", String(!ok));
        if (err) err.classList.toggle("show", !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      var success = document.getElementById("trial-success");
      if (success) {
        success.hidden = false;
        success.focus();
      }
      trialForm.reset();
    });
  }

  /* ---------- Contact form (contact-less sites keep this inert) ---------- */
  var genericForm = document.querySelector("[data-notice-form]");
  if (genericForm) {
    genericForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var box = genericForm.querySelector(".form-success");
      if (box) { box.hidden = false; box.focus(); }
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
