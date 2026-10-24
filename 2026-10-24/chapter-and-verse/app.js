/* ==========================================================================
   Chapter & Verse — shared behaviour
   Signature motion: Decode Text (hero keyword) + Animated Counters (stats)
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 01. Mobile index (nav) ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close index" : "Open index");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) nav.classList.remove("is-open");
    });
  }

  /* ---------- 02. Decode Text ---------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ&*§¶†‡æœ∆∑";

  function scramble(el, done) {
    var final = el.getAttribute("data-final") || el.textContent;
    el.setAttribute("data-final", final);
    if (reduced) { el.textContent = final; if (done) done(); return; }

    var chars = final.split("");
    var frame = 0;
    var settle = 3;           // frames each glyph spins before locking
    var total = chars.length * settle + 12;

    el.classList.add("is-decoding");
    el.setAttribute("aria-hidden", "true");

    function tick() {
      var out = "";
      for (var i = 0; i < chars.length; i++) {
        var lock = frame - i * settle;
        if (chars[i] === " ") { out += " "; continue; }
        out += lock > 0 ? chars[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = final;
        el.classList.remove("is-decoding");
        el.removeAttribute("aria-hidden");
        if (done) done();
      }
    }
    requestAnimationFrame(tick);
  }

  function initDecode() {
    var targets = Array.prototype.slice.call(document.querySelectorAll("[data-decode]"));
    if (!targets.length) return;
    // runs once on load, chained left to right so the phrase resolves like a sentence
    (function next(i) {
      if (i >= targets.length) return;
      scramble(targets[i], function () { next(i + 1); });
    })(0);
  }

  /* ---------- 03. Animated Counters ---------- */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    if (reduced) { el.textContent = target.toLocaleString("en-US", opts); return; }

    var start = null;
    var dur = 1200;
    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      el.textContent = (target * easeOutExpo(p)).toLocaleString("en-US", opts);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toLocaleString("en-US", opts);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!nums.length) return;
    if (!("IntersectionObserver" in window)) { nums.forEach(runCounter); return; }

    nums.forEach(function (el) {
      el.textContent = (0).toLocaleString("en-US");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 04. Shelf: genre filter + catalogue entry ---------- */
  function initShelf() {
    var shelf = document.getElementById("shelf");
    if (!shelf) return;

    var spines = Array.prototype.slice.call(shelf.querySelectorAll(".spine"));
    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var empty = document.querySelector(".shelf__empty");
    var card = document.getElementById("catalogue-entry");
    var current = "all";
    var selected = null;

    filters.forEach(function (btn) {
      var genre = btn.getAttribute("data-filter");
      var n = genre === "all" ? spines.length
        : spines.filter(function (s) { return s.getAttribute("data-genre") === genre; }).length;
      var slot = btn.querySelector(".count");
      if (slot) slot.textContent = String(n).padStart(2, "0");
    });

    function apply(genre) {
      current = genre;
      var shown = 0;
      spines.forEach(function (s) {
        var match = genre === "all" || s.getAttribute("data-genre") === genre;
        s.hidden = !match;
        if (match) shown++;
      });
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-filter") === genre ? "true" : "false");
      });
      if (empty) empty.hidden = shown !== 0;
      if (card) card.hidden = shown === 0;
    }

    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-filter"));
      });
    });

    function read(spine) {
      if (!card) return;
      var d = spine.dataset;
      card.querySelector("[data-field='title']").textContent = d.title;
      card.querySelector("[data-field='author']").textContent = d.author;
      card.querySelector("[data-field='shelf']").textContent = d.shelf;
      card.querySelector("[data-field='genre-label']").textContent = d.genreLabel;
      card.querySelector("[data-field='year']").textContent = d.year;
      card.querySelector("[data-field='price']").textContent = d.price;
      card.querySelector("[data-field='format']").textContent = d.format;
      card.querySelector("[data-field='notes']").textContent = d.notes;
      card.querySelector("[data-field='picker']").textContent = d.picker;
      card.hidden = false;
    }

    spines.forEach(function (spine) {
      spine.addEventListener("click", function () {
        if (selected) selected.setAttribute("aria-pressed", "false");
        selected = spine;
        spine.setAttribute("aria-pressed", "true");
        read(spine);
      });
    });

    apply("all");
    if (spines.length) {
      selected = spines[0];
      selected.setAttribute("aria-pressed", "true");
      read(selected);
    }
  }

  /* ---------- 05. Membership form ---------- */
  function initClubForm() {
    var form = document.getElementById("club-form");
    if (!form) return;
    var status = document.getElementById("club-status");

    function fieldOf(input) { return input.closest(".field") || input.closest(".fieldset"); }

    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.add("field--invalid");
      var box = field.querySelector(".field__error");
      if (box) box.textContent = message;
      input.setAttribute("aria-invalid", "true");
    }

    function clearError(input) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.remove("field--invalid");
      var box = field.querySelector(".field__error");
      if (box) box.textContent = "";
      input.removeAttribute("aria-invalid");
    }

    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("input", function () { clearError(el); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = [];

      var name = form.elements.fullName;
      if (!name.value.trim()) problems.push([name, "Please write your name."]);

      var email = form.elements.email;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        problems.push([email, "That email address looks incomplete."]);
      }

      var tier = form.querySelector("input[name='tier']:checked");
      if (!tier) problems.push([form.querySelector("input[name='tier']"), "Choose one membership tier."]);

      var genre = form.elements.favoriteGenre;
      if (!genre.value) problems.push([genre, "Pick the shelf you browse first."]);

      var consent = form.elements.consent;
      if (!consent.checked) problems.push([consent, "We need your consent to send the member letter."]);

      if (problems.length) {
        problems.forEach(function (p) { setError(p[0], p[1]); });
        if (status) status.classList.remove("is-visible");
        problems[0][0].focus();
        return;
      }

      form.reset();
      form.querySelectorAll(".field--invalid").forEach(function (f) { f.classList.remove("field--invalid"); });
      if (status) {
        status.textContent = "Welcome to the club, " + name.value.trim().split(" ")[0] + ".";
        var extra = document.createElement("small");
        extra.textContent = "Your first parcel ships with the October reading list. Watch for a letter from Marguerite at " + email.value.trim() + " within two working days.";
        status.appendChild(extra);
        status.classList.add("is-visible");
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
    });
  }

  /* ---------- 06. Footer letter form ---------- */
  function initFooterForm() {
    var form = document.getElementById("letter-form");
    if (!form) return;
    var input = form.elements.letterEmail;
    var out = form.querySelector(".footer-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (!out) return;
      if (!ok) {
        out.textContent = "Enter a complete email address.";
        out.style.color = "var(--burgundy-light)";
        input.focus();
        return;
      }
      out.style.color = "";
      out.textContent = "Added — the next letter posts on Friday.";
      form.reset();
    });
  }

  /* ---------- 07. Event seat lines (aria-live count) ---------- */
  function initEvents() {
    var list = document.getElementById("event-list");
    if (!list) return;
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-event-genre]"));
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-event-filter]"));
    var rows = Array.prototype.slice.call(list.querySelectorAll(".event"));
    if (!rows.length) return;
    var empty = list.parentNode.querySelector(".shelf__empty");

    function show(genre) {
      var visible = 0;
      rows.forEach(function (r) {
        var match = genre === "all" || r.getAttribute("data-genre") === genre;
        r.hidden = !match;
        if (match) visible++;
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-event-filter") === genre ? "true" : "false");
      });
      chips.forEach(function (c) {
        var n = genre === "all" || c.getAttribute("data-event-genre") === genre;
        c.hidden = !n;
      });
      if (empty) empty.hidden = visible !== 0;
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-event-filter")); });
    });
  }

  /* ---------- 08. Colophon year ---------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- 09. Boot ---------- */
  function boot() {
    initNav();
    initDecode();
    initCounters();
    initShelf();
    initClubForm();
    initFooterForm();
    initEvents();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
