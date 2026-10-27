/* ============================================================
   Bright Harvest — shared behaviour
   Signature motion: Decode Text + Cursor Spotlight
   Vanilla JS, no dependencies. Every block is guarded by
   element-existence checks so one file serves all pages.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&*+=";

  /* ---------- 1. Mobile navigation ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav__toggle");
    var list = document.getElementById("site-nav-list");
    if (!toggle || !list) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      list.hidden = open;
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        list.hidden = true;
        toggle.focus();
      }
    });

    var mq = window.matchMedia("(min-width: 981px)");
    function sync() {
      if (mq.matches) {
        list.hidden = false;
        toggle.setAttribute("aria-expanded", "false");
      } else if (toggle.getAttribute("aria-expanded") !== "true") {
        list.hidden = true;
      }
    }
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else if (mq.addListener) mq.addListener(sync);
  }

  /* ---------- 2. Decode Text ----------
     One hero keyword scrambles through random glyphs, then
     resolves letter by letter. Runs once on load.            */
  function initDecode() {
    var nodes = document.querySelectorAll("[data-decode]");
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      var final = (node.getAttribute("data-decode") || node.textContent || "").trim();
      var len = Math.max(final.length, 1);

      if (reduceMotion) {
        node.textContent = final;
        node.setAttribute("data-settled", "true");
        return;
      }

      node.textContent = "";
      node.setAttribute("data-settled", "false");
      node.setAttribute("aria-live", "off");
      var readable = final;

      var settleStart = 8;
      var settleEvery = 4;
      var tail = 22;
      var total = settleStart + settleEvery * len + tail;
      var frame = 0;
      var last = 0;

      function step(now) {
        if (now - last >= 1000 / 30) {
          last = now;
          frame += 1;
          var out = "";
          for (var i = 0; i < len; i += 1) {
            var resolved = frame > settleStart + settleEvery * i;
            if (resolved) {
              out += readable.charAt(i);
            } else if (frame < settleStart + settleEvery * len + tail) {
              out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
            } else {
              out += readable.charAt(i);
            }
          }
          node.textContent = out;
        }
        if (frame < total) {
          requestAnimationFrame(step);
        } else {
          node.textContent = final;
          node.setAttribute("data-settled", "true");
        }
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- 3. Cursor Spotlight ----------
     Radial glow tracking the pointer inside [data-spotlight],
     writes CSS custom properties, throttled by rAF.          */
  function initSpotlight() {
    var zones = document.querySelectorAll("[data-spotlight]");
    if (!zones.length || reduceMotion) return;

    zones.forEach(function (zone) {
      var glow = zone.querySelector(".hero__spot");
      if (!glow) return;
      var queued = false;
      var x = 50;
      var y = 30;

      function write() {
        queued = false;
        glow.style.setProperty("--mx", x + "%");
        glow.style.setProperty("--my", y + "%");
      }
      function onMove(e) {
        var rect = zone.getBoundingClientRect();
        x = ((e.clientX - rect.left) / rect.width) * 100;
        y = ((e.clientY - rect.top) / rect.height) * 100;
        glow.classList.add("is-live");
        if (!queued) {
          queued = true;
          requestAnimationFrame(write);
        }
      }
      function onLeave() {
        glow.classList.remove("is-live");
      }
      zone.addEventListener("pointermove", onMove, { passive: true });
      zone.addEventListener("pointerleave", onLeave);
      zone.addEventListener("blur", onLeave);
    });
  }

  /* ---------- 4. Timeline Spine: drawing line + entry pop ---------- */
  function initSpine() {
    var spines = document.querySelectorAll("[data-spine]");
    if (!spines.length) return;

    if (reduceMotion) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    spines.forEach(function (spine) {
      var bar = spine.querySelector(".spine__progress");
      var items = spine.querySelectorAll(".reveal");

      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                io.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
        );
        items.forEach(function (el) { io.observe(el); });
      } else {
        items.forEach(function (el) { el.classList.add("is-in"); });
      }

      if (!bar) return;
      var ticking = false;
      function draw() {
        ticking = false;
        var rect = spine.getBoundingClientRect();
        var anchor = window.innerHeight * 0.62;
        var p = (anchor - rect.top) / (rect.height || 1);
        p = Math.max(0, Math.min(1, p));
        bar.style.transform =
          window.innerWidth <= 900
            ? "scaleY(" + p.toFixed(4) + ")"
            : "translateX(-50%) scaleY(" + p.toFixed(4) + ")";
      }
      function onScroll() {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(draw);
        }
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      draw();
    });
  }

  /* ---------- 5. Impact counters ---------- */
  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    function render(node, value) {
      var suffix = node.getAttribute("data-suffix") || "";
      var prefix = node.getAttribute("data-prefix") || "";
      var decimals = parseInt(node.getAttribute("data-decimals") || "0", 10);
      var text = value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      node.textContent = prefix + text + suffix;
    }

    function run(node) {
      var target = parseFloat(node.getAttribute("data-count"));
      if (isNaN(target)) return;
      if (reduceMotion) {
        render(node, target);
        return;
      }
      var dur = 1500;
      var start = null;
      function tick(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        render(node, target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else render(node, target);
      }
      requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(run);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- 6. Donation widget (donate.html) ---------- */
  var MEAL_COST = 1.85;

  function setInvalidField(field, ok, message) {
    if (!field || !field.id) return;
    var msg = document.querySelector('[data-error-for="' + field.id + '"]');
    if (ok) {
      clearInvalid(field, msg);
    } else {
      setInvalid(field, msg, message);
    }
  }

  function initDonate() {
    var form = document.getElementById("give-form");
    var panel = document.getElementById("give-thanks");
    if (!form) return;

    var amountInputs = form.querySelectorAll('input[type="radio"][name="amount"]');
    var customInput = document.getElementById("give-custom");
    var customField = customInput ? customInput.closest(".amt") : null;
    var freqInputs = form.querySelectorAll('input[type="radio"][name="frequency"]');
    var impact = document.getElementById("give-impact-text");
    var submit = form.querySelector('button[type="submit"]');
    var error = document.getElementById("give-error");

    function selectedAmount() {
      var active = form.querySelector('input[name="amount"]:checked');
      if (!active) return 0;
      if (active.value === "custom") {
        return parseFloat(customInput && customInput.value) || 0;
      }
      return parseFloat(active.value) || 0;
    }

    function isMonthly() {
      var f = form.querySelector('input[name="frequency"]:checked');
      return !!f && f.value === "monthly";
    }

    function paintImpact() {
      if (!impact) return;
      var amt = selectedAmount();
      impact.textContent = "";
      if (amt <= 0) {
        impact.textContent = "Choose an amount to see exactly where it goes.";
        return;
      }
      var meals = Math.round(amt / MEAL_COST);
      var strong = document.createElement("strong");
      if (isMonthly()) {
        strong.textContent = meals.toLocaleString("en-US") + " meals every month";
        impact.appendChild(strong);
        impact.appendChild(
          document.createTextNode(
            " — about " + (meals * 12).toLocaleString("en-US") + " a year, planned ahead"
          )
        );
      } else {
        strong.textContent = meals.toLocaleString("en-US") + " meals";
        impact.appendChild(strong);
        impact.appendChild(
          document.createTextNode(" on the shelves within 48 hours")
        );
      }
    }

    function paintStates() {
      amountInputs.forEach(function (input) {
        var label = input.closest(".amt");
        if (label) label.classList.toggle("is-on", input.checked);
      });
      freqInputs.forEach(function (input) {
        var label = input.closest(".seg__opt");
        if (label) label.classList.toggle("is-on", input.checked);
      });
    }

    amountInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        if (input.value === "custom" && customInput) customInput.focus();
        paintStates();
        paintImpact();
      });
    });
    freqInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        paintStates();
        paintImpact();
      });
    });
    if (customInput) {
      customInput.addEventListener("input", function () {
        var customRadio = form.querySelector('input[name="amount"][value="custom"]');
        var preset = form.querySelector('input[name="amount"]:checked');
        if (customInput.value && customRadio) customRadio.checked = true;
        else if (!customInput.value && preset && preset.value !== "custom") preset.checked = true;
        if (customField) customField.classList.toggle("is-on", !!(customRadio && customRadio.checked));
        paintStates();
        paintImpact();
      });
    }

    paintStates();
    paintImpact();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var amt = selectedAmount();
      var email = form.querySelector('input[name="email"]');
      var donor = form.querySelector('input[name="donor-name"]');
      var problems = [];

      var emailOk = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      var donorOk = !!donor && donor.value.trim().length >= 2;
      setInvalidField(donor, donorOk, donorOk ? "" : "We need a name for the receipt.");
      setInvalidField(email, emailOk, emailOk ? "" : "Add a valid email so we can send your receipt.");

      if (amt < 5) problems.push("Enter a gift of $5 or more.");
      if (!donorOk) problems.push("Add your name.");
      if (!emailOk) problems.push("Add a valid email address.");

      if (problems.length) {
        if (error) {
          error.textContent = problems.join(" ");
          error.classList.add("is-shown");
          error.hidden = false;
        }
        var bad = amt < 5 ? customInput : !donorOk ? donor : email;
        if (bad) bad.focus();
        return;
      }
      if (error) {
        error.hidden = true;
        error.classList.remove("is-shown");
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent = "Processing…";
      }

      window.setTimeout(function () {
        var nameField = form.querySelector('input[name="donor-name"]');
        var who = nameField && nameField.value.trim() ? nameField.value.trim().split(" ")[0] : "friend";
        var meals = Math.round(amt / MEAL_COST).toLocaleString("en-US");
        var when = isMonthly() ? "every month" : "one time";

        if (panel) {
          var nameSlot = panel.querySelector("[data-slot='name']");
          var amtSlot = panel.querySelector("[data-slot='amount']");
          var mealSlot = panel.querySelector("[data-slot='meals']");
          var whenSlot = panel.querySelector("[data-slot='when']");
          if (nameSlot) nameSlot.textContent = who;
          if (amtSlot) amtSlot.textContent = "$" + amt.toFixed(2);
          if (mealSlot) mealSlot.textContent = meals;
          if (whenSlot) whenSlot.textContent = when;
          var ref = panel.querySelector("[data-slot='ref']");
          if (ref)
            ref.textContent =
              "BH-" +
              String(Date.now()).slice(-6) +
              "-" +
              Math.floor(1000 + Math.random() * 8999);
          panel.hidden = false;
          var h = panel.querySelector("h2");
          if (h) {
            h.setAttribute("tabindex", "-1");
            h.focus();
          }
          panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
        if (submit) {
          submit.disabled = false;
          submit.textContent = submit.getAttribute("data-reset-label") || "Give again";
        }
        form.reset();
        paintStates();
        paintImpact();
      }, 900);
    });

    var restart = document.getElementById("give-restart");
    if (restart && panel) {
      restart.addEventListener("click", function () {
        panel.hidden = true;
        if (submit) submit.textContent = submit.getAttribute("data-final-label") || "Complete my gift";
        var first = form.querySelector('input[name="amount"]');
        if (first) first.focus();
      });
    }
  }

  /* ---------- 7. Volunteer signup (volunteer.html) ---------- */
  function setInvalid(field, msgEl, message) {
    field.setAttribute("aria-invalid", "true");
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.classList.add("is-shown");
    }
  }
  function clearInvalid(field, msgEl) {
    field.removeAttribute("aria-invalid");
    if (msgEl) {
      msgEl.textContent = "";
      msgEl.classList.remove("is-shown");
    }
  }

  function initVolunteer() {
    var form = document.getElementById("volunteer-form");
    var panel = document.getElementById("volunteer-thanks");
    if (!form) return;

    var rules = [
      {
        id: "vol-name",
        test: function (v) { return v.trim().length >= 2; },
        msg: "Please tell us your full name."
      },
      {
        id: "vol-email",
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
        msg: "Enter a valid email address, like you@example.org."
      },
      {
        id: "vol-zip",
        test: function (v) { return /^\d{5}(-\d{4})?$/.test(v.trim()); },
        msg: "Enter a 5-digit ZIP so we can match you to a nearby site."
      },
      {
        id: "vol-phone",
        test: function (v) {
          return v.trim() === "" || /^[+\d][\d\s().-]{6,}$/.test(v.trim());
        },
        msg: "Use digits, spaces, dashes or parentheses for your phone number."
      },
      {
        id: "vol-availability",
        test: function (v) { return v !== ""; },
        msg: "Pick the window that works best for you."
      }
    ];

    function validateField(rule) {
      var field = document.getElementById(rule.id);
      if (!field) return true;
      var msgEl = document.querySelector('[data-error-for="' + rule.id + '"]');
      var ok = rule.test(field.value);
      if (ok) clearInvalid(field, msgEl);
      else setInvalid(field, msgEl, rule.msg);
      return ok;
    }

    rules.forEach(function (rule) {
      var field = document.getElementById(rule.id);
      if (!field) return;
      field.addEventListener("blur", function () { validateField(rule); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") validateField(rule);
      });
    });

    var interests = form.querySelectorAll('input[name="interest"]');
    var interestMsg = document.querySelector('[data-error-for="vol-interests"]');
    var interestGroup = document.getElementById("vol-interests");
    function checkInterests() {
      var any = form.querySelectorAll('input[name="interest"]:checked').length > 0;
      if (interestMsg) {
        interestMsg.classList.toggle("is-shown", !any);
        interestMsg.textContent = any ? "" : "Choose at least one place you would like to help.";
      }
      if (interestGroup) interestGroup.setAttribute("aria-invalid", any ? "false" : "true");
      return any;
    }
    interests.forEach(function (i) { i.addEventListener("change", checkInterests); });

    var consent = document.getElementById("vol-consent");
    var consentMsg = document.querySelector('[data-error-for="vol-consent"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      rules.forEach(function (rule) {
        if (!validateField(rule) && !firstBad) firstBad = document.getElementById(rule.id);
      });
      if (!checkInterests() && !firstBad) firstBad = interests[0] || null;

      var consentOk = consent && consent.checked;
      if (consentMsg) {
        consentMsg.classList.toggle("is-shown", !consentOk);
        consentMsg.textContent = consentOk ? "" : "Please confirm the background-check and contact notes.";
      }
      if (!consentOk && !firstBad) firstBad = consent;

      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending…";
      }

      window.setTimeout(function () {
        var name = (document.getElementById("vol-name") || {}).value || "there";
        var picked = Array.prototype.map.call(
          form.querySelectorAll('input[name="interest"]:checked'),
          function (i) { return i.getAttribute("data-label") || i.value; }
        );
        var availSel = document.getElementById("vol-availability");

        if (panel) {
          var slotName = panel.querySelector("[data-slot='name']");
          var slotRoles = panel.querySelector("[data-slot='roles']");
          var slotWhen = panel.querySelector("[data-slot='when']");
          var slotRef = panel.querySelector("[data-slot='ref']");
          if (slotName) slotName.textContent = name.trim().split(" ")[0];
          if (slotRoles) slotRoles.textContent = picked.join(", ");
          if (slotWhen && availSel) slotWhen.textContent = availSel.options[availSel.selectedIndex].text;
          if (slotRef) slotRef.textContent = "SHIFT-" + String(Date.now()).slice(-5);
          panel.hidden = false;
          var h = panel.querySelector("h2");
          if (h) {
            h.setAttribute("tabindex", "-1");
            h.focus();
          }
          panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
        form.reset();
        checkInterests();
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Send my availability";
        }
      }, 800);
    });
  }

  /* ---------- 8. FAQ accordion ---------- */
  function initFaq() {
    var buttons = document.querySelectorAll(".faq__btn");
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (panel) panel.hidden = open;
      });
    });
  }

  /* ---------- 9. Story filter (stories.html) ---------- */
  function initStoryFilter() {
    var bar = document.getElementById("story-filter");
    var grid = document.getElementById("story-grid");
    if (!bar || !grid) return;

    var cards = grid.querySelectorAll("[data-tags]");
    var buttons = bar.querySelectorAll("button[data-filter]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var want = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
          b.classList.toggle("is-on", b === btn);
        });
        var shown = 0;
        cards.forEach(function (card) {
          var tags = (card.getAttribute("data-tags") || "").split(" ");
          var match = want === "all" || tags.indexOf(want) > -1;
          card.hidden = !match;
          if (match) shown += 1;
        });
        var count = document.getElementById("story-count");
        if (count) {
          count.textContent = shown === 1 ? "Showing 1 story" : "Showing " + shown + " stories";
        }
      });
    });
  }

  /* ---------- 10. Footer newsletter ---------- */
  function initSignup() {
    var forms = document.querySelectorAll(".signup");
    if (!forms.length) return;
    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector("input[type='email']");
        var msg = form.parentElement.querySelector(".signup__msg");
        if (!input || !msg) return;
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        msg.textContent = ok
          ? "You are on the list — Field Notes lands the first Friday each month."
          : "That email does not look right. Try again?";
        input.setAttribute("aria-invalid", ok ? "false" : "true");
        if (ok) form.reset();
        else input.focus();
      });
    });
  }

  /* ---------- 11. Footer year ---------- */
  function initYear() {
    var slots = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    slots.forEach(function (s) { s.textContent = y; });
  }

  /* ---------- boot ---------- */
  function boot() {
    initNav();
    initSpotlight();
    initDecode();
    initSpine();
    initCounters();
    initDonate();
    initVolunteer();
    initFaq();
    initStoryFilter();
    initSignup();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
