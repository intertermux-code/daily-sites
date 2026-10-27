/* ==========================================================================
   NORTHLINE — shared behaviour
   1. Mobile navigation      2. Cursor spotlight (rAF throttled)
   3. Animated counters      4. Marquee pause on keyboard focus
   5. Work filters           6. Services accordion
   7. Project enquiry form   8. Footer year
   Every feature is guarded by an element-existence check.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. mobile navigation ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    var state = toggle.querySelector("[data-menu-state]");

    function setNav(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      if (state) state.textContent = open ? "Close navigation" : "Open navigation";
      var label = toggle.querySelector(".menu-toggle__label");
      if (label) label.textContent = open ? "Close" : "Menu";
    }

    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 780) setNav(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 780 && nav.classList.contains("is-open")) setNav(false);
    });
  }

  /* ---------- 2. cursor spotlight ---------- */
  var zones = Array.prototype.slice.call(document.querySelectorAll("[data-spotlight]"));

  if (zones.length && !reduce.matches && window.matchMedia("(pointer: fine)").matches) {
    var pending = null;
    var queue = [];

    function flush() {
      pending = null;
      queue.forEach(function (job) {
        job.el.style.setProperty("--mx", job.x + "px");
        job.el.style.setProperty("--my", job.y + "px");
      });
      queue.length = 0;
    }

    zones.forEach(function (zone) {
      var glow = zone.querySelector(".hero__spot, .cta__spot, .pagehead__spot");
      if (!glow) return;
      zone.addEventListener("pointermove", function (e) {
        var r = zone.getBoundingClientRect();
        queue.push({ el: zone, x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) });
        glow.classList.add("is-on");
        if (pending === null) pending = window.requestAnimationFrame(flush);
      }, { passive: true });
      zone.addEventListener("pointerleave", function () {
        glow.classList.remove("is-on");
      });
    });
  }

  /* ---------- 3. animated counters ---------- */
  var numbers = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var format = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
    var duration = 1200;

    if (reduce.matches) {
      el.textContent = format.format(target) + suffix;
      return;
    }

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      el.textContent = format.format(Math.round(target * easeOutExpo(p))) + suffix;
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  if (numbers.length && "IntersectionObserver" in window) {
    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObs.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    numbers.forEach(function (n) { counterObs.observe(n); });
  } else {
    numbers.forEach(runCounter);
  }

  /* ---------- 4. footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- 5. work filters ---------- */
  var board = document.querySelector("[data-work-board]");

  if (board) {
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var cards = Array.prototype.slice.call(board.querySelectorAll(".card"));
    var count = document.querySelector("[data-work-count]");

    function apply(filter) {
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(/\s+/);
        var match = filter === "all" || tags.indexOf(filter) !== -1;
        card.classList.toggle("is-hidden", !match);
        if (match) shown += 1;
      });
      chips.forEach(function (chip) {
        chip.setAttribute("aria-pressed", String(chip.getAttribute("data-filter") === filter));
      });
      if (count) count.textContent = shown + (shown === 1 ? " project" : " projects");
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { apply(chip.getAttribute("data-filter")); });
    });
    apply("all");
  }

  /* ---------- 6. services accordion ---------- */
  var accItems = Array.prototype.slice.call(document.querySelectorAll(".acc__item"));

  if (accItems.length) {
    accItems.forEach(function (item) {
      var btn = item.querySelector(".acc__btn");
      var panel = item.querySelector(".acc__panel");
      if (!btn || !panel) return;

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        item.classList.toggle("is-open", !open);
      });
    });

    var deepHash = window.location.hash.replace("#", "");
    if (deepHash) {
      var targetItem = document.getElementById(deepHash);
      if (targetItem && targetItem.classList.contains("acc__item")) {
        var tBtn = targetItem.querySelector(".acc__btn");
        targetItem.classList.add("is-open");
        if (tBtn) tBtn.setAttribute("aria-expanded", "true");
      }
    }
  }

  /* ---------- 7. project enquiry form ---------- */
  var form = document.querySelector("[data-enquiry]");

  if (form) {
    var status = form.querySelector("[data-form-status]");
    var fields = form.querySelectorAll("[data-rule]");

    function fieldOf(input) { return input.closest(".field"); }

    function setError(input, message) {
      var wrap = fieldOf(input);
      var slot = wrap ? wrap.querySelector(".err") : null;
      if (message) {
        input.setAttribute("aria-invalid", "true");
        if (wrap) wrap.setAttribute("data-invalid", "true");
        if (slot) slot.textContent = message;
      } else {
        input.removeAttribute("aria-invalid");
        if (wrap) wrap.setAttribute("data-invalid", "false");
        if (slot) slot.textContent = "";
      }
    }

    function validate(input) {
      var rule = input.getAttribute("data-rule");
      var value = (input.value || "").trim();

      if (rule === "required" && !value) return "Required — tell us this before we reply.";
      if (rule === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return "That address looks incomplete. Check for a typo.";
      }
      if (rule === "min20" && value.length > 0 && value.length < 20) {
        return "Give us at least 20 characters so we can read it properly.";
      }
      if (rule === "optional") return "";
      return "";
    }

    Array.prototype.forEach.call(fields, function (input) {
      input.addEventListener("blur", function () { setError(input, validate(input)); });
      input.addEventListener("input", function () {
        var wrap = fieldOf(input);
        if (wrap && wrap.getAttribute("data-invalid") === "true") setError(input, validate(input));
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      var bad = 0;

      Array.prototype.forEach.call(fields, function (input) {
        var message = validate(input);
        if (message) {
          bad += 1;
          setError(input, message);
          if (!firstBad) firstBad = input;
        } else {
          setError(input, "");
        }
      });

      var consent = form.querySelector("[data-consent]");
      if (consent && !consent.checked) {
        bad += 1;
        if (status) {
          status.setAttribute("data-state", "bad");
          status.textContent = "Tick the consent box so we can answer you.";
        }
        if (!firstBad) firstBad = consent;
      }

      if (bad > 0) {
        if (status && status.getAttribute("data-state") !== "bad") {
          status.setAttribute("data-state", "bad");
          status.textContent = bad + (bad === 1 ? " detail needs" : " details need") + " fixing before this can send.";
        }
        if (firstBad) firstBad.focus();
        return;
      }

      var name = form.querySelector("[data-name-field]");
      var greeting = name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : "there";

      form.classList.add("is-sent");
      if (status) {
        status.setAttribute("data-state", "ok");
        status.textContent = "Sent — thanks " + greeting + ". A partner replies within one working day.";
      }
      Array.prototype.forEach.call(fields, function (input) { input.disabled = true; });
      var submit = form.querySelector("[type='submit']");
      if (submit) submit.disabled = true;
    });
  }
})();
