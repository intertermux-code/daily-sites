/* ==========================================================================
   Bright Harvest — shared behaviour
   Signature motion: animated counters (easeOutExpo) + clip-path image reveal.
   Everything is guarded by element-existence checks so one file serves all pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nf = new Intl.NumberFormat("en-US");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------ 1.
     Sticky header nav: mobile toggle, escape + outside click to close      */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 860) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ 2.
     Clip-path image reveal                                                  */
  function initReveals() {
    var items = $$(".clip-reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
        window.setTimeout(function () { el.classList.add("is-revealed"); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ 3.
     Animated counters — 0 → target, easeOutExpo, 1.2s, locale formatted     */
  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-target") || "0");
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";

    function paint(value) {
      var out;
      if (decimals > 0) {
        out = value.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      } else {
        out = nf.format(Math.round(value));
      }
      el.textContent = prefix + out + suffix;
    }

    if (reduceMotion) { paint(target); return; }

    var duration = 1200;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var p = (now - start) / duration;
      paint(target * easeOutExpo(Math.min(p, 1)));
      if (p < 1) window.requestAnimationFrame(frame);
      else paint(target);
    }
    window.requestAnimationFrame(frame);
  }

  function initCounters() {
    var counters = $$(".counter");
    if (!counters.length) return;

    counters.forEach(function (el) { el.textContent = "0"; });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ 4.
     Donation widget (donate.html)                                           */
  var MEAL_COST = 0.42;      /* wholesale cost of one rescued-produce meal  */
  var DAYS_PER_DOLLAR = 0.14;/* days of produce for a family of four        */

  function initDonate() {
    var form = $("[data-donate-form]");
    if (!form) return;

    var amountButtons = $$("[data-amount]", form);
    var custom = $("#custom-amount", form);
    var freqButtons = $$("[data-freq]", form);
    var fundChips = $$("[data-fund]", form);
    var totalOut = $("[data-donate-total]", form);
    var freqOut = $("[data-donate-freq]", form);
    var impactMeals = $("[data-impact-meals]", form);
    var impactDays = $("[data-impact-days]", form);
    var impactLine = $("[data-impact-line]", form);
    var status = $(".form-status", form);

    var state = { amount: 50, frequency: "once", fund: "Where it is needed most" };

    function currentAmount() {
      return Math.max(0, Math.round(Number(state.amount) || 0));
    }

    function render() {
      var amt = currentAmount();
      var annual = state.frequency === "monthly" ? amt * 12 : amt;

      if (totalOut) totalOut.textContent = "$" + nf.format(amt) + (state.frequency === "monthly" ? " / month" : " one-time");
      if (freqOut) freqOut.textContent = state.frequency === "monthly"
        ? "Renews on the 1st, cancel any time by email."
        : "Single gift, receipted within two business days.";

      if (impactMeals) impactMeals.textContent = nf.format(Math.round(annual / MEAL_COST));
      if (impactDays) impactDays.textContent = nf.format(Math.round(annual * DAYS_PER_DOLLAR));
      if (impactLine) {
        impactLine.textContent = amt === 0
          ? "Enter any amount to see the produce it buys."
          : state.frequency === "monthly"
            ? "Your " + nf.format(amt) + " every month funds " + nf.format(Math.round(annual / MEAL_COST)) + " meals a year for the " + state.fund.toLowerCase() + "."
            : nf.format(amt) + " to the " + state.fund.toLowerCase() + " buys " + Math.max(1, Math.round(annual * DAYS_PER_DOLLAR)) + " days of fresh produce for a family of four.";
      }
    }

    function clearGroup(list, active) {
      list.forEach(function (b) { b.setAttribute("aria-pressed", b === active ? "true" : "false"); });
    }

    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.amount = btn.getAttribute("data-amount");
        clearGroup(amountButtons, btn);
        if (custom) { custom.value = ""; custom.removeAttribute("aria-invalid"); }
        render();
      });
    });

    if (custom) {
      custom.addEventListener("input", function () {
        var v = Number(custom.value);
        state.amount = isNaN(v) || v < 0 ? 0 : Math.round(v);
        clearGroup(amountButtons, null);
        render();
      });
    }

    freqButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.frequency = btn.getAttribute("data-freq");
        clearGroup(freqButtons, btn);
        render();
      });
    });

    fundChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.fund = chip.getAttribute("data-fund");
        clearGroup(fundChips, chip);
        render();
      });
    });

    render();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (currentAmount() < 5) {
        if (status) {
          status.textContent = "Please choose or enter at least $5 — below that, processing fees eat the gift.";
          status.setAttribute("data-state", "err");
        }
        if (custom) { custom.setAttribute("aria-invalid", "true"); custom.focus(); }
        return;
      }
      if (status) { status.textContent = ""; status.removeAttribute("data-state"); }
      showThanks(form, currentAmount(), state.frequency, state.fund);
    });

    var reset = $("[data-thanks-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        var panel = $("[data-thanks]");
        if (!panel) return;
        panel.classList.remove("is-visible");
        panel.setAttribute("aria-hidden", "true");
        var back = amountButtons[1] || custom;
        if (back) back.focus();
      });
    }
  }

  function showThanks(form, amount, frequency, fund) {
    var thanks = $("[data-thanks]");
    if (!thanks) return;

    var amountOut = $("[data-thanks-amount]", thanks);
    var detailOut = $("[data-thanks-detail]", thanks);
    var receiptOut = $("[data-thanks-receipt]", thanks);

    if (amountOut) amountOut.textContent = "$" + nf.format(amount) + (frequency === "monthly" ? " every month" : " today");
    if (detailOut) {
      detailOut.textContent = "Directed to the " + fund.toLowerCase() + ". That is " +
        nf.format(Math.round((frequency === "monthly" ? amount * 12 : amount) / MEAL_COST)) +
        " meals of rescued produce.";
    }
    if (receiptOut) {
      receiptOut.textContent = "Receipt BH-" + String(Math.floor(Math.random() * 90000) + 10000) +
        " emailed within two business days.";
    }

    thanks.classList.add("is-visible");
    thanks.setAttribute("aria-hidden", "false");

    if (!reduceMotion) {
      var burst = $(".confetti-burst", thanks);
      if (burst) {
        var bits = $$("i", burst);
        bits.forEach(function (bit, i) {
          var angle = (i / (bits.length || 1)) * Math.PI * 2 + 0.4;
          var dist = 130 + (i % 4) * 42;
          bit.style.setProperty("--tx", (Math.cos(angle) * dist).toFixed(0) + "px");
          bit.style.setProperty("--ty", (Math.sin(angle) * dist).toFixed(0) + "px");
          bit.style.setProperty("--rot", (i % 2 ? 200 : -260) + "deg");
          bit.style.animationDelay = (i * 14) + "ms";
        });
      }
    }

    var focusTarget = $("h3", thanks);
    if (focusTarget) {
      if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    }
  }

  /* ------------------------------------------------------------------ 5.
     Generic validation for signup / contact / newsletter forms              */
  function setInvalid(field, message) {
    var input = field.querySelector("input, select, textarea");
    field.classList.add("has-error");
    if (input) input.setAttribute("aria-invalid", "true");
    var err = field.querySelector(".field-error");
    if (err) { err.textContent = message; }
  }

  function clearInvalid(field) {
    var input = field.querySelector("input, select, textarea");
    field.classList.remove("has-error");
    if (input) input.removeAttribute("aria-invalid");
  }

  function validateRequired(form) {
    var problems = [];
    var firstBad = null;

    $$("[data-required]", form).forEach(function (input) {
      var field = input.closest(".field") || input.closest("fieldset");
      if (!field) return;

      if (input.type === "checkbox" || input.type === "radio") {
        var group = form.querySelectorAll('[name="' + input.name + '"]');
        var checked = Array.prototype.some.call(group, function (g) { return g.checked; });
        if (!checked) { setInvalid(field, "Pick at least one option here."); problems.push(input.name); firstBad = firstBad || input; }
        else clearInvalid(field);
        return;
      }

      var value = (input.value || "").trim();
      if (!value) { setInvalid(field, "This field needs an answer."); problems.push(input.name); firstBad = firstBad || input; return; }

      if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setInvalid(field, "That email looks incomplete — check for a missing @ or domain.");
        problems.push(input.name); firstBad = firstBad || input; return;
      }
      if (input.type === "tel" && value.replace(/[^\d]/g, "").length < 10) {
        setInvalid(field, "Enter 10 digits so we can text you shift changes.");
        problems.push(input.name); firstBad = firstBad || input; return;
      }
      clearInvalid(field);
    });

    return { ok: problems.length === 0, firstBad: firstBad };
  }

  function initForms() {
    $$("[data-validate-form]").forEach(function (form) {
      var status = $(".form-status", form);
      var successSel = form.getAttribute("data-success-target");
      var successEl = successSel ? $(successSel) : null;

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var result = validateRequired(form);

        if (!result.ok) {
          if (status) {
            status.textContent = "We need a little more before this can go through. Fields marked below.";
            status.setAttribute("data-state", "err");
          }
          if (result.firstBad) result.firstBad.focus();
          return;
        }

        if (status) {
          var name = (form.querySelector('[name="name"], [name="firstName"]') || {}).value || "";
          status.textContent = "Thanks" + (name ? ", " + name.split(" ")[0] + "" : "") + " — your spot is held. A coordinator replies within one business day.";
          status.setAttribute("data-state", "ok");
        }
        if (successEl) {
          successEl.hidden = false;
          successEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
        form.reset();
      });

      $$("input, select, textarea", form).forEach(function (input) {
        input.addEventListener("input", function () {
          var field = input.closest(".field") || input.closest("fieldset");
          if (field && field.classList.contains("has-error")) clearInvalid(field);
        });
      });
    });

    /* footer newsletter — inline confirmation, no page reload */
    $$("[data-newsletter]").forEach(function (form) {
      var status = $(".form-status", form);
      var email = form.querySelector("input[type='email']");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!email) return;
        var value = email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          if (status) { status.textContent = "Add a full email address and we’ll send the next letter."; status.setAttribute("data-state", "err"); }
          email.setAttribute("aria-invalid", "true");
          email.focus();
          return;
        }
        email.removeAttribute("aria-invalid");
        if (status) { status.textContent = "You’re on the list — first letter lands on the 1st."; status.setAttribute("data-state", "ok"); }
        form.reset();
      });
    });
  }

  /* ------------------------------------------------------------------ 6.
     Story filters (stories.html)                                            */
  function initFilters() {
    var bar = $("[data-filters]");
    if (!bar) return;

    var chips = $$("[data-filter]", bar);
    var stories = $$("[data-story]");
    var count = $("[data-filter-count]");
    var active = "all";

    function apply() {
      var visible = 0;
      stories.forEach(function (item) {
        var tags = (item.getAttribute("data-story") || "").split(" ");
        var show = active === "all" || tags.indexOf(active) > -1;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (count) {
        count.textContent = "Showing " + visible + " of " + stories.length + " stories";
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        active = chip.getAttribute("data-filter");
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        apply();
      });
    });

    apply();
  }

  /* ------------------------------------------------------------------ 7.
     Small utilities                                                         */
  function initMisc() {
    var year = $("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

    /* date input default = today, so the volunteer picker never starts in the past */
    $$("[data-default-today]").forEach(function (input) {
      var d = new Date();
      input.min = d.toISOString().slice(0, 10);
      if (!input.value) input.value = d.toISOString().slice(0, 10);
    });

    /* capacity meters fill to their data level once visible */
    $$("[data-meter]").forEach(function (meter) {
      var level = Math.min(100, Math.max(0, parseFloat(meter.getAttribute("data-meter")) || 0));
      var inner = meter.querySelector("[data-meter-fill]");
      if (!inner) return;
      if (reduceMotion || !("IntersectionObserver" in window)) {
        inner.style.transform = "scaleX(" + level / 100 + ")";
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          window.setTimeout(function () { inner.style.transform = "scaleX(" + level / 100 + ")"; }, 120);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      io.observe(meter);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveals();
    initCounters();
    initDonate();
    initForms();
    initFilters();
    initMisc();
  });
})();
