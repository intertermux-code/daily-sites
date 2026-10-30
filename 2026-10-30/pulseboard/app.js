/* ==========================================================================
   Pulseboard — shared behaviour
   Signature motion: Marquee Ticker (CSS) + Animated Counters (rAF/easeOutExpo)
   Everything below is guarded by element-existence checks so one file serves
   every page.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ---------- 1. Skip link target sanity + footer year ---------- */
  var yearNodes = document.querySelectorAll("[data-year]");
  var thisYear = new Date().getFullYear();
  Array.prototype.forEach.call(yearNodes, function (n) {
    n.textContent = String(thisYear);
  });

  /* ---------- 2. Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    var openNav = function () {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") {
        closeNav();
      } else {
        openNav();
      }
    });

    nav.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeNav();
        toggle.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- 3. Scroll progress hairline ---------- */
  var bar = document.querySelector(".progress > span");
  if (bar) {
    var ticking = false;
    var paint = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(paint);
      }
    }, { passive: true });
    paint();
  }

  /* ---------- 4. Animated counters (secondary signature motion) ---------- */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function format(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);

    if (reduce) {
      el.textContent = format(target, decimals);
      return;
    }

    var duration = 1200;
    var start = null;
    el.textContent = format(0, decimals);

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      el.textContent = format(target * easeOutExpo(t), decimals);
      if (t < 1) {
        window.requestAnimationFrame(frame);
      } else {
        el.textContent = format(target, decimals);
      }
    }
    window.requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if (!("IntersectionObserver" in window) || reduce) {
      Array.prototype.forEach.call(counters, function (el) {
        var v = parseFloat(el.getAttribute("data-count"));
        var d = parseInt(el.getAttribute("data-decimals") || "0", 10);
        el.textContent = isNaN(v) ? el.textContent : format(v, d);
      });
    } else {
      Array.prototype.forEach.call(counters, function (el) {
        el.setAttribute("aria-hidden", "false");
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });
      Array.prototype.forEach.call(counters, function (el) { io.observe(el); });
    }
  }

  /* ---------- 5. Pricing: monthly / yearly toggle (pricing.html) ---------- */
  var billing = document.getElementById("billing-switch");
  if (billing) {
    var prices = document.querySelectorAll("[data-monthly]");
    var perLabels = document.querySelectorAll("[data-period-label]");
    var saveNotes = document.querySelectorAll("[data-annual-note]");
    var wasNodes = document.querySelectorAll("[data-monthly-was]");

    function render(isYearly) {
      Array.prototype.forEach.call(prices, function (el) {
        var amount = isYearly ? el.getAttribute("data-yearly") : el.getAttribute("data-monthly");
        var holder = el.querySelector(".amount") || el;
        holder.textContent = "$" + amount;
        var plan = el.closest(".plan");
        if (plan) {
          el.classList.remove("is-swap");
          void el.offsetWidth;
          if (!reduce) el.classList.add("is-swap");
        }
      });

      Array.prototype.forEach.call(perLabels, function (el) {
        el.textContent = isYearly ? "/user /mo, billed yearly" : "/user /mo, billed monthly";
      });

      Array.prototype.forEach.call(saveNotes, function (el) {
        el.textContent = isYearly
          ? "Two months on the house — that is 20% off the monthly rate."
          : "Switch to yearly billing and two months are free.";
      });

      Array.prototype.forEach.call(wasNodes, function (el) {
        var on = isYearly ? "block" : "none";
        el.style.display = on;
        el.textContent = isYearly ? "$" + el.getAttribute("data-monthly-was") + " monthly" : "";
      });

      billing.setAttribute("aria-checked", isYearly ? "true" : "false");
      var monthlyOpt = billing.querySelector('[data-opt="monthly"]');
      var yearlyOpt = billing.querySelector('[data-opt="yearly"]');
      if (monthlyOpt) monthlyOpt.classList.toggle("is-on", !isYearly);
      if (yearlyOpt) yearlyOpt.classList.toggle("is-on", isYearly);

      document.documentElement.setAttribute("data-billing", isYearly ? "yearly" : "monthly");
    }

    var state = false;
    billing.addEventListener("click", function () {
      state = !state;
      render(state);
    });
    billing.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        state = !state;
        render(state);
      }
    });
    render(false);
  }

  /* ---------- 6. Demo request form (contact.html) ---------- */
  var form = document.getElementById("demo-form");
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    function fieldOf(input) {
      return input.closest(".field");
    }

    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      var box = field.querySelector(".field__error");
      if (message) {
        field.classList.add("is-bad");
        input.setAttribute("aria-invalid", "true");
        if (box) box.textContent = message;
      } else {
        field.classList.remove("is-bad");
        input.removeAttribute("aria-invalid");
        if (box) box.textContent = "";
      }
    }

    function validate(input) {
      var value = (input.value || "").trim();

      if (input.type === "checkbox") {
        if (input.required && !input.checked) {
          setError(input, "Tick this to continue.");
          return false;
        }
        setError(input, "");
        return true;
      }

      if (input.required && !value) {
        setError(input, "This field is required.");
        return false;
      }
      if (value && input.type === "email" && !emailRe.test(value)) {
        setError(input, "Enter a valid work email, e.g. name@company.com.");
        return false;
      }
      if (value && input.dataset.min && value.length < parseInt(input.dataset.min, 10)) {
        setError(input, "Add a little more detail — at least " + input.dataset.min + " characters.");
        return false;
      }
      setError(input, "");
      return true;
    }

    var inputs = form.querySelectorAll("input, select, textarea");
    Array.prototype.forEach.call(inputs, function (input) {
      input.addEventListener("blur", function () {
        if ((input.value || "").trim() !== "" || input.required) validate(input);
      });
      if (input.type === "checkbox") {
        input.addEventListener("change", function () { validate(input); });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      var ok = true;
      Array.prototype.forEach.call(inputs, function (input) {
        if (!validate(input)) {
          ok = false;
          if (!firstBad) firstBad = input;
        }
      });

      if (!ok) {
        if (firstBad) firstBad.focus();
        var live = document.getElementById("form-status");
        if (live) live.textContent = "Check the highlighted fields, then send again.";
        return;
      }

      var done = document.getElementById("demo-done");
      var ref = document.getElementById("demo-ref");
      var name = form.querySelector('[name="name"]');
      var when = form.querySelector('[name="window"]');
      if (ref) {
        ref.textContent = "Ticket DEMO-" + String(Math.floor(1000 + Math.random() * 8999));
      }
      if (done && name) {
        var who = done.querySelector("[data-echo-name]");
        if (who) who.textContent = name.value.trim().split(" ")[0];
        var slot = done.querySelector("[data-echo-window]");
        if (slot && when) slot.textContent = when.value;
      }
      if (done) {
        form.hidden = true;
        done.classList.add("is-on");
        done.setAttribute("tabindex", "-1");
        done.focus();
      }
      var live2 = document.getElementById("form-status");
      if (live2) live2.textContent = "Request sent. Our solutions team replies within one business day.";
      form.reset();
    });
  }

  /* ---------- 7. Feature jump-nav highlighting (features.html) ---------- */
  var jump = document.querySelector("[data-jump]");
  if (jump && "IntersectionObserver" in window) {
    var links = jump.querySelectorAll("a[href^='#']");
    var map = {};
    Array.prototype.forEach.call(links, function (a) {
      map[a.getAttribute("href").slice(1)] = a;
    });
    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Array.prototype.forEach.call(links, function (a) { a.classList.remove("is-here"); });
          var link = map[entry.target.id];
          if (link) link.classList.add("is-here");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------- 8. Marquee ticker: seamless wrap safety ---------- */
  var marquees = document.querySelectorAll(".marquee");
  Array.prototype.forEach.call(marquees, function (m) {
    var groups = m.querySelectorAll(".marquee__group");
    if (groups.length === 1 && !reduce) {
      m.querySelector(".marquee__track").appendChild(groups[0].cloneNode(true));
    }
  });
})();
