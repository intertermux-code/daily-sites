/* =========================================================
   Pulseboard — shared behaviour
   Signature motion 1: Magnetic Elements (rAF lerp)
   Signature motion 2: 3D Card Tilt (rAF lerp + glare)
   Structural motion:  Split Dialogue stage sync (IntersectionObserver)
   Everything is guarded by element-existence checks so one file
   serves all pages.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var doc = document;

  /* ---------------------------------------------------------
     1. Sticky header elevation
     --------------------------------------------------------- */
  function initHeaderElevation() {
    var header = doc.querySelector(".site-header");
    if (!header) return;

    var ticking = false;
    function apply() {
      header.classList.toggle("is-elevated", window.scrollY > 12);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(apply);
      },
      { passive: true }
    );
    apply();
  }

  /* ---------------------------------------------------------
     2. Mobile navigation
     --------------------------------------------------------- */
  function initNav() {
    var toggle = doc.querySelector(".nav-toggle");
    var nav = doc.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      var label = open ? "Close main menu" : "Open main menu";
      toggle.setAttribute("aria-label", label);
      doc.body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    doc.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (e.target.closest(".primary-nav") || e.target.closest(".nav-toggle")) return;
      setOpen(false);
    });

    var mq = window.matchMedia("(min-width: 1024px)");
    function onChange(e) {
      if (e.matches) setOpen(false);
    }
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
  }

  /* ---------------------------------------------------------
     3. MAGNETIC ELEMENTS
     Primary buttons drift toward the cursor inside a 120px
     radius, scale up to 1.04 at closest approach, and spring
     back on leave. Position-only: transform, never layout.
     --------------------------------------------------------- */
  function initMagnets() {
    var magnets = Array.prototype.slice.call(doc.querySelectorAll("[data-magnetic]"));
    if (!magnets.length || reduceMotion.matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var RADIUS = 120;
    var pointer = { x: -9999, y: -9999 };
    var running = false;
    var rafId = null;

    var items = magnets.map(function (el) {
      return {
        el: el,
        // per-element pull strength so small buttons feel lighter
        pull: parseFloat(el.getAttribute("data-magnetic")) || 0.32,
        cx: 0,
        cy: 0,
        tx: 0,
        ty: 0,
        scale: 1,
        tscale: 1,
        // keyboard focus response, multiplied into the pointer-driven scale
        boost: 1,
      };
    });

    function measure(item) {
      var r = item.el.getBoundingClientRect();
      item.rect = r;
      item.midX = r.left + r.width / 2;
      item.midY = r.top + r.height / 2;
      // how close the cursor must be before the pull starts
      item.reach = Math.max(r.width, r.height) / 2 + RADIUS;
    }

    function frame() {
      var settled = true;

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.rect) measure(it);

        var dx = pointer.x - it.midX;
        var dy = pointer.y - it.midY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < it.reach) {
          // 1 at the edge of the button, 0 at the limit of the radius
          var falloff = 1 - Math.min(1, Math.max(0, dist - it.rect.width / 2) / RADIUS);
          var room = RADIUS * 0.5;
          it.tx = clamp(dx * 0.42, -room, room) * falloff * it.pull * 3;
          it.ty = clamp(dy * 0.42, -room, room) * falloff * it.pull * 3;
          it.tscale = (1 + 0.04 * falloff) * it.boost;
          settled = false;
        } else {
          it.tx = 0;
          it.ty = 0;
          it.tscale = it.boost;
        }

        // spring-y lerp
        it.cx += (it.tx - it.cx) * 0.16;
        it.cy += (it.ty - it.cy) * 0.16;
        it.scale += (it.tscale - it.scale) * 0.14;

        var moved =
          Math.abs(it.tx - it.cx) > 0.05 ||
          Math.abs(it.ty - it.cy) > 0.05 ||
          Math.abs(it.tscale - it.scale) > 0.0005;

        if (moved) settled = false;

        it.el.style.transform =
          "translate3d(" + it.cx.toFixed(2) + "px," + it.cy.toFixed(2) + "px,0) scale(" +
          it.scale.toFixed(4) + ")";
      }

      if (settled) {
        // park resting buttons with no inline transform at all
        for (var j = 0; j < items.length; j++) {
          var rest = items[j];
          if (rest.tx === 0 && rest.ty === 0 && rest.tscale === 1) {
            rest.cx = 0;
            rest.cy = 0;
            rest.scale = 1;
            rest.el.style.removeProperty("transform");
          }
        }
        running = false;
        return;
      }
      rafId = requestAnimationFrame(frame);
    }

    function kick() {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(frame);
      }
    }

    window.addEventListener(
      "pointermove",
      function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        kick();
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerleave",
      function () {
        pointer.x = -9999;
        pointer.y = -9999;
        kick();
      },
      { passive: true }
    );

    window.addEventListener("scroll", function () {
      for (var i = 0; i < items.length; i++) items[i].rect = null;
      kick();
    }, { passive: true });

    window.addEventListener("resize", function () {
      for (var i = 0; i < items.length; i++) items[i].rect = null;
      kick();
    });

    // keyboard users get a tiny, non-tracking press response
    items.forEach(function (it) {
      it.el.addEventListener("focus", function () {
        it.boost = 1.02;
        kick();
      });
      it.el.addEventListener("blur", function () {
        it.boost = 1;
        kick();
      });
    });

    kick();
  }

  /* ---------------------------------------------------------
     4. SPRING ACCORDION — ledger rows
     Expansion animates grid-template-rows 0fr -> 1fr; the
     chevron rotates 180deg. One panel open per group.
     --------------------------------------------------------- */
  function initLedgers() {
    var groups = doc.querySelectorAll("[data-ledger]");
    if (!groups.length) return;

    Array.prototype.forEach.call(groups, function (group) {
      var rows = group.querySelectorAll(".ledger__row");
      var exclusive = group.getAttribute("data-ledger") !== "multi";

      Array.prototype.forEach.call(rows, function (row) {
        var btn = row.querySelector(".ledger__row-toggle");
        var panel = row.querySelector(".ledger__panel");
        if (!btn || !panel) return;

        var pid = panel.id || "ledger-panel-" + Math.random().toString(36).slice(2, 8);
        panel.id = pid;
        btn.setAttribute("aria-controls", pid);
        btn.setAttribute("aria-expanded", row.classList.contains("is-open") ? "true" : "false");

        btn.addEventListener("click", function () {
          var willOpen = !row.classList.contains("is-open");

          if (exclusive && willOpen) {
            Array.prototype.forEach.call(rows, function (other) {
              if (other === row) return;
              other.classList.remove("is-open");
              var ob = other.querySelector(".ledger__row-toggle");
              if (ob) ob.setAttribute("aria-expanded", "false");
            });
          }

          row.classList.toggle("is-open", willOpen);
          btn.setAttribute("aria-expanded", String(willOpen));
        });
      });
    });
  }

  /* ---------------------------------------------------------
     5. Animated counters
     --------------------------------------------------------- */
  function initCounters() {
    var nodes = doc.querySelectorAll("[data-count-to]");
    if (!nodes.length) return;

    function format(value, decimals) {
      var s = value.toFixed(decimals);
      var parts = s.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }

    function run(el) {
      var to = parseFloat(el.getAttribute("data-count-to"));
      var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      var duration = parseInt(el.getAttribute("data-count-duration") || "1500", 10);

      if (reduceMotion.matches) {
        el.textContent = format(to, decimals);
        return;
      }

      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        // ease-out cubic so the last digits settle slowly
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(to * eased, decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = format(to, decimals);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, run);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4, rootMargin: "0px 0px -40px 0px" }
    );

    Array.prototype.forEach.call(nodes, function (n) {
      n.textContent = "0";
      io.observe(n);
    });
  }

  /* ---------------------------------------------------------
     6. Scroll reveals (opacity + transform only)
     --------------------------------------------------------- */
  function initReveals() {
    var items = doc.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    Array.prototype.forEach.call(items, function (el, i) {
      // stagger siblings that share a parent
      var parent = el.parentElement;
      var idx = Array.prototype.indexOf.call(parent.querySelectorAll(":scope > .reveal"), el);
      if (idx > 0) el.style.setProperty("--rd", Math.min(idx, 6) * 70 + "ms");
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------
     7. Pricing: monthly / yearly toggle
     --------------------------------------------------------- */
  function initPricing() {
    var root = doc.querySelector("[data-pricing]");
    if (!root) return;

    var buttons = root.querySelectorAll("[data-cycle]");
    var thumb = root.querySelector(".seg__thumb");
    var prices = root.querySelectorAll("[data-monthly]");
    var yearlyNote = root.querySelector("[data-yearly-note]");
    var cycle = "monthly";

    function positionThumb(active) {
      if (!thumb || !active) return;
      thumb.style.width = active.offsetWidth + "px";
      thumb.style.transform = "translateX(" + (active.offsetLeft - 5) + "px)";
    }

    function apply(next, active) {
      cycle = next;

      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute("aria-pressed", String(b === active));
      });

      Array.prototype.forEach.call(prices, function (el) {
        var amount = cycle === "yearly" ? el.getAttribute("data-yearly") : el.getAttribute("data-monthly");
        el.textContent = amount;
        var per = el.parentElement.querySelector(".per");
        if (per) per.textContent = cycle === "yearly" ? "/mo, billed yearly" : "/month";
      });

      if (yearlyNote) {
        yearlyNote.textContent =
          cycle === "yearly"
            ? "Yearly billing is charged once, 12 months up front."
            : "Monthly billing is charged on the 1st of each month.";
      }

      root.setAttribute("data-billing", cycle);
      positionThumb(active);
    }

    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener("click", function () {
        if (b.getAttribute("aria-pressed") === "true") return;
        apply(b.getAttribute("data-cycle"), b);
      });
    });

    var initial = root.querySelector('[data-cycle="' + cycle + '"]');
    apply(cycle, initial);

    window.addEventListener("resize", function () {
      var active = root.querySelector('[aria-pressed="true"]');
      positionThumb(active);
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     8. Demo request form validation
     --------------------------------------------------------- */
  function initForm() {
    var form = doc.querySelector("[data-demo-form]");
    if (!form) return;

    var status = doc.getElementById("form-status");
    var submit = form.querySelector("[type=submit]");

    var rules = {
      name: {
        test: function (v) { return v.trim().length >= 2; },
        message: "Enter your full name so we know who we are meeting.",
      },
      email: {
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); },
        message: "Enter a valid work email, for example ana@northwind.com.",
      },
      company: {
        test: function (v) { return v.trim().length >= 2; },
        message: "Tell us which company you are reporting for.",
      },
      seats: {
        test: function (v) { return v !== ""; },
        message: "Choose the size of your team.",
      },
      source: {
        test: function (v) { return v !== ""; },
        message: "Pick the area you want us to focus the demo on.",
      },
      message: {
        test: function (v) { return v.trim().length >= 12; },
        message: "Add at least one full sentence about your stack.",
      },
    };

    function fieldWrap(input) {
      return input.closest(".field");
    }

    function setError(input, message) {
      var wrap = fieldWrap(input);
      if (!wrap) return;
      var box = wrap.querySelector(".field__error");
      wrap.classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (box) {
        box.textContent = message || "";
        if (message) input.setAttribute("aria-describedby", box.id);
        else input.removeAttribute("aria-describedby");
      }
    }

    function validate(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var ok = rule.test(input.value);
      setError(input, ok ? "" : rule.message);
      return ok;
    }

    Array.prototype.forEach.call(form.elements, function (input) {
      if (!input.name || !rules[input.name]) return;
      input.addEventListener("blur", function () {
        if (input.value !== "") validate(input);
      });
      input.addEventListener("input", function () {
        var wrap = fieldWrap(input);
        if (wrap && wrap.classList.contains("is-invalid")) validate(input);
      });
    });

    function showStatus(kind, text) {
      if (!status) return;
      status.className = "form-status is-visible is-" + kind;
      status.textContent = text;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var inputs = [];
      Array.prototype.forEach.call(form.elements, function (input) {
        if (input.name && rules[input.name]) inputs.push(input);
      });

      var bad = inputs.filter(function (input) { return !validate(input); });

      if (bad.length) {
        showStatus(
          "error",
          bad.length === 1
            ? "One field still needs attention. We highlighted it below."
            : bad.length + " fields still need attention. We highlighted them below."
        );
        bad[0].focus();
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.dataset.label = submit.textContent.trim();
        submit.textContent = "Sending request…";
      }

      // static site: confirm locally rather than posting anywhere
      window.setTimeout(function () {
        var name = (form.querySelector('[name="name"]') || {}).value || "";
        var first = name.trim().split(/\s+/)[0] || "there";
        showStatus(
          "success",
          "Thanks, " + first + ". Your demo request is queued — a Pulseboard analyst replies within one business day."
        );
        form.reset();
        Array.prototype.forEach.call(form.querySelectorAll(".field"), function (f) {
          f.classList.remove("is-invalid");
        });
        if (submit) {
          submit.disabled = false;
          submit.textContent = submit.dataset.label || "Request demo";
        }
        if (status) status.focus();
      }, 700);
    });
  }

  /* ---------------------------------------------------------
     9. Mockup row shimmer — opacity only
     --------------------------------------------------------- */
  function initMockTicker() {
    var rows = doc.querySelectorAll("[data-mock-ticker] .mock__row");
    if (!rows.length || reduceMotion.matches) return;

    var i = 0;
    window.setInterval(function () {
      Array.prototype.forEach.call(rows, function (r) {
        r.classList.remove("is-flash");
      });
      rows[i % rows.length].classList.add("is-flash");
      i += 1;
    }, 2600);
  }

  /* ---------------------------------------------------------
     10. 3D CARD TILT
     Cards rotate up to 8deg toward the cursor with a lerped
     spring, a glare highlight tracks the pointer, and the
     surface resets flat on leave.
     --------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion.matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var nodes = doc.querySelectorAll(
      ".card, .plan, .person, .quote, .media-frame, .stage__frame"
    );
    if (!nodes.length) return;

    var MAX = 8; // degrees
    var PERSPECTIVE = 900;
    var items = [];

    Array.prototype.forEach.call(nodes, function (el) {
      var glare = doc.createElement("span");
      glare.className = "tilt-glare";
      glare.setAttribute("aria-hidden", "true");
      el.appendChild(glare);
      el.classList.add("tilt");
      items.push({
        el: el,
        glare: glare,
        rx: 0,
        ry: 0,
        trx: 0,
        try_: 0,
        lift: 0,
        tlift: 0,
        gx: 50,
        gy: 50,
        tgx: 50,
        tgy: 50,
        raf: null,
        active: false,
      });
    });

    function liftOf(item) {
      var v = getComputedStyle(item.el).getPropertyValue("--tilt-lift");
      return parseFloat(v) || 0;
    }

    function frame(item) {
      item.rx += (item.trx - item.rx) * 0.14;
      item.ry += (item.try_ - item.ry) * 0.14;
      item.gx += (item.tgx - item.gx) * 0.16;
      item.gy += (item.tgy - item.gy) * 0.16;
      item.lift += (item.tlift - item.lift) * 0.16;

      var settled =
        Math.abs(item.trx - item.rx) < 0.02 &&
        Math.abs(item.try_ - item.ry) < 0.02 &&
        Math.abs(item.tlift - item.lift) < 0.05;

      if (settled && !item.active) {
        item.el.style.removeProperty("transform");
        item.el.classList.remove("is-tilting");
        item.raf = null;
        return;
      }

      item.el.style.transform =
        "perspective(" + PERSPECTIVE + "px) " +
        "rotateX(" + item.rx.toFixed(2) + "deg) " +
        "rotateY(" + item.ry.toFixed(2) + "deg) " +
        "translate3d(0," + item.lift.toFixed(2) + "px,0)";
      item.glare.style.setProperty("--gx", item.gx.toFixed(1) + "%");
      item.glare.style.setProperty("--gy", item.gy.toFixed(1) + "%");
      item.raf = requestAnimationFrame(function () {
        frame(item);
      });
    }

    function kick(item) {
      if (!item.raf) item.raf = requestAnimationFrame(function () { frame(item); });
    }

    items.forEach(function (item) {
      item.el.addEventListener("pointerenter", function () {
        // never fight the scroll-reveal transform before it has settled
        if (item.el.classList.contains("reveal") && !item.el.classList.contains("is-in")) return;
        item.active = true;
        item.tlift = liftOf(item);
        item.el.classList.add("is-tilting");
        kick(item);
      });

      item.el.addEventListener("pointermove", function (e) {
        if (!item.active) return;
        var r = item.el.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        item.try_ = clamp(nx * MAX * 2, -MAX, MAX);
        item.trx = clamp(-ny * MAX * 2, -MAX, MAX);
        item.tgx = (nx + 0.5) * 100;
        item.tgy = (ny + 0.5) * 100;
        kick(item);
      });

      item.el.addEventListener("pointerleave", function () {
        item.active = false;
        item.trx = 0;
        item.try_ = 0;
        item.tlift = 0;
        item.tgx = 50;
        item.tgy = 50;
        item.el.classList.remove("is-tilting");
        kick(item);
      });
    });
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /* ---------------------------------------------------------
     11. Split Dialogue — the sticky stage follows the chapter
     --------------------------------------------------------- */
  function initDialogue() {
    var root = doc.querySelector("[data-dialogue]");
    if (!root || !("IntersectionObserver" in window)) return;

    var chapters = root.querySelectorAll("[data-chapter]");
    var figs = root.querySelectorAll("[data-stage]");
    var links = root.querySelectorAll("[data-stage-link]");
    if (!chapters.length || !figs.length) return;

    var current = -1;

    function show(index) {
      if (index === current) return;
      current = index;
      Array.prototype.forEach.call(figs, function (f) {
        f.classList.toggle("is-on", +f.getAttribute("data-stage") === index);
      });
      Array.prototype.forEach.call(links, function (l) {
        l.classList.toggle("is-on", +l.getAttribute("data-stage-link") === index);
      });
    }

    function measure() {
      var best = 0;
      var bestDist = Infinity;
      var mid = window.innerHeight / 2;
      Array.prototype.forEach.call(chapters, function (c) {
        var r = c.getBoundingClientRect();
        var centre = r.top + r.height / 2;
        var d = Math.abs(centre - mid);
        if (d < bestDist) {
          bestDist = d;
          best = +c.getAttribute("data-chapter");
        }
      });
      show(best);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        measure();
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();

    // keep the stage honest when a reader jumps straight to an anchor
    if (location.hash) {
      var target = doc.querySelector(location.hash);
      if (target && target.hasAttribute("data-chapter")) show(+target.getAttribute("data-chapter"));
    }
  }


  /* ---------------------------------------------------------
     12. Footer year
     --------------------------------------------------------- */
  function initYear() {
    var slots = doc.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(slots, function (el) {
      el.textContent = y;
    });
  }

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */
  function boot() {
    initHeaderElevation();
    initNav();
    initMagnets();
    initLedgers();
    initCounters();
    initReveals();
    initPricing();
    initForm();
    initTilt();
    initMockTicker();
    initDialogue();
    initYear();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
