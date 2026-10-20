/* ==========================================================================
   Bright Harvest — shared behaviour
   Vanilla JS only. Every module is guarded by element existence so one file
   can serve every page. Motion honours prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function reduced() {
    return reduceQuery.matches;
  }

  /* ------------------------------------------------------------------------
     1. Scroll progress bar (2px, pinned to viewport top, scaleX)
     ------------------------------------------------------------------------ */
  function initProgress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;
    var queued = false;

    function write() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.setProperty("--progress", ratio.toFixed(4));
      queued = false;
    }

    function onScroll() {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(write);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    write();
  }

  /* ------------------------------------------------------------------------
     2. Decode Text — hero keyword resolves from glyph noise, runs once
     ------------------------------------------------------------------------ */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/<>@§¤∴≡";

  function initDecode() {
    var nodes = document.querySelectorAll("[data-decode]");
    if (!nodes.length) return;

    Array.prototype.forEach.call(nodes, function (node) {
      var target = node.getAttribute("data-decode") || node.textContent.trim();
      node.textContent = target;
      if (reduced()) {
        node.setAttribute("data-decode-done", "true");
        return;
      }

      var chars = target.split("");
      var settled = 0;
      var start = null;
      var perChar = 78;
      var noiseEvery = 42;
      var lastNoise = 0;

      function frame(now) {
        if (start === null) start = now;
        var elapsed = now - start;
        settled = Math.min(chars.length, Math.floor(elapsed / perChar));

        if (now - lastNoise > noiseEvery) {
          lastNoise = now;
          node.textContent = chars
            .map(function (ch, i) {
              if (i < settled || ch === " ") return ch;
              return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
            })
            .join("");
        }

        if (settled < chars.length) {
          window.requestAnimationFrame(frame);
        } else {
          node.textContent = target;
          node.setAttribute("data-decode-done", "true");
        }
      }

      window.requestAnimationFrame(frame);
    });
  }

  /* ------------------------------------------------------------------------
     3. Impact counters — roll up when the instrument enters view
     ------------------------------------------------------------------------ */
  function format(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    function run(node) {
      var end = parseFloat(node.getAttribute("data-count"));
      if (isNaN(end)) return;
      var decimals = parseInt(node.getAttribute("data-decimals") || "0", 10);
      var prefix = node.getAttribute("data-prefix") || "";
      var suffix = node.getAttribute("data-suffix") || "";
      var duration = parseInt(node.getAttribute("data-duration") || "1500", 10);

      if (reduced()) {
        node.textContent = prefix + format(end, decimals) + suffix;
        return;
      }

      var start = null;
      function tick(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        node.textContent = prefix + format(end * eased, decimals) + suffix;
        if (t < 1) window.requestAnimationFrame(tick);
      }
      window.requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, run);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.25 }
    );

    Array.prototype.forEach.call(nodes, function (node) {
      observer.observe(node);
    });
  }

  /* ------------------------------------------------------------------------
     4. Gauges — bars fill from zero when scrolled into the board
     ------------------------------------------------------------------------ */
  function initGauges() {
    var fills = document.querySelectorAll("[data-level]");
    if (!fills.length) return;

    function settle(node) {
      var level = node.getAttribute("data-level");
      node.style.setProperty("--level", level);
    }

    if (reduced() || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(fills, settle);
      return;
    }

    Array.prototype.forEach.call(fills, function (node) {
      node.style.setProperty("--level", "0");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          settle(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );

    Array.prototype.forEach.call(fills, function (node) {
      observer.observe(node);
    });
  }

  /* ------------------------------------------------------------------------
     5. Mobile navigation
     ------------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    var desktop = window.matchMedia("(min-width: 62rem)");

    function setOpen(open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(nav.getAttribute("data-open") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (nav.getAttribute("data-open") !== "true") return;
      setOpen(false);
      toggle.focus();
    });

    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (link && !desktop.matches) setOpen(false);
    });

    function syncMode() {
      if (desktop.matches) setOpen(false);
    }

    if (desktop.addEventListener) {
      desktop.addEventListener("change", syncMode);
    } else if (desktop.addListener) {
      desktop.addListener(syncMode);
    }
  }

  /* ------------------------------------------------------------------------
     6. FAQ disclosure
     ------------------------------------------------------------------------ */
  function initFaq() {
    var buttons = document.querySelectorAll("[data-faq-toggle]");
    if (!buttons.length) return;

    Array.prototype.forEach.call(buttons, function (button) {
      var panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;

      panel.hidden = true;

      button.addEventListener("click", function () {
        var open = button.getAttribute("aria-expanded") === "true";
        if (open) {
          button.setAttribute("aria-expanded", "false");
          panel.dataset.open = "false";
          if (reduced()) {
            panel.hidden = true;
            return;
          }
          var done = function (event) {
            if (event.target !== panel) return;
            panel.removeEventListener("transitionend", done);
            if (button.getAttribute("aria-expanded") === "false") panel.hidden = true;
          };
          panel.addEventListener("transitionend", done);
          window.setTimeout(function () {
            if (button.getAttribute("aria-expanded") === "false") panel.hidden = true;
          }, 600);
        } else {
          panel.hidden = false;
          void panel.offsetHeight;
          button.setAttribute("aria-expanded", "true");
          panel.dataset.open = "true";
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     7. Ops board clock ("last sync")
     ------------------------------------------------------------------------ */
  function initSyncClock() {
    var nodes = document.querySelectorAll("[data-sync-clock]");
    if (!nodes.length) return;

    function paint() {
      var now = new Date();
      var text =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");
      Array.prototype.forEach.call(nodes, function (node) {
        node.textContent = text;
      });
    }

    paint();
    window.setInterval(paint, 1000);
  }

  /* ------------------------------------------------------------------------
     8. Wide tables — show an edge fade only while columns are hidden
     ------------------------------------------------------------------------ */
  function initTableScroll() {
    var boxes = document.querySelectorAll(".table-scroll");
    if (!boxes.length) return;

    Array.prototype.forEach.call(boxes, function (box) {
      function paint() {
        var max = box.scrollWidth - box.clientWidth;
        box.toggleAttribute("data-more-left", box.scrollLeft > 2);
        box.toggleAttribute("data-more-right", box.scrollLeft < max - 2);
      }
      box.addEventListener("scroll", paint, { passive: true });
      window.addEventListener("resize", paint);
      paint();
    });
  }

  /* ------------------------------------------------------------------------
     9. Donation widget (donate.html)
     ------------------------------------------------------------------------ */
  var MEAL_COST = 0.63;

  function initDonateWidget() {
    var form = document.getElementById("donate-form");
    if (!form) return;

    var success = document.getElementById("donate-success");
    var readout = document.getElementById("impact-meals");
    var readoutNote = document.getElementById("impact-note");
    var customInput = document.getElementById("custom-amount");
    var customRadio = document.querySelector('input[name="amount"][value="custom"]');
    var emailField = document.getElementById("donor-email");
    var nameField = document.getElementById("donor-name");
    var submit = form.querySelector('[type="submit"]');

    function selectedAmount() {
      var picked = form.querySelector('input[name="amount"]:checked');
      if (!picked) return 0;
      if (picked.value === "custom") {
        return Math.max(0, parseFloat(customInput.value) || 0);
      }
      return parseFloat(picked.value) || 0;
    }

    function frequency() {
      var picked = form.querySelector('input[name="frequency"]:checked');
      return picked ? picked.value : "one-time";
    }

    function designationLabel() {
      var select = document.getElementById("designation");
      if (!select) return "";
      var option = select.options[select.selectedIndex];
      return option ? option.textContent.trim() : "";
    }

    function paintImpact() {
      var amount = selectedAmount();
      if (!readout) return;
      var monthly = frequency() === "monthly";
      var meals = Math.floor(amount / MEAL_COST);
      var annual = meals * 12;
      readout.textContent = meals.toLocaleString("en-US");
      if (readoutNote) {
        if (amount <= 0) {
          readoutNote.textContent =
            "Choose an amount to see exactly what it puts on a table.";
        } else if (monthly) {
          readoutNote.textContent =
            "every month — about " +
            annual.toLocaleString("en-US") +
            " meals across your first year at $0.63 per meal.";
        } else {
          readoutNote.textContent =
            "in one gift — enough to stock a family box for three days at $0.63 per meal.";
        }
      }
    }

    form.addEventListener("change", function (event) {
      if (event.target.name === "amount" && event.target.value !== "custom") {
        customInput.value = "";
      }
      if (event.target === customInput && customInput.value !== "") {
        if (customRadio) customRadio.checked = true;
      }
      if (event.target.name === "amount" && event.target.value === "custom") {
        customInput.focus();
      }
      paintImpact();
    });

    customInput.addEventListener("input", paintImpact);

    function showError(field, message) {
      var slot = document.getElementById(field.id + "-error");
      field.setAttribute("aria-invalid", "true");
      if (slot) slot.textContent = message;
    }

    function clearError(field) {
      var slot = document.getElementById(field.id + "-error");
      field.removeAttribute("aria-invalid");
      if (slot) slot.textContent = "";
    }

    function validate() {
      var problems = [];
      var amountSlot = document.getElementById("donate-amount-group-error");
      [nameField, emailField].forEach(clearError);
      if (amountSlot) amountSlot.textContent = "";
      var amount = selectedAmount();

      if (amount < 5) {
        if (amountSlot) amountSlot.textContent = "Choose a gift of $5 or more.";
        problems.push({
          id: "donate-amount-group",
          text: "Choose a gift of $5 or more."
        });
      }
      if (!nameField.value.trim()) {
        showError(nameField, "We need a name for your receipt.");
        problems.push({ id: nameField.id, text: "Enter the name for your receipt." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(emailField.value.trim())) {
        showError(emailField, "Enter an email address like you@example.com.");
        problems.push({ id: emailField.id, text: "Enter a valid email address." });
      }
      return problems;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var problems = validate();
      if (problems.length) {
        var first = document.getElementById(problems[0].id);
        if (first && first.focus) first.focus();
        return;
      }

      var amount = selectedAmount();
      var monthly = frequency() === "monthly";
      var meals = Math.floor(amount / MEAL_COST);

      submit.classList.add("is-busy");
      submit.disabled = true;
      submit.textContent = "Processing…";

      window.setTimeout(function () {
        submit.classList.remove("is-busy");
        submit.disabled = false;
        submit.textContent = "Complete my gift";

        document.getElementById("receipt-name").textContent =
          nameField.value.trim();
        document.getElementById("receipt-amount").textContent =
          "$" + amount.toFixed(2) + (monthly ? " monthly" : " one-time");
        document.getElementById("receipt-meals").textContent =
          meals.toLocaleString("en-US") + (monthly ? " meals every month" : " meals");
        document.getElementById("receipt-designation").textContent =
          designationLabel();
        document.getElementById("receipt-email").textContent = emailField.value.trim();
        document.getElementById("receipt-number").textContent =
          "BH-" +
          new Date().getFullYear() +
          "-" +
          String(Math.floor(100000 + Math.random() * 899999));

        form.hidden = true;
        success.hidden = false;
        success.focus();
      }, reduced() ? 120 : 900);
    });

    var again = document.getElementById("donate-again");
    if (again) {
      again.addEventListener("click", function () {
        success.hidden = true;
        form.hidden = false;
        form.reset();
        paintImpact();
        var firstAmount = form.querySelector('input[name="amount"]');
        if (firstAmount) firstAmount.focus();
      });
    }

    paintImpact();
  }

  /* ------------------------------------------------------------------------
     10. Volunteer signup (volunteer.html)
     ------------------------------------------------------------------------ */
  function initVolunteerForm() {
    var form = document.getElementById("volunteer-form");
    if (!form) return;

    var summary = document.getElementById("volunteer-errors");
    var summaryList = document.getElementById("volunteer-error-list");
    var success = document.getElementById("volunteer-success");

    var rules = [
      {
        fieldId: "vol-name",
        test: function (field) {
          return field.value.trim().length >= 2;
        },
        message: "Enter your full name."
      },
      {
        fieldId: "vol-email",
        test: function (field) {
          return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(field.value.trim());
        },
        message: "Enter a valid email address."
      },
      {
        fieldId: "vol-phone",
        test: function (field) {
          return field.value.replace(/\D/g, "").length >= 10;
        },
        message: "Enter a 10-digit phone number."
      },
      {
        fieldId: "vol-zip",
        test: function (field) {
          return /^\d{5}$/.test(field.value.trim());
        },
        message: "Enter a 5-digit ZIP code."
      },
      {
        fieldId: "vol-roles",
        test: function () {
          return form.querySelectorAll('input[name="role"]:checked').length > 0;
        },
        message: "Pick at least one role."
      },
      {
        fieldId: "vol-days",
        test: function () {
          return form.querySelectorAll('input[name="day"]:checked').length > 0;
        },
        message: "Pick at least one day you could work."
      },
      {
        fieldId: "vol-consent",
        test: function (field) {
          return field.checked;
        },
        message: "Confirm you agree to the pantry conduct policy."
      }
    ];

    function fieldFor(rule) {
      return document.getElementById(rule.fieldId);
    }

    function slotFor(rule) {
      return document.getElementById(rule.fieldId + "-error");
    }

    function setError(rule, on) {
      var field = fieldFor(rule);
      var slot = slotFor(rule);
      if (!on) {
        if (field) field.removeAttribute("aria-invalid");
        if (slot) slot.textContent = "";
        return;
      }
      if (field) field.setAttribute("aria-invalid", "true");
      if (slot) slot.textContent = rule.message;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var problems = [];

      rules.forEach(function (rule) {
        var field = fieldFor(rule);
        if (!field) return;
        var ok = rule.test(field);
        setError(rule, !ok);
        if (!ok) problems.push({ rule: rule, field: field });
      });

      if (problems.length) {
        summaryList.innerHTML = "";
        problems.forEach(function (item) {
          var li = document.createElement("li");
          var link = document.createElement("a");
          link.href = "#" + item.field.id;
          link.textContent = item.rule.message;
          li.appendChild(link);
          summaryList.appendChild(li);
        });
        summary.hidden = false;
        summary.focus();
        return;
      }

      summary.hidden = true;

      var submit = form.querySelector('[type="submit"]');
      submit.classList.add("is-busy");
      submit.disabled = true;
      submit.textContent = "Sending to the coordinator…";

      window.setTimeout(function () {
        submit.classList.remove("is-busy");
        submit.disabled = false;
        submit.textContent = "Send my application";

        var roles = form.querySelectorAll('input[name="role"]:checked');
        var days = form.querySelectorAll('input[name="day"]:checked');
        document.getElementById("volunteer-name-out").textContent = document
          .getElementById("vol-name")
          .value.trim();
        document.getElementById("volunteer-roles-out").textContent =
          roles.length + (roles.length === 1 ? " role" : " roles");
        document.getElementById("volunteer-days-out").textContent = Array.prototype.map
          .call(days, function (input) {
            return input.value;
          })
          .join(", ");

        form.hidden = true;
        success.hidden = false;
        success.focus();
      }, reduced() ? 120 : 850);
    });

    form.addEventListener("input", function (event) {
      rules.forEach(function (rule) {
        var field = fieldFor(rule);
        if (field && (field === event.target || field.contains(event.target))) {
          if (rule.test(field)) setError(rule, false);
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     11. Footer newsletter
     ------------------------------------------------------------------------ */
  function initNewsletter() {
    var form = document.getElementById("news-form");
    if (!form) return;

    var input = document.getElementById("news-email");
    var message = document.getElementById("news-message");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim());
      if (!ok) {
        input.setAttribute("aria-invalid", "true");
        message.dataset.state = "error";
        message.textContent = "That email does not look right — try again.";
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      message.dataset.state = "ok";
      message.textContent = "Added. Thursday dispatch, no more than that.";
      form.reset();
    });
  }

  /* ------------------------------------------------------------------------
     12. Boot
     ------------------------------------------------------------------------ */
  function boot() {
    initProgress();
    initDecode();
    initCounters();
    initGauges();
    initNav();
    initFaq();
    initSyncClock();
    initTableScroll();
    initDonateWidget();
    initVolunteerForm();
    initNewsletter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
