/* Padaria Sol — shared behaviour
   Each feature is guarded by element existence so one file serves all pages. */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

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
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 896) closeNav();
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");

  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Scroll reveals ---------- */
  var revealables = document.querySelectorAll(".reveal");

  if (revealables.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var stagger = 0;
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            if (el.hasAttribute("data-stagger")) {
              el.style.setProperty(
                "--reveal-delay",
                Math.min(stagger, 4) * 70 + "ms"
              );
              stagger += 1;
            }
            el.classList.add("is-visible");
            observer.unobserve(el);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealables.forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Opening hours + open/closed pill (Visit page) ---------- */
  var hoursTable = document.querySelector("[data-hours-table]");
  var openPill = document.querySelector("[data-open-status]");

  if (hoursTable || openPill) {
    // 0 = Sunday … 6 = Saturday; null = closed
    var schedule = {
      0: null, // Monday
      1: [7.5, 19], // Tuesday
      2: [7.5, 19], // Wednesday
      3: [7.5, 19], // Thursday
      4: [7.5, 19], // Friday
      5: [7.5, 19.5], // Saturday
      6: [8, 18], // Sunday
    };

    var fmt = function (h) {
      var hh = Math.floor(h);
      var mm = Math.round((h - hh) * 60);
      return hh + ":" + (mm < 10 ? "0" + mm : mm);
    };

    try {
      var nowParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Lisbon",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());

      var get = function (type) {
        var p = nowParts.find(function (x) {
          return x.type === type;
        });
        return p ? p.value : "";
      };

      var dayIndex = {
        Mon: 0,
        Tue: 1,
        Wed: 2,
        Thu: 3,
        Fri: 4,
        Sat: 5,
        Sun: 6,
      }[get("weekday")];

      var nowH = parseInt(get("hour"), 10) + parseInt(get("minute"), 10) / 60;
      var today = schedule[dayIndex];
      var isOpen = !!today && nowH >= today[0] && nowH < today[1];

      if (openPill) {
        var dayNames = [
          "Sunday", "Monday", "Tuesday", "Wednesday",
          "Thursday", "Friday", "Saturday",
        ];
        var message;
        if (isOpen) {
          message = "Open now — until " + fmt(today[1]) + " in Lisbon";
        } else if (today && nowH < today[0]) {
          message = "Opens today at " + fmt(today[0]) + " — the ovens are already on";
        } else {
          var ahead = null;
          for (var d = 1; d <= 7 && ahead === null; d++) {
            if (schedule[(dayIndex + d) % 7]) ahead = (dayIndex + d) % 7;
          }
          var when = ahead === (dayIndex + 1) % 7 ? "tomorrow" : "on " + dayNames[ahead];
          message =
            "Closed right now — back " + when + " at " + fmt(schedule[ahead][0]);
        }
        openPill.classList.add(isOpen ? "is-open" : "is-closed");
        openPill.textContent = message;
      }

      if (hoursTable) {
        var rows = hoursTable.querySelectorAll("tbody tr");
        var order = [1, 2, 3, 4, 5, 6, 0]; // Tue … Sun, Mon last
        order.forEach(function (day, i) {
          if (rows[i]) {
            rows[i].setAttribute("data-day", String(day));
            if (day === dayIndex) rows[i].classList.add("is-today");
          }
        });
      }
    } catch (err) {
      if (openPill) openPill.remove();
    }
  }

  /* ---------- Pre-order form validation (Visit page) ---------- */
  var form = document.querySelector("[data-order-form]");

  if (form) {
    var status = form.querySelector("[data-form-status]");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var setFieldState = function (input, message) {
      var field = input.closest(".field");
      var errorEl = field.querySelector(".field__error");
      if (message) {
        field.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
        if (errorEl) errorEl.textContent = message;
      } else {
        field.classList.remove("is-invalid");
        input.removeAttribute("aria-invalid");
        if (errorEl) errorEl.textContent = "";
      }
      return !message;
    };

    var validate = function (input) {
      var value = input.value.trim();

      if (input.hasAttribute("required") && !value) {
        return setFieldState(input, "This field is required.");
      }

      if (input.type === "email" && value && !emailPattern.test(value)) {
        return setFieldState(input, "Enter a valid email, like maria@example.pt.");
      }

      if (input.type === "tel" && value && !/^[+\d][\d\s().-]{6,}$/.test(value)) {
        return setFieldState(input, "Enter a valid phone number.");
      }

      if (input.type === "number" && value) {
        var n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 48) {
          return setFieldState(input, "Choose a whole number between 1 and 48.");
        }
      }

      if (input.type === "date" && value) {
        var picked = new Date(value + "T12:00:00");
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var max = new Date(today);
        max.setDate(max.getDate() + 14);
        if (isNaN(picked.getTime())) {
          return setFieldState(input, "Enter a valid date.");
        }
        if (picked < today) {
          return setFieldState(input, "Pick today or a future date.");
        }
        if (picked > max) {
          return setFieldState(input, "We take pre-orders up to 14 days ahead.");
        }
        if (picked.getDay() === 1) {
          return setFieldState(input, "We are closed on Mondays — pick another day.");
        }
      }

      return setFieldState(input, "");
    };

    var inputs = Array.prototype.slice.call(
      form.querySelectorAll("input, select, textarea")
    );

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        validate(input);
      });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field.classList.contains("is-invalid")) validate(input);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var results = inputs.map(validate);
      var firstInvalidIndex = results.indexOf(false);

      if (firstInvalidIndex !== -1) {
        var bad = inputs[firstInvalidIndex];
        bad.focus();
        if (status) {
          status.className = "form-status is-error";
          status.textContent =
            "We could not send your order — please check the highlighted fields.";
        }
        return;
      }

      var name = form.querySelector("#order-name").value.trim().split(" ")[0];
      var item = form.querySelector("#order-item");
      var itemText = item.options[item.selectedIndex].text;
      var qty = form.querySelector("#order-quantity").value;
      var date = form.querySelector("#order-date").value;

      var prettyDate = date;
      try {
        prettyDate = new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      } catch (err) {
        /* keep raw value */
      }

      if (status) {
        status.className = "form-status is-success";
        status.textContent =
          "Thank you, " +
          name +
          "! Your order of " +
          qty +
          " × " +
          itemText +
          " is noted for pickup on " +
          prettyDate +
          ". We will email you when it is boxed and waiting.";
      }

      form.reset();
      inputs.forEach(function (input) {
        var field = input.closest(".field");
        field.classList.remove("is-invalid");
        input.removeAttribute("aria-invalid");
      });
      if (status) status.focus();
    });
  }
})();
