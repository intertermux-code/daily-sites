/* Bright Harvest — shared behaviour */
(function () {
  "use strict";

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function reduced() { return motionQuery.matches; }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.setAttribute("data-open", String(!open));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.setAttribute("data-open", "false");
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        nav.setAttribute("data-open", "false");
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) {
        toggle.setAttribute("aria-expanded", "false");
        nav.setAttribute("data-open", "false");
      }
    });
  }

  /* ---------- Decode Text (signature motion) ---------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@*+=/\\<>{}[]§¤±×÷◇◆▚▞░▒▓█";
  function decodeElement(el) {
    var target = el.getAttribute("data-decode") || el.textContent.trim();
    var chars = Array.from(target);
    if (reduced()) { el.textContent = target; return; }
    var frame = 0;
    var perChar = 3;
    var holdAfter = 8;
    el.textContent = new Array(chars.length + 1).join(" ");
    function step() {
      frame += 1;
      var settled = Math.floor(frame / perChar);
      var out = "";
      for (var i = 0; i < chars.length; i += 1) {
        if (i < settled || chars[i] === " ") {
          out += chars[i];
        } else {
          out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
      }
      el.textContent = out;
      if (settled < chars.length || frame < chars.length * perChar + holdAfter) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }
  var decodeNodes = document.querySelectorAll("[data-decode]");
  if (decodeNodes.length) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(function () {
        Array.prototype.forEach.call(decodeNodes, decodeElement);
      }, { timeout: 320 });
    } else {
      window.addEventListener("load", function () {
        Array.prototype.forEach.call(decodeNodes, decodeElement);
      });
    }
  }

  /* ---------- Impact counters ---------- */
  function formatNumber(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (isNaN(target)) return;
    if (reduced()) { el.textContent = formatNumber(target, decimals); return; }
    var duration = parseInt(el.getAttribute("data-duration") || "1700", 10);
    var start = null;
    function tick(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(target * eased, decimals);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatNumber(target, decimals);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(counters, function (el) { counterObserver.observe(el); });
  } else {
    Array.prototype.forEach.call(counters, runCounter);
  }

  /* ---------- Horizontal diorama ---------- */
  var dioramas = document.querySelectorAll("[data-diorama]");
  Array.prototype.forEach.call(dioramas, function (root) {
    var track = root.querySelector(".diorama__track");
    var fill = root.querySelector(".diorama__fill");
    var prev = root.querySelector("[data-diorama-prev]");
    var next = root.querySelector("[data-diorama-next]");
    if (!track) return;

    function stepSize() {
      var panel = track.querySelector(".chapter, .diorama__panel");
      if (!panel) return track.clientWidth * 0.8;
      var styles = getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      return panel.getBoundingClientRect().width + gap;
    }
    function scrollBy_(direction) {
      track.scrollBy({ left: direction * stepSize(), behavior: reduced() ? "auto" : "smooth" });
    }
    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      var ratio = max > 0 ? track.scrollLeft / max : 1;
      if (fill) fill.style.transform = "scaleX(" + Math.max(0.06, ratio) + ")";
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= max - 4;
    }
    if (prev) prev.addEventListener("click", function () { scrollBy_(-1); });
    if (next) next.addEventListener("click", function () { scrollBy_(1); });
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();

    /* mouse drag (touch uses native scrolling) */
    var dragging = false, startX = 0, startScroll = 0, moved = 0;
    track.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true; moved = 0;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.setAttribute("data-dragging", "true");
    });
    track.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      var delta = event.clientX - startX;
      if (Math.abs(delta) > 4) {
        moved = Math.abs(delta);
        track.scrollLeft = startScroll - delta;
      }
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
      track.addEventListener(name, function () {
        dragging = false;
        track.removeAttribute("data-dragging");
      });
    });
    track.addEventListener("click", function (event) {
      if (moved > 8) { event.preventDefault(); event.stopPropagation(); }
    }, true);
  });

  /* ---------- Spring accordion (one panel at a time) ---------- */
  var accordions = document.querySelectorAll("[data-accordion]");
  Array.prototype.forEach.call(accordions, function (acc) {
    var items = Array.prototype.slice.call(acc.querySelectorAll(".acc__item"));
    items.forEach(function (item, index) {
      var button = item.querySelector(".acc__btn");
      var panel = item.querySelector(".acc__panel");
      if (!button || !panel) return;
      var panelId = "acc-panel-" + index + "-" + (acc.id || "x");
      var buttonId = "acc-btn-" + index + "-" + (acc.id || "x");
      panel.id = panelId;
      button.id = buttonId;
      button.setAttribute("aria-controls", panelId);
      panel.setAttribute("aria-labelledby", buttonId);
      button.addEventListener("click", function () {
        var isOpen = item.getAttribute("data-open") === "true";
        items.forEach(function (other) {
          other.setAttribute("data-open", "false");
          var b = other.querySelector(".acc__btn");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.setAttribute("data-open", "true");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  });

  /* ---------- Donation widget ---------- */
  var giveForm = document.getElementById("give-form");
  if (giveForm) {
    var COST_PER_MEAL = 1.19;
    var thanksPanel = document.getElementById("give-thanks");
    var amountRadios = giveForm.querySelectorAll('input[name="amount"]');
    var customWrap = document.getElementById("custom-disclose");
    var customField = document.getElementById("custom-field");
    var customInput = document.getElementById("custom-amount");
    var amountError = document.getElementById("amount-error");
    var readoutNum = document.getElementById("impact-meals");
    var readoutLabel = document.getElementById("impact-label");
    var submitBtn = document.getElementById("give-submit");

    function selectedFrequency() {
      var checked = giveForm.querySelector('input[name="frequency"]:checked');
      return checked ? checked.value : "once";
    }
    function currentAmount() {
      var checked = giveForm.querySelector('input[name="amount"]:checked');
      if (!checked) return 0;
      if (checked.value === "other") {
        var value = parseFloat(customInput.value);
        return isNaN(value) || value < 1 ? 0 : value;
      }
      return parseFloat(checked.value);
    }
    function mealsFor(amount) {
      return Math.round(amount / COST_PER_MEAL);
    }
    function feeTotal(amount) {
      var fee = document.getElementById("cover-fee");
      return fee && fee.checked ? Math.round(amount * 1.03 * 100) / 100 : amount;
    }
    function frequencyCopy(freq) {
      if (freq === "monthly") return "Every month, starting today";
      if (freq === "annual") return "Once a year, on this date";
      return "One gift, today";
    }
    function render() {
      var amount = currentAmount();
      var freq = selectedFrequency();
      if (!amount) {
        readoutNum.textContent = "—";
        readoutLabel.textContent = "Pick an amount to see your impact";
        return;
      }
      var meals = mealsFor(amount);
      readoutNum.textContent = meals.toLocaleString("en-US");
      if (freq === "monthly") {
        readoutLabel.textContent = "meals every month — " + (meals * 12).toLocaleString("en-US") + " meals across a year";
      } else if (freq === "annual") {
        readoutLabel.textContent = "meals, delivered as one annual stock-up for neighbors";
      } else {
        readoutLabel.textContent = "meals, on the shelf within 48 hours";
      }
    }

    Array.prototype.forEach.call(amountRadios, function (radio) {
      radio.addEventListener("change", function () {
        var isOther = radio.value === "other";
        customWrap.setAttribute("data-open", String(isOther));
        if (isOther) {
          customInput.focus();
        } else {
          customField.setAttribute("data-invalid", "false");
          amountError.textContent = "";
        }
        render();
      });
    });
    customInput.addEventListener("input", render);
    Array.prototype.forEach.call(giveForm.querySelectorAll('input[name="frequency"]'), function (radio) {
      radio.addEventListener("change", render);
    });
    document.getElementById("cover-fee").addEventListener("change", render);

    giveForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = document.getElementById("donor-email");
      var emailField = email.closest(".field");
      var firstBad = null;

      if (!currentAmount()) {
        amountError.textContent = "Choose a preset amount or type your own — the minimum is $1.";
        var openCustom = customWrap.getAttribute("data-open") === "true";
        if (openCustom) {
          customField.setAttribute("data-invalid", "true");
          customField.querySelector(".field__error").textContent = "Type a number of at least 1.";
          firstBad = customInput;
        } else {
          customField.setAttribute("data-invalid", "false");
          firstBad = giveForm.querySelector('input[name="amount"]');
        }
      } else {
        amountError.textContent = "";
        customField.setAttribute("data-invalid", "false");
      }

      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.value.trim())) {
        emailField.setAttribute("data-invalid", "true");
        emailField.querySelector(".field__error").textContent = "Enter an email we can send your receipt to, like name@example.org.";
        if (!firstBad) firstBad = email;
      } else {
        emailField.setAttribute("data-invalid", "false");
      }

      if (firstBad) {
        firstBad.focus();
        return;
      }

      var charged = feeTotal(currentAmount());
      var freq = selectedFrequency();
      var original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Securing your gift…";

      window.setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;

        document.getElementById("receipt-amount").textContent = "$" + charged.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById("receipt-frequency").textContent = freq === "monthly" ? "Monthly" : freq === "annual" ? "Annually" : "One-time";
        document.getElementById("receipt-meals").textContent = mealsFor(charged).toLocaleString("en-US") + " meals";
        document.getElementById("receipt-email").textContent = email.value.trim();
        document.getElementById("receipt-ref").textContent = "BH-" + String(Math.floor(Math.random() * 90000) + 10000);

        giveForm.hidden = true;
        thanksPanel.hidden = false;
        burstConfetti(thanksPanel);
        var heading = thanksPanel.querySelector("h2");
        if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
      }, reduced() ? 120 : 900);
    });

    var resetBtn = document.getElementById("give-again");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        thanksPanel.hidden = true;
        giveForm.hidden = false;
        var firstRadio = giveForm.querySelector('input[name="amount"]');
        if (firstRadio) firstRadio.focus();
      });
    }
    render();
  }

  function burstConfetti(container) {
    if (reduced()) return;
    var layer = container.querySelector(".confetti");
    if (!layer) return;
    layer.removeAttribute("data-burst");
    layer.innerHTML = "";
    for (var i = 0; i < 26; i += 1) {
      var bit = document.createElement("i");
      var angle = Math.random() * Math.PI * 2;
      var distance = 90 + Math.random() * 240;
      bit.style.left = (35 + Math.random() * 30) + "%";
      bit.style.top = (20 + Math.random() * 25) + "%";
      bit.style.setProperty("--cx", Math.cos(angle) * distance + "px");
      bit.style.setProperty("--cy", Math.sin(angle) * distance - 40 + "px");
      bit.style.setProperty("--cr", Math.round(Math.random() * 720 - 360) + "deg");
      bit.style.animationDelay = Math.round(Math.random() * 220) + "ms";
      layer.appendChild(bit);
    }
    void layer.offsetWidth;
    layer.setAttribute("data-burst", "true");
  }

  /* ---------- Volunteer signup ---------- */
  var volunteerForm = document.getElementById("volunteer-form");
  if (volunteerForm) {
    var confirmation = document.getElementById("volunteer-confirm");
    var rules = {
      firstName: { test: function (v) { return v.trim().length >= 2; }, message: "Please tell us your first name." },
      lastName: { test: function (v) { return v.trim().length >= 2; }, message: "Please tell us your last name so we can find you on the roster." },
      email: { test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); }, message: "Enter a valid email, like name@example.org — this is where we send your shift." },
      phone: { test: function (v) { return v.replace(/\D/g, "").length >= 10; }, message: "Enter a 10-digit phone number so the coordinator can text you about cancellations." },
      zip: { test: function (v) { return /^\d{5}$/.test(v.trim()); }, message: "Enter a 5-digit ZIP code so we can place you at a site near you." },
      availability: { test: function (v) { return v !== ""; }, message: "Pick the window that fits your week — you can change it any time after." }
    };

    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var field = input.closest(".field");
      if (!field) return true;
      var ok = rule.test(input.value);
      field.setAttribute("data-invalid", ok ? "false" : "true");
      var errEl = field.querySelector(".field__error");
      if (errEl) errEl.textContent = ok ? "" : rule.message;
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }

    Array.prototype.forEach.call(volunteerForm.querySelectorAll("input, select, textarea"), function (input) {
      if (!rules[input.name]) return;
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.getAttribute("data-invalid") === "true") validateField(input);
      });
    });

    volunteerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var allOk = true;
      var firstBad = null;

      Array.prototype.forEach.call(volunteerForm.querySelectorAll("input, select, textarea"), function (input) {
        if (!rules[input.name]) return;
        var ok = validateField(input);
        if (!ok && !firstBad) firstBad = input;
        if (!ok) allOk = false;
      });

      var interests = volunteerForm.querySelectorAll('input[name="interest"]:checked');
      var interestField = document.getElementById("interest-field");
      if (interests.length === 0) {
        interestField.setAttribute("data-invalid", "true");
        interestField.querySelector(".field__error").textContent = "Pick at least one role — you can always change it later.";
        if (!firstBad) firstBad = interestField.querySelector("input");
        allOk = false;
      } else {
        interestField.setAttribute("data-invalid", "false");
      }

      var consent = document.getElementById("consent");
      var consentField = consent.closest(".field");
      if (!consent.checked) {
        consentField.setAttribute("data-invalid", "true");
        consentField.querySelector(".field__error").textContent = "We need your okay to contact you about shifts.";
        if (!firstBad) firstBad = consent;
        allOk = false;
      } else {
        consentField.setAttribute("data-invalid", "false");
      }

      var summary = document.getElementById("form-summary");
      if (!allOk) {
        summary.hidden = false;
        summary.textContent = "Almost there — the highlighted fields need a quick fix.";
        if (firstBad) firstBad.focus();
        return;
      }
      summary.hidden = true;

      var submit = document.getElementById("volunteer-submit");
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Saving your application…";

      window.setTimeout(function () {
        submit.disabled = false;
        submit.textContent = label;
        var chosen = Array.prototype.map.call(interests, function (input) {
          return input.closest(".check-inline").querySelector("span").textContent.trim();
        }).join(", ");
        document.getElementById("confirm-name").textContent = volunteerForm.elements.firstName.value.trim();
        document.getElementById("confirm-role").textContent = chosen;
        document.getElementById("confirm-window").textContent = volunteerForm.elements.availability.value;
        document.getElementById("confirm-email").textContent = volunteerForm.elements.email.value.trim();
        volunteerForm.hidden = true;
        confirmation.hidden = false;
        burstConfetti(confirmation);
        var heading = confirmation.querySelector("h2");
        if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
      }, reduced() ? 120 : 850);
    });
  }

  /* ---------- Newsletter forms ---------- */
  var newsForms = document.querySelectorAll("[data-newsletter]");
  Array.prototype.forEach.call(newsForms, function (form) {
    var input = form.querySelector('input[type="email"]');
    var status = form.parentNode.querySelector(".form-status");
    if (!input || !status) return;
    input.setAttribute("aria-describedby", status.id);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
        status.style.color = "#ffd6de";
        status.textContent = "That email looks off — check the address and try again.";
        input.focus();
        return;
      }
      status.style.color = "";
      status.textContent = "You're on the list. Harvest Notes lands the first Tuesday each month.";
      form.reset();
    });
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
