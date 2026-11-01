/* ==========================================================================
   Pulseboard — shared behaviour
   Every block is guarded by an element-existence check so one file serves
   all pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll progress (signature motion) ---------- */
  var progressFill = document.querySelector(".progress__bar");
  if (progressFill) {
    var ticking = false;
    var setProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(Math.max(window.pageYOffset / max, 0), 1) : 0;
      progressFill.style.setProperty("--sp", ratio.toFixed(4));
      ticking = false;
    };
    var onRequest = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(setProgress);
      }
    };
    window.addEventListener("scroll", onRequest, { passive: true });
    window.addEventListener("resize", onRequest);
    setProgress();
  }

  /* ---------- Header shadow once scrolled ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-stuck", window.pageYOffset > 8);
    };
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav__toggle");
  var navList = document.querySelector(".nav__list");
  if (navToggle && navList) {
    var closeNav = function () {
      navList.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", function () {
      var open = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navList.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (
        navList.classList.contains("is-open") &&
        !navList.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeNav();
      }
    });
    navList.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
  }

  /* ---------- Clip-path image reveal (signature motion) ---------- */
  var reveals = document.querySelectorAll(".rv");
  if (reveals.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(reveals, function (el) {
        el.classList.add("is-in");
      });
    } else {
      var rvObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              rvObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
      );
      Array.prototype.forEach.call(reveals, function (el, i) {
        el.style.setProperty("--rv-delay", (i % 4) * 110 + "ms");
        rvObserver.observe(el);
      });
    }
  }

  /* ---------- Card deck fan-out ---------- */
  var decks = document.querySelectorAll(".deck");
  if (decks.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(decks, function (d) {
        d.classList.add("is-fanned");
      });
    } else {
      var deckObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-fanned");
              deckObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );
      Array.prototype.forEach.call(decks, function (d) {
        deckObserver.observe(d);
      });
    }
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length) {
    var formatValue = function (value, decimals, sep) {
      var out = value.toFixed(decimals);
      if (sep) {
        var parts = out.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        out = parts.join(".");
      }
      return out;
    };
    var runCounter = function (el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var sep = el.getAttribute("data-thousands") === "true";
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      if (reduced) {
        el.textContent = prefix + formatValue(target, decimals, sep) + suffix;
        return;
      }
      var duration = 1500;
      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent =
          prefix + formatValue(target * eased, decimals, sep) + suffix;
        if (t < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(counters, runCounter);
    } else {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              countObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.55 }
      );
      Array.prototype.forEach.call(counters, function (el) {
        countObserver.observe(el);
      });
    }
  }

  /* ---------- Pricing: monthly / yearly toggle ---------- */
  var billingToggle = document.querySelector("[data-billing-toggle]");
  if (billingToggle) {
    var buttons = billingToggle.querySelectorAll("[data-cycle]");
    var amounts = document.querySelectorAll("[data-monthly]");
    var bills = document.querySelectorAll("[data-yearly-note]");
    var yearlyColumnIds = document.querySelectorAll("[data-cycle-col]");
    var apply = function (cycle) {
      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-cycle") === cycle ? "true" : "false");
      });
      Array.prototype.forEach.call(amounts, function (el) {
        var value = el.getAttribute(cycle === "yearly" ? "data-yearly" : "data-monthly");
        el.textContent = value;
      });
      Array.prototype.forEach.call(bills, function (el) {
        el.textContent =
          cycle === "yearly"
            ? el.getAttribute("data-yearly-note")
            : el.getAttribute("data-monthly-note");
      });
      Array.prototype.forEach.call(yearlyColumnIds, function (el) {
        var show = cycle === "yearly"
          ? el.getAttribute("data-cycle-col") === "yearly"
          : el.getAttribute("data-cycle-col") === "monthly";
        el.hidden = !show;
      });
    };
    billingToggle.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cycle]");
      if (btn) apply(btn.getAttribute("data-cycle"));
    });
    apply("monthly");
  }

  /* ---------- FAQ accordion ---------- */
  var faqButtons = document.querySelectorAll(".faq__q");
  if (faqButtons.length) {
    Array.prototype.forEach.call(faqButtons, function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      var setOpen = function (open) {
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
      };
      setOpen(false);
      btn.addEventListener("click", function () {
        var willOpen = btn.getAttribute("aria-expanded") !== "true";
        Array.prototype.forEach.call(faqButtons, function (other) {
          var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
          if (other !== btn && otherPanel) {
            other.setAttribute("aria-expanded", "false");
            otherPanel.style.maxHeight = "0px";
          }
        });
        setOpen(willOpen);
      });
      window.addEventListener("resize", function () {
        if (btn.getAttribute("aria-expanded") === "true") {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- Demo / contact form validation ---------- */
  var demoForm = document.getElementById("demo-form");
  if (demoForm) {
    var status = document.getElementById("form-status");
    var showError = function (input, message) {
      var holder = input.closest(".field");
      var slot = holder ? holder.querySelector(".field__error") : null;
      if (slot) slot.textContent = message || "";
      input.setAttribute("aria-invalid", message ? "true" : "false");
    };
    var validators = {
      "demo-email": function (v) {
        if (!v) return "Enter your work email address.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return "That email address looks incomplete.";
        return "";
      },
      "demo-name": function (v) {
        return v.trim().length < 2 ? "Tell us who to prepare the walkthrough for." : "";
      },
      "demo-company": function (v) {
        return v.trim().length < 2 ? "Add the company or team name." : "";
      },
      "demo-seats": function (v) {
        return !v ? "Choose the closest team size." : "";
      },
      "demo-goal": function (v) {
        return v.trim().length < 12 ? "A sentence or two helps us tailor the session." : "";
      }
    };
    demoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(validators).forEach(function (id) {
        var input = demoForm.querySelector("#" + id);
        if (!input) return;
        var message = validators[id](input.value);
        showError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      var consent = demoForm.querySelector("#demo-consent");
      var consentError = demoForm.querySelector("#demo-consent-error");
      if (consent && !consent.checked) {
        if (consentError) consentError.textContent = "Tick the box so we are allowed to reply.";
        if (!firstInvalid) firstInvalid = consent;
      } else if (consentError) {
        consentError.textContent = "";
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      var name = demoForm.querySelector("#demo-name").value.trim().split(" ")[0];
      var email = demoForm.querySelector("#demo-email").value.trim();
      if (status) {
        status.textContent =
          "Thanks, " + name + ". Your request is in the queue — a Pulseboard " +
          "solutions engineer will confirm a 30-minute slot at " + email +
          " within one business day.";
        status.hidden = false;
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      demoForm.reset();
      Object.keys(validators).forEach(function (id) {
        var input = demoForm.querySelector("#" + id);
        if (input) showError(input, "");
      });
    });
    demoForm.addEventListener("input", function (e) {
      var input = e.target;
      if (input.id && validators[input.id] && input.getAttribute("aria-invalid") === "true") {
        showError(input, validators[input.id](input.value));
      }
    });
  }

  /* ---------- Newsletter form ---------- */
  var newsForm = document.getElementById("newsletter-form");
  if (newsForm) {
    var newsNote = document.getElementById("newsletter-note");
    newsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = newsForm.querySelector("input[type='email']");
      if (!input || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim())) {
        if (newsNote) newsNote.textContent = "Enter a valid email address.";
        if (input) input.focus();
        return;
      }
      if (newsNote) newsNote.textContent = "You are on the list — expect the next brief on Monday.";
      newsForm.reset();
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
