/* LumiDent — shared behaviour
   Signature motions: 3D card tilt (lerped, with glare) + scroll progress bar.
   Plus: mobile nav, before/after sliders, booking & contact form validation. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress bar ---------- */
  var bar = document.querySelector(".progress-bar");
  if (bar) {
    var ticking = false;
    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var navList = document.querySelector(".nav-list");
  if (toggle && navList) {
    toggle.addEventListener("click", function () {
      var open = navList.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navList.classList.contains("is-open")) {
        navList.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- 3D card tilt with glare ---------- */
  var MAX_TILT = 8; /* degrees */
  var cards = Array.prototype.slice.call(document.querySelectorAll(".tilt"));
  if (cards.length && !reduceMotion) {
    var states = cards.map(function (card) {
      var glare = document.createElement("span");
      glare.className = "tilt__glare";
      glare.setAttribute("aria-hidden", "true");
      card.appendChild(glare);
      return {
        el: card,
        tx: 0, ty: 0,        /* target rotation */
        cx: 0, cy: 0,        /* current (lerped) rotation */
        gx: 50, gy: 50,      /* glare position % */
        tgx: 50, tgy: 50,
        active: false
      };
    });

    cards.forEach(function (card, i) {
      card.addEventListener("pointermove", function (e) {
        var s = states[i];
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width;   /* 0..1 */
        var ny = (e.clientY - r.top) / r.height;
        s.ty = (nx - 0.5) * 2 * MAX_TILT;          /* rotateY */
        s.tx = -(ny - 0.5) * 2 * MAX_TILT;         /* rotateX */
        s.tgx = nx * 100;
        s.tgy = ny * 100;
        s.active = true;
        card.classList.add("is-tilting");
      });
      card.addEventListener("pointerleave", function () {
        var s = states[i];
        s.tx = 0; s.ty = 0;
        s.active = false;
        card.classList.remove("is-tilting");
      });
    });

    var lerp = function (a, b, t) { return a + (b - a) * t; };
    (function loop() {
      var any = false;
      for (var i = 0; i < states.length; i++) {
        var s = states[i];
        var moving = Math.abs(s.cx - s.tx) > 0.05 || Math.abs(s.cy - s.ty) > 0.05 || s.active;
        if (!moving && s.cx === 0 && s.cy === 0) continue;
        any = true;
        s.cx = lerp(s.cx, s.tx, 0.12);
        s.cy = lerp(s.cy, s.ty, 0.12);
        s.gx = lerp(s.gx, s.tgx, 0.18);
        s.gy = lerp(s.gy, s.tgy, 0.18);
        s.el.style.transform =
          "rotateX(" + s.cx.toFixed(2) + "deg) rotateY(" + s.cy.toFixed(2) + "deg)" +
          (s.active ? " translateZ(6px)" : "");
        s.el.style.setProperty("--gx", s.gx.toFixed(1) + "%");
        s.el.style.setProperty("--gy", s.gy.toFixed(1) + "%");
      }
      if (any || true) requestAnimationFrame(loop); /* single shared loop */
    })();
  }

  /* ---------- before / after sliders ---------- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var frame = ba.querySelector(".ba-frame");
    var range = ba.querySelector(".ba-range");
    if (!frame || !range) return;
    var set = function (v) { frame.style.setProperty("--pos", v + "%"); };
    set(range.value || 50);
    range.addEventListener("input", function () { set(range.value); });
  });

  /* ---------- form helpers ---------- */
  var showError = function (field, msg) {
    field.classList.add("is-invalid");
    var slot = field.querySelector(".error-msg");
    if (slot) slot.textContent = msg;
    var input = field.querySelector("input, select, textarea");
    if (input) input.setAttribute("aria-invalid", "true");
  };
  var clearError = function (field) {
    field.classList.remove("is-invalid");
    var input = field.querySelector("input, select, textarea");
    if (input) input.removeAttribute("aria-invalid");
  };
  var validateField = function (input) {
    var field = input.closest(".field");
    if (!field) return true;
    var v = (input.value || "").trim();
    if (input.hasAttribute("required") && !v) {
      showError(field, input.dataset.msgRequired || "This field is required.");
      return false;
    }
    if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      showError(field, "Enter a valid email address, e.g. you@example.com.");
      return false;
    }
    if (input.type === "tel" && v && v.replace(/\D/g, "").length < 7) {
      showError(field, "Enter a phone number with at least 7 digits.");
      return false;
    }
    if (input.type === "date" && v) {
      var chosen = new Date(v + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        showError(field, "Choose today or a future date.");
        return false;
      }
      var day = chosen.getDay();
      if (day === 0) { showError(field, "We’re closed on Sundays — pick another day."); return false; }
    }
    if (input.type === "checkbox" && input.hasAttribute("required") && !input.checked) {
      showError(field, input.dataset.msgRequired || "Please check this box to continue.");
      return false;
    }
    clearError(field);
    return true;
  };

  var wireForm = function (form, onValid) {
    if (!form) return;
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("change", function () { validateField(input); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        if (!validateField(input)) {
          ok = false;
          if (!firstBad) firstBad = input;
        }
      });
      if (!ok) {
        if (firstBad) firstBad.focus();
        return;
      }
      onValid(form);
    });
  };

  /* ---------- booking form ---------- */
  var booking = document.getElementById("booking-form");
  if (booking) {
    var dateInput = booking.querySelector('input[type="date"]');
    if (dateInput) {
      var t = new Date();
      t.setDate(t.getDate() + 1);
      dateInput.min = t.toISOString().slice(0, 10);
    }
    var timeSelect = booking.querySelector("#bk-time");
    if (timeSelect) {
      /* slots run 9:00 AM – 5:00 PM on the hour and half hour */
      for (var h = 9; h <= 17; h++) {
        var half = h === 17;
        ["00", "30"].forEach(function (mm) {
          if (mm === "30" && half) return;
          var display = (h > 12 ? h - 12 : h) + ":" + mm + " " + (h < 12 ? "AM" : "PM");
          var opt = document.createElement("option");
          opt.value = h + ":" + mm;
          opt.textContent = display;
          timeSelect.appendChild(opt);
        });
      }
    }
    wireForm(booking, function (form) {
      var panel = document.getElementById("booking-confirmation");
      if (!panel) return;
      var val = function (sel) {
        var el = form.querySelector(sel);
        if (!el) return "";
        if (el.tagName === "SELECT") {
          return el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : "";
        }
        return el.value;
      };
      var name = val('[name="name"]');
      document.getElementById("conf-name").textContent = name.split(" ")[0] || name;
      document.getElementById("conf-service").textContent = val('[name="service"]');
      var d = val('[name="date"]');
      var nice = d ? new Date(d + "T12:00:00").toLocaleDateString("en-US",
        { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "";
      document.getElementById("conf-date").textContent = nice;
      document.getElementById("conf-time").textContent = val('[name="time"]');
      document.getElementById("conf-dentist").textContent = val('[name="dentist"]') || "First available";
      document.getElementById("conf-ref").textContent =
        "LD-" + String(Math.floor(1000 + Math.random() * 9000));
      form.hidden = true;
      panel.hidden = false;
      var head = panel.querySelector("h2");
      if (head) { head.setAttribute("tabindex", "-1"); head.focus(); }
      panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }

  /* ---------- contact message form ---------- */
  var contact = document.getElementById("contact-form");
  if (contact) {
    wireForm(contact, function (form) {
      var panel = document.getElementById("contact-confirmation");
      var summary = document.getElementById("contact-summary");
      if (!panel) return;
      if (summary) {
        summary.textContent = "Thanks — your message is queued for our front desk. " +
          "We reply before 5:00 PM on every business day, usually much sooner.";
      }
      var ref = panel.querySelector("#conf-ref");
      if (ref) ref.textContent = String(Math.floor(1000 + Math.random() * 9000));
      form.hidden = true;
      panel.hidden = false;
      var head = panel.querySelector("h2");
      if (head) { head.setAttribute("tabindex", "-1"); head.focus(); }
    });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
