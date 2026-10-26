/* =====================================================================
   NEON PULSE — shared behaviour
   Everything is guarded by element-existence checks so one file serves
   every page. Signature motion: decode text + parallax layers.
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- footer year ---------- */
  function initYear() {
    var nodes = $$("[data-year]");
    if (!nodes.length) return;
    var y = String(new Date().getFullYear());
    nodes.forEach(function (n) { n.textContent = y; });
  }

  /* ---------- mobile nav ---------- */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
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
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  /* ---------- decode text (signature motion #1) ----------
     Cycles random glyphs, then resolves left to right, terminal style. */
  var GLYPHS = "▚▞█▄▀#@%&$*+=/\\<>01ZXQWERTYUIOPASDFGHJKL";

  function decode(el) {
    var target = el.getAttribute("data-decode") || el.textContent;
    var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
    if (reduced.matches) { el.textContent = target; return; }

    el.setAttribute("data-decoding", "true");
    var total = target.length;
    var frame = 0;
    var lockFrames = 4; // frames each character spends before settling

    function tick() {
      var out = "";
      var settled = Math.floor(frame / lockFrames);
      for (var i = 0; i < total; i++) {
        var ch = target.charAt(i);
        if (ch === " ") { out += " "; continue; }
        if (i < settled) out += ch;
        else out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = out;
      frame++;
      if (settled <= total) requestAnimationFrame(tick);
      else { el.textContent = target; el.removeAttribute("data-decoding"); }
    }
    window.setTimeout(function () { requestAnimationFrame(tick); }, delay);
  }

  function initDecode() {
    var nodes = $$("[data-decode]");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) { nodes.forEach(decode); return; }
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        decode(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- parallax layers (signature motion #2) ---------- */
  function initParallax() {
    var layers = $$("[data-speed]");
    if (!layers.length || reduced.matches) return;
    var ticking = false;

    function apply() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      for (var i = 0; i < layers.length; i++) {
        var s = parseFloat(layers[i].getAttribute("data-speed")) || 0;
        layers[i].style.transform = "translate3d(0," + (y * s * -0.6).toFixed(2) + "px,0)";
      }
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
  }

  /* ---------- CRT lock-on reveal ---------- */
  function initReveal() {
    var nodes = $$(".signal");
    if (!nodes.length) return;
    if (reduced.matches || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    document.documentElement.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, idx) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = Math.min(idx * 55, 280) + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- countdown ---------- */
  function pad(n, w) {
    var s = String(Math.max(0, n));
    while (s.length < (w || 2)) s = "0" + s;
    return s;
  }

  function initCountdown() {
    var root = $("[data-countdown]");
    if (!root) return;
    var target = new Date(root.getAttribute("data-countdown"));
    if (isNaN(target.getTime())) return;

    var cells = {
      days: $("[data-unit=days]", root),
      hours: $("[data-unit=hours]", root),
      minutes: $("[data-unit=minutes]", root),
      seconds: $("[data-unit=seconds]", root)
    };
    var foot = $(".countdown-foot", root);

    function render() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        Object.keys(cells).forEach(function (k) { if (cells[k]) cells[k].textContent = "00"; });
        if (foot) foot.textContent = "Gates are open. Terminal Nine is live — see you at the apron.";
        return false;
      }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;
      if (cells.days) cells.days.textContent = pad(d, d > 99 ? 3 : 2);
      if (cells.hours) cells.hours.textContent = pad(h);
      if (cells.minutes) cells.minutes.textContent = pad(m);
      if (cells.seconds) cells.seconds.textContent = pad(sec);
      return true;
    }

    render();
    var id = window.setInterval(function () {
      if (!render()) window.clearInterval(id);
    }, 1000);
  }

  /* ---------- lineup filters ---------- */
  function initFilters() {
    var grid = $("[data-filterable]");
    if (!grid) return;
    var acts = $$(".act", grid);
    var groups = $$(".filter-group[data-facet]");
    var tally = $("[data-result-count]");
    var emptyMsg = $("[data-no-results]");
    var state = {};

    function readFacet(group) {
      var active = $(".chip[aria-pressed=true]", group);
      state[group.getAttribute("data-facet")] = active ? active.getAttribute("data-value") : "all";
    }

    function apply() {
      var shown = 0;
      acts.forEach(function (act) {
        var ok = Object.keys(state).every(function (facet) {
          var want = state[facet];
          if (want === "all") return true;
          var have = (act.getAttribute("data-" + facet) || "").split(" ");
          return have.indexOf(want) !== -1;
        });
        act.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });

      // day section headings: hide when every act inside is hidden
      $$("[data-day-section]").forEach(function (sec) {
        var visible = $$(".act:not(.is-hidden)", sec).length;
        sec.hidden = visible === 0;
        var n = $(".count-tally", sec);
        if (n) n.textContent = visible + (visible === 1 ? " act" : " acts");
      });

      if (tally) tally.textContent = String(shown);
      if (emptyMsg) emptyMsg.hidden = shown !== 0;
    }

    groups.forEach(function (group) {
      readFacet(group);
      group.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        $$(".chip", group).forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        readFacet(group);
        apply();
      });
    });

    var reset = $("[data-reset-filters]");
    if (reset) {
      reset.addEventListener("click", function () {
        groups.forEach(function (group) {
          $$(".chip", group).forEach(function (c, i) {
            c.setAttribute("aria-pressed", i === 0 ? "true" : "false");
          });
          readFacet(group);
        });
        apply();
      });
    }
    apply();
  }

  /* ---------- FAQ accordion ---------- */
  function initAccordion() {
    var items = $$(".acc-item");
    if (!items.length) return;

    items.forEach(function (item) {
      var btn = $(".acc-btn", item);
      var panel = $(".acc-panel", item);
      if (!btn || !panel) return;

      function setHeight(open) {
        if (reduced.matches) {
          panel.style.blockSize = open ? "auto" : "0px";
          return;
        }
        if (open) {
          panel.style.blockSize = panel.scrollHeight + "px";
        } else {
          panel.style.blockSize = "0px";
        }
      }

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        setHeight(!open);
      });

      panel.addEventListener("transitionend", function (e) {
        if (e.propertyName === "block-size" && btn.getAttribute("aria-expanded") === "true") {
          panel.style.blockSize = "auto";
        }
      });

      window.addEventListener("resize", function () {
        if (btn.getAttribute("aria-expanded") === "true") panel.style.blockSize = "auto";
      });
    });

    var deep = location.hash.replace("#", "");
    if (deep) {
      var target = document.getElementById(deep);
      var host = target && target.closest ? target.closest(".acc-item") : null;
      if (host) {
        var b = $(".acc-btn", host);
        if (b && b.getAttribute("aria-expanded") !== "true") b.click();
      }
    }
  }

  /* ---------- marquee: clone the track so -50% loops seamlessly ---------- */
  function initMarquee() {
    var tracks = $$(".marquee-track");
    if (!tracks.length) return;
    tracks.forEach(function (track) {
      if (track.getAttribute("data-doubled") === "true") return;
      var clones = track.children.length;
      for (var i = 0; i < clones; i++) {
        var c = track.children[i].cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        track.appendChild(c);
      }
      track.setAttribute("data-doubled", "true");
    });
  }

  /* ---------- validated forms ---------- */
  function initForms() {
    $$("form[data-form]").forEach(function (form) {
      var status = $("[data-status]", form);
      var email = $("input[type=email]", form);

      function say(msg, kind) {
        if (!status) return;
        status.textContent = msg;
        status.className = "form-status " + (kind || "");
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var invalid = null;
        $$("input[required], textarea[required], select[required]", form).forEach(function (input) {
          var bad = !input.value.trim();
          if (!bad && input.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim());
          input.setAttribute("aria-invalid", bad ? "true" : "false");
          if (bad && !invalid) invalid = input;
        });

        if (invalid) {
          say("$ error: " + (invalid.labels && invalid.labels[0] ? invalid.labels[0].textContent.toLowerCase() : "field") + " is required or malformed.", "err");
          invalid.focus();
          return;
        }

        var name = form.getAttribute("data-form");
        if (name === "newsletter") {
          say("$ ok — subscribed. Next dispatch: the 01 lineup drop, 24 hours early.", "ok");
        } else if (name === "waitlist") {
          say("$ ok — you are on the restock list for this tier. One message when seats return, never two.", "ok");
        } else if (name === "contact") {
          say("$ ok — message queued. Box office replies inside one business day, PT.", "ok");
        } else {
          say("$ ok — received.", "ok");
        }
        form.reset();
        $$("input, textarea, select", form).forEach(function (i) { i.removeAttribute("aria-invalid"); });
      });

      if (email) {
        email.addEventListener("input", function () { email.setAttribute("aria-invalid", "false"); });
      }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initYear();
    initNav();
    initDecode();
    initParallax();
    initReveal();
    initCountdown();
    initFilters();
    initAccordion();
    initMarquee();
    initForms();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
