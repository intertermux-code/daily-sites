/* Chapter & Verse — shared behaviour
   1. nav  2. 3D tilt  3. horizontal diorama  4. shelf filter + hold list
   5. signup validation  6. marquee cloning                                       */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- 1. nav */
  function initNav() {
    var toggle = $(".nav-toggle");
    if (!toggle) return;
    var nav = $(".primary-nav");
    toggle.addEventListener("click", function () {
      var open = document.body.dataset.nav === "open";
      document.body.dataset.nav = open ? "closed" : "open";
      toggle.setAttribute("aria-expanded", String(!open));
    });
    nav.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.dataset.nav === "open") {
        document.body.dataset.nav = "closed";
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960 && document.body.dataset.nav === "open") {
        document.body.dataset.nav = "closed";
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------------------------------------ 2. tilt */
  function initTilt() {
    var zones = $$("[data-tilt]");
    if (!zones.length || reduce.matches || !window.matchMedia("(hover: hover)").matches) return;

    var active = [];
    var MAX = 8;

    zones.forEach(function (zone) {
      var inner = $(".tilt__inner", zone);
      var glare = $(".tilt__glare", zone);
      if (!inner) return;
      var state = {
        zone: zone, inner: inner, glare: glare,
        tx: 0, ty: 0, cx: 0, cy: 0, gx: 50, gy: 50, tgx: 50, tgy: 50, on: false
      };

      zone.addEventListener("pointermove", function (e) {
        var r = zone.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        state.ty = (px - 0.5) * 2 * MAX;
        state.tx = (0.5 - py) * 2 * MAX;
        state.tgx = px * 100;
        state.tgy = py * 100;
        state.on = true;
        if (active.indexOf(state) === -1) active.push(state);
      });
      zone.addEventListener("pointerleave", function () {
        state.tx = 0; state.ty = 0; state.tgx = 50; state.tgy = 50;
      });
    });

    function lerp(a, b, n) { return a + (b - a) * n; }

    (function loop() {
      for (var i = active.length - 1; i >= 0; i--) {
        var s = active[i];
        s.cx = lerp(s.cx, s.tx, 0.14);
        s.cy = lerp(s.cy, s.ty, 0.14);
        s.gx = lerp(s.gx, s.tgx, 0.2);
        s.gy = lerp(s.gy, s.tgy, 0.2);
        s.inner.style.setProperty("--rx", s.cx.toFixed(2) + "deg");
        s.inner.style.setProperty("--ry", s.cy.toFixed(2) + "deg");
        s.glare.style.setProperty("--gx", s.gx.toFixed(1) + "%");
        s.glare.style.setProperty("--gy", s.gy.toFixed(1) + "%");
        var settled = Math.abs(s.cx) < 0.05 && Math.abs(s.cy) < 0.05 && !s.on;
        if (s.on || !settled) {
          s.zone.dataset.tiltActive = "true";
        } else {
          s.zone.dataset.tiltActive = "false";
          s.inner.style.removeProperty("--rx");
          s.inner.style.removeProperty("--ry");
          active.splice(i, 1);
          s.on = false;
        }
      }
      requestAnimationFrame(loop);
    })();
  }

  /* --------------------------------------------------- 3. diorama */
  function initDioramas() {
    $$("[data-diorama]").forEach(function (root) {
      var track = $(".diorama__track", root);
      var rail = $(".diorama__progress", root);
      var thumb = rail ? $("span", rail) : null;
      var prev = $("[data-diorama-prev]", root);
      var next = $("[data-diorama-next]", root);
      if (!track) return;
      var panels = $$(".exhibit, .chapter", track);

      function step() {
        if (panels.length > 1) {
          return panels[1].getBoundingClientRect().left - panels[0].getBoundingClientRect().left;
        }
        if (panels.length === 1) return panels[0].offsetWidth + 24;
        return Math.round(track.clientWidth * 0.65);
      }
      function maxScroll() { return Math.max(1, track.scrollWidth - track.clientWidth); }

      function sync() {
        var f = track.scrollLeft / maxScroll();
        if (rail && thumb) {
          var w = thumb.offsetWidth / rail.clientWidth || 0.26;
          thumb.style.setProperty("--progress", (f * (1 - w) / w * 100).toFixed(2) + "%");
        }
        if (prev) prev.disabled = track.scrollLeft < 4;
        if (next) next.disabled = track.scrollLeft > maxScroll() - 4;
        if (!reduce.matches) {
          var mid = track.getBoundingClientRect().left + track.clientWidth / 2;
          var best = -1, bestD = Infinity;
          panels.forEach(function (p, i) {
            var r = p.getBoundingClientRect();
            var d = Math.abs(r.left + r.width / 2 - mid);
            if (d < bestD) { bestD = d; best = i; }
          });
          panels.forEach(function (p, i) { p.dataset.active = i === best ? "true" : "false"; });
        }
      }

      var queued = false;
      track.addEventListener("scroll", function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; sync(); });
      });

      if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: reduce.matches ? "auto" : "smooth" }); });
      if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: reduce.matches ? "auto" : "smooth" }); });

      /* drag to pan, mouse only */
      var dragging = false, startX = 0, startLeft = 0, moved = 0;
      track.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        dragging = true; moved = 0;
        startX = e.clientX; startLeft = track.scrollLeft;
        track.dataset.dragging = "true";
      });
      window.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        moved = Math.abs(dx);
        track.scrollLeft = startLeft - dx;
      });
      window.addEventListener("pointerup", function () {
        if (!dragging) return;
        dragging = false;
        delete track.dataset.dragging;
      });
      track.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

      window.addEventListener("resize", sync);
      sync();
    });
  }

  /* ---------------------------------------------- 4. shelf + hold list */
  var HOLD_KEY = "cv-holds";
  function readHolds() {
    try { return JSON.parse(localStorage.getItem(HOLD_KEY)) || []; }
    catch (err) { return []; }
  }
  function writeHolds(list) {
    try { localStorage.setItem(HOLD_KEY, JSON.stringify(list)); } catch (err) { /* private mode */ }
    paintHoldCounts();
  }
  function paintHoldCounts() {
    var n = readHolds().length;
    $$("[data-hold-count]").forEach(function (el) { el.textContent = String(n); });
    $$("[data-hold-link]").forEach(function (el) { el.dataset.filled = n > 0 ? "true" : "false"; });
  }

  function initShelf() {
    var shelf = $("[data-shelf]");
    if (!shelf) return;

    var spines = $$(".spine", shelf);
    var chips = $$("[data-filter]");
    var status = $("[data-filter-status]");
    var focus = $("[data-focus]");
    var live = $("[data-live]");
    var holdStatus = $("[data-hold-status]");
    var holdBtn = $("[data-hold-add]");
    var current = "all";

    function apply(genre) {
      current = genre;
      var shown = 0;
      spines.forEach(function (s) {
        var match = genre === "all" || s.dataset.genre === genre;
        if (match) shown++;
        s.hidden = !match;
      });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.filter === genre)); });
      if (status) status.innerHTML = "<b>" + shown + "</b> of " + spines.length + " titles";
      if (live) live.textContent = "Showing " + shown + " " + (genre === "all" ? "titles across every room" : "titles in " + genre) + ".";
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { apply(chip.dataset.filter); });
    });

    function fill(s) {
      if (!focus) return;
      $$("[data-field]", focus).forEach(function (el) {
        var raw = el.dataset.field;
        var key = raw.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
        if (key === "cover") { el.textContent = s.dataset.title; return; }
        if (key === "authorShort") { el.textContent = s.dataset.author; return; }
        el.textContent = s.dataset[key] || "";
      });
      var cover = $("[data-cover]", focus);
      if (cover) cover.className = "focus-cover cloth-" + s.dataset.cloth;
      focus.dataset.shown = s.dataset.title;
    }

    spines.forEach(function (s) {
      s.addEventListener("click", function () {
        spines.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        s.setAttribute("aria-pressed", "true");
        fill(s);
        if (live) live.textContent = s.dataset.title + " by " + s.dataset.author + ", " + s.dataset.year + ". Now on the reading table.";
      });
    });

    function paintHolds() {
      if (!holdStatus) return;
      var list = readHolds();
      if (!list.length) {
        holdStatus.innerHTML = '<span class="mono-label">Hold shelf is empty</span><span>Reserve a copy and we will keep it behind the counter for seven days.</span>';
        return;
      }
      holdStatus.textContent = "";
      var label = document.createElement("span");
      label.className = "mono-label";
      label.textContent = "Your hold shelf";
      holdStatus.appendChild(label);
      list.forEach(function (t) {
        var tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = t;
        holdStatus.appendChild(tag);
      });
    }

    if (holdBtn && focus) {
      holdBtn.addEventListener("click", function () {
        var title = focus.dataset.shown;
        if (!title) return;
        var list = readHolds();
        if (list.indexOf(title) === -1) {
          list.push(title);
          writeHolds(list);
          paintHolds();
          if (live) live.textContent = title + " added to your hold shelf.";
        } else {
          if (live) live.textContent = title + " is already on your hold shelf.";
        }
      });
    }

    var clear = $("[data-hold-clear]");
    if (clear) {
      clear.addEventListener("click", function () {
        writeHolds([]);
        paintHolds();
        if (live) live.textContent = "Hold shelf cleared.";
      });
    }

    apply("all");
    if (spines.length) {
      spines[0].setAttribute("aria-pressed", "true");
      fill(spines[0]);
    }
    paintHolds();
    paintHoldCounts();
  }

  /* ------------------------------------------------- 5. signup form */
  function initForm() {
    var form = $("[data-validate]");
    if (!form) return;
    var summary = $("[data-error-summary]", form.parentNode);
    var success = $("[data-success]");

    function fields() {
      return $$("input, select, textarea", form).filter(function (el) {
        return !el.disabled && el.type !== "hidden" && el.type !== "submit" && el.type !== "button";
      });
    }
    function mark(el, msg) {
      var wrap = el.closest(".field") || el.closest(".fieldset");
      if (!wrap) return;
      wrap.dataset.invalid = msg ? "true" : "false";
      var out = $(".field__error", wrap);
      if (out) out.textContent = msg || "";
    }
    function check(el) {
      var label = $("label", el.closest(".field") || el.closest(".fieldset"));
      var name = label ? label.textContent.trim() : el.name;
      if (el.type === "email") {
        if (!el.value.trim()) return name + " is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) return name + " needs a full address, like you@example.com.";
      }
      if (el.type === "tel" && el.value.trim()) {
        var digits = el.value.replace(/\D/g, "");
        if (digits.length < 7) return name + " looks too short — include the area code.";
      }
      if (el.hasAttribute("required") && el.type !== "email") {
        if (el.tagName === "SELECT" && !el.value) return name + " is required.";
        if (!el.value.trim()) return name + " is required.";
      }
      if (el.dataset.group) {
        var group = $$('[name="' + el.name + '"]', form);
        if (group[0] !== el) return "";
        if (group.some(function (g) { return g.checked; })) return "";
        var box = el.closest(".fieldset");
        var legend = box ? $(".fieldset__legend", box) : null;
        return (legend ? legend.textContent.trim() : name) + " — choose one to continue.";
      }
      return "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errs = [];
      fields().forEach(function (el) {
        var msg = check(el);
        mark(el, msg);
        if (msg) {
          var anchor = el.closest(".field") || el.closest(".fieldset");
          errs.push({ msg: msg, id: anchor ? anchor.getAttribute("data-anchor") : null, el: el });
        }
      });

      if (errs.length) {
        if (summary) {
          summary.innerHTML = "<h2>Nothing sent yet — " + errs.length +
            (errs.length === 1 ? " detail" : " details") + " need" + (errs.length === 1 ? "s" : "") + " attention.</h2><ul>" +
            errs.map(function (x) { return "<li>" + x.msg + "</li>"; }).join("") + "</ul>";
          summary.setAttribute("tabindex", "-1");
          summary.focus();
        }
        if (errs[0].el && errs[0].el.focus) errs[0].el.focus();
        return;
      }

      if (summary) summary.innerHTML = "";
      form.hidden = true;
      if (success) {
        success.hidden = false;
        var name = $("[data-first-name]", form);
        var slot = $("[data-success-name]", success);
        if (slot && name) slot.textContent = name.value.trim() || "friend";
        var club = $("input[name='club']:checked", form);
        var clubOut = $("[data-success-club]", success);
        if (clubOut && club) clubOut.textContent = club.closest(".radio-card") ? $("h4", club.closest(".radio-card")).textContent : club.value;
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });

    $$("input, select, textarea", form).forEach(function (el) {
      el.addEventListener("blur", function () { mark(el, el.value || el.checked ? "" : check(el)); });
      el.addEventListener("input", function () { mark(el, ""); });
    });
  }

  /* ------------------------------------------------- 6. marquee clone */
  function initTicker() {
    $$("[data-ticker]").forEach(function (t) {
      var track = $(".ticker__track", t);
      if (!track || track.dataset.cloned) return;
      var group = $(".ticker__group", track);
      if (!group) return;
      var clone = group.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
      track.dataset.cloned = "true";
    });
  }

  /* --------------------------------------------------- 7. year stamp */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  function boot() {
    initNav();
    initTilt();
    initDioramas();
    initTicker();
    initShelf();
    initForm();
    paintHoldCounts();
    initYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
