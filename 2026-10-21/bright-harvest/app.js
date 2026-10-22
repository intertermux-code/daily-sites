/* ==========================================================================
   Bright Harvest — shared behaviour
   Vanilla JS only. Each block is guarded by element-existence checks.
   ========================================================================== */
(function () {
  "use strict";

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = motionQuery.matches;
  motionQuery.addEventListener("change", function (e) {
    reduced = e.matches;
  });

  /* --------------------------------------------------------------------
     Mobile navigation
     -------------------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    };

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 959 && nav.classList.contains("is-open")) closeNav();
    });
  }

  /* --------------------------------------------------------------------
     Sticky header state
     -------------------------------------------------------------------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --------------------------------------------------------------------
     Impact counters — rAF count-up, triggered once by IntersectionObserver
     -------------------------------------------------------------------- */
  var counters = document.querySelectorAll("[data-count-to]");

  if (counters.length) {
    var format = function (value, decimals) {
      return value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    var runCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      var duration = parseInt(el.getAttribute("data-count-duration") || "1700", 10);

      if (reduced) {
        el.textContent = format(target, decimals);
        return;
      }

      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(target * eased, decimals);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            runCount(entry.target);
            counterObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) {
        counterObserver.observe(el);
      });
    } else {
      counters.forEach(runCount);
    }
  }

  /* --------------------------------------------------------------------
     3D card tilt — lerped rotateX/rotateY + following glare
     -------------------------------------------------------------------- */
  var tiltCards = document.querySelectorAll("[data-tilt]");

  if (tiltCards.length && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var MAX = 8;

    tiltCards.forEach(function (card) {
      var state = { rx: 0, ry: 0, tx: 0, ty: 0, gx: 50, gy: 50, cx: 50, cy: 50, raf: 0 };

      var render = function () {
        state.raf = 0;
        var k = reduced ? 1 : 0.18;
        state.rx += (state.tx - state.rx) * k;
        state.ry += (state.ty - state.ry) * k;
        state.gx += (state.cx - state.gx) * k;
        state.gy += (state.cy - state.gy) * k;

        card.style.setProperty("--rx", state.rx.toFixed(2) + "deg");
        card.style.setProperty("--ry", state.ry.toFixed(2) + "deg");
        card.style.setProperty("--gx", state.gx.toFixed(1) + "%");
        card.style.setProperty("--gy", state.gy.toFixed(1) + "%");

        var settled =
          Math.abs(state.tx - state.rx) < 0.04 &&
          Math.abs(state.ty - state.ry) < 0.04 &&
          Math.abs(state.cx - state.gx) < 0.4 &&
          Math.abs(state.cy - state.gy) < 0.4;

        if (!settled) state.raf = requestAnimationFrame(render);
      };

      var kick = function () {
        if (!state.raf) state.raf = requestAnimationFrame(render);
      };

      card.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        state.tx = (0.5 - py) * MAX * 2;
        state.ty = (px - 0.5) * MAX * 2;
        state.cx = px * 100;
        state.cy = py * 100;
        card.classList.add("is-tilting");
        kick();
      });

      card.addEventListener("pointerleave", function () {
        state.tx = 0;
        state.ty = 0;
        state.cx = 50;
        state.cy = 50;
        card.classList.remove("is-tilting");
        kick();
      });
    });
  }

  /* --------------------------------------------------------------------
     Donation widget (donate.html)
     -------------------------------------------------------------------- */
  var donate = document.querySelector("[data-donate]");

  if (donate) {
    var MEALS_PER_DOLLAR = 3;
    var amountButtons = Array.prototype.slice.call(donate.querySelectorAll("[data-amount]"));
    var customInput = donate.querySelector("[data-custom-amount]");
    var freqButtons = Array.prototype.slice.call(donate.querySelectorAll("[data-frequency]"));
    var impactValue = donate.querySelector("[data-impact-value]");
    var impactUnit = donate.querySelector("[data-impact-unit]");
    var impactText = donate.querySelector("[data-impact-text]");
    var impactFill = donate.querySelector("[data-impact-fill]");
    var submitBtn = donate.querySelector("[data-donate-submit]");
    var form = donate.querySelector("[data-donate-form]");
    var thanks = donate.querySelector("[data-donate-thanks]");
    var receipt = donate.querySelector("[data-receipt]");
    var live = donate.querySelector("[data-donate-live]");

    var presetIndex = 1;
    var amount = 50;
    var frequency = "monthly";

    var money = function (value) {
      return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    };

    var mealsFor = function () {
      var meals = Math.round(amount * MEALS_PER_DOLLAR);
      return frequency === "monthly" ? meals * 12 : meals;
    };

    var describe = function (meals) {
      if (meals >= 900) return "covers a full month of groceries for a family of five.";
      if (meals >= 420) return "stocks a school weekend backpack for a whole term.";
      if (meals >= 240) return "keeps one neighbour's shelf stocked for a month.";
      if (meals >= 90) return "fills a fridge with fresh produce for two households.";
      if (meals >= 30) return "puts a week of dinners on one family's table.";
      return "adds " + meals + " shelf-stable meals to today's dispatch.";
    };

    var paint = function () {
      var meals = mealsFor();
      if (impactValue) impactValue.textContent = meals.toLocaleString("en-US");
      if (impactUnit) impactUnit.textContent = frequency === "monthly" ? "meals a year" : "meals today";
      if (impactText) impactText.textContent = money(amount) + " " + describe(meals);
      if (impactFill) {
        var pct = Math.max(6, Math.min(100, (amount / 500) * 100));
        impactFill.style.width = pct.toFixed(1) + "%";
      }
      if (submitBtn) {
        submitBtn.textContent =
          "Give " + money(amount) + (frequency === "monthly" ? " monthly" : " once");
      }
    };

    var selectPreset = function (value, index) {
      amount = value;
      presetIndex = index;
      amountButtons.forEach(function (btn, i) {
        btn.setAttribute("aria-pressed", String(i === index));
      });
      if (customInput) {
        customInput.value = "";
        customInput.removeAttribute("aria-invalid");
      }
      paint();
    };

    amountButtons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        selectPreset(parseInt(btn.getAttribute("data-amount"), 10), i);
      });
    });

    if (customInput) {
      customInput.addEventListener("input", function () {
        var raw = parseInt(customInput.value.replace(/[^0-9]/g, ""), 10);
        if (!raw || raw < 1) return;
        amount = raw;
        presetIndex = -1;
        amountButtons.forEach(function (btn) {
          btn.setAttribute("aria-pressed", "false");
        });
        paint();
      });
    }

    freqButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        frequency = btn.getAttribute("data-frequency");
        freqButtons.forEach(function (other) {
          other.setAttribute(
            "aria-pressed",
            String(other.getAttribute("data-frequency") === frequency)
          );
        });
        paint();
      });
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var valid = amount >= 1;
        if (customInput) customInput.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid) {
          if (live) live.textContent = "Choose an amount of at least $1 to continue.";
          if (customInput) customInput.focus();
          return;
        }
        if (live) live.textContent = "";

        var meals = mealsFor();
        if (receipt) {
          receipt.innerHTML =
            "<li><span>Gift</span><strong>" +
            money(amount) +
            "</strong></li>" +
            "<li><span>Frequency</span><strong>" +
            (frequency === "monthly" ? "Every month" : "One time") +
            "</strong></li>" +
            "<li><span>Meals funded</span><strong>" +
            meals.toLocaleString("en-US") +
            "</strong></li>";
        }
        donate.classList.add("is-done");
        if (thanks) {
          thanks.classList.add("is-visible");
          thanks.setAttribute("tabindex", "-1");
          thanks.focus();
        }
        if (live) {
          live.textContent =
            "Thank you. Your " +
            (frequency === "monthly" ? "monthly" : "one-time") +
            " gift of " +
            money(amount) +
            " funds " +
            meals.toLocaleString("en-US") +
            " meals. This is a demonstration form; no payment was processed.";
        }
      });
    }

    var resetBtn = donate.querySelector("[data-donate-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        donate.classList.remove("is-done");
        if (thanks) thanks.classList.remove("is-visible");
        if (live) live.textContent = "";
        selectPreset(50, 1);
        var first = donate.querySelector(".amount[aria-pressed='true']");
        if (first) first.focus();
      });
    }

    paint();
  }

  /* --------------------------------------------------------------------
     Volunteer signup (volunteer.html)
     -------------------------------------------------------------------- */
  var signup = document.querySelector("[data-signup]");

  if (signup) {
    var setError = function (field, message) {
      var input = signup.querySelector('[name="' + field + '"]');
      var slot = signup.querySelector('[data-error-for="' + field + '"]');
      if (slot) slot.textContent = message || "";
      if (input) {
        if (message) {
          input.setAttribute("aria-invalid", "true");
        } else {
          input.removeAttribute("aria-invalid");
        }
      }
    };

    var emailOk = function (value) {
      return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
    };

    var phoneOk = function (value) {
      return value === "" || value.replace(/\D/g, "").length >= 10;
    };

    var validate = function () {
      var problems = [];

      var first = signup.querySelector('[name="firstName"]');
      if (!first.value.trim()) problems.push(["firstName", "Please enter your first name."]);
      else setError("firstName", "");

      var last = signup.querySelector('[name="lastName"]');
      if (!last.value.trim()) problems.push(["lastName", "Please enter your last name."]);
      else setError("lastName", "");

      var email = signup.querySelector('[name="email"]');
      if (!email.value.trim()) problems.push(["email", "Please enter your email so we can confirm your shift."]);
      else if (!emailOk(email.value.trim())) problems.push(["email", "That email looks incomplete — check for a missing @ or domain."]);
      else setError("email", "");

      var phone = signup.querySelector('[name="phone"]');
      if (!phoneOk(phone.value.trim())) problems.push(["phone", "Enter a 10-digit number, or leave this blank."]);
      else setError("phone", "");

      var zip = signup.querySelector('[name="zip"]');
      if (!/^\d{5}$/.test(zip.value.trim())) problems.push(["zip", "Enter the 5-digit ZIP code where you would like to serve."]);
      else setError("zip", "");

      var interests = signup.querySelectorAll('[name="interests"]:checked');
      if (interests.length === 0) problems.push(["interests", "Choose at least one role you would like to try."]);
      else setError("interests", "");

      var shift = signup.querySelector('[name="shift"]');
      if (!shift.value) problems.push(["shift", "Pick the window that usually works for you."]);
      else setError("shift", "");

      var consent = signup.querySelector('[name="consent"]');
      if (!consent.checked) problems.push(["consent", "We need your permission to email you about this shift."]);
      else setError("consent", "");

      return problems;
    };

    signup.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = validate();
      var summary = signup.querySelector("[data-form-alerts]");

      if (problems.length) {
        if (summary) {
          summary.hidden = false;
          summary.innerHTML =
            "<strong>Please fix " +
            problems.length +
            (problems.length === 1 ? " field" : " fields") +
            " below.</strong>";
        }
        var firstField = problems[0][0];
        var focusTarget =
          signup.querySelector('[name="' + firstField + '"]') ||
          signup.querySelector('[data-error-for="' + firstField + '"]');
        if (focusTarget && focusTarget.focus) focusTarget.focus();
        return;
      }

      if (summary) {
        summary.hidden = true;
        summary.innerHTML = "";
      }

      var values = new FormData(signup);
      var chosen = Array.prototype.slice
        .call(signup.querySelectorAll('[name="interests"]:checked'))
        .map(function (box) {
          return box.parentNode.textContent.trim();
        });

      var shiftText =
        signup.querySelector('[name="shift"]').selectedOptions[0].textContent.trim();

      var receipt = signup.querySelector("[data-signup-summary]");
      if (receipt) {
        receipt.innerHTML =
          "<li><span>Name</span><strong>" +
          escapeHtml(values.get("firstName") + " " + values.get("lastName")) +
          "</strong></li>" +
          "<li><span>Email</span><strong>" +
          escapeHtml(values.get("email")) +
          "</strong></li>" +
          "<li><span>Roles</span><strong>" +
          escapeHtml(chosen.join(", ")) +
          "</strong></li>" +
          "<li><span>Preferred window</span><strong>" +
          escapeHtml(shiftText) +
          "</strong></li>";
      }

      signup.hidden = true;
      var done = document.querySelector("[data-signup-success]");
      if (done) {
        done.classList.add("is-visible");
        done.setAttribute("tabindex", "-1");
        done.focus();
        done.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      }
    });

    var escapeHtml = function (value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    signup.addEventListener("blur", function (e) {
      var name = e.target.name;
      if (!name) return;
      if (name === "email" && e.target.value && !emailOk(e.target.value.trim())) {
        setError("email", "That email looks incomplete — check for a missing @ or domain.");
      } else if (name === "phone" && !phoneOk(e.target.value.trim())) {
        setError("phone", "Enter a 10-digit number, or leave this blank.");
      } else if (name === "zip" && e.target.value && !/^\d{5}$/.test(e.target.value.trim())) {
        setError("zip", "Enter the 5-digit ZIP code where you would like to serve.");
      } else if (["firstName", "lastName", "email", "phone", "zip"].indexOf(name) > -1) {
        setError(name, "");
      }
    });

    var clearOnPick = function () {
      setError("interests", "");
      setError("consent", "");
    };
    signup.querySelectorAll('[name="interests"], [name="consent"]').forEach(function (el) {
      el.addEventListener("change", clearOnPick);
    });
    var shiftSelect = signup.querySelector('[name="shift"]');
    if (shiftSelect) shiftSelect.addEventListener("change", function () { setError("shift", ""); });
  }

  /* --------------------------------------------------------------------
     Newsletter (footer) — shared across pages
     -------------------------------------------------------------------- */
  var news = document.querySelector("[data-newsletter]");

  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = news.querySelector('input[type="email"]');
      var status = news.querySelector("[data-news-status]");
      var value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
        input.setAttribute("aria-invalid", "true");
        if (status) status.textContent = "Enter a complete email address, like you@example.com.";
        input.focus();
        return;
      }
      input.setAttribute("aria-invalid", "false");
      if (status) status.textContent = "You are on the list — the first Harvest Letter arrives Friday.";
      input.value = "";
    });
  }

  /* --------------------------------------------------------------------
     Footer year
     -------------------------------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
