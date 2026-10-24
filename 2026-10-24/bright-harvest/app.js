/* =========================================================
   Bright Harvest — shared behaviour
   Signature motion: Animated Counters + 3D Card Tilt
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------
     1. Mobile navigation (keyboard operable)
     --------------------------------------------------------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("#site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("data-open", String(open));
      var label = $(".sr-only", toggle);
      if (label) label.textContent = open ? "Close menu" : "Menu";
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

    window.addEventListener("resize", function () {
      if (window.innerWidth > 992) setOpen(false);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
  }

  /* ---------------------------------------------------------
     2. Animated counters — easeOutExpo, 1.2s, locale format
     --------------------------------------------------------- */
  var DURATION = 1200;

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function formatValue(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function renderCounter(el, value) {
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    el.textContent = prefix + formatValue(value, decimals) + suffix;
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;

    if (prefersReduced) {
      renderCounter(el, target);
      return;
    }

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / DURATION, 1);
      renderCounter(el, target * easeOutExpo(t));
      if (t < 1) {
        el._raf = requestAnimationFrame(frame);
      } else {
        renderCounter(el, target);
        el._raf = null;
      }
    }
    el._raf = requestAnimationFrame(frame);
  }

  function initCounters() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;

    nodes.forEach(function (n) { renderCounter(n, 0); });

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(runCounter);
      return;
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (seen.has(el)) return;
        seen.add(el);
        runCounter(el);
        io.unobserve(el);
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });

    nodes.forEach(function (n) { io.observe(n); });
  }

  /* Re-count a single element (donation impact readout) */
  function retarget(el, value) {
    if (!el) return;
    if (el._raf) cancelAnimationFrame(el._raf);
    var from = parseFloat((el.textContent || "0").replace(/[^0-9.\-]/g, "")) || 0;
    el.setAttribute("data-count", String(value));
    if (prefersReduced) { renderCounter(el, value); return; }

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / DURATION, 1);
      renderCounter(el, from + (value - from) * easeOutExpo(t));
      if (t < 1) el._raf = requestAnimationFrame(frame);
      else { renderCounter(el, value); el._raf = null; }
    }
    el._raf = requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------
     3. 3D card tilt — max 8deg, lerped with rAF, glare follows
     --------------------------------------------------------- */
  var MAX_TILT = 8;

  function initTilt() {
    var cards = $$("[data-tilt]");
    if (!cards.length || prefersReduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    cards.forEach(function (card) {
      var state = { tx: 0, ty: 0, gx: 50, gy: 50, targetTx: 0, targetTy: 0, targetGx: 50, targetGy: 50, glare: 0, targetGlare: 0, raf: null };

      function apply() {
        state.tx += (state.targetTx - state.tx) * 0.16;
        state.ty += (state.targetTy - state.ty) * 0.16;
        state.gx += (state.targetGx - state.gx) * 0.2;
        state.gy += (state.targetGy - state.gy) * 0.2;
        state.glare += (state.targetGlare - state.glare) * 0.18;

        card.style.setProperty("--tilt-x", state.tx.toFixed(3) + "deg");
        card.style.setProperty("--tilt-y", state.ty.toFixed(3) + "deg");
        card.style.setProperty("--glare-x", state.gx.toFixed(2) + "%");
        card.style.setProperty("--glare-y", state.gy.toFixed(2) + "%");
        card.style.setProperty("--glare-o", state.glare.toFixed(3));

        var settled =
          Math.abs(state.targetTx - state.tx) < 0.02 &&
          Math.abs(state.targetTy - state.ty) < 0.02 &&
          Math.abs(state.targetGlare - state.glare) < 0.01;

        if (settled) {
          state.raf = null;
          card.style.setProperty("--tilt-x", state.targetTx.toFixed(2) + "deg");
          card.style.setProperty("--tilt-y", state.targetTy.toFixed(2) + "deg");
          card.style.setProperty("--glare-o", state.targetGlare.toFixed(2));
        } else {
          state.raf = requestAnimationFrame(apply);
        }
      }

      function kick() { if (!state.raf) state.raf = requestAnimationFrame(apply); }

      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        state.targetTy = (px - 0.5) * MAX_TILT * 2;
        state.targetTx = (0.5 - py) * MAX_TILT * 2;
        state.targetGx = px * 100;
        state.targetGy = py * 100;
        state.targetGlare = 0.85;
        kick();
      });

      card.addEventListener("pointerleave", function () {
        state.targetTx = 0;
        state.targetTy = 0;
        state.targetGx = 50;
        state.targetGy = 50;
        state.targetGlare = 0;
        kick();
      });
    });
  }

  /* ---------------------------------------------------------
     4. Sticky header shadow on scroll
     --------------------------------------------------------- */
  function initHeaderScroll() {
    var header = $("[data-site-header]");
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------
     5. Donation widget (donate.html)
     --------------------------------------------------------- */
  var MEALS_PER_DOLLAR = 3;

  function initDonationWidget() {
    var widget = $("[data-give-widget]");
    if (!widget) return;

    var form = $("form", widget);
    var freqButtons = $$("[data-frequency]", widget);
    var amountButtons = $$("[data-amount]", widget);
    var customInput = $("[data-custom-amount]", widget);
    var mealsEl = $("[data-meals]", widget);
    var headlineEl = $("[data-impact-headline]", widget);
    var subEl = $("[data-impact-sub]", widget);
    var submitBtn = $("button[type=submit]", widget);
    var statusEl = $("[data-give-status]", widget);

    var state = { frequency: "once", amount: 60, source: "preset" };

    function currentAmount() {
      if (state.source === "custom") {
        var v = parseFloat(customInput ? customInput.value : "");
        return isNaN(v) || v < 1 ? 0 : Math.round(v * 100) / 100;
      }
      return state.amount;
    }

    function impactCopy(amount) {
      if (amount >= 500) return "a month of Mobile Market stops for one town";
      if (amount >= 250) return "a full Family Kit shelf for one pantry";
      if (amount >= 120) return "two weeks of weekday dinners for a family of four";
      if (amount >= 60) return "ten days of school-week backpack meals";
      if (amount >= 25) return "a week of fresh produce for one household";
      if (amount >= 10) return "hot suppers for a household this weekend";
      if (amount > 0) return "breakfast for a neighbour tomorrow morning";
      return "choose an amount to see what it unlocks";
    }

    function update() {
      var amount = currentAmount();
      var meals = Math.round(amount * MEALS_PER_DOLLAR);
      retarget(mealsEl, meals);
      if (headlineEl) headlineEl.textContent = amount > 0 ? impactCopy(amount) : impactCopy(0);
      if (subEl) {
        if (state.frequency === "monthly") {
          subEl.textContent = "Billed monthly — " + Math.round(amount * 12 * MEALS_PER_DOLLAR).toLocaleString("en-US") +
            " meals a year, cancelled any time.";
          subEl.hidden = false;
        } else if (amount > 0) {
          subEl.textContent = "One gift. 91¢ of every dollar buys or rescues food.";
          subEl.hidden = false;
        } else {
          subEl.hidden = true;
        }
      }
      if (submitBtn) {
        submitBtn.textContent = amount > 0
          ? "Give $" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) +
            (state.frequency === "monthly" ? " monthly" : " once")
          : "Pick an amount";
        submitBtn.disabled = amount <= 0;
      }
    }

    freqButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.frequency = btn.getAttribute("data-frequency");
        freqButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        update();
      });
    });

    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.source = "preset";
        state.amount = parseFloat(btn.getAttribute("data-amount"));
        amountButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        if (customInput) customInput.value = "";
        update();
      });
    });

    if (customInput) {
      customInput.addEventListener("input", function () {
        state.source = "custom";
        amountButtons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        update();
      });
    }

    if (statusEl) {
      var hiddenFreq = $("[data-frequency-field]", widget);
      if (hiddenFreq) hiddenFreq.value = state.frequency;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var amount = currentAmount();
      if (amount <= 0) {
        if (customInput) customInput.focus();
        return;
      }

      /* validate the donor details */
      var bad = null;
      $$("input[required], select[required]", form).forEach(function (input) {
        if (!bad && !input.value.trim()) bad = input;
        if (!bad && input.type === "email" && input.value.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) bad = input;
      });
      if (bad) {
        bad.reportValidity();
        bad.focus();
        return;
      }

      if (hiddenFreq) hiddenFreq.value = state.frequency;

      submitBtn.disabled = true;
      submitBtn.textContent = "Processing…";

      var again = $("[data-give-again]", widget);
      if (again) {
        again.addEventListener("click", function () {
          widget.setAttribute("data-state", "form");
          submitBtn.disabled = false;
          update();
          var first = freqButtons[0];
          if (first) first.focus();
        });
      }

      window.setTimeout(function () {
        var amountOut = $("[data-receipt-amount]");
        var freqOut = $("[data-receipt-frequency]");
        var mealsOut = $("[data-receipt-meals]");
        var fundOut = $("[data-receipt-fund]");
        var nameOut = $("[data-receipt-name]");
        var emailOut = $("[data-receipt-email]");

        if (amountOut) amountOut.textContent = "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
        if (freqOut) freqOut.textContent = state.frequency === "monthly" ? "Every month" : "One-time gift";
        if (mealsOut) mealsOut.textContent = Math.round(amount * MEALS_PER_DOLLAR).toLocaleString("en-US") + " meals";
        if (fundOut) {
          var checked = $("input[name='fund']:checked", form);
          fundOut.textContent = checked ? checked.getAttribute("data-fund-label") : "Where it is needed most";
        }
        var nameField = $("#donor-name", form);
        var emailField = $("#donor-email", form);
        if (nameOut && nameField) nameOut.textContent = nameField.value.trim();
        if (emailOut && emailField) emailOut.textContent = emailField.value.trim();

        widget.setAttribute("data-state", "done");
        var success = $("[data-give-success]", widget);
        if (success) {
          var focusTarget = $("[data-give-again]", widget);
          success.setAttribute("tabindex", "-1");
          success.focus();
          if (focusTarget) focusTarget.focus();
        }
      }, 900);
    });

    update();
  }

  /* ---------------------------------------------------------
     6. Volunteer application (volunteer.html)
     --------------------------------------------------------- */
  function initVolunteerForm() {
    var form = $("[data-volunteer-form]");
    if (!form) return;
    var success = $("[data-volunteer-success]");
    var submit = $("button[type=submit]", form);

    var validators = [
      { id: "vol-name", test: function (v) { return v.trim().length >= 2; }, msg: "Please enter your full name." },
      { id: "vol-email", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "Enter an email we can reach you at, like name@example.com." },
      { id: "vol-phone", test: function (v) { return v.replace(/\D/g, "").length >= 10; }, msg: "Enter a 10-digit phone number, including area code." },
      { id: "vol-zip", test: function (v) { return /^\d{5}$/.test(v.trim()); }, msg: "Enter a five-digit ZIP code so we can match you to a nearby site." }
    ];

    function setError(input, msg) {
      var field = input.closest(".field");
      if (!field) return;
      var out = $(".field-error", field);
      field.classList.toggle("has-error", Boolean(msg));
      if (out) out.textContent = msg || "";
      input.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    validators.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      if (!input) return;
      input.addEventListener("blur", function () {
        setError(input, rule.test(input.value) ? "" : rule.msg);
      });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("has-error") && rule.test(input.value)) setError(input, "");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;

      validators.forEach(function (rule) {
        var input = document.getElementById(rule.id);
        if (!input) return;
        var ok = rule.test(input.value);
        setError(input, ok ? "" : rule.msg);
        if (!ok && !firstBad) firstBad = input;
      });

      var shifts = $$("input[name='shifts']:checked", form);
      var shiftError = $("[data-shift-error]");
      if (!shifts.length) {
        if (shiftError) { shiftError.textContent = "Pick at least one shift you could work."; shiftError.style.display = "block"; }
        if (!firstBad) firstBad = $$("input[name='shifts']", form)[0];
      } else if (shiftError) {
        shiftError.style.display = "none";
      }

      var consent = $("#vol-consent");
      if (consent && !consent.checked) {
        var cField = consent.closest(".field");
        if (cField) { cField.classList.add("has-error"); var o = $(".field-error", cField); if (o) { o.textContent = "We need your agreement to email you about shifts."; o.style.display = "block"; } }
        if (!firstBad) firstBad = consent;
      } else if (consent) {
        var cf = consent.closest(".field");
        if (cf) { cf.classList.remove("has-error"); }
      }

      if (firstBad) { firstBad.focus(); return; }

      submit.disabled = true;
      submit.textContent = "Sending…";

      window.setTimeout(function () {
        var name = $("#vol-name").value.trim().split(/\s+/)[0];
        var chosen = $$("input[name='shifts']:checked", form)
          .map(function (i) { return i.parentNode.querySelector(".shift-title-text") ? i.parentNode.querySelector(".shift-title-text").textContent : i.value; });
        var outName = $("[data-vol-out-name]");
        var outShifts = $("[data-vol-out-shifts]");
        var outId = $("[data-vol-out-id]");
        if (outName) outName.textContent = name;
        if (outShifts) outShifts.textContent = chosen.join(", ");
        if (outId) outId.textContent = "BH-" + String(Math.floor(1000 + Math.random() * 8999));

        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.setAttribute("tabindex", "-1");
          success.focus();
        }
      }, 800);
    });
  }

  /* ---------------------------------------------------------
     7. Newsletter (footer, all pages)
     --------------------------------------------------------- */
  function initNewsletter() {
    $$("[data-newsletter]").forEach(function (form) {
      var status = $("[data-newsletter-status]", form);
      var input = $("input", form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var value = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          if (status) { status.textContent = "That email looks incomplete — check for a typo."; status.style.color = "#ffd0b0"; }
          input.focus();
          return;
        }
        input.value = "";
        if (status) {
          status.textContent = "You are on the list. Next impact letter goes out on the first Tuesday.";
          status.style.color = "#fde8b8";
        }
      });
    });
  }

  /* ---------------------------------------------------------
     8. Filters (programs / stories / contact)
     --------------------------------------------------------- */
  function initFilters() {
    var group = $("[data-filter-group]");
    if (!group) return;
    var buttons = $$("[data-filter]", group);
    var items = $$("[data-filterable]");
    if (!items.length) return;

    var countOut = $("[data-filter-count]");

    function apply(tag) {
      var shown = 0;
      items.forEach(function (item) {
        var tags = (item.getAttribute("data-tags") || "").split(/\s+/);
        var match = tag === "all" || tags.indexOf(tag) !== -1;
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (countOut) {
        countOut.textContent = shown === items.length
          ? "Showing all " + items.length
          : "Showing " + shown + " of " + items.length;
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        apply(btn.getAttribute("data-filter"));
      });
    });

    apply("all");
  }

  /* ---------------------------------------------------------
     9. Generic message form (contact.html)
     --------------------------------------------------------- */
  function initSimpleForm() {
    $$("[data-simple-form]").forEach(function (form) {
      var status = $("[data-simple-status]", form);
      var submit = $("button[type=submit]", form);
      var done = false;

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (done) {
          form.reset();
          done = false;
          submit.textContent = "Send message";
          if (status) status.textContent = "Demo form — nothing is transmitted.";
        }

        var firstBad = null;
        $$("input[required], select[required], textarea[required]", form).forEach(function (input) {
          var ok = Boolean(input.value.trim());
          if (ok && input.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
          if (!ok && !firstBad) firstBad = input;
        });

        if (firstBad) {
          firstBad.reportValidity();
          firstBad.focus();
          if (status) status.textContent = "Two fields need filling before we can route this.";
          return;
        }

        submit.disabled = true;
        submit.textContent = "Sending…";

        window.setTimeout(function () {
          var name = $("#ct-name");
          submit.disabled = false;
          submit.textContent = "Send another message";
          done = true;
          if (status) {
            status.textContent = (form.getAttribute("data-success-text") || "Message logged.") +
              (name && name.value.trim() ? " Thanks, " + name.value.trim().split(/\s+/)[0] + "." : "");
          }
          form.reset();
        }, 700);
      });
    });
  }

  /* ---------------------------------------------------------
     10. Boot
     --------------------------------------------------------- */
  function boot() {
    initNav();
    initCounters();
    initTilt();
    initHeaderScroll();
    initDonationWidget();
    initVolunteerForm();
    initNewsletter();
    initFilters();
    initSimpleForm();

    var year = $("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
