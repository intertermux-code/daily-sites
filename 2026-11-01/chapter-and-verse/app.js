/* ============================================================
   Chapter & Verse — shared behaviour
   Parallax Layers · Blur-Fade Ascend · filters · forms
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersStill = reduceMotion.matches;
  reduceMotion.addEventListener("change", function (e) {
    prefersStill = e.matches;
    if (prefersStill) { resetParallax(); }
  });

  var ticking = false;

  function onFrame(fn) {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      fn();
      ticking = false;
    });
  }

  /* ---------- 1. Sticky header state + reading progress ---------- */
  var masthead = document.querySelector(".masthead");
  var progress = document.querySelector(".progress__bar");

  function updateChrome() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (masthead) {
      masthead.classList.toggle("is-scrolled", y > 24);
    }
    if (progress) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progress.style.setProperty("--progress", ratio.toFixed(4));
    }
  }

  /* ---------- 2. Parallax Layers ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));

  function applyParallax() {
    if (prefersStill || !layers.length) return;
    var vh = window.innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      var host = el.__host || (el.__host = el.closest(".hero, .frame, .parallax") || el.parentElement);
      if (!host) continue;
      var r = host.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue;
      var speed = parseFloat(el.getAttribute("data-speed")) || 0;
      var y = -r.top * speed;
      el.style.transform = "translate3d(0," + y.toFixed(2) + "px,0)";
    }
  }

  function resetParallax() {
    for (var i = 0; i < layers.length; i++) {
      layers[i].style.transform = "translate3d(0,0,0)";
    }
  }

  function onScroll() {
    onFrame(function () {
      updateChrome();
      applyParallax();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    layers.forEach(function (l) { l.__host = null; });
    onScroll();
  }, { passive: true });

  updateChrome();
  applyParallax();

  /* ---------- 3. Blur-Fade Ascend ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  // stagger siblings inside a declared group by 80ms
  document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
    var step = parseInt(group.getAttribute("data-reveal-group"), 10);
    if (isNaN(step)) step = 80;
    Array.prototype.slice.call(group.children).forEach(function (child, i) {
      if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
      child.style.setProperty("--reveal-delay", (i * step) + "ms");
    });
  });

  if ("IntersectionObserver" in window && !prefersStill && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 4. Navigation (small screens) ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (navToggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1088) closeNav();
    }, { passive: true });
  }

  /* ---------- 5. Shelf + catalogue filtering (books.html) ---------- */
  var filterRoot = document.querySelector("[data-filter-root]");

  if (filterRoot) {
    var chips = Array.prototype.slice.call(filterRoot.querySelectorAll("[data-genre]"));
    var spines = Array.prototype.slice.call(filterRoot.querySelectorAll(".spine"));
    var gaps = Array.prototype.slice.call(filterRoot.querySelectorAll(".shelf__gap"));
    var rows = Array.prototype.slice.call(filterRoot.querySelectorAll(".book"));
    var search = filterRoot.querySelector("[data-search]");
    var countOut = filterRoot.querySelector("[data-count]");
    var emptyOut = filterRoot.querySelector("[data-empty]");
    var active = "all";
    var query = "";

    var matches = function (el) {
      var genreOk = active === "all" || el.getAttribute("data-genre") === active;
      if (!genreOk) return false;
      if (!query) return true;
      var hay = (el.getAttribute("data-search") || el.textContent).toLowerCase();
      return hay.indexOf(query) !== -1;
    };

    function applyFilter() {
      var shown = 0;
      spines.forEach(function (el) {
        var ok = matches(el);
        el.classList.toggle("is-hidden", !ok);
        el.setAttribute("aria-hidden", ok ? "false" : "true");
        if (ok) el.tabIndex = 0; else el.tabIndex = -1;
      });
      rows.forEach(function (el) {
        var ok = matches(el);
        el.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      if (countOut) {
        countOut.textContent = shown === 1 ? "1 title on the shelf" : shown + " titles on the shelf";
      }
      gaps.forEach(function (g) { g.hidden = !(active === "all" && !query); });
      if (emptyOut) {
        emptyOut.hidden = shown !== 0;
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        active = chip.getAttribute("data-genre");
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        applyFilter();
      });
    });

    if (search) {
      var t = null;
      search.addEventListener("input", function () {
        window.clearTimeout(t);
        t = window.setTimeout(function () {
          query = search.value.trim().toLowerCase();
          applyFilter();
        }, 120);
      });
      var form = search.closest("form");
      if (form) form.addEventListener("submit", function (e) { e.preventDefault(); });
    }

    applyFilter();
  }

  /* ---------- 6. Events filtering (events.html) ---------- */
  var eventRoot = document.querySelector("[data-event-root]");

  if (eventRoot) {
    var eChips = Array.prototype.slice.call(eventRoot.querySelectorAll("[data-kind]"));
    var events = Array.prototype.slice.call(eventRoot.querySelectorAll(".event"));
    var eCount = eventRoot.querySelector("[data-event-count]");
    var eEmpty = eventRoot.querySelector("[data-event-empty]");

    eChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var kind = chip.getAttribute("data-kind");
        eChips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        var shown = 0;
        events.forEach(function (row) {
          var ok = kind === "all" || row.getAttribute("data-kind") === kind;
          row.classList.toggle("is-hidden", !ok);
          if (ok) shown++;
        });
        if (eCount) {
          eCount.textContent = shown === 1 ? "1 event listed" : shown + " events listed";
        }
        if (eEmpty) eEmpty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- 7. Form handling ---------- */
  function validateField(field) {
    var input = field.querySelector("input, select, textarea");
    if (!input) return true;
    var msgEl = field.querySelector(".field__error");
    var value = (input.type === "checkbox") ? input.checked : input.value.trim();
    var message = "";

    if (input.hasAttribute("data-required") && !value) {
      message = input.getAttribute("data-required-message") || "This line is needed.";
    } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      message = "That address looks incomplete — check for a domain.";
    } else if (input.pattern && value && !new RegExp("^(?:" + input.pattern + ")$").test(value)) {
      message = "Please use digits, spaces and + only.";
    }

    field.classList.toggle("has-error", !!message);
    if (message) { input.setAttribute("aria-invalid", "true"); } else { input.removeAttribute("aria-invalid"); }
    if (msgEl) msgEl.textContent = message;
    return !message;
  }

  document.querySelectorAll("[data-form]").forEach(function (form) {
    var status = form.querySelector("[data-form-status]");
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field"));

    fields.forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("blur", function () { validateField(field); });
      input.addEventListener("input", function () {
        if (field.classList.contains("has-error")) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      fields.forEach(function (field) {
        if (!validateField(field) && !bad) bad = field;
      });

      if (bad) {
        var firstInput = bad.querySelector("input, select, textarea");
        if (firstInput) firstInput.focus();
        if (status) {
          status.classList.add("is-visible");
          status.setAttribute("data-state", "error");
          var h = status.querySelector("h3");
          if (h) h.textContent = "One line needs attention";
          var p = status.querySelector("p");
          if (p) p.textContent = "We have marked the field above. Correct it and send the form again.";
        }
        return;
      }

      var name = form.querySelector("[data-name-field]");
      var choice = form.querySelector("[data-circle-field]");
      if (status) {
        var who = name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : "friend";
        var circle = choice && choice.value ? " " + choice.value.toLowerCase() : "";
        status.classList.add("is-visible");
        status.setAttribute("data-state", "ok");
        var heading = status.querySelector("h3");
        if (heading) heading.textContent = "Your name is in the book, " + who;
        var copy = status.querySelector("p");
        if (copy) {
          copy.textContent = "Nadia will post to you within two working days with the first" +
            circle + " extract, the reading calendar, and the key to the back room.";
        }
      }
      form.reset();
      fields.forEach(function (f) {
        f.classList.remove("has-error");
        var err = f.querySelector(".field__error");
        if (err) err.textContent = "";
      });
      if (status) status.focus();
    });
  });

  /* ---------- 8. Newsletter (footer + index) ---------- */
  document.querySelectorAll("[data-newsletter]").forEach(function (form) {
    var input = form.querySelector("input[type='email']");
    var out = form.querySelector("[data-newsletter-status]");
    if (!input || !out) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        out.textContent = "Please write a complete email address.";
        out.classList.add("has-error");
        input.focus();
        return;
      }
      out.classList.remove("has-error");
      out.textContent = "Added — the Bookseller's Letter goes out on the first Friday.";
      form.reset();
    });
  });

  /* ---------- 9. Prefill from query string (events → book club) ---------- */
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get("event");
  if (wanted) {
    var target = document.querySelector("[data-prefill]");
    if (target) {
      target.value = wanted;
      var hint = document.querySelector("[data-prefill-note]");
      if (hint) {
        hint.hidden = false;
        hint.textContent = "Reserved from the " + wanted + " listing — confirm below and we will hold your seat.";
      }
    }
  }

  /* ---------- 10. Colophon year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- 11. Smooth in-page anchors keep focus ---------- */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (a) {
    a.addEventListener("click", function () {
      var target = document.getElementById(a.getAttribute("href").slice(1));
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      window.setTimeout(function () { target.focus({ preventScroll: true }); }, prefersStill ? 0 : 420);
    });
  });
})();
