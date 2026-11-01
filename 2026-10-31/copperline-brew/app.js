/* ============================================================
   Copperline Brewing Co. — shared behaviour
   Signature motion: Magnetic Elements + Cursor Spotlight
   Everything else is guarded by element-existence checks so one
   file can serve every page.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ---------- 1. Sticky header state ---------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("primary-nav");

    var onScroll = function () {
      header.setAttribute("data-stuck", window.scrollY > 12 ? "true" : "false");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      nav.setAttribute("data-open", String(!open));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.setAttribute("data-open", "false");
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- 2. Footer year ---------- */
  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = year;
  }

  /* ---------- 3. MAGNETIC ELEMENTS ----------
     Primary buttons drift toward the cursor inside a 120px radius,
     scale up to 1.04 at the closest approach, spring back on leave. */
  function initMagnets() {
    if (reduced.matches || !pointerFine.matches) return;
    var magnets = Array.prototype.slice.call(document.querySelectorAll(".btn--magnetic"));
    if (!magnets.length) return;

    var RADIUS = 120;
    var targets = magnets;
    var raf = null;
    var ticking = false;
    var pending = null;

    function snap(el) {
      var m = el.__mag;
      m.tx = 0;
      m.ty = 0;
      m.ts = 1;
    }

    function measure(el) {
      var r = el.getBoundingClientRect();
      el.__rect = { l: r.left, t: r.top, w: r.width, h: r.height };
    }

    function loop() {
      var moving = false;
      for (var i = 0; i < targets.length; i++) {
        var el = targets[i];
        var m = el.__mag;
        var nx = m.x + (m.tx - m.x) * 0.16;
        var ny = m.y + (m.ty - m.y) * 0.16;
        var ns = m.s + (m.ts - m.s) * 0.16;
        var settled = Math.abs(nx - m.tx) < 0.06 && Math.abs(ny - m.ty) < 0.06 &&
          Math.abs(ns - m.ts) < 0.0008;
        if (settled) {
          nx = m.tx; ny = m.ty; ns = m.ts;
        } else {
          moving = true;
        }
        m.x = nx; m.y = ny; m.s = ns;
        el.style.setProperty("--mag-x", nx.toFixed(2) + "px");
        el.style.setProperty("--mag-y", ny.toFixed(2) + "px");
        el.style.setProperty("--mag-s", ns.toFixed(4));
      }
      raf = moving ? requestAnimationFrame(loop) : null;
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(loop);
    }

    magnets.forEach(function (el) {
      el.__mag = { x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1 };
      measure(el);
    });

    window.addEventListener("resize", function () {
      magnets.forEach(measure);
      kick();
    }, { passive: true });
    window.addEventListener("scroll", function () {
      magnets.forEach(measure);
    }, { passive: true });

    document.addEventListener("pointermove", function (event) {
      pending = event;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        apply(pending);
      });
    }, { passive: true });

    function apply(event) {
      if (!event) return;
      var px = event.clientX;
      var py = event.clientY;
      var any = false;

      for (var i = 0; i < targets.length; i++) {
        var el = targets[i];
        var m = el.__mag;
        var r = el.__rect || (measure(el), el.__rect);
        var cx = r.l + r.w / 2;
        var cy = r.t + r.h / 2;
        var dx = px - cx;
        var dy = py - cy;
        var dist = Math.hypot(dx, dy);
        var reach = RADIUS + Math.max(r.w, r.h) / 2;

        if (dist > reach) {
          if (m.tx !== 0 || m.ty !== 0 || m.ts !== 1) snap(el);
          continue;
        }

        var near = 1 - Math.min(dist / reach, 1); /* 0 → edge, 1 → dead centre */
        var pull = Math.min(Math.max(near, 0), 1);
        var maxShift = 14;
        m.tx = -dx * 0.18 * pull;
        m.ty = -dy * 0.22 * pull;
        /* clamp so the button never escapes its own footprint */
        m.tx = Math.max(-maxShift, Math.min(maxShift, m.tx));
        m.ty = Math.max(-maxShift, Math.min(maxShift, m.ty));
        m.ts = 1 + 0.04 * pull;
        any = true;
      }
      if (any || targets.length) kick();
    }

    magnets.forEach(function (el) {
      el.addEventListener("pointerleave", function () {
        snap(el);
        kick();
      });
      el.addEventListener("blur", function () {
        snap(el);
        kick();
      });
    });
  }

  /* ---------- 4. CURSOR SPOTLIGHT ----------
     Radial glow tracks the pointer across hero surfaces. rAF-throttled. */
  function initSpotlight() {
    var zones = document.querySelectorAll("[data-spotlight]");
    if (!zones.length) return;
    if (reduced.matches || !pointerFine.matches) return;

    var frame = null;
    var last = null;

    zones.forEach(function (zone) {
      zone.style.setProperty("--spot-x", "50%");
      zone.style.setProperty("--spot-y", "32%");
    });

    document.addEventListener("pointermove", function (event) {
      last = event;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = null;
        if (!last) return;
        for (var i = 0; i < zones.length; i++) {
          var zone = zones[i];
          var r = zone.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) continue;
          zone.style.setProperty("--spot-x", ((last.clientX - r.left) / r.width * 100).toFixed(2) + "%");
          zone.style.setProperty("--spot-y", ((last.clientY - r.top) / r.height * 100).toFixed(2) + "%");
        }
      });
    }, { passive: true });
  }

  /* ---------- 5. Mosaic settle ---------- */
  function initMosaic() {
    var tiles = document.querySelectorAll("[data-tile]");
    if (!tiles.length) return;
    if (reduced.matches || !("IntersectionObserver" in window)) {
      for (var i = 0; i < tiles.length; i++) tiles[i].classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    for (var t = 0; t < tiles.length; t++) io.observe(tiles[t]);
  }

  /* ---------- 6. Modal plumbing (age gate + beer detail) ---------- */
  var lastFocused = null;

  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.setAttribute("data-modal-open", "true");
    var focusables = modal.querySelectorAll("button, a[href], input, select, textarea");
    if (focusables.length) focusables[0].focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.removeAttribute("data-modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function trapTab(modal, event) {
    if (event.key !== "Tab") return;
    var list = modal.querySelectorAll("button, a[href], input, select, textarea");
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function wireModal(modal) {
    modal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal(modal);
      trapTab(modal, event);
    });
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal(modal);
      if (event.target.closest("[data-close-modal]")) closeModal(modal);
    });
  }

  /* ---------- 7. Age gate (index only) ---------- */
  function initAgeGate() {
    var modal = document.getElementById("age-gate");
    if (!modal) return;
    wireModal(modal);
    var yes = document.getElementById("age-yes");
    var seen = false;
    try {
      seen = window.localStorage.getItem("copperline:age-ok") === "yes";
    } catch (e) {
      seen = false;
    }

    if (!seen) {
      openModal(modal);
      modal.setAttribute("data-trap", "true");
    }

    if (yes) {
      yes.addEventListener("click", function () {
        try {
          window.localStorage.setItem("copperline:age-ok", "yes");
        } catch (e) { /* private mode — gate simply closes */ }
        closeModal(modal);
      });
    }

    /* keep the gate in front while it is open */
    document.addEventListener("keydown", function (event) {
      if (!modal.hidden && event.key === "Tab") trapTab(modal, event);
    });
  }

  /* ---------- 8. Beer grid: filters + detail modal (beers.html) ---------- */
  function initBeers() {
    var grid = document.getElementById("beer-grid");
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".beer"));

    var filters = document.querySelector("[data-beer-filters]");
    if (filters) {
      filters.addEventListener("click", function (event) {
        var chip = event.target.closest("[data-filter]");
        if (!chip) return;
        var chips = filters.querySelectorAll("[data-filter]");
        for (var c = 0; c < chips.length; c++) chips[c].setAttribute("aria-pressed", "false");
        chip.setAttribute("aria-pressed", "true");
        var want = chip.getAttribute("data-filter");
        var shown = 0;
        cards.forEach(function (card) {
          var match = want === "all" || card.getAttribute("data-family") === want;
          card.setAttribute("data-hidden", match ? "false" : "true");
          if (match) shown++;
        });
        var count = document.getElementById("beer-count");
        if (count) count.textContent = shown === 1 ? "1 beer" : shown + " beers";
      });
    }

    var modal = document.getElementById("beer-modal");
    if (!modal) return;
    wireModal(modal);

    var out = {
      img: modal.querySelector("[data-beer-img]"),
      title: modal.querySelector("[data-beer-title]"),
      style: modal.querySelector("[data-beer-style]"),
      abv: modal.querySelector("[data-beer-abv]"),
      ibu: modal.querySelector("[data-beer-ibu]"),
      srm: modal.querySelector("[data-beer-srm]"),
      body: modal.querySelector("[data-beer-body]"),
      pours: modal.querySelector("[data-beer-pours]"),
      pairing: modal.querySelector("[data-beer-pairing]"),
      tags: modal.querySelector("[data-beer-tags]")
    };

    cards.forEach(function (card) {
      var btn = card.querySelector("[data-open-beer]");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var d = card.dataset;
        if (out.img) {
          out.img.src = d.img;
          out.img.alt = d.imgAlt || d.title + " poured at the Copperline taproom";
        }
        if (out.title) out.title.textContent = d.title;
        if (out.style) out.style.textContent = d.style;
        if (out.abv) out.abv.textContent = d.abv;
        if (out.ibu) out.ibu.textContent = d.ibu;
        if (out.srm) out.srm.textContent = d.srm;
        if (out.body) out.body.textContent = d.story || d.note;
        if (out.pours) out.pours.textContent = d.pours || "Poured on tap · 16 oz pint, 10 oz sampler";
        if (out.pairing) out.pairing.textContent = d.pairing || "Ask the bartender what's on the plancha.";
        if (out.tags && d.tags) {
          out.tags.textContent = "";
          d.tags.split(",").forEach(function (label) {
            var span = document.createElement("span");
            span.className = "tag";
            span.textContent = label.trim();
            out.tags.appendChild(span);
          });
        }
        openModal(modal);
      });
    });
  }

  /* ---------- 9. Forms: local confirmation ---------- */
  function initForms() {
    var forms = document.querySelectorAll("[data-form]");
    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = form.querySelector("input[type='email']");
        if (email && !email.checkValidity()) {
          email.reportValidity();
          return;
        }
        var status = form.querySelector(".form-status");
        if (status) {
          var control = form.querySelector("input, select, textarea");
          if (form.getAttribute("data-form") === "newsletter" && control) control.value = "";
          status.hidden = false;
        }
      });
    });
  }

  /* ---------- 10. Today's hours highlight (visit.html) ---------- */
  function initHours() {
    var table = document.querySelector("[data-hours-table]");
    if (!table) return;
    var idx = new Date().getDay(); /* 0 = Sunday */
    var order = [0, 1, 2, 3, 4, 5, 6];
    var rows = table.querySelectorAll("tbody tr");
    for (var r = 0; r < rows.length; r++) {
      var day = Number(rows[r].getAttribute("data-day"));
      if (day === order[idx]) {
        rows[r].setAttribute("data-today", "true");
        var mark = rows[r].querySelector("[data-today-mark]");
        if (mark) mark.textContent = " · Today";
      }
    }
  }

  function init() {
    initHeader();
    initYear();
    initMagnets();
    initSpotlight();
    initMosaic();
    initAgeGate();
    initBeers();
    initForms();
    initHours();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
