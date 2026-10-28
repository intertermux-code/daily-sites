/* ============================================================
   LumiDent — shared behaviour
   Sections: nav, cursor spotlight, clip-path reveals,
   before/after slider, booking form, misc guards.
   Page-specific code is guarded by element existence.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     1. Mobile navigation
     ---------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ----------------------------------------------------------
     2. Cursor spotlight — radial glow tracks the pointer
        inside the hero / masthead. rAF-throttled.
     ---------------------------------------------------------- */
  var spotlightHosts = document.querySelectorAll("[data-spotlight]");

  spotlightHosts.forEach(function (host) {
    var glow = host.querySelector(".hero__spotlight");
    if (!glow) return;
    if (reduceMotion) return;
    if (window.matchMedia("(hover: none)").matches) return;

    var frame = null;
    var target = { x: 50, y: 38 };

    var paint = function () {
      frame = null;
      host.style.setProperty("--mx", target.x.toFixed(2) + "%");
      host.style.setProperty("--my", target.y.toFixed(2) + "%");
    };

    host.addEventListener("pointermove", function (e) {
      var box = host.getBoundingClientRect();
      target.x = ((e.clientX - box.left) / box.width) * 100;
      target.y = ((e.clientY - box.top) / box.height) * 100;
      if (frame === null) frame = requestAnimationFrame(paint);
    });

    host.addEventListener("pointerleave", function () {
      target.x = 50;
      target.y = 34;
      if (frame === null) frame = requestAnimationFrame(paint);
    });
  });

  /* ----------------------------------------------------------
     3. Clip-path image reveal + line-mask headings
     ---------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".reveal-frame, .mask-line, [data-rise]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.16 });

    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     4. Before / after slider (smile-gallery.html)
     ---------------------------------------------------------- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var range = ba.querySelector(".ba__range");
    if (!range) return;

    var apply = function () {
      ba.style.setProperty("--pos", range.value + "%");
    };
    range.addEventListener("input", apply);
    apply();
  });

  /* ----------------------------------------------------------
     5. Booking form — validation + confirmation state
     ---------------------------------------------------------- */
  var form = document.getElementById("booking-form");
  var confirmPanel = document.getElementById("booking-confirmation");

  if (form) {
    var services = {
      "consult": "New-patient exam & consultation",
      "cleaning": "Hygiene visit & air-polishing",
      "implant": "Implant consultation (CBCT scan included)",
      "ortho": "Orthodontic assessment",
      "cosmetic": "Cosmetic smile design session",
      "whitening": "Professional whitening (one hour)",
      "kids": "Paediatric check & fluoride seal",
      "emergency": "Emergency pain relief"
    };

    var slots = {
      morning: "08:00 – 11:30 · first chair of the day",
      midday: "11:30 – 15:00 · quiet room hours",
      evening: "15:00 – 19:30 · after-work hours"
    };

    var fields = [
      {
        id: "full-name",
        test: function (v) { return v.trim().length >= 2; },
        message: "Please enter your full name."
      },
      {
        id: "email",
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); },
        message: "Enter an email we can reach you at, for example name@mail.com."
      },
      {
        id: "phone",
        test: function (v) { return v.replace(/[^\d]/g, "").length >= 8; },
        message: "Enter a phone number with at least 8 digits."
      },
      {
        id: "service",
        test: function (v) { return v !== ""; },
        message: "Choose the treatment you would like to book."
      },
      {
        id: "date",
        test: function (v) {
          if (!v) return false;
          var picked = new Date(v + "T00:00:00");
          if (isNaN(picked.getTime())) return false;
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          if (picked < today) return false;
          var day = picked.getDay();
          return day !== 0; // closed Sundays
        },
        message: "Pick a weekday or Saturday from today onward — we are closed on Sundays."
      },
      {
        id: "slot",
        test: function (v, wrapper) { return !!wrapper.querySelector('input[name="slot"]:checked'); },
        message: "Select the time window that works for you."
      },
      {
        id: "patient-type",
        test: function (v, wrapper) { return !!wrapper.querySelector('input[name="patient-type"]:checked'); },
        message: "Tell us whether this is your first visit."
      },
      {
        id: "consent",
        test: function (v, wrapper) {
          var box = wrapper.querySelector('input[name="consent"]');
          return box && box.checked;
        },
        message: "We need your permission to contact you about this appointment."
      }
    ];

    var wrapOf = function (id) {
      var el = document.getElementById(id);
      return el ? el.closest(".field") : null;
    };

    var setError = function (field, message) {
      var wrap = wrapOf(field.id);
      if (!wrap) return;
      wrap.setAttribute("data-invalid", "true");
      var out = wrap.querySelector(".error");
      if (out) out.textContent = message;
      var control = wrap.querySelector(".control, input, select, textarea");
      if (control) control.setAttribute("aria-invalid", "true");
    };

    var clearError = function (field) {
      var wrap = wrapOf(field.id);
      if (!wrap) return;
      wrap.removeAttribute("data-invalid");
      var out = wrap.querySelector(".error");
      if (out) out.textContent = "";
      var control = wrap.querySelector(".control, input, select, textarea");
      if (control) control.removeAttribute("aria-invalid");
    };

    var validateField = function (field) {
      var el = document.getElementById(field.id);
      if (!el) return true;
      var wrap = wrapOf(field.id);
      var ok = field.test(el.value || "", wrap || document);
      if (ok) clearError(field); else setError(field, field.message);
      return ok;
    };

    // live re-validation once a field has been marked invalid
    fields.forEach(function (field) {
      var wrap = wrapOf(field.id);
      if (!wrap) return;
      wrap.addEventListener("input", function () {
        if (wrap.getAttribute("data-invalid") === "true") validateField(field);
      });
      wrap.addEventListener("change", function () {
        if (wrap.getAttribute("data-invalid") === "true") validateField(field);
      });
    });

    // keep the date picker honest
    var dateInput = document.getElementById("date");
    if (dateInput) {
      var now = new Date();
      var iso = function (d) {
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + m + "-" + day;
      };
      dateInput.min = iso(now);
      dateInput.max = iso(new Date(now.getTime() + 120 * 864e5));
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstBad) firstBad = field;
      });

      if (firstBad) {
        var badEl = document.getElementById(firstBad.id);
        if (badEl && typeof badEl.focus === "function") badEl.focus();
        var status = document.getElementById("booking-status");
        if (status) {
          status.textContent = "Some details need your attention before we can hold the chair.";
        }
        return;
      }

      var data = new FormData(form);
      var dateVal = data.get("date");
      var pretty = new Date(dateVal + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      });
      var slotKey = data.get("slot");
      var serviceKey = data.get("service");

      var out = {
        name: "summary-name",
        service: "summary-service",
        when: "summary-when",
        slot: "summary-slot",
        patient: "summary-patient",
        contact: "summary-contact"
      };
      var set = function (id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
      };
      set(out.name, String(data.get("full-name")).trim());
      set(out.service, services[serviceKey] || String(serviceKey));
      set(out.when, pretty);
      set(out.slot, slots[slotKey] || String(slotKey));
      set(out.patient, data.get("patient-type") === "new"
        ? "New patient — 60-minute first exam"
        : "Returning patient — 30-minute slot");
      set(out.contact, data.get("phone") + " · " + data.get("email"));

      var ref = document.getElementById("summary-ref");
      if (ref) {
        var stamp = (Date.now().toString(36) + serviceKey).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-6);
        ref.textContent = "LUMI-" + stamp;
      }

      form.hidden = true;
      if (confirmPanel) {
        confirmPanel.hidden = false;
        var heading = confirmPanel.querySelector("h2");
        if (heading) heading.setAttribute("tabindex", "-1");
        if (heading) heading.focus();
        confirmPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });

    var editBtn = document.getElementById("booking-edit");
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        if (confirmPanel) confirmPanel.hidden = true;
        form.hidden = false;
        var first = document.getElementById("full-name");
        if (first) first.focus();
      });
    }
  }

  /* ----------------------------------------------------------
     6. Live "next open chair" ticker on the homepage
     ---------------------------------------------------------- */
  var ticker = document.getElementById("next-chair");
  if (ticker) {
    var nextOpen = function () {
      var d = new Date();
      d.setHours(8, 0, 0, 0);
      while (d.getDay() === 0 || d < new Date()) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() === 0) { d.setDate(d.getDate() + 1); }
        d.setHours(8, 0, 0, 0);
      }
      return d;
    };
    var next = nextOpen();
    var hours = [8, 9, 11, 14, 16, 18];
    var pick = hours[Math.floor(Math.random() * hours.length)];
    next.setHours(pick, pick % 2 === 0 ? 0 : 30, 0, 0);
    ticker.textContent = next.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })
      + " · " + next.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  /* ----------------------------------------------------------
     7. Footer year
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
