/* ============================================================
   Copperline Brewing Co. — shared behaviour
   Every block is guarded by element-existence checks so one
   file can serve all pages.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mobile navigation ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      if (open) {
        nav.setAttribute("hidden", "");
      } else {
        nav.removeAttribute("hidden");
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        nav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 980) {
        nav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) {
        nav.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "false");
      } else if (toggle.getAttribute("aria-expanded") === "false") {
        nav.setAttribute("hidden", "");
      }
    });

    if (window.innerWidth <= 980) nav.setAttribute("hidden", "");
  }

  /* ---------- 2. Primary motion: Blur-Fade Ascend ---------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    // Stagger siblings inside the same group by 80ms.
    var groups = new Map();
    items.forEach(function (el) {
      var parent = el.parentElement;
      var idx = groups.get(parent) || 0;
      groups.set(parent, idx + 1);
      el.style.setProperty("--d", Math.min(idx, 8) * 80 + "ms");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. Secondary motion: Clip-Path Image Reveal ---------- */
  function initClipReveal() {
    var media = document.querySelectorAll("[data-clip]");
    if (!media.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      media.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    media.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Age gate (index only) ---------- */
  function initAgeGate() {
    var gate = document.getElementById("age-gate");
    if (!gate) return;

    var KEY = "copperline-age-ok";
    var remembered = false;
    try { remembered = window.localStorage.getItem(KEY) === "yes"; } catch (e) { remembered = false; }

    if (remembered) return;

    var yes = document.getElementById("age-yes");
    var no = document.getElementById("age-no");
    var panel = gate.querySelector(".modal__panel");
    var previouslyFocused = null;

    function open() {
      previouslyFocused = document.activeElement;
      gate.removeAttribute("hidden");
      document.body.classList.add("is-locked");
      window.setTimeout(function () { if (yes) yes.focus(); }, 60);
      document.addEventListener("keydown", onKey);
    }

    function close() {
      gate.setAttribute("hidden", "");
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    }

    function onKey(e) {
      if (e.key === "Tab" && panel) {
        var f = gate.querySelectorAll("button, a[href]");
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    if (yes) yes.addEventListener("click", function () {
      try { window.localStorage.setItem(KEY, "yes"); } catch (e) { /* private mode */ }
      close();
    });

    if (no) no.addEventListener("click", function () {
      var deny = document.getElementById("age-deny");
      if (deny) deny.removeAttribute("hidden");
      no.setAttribute("aria-hidden", "true");
      if (deny) deny.setAttribute("tabindex", "-1");
      if (yes) {
        yes.setAttribute("disabled", "disabled");
      }
      if (deny) deny.focus();
    });

    open();
  }

  /* ---------- 5. Beer detail modal + style filter (beers.html) ---------- */
  function initBeers() {
    var grid = document.getElementById("beer-grid");
    if (!grid) return;

    var modal = document.getElementById("beer-modal");
    var body = document.getElementById("beer-modal-body");
    var closeBtn = document.getElementById("beer-modal-close");
    var lastFocus = null;

    function openBeer(card) {
      if (!modal || !body) return;
      var detail = card.querySelector(".beer-detail");
      body.innerHTML = detail ? detail.innerHTML : "";
      modal.removeAttribute("hidden");
      document.body.classList.add("is-locked");
      lastFocus = card;
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      if (!modal || modal.hasAttribute("hidden")) return;
      modal.setAttribute("hidden", "");
      document.body.classList.remove("is-locked");
      body.innerHTML = "";
      if (lastFocus) lastFocus.focus();
    }

    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".beer-card");
      if (card) openBeer(card);
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target.classList.contains("modal__scrim")) closeModal();
      });
      modal.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeModal();
        if (e.key !== "Tab") return;
        var f = modal.querySelectorAll("button, a[href]");
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }

    /* Style filter */
    var chips = document.querySelectorAll("[data-filter]");
    var count = document.getElementById("beer-count");
    var emptyMsg = document.getElementById("beer-empty");

    function setCount(n) {
      if (!count) return;
      count.textContent = n + (n === 1 ? " beer on the board" : " beers on the board");
    }

    function applyFilter(value) {
      var shown = 0;
      grid.querySelectorAll(".beer-card").forEach(function (card) {
        var match = value === "all" || card.getAttribute("data-style") === value;
        card.hidden = !match;
        if (match) {
          shown++;
          if (!reduceMotion) {
            card.classList.remove("in");
            window.requestAnimationFrame(function () { card.classList.add("in"); });
          }
        }
      });
      setCount(shown);
      if (emptyMsg) emptyMsg.hidden = shown !== 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        applyFilter(chip.getAttribute("data-filter"));
      });
    });

    setCount(grid.querySelectorAll(".beer-card:not([hidden])").length);
  }

  /* ---------- 6. Taproom open / closed status ---------- */
  function initOpenStatus() {
    var slots = document.querySelectorAll("[data-open-status]");
    if (!slots.length) return;

    // 0 = Sun … 6 = Sat; ranges in 24h decimals
    var hours = {
      0: { label: "Sunday", open: 12, close: 21 },
      1: { label: "Monday", open: 0, close: 0 },
      2: { label: "Tuesday", open: 16, close: 23 },
      3: { label: "Wednesday", open: 16, close: 23 },
      4: { label: "Thursday", open: 16, close: 23 },
      5: { label: "Friday", open: 15, close: 24 },
      6: { label: "Saturday", open: 12, close: 24 }
    };

    var now = new Date();
    var day = now.getDay();
    var t = now.getHours() + now.getMinutes() / 60;
    var today = hours[day];
    var isOpen = today.close > today.open && t >= today.open && t < today.close;

    function fmt(v) {
      var h24 = Math.floor(v) % 24;
      var m = Math.round((v - Math.floor(v)) * 60);
      var suffix = h24 >= 12 ? "PM" : "AM";
      var h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return h12 + (m ? ":" + (m < 10 ? "0" + m : m) : "") + " " + suffix;
    }

    var message;
    if (isOpen) {
      message = "Open now — pouring until " + fmt(today.close);
    } else if (today.close > today.open && t < today.open) {
      message = "Closed — taps open at " + fmt(today.open) + " today";
    } else {
      var next = day;
      for (var i = 1; i <= 7; i++) {
        var cand = hours[(day + i) % 7];
        if (cand.close > cand.open) {
          next = (day + i) % 7;
          break;
        }
      }
      var prefix = next === day ? "" : hours[next].label + " ";
      message = "Closed — back " + prefix + "at " + fmt(hours[next].open);
    }

    slots.forEach(function (el) {
      el.textContent = message;
      el.classList.remove("status-pill--open", "status-pill--closed");
      el.classList.add(isOpen ? "status-pill--open" : "status-pill--closed");
    });

    var row = document.querySelector('.hours [data-day="' + day + '"]');
    if (row) row.setAttribute("data-today", "true");
  }

  /* ---------- 7. Count-up figures (rAF, reduced-motion aware) ---------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function render(el, value) {
      var suffix = el.getAttribute("data-suffix") || "";
      var text = el.hasAttribute("data-raw") ? String(value) : value.toLocaleString("en-US");
      el.textContent = text + suffix;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(function (el) { render(el, parseInt(el.getAttribute("data-count"), 10)); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var start = null;
        var dur = 1400;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          render(el, Math.round(target * eased));
          if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 8. Progressive form handling ---------- */
  function initForms() {
    var forms = document.querySelectorAll("[data-form]");
    if (!forms.length) return;

    forms.forEach(function (form) {
      var status = form.querySelector("[data-form-status]");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        var firstBad = null;

        form.querySelectorAll("[data-required]").forEach(function (input) {
          var errEl = form.querySelector('[data-error-for="' + input.id + '"]');
          var value = input.value.trim();
          var bad = !value || (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value));
          input.setAttribute("aria-invalid", String(bad));
          if (errEl) errEl.textContent = bad
            ? (input.type === "email" ? "Enter a valid email address." : "This field is required.")
            : "";
          if (bad) { ok = false; if (!firstBad) firstBad = input; }
        });

        if (!ok) {
          if (status) { status.textContent = "Check the highlighted fields."; status.style.color = "#e88a66"; }
          if (firstBad) firstBad.focus();
          return;
        }

        var success = form.getAttribute("data-success") || "Thanks — you are on the list.";
        if (status) { status.style.color = ""; status.textContent = success; }
        form.reset();
        form.querySelectorAll("[aria-invalid]").forEach(function (i) { i.removeAttribute("aria-invalid"); });
      });
    });
  }

  /* ---------- 9. Split-pane depth: gentle parallax on sticky media ---------- */
  function initSplitDrift() {
    var panes = document.querySelectorAll("[data-drift]");
    if (!panes.length || reduceMotion || window.innerWidth < 900) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        panes.forEach(function (pane) {
          var rect = pane.getBoundingClientRect();
          var progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
          pane.style.transform = "translate3d(0," + (progress * -14).toFixed(2) + "px,0)";
        });
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 10. Footer year ---------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function boot() {
    initNav();
    initAgeGate();
    initBeers();
    initOpenStatus();
    initCounters();
    initForms();
    initSplitDrift();
    initYear();
    initReveal();
    initClipReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
