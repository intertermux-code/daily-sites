/* ============================================================
   FORGE — shared behaviour
   Every block is guarded by element existence, so this one file
   is safe to load on every page.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("primary-nav");

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && nav.classList.contains("open")) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 928 && nav.classList.contains("open")) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Scroll progress bar ---------- */
  var scan = document.querySelector(".scan");
  if (scan) {
    var ticking = false;
    var setProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      scan.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(setProgress);
        }
      },
      { passive: true }
    );
    setProgress();
  }

  /* ---------- Blur-Fade Ascend (primary motion) ----------
     Siblings inside a [data-stagger] group enter 80ms apart. */
  var revealTargets = document.querySelectorAll(".reveal");
  if (revealTargets.length && !reduceMotion && "IntersectionObserver" in window) {
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var step = 0;
      group.querySelectorAll(".reveal").forEach(function (el) {
        el.style.setProperty("--delay", step + "ms");
        step += 80;
      });
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Clip-Path Image Reveal (secondary motion) ---------- */
  var clipTargets = document.querySelectorAll(".clip");
  if (clipTargets.length && !reduceMotion && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    clipTargets.forEach(function (el, i) {
      el.style.setProperty("--delay", (i % 3) * 90 + "ms");
      cio.observe(el);
    });
  } else {
    clipTargets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Count-up statistics ---------- */
  var nums = document.querySelectorAll("[data-count]");
  if (nums.length) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }
      var start = performance.now();
      var dur = 1200;
      var tick = function (now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(target * eased);
        el.textContent = val.toLocaleString() + suffix;
        if (p < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      var nio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runCount(entry.target);
              nio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      nums.forEach(function (el) { nio.observe(el); });
    } else {
      nums.forEach(runCount);
    }
  }

  /* ---------- Schedule filter (schedule.html) ---------- */
  var filterBar = document.getElementById("day-filters");
  var scheduleRows = document.querySelectorAll("#schedule-table tbody tr");

  if (filterBar && scheduleRows.length) {
    var countOut = document.getElementById("class-count");
    var buttons = filterBar.querySelectorAll(".filter");

    var applyFilter = function (day) {
      var shown = 0;
      scheduleRows.forEach(function (row) {
        var match = day === "all" || row.getAttribute("data-day") === day;
        row.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      if (countOut) {
        countOut.textContent =
          day === "all"
            ? "Showing all " + shown + " classes across the week"
            : shown + " class" + (shown === 1 ? "" : "es") + " on " + day;
      }
    };

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      applyFilter(btn.getAttribute("data-day"));
    });

    /* Deep link: schedule.html#friday jumps straight to that day */
    var hash = window.location.hash.replace("#", "");
    var preselect = filterBar.querySelector('[data-day="' + hash + '"]');
    if (preselect) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b === preselect ? "true" : "false");
      });
      applyFilter(hash);
    }
  }

  /* ---------- BMI calculator (membership.html) ---------- */
  var bmiForm = document.getElementById("bmi-form");
  if (bmiForm) {
    var unitState = "metric";
    var segs = bmiForm.querySelectorAll("[data-unit]");
    var hField = document.getElementById("bmi-height");
    var wField = document.getElementById("bmi-weight");
    var hLabel = document.getElementById("bmi-height-label");
    var wLabel = document.getElementById("bmi-weight-label");
    var hHint = document.getElementById("bmi-height-hint");
    var wHint = document.getElementById("bmi-weight-hint");
    var out = document.getElementById("bmi-value");
    var band = document.getElementById("bmi-band");
    var note = document.getElementById("bmi-note");
    var fill = document.getElementById("bmi-fill");

    var bands = [
      { max: 18.5, name: "Under-fuelled", copy: "Too light for heavy work. We build you up before we load you up — start on the Foundation track." },
      { max: 25, name: "Training weight", copy: "You are in the working range. Barbell density and conditioning two-to-four times a week is the right dose." },
      { max: 30, name: "Carrying load", copy: "Extra mass on frame. Conditioning-first for eight weeks, then we add barbell volume as your joints earn it." },
      { max: 100, name: "Heavy frame", copy: "You are carrying serious weight. Low-impact strength work and mobility first — talk to Ada before round two." }
    ];

    var setUnits = function (unit) {
      unitState = unit;
      segs.forEach(function (s) {
        s.setAttribute("aria-pressed", s.getAttribute("data-unit") === unit ? "true" : "false");
      });
      if (unit === "metric") {
        hLabel.textContent = "Height (cm)";
        wLabel.textContent = "Weight (kg)";
        hHint.textContent = "Example: 178";
        wHint.textContent = "Example: 84";
        hField.placeholder = "178";
        wField.placeholder = "84";
      } else {
        hLabel.textContent = "Height (inches)";
        wLabel.textContent = "Weight (pounds)";
        hHint.textContent = "Example: 70";
        wHint.textContent = "Example: 185";
        hField.placeholder = "70";
        wField.placeholder = "185";
      }
      compute();
    };

    var compute = function () {
      var h = parseFloat(hField.value);
      var w = parseFloat(wField.value);
      if (!h || !w || h <= 0 || w <= 0) {
        out.textContent = "--";
        band.textContent = "Enter height and weight";
        note.textContent = "Your number appears here the moment both fields hold a value.";
        fill.style.width = "0%";
        return;
      }
      var bmi;
      if (unitState === "metric") {
        bmi = w / Math.pow(h / 100, 2);
      } else {
        bmi = (703 * w) / Math.pow(h, 2);
      }
      if (!isFinite(bmi) || bmi <= 0 || bmi > 100) {
        out.textContent = "--";
        band.textContent = "Check those numbers";
        note.textContent = "That reading is off our scale. Re-enter height and weight.";
        fill.style.width = "0%";
        return;
      }
      var rounded = Math.round(bmi * 10) / 10;
      out.textContent = rounded.toFixed(1);
      fill.style.width = Math.min(bmi / 40, 1) * 100 + "%";
      var pick = bands.filter(function (b) { return bmi < b.max; })[0] || bands[bands.length - 1];
      band.textContent = "BMI " + rounded.toFixed(1) + " — " + pick.name;
      note.textContent = pick.copy;
    };

    segs.forEach(function (s) {
      s.addEventListener("click", function () { setUnits(s.getAttribute("data-unit")); });
    });
    hField.addEventListener("input", compute);
    wField.addEventListener("input", compute);
    bmiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      compute();
    });
    setUnits("metric");
  }

  /* ---------- Trial signup form (membership.html) ---------- */
  var trialForm = document.getElementById("trial-form");
  if (trialForm) {
    var status = document.getElementById("trial-status");

    var showError = function (input, message) {
      var box = document.getElementById(input.id + "-error");
      input.setAttribute("aria-invalid", "true");
      if (box) {
        box.textContent = message;
        box.classList.add("show");
      }
    };

    var clearError = function (input) {
      var box = document.getElementById(input.id + "-error");
      input.removeAttribute("aria-invalid");
      if (box) box.classList.remove("show");
    };

    var validators = {
      "trial-name": function (v) { return v.trim().length >= 2 ? "" : "Give us a name so the front desk knows who to wave in."; },
      "trial-email": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "That email does not look right — check for a typo."; },
      "trial-phone": function (v) {
        var digits = v.replace(/\D/g, "");
        if (digits.length === 0) return "";
        return digits.length >= 8 ? "" : "Use at least 8 digits, or leave it blank.";
      },
      "trial-program": function (v) { return v ? "" : "Pick the session you want to try first."; },
      "trial-day": function (v) { return v ? "" : "Choose the day that suits you."; },
      "trial-consent": function (v, el) { return el.checked ? "" : "We need your OK before we hold a slot for you."; }
    };

    Object.keys(validators).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var evt = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "blur";
      el.addEventListener(evt, function () {
        var msg = validators[id](el.value || "", el);
        if (msg) showError(el, msg);
        else clearError(el);
      });
    });

    trialForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(validators).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var msg = validators[id](el.value || "", el);
        if (msg) {
          showError(el, msg);
          if (!firstBad) firstBad = el;
        } else {
          clearError(el);
        }
      });

      if (firstBad) {
        firstBad.focus();
        if (status) {
          status.classList.remove("show");
        }
        return;
      }

      var name = document.getElementById("trial-name").value.trim().split(" ")[0];
      var prog = document.getElementById("trial-program");
      var day = document.getElementById("trial-day");
      var progLabel = prog.options[prog.selectedIndex].text;
      var dayLabel = day.options[day.selectedIndex].text;

      if (status) {
        status.textContent =
          "Slot held — " + name + ", you are on the " + progLabel + " session for " + dayLabel +
          ". We email your gate code within one hour.";
        status.classList.add("show");
        status.setAttribute("role", "status");
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      trialForm.reset();
    });
  }

  /* ---------- FAQ accordion (membership.html, programs.html) ---------- */
  var faq = document.querySelector(".faq");
  if (faq) {
    faq.addEventListener("click", function (e) {
      var btn = e.target.closest(".faq-q");
      if (!btn) return;
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.classList.toggle("show", !open);
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
