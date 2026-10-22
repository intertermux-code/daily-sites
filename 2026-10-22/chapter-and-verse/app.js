/* ==========================================================================
   Chapter & Verse — shared behaviour
   Motion signature: clip-path image reveal + magnetic primary buttons
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mobile navigation ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav__toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    });

    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // Reset the drawer when the layout switches back to inline nav.
    window.matchMedia("(min-width: 64rem)").addEventListener("change", function (e) {
      if (e.matches) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 2. Clip-path image reveal ---------- */
  function initReveal() {
    var targets = document.querySelectorAll(".clip-reveal");
    if (!targets.length) return;

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
          window.setTimeout(function () {
            el.classList.add("is-visible");
          }, delay);
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.15 }
    );

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. Magnetic primary buttons ---------- */
  function initMagnet() {
    var items = document.querySelectorAll("[data-magnetic]");
    if (!items.length || reduce) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var RADIUS = 120;

    items.forEach(function (el) {
      var state = { x: 0, y: 0, tx: 0, ty: 0, scale: 1, tscale: 1, raf: null, active: false };
      var rect = null;

      function frame() {
        state.x += (state.tx - state.x) * 0.16;
        state.y += (state.ty - state.y) * 0.16;
        state.scale += (state.tscale - state.scale) * 0.16;
        el.style.transform =
          "translate3d(" + state.x.toFixed(2) + "px," + state.y.toFixed(2) + "px,0) scale(" + state.scale.toFixed(3) + ")";

        var settled =
          Math.abs(state.tx - state.x) < 0.1 &&
          Math.abs(state.ty - state.y) < 0.1 &&
          Math.abs(state.tscale - state.scale) < 0.001;

        if (settled && !state.active) {
          el.style.transform = "";
          state.raf = null;
          return;
        }
        state.raf = window.requestAnimationFrame(frame);
      }

      function start() {
        if (state.raf === null) state.raf = window.requestAnimationFrame(frame);
      }

      el.addEventListener("mouseenter", function () {
        rect = el.getBoundingClientRect();
        state.active = true;
        state.tscale = 1.04;
        start();
      });

      el.addEventListener("mousemove", function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.hypot(dx, dy);
        var pull = Math.min(1, RADIUS / Math.max(dist, 1));
        var max = Math.min(rect.width, rect.height) * 0.18;
        state.tx = dx * 0.32 * pull;
        state.ty = dy * 0.32 * pull;
        state.tscale = 1 + 0.04 * Math.min(1, Math.max(0, 1 - dist / (RADIUS * 2.5)));
        state.tx = Math.max(-max, Math.min(max, state.tx));
        state.ty = Math.max(-max, Math.min(max, state.ty));
      });

      el.addEventListener("mouseleave", function () {
        state.active = false;
        state.tx = 0;
        state.ty = 0;
        state.tscale = 1;
        start();
      });

      el.addEventListener("blur", function () {
        state.active = false;
        state.tx = 0;
        state.ty = 0;
        state.tscale = 1;
      });
    });

    // Rects are re-read on mouseenter, so buttons revealed by scrolling work
    // without an extra listener.
  }

  /* ---------- 4. Books: genre filter ---------- */
  function initShelf() {
    var bar = document.querySelector("[data-filter-bar]");
    var shelf = document.getElementById("shelf");
    if (!bar || !shelf) return;

    var chips = Array.prototype.slice.call(bar.querySelectorAll(".chip"));
    var books = Array.prototype.slice.call(shelf.querySelectorAll(".book"));
    var count = document.getElementById("shelf-count");
    var empty = document.getElementById("shelf-empty");

    function apply(genre) {
      var shown = 0;
      books.forEach(function (book) {
        var match = genre === "all" || book.getAttribute("data-genre") === genre;
        book.hidden = !match;
        if (match) {
          shown += 1;
          if (!reduce) {
            book.style.transition = "clip-path .9s cubic-bezier(.16,1,.3,1)";
            book.style.clipPath = "inset(12% 8% round 12px)";
            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(function () {
                book.style.clipPath = "inset(0 0 round 0px)";
                // Clear the clip once finished so the raised spine is not cropped.
                window.setTimeout(function () {
                  book.style.clipPath = "";
                  book.style.transition = "";
                }, 950);
              });
            });
          }
        }
      });

      chips.forEach(function (chip) {
        chip.setAttribute(
          "aria-pressed",
          chip.getAttribute("data-genre") === genre ? "true" : "false"
        );
      });

      if (count) {
        var label = genre === "all" ? "the whole shelf" : "the " + genre + " shelf";
        count.textContent = "Showing " + shown + " of " + books.length + " titles in " + label + ".";
      }
      if (empty) empty.hidden = shown !== 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        apply(chip.getAttribute("data-genre"));
      });
    });

    apply("all");
  }

  /* ---------- 5. Events: filter by kind ---------- */
  function initEvents() {
    var bar = document.querySelector("[data-event-filter]");
    var list = document.getElementById("event-list");
    if (!bar || !list) return;

    var chips = Array.prototype.slice.call(bar.querySelectorAll(".chip"));
    var events = Array.prototype.slice.call(list.querySelectorAll(".event"));
    var count = document.getElementById("event-count");

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var kind = chip.getAttribute("data-kind");
        var shown = 0;
        events.forEach(function (ev) {
          var match = kind === "all" || ev.getAttribute("data-kind") === kind;
          ev.hidden = !match;
          if (match) shown += 1;
        });
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        if (count) {
          count.textContent = shown === 1
            ? "1 event on the calendar."
            : shown + " events on the calendar.";
        }
      });
    });
  }

  /* ---------- 6. Signup / enquiry forms ---------- */
  function validate(form) {
    var ok = true;
    var required = form.querySelectorAll("[data-required]");

    Array.prototype.forEach.call(required, function (field) {
      var wrap = field.closest(".field") || field.parentElement;
      var errNode = wrap ? wrap.querySelector(".error") : null;
      var value = (field.value || "").trim();
      var bad = false;

      if (!value) bad = true;
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) bad = true;
      if (field.getAttribute("data-check") === "terms" && !field.checked) bad = true;
      if (field.getAttribute("data-check") === "tier" &&
          !form.querySelector('input[name="tier"]:checked')) bad = true;

      if (bad) {
        ok = false;
        field.setAttribute("aria-invalid", "true");
        if (errNode) errNode.textContent = field.getAttribute("data-message") || "This field needs an answer.";
      } else {
        field.removeAttribute("aria-invalid");
        if (errNode) errNode.textContent = "";
      }
    });

    return ok;
  }

  function initForms() {
    var forms = document.querySelectorAll("form[data-validate]");
    if (!forms.length) return;

    Array.prototype.forEach.call(forms, function (form) {
      var status = form.querySelector(".form-status");
      var firstBad = null;

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate(form)) {
          firstBad = form.querySelector('[aria-invalid="true"]');
          if (firstBad) firstBad.focus();
          return;
        }
        var name = form.querySelector('input[name="fullname"], input[name="name"]');
        var who = name && name.value.trim() ? name.value.trim().split(" ")[0] : "you";
        if (status) {
          status.textContent = "Thank you, " + who +
            ". Your note is on our desk — we answer every one by hand within two working days.";
          status.classList.add("is-visible");
        }
        form.reset();
      });

      Array.prototype.forEach.call(form.querySelectorAll("[data-required]"), function (field) {
        field.addEventListener("input", function () {
          if (field.getAttribute("aria-invalid") === "true") validate(form);
        });
        field.addEventListener("change", function () {
          if (field.getAttribute("aria-invalid") === "true") validate(form);
        });
      });
    });
  }

  /* ---------- 7. Footer newsletter ---------- */
  function initNewsletter() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;
    var input = form.querySelector("input[type=email]");
    var status = document.getElementById("newsletter-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
        status.textContent = "That address does not look complete — try again?";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      status.textContent = "Filed. The next dispatch goes out on the first Friday of the month.";
      form.reset();
    });
  }

  /* ---------- 8. Current year in footers ---------- */
  function initYear() {
    var nodes = document.querySelectorAll("[data-year-now]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (n) { n.textContent = year; });
  }

  function boot() {
    initNav();
    initReveal();
    initMagnet();
    initShelf();
    initEvents();
    initForms();
    initNewsletter();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
