/* ==========================================================================
   Bright Harvest — shared behaviour
   Signature motion: Parallax Layers (rAF, data-speed) + Magnetic Elements
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var list = document.querySelector(".nav-list");
    if (!toggle || !list) return;

    toggle.addEventListener("click", function () {
      var open = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        list.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && list.classList.contains("is-open")) {
        list.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Parallax layers: one rAF scroll handler ---------- */
  function initParallax() {
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));
    if (!layers.length || reduce.matches) return;

    var tracked = layers.map(function (el) {
      return { el: el, speed: parseFloat(el.getAttribute("data-speed")) || 0 };
    });
    var ticking = false;
    var mid = window.innerHeight / 2;

    function apply() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      mid = window.innerHeight / 2;
      for (var i = 0; i < tracked.length; i++) {
        var item = tracked[i];
        var rect = item.el.getBoundingClientRect();
        var anchor = rect.top + rect.height / 2 - (y + mid);
        var shift = anchor * (item.speed - 1) * -0.28;
        var rotate = item.el.getAttribute("data-spin");
        var transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
        if (rotate) transform += " rotate(" + rotate + "deg)";
        item.el.style.transform = transform;
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
  }

  /* ---------- Magnetic elements: rAF lerp toward cursor within 120px ---------- */
  function initMagnetic() {
    var targets = document.querySelectorAll(".magnetic");
    if (!targets.length || reduce.matches || !canHover.matches) return;
    var RADIUS = 120;

    targets.forEach(function (el) {
      var rect = null;
      var tx = 0, ty = 0, cx = 0, cy = 0, scale = 1, targetScale = 1;
      var raf = null;

      function measure() { rect = el.getBoundingClientRect(); }

      function loop() {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        scale += (targetScale - scale) * 0.18;
        el.style.transform =
          "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0) scale(" + scale.toFixed(3) + ")";
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1 || Math.abs(targetScale - scale) > 0.001) {
          raf = window.requestAnimationFrame(loop);
        } else {
          raf = null;
        }
      }

      function start() {
        if (raf === null) raf = window.requestAnimationFrame(loop);
      }

      el.addEventListener("mouseenter", measure);

      el.addEventListener("mousemove", function (e) {
        if (!rect) measure();
        var ox = e.clientX - (rect.left + rect.width / 2);
        var oy = e.clientY - (rect.top + rect.height / 2);
        var dist = Math.sqrt(ox * ox + oy * oy);
        var pull = Math.max(0, 1 - dist / RADIUS);
        tx = ox * 0.35 * pull;
        ty = oy * 0.35 * pull;
        targetScale = dist < RADIUS ? 1.04 : 1;
        start();
      });

      el.addEventListener("mouseleave", function () {
        tx = 0; ty = 0; targetScale = 1;
        start();
      });

      window.addEventListener("scroll", function () { rect = null; }, { passive: true });
      window.addEventListener("resize", function () { rect = null; }, { passive: true });
    });
  }

  /* ---------- Animated impact counters ---------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function render(el, value) {
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var text = value.toFixed(decimals);
      if (el.getAttribute("data-comma") !== "false") {
        var parts = text.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        text = parts.join(".");
      }
      el.textContent = text;
    }

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (reduce.matches) { render(el, target); return; }
      var duration = 1500;
      var begin = null;
      function frame(now) {
        if (begin === null) begin = now;
        var p = Math.min((now - begin) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        render(el, target * eased);
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nums, run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(nums, function (el) { io.observe(el); });
  }

  /* ---------- Donation widget (donate.html) ---------- */
  function initDonation() {
    var form = document.getElementById("donation-form");
    var thankyou = document.getElementById("donation-thanks");
    if (!form || !thankyou) return;

    var PRESETS = {
      25: "a week of fresh produce for one neighbour",
      50: "a family grocery box for two weeks",
      100: "a full pantry restock for one household",
      250: "hot meals for an entire community dinner night"
    };

    var state = { amount: 50, frequency: "monthly", designations: [] };

    var amountButtons = form.querySelectorAll("[data-amount]");
    var customInput = form.querySelector("#custom-amount");
    var freqButtons = form.querySelectorAll("[data-frequency]");
    var mealsOut = form.querySelector("#meal-count");
    var impactOut = form.querySelector("#impact-line");
    var totalOut = form.querySelector("#receipt-total");
    var freqOut = form.querySelector("#receipt-frequency");

    function currentAmount() {
      if (customInput && customInput.value.trim() !== "") {
        return Math.max(0, parseFloat(customInput.value) || 0);
      }
      return state.amount;
    }

    function sync() {
      var amount = currentAmount();
      var meals = Math.round(amount / 3.25);
      if (mealsOut) mealsOut.textContent = meals.toLocaleString();
      if (impactOut) {
        var key = Object.keys(PRESETS).reduce(function (best, k) {
          return Math.abs(k - amount) < Math.abs(best - amount) ? k : best;
        }, Object.keys(PRESETS)[0]);
        impactOut.textContent = "$" + amount.toLocaleString() +
          (state.frequency === "monthly" ? " every month covers " : " covers ") +
          PRESETS[key] + ".";
      }
      if (totalOut) totalOut.textContent = "$" + amount.toLocaleString() +
        (state.frequency === "monthly" ? " / month" : " one time");
      if (freqOut) freqOut.textContent = state.frequency === "monthly"
        ? "Monthly, cancel anytime" : "One-time gift";

      amountButtons.forEach(function (btn) {
        btn.setAttribute("aria-pressed",
          String(!customInput || customInput.value.trim() === "") &&
          Number(btn.getAttribute("data-amount")) === state.amount ? "true" : "false");
      });
    }

    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.amount = Number(btn.getAttribute("data-amount"));
        if (customInput) { customInput.value = ""; }
        sync();
      });
    });

    if (customInput) {
      customInput.addEventListener("input", sync);
    }

    freqButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.frequency = btn.getAttribute("data-frequency");
        freqButtons.forEach(function (other) {
          other.setAttribute("aria-pressed", other === btn ? "true" : "false");
        });
        sync();
      });
    });

    form.querySelectorAll("[data-designation]").forEach(function (box) {
      box.addEventListener("change", function () {
        state.designations = Array.prototype.slice
          .call(form.querySelectorAll("[data-designation]:checked"))
          .map(function (b) { return b.value; });
        var out = form.querySelector("#receipt-designation");
        if (out) out.textContent = state.designations.length
          ? state.designations.join(", ") : "Wherever it helps most";
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var amount = currentAmount();
      var email = form.querySelector("#donor-email");
      var name = form.querySelector("#donor-name");
      var errors = [];

      if (amount < 1) errors.push("Choose a gift amount of $1 or more.");
      if (name && name.value.trim().length < 2) errors.push("Enter the name for your receipt.");
      if (email && !/^\S+@\S+\.\S+$/.test(email.value.trim())) errors.push("Enter a valid email address.");

      var errOut = form.querySelector("#donation-errors");
      if (errors.length) {
        if (errOut) {
          errOut.textContent = errors.join(" ");
          errOut.setAttribute("role", "assertive");
        }
        return;
      }
      if (errOut) errOut.textContent = "";

      var summary = document.getElementById("thankyou-summary");
      if (summary) {
        summary.textContent = "Your " +
          (state.frequency === "monthly" ? "monthly " : "one-time ") +
          "gift of $" + amount.toLocaleString() +
          " is reserved. A receipt is on its way to " +
          (email ? email.value.trim() : "your inbox") + ".";
      }
      form.classList.add("is-hidden");
      thankyou.classList.add("is-visible");
      thankyou.setAttribute("tabindex", "-1");
      thankyou.focus();
    });

    var again = document.getElementById("donate-again");
    if (again) {
      again.addEventListener("click", function () {
        thankyou.classList.remove("is-visible");
        form.classList.remove("is-hidden");
        form.querySelector("[data-amount]").focus();
      });
    }

    sync();
  }

  /* ---------- Volunteer signup (volunteer.html) ---------- */
  function initVolunteerForm() {
    var form = document.getElementById("volunteer-form");
    if (!form) return;
    var success = document.getElementById("volunteer-success");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = [];
      var name = form.querySelector("#vol-name");
      var email = form.querySelector("#vol-email");
      var role = form.querySelector('[name="roles"]:checked');
      var consent = form.querySelector("#vol-consent");

      if (!name || name.value.trim().length < 2) problems.push("Please tell us your name.");
      if (!email || !/^\S+@\S+\.\S+$/.test(email.value.trim())) problems.push("Please add a valid email so we can reach you.");
      if (!role) problems.push("Pick at least one role you would like to try.");
      if (!consent || !consent.checked) problems.push("Tick the depot safety code so we can roster you.");

      var out = document.getElementById("volunteer-errors");
      if (problems.length) {
        if (out) {
          out.textContent = problems.join(" ");
          out.setAttribute("role", "assertive");
        }
        if (name && name.value.trim().length < 2) name.focus();
        else if (email) email.focus();
        else if (form.querySelector('[name="roles"]')) {
          form.querySelector('[name="roles"]').focus();
        }
        return;
      }
      if (out) out.textContent = "";

      if (success) {
        var slot = form.querySelector("#vol-slot");
        var where = slot && slot.value ? slot.value : "our next shift";
        var person = name.value.trim().split(" ")[0];
        success.querySelector("p").textContent =
          "Thanks, " + person + ". We saved a place for you at " + where +
          ". Volunteer coordinator Nadia Rahman sends the welcome pack and food-safety" +
          " short form to " + email.value.trim() + " within one working day.";
        success.classList.add("is-visible");
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
      form.reset();
    });
  }

  /* ---------- Contact message (contact.html) ---------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var success = document.getElementById("contact-success");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#c-name");
      var email = form.querySelector("#c-email");
      var message = form.querySelector("#c-message");
      var topic = form.querySelector("#c-topic");
      var problems = [];

      if (!name || name.value.trim().length < 1) problems.push("Add a name or some initials.");
      if (!email || !/^\S+@\S+\.\S+$/.test(email.value.trim())) problems.push("Add an email we can reply to.");
      if (!message || message.value.trim().length < 10) problems.push("Write at least a sentence so we know who to route it to.");

      var out = document.getElementById("contact-errors");
      if (problems.length) {
        if (out) {
          out.textContent = problems.join(" ");
          out.setAttribute("role", "assertive");
        }
        (name && name.value.trim() ? email : name).focus();
        return;
      }
      if (out) out.textContent = "";

      if (success) {
        var lead = success.querySelector("p");
        if (lead && topic) {
          lead.textContent = "Thanks, " + (name.value.trim() || "neighbour") +
            ". Your note about “" + topic.value + "” is with the right person.";
        }
        success.classList.add("is-visible");
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
      form.reset();
    });
  }

  /* ---------- Filter chips (programs.html / stories.html) ---------- */
  function initFilters() {
    var groups = document.querySelectorAll("[data-filter-group]");
    groups.forEach(function (group) {
      var buttons = group.querySelectorAll("[data-filter]");
      var targetSel = group.getAttribute("data-filter-group");
      var items = document.querySelectorAll(targetSel);

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var value = btn.getAttribute("data-filter");
          buttons.forEach(function (other) {
            other.setAttribute("aria-pressed", other === btn ? "true" : "false");
          });
          items.forEach(function (item) {
            var tags = (item.getAttribute("data-tags") || "").split(" ");
            var show = value === "all" || tags.indexOf(value) > -1;
            item.hidden = !show;
            item.style.display = show ? "" : "none";
          });
          var count = group.parentElement.querySelector("[data-filter-count]");
          if (count) {
            var visible = 0;
            items.forEach(function (i) { if (!i.hidden) visible++; });
            count.textContent = visible + " shown";
          }
        });
      });
    });
  }

  /* ---------- Misc ---------- */
  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (n) { n.textContent = y; });
  }

  function initCurrentYearNavMark() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-list a").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === path) link.setAttribute("aria-current", "page");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initCurrentYearNavMark();
    initParallax();
    initMagnetic();
    initCounters();
    initDonation();
    initVolunteerForm();
    initContactForm();
    initFilters();
    initYear();
  });
})();
