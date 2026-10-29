/* ==========================================================================
   FORGE — shared behaviour
   Signature motion: Marquee Ticker (CSS) + Parallax Layers (single rAF).
   Every module is guarded by an element-existence check.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var doc = document;

  /* ---------- Status strip clock + open state ---------- */
  function initClock() {
    var clock = doc.getElementById("clock");
    var openState = doc.getElementById("openState");
    var dot = doc.querySelector(".status-strip .dot");
    if (!clock || !openState) return;

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function tick() {
      var now = new Date();
      clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
      var h = now.getHours() + now.getMinutes() / 60;
      var open = h >= 5 && h < 23;
      openState.innerHTML = "STATUS: <strong>" + (open ? "OPEN 05:00–23:00" : "CLOSED — RESERVES OPEN") + "</strong>";
      if (dot) dot.classList.toggle("dot--closed", !open);
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- Primary nav (keyboard operable) ---------- */
  function initNav() {
    var toggle = doc.querySelector(".menu-toggle");
    var nav = doc.getElementById("primaryNav");
    if (!toggle || !nav) return;

    var scrim = doc.createElement("div");
    scrim.className = "nav__scrim";
    scrim.setAttribute("aria-hidden", "true");
    nav.parentNode.insertBefore(scrim, nav.nextSibling);

    var lastFocus = null;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      scrim.classList.toggle("is-open", open);
      doc.body.classList.toggle("is-locked", open);
      toggle.querySelector(".menu-toggle__text").textContent = open ? "Close" : "Menu";
      if (open) {
        lastFocus = doc.activeElement;
        var first = nav.querySelector("a");
        if (first) first.focus();
      } else if (lastFocus) {
        lastFocus.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    scrim.addEventListener("click", function () { setOpen(false); });

    doc.addEventListener("keydown", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "Tab") {
        var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
        if (!links.length) return;
        var all = [toggle].concat(links);
        var idx = all.indexOf(doc.activeElement);
        if (e.shiftKey && idx <= 0) { e.preventDefault(); all[all.length - 1].focus(); }
        else if (!e.shiftKey && idx === all.length - 1) { e.preventDefault(); all[0].focus(); }
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
    });
  }

  /* ---------- Parallax layers (rAF, transform only) ---------- */
  function initParallax() {
    var layers = doc.querySelectorAll("[data-speed]");
    if (!layers.length || reduceMotion.matches) return;

    var ticking = false;
    var node = Array.prototype.slice.call(layers);

    function apply() {
      var y = window.pageYOffset || doc.documentElement.scrollTop || 0;
      for (var i = 0; i < node.length; i++) {
        var speed = parseFloat(node[i].getAttribute("data-speed")) || 0;
        node[i].style.transform = "translate3d(0," + (y * speed).toFixed(2) + "px,0)";
      }
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
  }

  /* ---------- Ticker: keep the loop alive only while visible ---------- */
  function initTickers() {
    var tickers = doc.querySelectorAll(".ticker__track");
    if (!tickers.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion.matches) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      });
    }, { rootMargin: "120px 0px" });

    Array.prototype.forEach.call(tickers, function (t) { io.observe(t); });
  }

  /* ---------- Hero boot typewriter ---------- */
  function initBoot() {
    var lines = doc.querySelectorAll("[data-boot]");
    if (!lines.length) return;

    if (reduceMotion.matches) {
      Array.prototype.forEach.call(lines, function (el) {
        el.textContent = el.getAttribute("data-boot");
      });
      return;
    }

    var i = 0;
    function type(el, text, done) {
      var n = 0;
      el.textContent = "";
      var id = window.setInterval(function () {
        n += 1;
        el.textContent = text.slice(0, n) + (n < text.length ? "█" : "");
        if (n >= text.length) {
          window.clearInterval(id);
          el.textContent = text;
          done();
        }
      }, 18);
    }

    function next() {
      if (i >= lines.length) return;
      var el = lines[i];
      type(el, el.getAttribute("data-boot"), function () { i += 1; window.setTimeout(next, 130); });
    }
    next();
  }

  /* ---------- Ledger: registry rows expand into detail ---------- */
  function initLedger() {
    var rows = doc.querySelectorAll(".ledger__row");
    if (!rows.length) return;

    Array.prototype.forEach.call(rows, function (row) {
      var btn = row.querySelector(".ledger__btn");
      var panel = row.querySelector(".ledger__panel");
      if (!btn || !panel) return;

      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", btn.id);

      btn.addEventListener("click", function () {
        var isOpen = row.getAttribute("data-open") === "true";

        // A ledger shows one open record at a time per registry.
        var siblings = row.parentNode.querySelectorAll('.ledger__row[data-open="true"]');
        Array.prototype.forEach.call(siblings, function (other) {
          if (other === row) return;
          close(other);
        });

        if (isOpen) close(row); else open(row);
      });

      function open(target) {
        var b = target.querySelector(".ledger__btn");
        var p = target.querySelector(".ledger__panel");
        var t = target.querySelector(".ledger__toggle .txt");
        target.setAttribute("data-open", "true");
        b.setAttribute("aria-expanded", "true");
        p.hidden = false;
        if (t) t.textContent = "Close";
        window.requestAnimationFrame(function () { p.classList.add("is-live"); });
      }

      function close(target) {
        var b = target.querySelector(".ledger__btn");
        var p = target.querySelector(".ledger__panel");
        var t = target.querySelector(".ledger__toggle .txt");
        target.setAttribute("data-open", "false");
        b.setAttribute("aria-expanded", "false");
        p.classList.remove("is-live");
        p.hidden = true;
        if (t) t.textContent = "Open";
      }
    });

    // Deep link into a record: programs.html#powerlifting
    var hash = (window.location.hash || "").replace("#", "");
    if (hash) {
      var target = doc.getElementById(hash);
      if (target && target.classList.contains("ledger__row")) {
        var opener = target.querySelector(".ledger__btn");
        target.setAttribute("data-open", "true");
        opener.setAttribute("aria-expanded", "true");
        var openPanel = target.querySelector(".ledger__panel");
        openPanel.hidden = false;
        var txt = target.querySelector(".ledger__toggle .txt");
        if (txt) txt.textContent = "Close";
        window.requestAnimationFrame(function () { openPanel.classList.add("is-live"); });
      }
    }
  }

  /* ---------- Schedule: filter ledger by day + discipline ---------- */
  function initSchedule() {
    var grid = doc.getElementById("scheduleBody");
    var dayBar = doc.getElementById("dayFilter");
    if (!grid || !dayBar) return;

    var catBar = doc.getElementById("catFilter");
    var readout = doc.getElementById("scheduleReadout");
    var empty = doc.getElementById("scheduleEmpty");
    var rows = Array.prototype.slice.call(grid.querySelectorAll("[data-day]"));
    var state = { day: "all", cat: "all" };

    function apply() {
      var shown = 0;
      rows.forEach(function (row) {
        var dayOk = state.day === "all" || row.getAttribute("data-day") === state.day;
        var catOk = state.cat === "all" || row.getAttribute("data-cat") === state.cat;
        var match = dayOk && catOk;
        row.classList.toggle("is-hidden-row", !match);
        if (match) shown += 1;
      });
      if (readout) readout.textContent = shown + " OF " + rows.length + " SESSIONS · " + (state.day === "all" ? "FULL WEEK" : state.day.toUpperCase()) + (state.cat === "all" ? "" : " / " + state.cat.toUpperCase());
      if (empty) empty.hidden = shown !== 0;
    }

    function wire(bar, key) {
      if (!bar) return;
      bar.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip || !bar.contains(chip)) return;
        Array.prototype.forEach.call(bar.querySelectorAll(".chip"), function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        state[key] = chip.getAttribute("data-value");
        apply();
      });
    }

    wire(dayBar, "day");
    wire(catBar, "cat");

    // Deep link: schedule.html#wednesday
    var hash = (window.location.hash || "").replace("#", "");
    if (hash) {
      var preset = dayBar.querySelector('[data-value="' + hash + '"]');
      if (preset) {
        Array.prototype.forEach.call(dayBar.querySelectorAll(".chip"), function (c) {
          c.setAttribute("aria-pressed", c === preset ? "true" : "false");
        });
        state.day = hash;
      }
    }
    apply();
  }

  /* ---------- BMI / load calculator ---------- */
  function initCalc() {
    var form = doc.getElementById("bmiForm");
    if (!form) return;

    var out = doc.getElementById("bmiOut");
    var result = doc.getElementById("bmiResult");
    var verdict = doc.getElementById("bmiVerdict");
    var note = doc.getElementById("bmiNote");
    var marker = doc.getElementById("bmiMarker");
    var cmInput = doc.getElementById("height");
    var kgInput = doc.getElementById("weight");
    if (!out || !result || !verdict || !note || !cmInput || !kgInput) return;

    var BANDS = [
      { max: 18.5, label: "Under reference weight", copy: "Fuel first. Our On-Ramp block pairs three loaded sessions a week with a deliberate calorie surplus — a coach sets the intake target before you touch a barbell." },
      { max: 25, label: "Within reference band", copy: "Good platform for strength work. At Forge we push past the reference band into a lifting target — we measure the barbell, not the ratio." },
      { max: 30, label: "Above reference band", copy: "Conditioning-led start. Two HIIT sessions plus two barbell sessions per week moves body composition without giving up load." },
      { max: 999, label: "Well above reference band", copy: "Speak to a coach before loading a barbell. Mobility and sled work for weeks 1–4, then we progress on your numbers, not a chart." }
    ];

    function bandOf(bmi) {
      for (var i = 0; i < BANDS.length; i++) { if (bmi < BANDS[i].max) return BANDS[i]; }
      return BANDS[BANDS.length - 1];
    }

    function calc() {
      var cm = parseFloat(cmInput.value);
      var kg = parseFloat(kgInput.value);
      if (!isFinite(cm) || !isFinite(kg) || cm < 120 || cm > 230 || kg < 30 || kg > 250) {
        result.textContent = "--.-";
        verdict.textContent = "Awaiting valid input";
        note.textContent = "Enter height between 120 and 230 cm and bodyweight between 30 and 250 kg.";
        out.removeAttribute("data-show");
        return;
      }
      var m = cm / 100;
      var bmi = kg / (m * m);
      var shown = Math.round(bmi * 10) / 10;
      var band = bandOf(bmi);
      result.textContent = shown.toFixed(1);
      verdict.textContent = band.label.toUpperCase();
      note.textContent = band.copy;
      out.setAttribute("data-show", "true");
      if (marker) {
        var pos = Math.max(0, Math.min(100, ((bmi - 14) / (40 - 14)) * 100));
        marker.style.left = pos.toFixed(1) + "%";
      }
      var target = Math.round(22 * m * m);
      var slot = doc.getElementById("targetKg");
      if (slot) slot.textContent = target + " KG";
    }

    var range = doc.getElementById("heightRange");
    if (range) {
      range.addEventListener("input", function () {
        cmInput.value = range.value;
        calc();
      });
      cmInput.addEventListener("input", function () {
        if (cmInput.value) range.value = Math.max(120, Math.min(230, cmInput.value));
      });
    }

    [cmInput, kgInput].forEach(function (el) {
      el.addEventListener("input", calc);
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); calc(); });
    calc();
  }

  /* ---------- Trial signup form ---------- */
  function initTrialForm() {
    var form = doc.getElementById("trialForm");
    if (!form) return;

    var status = doc.getElementById("trialStatus");
    var name = doc.getElementById("trialName");
    var email = doc.getElementById("trialEmail");
    var phone = doc.getElementById("trialPhone");
    var slot = doc.getElementById("trialSlot");
    var consent = doc.getElementById("trialConsent");

    function setError(field, message) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("has-error", Boolean(message));
      var errEl = wrap.querySelector(".error");
      if (errEl) errEl.textContent = message || "";
      field.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validators() {
      return [
        { el: name, ok: name.value.trim().length >= 2, msg: "Enter the name we should put on the door list." },
        { el: email, ok: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()), msg: "Enter a valid email address so we can confirm your slot." },
        { el: phone, ok: phone.value.trim() === "" || phone.value.trim().replace(/\D/g, "").length >= 8, msg: "Use at least 8 digits, or leave the field empty." },
        { el: slot, ok: slot.value !== "", msg: "Pick the session you want to walk into." },
        { el: consent, ok: consent.checked, msg: "Tick the waiver line so a coach can clear you for the floor." }
      ];
    }

    validators().forEach(function (v) {
      v.el.addEventListener("blur", function () {
        if (v.el.type === "checkbox") return;
        setError(v.el, v.ok ? "" : v.msg);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var list = validators();
      var bad = list.filter(function (v) { return !v.ok; });
      list.forEach(function (v) { setError(v.el, v.ok ? "" : v.msg); });
      if (bad.length) {
        bad[0].el.focus();
        if (status) status.setAttribute("data-show", "false");
        return;
      }

      var first = name.value.trim().split(/\s+/)[0];
      var slotLabel = slot.options[slot.selectedIndex].text;
      if (status) {
        status.textContent = "";
        var h3 = doc.createElement("h3");
        h3.textContent = "Slot reserved — " + first;
        var p = doc.createElement("p");
        p.appendChild(doc.createTextNode("Confirmation queued to "));
        var mail = doc.createElement("strong");
        mail.textContent = email.value.trim();
        p.appendChild(mail);
        p.appendChild(doc.createTextNode(" . Report to the front desk 15 minutes before "));
        var chosen = doc.createElement("strong");
        chosen.textContent = slotLabel;
        p.appendChild(chosen);
        p.appendChild(doc.createTextNode(", reference code FORGE-" + code() + ". A coach will meet you at the door."));
        status.appendChild(h3);
        status.appendChild(p);
        status.setAttribute("data-show", "true");
        status.focus();
      }
      form.reset();
      validators().forEach(function (v) { setError(v.el, ""); });
    });

    function code() {
      return String(Math.floor(1000 + Math.random() * 8999));
    }
  }

  /* ---------- Enquiry form (contact-less pages: footer command bar) ---------- */
  function initCommandBar() {
    var bar = doc.getElementById("commandBar");
    if (!bar) return;
    var input = doc.getElementById("commandInput");
    var readout = doc.getElementById("commandReadout");
    var queue = [
      "trial — first session free, book a slot",
      "schedule — 61 coached sessions each week",
      "membership — three rates, cancel with 30 days notice",
      "coaches — six head coaches, all on the floor",
      " programmes — powerlifting, hiit, mobility"
    ];

    bar.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = (input.value || "").trim().toLowerCase();
      if (!q) {
        readout.textContent = "ERR · EMPTY QUERY — type trial, schedule, membership or coaches";
        return;
      }
      var hit = queue.filter(function (line) { return line.indexOf(q) === 0 || q.indexOf(line.split(" — ")[0]) === 0; })[0];
      readout.textContent = hit ? "> " + hit : "> NOT FOUND · '" + q + "' — nearest match: /trial";
      input.value = "";
    });
  }

  /* ---------- Copy block (ledger utility) ---------- */
  function initCopy() {
    var btns = doc.querySelectorAll("[data-copy]");
    if (!btns.length || !navigator.clipboard) return;
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        navigator.clipboard.writeText(text).then(function () {
          var old = btn.textContent;
          btn.textContent = "Copied";
          window.setTimeout(function () { btn.textContent = old; }, 1600);
        }).catch(function () { /* clipboard blocked; leave button as-is */ });
      });
    });
  }

  /* ---------- Year stamp ---------- */
  function initYear() {
    var slots = doc.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(slots, function (el) { el.textContent = y; });
  }

  function boot() {
    initClock();
    initNav();
    initParallax();
    initTickers();
    initBoot();
    initLedger();
    initSchedule();
    initCalc();
    initTrialForm();
    initCommandBar();
    initCopy();
    initYear();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
