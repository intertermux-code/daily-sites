/* LumiDent — shared behaviour. Page features are guarded by element checks. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Mobile navigation                                                   */
  /* ------------------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Decode Text — hero keyword cycles glyphs, then resolves. Runs once. */
  /* ------------------------------------------------------------------ */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@0123456789/*<>";

  function decodeElement(el) {
    var target = el.getAttribute("data-decode") || el.textContent;
    if (reducedMotion) {
      el.textContent = target;
      return;
    }
    var frame = 0;
    var settlePerChar = 3;
    var totalFrames = target.length * settlePerChar + 18;
    function tick() {
      var out = "";
      var settled = Math.floor((frame / totalFrames) * target.length * 1.35);
      for (var i = 0; i < target.length; i++) {
        var ch = target[i];
        if (ch === " ") { out += " "; continue; }
        if (i < settled) {
          out += ch;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      el.textContent = out;
      frame++;
      if (frame <= totalFrames) {
        setTimeout(tick, 45);
      } else {
        el.textContent = target;
      }
    }
    tick();
  }

  var decodeEls = document.querySelectorAll("[data-decode]");
  decodeEls.forEach(function (el, i) {
    setTimeout(function () { decodeElement(el); }, 350 + i * 260);
  });

  /* ------------------------------------------------------------------ */
  /* Animated Counters — 0 → target, easeOutExpo, 1.2s, locale format    */
  /* ------------------------------------------------------------------ */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reducedMotion) {
      el.textContent = prefix + target.toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;
      return;
    }
    var start = null;
    var DUR = 1200;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / DUR, 1);
      var value = target * easeOutExpo(p);
      el.textContent = prefix + value.toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { counterObserver.observe(c); });
  } else {
    counters.forEach(runCounter);
  }

  /* ------------------------------------------------------------------ */
  /* Before / After slider (smile-gallery.html)                          */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var range = ba.querySelector(".ba-range");
    if (!range) return;
    function setPos(v) { ba.style.setProperty("--pos", v + "%"); }
    setPos(range.value || 50);
    range.addEventListener("input", function () { setPos(range.value); });
  });

  /* ------------------------------------------------------------------ */
  /* Booking form (booking.html)                                         */
  /* ------------------------------------------------------------------ */
  var bookingForm = document.getElementById("booking-form");
  if (bookingForm) {
    var dateInput = bookingForm.querySelector("#appt-date");
    if (dateInput) {
      var today = new Date();
      var iso = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
      dateInput.min = iso;
      dateInput.value = iso;
    }

    var selectedTime = "";
    var slotsWrap = bookingForm.querySelector(".slot-grid");
    var timeField = bookingForm.querySelector("#time-error");

    if (slotsWrap) {
      slotsWrap.addEventListener("click", function (e) {
        var btn = e.target.closest(".slot");
        if (!btn || btn.disabled) return;
        slotsWrap.querySelectorAll(".slot").forEach(function (s) {
          s.setAttribute("aria-pressed", "false");
        });
        btn.setAttribute("aria-pressed", "true");
        selectedTime = btn.getAttribute("data-time");
        if (timeField) timeField.textContent = "";
      });
    }

    function setError(id, message) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = message || "";
      var input = bookingForm.querySelector("[name='" + el.dataset.for + "']");
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(bookingForm);
      var ok = true;

      var name = (data.get("name") || "").toString().trim();
      setError("name-error", name.length >= 2 ? "" : "Please enter your full name.");
      if (name.length < 2) ok = false;

      var email = (data.get("email") || "").toString().trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      setError("email-error", emailOk ? "" : "Enter a valid email, e.g. you@example.com.");
      if (!emailOk) ok = false;

      var phone = (data.get("phone") || "").toString().trim();
      var digits = phone.replace(/\D/g, "");
      var phoneOk = digits.length >= 7 && digits.length <= 15;
      setError("phone-error", phoneOk ? "" : "Enter a phone number with 7–15 digits.");
      if (!phoneOk) ok = false;

      var service = (data.get("service") || "").toString();
      setError("service-error", service ? "" : "Choose the treatment you need.");
      if (!service) ok = false;

      var date = (data.get("date") || "").toString();
      var dateOk = !!date && !isNaN(Date.parse(date));
      if (dateInput && date) dateOk = dateOk && date >= dateInput.min;
      setError("date-error", dateOk ? "" : "Pick today or a future date.");
      if (!dateOk) ok = false;

      setError("time-error", selectedTime ? "" : "Select an available time slot.");
      if (!selectedTime) ok = false;

      if (!ok) {
        var firstBad = bookingForm.querySelector('[aria-invalid="true"]') || slotsWrap;
        if (firstBad && firstBad.scrollIntoView) {
          firstBad.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        }
        return;
      }

      var dateObj = new Date(date + "T12:00:00");
      var niceDate = dateObj.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric"
      });

      var confirmCard = document.getElementById("booking-confirm");
      if (confirmCard) {
        confirmCard.querySelector("[data-fill='name']").textContent = name;
        confirmCard.querySelector("[data-fill='service']").textContent = service;
        confirmCard.querySelector("[data-fill='date']").textContent = niceDate;
        confirmCard.querySelector("[data-fill='time']").textContent = selectedTime;
        bookingForm.hidden = true;
        confirmCard.hidden = false;
        confirmCard.setAttribute("tabindex", "-1");
        confirmCard.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
