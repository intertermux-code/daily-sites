/* ==========================================================================
   Northline — shared behaviour
   Motions: Blur-Fade Ascend (IntersectionObserver) · Spring Accordion
   Every feature is guarded by element-existence checks so one file serves
   all pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Sticky header state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 2. Mobile navigation ---------- */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav__toggle");
  if (nav && toggle) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !e.target.closest(".site-header")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) closeNav();
    });
  }

  /* ---------- 3. Blur-Fade Ascend reveals ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      reveals.forEach(function (el) {
        if (el.style.getPropertyValue("--i")) return;
        var sibs = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [];
        var idx = Array.prototype.indexOf.call(sibs, el);
        el.style.setProperty("--i", idx > 0 ? String(idx) : "0");
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- 4. Spring accordion (one panel open at a time) ---------- */
  var groups = document.querySelectorAll("[data-accordion]");
  if (groups.length) {
    groups.forEach(function (group) {
      var heads = group.querySelectorAll(".row__head");
      heads.forEach(function (head) {
        var row = head.closest(".row");
        if (row && row.classList.contains("is-open")) head.setAttribute("aria-expanded", "true");

        head.addEventListener("click", function () {
          var isOpen = head.getAttribute("aria-expanded") === "true";
          heads.forEach(function (other) {
            other.setAttribute("aria-expanded", "false");
            var o = other.closest(".row");
            if (o) o.classList.remove("is-open");
          });
          if (!isOpen) {
            head.setAttribute("aria-expanded", "true");
            if (row) row.classList.add("is-open");
          }
        });
      });
    });
  }

  /* ---------- 5. Animated stat counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduced) { el.textContent = target + suffix; return; }
      var start = null;
      var dur = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCount);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- 6. Seamless marquee ---------- */
  var tracks = document.querySelectorAll("[data-marquee]");
  tracks.forEach(function (track) {
    if (track.dataset.cloned) return;
    track.dataset.cloned = "1";
    var nodes = Array.prototype.slice.call(track.children);
    nodes.forEach(function (node) { track.appendChild(node.cloneNode(true)); });
  });

  /* ---------- 7. Work filters ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var cards = document.querySelectorAll("[data-disciplines]");
  if (chips.length && cards.length) {
    var applyFilter = function (value) {
      cards.forEach(function (card) {
        var list = (card.getAttribute("data-disciplines") || "").toLowerCase();
        var show = value === "all" || list.indexOf(value.toLowerCase()) !== -1;
        card.classList.toggle("is-hidden", !show);
      });
      var count = document.querySelector("[data-result-count]");
      if (count) {
        var visible = cards.length - document.querySelectorAll(".is-hidden").length;
        count.textContent = visible + (visible === 1 ? " project" : " projects");
      }
    };
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        applyFilter(chip.getAttribute("data-filter"));
      });
    });
  }

  /* ---------- 8. Project enquiry form ---------- */
  var form = document.querySelector("[data-enquiry]");
  if (form) {
    var status = form.querySelector(".form__status");
    var setError = function (input, message) {
      var holder = input.closest(".field").querySelector(".field__error");
      if (holder) holder.textContent = message || "";
      input.setAttribute("aria-invalid", message ? "true" : "false");
    };
    var validators = {
      name: function (v) { return v.trim().length >= 2 ? "" : "Tell us who you are."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) ? "" : "Enter a valid email address."; },
      company: function (v) { return v.trim().length >= 2 ? "" : "Add your company name."; },
      brief: function (v) { return v.trim().length >= 30 ? "" : "A few more sentences helps — 30 characters minimum."; }
    };
    var validateField = function (input) {
      var check = validators[input.name];
      if (check) setError(input, check(input.value));
      else if (input.hasAttribute("required") && !input.value.trim()) setError(input, "This field is required.");
      else setError(input, "");
      return input.getAttribute("aria-invalid") !== "true";
    };

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { if (input.name) validateField(input); });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (input) {
        if (input.type === "radio" || input.type === "checkbox") return;
        if (!validateField(input)) ok = false;
      });
      var budget = form.querySelector("[data-radio-group]");
      if (budget) {
        var picked = form.querySelector('input[name="' + budget.getAttribute("data-radio-group") + '"]:checked');
        var holder = budget.closest(".field").querySelector(".field__error");
        if (!picked) {
          if (holder) holder.textContent = "Pick a budget band.";
          ok = false;
        } else if (holder) holder.textContent = "";
      }
      var consent = form.querySelector('input[name="consent"]');
      if (consent && !consent.checked) {
        var cHolder = consent.closest(".field").querySelector(".field__error");
        if (cHolder) cHolder.textContent = "Please tick the box so we can reply.";
        ok = false;
      } else if (consent) {
        var cHolder2 = consent.closest(".field").querySelector(".field__error");
        if (cHolder2) cHolder2.textContent = "";
      }

      if (!ok) {
        if (status) {
          status.textContent = "Something is missing — check the highlighted fields above.";
          status.setAttribute("data-state", "err");
          status.classList.add("is-shown");
        }
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      var name = (form.querySelector('input[name="name"]') || {}).value || "";
      if (status) {
        status.textContent = "Thanks, " + name.trim().split(" ")[0] + ". Your enquiry is queued — a partner replies within one working day, and you will get a calendar link with the reply.";
        status.setAttribute("data-state", "ok");
        status.classList.add("is-shown");
      }
      form.reset();
      form.querySelectorAll(".field__error").forEach(function (el) { el.textContent = ""; });
      form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.setAttribute("aria-invalid", "false"); });
      status.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- 9. Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
