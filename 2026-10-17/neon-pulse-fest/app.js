/* ==========================================================================
   NEON PULSE — shared behavior
   Every module is guarded by element-existence checks so one file serves
   all pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("site-nav-mobile");

  if (toggle && mobileNav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      mobileNav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        var firstLink = mobileNav.querySelector("a");
        if (firstLink) firstLink.focus();
      } else {
        toggle.focus();
      }
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
      }
    });

    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && mobileNav.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  /* ---------- Countdown (index hero) ---------- */
  var countdown = document.querySelector("[data-countdown]");

  if (countdown) {
    var target = new Date(countdown.getAttribute("data-countdown"));
    var slots = {
      days: countdown.querySelector("[data-slot='days']"),
      hours: countdown.querySelector("[data-slot='hours']"),
      minutes: countdown.querySelector("[data-slot='minutes']"),
      seconds: countdown.querySelector("[data-slot='seconds']")
    };

    var pad = function (n, width) {
      var s = String(n);
      while (s.length < (width || 2)) s = "0" + s;
      return s;
    };

    var renderCountdown = function () {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        countdown.classList.add("countdown--done");
        Object.keys(slots).forEach(function (k) {
          if (slots[k]) slots[k].textContent = "00";
        });
        var label = countdown.querySelector(".countdown__done-label");
        if (label) label.textContent = "The gates are open. Pulse is live.";
        clearInterval(timerId);
        return;
      }
      var totalSeconds = Math.floor(diff / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;
      if (slots.days) slots.days.textContent = pad(days, days > 99 ? 3 : 2);
      if (slots.hours) slots.hours.textContent = pad(hours);
      if (slots.minutes) slots.minutes.textContent = pad(minutes);
      if (slots.seconds) slots.seconds.textContent = pad(seconds);
    };

    renderCountdown();
    var timerId = setInterval(renderCountdown, 1000);
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");

  if (counters.length) {
    var easeOutExpo = function (t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    var runCounter = function (el) {
      var targetVal = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-count-suffix") || "";
      if (reduceMotion) {
        el.textContent = targetVal.toLocaleString("en-US") + suffix;
        return;
      }
      var duration = 1200;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var value = Math.round(targetVal * easeOutExpo(p));
        el.textContent = value.toLocaleString("en-US") + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------- 3D card tilt (signature motion) ---------- */
  var tiltCards = document.querySelectorAll(".tilt");

  if (tiltCards.length && canHover && !reduceMotion) {
    var MAX_TILT = 8;

    tiltCards.forEach(function (card) {
      var glare = card.querySelector(".tilt__glare");
      var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
      var rafId = null;
      var hovering = false;

      var tick = function () {
        currentX += (targetX - currentX) * 0.15;
        currentY += (targetY - currentY) * 0.15;
        card.style.setProperty("--tilt-x", currentX.toFixed(3) + "deg");
        card.style.setProperty("--tilt-y", currentY.toFixed(3) + "deg");
        var settled = Math.abs(targetX - currentX) < 0.01 && Math.abs(targetY - currentY) < 0.01;
        if (settled && !hovering) {
          rafId = null;
          return;
        }
        rafId = requestAnimationFrame(tick);
      };

      card.addEventListener("pointerenter", function () {
        hovering = true;
        card.classList.add("is-tilting");
        if (!rafId) rafId = requestAnimationFrame(tick);
      });

      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        targetX = (0.5 - py) * MAX_TILT * 2 * -1;
        targetY = (px - 0.5) * MAX_TILT * 2;
        if (glare) {
          glare.style.setProperty("--glare-x", (px * 100).toFixed(1) + "%");
          glare.style.setProperty("--glare-y", (py * 100).toFixed(1) + "%");
        }
        if (!rafId) rafId = requestAnimationFrame(tick);
      });

      card.addEventListener("pointerleave", function () {
        hovering = false;
        targetX = 0;
        targetY = 0;
        card.classList.remove("is-tilting");
        if (!rafId) rafId = requestAnimationFrame(tick);
      });
    });
  }

  /* ---------- Lineup filter (lineup page) ---------- */
  var filterRoot = document.querySelector("[data-lineup]");

  if (filterRoot) {
    var filterButtons = filterRoot.querySelectorAll(".filter-btn");
    var artistCards = Array.prototype.slice.call(filterRoot.querySelectorAll(".artist-card"));
    var daySections = Array.prototype.slice.call(filterRoot.querySelectorAll("[data-day-section]"));
    var countEl = filterRoot.querySelector("[data-lineup-count]");
    var state = { day: "all", stage: "all" };

    var applyFilters = function () {
      var visible = 0;
      artistCards.forEach(function (card) {
        var dayOk = state.day === "all" || card.getAttribute("data-day") === state.day;
        var stageOk = state.stage === "all" || card.getAttribute("data-stage") === state.stage;
        var show = dayOk && stageOk;
        card.classList.toggle("is-hidden", !show);
        if (show) visible += 1;
      });
      daySections.forEach(function (section) {
        var hasVisible = section.querySelector(".artist-card:not(.is-hidden)");
        section.hidden = !hasVisible;
      });
      if (countEl) {
        countEl.textContent = "";
        var strong = document.createElement("strong");
        strong.textContent = String(visible);
        countEl.appendChild(strong);
        countEl.appendChild(document.createTextNode(" of " + artistCards.length + " featured acts"));
      }
    };

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.getAttribute("data-filter-group");
        var value = btn.getAttribute("data-value");
        state[group] = value;
        filterRoot.querySelectorAll('.filter-btn[data-filter-group="' + group + '"]').forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === btn));
        });
        applyFilters();
      });
    });

    applyFilters();
  }

  /* ---------- FAQ accordion ---------- */
  var accordion = document.querySelector("[data-accordion]");

  if (accordion) {
    accordion.querySelectorAll(".accordion__button").forEach(function (button) {
      button.addEventListener("click", function () {
        var expanded = button.getAttribute("aria-expanded") === "true";
        var panel = document.getElementById(button.getAttribute("aria-controls"));
        button.setAttribute("aria-expanded", String(!expanded));
        if (panel) panel.classList.toggle("is-open", !expanded);
      });
    });
  }

  /* ---------- Form validation ---------- */
  var wireForm = function (form) {
    var status = form.querySelector("[data-form-status]");
    var setStatus = function (message, kind) {
      if (!status) return;
      status.textContent = message;
      status.className = "form__status" + (kind ? " " + kind : "");
    };

    var validateField = function (input) {
      var field = input.closest(".field");
      if (!field) return true;
      var errorEl = field.querySelector(".error-msg");
      var value = (input.value || "").trim();
      var message = "";

      if (input.hasAttribute("required") && !value) {
        message = "This field is required.";
      } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        message = "Enter a valid email address, like you@domain.com.";
      } else if (input.tagName === "SELECT" && input.hasAttribute("required") && !value) {
        message = "Choose an option from the list.";
      }

      if (message) {
        field.classList.add("has-error");
        input.setAttribute("aria-invalid", "true");
        if (errorEl) errorEl.textContent = message;
        return false;
      }
      field.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
      return true;
    };

    form.querySelectorAll("input, textarea, select").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("has-error")) validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll("input, textarea, select"));
      var firstBad = null;
      var allOk = true;
      inputs.forEach(function (input) {
        if (!validateField(input)) {
          allOk = false;
          if (!firstBad) firstBad = input;
        }
      });
      if (!allOk) {
        setStatus("Check the highlighted fields and try again.", "err");
        if (firstBad) firstBad.focus();
        return;
      }
      var name = form.querySelector("[data-form-name]");
      var greeting = name && name.value.trim() ? ", " + name.value.trim().split(" ")[0] : "";
      setStatus("Signal received" + greeting + ". The Pulse crew replies within two nights.", "ok");
      form.reset();
    });
  };

  document.querySelectorAll("form[data-validate]").forEach(wireForm);

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
