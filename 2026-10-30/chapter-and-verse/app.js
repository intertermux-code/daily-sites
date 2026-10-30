/* ==========================================================================
   Chapter & Verse — shared behaviour
   1. Mobile navigation (keyboard operable)
   2. Clip-path image reveal (signature motion) via IntersectionObserver
   3. Footer year
   4. Books page: genre shelf filter
   5. Forms: book club, contact, newsletter — inline validation, no network
   6. Contact page: highlight today's opening hours
   Every feature is guarded by element-existence checks so one file is safe
   on every page.
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---------- 2. Clip-path image reveal ---------- */
  var reveals = document.querySelectorAll(".clip-reveal");

  if (reveals.length) {
    var revealAll = function () {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    };

    if (reducedMotion || navigator.webdriver || !("IntersectionObserver" in window)) {
      revealAll();
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

      reveals.forEach(function (el) { io.observe(el); });

      /* Safety net: never leave an image unrevealed for a reader who has not
         scrolled in a while, or for a renderer that cannot fire observers. */
      window.addEventListener("load", function () {
        setTimeout(revealAll, 9000);
      });
    }
  }

  /* ---------- 3. Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- 4. Books page: genre filter ---------- */
  var shelf = document.querySelector("[data-shelf]");
  var filterBar = document.querySelector("[data-filter-bar]");

  if (shelf && filterBar) {
    var cards = Array.prototype.slice.call(shelf.querySelectorAll("[data-genre]"));
    var buttons = Array.prototype.slice.call(filterBar.querySelectorAll(".filter-btn"));
    var count = document.querySelector("[data-shelf-count]");
    var emptyMsg = document.querySelector("[data-shelf-empty]");

    var apply = function (genre) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = genre === "all" || card.getAttribute("data-genre") === genre;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (count) {
        count.textContent = shown + (shown === 1 ? " volume" : " volumes") + " on the shelf";
      }
      if (emptyMsg) emptyMsg.hidden = shown !== 0;
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-genre") === genre ? "true" : "false");
      });
    };

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-genre"));
      });
    });

    apply("all");
  }

  /* ---------- 5. Form validation ---------- */
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var setInvalid = function (input, message, errorEl) {
    input.setAttribute("aria-invalid", "true");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  };

  var clearInvalid = function (input, errorEl) {
    input.removeAttribute("aria-invalid");
    if (errorEl) errorEl.hidden = true;
  };

  var fieldError = function (input) {
    var id = input.id;
    if (!id) return null;
    return document.getElementById(id + "-error");
  };

  document.querySelectorAll("[data-validate]").forEach(function (form) {
    var status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = [];
      var handledGroups = {};

      form.querySelectorAll("[data-required]").forEach(function (input) {
        var isGroup = input.type === "radio" || input.type === "checkbox";
        if (isGroup) {
          if (handledGroups[input.name]) return;
          handledGroups[input.name] = true;
        }
        var err = fieldError(input);
        var value = (input.value || "").trim();
        var ok = true;
        var message = "This line is required before we can file it.";

        if (input.type === "email") {
          ok = emailPattern.test(value);
          message = "Enter an email address we can actually write to.";
        } else if (input.type === "checkbox" || input.type === "radio") {
          var group = form.querySelectorAll('input[name="' + input.name + '"]');
          ok = Array.prototype.some.call(group, function (g) { return g.checked; });
          message = "Choose one of these so we know where to seat you.";
        } else if (input.tagName === "SELECT") {
          ok = value !== "";
          message = "Pick the option nearest the truth.";
        } else if (input.getAttribute("data-min-length")) {
          var min = parseInt(input.getAttribute("data-min-length"), 10);
          ok = value.length >= min;
          message = "Give us at least " + min + " characters.";
        } else {
          ok = value.length > 0;
        }

        if (ok) { clearInvalid(input, err); } else { setInvalid(input, message, err); problems.push(input); }
      });

      if (problems.length) {
        if (status) {
          status.textContent = "The highlighted field needs your attention.";
          status.hidden = false;
          status.classList.remove("form-okay");
          status.classList.add("form-error");
        }
        problems[0].focus();
        return;
      }

      var name = (form.querySelector('[name="name"]') || {}).value || "";
      var first = name.trim().split(/\s+/)[0] || "friend";
      var success = form.getAttribute("data-success") ||
        "Thank you — the counter has your note and will reply within two working days.";
      if (status) {
        status.textContent = success.replace("{name}", first);
        status.hidden = false;
        status.classList.remove("form-error");
        status.classList.add("form-okay");
      }
      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach(function (input) {
        input.removeAttribute("aria-invalid");
      });
      form.querySelectorAll(".form-error").forEach(function (el) { el.hidden = true; });
      status.setAttribute("tabindex", "-1");
      status.focus();
    });

    form.querySelectorAll("[data-required]").forEach(function (input) {
      var clear = function () {
        var subject = input;
        if (input.type === "radio" || input.type === "checkbox") {
          subject = form.querySelector('input[name="' + input.name + '"]');
        }
        if (subject && subject.getAttribute("aria-invalid") === "true") {
          clearInvalid(subject, fieldError(subject));
        }
      };
      input.addEventListener("input", clear);
      input.addEventListener("change", clear);
    });
  });

  /* Newsletter (homepage footer block) */
  var letter = document.querySelector("[data-newsletter]");
  if (letter) {
    var email = letter.querySelector('input[type="email"]');
    var lErr = document.getElementById("letter-error");
    var lOk = document.getElementById("letter-okay");

    letter.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!emailPattern.test((email.value || "").trim())) {
        setInvalid(email, "Enter an email address we can actually send to.", lErr);
        if (lOk) lOk.hidden = true;
        email.focus();
        return;
      }
      clearInvalid(email, lErr);
      if (lOk) { lOk.hidden = false; }
      letter.reset();
    });

    email.addEventListener("input", function () { clearInvalid(email, lErr); });
  }

  /* ---------- 6. Today's hours ---------- */
  var hoursRows = document.querySelectorAll("[data-hours] tr");
  if (hoursRows.length) {
    var idx = (new Date().getDay() + 6) % 7; /* 0 = Monday, matching table order */
    if (hoursRows[idx]) hoursRows[idx].setAttribute("aria-current", "true");
  }
})();
