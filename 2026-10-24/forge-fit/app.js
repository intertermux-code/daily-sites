/* ==========================================================================
   FORGE — shared behaviour
   Motion identity: animated counters (easeOutExpo) + marquee ticker (CSS)
   Every block is guarded by element existence so one file serves all pages.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  /* ------------------------------------------------------------------ nav */
  function initNav() {
    var toggle = document.querySelector(".nav__toggle");
    var panel = document.getElementById("primary-nav");
    if (!toggle || !panel) return;

    var label = toggle.querySelector(".nav__toggle-label");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      if (label) label.textContent = open ? "Close" : "Menu";
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (!e.target.closest(".nav")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1000) setOpen(false);
    });
  }

  /* -------------------------------------------------- animated counters */
  function formatNumber(value, decimals) {
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
    var duration = 1200;

    if (reduceMotion) {
      el.textContent = prefix + formatNumber(target, decimals) + suffix;
      return;
    }

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      el.textContent = prefix + formatNumber(target * easeOutExpo(p), decimals) + suffix;
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = prefix + formatNumber(target, decimals) + suffix;
      }
    }
    el.textContent = prefix + formatNumber(0, decimals) + suffix;
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var nodes = document.querySelectorAll("[data-count-to]");
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, runCounter);
      return;
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || seen.has(entry.target)) return;
          seen.add(entry.target);
          runCounter(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );

    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ------------------------------------------- ledger rows -> detail view */
  function initLedger() {
    var triggers = document.querySelectorAll(".row__btn[aria-controls]");
    if (!triggers.length) return;

    Array.prototype.forEach.call(triggers, function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;

      btn.addEventListener("click", function () {
        var expanded = btn.getAttribute("aria-expanded") === "true";

        if (expanded) {
          btn.setAttribute("aria-expanded", "false");
          panel.classList.remove("is-visible");
          window.setTimeout(function () {
            if (btn.getAttribute("aria-expanded") === "false") panel.classList.remove("is-open");
          }, reduceMotion ? 0 : 240);
          return;
        }

        btn.setAttribute("aria-expanded", "true");
        panel.classList.add("is-open");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            panel.classList.add("is-visible");
          });
        });
      });
    });
  }

  /* --------------------------------------------------- schedule filtering */
  function initSchedule() {
    var chips = document.querySelectorAll("[data-day-filter]");
    var rows = document.querySelectorAll("[data-day]");
    if (!chips.length || !rows.length) return;

    var chipsType = document.querySelectorAll("[data-class-filter]");
    var count = document.getElementById("sched-count");
    var live = document.getElementById("sched-live");
    var empty = document.getElementById("sched-empty");
    var day = "ALL";
    var discipline = "ALL";

    function apply() {
      var shown = 0;

      Array.prototype.forEach.call(rows, function (row) {
        var dayOk = day === "ALL" || row.getAttribute("data-day") === day;
        var typeOk = discipline === "ALL" || row.getAttribute("data-class") === discipline;
        var visible = dayOk && typeOk;
        row.hidden = !visible;
        if (visible) shown += 1;
      });

      if (count) {
        count.textContent = shown === 1 ? "1 session listed" : shown + " sessions listed";
      }
      if (empty) empty.hidden = shown !== 0;
      if (live) {
        live.textContent = "Filter: " + day + " / " + discipline + " — " + shown + " sessions shown";
      }
    }

    function bind(group, setter) {
      Array.prototype.forEach.call(group, function (chip) {
        chip.addEventListener("click", function () {
          Array.prototype.forEach.call(group, function (c) {
            c.setAttribute("aria-pressed", String(c === chip));
          });
          setter(chip.getAttribute(
            group === chips ? "data-day-filter" : "data-class-filter"
          ));
          apply();
        });
      });
    }

    bind(chips, function (value) { day = value; });
    bind(chipsType, function (value) { discipline = value; });

    var wantClass = (new URLSearchParams(window.location.search).get("class") || "").toUpperCase();
    if (/^[A-Z]+$/.test(wantClass)) {
      var preset = document.querySelector('[data-class-filter="' + wantClass + '"]');
      if (preset) preset.click();
    }

    apply();
  }

  /* -------------------------------------------------------- BMI calculator */
  function initBmi() {
    var form = document.getElementById("bmi-form");
    if (!form) return;

    var valueEl = document.getElementById("bmi-value");
    var catEl = document.getElementById("bmi-cat");
    var noteEl = document.getElementById("bmi-note");
    var marker = document.getElementById("bmi-marker");
    var rangeEl = document.getElementById("bmi-range");
    var stateEl = document.getElementById("bmi-state");
    var unitChips = document.querySelectorAll("[data-unit]");
    var groups = document.querySelectorAll("[data-unit-group]");

    var scale = { min: 12, max: 42 };

    var bands = [
      { max: 18.5, name: "Underweight", hint: "Fuel up: lean toward the 3x/week Hypertrophy ledger and add 300 kcal on training days." },
      { max: 25, name: "Healthy range", hint: "Good base. Progress the Comp Lifts block and keep two conditioning sessions weekly." },
      { max: 30, name: "Overweight", hint: "Start with Engine Room + Mobility, three sessions weekly. Resistance training beats steady cardio here." },
      { max: 35, name: "Obesity I", hint: "Book the On-Ramp assessment first. Loaded carries and rows protect your joints while you build capacity." },
      { max: 99, name: "Obesity II+", hint: "Talk to a coach and your physician before loading. We will program around your current range of motion." }
    ];

    function setUnit(unit) {
      Array.prototype.forEach.call(unitChips, function (c) {
        c.setAttribute("aria-pressed", String(c.getAttribute("data-unit") === unit));
      });
      Array.prototype.forEach.call(groups, function (g) {
        g.hidden = g.getAttribute("data-unit-group") !== unit;
      });
      form.setAttribute("data-unit-active", unit);
    }

    Array.prototype.forEach.call(unitChips, function (chip) {
      chip.addEventListener("click", function () { setUnit(chip.getAttribute("data-unit")); });
    });
    setUnit("metric");

    function categorise(bmi) {
      for (var i = 0; i < bands.length; i += 1) {
        if (bmi < bands[i].max) return bands[i];
      }
      return bands[bands.length - 1];
    }

    function render(bmi) {
      var rounded = Math.round(bmi * 10) / 10;
      valueEl.textContent = rounded.toFixed(1);
      var band = categorise(rounded);
      catEl.textContent = band.name;
      noteEl.textContent = band.hint;
      var pct = ((rounded - scale.min) / (scale.max - scale.min)) * 100;
      marker.style.left = Math.max(0, Math.min(100, pct)) + "%";
      rangeEl.textContent = rounded.toFixed(1) + " BMI — " + band.name;
      if (stateEl) stateEl.textContent = "calculated " + new Date().toLocaleTimeString("en-GB", { hour12: false });
    }

    function clearErrors() {
      Array.prototype.forEach.call(form.querySelectorAll(".field"), function (f) {
        f.classList.remove("has-error");
        var e = f.querySelector(".field__error");
        if (e) e.textContent = "";
      });
    }

    function fail(input, message) {
      var field = input.closest(".field");
      if (!field) return;
      field.classList.add("has-error");
      var out = field.querySelector(".field__error");
      if (out) out.textContent = message;
      input.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();

      var unit = form.getAttribute("data-unit-active") || "metric";
      var bmi = null;

      if (unit === "metric") {
        var cm = parseFloat(form.heightCm.value);
        var kg = parseFloat(form.weightKg.value);
        if (!(cm >= 100 && cm <= 230)) { fail(form.heightCm, "Enter height between 100 and 230 cm"); return; }
        if (!(kg >= 30 && kg <= 250)) { fail(form.weightKg, "Enter mass between 30 and 250 kg"); return; }
        bmi = kg / Math.pow(cm / 100, 2);
      } else {
        var ft = parseFloat(form.heightFt.value) || 0;
        var inch = parseFloat(form.heightIn.value) || 0;
        var lb = parseFloat(form.weightLb.value);
        var totalIn = ft * 12 + inch;
        if (!(totalIn >= 44 && totalIn <= 90)) { fail(form.heightFt, "Enter height between 3'8\" and 7'6\""); return; }
        if (!(lb >= 70 && lb <= 550)) { fail(form.weightLb, "Enter weight between 70 and 550 lb"); return; }
        bmi = (703 * lb) / Math.pow(totalIn, 2);
      }

      render(bmi);
      document.getElementById("bmi-results").scrollIntoView({
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  }

  /* ---------------------------------------------------------- trial form */
  function statusLine(parent, prompt, text, tone) {
    var p = document.createElement("span");
    p.className = "term__prompt";
    p.textContent = prompt;
    parent.appendChild(p);
    parent.appendChild(document.createTextNode(" "));
    var v = document.createElement(tone ? "strong" : "span");
    if (tone) {
      v.textContent = tone;
      parent.appendChild(v);
      parent.appendChild(document.createTextNode(" "));
      var rest = document.createElement("span");
      rest.textContent = text;
      parent.appendChild(rest);
    } else {
      v.style.color = "var(--ember)";
      v.textContent = text;
      parent.appendChild(v);
    }
    parent.appendChild(document.createElement("br"));
  }

  function initTrial() {
    var form = document.getElementById("trial-form");
    if (!form) return;

    var status = document.getElementById("trial-status");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setStatus(builder) {
      if (!status) return;
      status.hidden = false;
      while (status.firstChild) status.removeChild(status.firstChild);
      builder(status);
    }

    function setError(input, message) {
      var field = input.closest(".field");
      if (!field) return;
      field.classList.add("has-error");
      var out = field.querySelector(".field__error");
      if (out) out.textContent = message;
      input.setAttribute("aria-invalid", "true");
    }

    function clearErrors() {
      Array.prototype.forEach.call(form.querySelectorAll(".field"), function (f) {
        f.classList.remove("has-error");
        var out = f.querySelector(".field__error");
        if (out) out.textContent = "";
      });
      Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (i) {
        i.removeAttribute("aria-invalid");
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();

      var firstBad = null;
      function check(input, ok, message) {
        if (ok) return;
        setError(input, message);
        if (!firstBad) firstBad = input;
      }

      var name = form.trialName;
      var email = form.trialEmail;
      var phone = form.trialPhone;
      var goal = form.trialGoal;
      var slot = form.trialSlot;
      var consent = form.trialConsent;

      check(name, name.value.trim().length >= 2, "Enter your full name");
      check(email, emailRe.test(email.value.trim()), "Enter a valid email address");
      check(phone, phone.value.replace(/\D/g, "").length >= 9, "Enter a reachable phone number");
      check(goal, goal.value !== "", "Choose a primary goal");
      check(slot, slot.value !== "", "Choose a trial slot");
      if (!consent.checked) {
        var consentField = consent.closest(".field");
        if (consentField) {
          consentField.classList.add("has-error");
          var out = consentField.querySelector(".field__error");
          if (out) out.textContent = "Accept the rules to continue";
        }
        if (!firstBad) firstBad = consent;
      }

      if (firstBad) {
        firstBad.focus();
        setStatus(function (frag) {
          statusLine(frag, "forge@floor ~ %", "submit --trial: " + 1 + " or more fields failed validation. Fix the highlighted rows and resubmit.", null);
        });
        return;
      }

      var ref = "FRG-" + String(Date.now()).slice(-6);
      var when = slot.options[slot.selectedIndex].textContent;
      var who = name.value.trim().split(" ")[0];
      var mail = email.value.trim();

      setStatus(function (frag) {
        statusLine(frag, "forge@floor ~ %", "register --trial " + ref.toLowerCase(), null);
        statusLine(frag, "", "Slot held for " + who + " — " + when, "[ ok ]");
        statusLine(frag, "", "Confirmation sent to " + mail, "[ ok ]");
        statusLine(frag, "", "Reference " + ref + " — bring photo ID. Arrive 15 minutes early for your assessment.", "[ ok ]");
      });

      form.reset();
      window.setTimeout(function () { status.focus(); }, 60);
    });
  }

  /* ------------------------------------------------- terminal boot lines */
  function initBoot() {
    var block = document.querySelector("[data-boot]");
    if (!block) return;

    var lines = Array.prototype.slice.call(block.querySelectorAll("[data-boot-line]"));
    if (reduceMotion) {
      lines.forEach(function (l) { l.hidden = false; });
      return;
    }

    lines.forEach(function (l) { l.style.opacity = "0"; l.style.transform = "translateY(4px)"; });

    window.setTimeout(function () {
      lines.forEach(function (l, i) {
        window.setTimeout(function () {
          l.hidden = false;
          l.style.transition = "opacity 220ms linear, transform 220ms cubic-bezier(.2,.8,.2,1)";
          requestAnimationFrame(function () {
            l.style.opacity = "1";
            l.style.transform = "translateY(0)";
          });
        }, i * 260);
      });
    }, 220);
  }

  /* ---------------------------------------------------------- misc glue */
  function initMisc() {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    var clock = document.getElementById("clock");
    if (clock) {
      var tick = function () {
        var d = new Date();
        clock.textContent = d.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
      };
      tick();
      window.setInterval(tick, 1000);
    }

    // Open a ledger row from a deep link, e.g. programs.html#prog-hiit
    var hash = window.location.hash.replace("#", "");
    if (hash) {
      var target = document.getElementById(hash);
      if (target && target.classList.contains("row__panel")) {
        var btn = document.querySelector('[aria-controls="' + hash + '"]');
        if (btn && btn.getAttribute("aria-expanded") !== "true") btn.click();
      } else if (target && target.classList.contains("row__btn")) {
        target.click();
      }
    }
  }

  ready(function () {
    initNav();
    initCounters();
    initLedger();
    initSchedule();
    initBmi();
    initTrial();
    initBoot();
    initMisc();
  });
})();
