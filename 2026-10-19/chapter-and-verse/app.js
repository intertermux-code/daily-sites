/* ==========================================================================
   Chapter & Verse — shared behaviour
   1. Scroll progress bar        5. Section folio (Index Manuscript)
   2. Magnetic primary buttons   6. Shelf filter (books.html)
   3. Mobile navigation drawer   7. Form validation (book-club, contact)
   4. —                          8. Newsletter sign-up (footer, all pages)
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* --- 1. Scroll progress -------------------------------------------- */
  function initProgress() {
    var bar = document.querySelector("[data-progress-bar]");
    if (!bar) return;

    var frame = 0;

    function measure() {
      frame = 0;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      ratio = Math.min(1, Math.max(0, ratio));
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      bar.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    }

    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();
  }

  /* --- 2. Magnetic buttons ------------------------------------------- */
  function initMagnetic() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll("[data-magnetic]")
    );
    if (!items.length) return;

    var RADIUS = 120;
    var pointers = new Map();
    var running = false;
    var enabled = false;

    items.forEach(function (el) {
      el.__mag = { x: 0, y: 0, tx: 0, ty: 0, s: 1, ts: 1 };
    });

    function activate() {
      if (enabled || reduceMotion.matches || !finePointer.matches) return;
      enabled = true;
      window.addEventListener("pointermove", track, { passive: true });
      window.addEventListener("pointerdown", track, { passive: true });
      document.addEventListener("pointerleave", releaseAll);
      document.addEventListener("visibilitychange", releaseAll);
      start();
    }

    function deactivate() {
      if (!enabled) return;
      enabled = false;
      window.removeEventListener("pointermove", track);
      window.removeEventListener("pointerdown", track);
      document.removeEventListener("pointerleave", releaseAll);
      document.removeEventListener("visibilitychange", releaseAll);
      releaseAll();
    }

    function track(event) {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      start();
    }

    function releaseAll() {
      pointers.clear();
      start();
    }

    function start() {
      if (running || !enabled) return;
      running = true;
      window.requestAnimationFrame(tick);
    }

    function tick() {
      var still = true;
      var point = null;

      pointers.forEach(function (p) {
        point = p; // last known pointer wins; there is realistically one
      });

      items.forEach(function (el) {
        var m = el.__mag;

        if (point) {
          var box = el.getBoundingClientRect();
          var cx = box.left + box.width / 2;
          var cy = box.top + box.height / 2;
          var dx = point.x - cx;
          var dy = point.y - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < RADIUS + Math.max(box.width, box.height) / 2) {
            var pull = 1 - Math.min(1, dist / RADIUS);
            m.tx = dx * 0.3 * pull;
            m.ty = dy * 0.3 * pull;
            m.ts = 1 + 0.04 * pull;
          } else {
            m.tx = 0;
            m.ty = 0;
            m.ts = 1;
          }
        } else {
          m.tx = 0;
          m.ty = 0;
          m.ts = 1;
        }

        // rAF lerp toward target, spring back when the pointer leaves
        m.x += (m.tx - m.x) * 0.16;
        m.y += (m.ty - m.y) * 0.16;
        m.s += (m.ts - m.s) * 0.16;

        if (
          Math.abs(m.tx - m.x) > 0.05 ||
          Math.abs(m.ty - m.y) > 0.05 ||
          Math.abs(m.ts - m.s) > 0.0008
        ) {
          still = false;
        }

        el.style.transform =
          "translate3d(" +
          m.x.toFixed(2) +
          "px," +
          m.y.toFixed(2) +
          "px,0) scale(" +
          m.s.toFixed(4) +
          ")";
      });

      if (still && !pointers.size) {
        running = false;
        return;
      }
      window.requestAnimationFrame(tick);
    }

    activate();
    reduceMotion.addEventListener
      ? reduceMotion.addEventListener("change", function () {
          reduceMotion.matches || !finePointer.matches
            ? deactivate()
            : activate();
        })
      : null;
    finePointer.addEventListener
      ? finePointer.addEventListener("change", function () {
          reduceMotion.matches || !finePointer.matches
            ? deactivate()
            : activate();
        })
      : null;
  }

  /* --- 3. Mobile navigation drawer ----------------------------------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var drawer = document.querySelector("[data-drawer]");
    if (!toggle || !drawer) return;

    var desktop = window.matchMedia("(min-width: 62rem)");

    var openY = 0;

    function open() {
      drawer.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      openY = window.scrollY;
    }

    function close(refocus) {
      drawer.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (refocus && document.activeElement === document.body) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      drawer.classList.contains("is-open") ? close(false) : open();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) {
        close(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!drawer.classList.contains("is-open")) return;
      if (drawer.contains(event.target) || toggle.contains(event.target)) return;
      close(false);
    });

    drawer.addEventListener("click", function (event) {
      if (event.target.closest("a")) close(false);
    });

    function sync() {
      if (desktop.matches) close(false);
    }

    desktop.addEventListener
      ? desktop.addEventListener("change", sync)
      : desktop.addListener(sync);
    // Close once the shopper has actually moved down the page — not on the
    // residual scroll events that fire right after the drawer opens.
    window.addEventListener("scroll", function () {
      if (!drawer.classList.contains("is-open")) return;
      if (Math.abs(window.scrollY - openY) > 80) close(false);
    }, { passive: true });
  }

  /* --- 5. Section folio in the header -------------------------------- */
  function initFolio() {
    var folio = document.querySelector("[data-folio-readout]");
    var sections = document.querySelectorAll("[data-folio]");
    if (!folio || !sections.length || !("IntersectionObserver" in window)) return;

    var current = folio.textContent;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var label = entry.target.getAttribute("data-folio");
          if (label && label !== current) {
            current = label;
            folio.textContent = label;
          }
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );

    Array.prototype.forEach.call(sections, function (section) {
      observer.observe(section);
    });
  }

  /* --- 6. Shelf filter (books.html) ---------------------------------- */
  function initShelfFilter() {
    var board = document.querySelector("[data-shelf]");
    var group = document.querySelector("[data-filters]");
    if (!board || !group) return;

    var cards = Array.prototype.slice.call(
      board.querySelectorAll("[data-genre]")
    );
    var status = document.querySelector("[data-shelf-status]");
    var hideTimer = new WeakMap();
    var animate = !reduceMotion.matches;

    function apply(genre) {
      var shown = 0;

      cards.forEach(function (card) {
        var match = genre === "all" || card.getAttribute("data-genre") === genre;
        if (match) shown += 1;

        window.clearTimeout(hideTimer.get(card));

        if (match) {
          card.hidden = false;
          if (animate) {
            window.requestAnimationFrame(function () {
              card.classList.remove("is-out");
            });
          } else {
            card.classList.remove("is-out");
          }
        } else if (animate) {
          card.classList.add("is-out");
          hideTimer.set(
            card,
            window.setTimeout(function () {
              if (card.classList.contains("is-out")) card.hidden = true;
            }, 240)
          );
        } else {
          card.classList.add("is-out");
          card.hidden = true;
        }
      });

      if (status) {
        var label =
          genre === "all"
            ? "the whole shelf"
            : group
                .querySelector('[data-genre="' + genre + '"]')
                .getAttribute("data-label")
                .toLowerCase();
        status.textContent =
          "Showing " + shown + " of " + cards.length + " titles — " + label + ".";
      }
    }

    group.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-genre]");
      if (!chip) return;

      Array.prototype.forEach.call(
        group.querySelectorAll("[data-genre]"),
        function (button) {
          button.setAttribute("aria-pressed", String(button === chip));
        }
      );

      apply(chip.getAttribute("data-genre"));
    });

    apply("all");
  }

  function statusIcon(kind) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.7");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if (kind === "error") {
      var circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "9");
      svg.appendChild(circle);
      path.setAttribute("d", "M12 7.5v5.5M12 16.4v.2");
    } else {
      path.setAttribute("d", "M4 12.6l5 5L20 6.5");
    }
    svg.appendChild(path);
    return svg;
  }

  function renderStatus(node, kind, heading, body) {
    node.textContent = "";
    node.appendChild(statusIcon(kind));
    var text = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = heading;
    var copy = document.createElement("p");
    copy.textContent = body;
    text.appendChild(title);
    text.appendChild(copy);
    node.appendChild(text);
    node.classList.add("is-visible");
    node.setAttribute("role", kind === "error" ? "alert" : "status");
  }

  /* --- 7. Form validation -------------------------------------------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function radioGroupChecked(input) {
    var radios = input.form.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < radios.length; i += 1) {
      if (radios[i].name === input.name && radios[i].checked) return true;
    }
    return false;
  }

  function messageFor(input) {
    var value = (input.value || "").trim();
    var label = input.getAttribute("data-field-label") || "This field";

    if (input.type === "radio") {
      if (input.hasAttribute("required") && !radioGroupChecked(input)) {
        return label + " is required — pick one of the options.";
      }
      return "";
    }
    if (input.hasAttribute("required") && !value && input.type !== "checkbox") {
      return label + " is required — we need it to answer you properly.";
    }
    if (input.type === "email" && value && !EMAIL.test(value)) {
      return "That address looks incomplete. Check for a missing @ or domain.";
    }
    if (input.type === "tel" && value && value.replace(/\D/g, "").length < 10) {
      return "Enter a phone number with at least 10 digits, or leave it blank.";
    }
    if (input.dataset.minlength && value.length > 0 && value.length < Number(input.dataset.minlength)) {
      return label + " needs at least " + input.dataset.minlength + " characters.";
    }
    if (input.type === "checkbox" && input.hasAttribute("required") && !input.checked) {
      return "Tick this box so we know you are happy for us to email you.";
    }
    return "";
  }

  function fieldOf(input) {
    return input.closest(".field") || input.closest(".choice__item");
  }

  function setError(input, message) {
    var field = input.closest(".field");
    if (!field) return;
    var output = field.querySelector(".field__error");
    if (message) {
      field.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      if (output) {
        output.textContent = message;
        output.hidden = false;
      }
    } else {
      field.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      if (output) {
        output.textContent = "";
        output.hidden = true;
      }
    }
  }

  function checkInput(input) {
    // A radio group shares one field wrapper: validate it once, from its first member.
    if (input.type === "radio" && !isRadioLeader(input)) return true;
    var message = messageFor(input);
    setError(input, message);
    return message === "";
  }

  function isRadioLeader(input) {
    if (!input.form) return true;
    var radios = input.form.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < radios.length; i += 1) {
      if (radios[i].name === input.name) return radios[i] === input;
    }
    return true;
  }

  function initForms() {
    var forms = document.querySelectorAll("form[data-validate]");
    if (!forms.length) return;

    Array.prototype.forEach.call(forms, function (form) {
      var inputs = Array.prototype.slice.call(
        form.querySelectorAll("input, select, textarea")
      ).filter(function (input) {
        return input.type !== "hidden" && !input.disabled;
      });

      inputs.forEach(function (input) {
        var eventName =
          input.type === "checkbox" ||
          input.type === "radio" ||
          input.tagName === "SELECT"
            ? "change"
            : "blur";

        input.addEventListener(eventName, function () {
          if ((input.value || "").trim() || input.type === "checkbox") {
            checkInput(input);
          }
        });

        input.addEventListener("input", function () {
          var field = input.closest(".field");
          if (field && field.classList.contains("is-invalid")) checkInput(input);
        });
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var firstBad = null;
        inputs.forEach(function (input) {
          if (!checkInput(input) && !firstBad) firstBad = input;
        });

        var status = form.querySelector("[data-form-status]");

        if (firstBad) {
          if (status) {
            renderStatus(
              status,
              "error",
              "One more thing",
              "Check the highlighted field and send it again."
            );
          }
          firstBad.focus();
          return;
        }

        var name = form.querySelector("[data-name-field]");
        var greeting =
          name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : "there";

        if (status) {
          renderStatus(
            status,
            "ok",
            "Booked in, " + greeting + ".",
            form.getAttribute("data-success-copy") ||
              "We have your details. A bookseller will write to you within two working days."
          );
        }

        form.reset();
        inputs.forEach(function (input) {
          setError(input, "");
        });
        if (status && status.hasAttribute("tabindex")) status.focus();
      });
    });
  }

  /* --- 8. Newsletter (footer on every page) -------------------------- */
  function initNewsletter() {
    var forms = document.querySelectorAll("form[data-newsletter]");
    if (!forms.length) return;

    Array.prototype.forEach.call(forms, function (form) {
      var input = form.querySelector('input[type="email"]');
      var output = form.querySelector("[data-signup-error]");
      if (!input) return;

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = input.value.trim();

        if (!value) {
          if (output) output.textContent = "Add your email address to subscribe.";
          input.setAttribute("aria-invalid", "true");
          input.focus();
          return;
        }
        if (!EMAIL.test(value)) {
          if (output)
            output.textContent =
              "That address looks incomplete — check for a missing @ or domain.";
          input.setAttribute("aria-invalid", "true");
          input.focus();
          return;
        }

        if (output) output.textContent = "";
        input.removeAttribute("aria-invalid");

        var note = document.createElement("p");
        note.className = "mono";
        note.setAttribute("role", "status");
        note.style.color = "var(--gold)";
        note.style.margin = "0";
        note.textContent =
          "Filed. The next letter posts on the first Thursday of the month.";
        form.textContent = "";
        form.appendChild(note);
      });

      input.addEventListener("input", function () {
        if (output) output.textContent = "";
        input.removeAttribute("aria-invalid");
      });
    });
  }

  /* --- Small extras -------------------------------------------------- */
  function initYear() {
    var slots = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(slots, function (slot) {
      slot.textContent = year;
    });
  }

  function initAnchors() {
    // Keep deep links usable without stealing keyboard focus behaviour
    if (!location.hash) return;
    var target = document.getElementById(location.hash.slice(1));
    if (target && !target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
  }

  function initTableScrollers() {
    var tables = Array.prototype.slice.call(document.querySelectorAll(".table-ruled"));
    if (!tables.length) return;
    function sync() {
      tables.forEach(function (t) {
        if (t.scrollWidth > t.clientWidth + 1) t.setAttribute("tabindex", "0");
        else t.removeAttribute("tabindex");
      });
    }
    sync();
    window.addEventListener("resize", sync);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
  }

  function boot() {
    initProgress();
    initMagnetic();
    initNav();
    initFolio();
    initShelfFilter();
    initForms();
    initNewsletter();
    initYear();
    initAnchors();
    initTableScrollers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
