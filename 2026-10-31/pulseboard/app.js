/* =========================================================
   Pulseboard — shared behaviour
   Guarded per page: every module checks for its own markup.
   Motion: 3D card tilt (primary) + decode text (secondary),
   plus telemetry counters. Vanilla only.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)").matches : false;

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- Header state + scroll progress rail ---------- */
  var header = document.querySelector(".site-header");
  var rail = document.querySelector(".progress-rail span");
  var ticking = false;

  function onScrollFrame() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (rail) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      rail.style.setProperty("--progress", p.toFixed(4));
    }
    ticking = false;
  }

  function requestScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  if (header || rail) {
    window.addEventListener("scroll", requestScroll, { passive: true });
    window.addEventListener("resize", requestScroll);
    onScrollFrame();
  }

  /* ---------- Decode text (typewriter-terminal resolve) ---------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%$&/<>*+=";

  function decode(el) {
    if (el.dataset.decodeDone) return;
    el.dataset.decodeDone = "1";
    var final = el.getAttribute("data-decode") || el.textContent;
    if (reduce) { el.textContent = final; return; }

    var len = final.length;
    var frame = 0;
    var settled = 0;
    var out = new Array(len);

    el.textContent = final.replace(/[^\s]/g, "—");

    function tick() {
      frame++;
      if (frame % 2 === 0) settled += 1;
      for (var i = 0; i < len; i++) {
        var ch = final.charAt(i);
        if (ch === " ") { out[i] = " "; continue; }
        if (i < settled) out[i] = ch;
        else out[i] = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = out.join("");
      if (settled < len) window.requestAnimationFrame(tick);
      else el.textContent = final;
    }
    window.setTimeout(function () { window.requestAnimationFrame(tick); }, 320);
  }

  var decoders = document.querySelectorAll("[data-decode]");
  if (decoders.length) {
    window.addEventListener("load", function () {
      Array.prototype.forEach.call(decoders, decode);
    });
    // Pages restored from cache fire load late; run as a fallback too.
    window.setTimeout(function () {
      Array.prototype.forEach.call(decoders, decode);
    }, 1400);
  }

  /* ---------- 3D card tilt with lerp + glare ---------- */
  function initTilt(card) {
    var state = {
      rx: 0, ry: 0, gx: 50, gy: 50,
      trx: 0, try_: 0, tgx: 50, tgy: 50,
      running: false,
      max: 8
    };

    function loop() {
      state.rx += (state.trx - state.rx) * 0.16;
      state.ry += (state.try_ - state.ry) * 0.16;
      state.gx += (state.tgx - state.gx) * 0.2;
      state.gy += (state.tgy - state.gy) * 0.2;

      card.style.transform =
        "perspective(900px) rotateX(" + state.rx.toFixed(2) + "deg) rotateY(" + state.ry.toFixed(2) + "deg) translateZ(0)";
      card.style.setProperty("--gx", state.gx.toFixed(1) + "%");
      card.style.setProperty("--gy", state.gy.toFixed(1) + "%");

      var done = Math.abs(state.trx - state.rx) < 0.02 && Math.abs(state.try_ - state.ry) < 0.02;
      if (done && !state.hover) {
        card.style.transform = "";
        state.running = false;
        return;
      }
      window.requestAnimationFrame(loop);
    }

    function start() {
      if (!state.running) {
        state.running = true;
        window.requestAnimationFrame(loop);
      }
    }

    card.addEventListener("pointerenter", function () {
      if (!fine) return;
      state.hover = true;
      card.classList.add("is-tilting");
      start();
    });

    card.addEventListener("pointermove", function (e) {
      if (!fine || reduce) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      state.try_ = (px - 0.5) * state.max * 2;
      state.trx = (0.5 - py) * state.max * 2;
      state.tgx = px * 100;
      state.tgy = py * 100;
      start();
    });

    card.addEventListener("pointerleave", function () {
      if (!fine) return;
      state.hover = false;
      state.trx = 0;
      state.try_ = 0;
      state.tgx = 50;
      state.tgy = 50;
      card.classList.remove("is-tilting");
      start();
    });
  }

  if (!reduce) {
    Array.prototype.forEach.call(document.querySelectorAll(".tilt"), initTilt);
  }

  /* ---------- Animated counters + telemetry rails ---------- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = parseInt(el.getAttribute("data-duration") || "1600", 10);

    function paint(v) {
      var num = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      el.textContent = prefix + num + suffix;
    }

    if (reduce) { paint(target); return; }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      paint(target * easeOutCubic(p));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        runCounter(en.target);
        if (en.target.closest(".band")) en.target.closest(".band").classList.add("is-live");
        cio.unobserve(en.target);
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
  } else {
    Array.prototype.forEach.call(counters, runCounter);
    var bandFallback = document.querySelector(".band");
    if (bandFallback) bandFallback.classList.add("is-live");
  }

  /* ---------- Pricing: monthly / yearly switch ---------- */
  var billing = document.getElementById("billing-switch");
  if (billing) {
    var prices = document.querySelectorAll("[data-monthly]");
    var notes = document.querySelectorAll("[data-yearly-note]");
    var totals = document.querySelectorAll("[data-yearly-total]");

    function paint(annual) {
      Array.prototype.forEach.call(prices, function (el) {
        var v = annual ? el.getAttribute("data-yearly") : el.getAttribute("data-monthly");
        var amt = el.querySelector(".price__amt");
        if (amt) amt.textContent = v;
        el.setAttribute("aria-label", "Price: $" + v + " per month, " + (annual ? "billed yearly" : "billed monthly"));
      });
      Array.prototype.forEach.call(notes, function (el) {
        el.textContent = annual ? el.getAttribute("data-yearly-note") : el.getAttribute("data-monthly-note");
      });
      Array.prototype.forEach.call(totals, function (el) {
        el.textContent = annual ? el.getAttribute("data-yearly-total") : el.getAttribute("data-monthly-total");
        el.style.display = annual ? "" : "none";
      });
    }

    billing.addEventListener("click", function () {
      var annual = billing.getAttribute("aria-checked") !== "true";
      billing.setAttribute("aria-checked", annual ? "true" : "false");
      paint(annual);
    });
    billing.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        billing.click();
      }
    });
    paint(billing.getAttribute("aria-checked") === "true");
  }

  /* ---------- Demo request / contact form ---------- */
  var form = document.getElementById("demo-form");
  if (form) {
    var status = document.getElementById("form-status");
    var console_ = document.getElementById("payload-console");
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    function fieldOf(input) {
      return input.closest(".field");
    }

    function setError(input, msg) {
      var wrap = fieldOf(input);
      input.setAttribute("aria-invalid", "true");
      if (wrap) {
        var out = wrap.querySelector(".field__error");
        if (out) out.textContent = msg;
      }
    }

    function clearError(input) {
      var wrap = fieldOf(input);
      input.removeAttribute("aria-invalid");
      if (wrap) {
        var out = wrap.querySelector(".field__error");
        if (out) out.textContent = "";
      }
    }

    function validate(input) {
      var val = input.value.trim();
      if (input.hasAttribute("required") && !val) {
        setError(input, "This field is required before transmission.");
        return false;
      }
      if (input.type === "email" && val && !emailRe.test(val)) {
        setError(input, "Enter a valid work email, e.g. name@company.com");
        return false;
      }
      if (input.getAttribute("data-min") && val.length < parseInt(input.getAttribute("data-min"), 10)) {
        setError(input, "Add a little more detail — " + input.getAttribute("data-min") + " characters minimum.");
        return false;
      }
      clearError(input);
      return true;
    }

    Array.prototype.forEach.call(form.querySelectorAll("input, select, textarea"), function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") validate(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = form.querySelectorAll("input, select, textarea");
      var ok = true;
      var firstBad = null;
      Array.prototype.forEach.call(inputs, function (input) {
        if (input.type === "checkbox" && input.hasAttribute("required") && !input.checked) {
          ok = false;
          firstBad = firstBad || input;
          setError(input, "Please confirm before sending.");
          return;
        }
        if (input.type === "checkbox") return;
        if (!validate(input)) {
          ok = false;
          firstBad = firstBad || input;
        }
      });

      if (!ok) {
        if (status) {
          status.className = "form-status form-status--err is-visible";
          status.textContent = "Transmission held. Fix the highlighted fields and send again.";
        }
        if (firstBad) firstBad.focus();
        return;
      }

      function pick(name) {
        var field = form.querySelector('[name="' + name + '"]');
        if (!field) return "unspecified";
        var checked = form.querySelector('[name="' + name + '"]:checked');
        return (checked || field).value || "unspecified";
      }

      var name = (form.querySelector('[name="name"]') || {}).value || "";
      var company = (form.querySelector('[name="company"]') || {}).value || "";
      var stack = pick("stack");
      var volume = pick("volume");

      if (console_) {
        var lines = [
          ["> POST /v1/demo-requests … ", "202 accepted"],
          ["> operator = ", name + " @ " + company],
          ["> stack = ", stack + " · volume = " + volume],
          ["> routing = ", "solutions-engineering / tier-1"],
          ["> eta = ", "under 4 business hours"]
        ];
        console_.textContent = "";
        lines.forEach(function (pair, idx) {
          var row = document.createElement("span");
          var lead = document.createTextNode(pair[0]);
          var emph = document.createElement("b");
          emph.textContent = pair[1];
          row.appendChild(lead);
          row.appendChild(emph);
          console_.appendChild(row);
          if (idx < lines.length - 1) console_.appendChild(document.createElement("br"));
        });
      }
      if (status) {
        status.className = "form-status form-status--ok is-visible";
        status.textContent = "Request logged. A Pulseboard solutions engineer will confirm your 30-minute demo window within 4 business hours.";
      }
      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), clearError);
      if (status) status.focus();
    });
  }

  /* ---------- Instrument mockup: live-ish telemetry shuffle ---------- */
  var bars = document.querySelector("[data-live-bars]");
  if (bars && !reduce) {
    var cells = bars.querySelectorAll("i");
    window.setInterval(function () {
      if (document.hidden) return;
      for (var i = cells.length - 1; i > 0; i--) {
        cells[i].style.setProperty("--h", cells[i - 1].style.getPropertyValue("--h") || 40);
      }
      if (cells[0]) {
        var h = 24 + Math.round(Math.random() * 68);
        cells[0].style.setProperty("--h", h);
      }
    }, 2200);
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
