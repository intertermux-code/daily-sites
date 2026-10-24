/* ==========================================================================
   Chapter & Verse — shared behaviour
   Motions: Cursor Spotlight (rAF-throttled pointermove) + Parallax Layers
   (single rAF scroll handler). Everything degrades under prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var motionOk = function () { return !reduced.matches; };

  /* ------------------------------------------------------------------
   * 1. Primary navigation
   * ------------------------------------------------------------------ */
  function initNav() {
    var bar = document.querySelector(".nav-bar");
    if (!bar) return;

    var toggle = bar.querySelector(".nav-toggle");
    var list = document.getElementById("nav-list");

    if (toggle && list) {
      toggle.addEventListener("click", function () {
        var open = bar.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          var first = list.querySelector("a");
          if (first) first.focus();
        }
      });

      list.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          bar.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && bar.classList.contains("is-open")) {
          bar.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 940) {
          bar.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    // Condensed brand flag once the nameplate has scrolled away
    var masthead = document.querySelector(".masthead");
    if (masthead) {
      var flagObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            bar.classList.toggle("is-scrolled", !entry.isIntersecting);
          });
        },
        { rootMargin: "-40% 0px 0px 0px", threshold: 0 }
      );
      flagObserver.observe(masthead);
    }
  }

  /* ------------------------------------------------------------------
   * 2. Cursor Spotlight — radial lamp that tracks the pointer
   * ------------------------------------------------------------------ */
  function initSpotlight() {
    var zones = document.querySelectorAll("[data-spotlight]");
    if (!zones.length || !motionOk()) return;

    var pending = false;
    var target = null;
    var x = 0;
    var y = 0;

    function paint() {
      pending = false;
      if (!target) return;
      target.style.setProperty("--spot-x", x + "%");
      target.style.setProperty("--spot-y", y + "%");
    }

    zones.forEach(function (zone) {
      zone.addEventListener("pointermove", function (e) {
        var r = zone.getBoundingClientRect();
        target = zone;
        x = ((e.clientX - r.left) / r.width) * 100;
        y = ((e.clientY - r.top) / r.height) * 100;
        zone.classList.add("is-lit");
        if (!pending) {
          pending = true;
          requestAnimationFrame(paint);
        }
      });

      zone.addEventListener("pointerleave", function () {
        zone.classList.remove("is-lit");
      });

      // Keyboard parity: light the lamp from the centre on focus-in
      zone.addEventListener("focusin", function () {
        target = zone;
        x = 34;
        y = 42;
        zone.classList.add("is-lit");
        if (!pending) {
          pending = true;
          requestAnimationFrame(paint);
        }
      });

      zone.addEventListener("focusout", function () {
        zone.classList.remove("is-lit");
      });
    });
  }

  /* ------------------------------------------------------------------
   * 3. Parallax Layers — one rAF scroll handler, data-speed per layer
   * ------------------------------------------------------------------ */
  function initParallax() {
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));
    if (!layers.length) return;

    var hero = layers[0].closest(".hero, .band");
    var visible = true;

    function frame() {
      if (!motionOk()) {
        layers.forEach(function (el) { el.style.transform = ""; });
        return;
      }
      if (!visible) return;

      var anchor = hero || document.body;
      var rect = anchor.getBoundingClientRect();
      var base = rect.top + rect.height / 2 - window.innerHeight / 2;

      layers.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-speed")) || 0;
        var shift = base * speed;
        el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
      });
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        frame();
      });
    }

    if (hero) {
      var io = new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) frame();
        },
        { rootMargin: "20% 0px 20% 0px" }
      );
      io.observe(hero);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    reduced.addEventListener
      ? reduced.addEventListener("change", frame)
      : reduced.addListener(frame);
    frame();
  }

  /* ------------------------------------------------------------------
   * 4. books.html — genre filter + spine details
   * ------------------------------------------------------------------ */
  function initShelf() {
    var shelf = document.getElementById("shelf");
    if (!shelf) return;

    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-genre-filter]"));
    var books = Array.prototype.slice.call(shelf.querySelectorAll(".book"));
    var countOut = document.getElementById("shelf-count");
    var emptyOut = document.getElementById("shelf-empty");

    function apply(genre) {
      var shown = 0;
      books.forEach(function (book) {
        var match = genre === "all" || book.getAttribute("data-genre") === genre;
        book.classList.toggle("is-hidden", !match);
        if (match) shown += 1;
        else book.classList.remove("is-open");
      });

      if (countOut) {
        countOut.textContent =
          shown === 1
            ? "1 title on the shelf — " + labelFor(genre)
            : shown + " titles on the shelf — " + labelFor(genre);
      }
      if (emptyOut) emptyOut.hidden = shown !== 0;
    }

    function labelFor(genre) {
      var chip = chips.filter(function (c) {
        return c.getAttribute("data-genre-filter") === genre;
      })[0];
      return chip ? chip.querySelector(".chip-label").textContent.trim() : "the whole shelf";
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        apply(chip.getAttribute("data-genre-filter"));
      });
    });

    apply(chips.length ? chips[0].getAttribute("data-genre-filter") : "all");

    // Spine details
    function closeAll(except) {
      books.forEach(function (b) {
        if (b !== except) b.classList.remove("is-open");
      });
    }

    books.forEach(function (book) {
      var spine = book.querySelector(".book-spine");
      var close = book.querySelector(".book-detail-close");
      if (!spine) return;

      spine.setAttribute("aria-expanded", "false");
      spine.addEventListener("click", function () {
        var open = !book.classList.contains("is-open");
        closeAll(book);
        book.classList.toggle("is-open", open);
        spine.setAttribute("aria-expanded", open ? "true" : "false");
        if (open && close) close.focus();
      });

      if (close) {
        close.addEventListener("click", function () {
          book.classList.remove("is-open");
          spine.setAttribute("aria-expanded", "false");
          spine.focus();
        });
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll(null);
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".book")) closeAll(null);
    });
  }

  /* ------------------------------------------------------------------
   * 5. events.html — filter the diary by kind
   * ------------------------------------------------------------------ */
  function initDiary() {
    var list = document.getElementById("diary-list");
    if (!list) return;

    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-diary-filter]"));
    var rows = Array.prototype.slice.call(list.querySelectorAll(".diary-item"));
    var out = document.getElementById("diary-count");

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        var kind = chip.getAttribute("data-diary-filter");
        var shown = 0;
        rows.forEach(function (row) {
          var match = kind === "all" || row.getAttribute("data-kind") === kind;
          row.hidden = !match;
          if (match) shown += 1;
        });
        if (out) {
          out.textContent =
            shown === rows.length
              ? "Showing all " + shown + " dated events for November 2026."
              : "Showing " + shown + " of " + rows.length + " dated events for November 2026.";
        }
      });
    });
  }

  /* ------------------------------------------------------------------
   * 6. Forms — validate, report, confirm
   * ------------------------------------------------------------------ */
  function initForms() {
    var forms = document.querySelectorAll("form[data-validate]");
    if (!forms.length) return;

    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    forms.forEach(function (form) {
      var summary = form.querySelector(".error-summary");
      var summaryList = summary ? summary.querySelector("ul") : null;
      var success = document.getElementById(form.getAttribute("data-success"));

      function fields() {
        return Array.prototype.slice
          .call(form.querySelectorAll("[data-rule]"))
          .filter(function (el) { return !el.disabled && el.type !== "hidden"; });
      }

      function wrapOf(el) {
        return el.closest(".field") || el;
      }

      function message(el) {
        var v = (el.value || "").trim();
        var kind = el.getAttribute("data-rule");
        if (!v && el.hasAttribute("required")) {
          return el.getAttribute("data-required-msg") || "This line is required.";
        }
        if (!v) return "";
        if (kind === "email" && !emailRe.test(v)) return "Check the address — we need name@example.com.";
        if (kind === "name" && v.length < 2) return "Give us a name of at least two letters.";
        if (kind === "text" && v.length < 3) return "A little more detail, please.";
        return "";
      }

      function setError(el, msg) {
        var wrap = wrapOf(el);
        var out = wrap.querySelector(".field-error");
        wrap.classList.toggle("has-error", Boolean(msg));
        if (msg) el.setAttribute("aria-invalid", "true");
        else el.removeAttribute("aria-invalid");
        if (out) out.textContent = msg;
      }

      form.addEventListener("blur", function (e) {
        var el = e.target;
        if (el.matches("[data-rule]")) setError(el, message(el));
      }, true);

      form.addEventListener("input", function (e) {
        var el = e.target;
        if (el.matches("[data-rule]") && wrapOf(el).classList.contains("has-error")) {
          setError(el, message(el));
        }
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var problems = [];

        fields().forEach(function (el) {
          var msg = message(el);
          setError(el, msg);
          if (msg) {
            problems.push({ el: el, msg: msg, label: labelFor(el) });
          }
        });

        var consent = form.querySelector("[data-consent]");
        if (consent && !consent.checked) {
          var cmsg = "Tick the box so we may email you.";
          setError(consent, cmsg);
          problems.push({ el: consent, msg: cmsg, label: labelFor(consent) });
        }

        if (problems.length) {
          if (summary && summaryList) {
            summaryList.innerHTML = "";
            problems.forEach(function (p) {
              var li = document.createElement("li");
              var a = document.createElement("a");
              a.href = "#" + p.el.id;
              a.textContent = p.label + ": " + p.msg;
              a.addEventListener("click", function (ev) {
                ev.preventDefault();
                p.el.focus();
              });
              li.appendChild(a);
              summaryList.appendChild(li);
            });
            summary.classList.add("is-visible");
            summary.hidden = false;
            summary.focus();
          } else {
            problems[0].el.focus();
          }
          return;
        }

        if (summary) {
          summary.classList.remove("is-visible");
          summary.hidden = true;
        }

        var nameField = form.querySelector("[name='name']");
        var who = nameField && nameField.value.trim() ? nameField.value.trim().split(" ")[0] : "friend";
        var slot = form.querySelector("[data-success-name]");
        if (slot) slot.textContent = who;

        if (success) {
          form.hidden = true;
          success.classList.add("is-visible");
          success.hidden = false;
          var head = success.querySelector("h3, h2");
          if (head) {
            head.setAttribute("tabindex", "-1");
            head.focus();
          }
        } else {
          form.reset();
        }
      });

      function labelFor(el) {
        if (el.id && form.querySelector("label[for='" + el.id + "']")) {
          return form.querySelector("label[for='" + el.id + "']").textContent.trim();
        }
        var legend = el.closest("fieldset") ? el.closest("fieldset").querySelector("legend") : null;
        return legend ? legend.textContent.trim() : (el.name || "field");
      }
    });
  }

  /* ------------------------------------------------------------------
   * 7. Small niceties
   * ------------------------------------------------------------------ */
  function initMisc() {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    // Counter prices stay honest: no-op placeholder for future use.
    var lastLines = document.querySelectorAll("[data-hours-today]");
    if (lastLines.length) {
      var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var today = days[new Date().getDay()];
      lastLines.forEach(function (el) {
        el.textContent = "Today is " + today + " — the kettle is on until ten.";
      });
    }
  }

  function boot() {
    initNav();
    initSpotlight();
    initParallax();
    initShelf();
    initDiary();
    initForms();
    initMisc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
