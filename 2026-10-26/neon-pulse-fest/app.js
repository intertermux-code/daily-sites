/* ==========================================================================
   NEON PULSE — shared behaviour
   Signature motion: parallax layers (rAF) + 3D card tilt with glare.
   Page features are guarded by element-existence checks.
   ========================================================================== */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function (e) {
      reduced = e.matches;
      if (reduced) resetAll();
    });
  }

  var festival = {
    start: new Date(2026, 11, 18, 18, 0, 0),
    name: "Neon Pulse Festival"
  };

  function resetAll() {
    document.querySelectorAll("[data-speed]").forEach(function (el) {
      el.style.transform = "";
    });
    document.querySelectorAll("[data-tilt], .tilt-card").forEach(function (card) {
      card.style.transform = "";
      card.style.setProperty("--gx", "50%");
      card.style.setProperty("--gy", "50%");
    });
  }

  /* ---------- Mobile navigation ---------- */
  (function nav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("main-nav");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.setAttribute("data-nav", open ? "open" : "closed");
      if (!open) return;
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1000) setOpen(false);
    });
  })();

  /* ---------- Countdown to gates open ---------- */
  (function countdown() {
    var root = document.querySelector("[data-countdown]");
    if (!root) return;

    var cells = {
      days: root.querySelector("[data-cd='days']"),
      hours: root.querySelector("[data-cd='hours']"),
      minutes: root.querySelector("[data-cd='minutes']"),
      seconds: root.querySelector("[data-cd='seconds']")
    };
    var caption = root.querySelector("[data-cd-caption]");

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function tick() {
      var diff = festival.start.getTime() - Date.now();
      if (diff < 0) diff = 0;
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;

      if (cells.days) cells.days.textContent = d;
      if (cells.hours) cells.hours.textContent = pad(h);
      if (cells.minutes) cells.minutes.textContent = pad(m);
      if (cells.seconds) cells.seconds.textContent = pad(sec);
      if (caption) {
        caption.textContent = diff === 0
          ? "Gates are open — Neon Pulse is live."
          : d + " days, " + h + " hours until gates open at Ironworks Yard.";
      }
    }

    tick();
    window.setInterval(tick, 1000);
  })();

  /* ---------- Primary motion: parallax layers, one rAF scroll handler ---------- */
  var parallaxItems = [];

  function measureParallax() {
    parallaxItems = [];
    document.querySelectorAll("[data-speed]").forEach(function (el) {
      var host = el.closest("[data-parallax]") || el.parentElement;
      if (!host) return;
      parallaxItems.push({
        el: el,
        host: host,
        speed: parseFloat(el.getAttribute("data-speed")) || 0,
        top: 0,
        height: 0,
        range: 1
      });
    });
    cachePositions();
  }

  function cachePositions() {
    parallaxItems.forEach(function (item) {
      var rect = item.host.getBoundingClientRect();
      item.top = rect.top + window.pageYOffset;
      item.height = rect.height || window.innerHeight;
      item.range = item.height + window.innerHeight;
    });
  }

  var viewportH = window.innerHeight;
  var ticking = false;

  function drawParallax() {
    ticking = false;
    if (reduced || !parallaxItems.length) return;
    var y = window.pageYOffset;
    for (var i = 0; i < parallaxItems.length; i++) {
      var item = parallaxItems[i];
      if (item.top - window.innerHeight > y || item.top + item.height + window.innerHeight < y) continue;
      var progress = (y - item.top) / item.range;
      var shift = (progress - 0.5) * item.speed * 100 * 2;
      shift = Math.max(-260, Math.min(260, shift));
      item.el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(drawParallax);
    }
  }

  if (document.querySelector("[data-speed]")) {
    measureParallax();
    drawParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      viewportH = window.innerHeight;
      cachePositions();
      onScroll();
    });
  }

  /* ---------- Secondary motion: 3D card tilt + tracking glare ---------- */
  (function tilt() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tilt]"));
    if (!cards.length) return;

    var MAX = 8;
    var states = new Map();

    function stateFor(card) {
      var s = states.get(card);
      if (!s) {
        s = { cx: 0, cy: 0, tx: 0, ty: 0, gx: 50, gy: 50, tgx: 50, tgy: 50, raf: 0, active: false };
        states.set(card, s);
      }
      return s;
    }

    function loop(card) {
      var s = stateFor(card);
      var dx = s.tx - s.cx;
      var dy = s.ty - s.cy;
      var dgx = s.tgx - s.gx;
      var dgy = s.tgy - s.gy;

      s.cx += dx * 0.14;
      s.cy += dy * 0.14;
      s.gx += dgx * 0.2;
      s.gy += dgy * 0.2;

      card.style.transform =
        "perspective(900px) rotateX(" + s.cx.toFixed(3) + "deg) rotateY(" + s.cy.toFixed(3) + "deg) translate3d(0,0,0)";
      card.style.setProperty("--gx", s.gx.toFixed(1) + "%");
      card.style.setProperty("--gy", s.gy.toFixed(1) + "%");

      var settled = Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 && Math.abs(dgx) < 0.1 && Math.abs(dgy) < 0.1;
      if (settled) {
        if (!s.active) {
          card.style.transform = "";
          s.raf = 0;
          return;
        }
        s.raf = 0;
        return;
      }
      s.raf = window.requestAnimationFrame(function () { loop(card); });
    }

    function startLoop(card) {
      var s = stateFor(card);
      if (!s.raf) s.raf = window.requestAnimationFrame(function () { loop(card); });
    }

    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        if (reduced || e.pointerType === "touch") return;
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var s = stateFor(card);
        s.active = true;
        s.tx = (0.5 - py) * MAX * 2;
        s.ty = (px - 0.5) * MAX * 2;
        s.tgx = (px * 100).toFixed(1);
        s.tgy = (py * 100).toFixed(1);
        startLoop(card);
      });

      card.addEventListener("pointerleave", function () {
        var s = stateFor(card);
        s.active = false;
        s.tx = 0;
        s.ty = 0;
        s.tgx = 50;
        s.tgy = 50;
        startLoop(card);
      });
    });
  })();

  /* ---------- Section entry (single, restrained reveal) ---------- */
  (function reveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var i = Array.prototype.indexOf.call(items, el);
        el.style.transitionDelay = ((i % 4) * 70) + "ms";
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Horizontal diorama ---------- */
  (function diorama() {
    var scope = document.querySelectorAll("[data-diorama]");
    scope.forEach(function (root) {
      var viewport = root.querySelector(".diorama__viewport");
      var panels = root.querySelectorAll(".diorama__panel");
      var prev = root.querySelector("[data-dio='prev']");
      var next = root.querySelector("[data-dio='next']");
      var bar = root.querySelector(".diorama__progress i");
      var status = root.querySelector("[data-dio='status']");
      if (!viewport || !panels.length) return;

      var index = 0;

      function panelStep() {
        var a = panels[0].getBoundingClientRect();
        var b = panels.length > 1 ? panels[1].getBoundingClientRect() : null;
        return b ? b.left - a.left : a.width;
      }

      function goTo(i, smooth) {
        index = Math.max(0, Math.min(panels.length - 1, i));
        var left = index * panelStep();
        viewport.scrollTo({ left: left, behavior: smooth && !reduced ? "smooth" : "auto" });
        panels[index].focus({ preventScroll: true });
      }

      function sync() {
        var max = viewport.scrollWidth - viewport.clientWidth;
        var ratio = max > 0 ? viewport.scrollLeft / max : 0;
        if (bar) bar.style.transform = "scaleX(" + Math.max(0.08, ratio).toFixed(4) + ")";
        if (prev) prev.disabled = viewport.scrollLeft < 4;
        if (next) next.disabled = max > 0 && viewport.scrollLeft > max - 4;
        var i = Math.round(viewport.scrollLeft / panelStep());
        if (i !== index) index = Math.max(0, Math.min(panels.length - 1, i));
        if (status) status.textContent = "Chapter " + (index + 1) + " of " + panels.length;
      }

      if (prev) prev.addEventListener("click", function () { goTo(index - 1, true); });
      if (next) next.addEventListener("click", function () { goTo(index + 1, true); });

      viewport.addEventListener("scroll", function () {
        window.requestAnimationFrame(sync);
      }, { passive: true });

      viewport.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1, true); }
        if (e.key === "Home") { e.preventDefault(); goTo(0, true); }
        if (e.key === "End") { e.preventDefault(); goTo(panels.length - 1, true); }
      });

      var dragging = false, startX = 0, startLeft = 0, moved = false;
      viewport.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "touch") return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startLeft = viewport.scrollLeft;
      });
      viewport.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 6) moved = true;
        viewport.scrollLeft = startLeft - dx;
      });
      function endDrag() { dragging = false; }
      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);
      viewport.addEventListener("pointerleave", endDrag);
      viewport.addEventListener("click", function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);

      window.addEventListener("resize", sync);
      sync();
    });
  })();

  /* ---------- Ticker + marquee: duplicate items inside one track for a seamless loop ---------- */
  (function loops() {
    document.querySelectorAll("[data-loop]").forEach(function (track) {
      if (track.dataset.looped === "true") return;
      Array.prototype.slice.call(track.children).forEach(function (child) {
        var copy = child.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll("a, button").forEach(function (el) {
          el.setAttribute("tabindex", "-1");
          el.setAttribute("aria-hidden", "true");
        });
        track.appendChild(copy);
      });
      track.dataset.looped = "true";
    });
  })();

  /* ---------- Lineup filtering (lineup.html) ---------- */
  (function lineup() {
    var bar = document.querySelector("[data-lineup-filter]");
    var grid = document.getElementById("lineup-grid");
    if (!bar || !grid) return;

    var artists = Array.prototype.slice.call(grid.querySelectorAll("[data-day]"));
    var status = document.querySelector("[data-filter-status]");
    var empty = document.getElementById("lineup-empty");
    var resetBtn = document.querySelector("[data-filter-reset]");

    var state = { day: "all", stage: "all" };

    function hasToken(attr, value) {
      return (attr || "").split(" ").indexOf(value) !== -1;
    }

    function apply() {
      var shown = 0;
      artists.forEach(function (card) {
        var okDay = state.day === "all" || hasToken(card.getAttribute("data-day"), state.day);
        var okStage = state.stage === "all" || hasToken(card.getAttribute("data-stage"), state.stage);
        var visible = okDay && okStage;
        card.hidden = !visible;
        if (visible) shown++;
      });

      bar.querySelectorAll("[data-filter]").forEach(function (btn) {
        var kind = btn.getAttribute("data-filter");
        var value = btn.getAttribute("data-value");
        btn.setAttribute("aria-pressed", state[kind] === value ? "true" : "false");
      });

      if (status) {
        status.textContent = shown === 1 ? "1 artist" : shown + " artists";
      }
      if (empty) empty.hidden = shown !== 0;
    }

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      state[btn.getAttribute("data-filter")] = btn.getAttribute("data-value");
      apply();
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state.day = "all";
        state.stage = "all";
        apply();
      });
    }

    apply();
  })();

  /* ---------- FAQ accordion (info.html, tickets.html) ---------- */
  (function accordion() {
    document.querySelectorAll("[data-accordion]").forEach(function (root) {
      var items = Array.prototype.slice.call(root.querySelectorAll(".accordion__item"));
      if (!items.length) return;
      var single = root.getAttribute("data-accordion") === "single";

      function close(item) {
        item.setAttribute("data-open", "false");
        var t = item.querySelector(".accordion__trigger");
        var p = item.querySelector(".accordion__panel");
        if (t) t.setAttribute("aria-expanded", "false");
        if (p) p.setAttribute("hidden", "");
      }

      function open(item) {
        item.setAttribute("data-open", "true");
        var t = item.querySelector(".accordion__trigger");
        var p = item.querySelector(".accordion__panel");
        if (t) t.setAttribute("aria-expanded", "true");
        if (p) p.removeAttribute("hidden");
      }

      items.forEach(function (item, i) {
        var trigger = item.querySelector(".accordion__trigger");
        var panel = item.querySelector(".accordion__panel");
        if (!trigger || !panel) return;
        panel.id = panel.id || "acc-panel-" + (i + 1);
        trigger.setAttribute("aria-controls", panel.id);
        if (item.getAttribute("data-open") === "true") { open(item); } else { close(item); }

        trigger.addEventListener("click", function () {
          var isOpen = item.getAttribute("data-open") === "true";
          if (single) items.forEach(close);
          if (isOpen) { close(item); } else { open(item); }
        });

        trigger.addEventListener("keydown", function (e) {
          var j = i;
          if (e.key === "ArrowDown") j = (i + 1) % items.length;
          else if (e.key === "ArrowUp") j = (i - 1 + items.length) % items.length;
          else if (e.key === "Home") j = 0;
          else if (e.key === "End") j = items.length - 1;
          else return;
          e.preventDefault();
          items[j].querySelector(".accordion__trigger").focus();
        });
      });
    });
  })();

  /* ---------- Gallery lightbox ---------- */
  (function lightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var closeBtn = box.querySelector(".lightbox__close");
    var lastFocus = null;

    function show(src, alt, text) {
      img.src = src;
      img.alt = alt;
      cap.textContent = text;
      lastFocus = document.activeElement;
      box.hidden = false;
      document.documentElement.style.overflow = "hidden";
      closeBtn.focus();
    }

    function hide() {
      box.hidden = true;
      document.documentElement.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    document.querySelectorAll("[data-lightbox]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var fig = btn.closest(".shot");
        var src = btn.getAttribute("data-full");
        if (!src) return;
        show(src, btn.getAttribute("data-alt") || "", btn.getAttribute("data-caption") || "");
        var media = fig ? fig.querySelector("img") : null;
        if (media && !reduced) media.style.transform = "scale(1.02)";
      });
    });

    closeBtn.addEventListener("click", hide);
    box.addEventListener("click", function (e) { if (e.target === box) hide(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) hide();
    });
  })();

  /* ---------- Forms: local validation + honest feedback ---------- */
  (function forms() {
    document.querySelectorAll("[data-form]").forEach(function (form) {
      var status = form.querySelector("[data-form-status]");

      function setError(input, message) {
        var field = input.closest(".field");
        var slot = field ? field.querySelector(".error") : null;
        if (slot) slot.textContent = message || "";
        input.setAttribute("aria-invalid", message ? "true" : "false");
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        var first = null;

        form.querySelectorAll("[required]").forEach(function (input) {
          var value = input.value ? input.value.trim() : "";
          var message = "";
          if (input.type === "checkbox") {
            if (!input.checked) message = "Please tick this box to continue.";
          } else if (!value) {
            message = "This field is required.";
          } else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
            message = "Enter a valid email address.";
          }
          setError(input, message);
          if (message && !first) first = input;
          if (message) ok = false;
        });

        if (!ok) {
          if (status) {
            status.hidden = false;
            status.setAttribute("data-tone", "error");
            status.textContent = "Check the highlighted fields and try again.";
          }
          if (first) first.focus();
          return;
        }

        var name = (form.querySelector("[data-name-field]") || {}).value || "";
        var success = form.getAttribute("data-success") || "Submitted.";
        if (status) {
          status.hidden = false;
          status.removeAttribute("data-tone");
          status.textContent = success.replace("{name}", name ? name.trim().split(" ")[0] : "there");
        }
        form.reset();
      });

      form.querySelectorAll("[required]").forEach(function (input) {
        input.addEventListener("blur", function () {
          if (input.value.trim()) setError(input, "");
        });
      });
    });
  })();

  /* ---------- Footer year ---------- */
  (function year() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  })();
})();
