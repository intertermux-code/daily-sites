/* ==========================================================================
   NEON PULSE — shared behaviour
   Vanilla JS only. Every module is guarded by an element-existence check so
   the same file can run on every page.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- 1. mobile nav ---------- */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $(".site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---------- 2. scroll progress (terminal line) ---------- */
  function initProgress() {
    var bar = $(".progressbar");
    if (!bar || reduced) return;
    var raf = 0;
    function update() {
      raf = 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    }
    window.addEventListener("scroll", function () {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- 3. live countdown ---------- */
  var GATES = new Date(2026, 11, 18, 18, 0, 0); // Fri 18 Dec 2026, 18:00 local
  function initCountdown() {
    var root = $("[data-countdown]");
    if (!root) return;
    var cells = {
      days: $("[data-unit='days']", root),
      hours: $("[data-unit='hours']", root),
      minutes: $("[data-unit='minutes']", root),
      seconds: $("[data-unit='seconds']", root)
    };
    var status = $("[data-countdown-status]", root);
    var prev = {};

    function pad(n, len) {
      var s = String(Math.max(0, n));
      while (s.length < (len || 2)) s = "0" + s;
      return s;
    }
    function set(key, value) {
      var cell = cells[key];
      if (!cell) return;
      var num = $("b", cell);
      if (!num || num.textContent === value) return;
      num.textContent = value;
      if (!reduced) {
        cell.classList.add("tick");
        window.setTimeout(function () { cell.classList.remove("tick"); }, 220);
      }
      prev[key] = value;
    }
    function render() {
      var diff = GATES.getTime() - Date.now();
      if (diff <= 0) {
        set("days", "00"); set("hours", "00"); set("minutes", "00"); set("seconds", "00");
        if (status) status.textContent = "[ LIVE ] — gates open. sound system warm.";
        return false;
      }
      var s = Math.floor(diff / 1000);
      set("days", pad(Math.floor(s / 86400), 3));
      set("hours", pad(Math.floor(s / 3600) % 24));
      set("minutes", pad(Math.floor(s / 60) % 60));
      set("seconds", pad(s % 60));
      if (status) status.textContent = "[ SYNCED ] — next transmission " + GATES.toLocaleString("en-GB", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
      return true;
    }
    render();
    var timer = window.setInterval(function () {
      if (!render()) window.clearInterval(timer);
    }, 1000);
  }

  /* ---------- 4. spring accordion (one panel open at a time) ---------- */
  function initAccordions() {
    $$(".accordion").forEach(function (acc) {
      var items = $$(".accordion__item", acc);
      if (!items.length) return;

      items.forEach(function (item, i) {
        var trigger = $(".accordion__trigger", item);
        var panel = $(".accordion__panel", item);
        if (!trigger || !panel) return;
        if (!panel.id) panel.id = (trigger.id || "acc-" + i) + "-panel";
        if (!trigger.id) trigger.id = panel.id + "-head";
        trigger.setAttribute("aria-controls", panel.id);
        trigger.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");

        trigger.addEventListener("keydown", function (e) {
          var keys = ["ArrowDown", "ArrowUp", "Home", "End"];
          if (keys.indexOf(e.key) === -1) return;
          e.preventDefault();
          var targets = $$(".accordion__trigger", acc);
          var idx = targets.indexOf(document.activeElement);
          var next = idx;
          if (e.key === "ArrowDown") next = (idx + 1) % targets.length;
          if (e.key === "ArrowUp") next = (idx - 1 + targets.length) % targets.length;
          if (e.key === "Home") next = 0;
          if (e.key === "End") next = targets.length - 1;
          targets[next].focus();
        });
      });

      function closeAll(except) {
        items.forEach(function (it) {
          if (it === except) return;
          it.classList.remove("is-open");
          var t = $(".accordion__trigger", it);
          if (t) t.setAttribute("aria-expanded", "false");
        });
      }
      acc.addEventListener("click", function (e) {
        var trigger = e.target.closest(".accordion__trigger");
        if (!trigger || !acc.contains(trigger)) return;
        var item = trigger.closest(".accordion__item");
        var open = !item.classList.contains("is-open");
        closeAll(item);
        item.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* ---------- 5. 3D card tilt + glare ---------- */
  function initTilt() {
    if (!finePointer || reduced) return;
    var MAX = 8;
    $$("[data-tilt]").forEach(function (card) {
      var glare = $(".glare", card) || $(".glare", card.parentElement);
      var target = { rx: 0, ry: 0, gx: 50, gy: 50 };
      var cur = { rx: 0, ry: 0, gx: 50, gy: 50 };
      var raf = 0;
      var hovering = false;

      function lerp(a, b, t) { return a + (b - a) * t; }
      function loop() {
        cur.rx = lerp(cur.rx, target.rx, 0.16);
        cur.ry = lerp(cur.ry, target.ry, 0.16);
        cur.gx = lerp(cur.gx, target.gx, 0.2);
        cur.gy = lerp(cur.gy, target.gy, 0.2);
        card.style.transform = "rotateX(" + cur.rx.toFixed(2) + "deg) rotateY(" + cur.ry.toFixed(2) + "deg) translateZ(0)";
        if (glare) {
          glare.style.setProperty("--gx", cur.gx.toFixed(1) + "%");
          glare.style.setProperty("--gy", cur.gy.toFixed(1) + "%");
        }
        if (hovering || Math.abs(cur.rx - target.rx) > 0.05 || Math.abs(cur.ry - target.ry) > 0.05) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = 0;
          card.style.transform = "";
        }
      }
      function start() { if (!raf) raf = requestAnimationFrame(loop); }

      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        target.ry = (px - 0.5) * MAX * 2;
        target.rx = (0.5 - py) * MAX * 2;
        target.gx = px * 100;
        target.gy = py * 100;
        start();
      });
      card.addEventListener("pointerenter", function () { hovering = true; start(); });
      card.addEventListener("pointerleave", function () {
        hovering = false;
        target.rx = 0; target.ry = 0; target.gx = 50; target.gy = 50;
        start();
      });
    });
  }

  /* ---------- 6. timeline spine draw ---------- */
  function initSpine() {
    $$(".spine").forEach(function (spine) {
      var line = $(".spine__line", spine);
      if (!line) return;
      if (reduced || !("IntersectionObserver" in window)) {
        line.style.setProperty("--draw", "1");
        return;
      }
      line.style.setProperty("--draw", "0");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var items = $$(".spine__item", spine);
          var total = items.length || 1;
          var seen = items.filter(function (it) { return it.getBoundingClientRect().top < window.innerHeight * 0.75; }).length;
          line.style.setProperty("--draw", String(Math.min(1, Math.max(0.04, seen / total))));
          if (seen >= total) io.disconnect();
        });
      }, { threshold: [0, .15, .3, .55, .8], rootMargin: "0px 0px -10% 0px" });
      io.observe(spine);
      window.addEventListener("scroll", function () {
        var r = spine.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          var items = $$(".spine__item", spine);
          var total = items.length || 1;
          var seen = items.filter(function (it) { return it.getBoundingClientRect().top < window.innerHeight * 0.78; }).length;
          line.style.setProperty("--draw", String(Math.min(1, Math.max(0.04, seen / total))));
        }
      }, { passive: true });
    });
  }

  /* ---------- 7. lineup filters (day + stage) ---------- */
  function initLineup() {
    var board = $("[data-lineup]");
    if (!board) return;
    var cards = $$(".artist-card", board);
    var dayChips = $$("[data-filter-day]", board);
    var stageChips = $$("[data-filter-stage]", board);
    var countEl = $("[data-lineup-count]", board);
    var totalEl = $("[data-lineup-total]", board);
    var emptyEl = $("[data-lineup-empty]", board);
    var live = $("[data-lineup-live]", board);
    var state = { day: "all", stage: "all" };
    if (totalEl) totalEl.textContent = String(cards.length);

    function apply(group, chips, value) {
      state[group] = value;
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.getAttribute("data-value") === value));
      });
      render();
    }
    function render() {
      var shown = 0;
      cards.forEach(function (card) {
        var day = card.getAttribute("data-day");
        var stage = card.getAttribute("data-stage");
        var ok = (state.day === "all" || day === state.day) && (state.stage === "all" || stage === state.stage);
        card.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = String(shown);
      if (emptyEl) emptyEl.classList.toggle("is-on", shown === 0);
      if (live) {
        var label = (state.day === "all" ? "all days" : state.day) + " / " + (state.stage === "all" ? "all stages" : state.stage);
        live.textContent = "filter: " + label + " → " + shown + " act" + (shown === 1 ? "" : "s") + " on the grid.";
      }
    }
    dayChips.forEach(function (chip) {
      chip.addEventListener("click", function () { apply("day", dayChips, chip.getAttribute("data-value")); });
    });
    stageChips.forEach(function (chip) {
      chip.addEventListener("click", function () { apply("stage", stageChips, chip.getAttribute("data-value")); });
    });
    $$("[data-lineup-reset]", board).forEach(function (reset) {
      reset.addEventListener("click", function () {
        apply("day", dayChips, "all");
        apply("stage", stageChips, "all");
      });
    });
    render();
  }

  /* ---------- 8. marquee: duplicate figures for a seamless loop ---------- */
  function initMarqueeSafe() {
    $$(".marquee__track").forEach(function (track) {
      if (track.dataset.doubled === "1") return;
      track.dataset.doubled = "1";
      var originals = $$("figure", track);
      originals.forEach(function (fig) {
        var c = fig.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        track.appendChild(c);
      });
    });
  }

  /* ---------- 9. forms ---------- */
  function emailValid(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v); }

  function initForm() {
    $$("form[data-form]").forEach(function (form) {
      var output = $("[data-form-output]", form);
      var kind = form.getAttribute("data-form");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        $$("[required]", form).forEach(function (input) {
          var field = input.closest(".field");
          var bad = !input.value.trim() || (input.type === "email" && !emailValid(input.value.trim()));
          if (field) field.classList.toggle("is-invalid", bad);
          input.setAttribute("aria-invalid", String(bad));
          if (bad) ok = false;
        });
        var pw = $("[data-min-chars]", form);
        if (pw && pw.value.trim().length < parseInt(pw.getAttribute("data-min-chars"), 10)) {
          var pf = pw.closest(".field");
          if (pf) pf.classList.add("is-invalid");
          pw.setAttribute("aria-invalid", "true");
          ok = false;
        }
        if (!ok) {
          if (output) {
            output.textContent = "[ ERR ] handshake failed — check the highlighted fields.";
            output.classList.add("is-error");
          }
          var firstBad = $(".field.is-invalid input, .field.is-invalid select", form);
          if (firstBad) firstBad.focus();
          return;
        }
        if (output) {
          output.classList.remove("is-error");
          if (kind === "waitlist") {
            output.textContent = "[ OK ] queued for " + (form.querySelector("[data-tier-name]") ? form.querySelector("[data-tier-name]").textContent : "restock") + " — position #" + (1200 + Math.floor(Math.random() * 900)) + ".";
          } else if (kind === "roster") {
            output.textContent = "[ OK ] band submitted to book@neonpulse.fm — expect a reply within 5 working days.";
          } else {
            output.textContent = "[ OK ] transmission logged. confirmation sent to " + form.querySelector("input[type=email]").value.trim() + ".";
          }
        }
        form.reset();
      });
      $$("input, select, textarea", form).forEach(function (input) {
        input.addEventListener("input", function () {
          var field = input.closest(".field");
          if (field) field.classList.remove("is-invalid");
          if (output) output.classList.remove("is-error");
        });
      });
    });
  }

  /* ---------- 10. copy-to-clipboard for terminal commands ---------- */
  function initCopy() {
    $$("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function () {
          var label = $(".btn-label", btn) || btn;
          var old = label.textContent;
          label.textContent = "[ copied ]";
          window.setTimeout(function () { label.textContent = old; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else { done(); }
      });
    });
  }

  /* ---------- 11. ticker doubling ---------- */
  function initTicker() {
    $$(".ticker__track").forEach(function (track) {
      if (track.dataset.doubled === "1") return;
      track.dataset.doubled = "1";
      $$("span", track).forEach(function (sp) {
        track.appendChild(sp.cloneNode(true));
      });
    });
  }

  /* ---------- 12. sold-out tier → open its waitlist accordion ---------- */
  function initSoldOut() {
    $$("[data-open-waitlist]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sel = btn.getAttribute("data-open-waitlist");
        var target = $(sel);
        if (!target) return;
        var item = target.closest(".accordion__item");
        if (item) {
          var acc = item.closest(".accordion");
          $$(".accordion__item", acc).forEach(function (it) {
            it.classList.remove("is-open");
            var t = $(".accordion__trigger", it);
            if (t) t.setAttribute("aria-expanded", "false");
          });
          item.classList.add("is-open");
          var trig = $(".accordion__trigger", item);
          if (trig) trig.setAttribute("aria-expanded", "true");
        }
        var input = $(".field input", target);
        if (input) window.setTimeout(function () { input.focus(); }, reduced ? 0 : 420);
      });
    });
  }

  /* ---------- 13. year stamp ---------- */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  function boot() {
    initNav();
    initProgress();
    initCountdown();
    initAccordions();
    initTilt();
    initSpine();
    initLineup();
    initMarqueeSafe();
    initTicker();
    initForm();
    initCopy();
    initSoldOut();
    initYear();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
