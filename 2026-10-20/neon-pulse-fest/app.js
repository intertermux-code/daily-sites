/* Neon Pulse Festival — shared behaviour (vanilla JS, no dependencies) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var params = new URLSearchParams(window.location.search);

  /* ---------------------------------------------------------------------
     1. Mobile navigation
     ------------------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute(
        "aria-label",
        open ? "Open main menu" : "Close main menu"
      );
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------------------------------------------------
     2. Countdown to doors — 18 December 2026, 20:00
     ------------------------------------------------------------------ */
  var countdown = document.querySelector("[data-countdown]");

  if (countdown) {
    var doors = new Date("2026-12-18T20:00:00");
    var target = isNaN(doors.getTime())
      ? new Date(2026, 11, 18, 20, 0, 0).getTime()
      : doors.getTime();
    var units = {
      days: countdown.querySelector("[data-unit='days']"),
      hours: countdown.querySelector("[data-unit='hours']"),
      minutes: countdown.querySelector("[data-unit='minutes']"),
      seconds: countdown.querySelector("[data-unit='seconds']")
    };

    function pad(value, width) {
      var out = String(Math.max(0, Math.floor(value)));
      while (out.length < width) out = "0" + out;
      return out;
    }

    function tick() {
      var left = target - Date.now();
      if (left <= 0) {
        countdown.querySelectorAll(".countdown__num").forEach(function (el) {
          el.textContent = "00";
        });
        var done = document.querySelector("[data-countdown-caption]");
        if (done) done.textContent = "Doors are open — Neon Pulse is live.";
        clearInterval(handle);
        return;
      }
      var s = left / 1000;
      if (units.days) units.days.textContent = pad(s / 86400, 3);
      if (units.hours) units.hours.textContent = pad((s % 86400) / 3600, 2);
      if (units.minutes) units.minutes.textContent = pad((s % 3600) / 60, 2);
      if (units.seconds) units.seconds.textContent = pad(s % 60, 2);
    }

    tick();
    var handle = setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------------
     3. Parallax layers — one rAF scroll handler, translate3d per data-speed
     ------------------------------------------------------------------ */
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));

  if (layers.length && !reduceMotion) {
    var pending = false;

    function applyParallax() {
      pending = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      for (var i = 0; i < layers.length; i++) {
        var speed = parseFloat(layers[i].getAttribute("data-speed")) || 0;
        layers[i].style.transform =
          "translate3d(0," + (y * speed).toFixed(2) + "px,0)";
      }
    }

    function requestParallax() {
      if (!pending) {
        pending = true;
        window.requestAnimationFrame(applyParallax);
      }
    }

    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax, { passive: true });
    applyParallax();
  }

  /* ---------------------------------------------------------------------
     4. Blur-Fade Ascend — IntersectionObserver, 80ms sibling stagger
     ------------------------------------------------------------------ */
  var revealGroups = [];
  var standalone = [];

  document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
    var kids = Array.prototype.slice.call(group.children);
    kids.forEach(function (child, index) {
      child.classList.add("reveal");
      child.style.setProperty("--d", Math.min(index, 5) * 80 + "ms");
    });
    revealGroups.push(group);
  });

  document.querySelectorAll(".reveal").forEach(function (el) {
    if (!el.closest("[data-reveal-group]")) standalone.push(el);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealGroups.concat(standalone).forEach(function (el) {
      el.classList.add("in");
      Array.prototype.forEach.call(el.children, function (c) {
        c.classList.add("in");
      });
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          if (el.hasAttribute("data-reveal-group")) {
            Array.prototype.forEach.call(el.children, function (child) {
              child.classList.add("in");
            });
          } else {
            el.classList.add("in");
          }
          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealGroups.forEach(function (group) { observer.observe(group); });
    standalone.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     5. Lineup filters (lineup.html)
     ------------------------------------------------------------------ */
  var lineup = document.querySelector("[data-lineup]");

  if (lineup) {
    var acts = Array.prototype.slice.call(lineup.querySelectorAll(".act"));
    var emptyNote = lineup.querySelector("[data-lineup-empty]");
    var countOut = lineup.querySelector("[data-lineup-count]");
    var state = { day: "all", stage: "all" };

    function applyFilters() {
      var shown = 0;
      acts.forEach(function (act) {
        var dayOk = state.day === "all" || act.dataset.day === state.day;
        var stageOk = state.stage === "all" || act.dataset.stage === state.stage;
        var visible = dayOk && stageOk;
        act.classList.toggle("is-hidden", !visible);
        if (visible) shown += 1;
      });
      if (emptyNote) emptyNote.hidden = shown !== 0;
      if (countOut) {
        countOut.textContent =
          "Showing " + shown + " of " + acts.length + " acts";
      }
    }

    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      var key = group.getAttribute("data-filter-group");
      group.addEventListener("click", function (event) {
        var chip = event.target.closest(".chip");
        if (!chip) return;
        state[key] = chip.getAttribute("data-value");
        group.querySelectorAll(".chip").forEach(function (other) {
          other.setAttribute(
            "aria-pressed",
            String(other === chip)
          );
        });
        applyFilters();
      });
    });

    var requestedDay = params.get("day");
    if (["fri", "sat", "sun"].indexOf(requestedDay) !== -1) {
      state.day = requestedDay;
      var dayGroup = document.querySelector('[data-filter-group="day"]');
      if (dayGroup) {
        dayGroup.querySelectorAll(".chip").forEach(function (chip) {
          chip.setAttribute(
            "aria-pressed",
            String(chip.getAttribute("data-value") === requestedDay)
          );
        });
      }
    }

    applyFilters();
  }

  /* ---------------------------------------------------------------------
     6. FAQ accordion (info.html)
     ------------------------------------------------------------------ */
  var faq = document.querySelector("[data-faq]");

  if (faq) {
    faq.querySelectorAll(".faq__btn").forEach(function (button) {
      button.addEventListener("click", function () {
        var expanded = button.getAttribute("aria-expanded") === "true";
        var panel = document.getElementById(button.getAttribute("aria-controls"));
        button.setAttribute("aria-expanded", String(!expanded));
        if (panel) panel.setAttribute("data-open", String(!expanded));
      });
    });
  }

  /* ---------------------------------------------------------------------
     7. Gallery marquee — duplicate each track once for a seamless loop
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-marquee]").forEach(function (marquee) {
    var track = marquee.querySelector(".marquee__track");
    if (!track) return;
    var originals = Array.prototype.slice.call(track.children);
    originals.forEach(function (figure) {
      var clone = figure.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      var caption = clone.querySelector("figcaption");
      if (caption) caption.textContent = "";
      clone.querySelectorAll("a").forEach(function (link) {
        link.setAttribute("tabindex", "-1");
      });
      track.appendChild(clone);
    });
  });

  /* ---------------------------------------------------------------------
     8. Form validation
     ------------------------------------------------------------------ */
  function setError(field, message) {
    var input = field.querySelector("input, select, textarea");
    var output = field.querySelector(".field__error");
    if (input) {
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }
    if (output) {
      output.textContent = message || "";
      output.setAttribute("data-show", message ? "true" : "false");
    }
  }

  document.querySelectorAll("[data-validate]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstBad = null;
      var fields = Array.prototype.slice.call(
        form.querySelectorAll(".field[data-required]")
      );

      fields.forEach(function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input) return;
        var value = input.value.trim();
        var message = "";

        if (!value) {
          message = "This field is required — add it to keep your spot.";
        } else if (
          input.type === "email" &&
          !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)
        ) {
          message = "That email looks off. Try name@example.com.";
        } else if (
          input.type === "tel" &&
          value.replace(/[^\d]/g, "").length < 7
        ) {
          message = "Enter a phone number with at least 7 digits.";
        } else if (input.minLength > 0 && value.length < input.minLength) {
          message = "Give us at least " + input.minLength + " characters.";
        }

        setError(field, message);
        if (message && !firstBad) firstBad = input;
      });

      var status = form.querySelector(".form-status");

      if (firstBad) {
        if (status) {
          status.textContent =
            "Check the highlighted fields, then send it again.";
          status.setAttribute("data-show", "true");
          status.style.borderColor = "var(--magenta)";
        }
        firstBad.focus();
        return;
      }

      var name = form.querySelector("[data-first-name]");
      var greeting = name && name.value.trim() ? name.value.trim().split(" ")[0] : "you";
      if (status) {
        status.style.borderColor = "";
        status.textContent = "Locked in, " + greeting + ". Watch your inbox for the Neon Pulse confirmation.";
        status.setAttribute("data-show", "true");
      }
      form.reset();
      form.querySelectorAll('[aria-invalid="true"]').forEach(function (input) {
        input.setAttribute("aria-invalid", "false");
      });
    });
  });

  /* ---------------------------------------------------------------------
     9. Sold-out tier → waitlist handoff (tickets.html)
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-waitlist]").forEach(function (button) {
    button.addEventListener("click", function () {
      var form = document.querySelector("#waitlist-form");
      if (!form) return;
      var tier = button.getAttribute("data-waitlist");
      var select = form.querySelector("[name='tier']");
      if (select) select.value = tier;
      form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      var focusTarget = form.querySelector("input, select");
      if (focusTarget) window.setTimeout(function () { focusTarget.focus(); }, reduceMotion ? 0 : 450);
    });
  });

  /* ---------------------------------------------------------------------
     10. Current year in footers
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
