/* ============================================================
   NEON PULSE 2026 — shared behaviour
   Signature motion: word-stagger headlines + marquee tickers.
   All features are guarded by element-existence checks.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var FEST_OPEN = new Date(2026, 11, 18, 18, 0, 0); // Fri 18 Dec 2026, gates open 18:00

  /* ---------- 1. mobile nav ---------- */
  function initNav() {
    var nav = document.getElementById("primary-nav");
    var toggle = document.getElementById("nav-toggle");
    if (!nav || !toggle) return;

    function setOpen(open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(nav.getAttribute("data-open") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) setOpen(false);
    });
  }

  /* ---------- 2. word-stagger headlines ---------- */
  function wrapWords(el) {
    var index = 0;
    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      node.textContent = "";
      children.forEach(function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              node.appendChild(document.createTextNode(part));
              return;
            }
            var span = document.createElement("span");
            span.className = "word";
            span.style.setProperty("--wi", index++);
            span.textContent = part;
            node.appendChild(span);
          });
        } else if (child.nodeType === 1) {
          var clone = child.cloneNode(true);
          walk(clone);
          node.appendChild(clone);
        } else {
          node.appendChild(child);
        }
      });
    }
    walk(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  }

  function initStagger() {
    var targets = Array.prototype.slice.call(document.querySelectorAll("[data-stagger]"));
    if (!targets.length) return;

    targets.forEach(wrapWords);

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var hero = targets.filter(function (el) { return el.hasAttribute("data-stagger-onload"); });
    requestAnimationFrame(function () {
      hero.forEach(function (el) { el.classList.add("is-in"); });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.25 });

    targets.forEach(function (el) {
      if (hero.indexOf(el) === -1) io.observe(el);
    });
  }

  /* ---------- 3. countdown ---------- */
  function pad(n, len) {
    var s = String(Math.max(0, n));
    while (s.length < (len || 2)) s = "0" + s;
    return s;
  }

  function diffParts() {
    var ms = FEST_OPEN.getTime() - Date.now();
    var live = ms <= 0;
    var t = Math.abs(ms);
    return {
      live: live,
      days: Math.floor(t / 86400000),
      hours: Math.floor(t / 3600000) % 24,
      mins: Math.floor(t / 60000) % 60,
      secs: Math.floor(t / 1000) % 60
    };
  }

  function initCountdown() {
    var box = document.getElementById("countdown");
    var chip = document.getElementById("tchip");
    if (!box && !chip) return;
    var cells = box ? box.querySelectorAll("[data-cd]") : [];
    var liveEl = box ? box.querySelector("[data-cd-live]") : null;
    var chipVal = chip ? chip.querySelector("span") : null;
    var isLive = false;

    function render() {
      var p = diffParts();
      if (p.live && !isLive && box) {
        isLive = true;
        box.setAttribute("data-state", "live");
        cells.forEach(function (c) { c.textContent = "00"; });
        if (liveEl) liveEl.hidden = false;
      }
      if (!p.live && box) {
        cells.forEach(function (c) {
          var key = c.getAttribute("data-cd");
          c.textContent = pad(p[key], key === "days" ? 3 : 2);
        });
      }
      if (chipVal) {
        chipVal.textContent = p.live
          ? "LIVE NOW"
          : "T−" + p.days + "d " + pad(p.hours) + ":" + pad(p.mins) + ":" + pad(p.secs);
      }
    }
    render();
    window.setInterval(render, 1000);
  }

  /* ---------- 4. marquee tickers (seamless duplication) ---------- */
  function initTickers() {
    document.querySelectorAll("[data-marquee]").forEach(function (ticker) {
      var track = ticker.querySelector(".ticker__track, .row__track");
      if (!track) return;
      var group = track.firstElementChild;
      if (!group || track.children.length < 2) {
        if (!group) return;
        var copy = group.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
      }
    });
  }

  /* ---------- 5. chapter rail (index) ---------- */
  function initRail() {
    var rail = document.getElementById("chapter-rail");
    if (!rail || !("IntersectionObserver" in window)) return;
    var links = rail.querySelectorAll("a[data-target]");
    var map = {};
    var seen = [];
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute("data-target"));
      if (el) { map[el.id] = a; seen.push(el); }
    });
    if (!seen.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var active = map[entry.target.id];
        if (active) active.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

    seen.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. lineup filters ---------- */
  function initFilters() {
    var grid = document.getElementById("act-grid");
    if (!grid) return;
    var acts = Array.prototype.slice.call(grid.querySelectorAll(".act"));
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-filter-group]"));
    var search = document.getElementById("act-search");
    var count = document.getElementById("act-count");
    var empty = document.getElementById("act-empty");
    var state = { day: "all", stage: "all", q: "" };

    function matches(act) {
      if (state.day !== "all" && act.getAttribute("data-day") !== state.day) return false;
      if (state.stage !== "all" && act.getAttribute("data-stage") !== state.stage) return false;
      if (state.q) {
        var hay = (act.textContent + " " + act.getAttribute("data-genre")).toLowerCase();
        if (hay.indexOf(state.q) === -1) return false;
      }
      return true;
    }

    function apply() {
      var shown = 0;
      acts.forEach(function (act) {
        var ok = matches(act);
        act.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      if (count) {
        count.textContent = shown + (shown === 1 ? " act" : " acts") +
          " · " + (state.day === "all" ? "all three days" : state.day.replace("fri", "Fri 18 Dec")
            .replace("sat", "Sat 19 Dec").replace("sun", "Sun 20 Dec")) +
          (state.stage === "all" ? "" : " · " + state.stage.replace(/-/g, " "));
      }
      if (empty) empty.hidden = shown !== 0;
    }

    groups.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-filter-group");
        var siblings = document.querySelectorAll('[data-filter-group="' + key + '"]');
        Array.prototype.forEach.call(siblings, function (s) { s.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        state[key] = btn.getAttribute("data-value");
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", function () {
        state.q = search.value.trim().toLowerCase();
        apply();
      });
    }

    var clear = document.getElementById("filter-clear");
    if (clear) {
      clear.addEventListener("click", function () {
        state = { day: "all", stage: "all", q: "" };
        if (search) search.value = "";
        document.querySelectorAll('[data-filter-group="day"], [data-filter-group="stage"]').forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-value") === "all" ? "true" : "false");
        });
        apply();
      });
    }

    apply();
  }

  /* ---------- 7. FAQ accordion ---------- */
  function initAccordion() {
    var faq = document.getElementById("faq");
    if (!faq) return;
    var buttons = faq.querySelectorAll(".faq__q");

    function close(btn) {
      btn.setAttribute("aria-expanded", "false");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.style.maxHeight = "0px";
    }
    function open(btn) {
      btn.setAttribute("aria-expanded", "true");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) { panel.style.maxHeight = "0px"; panel.setAttribute("role", "region"); }
      close(btn);

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        Array.prototype.forEach.call(buttons, close);
        if (isOpen) {
          // collapse handled above; leave closed
        } else {
          open(btn);
        }
      });
    });

    if (buttons.length) {
      // deep link: #faq-3 style anchors
      var hash = window.location.hash;
      var target = hash ? faq.querySelector('[href="' + hash + '"], #' + CSS.escape(hash.slice(1))) : null;
      var trigger = null;
      Array.prototype.forEach.call(buttons, function (b) {
        if (b.getAttribute("aria-controls") === (target && target.id)) trigger = b;
      });
      if (trigger) {
        open(trigger);
        window.setTimeout(function () { trigger.focus(); }, 60);
      }
    }

    window.addEventListener("resize", function () {
      Array.prototype.forEach.call(buttons, function (btn) {
        if (btn.getAttribute("aria-expanded") === "true") open(btn);
      });
    });
  }

  /* ---------- 8. forms ---------- */
  function initForms() {
    document.querySelectorAll("form[data-demo]").forEach(function (form) {
      var ok = form.querySelector("[data-form-ok]");
      var err = form.querySelector("[data-form-err]");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var bad = false;
        form.querySelectorAll("[required]").forEach(function (input) {
          var valid = input.checkValidity();
          input.setAttribute("aria-invalid", valid ? "false" : "true");
          if (!valid) bad = true;
        });
        if (err) {
          err.hidden = !bad;
          if (bad && ok) ok.hidden = true;
        }
        if (bad) {
          var firstBad = form.querySelector('[aria-invalid="true"]');
          if (firstBad) firstBad.focus();
          return;
        }
        if (ok) {
          ok.hidden = false;
          var msg = form.getAttribute("data-success") || "Signal received.";
          var slot = ok.querySelector("[data-form-ok-text]");
          if (slot) slot.textContent = "$ " + msg;
          ok.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
        }
        form.reset();
      });
    });
  }

  /* ---------- 9. gallery lightbox ---------- */
  function initLightbox() {
    var dlg = document.getElementById("lightbox");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var img = dlg.querySelector("img");
    var cap = dlg.querySelector("[data-lightbox-cap]");
    var closeBtn = dlg.querySelector(".lightbox__close");
    var lastFocus = null;

    document.querySelectorAll("[data-lightbox]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        lastFocus = btn;
        img.src = btn.getAttribute("data-lightbox");
        img.alt = btn.getAttribute("data-lightbox-alt") || "";
        img.width = 1600;
        img.height = 1200;
        cap.textContent = btn.getAttribute("data-lightbox-cap") || "";
        dlg.showModal();
      });
    });

    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target === closeBtn) dlg.close();
    });
    dlg.addEventListener("close", function () {
      if (lastFocus) lastFocus.focus();
    });
  }

  /* ---------- 10. tickets: quantity / stepper ---------- */
  function initSteppers() {
    document.querySelectorAll("[data-stepper]").forEach(function (wrap) {
      var out = wrap.querySelector("[data-stepper-out]");
      var minus = wrap.querySelector("[data-stepper-minus]");
      var plus = wrap.querySelector("[data-stepper-plus]");
      var min = parseInt(wrap.getAttribute("data-min"), 10) || 0;
      var max = parseInt(wrap.getAttribute("data-max"), 10) || 10;
      var val = parseInt(wrap.getAttribute("data-value"), 10) || min;

      function render() {
        out.textContent = String(val);
        out.setAttribute("aria-label", wrap.getAttribute("data-label") + ": " + val);
        minus.disabled = val <= min;
        plus.disabled = val >= max;
        var total = wrap.parentElement ? wrap.parentElement.querySelector("[data-price-total]") : null;
        if (total) {
          var unit = parseFloat(total.getAttribute("data-unit")) || 0;
          total.textContent = "$" + (unit * val).toLocaleString("en-US");
        }
      }
      minus.addEventListener("click", function () { val = Math.max(min, val - 1); render(); });
      plus.addEventListener("click", function () { val = Math.min(max, val + 1); render(); });
      render();
    });
  }

  /* ---------- 11. misc ---------- */
  function initMisc() {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    // mark the current page in the footer nav as well
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".foot__list a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path) a.setAttribute("aria-current", "page");
    });
  }

  function boot() {
    initNav();
    initStagger();
    initCountdown();
    initTickers();
    initRail();
    initFilters();
    initAccordion();
    initForms();
    initLightbox();
    initSteppers();
    initMisc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
