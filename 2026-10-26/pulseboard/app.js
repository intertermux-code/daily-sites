/* =========================================================
   Pulseboard — shared behaviour
   Signature motion: 3D card tilt (primary), spring accordion (secondary)
   Structural motion: horizontal diorama (pinned on desktop, stacked otherwise)
   ========================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var canMotion = function () { return !reduced.matches; };

  /* ---------- 1. Header state ---------- */
  var header = document.querySelector("[data-site-header]");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* ---------- 2. Mobile navigation ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  if (navToggle && header) {
    var setNav = function (open) {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      header.classList.toggle("is-open", open);
    };
    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setNav(false);
        navToggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!header.classList.contains("is-open")) return;
      if (header.contains(e.target)) return;
      setNav(false);
    });
    var navLinks = header.querySelectorAll(".primary-nav__list a");
    for (var n = 0; n < navLinks.length; n++) {
      navLinks[n].addEventListener("click", function () { setNav(false); });
    }
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && header.classList.contains("is-open")) setNav(false);
    });
  }

  /* ---------- 3. 3D card tilt ---------- */
  var tiltNodes = Array.prototype.slice.call(document.querySelectorAll("[data-tilt]"));
  if (tiltNodes.length && finePointer.matches && canMotion()) {
    var rafId = null;

    var makeTilt = function (el) {
      var max = parseFloat(el.getAttribute("data-tilt-max")) || 8;
      var glare = el.querySelector(".tilt__glare");
      return {
        el: el, glare: glare, max: max,
        cur: { x: 0, y: 0, gx: 50, gy: 50 },
        target: { x: 0, y: 0, gx: 50, gy: 50, on: false }
      };
    };

    var tilts = tiltNodes.map(makeTilt);

    var apply = function (t) {
      var k = 0.18;
      t.cur.x += (t.target.x - t.cur.x) * k;
      t.cur.y += (t.target.y - t.cur.y) * k;
      t.cur.gx += (t.target.gx - t.cur.gx) * k;
      t.cur.gy += (t.target.gy - t.cur.gy) * k;

      var settled = Math.abs(t.target.x - t.cur.x) < 0.01 && Math.abs(t.target.y - t.cur.y) < 0.01;
      if (settled && !t.target.on) {
        t.cur.x = t.cur.y = 0;
        t.el.classList.remove("is-tilting");
      }
      t.el.style.transform = "perspective(1000px) rotateX(" + t.cur.x.toFixed(3) +
        "deg) rotateY(" + t.cur.y.toFixed(3) + "deg) translateZ(0)";
      if (t.glare) {
        t.glare.style.setProperty("--gx", t.cur.gx.toFixed(2) + "%");
        t.glare.style.setProperty("--gy", t.cur.gy.toFixed(2) + "%");
      }
      return settled;
    };

    var tick = function () {
      var busy = false;
      for (var i = 0; i < tilts.length; i++) {
        var t = tilts[i];
        var moving = t.target.on || Math.abs(t.target.x - t.cur.x) > 0.01 || Math.abs(t.target.y - t.cur.y) > 0.01;
        if (moving) { apply(t); busy = true; }
      }
      rafId = busy ? requestAnimationFrame(tick) : null;
    };
    var wake = function () { if (!rafId) rafId = requestAnimationFrame(tick); };

    tilts.forEach(function (t) {
      t.el.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = t.el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        t.target.y = (px - 0.5) * t.max * 2;
        t.target.x = (0.5 - py) * t.max * 2;
        t.target.gx = px * 100;
        t.target.gy = py * 100;
        t.target.on = true;
        t.el.classList.add("is-tilting");
        wake();
      });
      t.el.addEventListener("pointerleave", function () {
        t.target.x = 0; t.target.y = 0;
        t.target.gx = 50; t.target.gy = 50;
        t.target.on = false;
        wake();
      });
    });
  }

  /* ---------- 4. Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };
    var paint = function (el, value) {
      var precision = parseInt(el.getAttribute("data-precision") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      var text = value.toLocaleString("en-US", {
        minimumFractionDigits: precision, maximumFractionDigits: precision
      });
      el.textContent = prefix + text + suffix;
    };
    var run = function (el) {
      var to = parseFloat(el.getAttribute("data-count"));
      if (!canMotion()) { paint(el, to); return; }
      var dur = 1500, start = null;
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / dur, 1);
        paint(el, to * easeOut(p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          run(en.target);
          cio.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
    } else {
      Array.prototype.forEach.call(counters, run);
    }
  }

  /* ---------- 5. Horizontal diorama ---------- */
  var diorama = document.querySelector("[data-diorama]");
  if (diorama) {
    var sticky = diorama.querySelector(".diorama__sticky");
    var track = diorama.querySelector("[data-diorama-track]");
    var exhibits = track ? track.querySelectorAll(".exhibit") : [];
    var bar = diorama.querySelector("[data-diorama-bar]");
    var chapter = diorama.querySelector("[data-diorama-chapter]");
    var labels = [];
    Array.prototype.forEach.call(exhibits, function (ex) {
      var h = ex.querySelector(".exhibit__title");
      labels.push(h ? h.textContent.trim() : "");
      ex.setAttribute("data-exhibit", String(labels.length - 1));
    });

    var dist = 0, pinned = false, dRaf = null;

    var measure = function () {
      var wantPin = window.innerWidth >= 1024 && !reduced.matches && track && exhibits.length;
      if (!wantPin) {
        pinned = false;
        diorama.removeAttribute("data-diorama-pinned");
        diorama.style.height = "";
        if (track) track.style.transform = "";
        if (bar) bar.style.width = "100%";
        return;
      }
      pinned = true;
      diorama.setAttribute("data-diorama-pinned", "on");
      var view = sticky.clientWidth;
      dist = Math.max(track.scrollWidth - view, 1);
      diorama.style.height = (dist + window.innerHeight) + "px";
      render();
    };

    var render = function () {
      if (!pinned) return;
      var r = diorama.getBoundingClientRect();
      var p = Math.min(Math.max(-r.top / dist, 0), 1);
      track.style.transform = "translate3d(" + (-p * dist).toFixed(2) + "px,0,0)";
      if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
      if (chapter) {
        var idx = Math.min(Math.round(p * (labels.length - 1)), labels.length - 1);
        if (chapter.getAttribute("data-idx") !== String(idx)) {
          chapter.setAttribute("data-idx", String(idx));
          var facts = exhibits[idx] ? exhibits[idx].querySelector(".exhibit__facts li") : null;
          chapter.textContent = labels[idx] + " — " + (facts ? facts.textContent : "");
        }
      }
    };

    window.addEventListener("scroll", function () {
      if (!pinned) return;
      if (dRaf) return;
      dRaf = requestAnimationFrame(function () { dRaf = null; render(); });
    }, { passive: true });
    window.addEventListener("resize", measure);
    if (typeof reduced.addEventListener === "function") reduced.addEventListener("change", measure);
    measure();
    window.addEventListener("load", measure);
    setTimeout(measure, 400);
  }

  /* ---------- 6. Spring accordion (one panel open) ---------- */
  var accs = document.querySelectorAll("[data-accordion]");
  Array.prototype.forEach.call(accs, function (acc) {
    var buttons = acc.querySelectorAll(".acc__btn");
    var closeAll = function (except) {
      Array.prototype.forEach.call(buttons, function (b) {
        if (b === except) return;
        b.setAttribute("aria-expanded", "false");
        var panel = document.getElementById(b.getAttribute("aria-controls"));
        if (panel) panel.setAttribute("data-open", "false");
      });
    };
    Array.prototype.forEach.call(buttons, function (btn, i) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      panel.setAttribute("data-open", "false");
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        closeAll(btn);
        btn.setAttribute("aria-expanded", String(!open));
        panel.setAttribute("data-open", String(!open));
      });
      btn.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown") next = buttons[(i + 1) % buttons.length];
        if (e.key === "ArrowUp") next = buttons[(i - 1 + buttons.length) % buttons.length];
        if (e.key === "Home") next = buttons[0];
        if (e.key === "End") next = buttons[buttons.length - 1];
        if (next) { e.preventDefault(); next.focus(); }
      });
    });
    var first = acc.querySelector("[data-accordion-open]");
    if (first) {
      first.setAttribute("aria-expanded", "true");
      var fp = document.getElementById(first.getAttribute("aria-controls"));
      if (fp) fp.setAttribute("data-open", "true");
    }
  });

  /* ---------- 7. Pricing billing toggle ---------- */
  var billing = document.querySelector("[data-billing]");
  if (billing) {
    var sw = billing.querySelector("[data-billing-switch]");
    var labels = billing.querySelectorAll("[data-billing-label]");
    var amounts = document.querySelectorAll(".tier__amt[data-monthly]");

    var write = function (yearly) {
      Array.prototype.forEach.call(amounts, function (el) {
        var val = yearly ? el.getAttribute("data-yearly") : el.getAttribute("data-monthly");
        if (val === null) return;
        el.classList.add("is-flipping");
        window.setTimeout(function () {
          el.textContent = val;
          el.classList.remove("is-flipping");
        }, canMotion() ? 160 : 0);
      });
      Array.prototype.forEach.call(labels, function (l) {
        l.setAttribute("data-active", String(l.getAttribute("data-billing-label") === (yearly ? "yearly" : "monthly")));
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-period-note]"), function (el) {
        el.textContent = yearly ? el.getAttribute("data-yearly") : el.getAttribute("data-monthly");
      });
    };

    var toggle = function () {
      var yearly = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(yearly));
      write(yearly);
    };
    sw.addEventListener("click", toggle);
    write(sw.getAttribute("aria-checked") === "true");
  }

  /* ---------- 8. Demo request form ---------- */
  var form = document.querySelector("[data-demo-form]");
  if (form) {
    var status = form.querySelector("[data-form-status]");
    var success = document.querySelector("[data-form-success]");
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var setError = function (input, message) {
      var field = input.closest(".field");
      if (!field) return;
      var slot = field.querySelector(".field__error");
      if (message) {
        field.classList.add("is-error");
        input.setAttribute("aria-invalid", "true");
        if (slot) slot.textContent = message;
      } else {
        field.classList.remove("is-error");
        input.removeAttribute("aria-invalid");
        if (slot) slot.textContent = "";
      }
    };

    var validate = function (input) {
      var v = (input.value || "").trim();
      if (input.hasAttribute("required") && !v) {
        setError(input, input.getAttribute("data-missing") || "This field is needed before we can prepare your board.");
        return false;
      }
      if (input.type === "email" && v && !emailRe.test(v)) {
        setError(input, "Enter a work email such as name@company.com so we can look up your product.");
        return false;
      }
      setError(input, "");
      return true;
    };

    var fields = form.querySelectorAll("input, select, textarea");
    Array.prototype.forEach.call(fields, function (input) {
      if (input.type === "checkbox" || input.tagName === "FIELDSET") return;
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field") && input.closest(".field").classList.contains("is-error")) validate(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      Array.prototype.forEach.call(fields, function (input) {
        if (input.type === "checkbox" && input.hasAttribute("required") && !input.checked) {
          ok = false;
          var f = input.closest(".field");
          if (f) { f.classList.add("is-error"); }
          if (!firstBad) firstBad = input;
          return;
        }
        if (input.type === "checkbox") return;
        if (!validate(input)) { ok = false; if (!firstBad) firstBad = input; }
      });

      if (!ok) {
        if (status) { status.textContent = "Two fields still need attention. Fix the highlighted ones and send again."; status.setAttribute("data-state", "error"); }
        if (firstBad) firstBad.focus();
        return;
      }

      var btn = form.querySelector("[type=submit]");
      var name = (form.querySelector("#df-name") || {}).value || "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      if (status) { status.textContent = "Routing your request to the nearest solutions engineer…"; status.setAttribute("data-state", ""); }

      window.setTimeout(function () {
        if (btn) { btn.disabled = false; btn.textContent = "Request my demo"; }
        if (status) { status.textContent = "Received. Confirmation sent to your inbox."; status.setAttribute("data-state", "ok"); }
        if (success) {
          var who = success.querySelector("[data-success-name]");
          if (who) who.textContent = name.split(" ")[0] || "there";
          success.classList.add("is-visible");
          success.setAttribute("tabindex", "-1");
          success.focus();
        }
        form.reset();
      }, 900);
    });
  }

  /* ---------- 9. Smooth in-page anchors ---------- */
  var anchors = document.querySelectorAll('a[href*="#"]:not([href="#"])');
  Array.prototype.forEach.call(anchors, function (a) {
    a.addEventListener("click", function () {
      var hash = a.getAttribute("href").split("#")[1];
      var target = document.getElementById(hash);
      if (!target) return;
      window.setTimeout(function () {
        target.scrollIntoView({ behavior: canMotion() ? "smooth" : "auto", block: "start" });
      }, 60);
    });
  });

  /* ---------- 10. Header inversion over dark bands ---------- */
  var darkBands = document.querySelectorAll("[data-dark-band]");
  if (header && darkBands.length) {
    var hRaf = null;
    var paintHeader = function () {
      var probe = 38;
      var over = false;
      Array.prototype.forEach.call(darkBands, function (band) {
        var r = band.getBoundingClientRect();
        if (r.top <= probe && r.bottom >= probe) over = true;
      });
      header.classList.toggle("is-inverted", over);
    };
    var onScrollInvert = function () {
      if (hRaf) return;
      hRaf = requestAnimationFrame(function () { hRaf = null; paintHeader(); });
    };
    window.addEventListener("scroll", onScrollInvert, { passive: true });
    window.addEventListener("resize", onScrollInvert);
    paintHeader();
  }
})();
