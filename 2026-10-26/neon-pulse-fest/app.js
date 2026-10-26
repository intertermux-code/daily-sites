/* ==========================================================================
   NEON PULSE FEST — shared behaviour
   Every block is guarded by an element-existence check so one file can be
   linked from every page.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;
  if (reduced) root.classList.add("no-motion");
  if (typeof reduceQuery.addEventListener === "function") {
    reduceQuery.addEventListener("change", function (e) {
      reduced = e.matches;
      root.classList.toggle("no-motion", reduced);
    });
  }

  /* ------------------------------------------------------------------
     1. Scroll progress — 2px bar pinned to the viewport top (signature)
     ------------------------------------------------------------------ */
  function initScrollProgress() {
    var host = document.querySelector("[data-scroll-progress]");
    if (!host) return;
    var bar = host.querySelector(".scroll-progress__bar");
    if (!bar) return;
    var queued = false;

    function paint() {
      queued = false;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      ratio = Math.min(1, Math.max(0, ratio));
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      host.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    }

    function request() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(paint);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    paint();
  }

  /* ------------------------------------------------------------------
     2. Word-stagger headline — assigns the 60ms cadence (signature)
     ------------------------------------------------------------------ */
  function initWordStagger() {
    var heads = document.querySelectorAll("[data-stagger]");
    if (!heads.length) return;
    Array.prototype.forEach.call(heads, function (head) {
      var words = head.querySelectorAll(".word");
      Array.prototype.forEach.call(words, function (word, i) {
        word.style.setProperty("--d", i * 60 + "ms");
      });
    });
  }

  /* ------------------------------------------------------------------
     3. Countdown to gates open
     ------------------------------------------------------------------ */
  function pad(n, size) {
    var s = String(Math.max(0, Math.floor(n)));
    while (s.length < (size || 2)) s = "0" + s;
    return s;
  }

  function initCountdown() {
    var box = document.querySelector("[data-countdown]");
    if (!box) return;
    var target = new Date(box.getAttribute("data-countdown"));
    if (isNaN(target.getTime())) return;

    var cells = {
      days: box.querySelector("[data-cd-days]"),
      hours: box.querySelector("[data-cd-hours]"),
      minutes: box.querySelector("[data-cd-minutes]"),
      seconds: box.querySelector("[data-cd-seconds]")
    };
    var status = box.querySelector("[data-countdown-status]");

    function tick() {
      var left = target.getTime() - Date.now();
      if (left <= 0) {
        if (cells.days) cells.days.textContent = "00";
        if (cells.hours) cells.hours.textContent = "00";
        if (cells.minutes) cells.minutes.textContent = "00";
        if (cells.seconds) cells.seconds.textContent = "00";
        if (status) status.textContent = "Gates are open — pulse live at the reactor.";
        box.classList.add("countdown--live");
        window.clearInterval(timer);
        return;
      }
      var secs = Math.floor(left / 1000);
      if (cells.days) cells.days.textContent = pad(secs / 86400);
      if (cells.hours) cells.hours.textContent = pad((secs % 86400) / 3600);
      if (cells.minutes) cells.minutes.textContent = pad((secs % 3600) / 60);
      if (cells.seconds) cells.seconds.textContent = pad(secs % 60);
    }

    tick();
    var timer = window.setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------
     4. Mobile navigation
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;

    toggle.setAttribute("aria-expanded", "false");
    nav.setAttribute("data-nav-state", "closed");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      nav.setAttribute("data-nav-state", open ? "open" : "closed");
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1000) setOpen(false);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     5. Lineup filters (day × stage)
     ------------------------------------------------------------------ */
  function initLineup() {
    var grid = document.querySelector("[data-lineup-grid]");
    var group = document.querySelector("[data-filter-group]");
    if (!grid || !group) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-artist]"));
    var status = document.querySelector("[data-filter-status]");
    var empty = document.querySelector("[data-lineup-empty]");
    var active = { day: "all", stage: "all" };

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var dayOk = active.day === "all" || card.getAttribute("data-day") === active.day;
        var stageOk = active.stage === "all" ||
          (card.getAttribute("data-stages") || "").split(" ").indexOf(active.stage) > -1;
        var visible = dayOk && stageOk;
        card.classList.toggle("is-hidden", !visible);
        card.setAttribute("aria-hidden", visible ? "false" : "true");
        if (visible) shown++;
      });

      if (status) {
        status.textContent = "❯ showing " + pad(shown) + " of " + pad(cards.length) +
          " acts — " + (active.day === "all" ? "all days" : active.day) +
          " / " + (active.stage === "all" ? "all stages" : active.stage);
      }
      if (empty) empty.hidden = shown !== 0;
    }

    group.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-filter]");
      if (!chip) return;
      var kind = chip.getAttribute("data-filter");
      var value = chip.getAttribute("data-value");
      active[kind] = value;

      Array.prototype.forEach.call(group.querySelectorAll('[data-filter="' + kind + '"]'), function (sibling) {
        sibling.setAttribute("aria-pressed", sibling === chip ? "true" : "false");
      });
      apply();
    });

    apply();
  }

  /* ------------------------------------------------------------------
     6. FAQ accordion
     ------------------------------------------------------------------ */
  function initAccordion() {
    var accordion = document.querySelector("[data-accordion]");
    if (!accordion) return;

    var buttons = Array.prototype.slice.call(accordion.querySelectorAll(".accordion__btn"));

    buttons.forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.setAttribute("aria-expanded", btn.getAttribute("aria-expanded") || "false");
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", btn.id);

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";

        if (accordion.hasAttribute("data-single-open")) {
          buttons.forEach(function (other) {
            var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
            if (other === btn) return;
            other.setAttribute("aria-expanded", "false");
            if (otherPanel) otherPanel.setAttribute("data-open", "false");
          });
        }

        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        panel.setAttribute("data-open", isOpen ? "false" : "true");
        if (!isOpen) {
          panel.style.setProperty("--panel-h", panel.scrollHeight + 40 + "px");
        }
      });
    });

    window.addEventListener("resize", function () {
      buttons.forEach(function (btn) {
        if (btn.getAttribute("aria-expanded") !== "true") return;
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (panel) panel.style.setProperty("--panel-h", panel.scrollHeight + 40 + "px");
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     7. Ticket builder + running total
     ------------------------------------------------------------------ */
  function initTicketBuilder() {
    var builder = document.querySelector("[data-ticket-builder]");
    if (!builder) return;

    var summary = document.querySelector("[data-order-summary]");
    var MAX = 8;

    function readRows() {
      var rows = [];
      Array.prototype.forEach.call(builder.querySelectorAll("[data-price]"), function (row) {
        var input = row.querySelector("[data-qty]");
        if (!input) return;
        rows.push({
          row: row,
          input: input,
          name: row.getAttribute("data-label") || "Ticket",
          price: parseFloat(row.getAttribute("data-price")),
          soldOut: row.getAttribute("data-sold-out") === "true",
          qty: Math.max(0, parseInt(input.value, 10) || 0)
        });
      });
      return rows;
    }

    function paint() {
      var rows = readRows();
      var subtotal = 0;
      var count = 0;

      rows.forEach(function (item) {
        var lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        count += item.qty;
        var line = item.row.querySelector("[data-line-total]");
        if (line) line.textContent = "£" + lineTotal.toFixed(2);
        var minus = item.row.querySelector("[data-step='-1']");
        var plus = item.row.querySelector("[data-step='1']");
        if (minus) minus.disabled = item.qty <= 0 || item.soldOut;
        if (plus) plus.disabled = item.qty >= MAX || item.soldOut;
      });

      var fees = count > 0 ? Math.round(subtotal * 0.09 * 100) / 100 : 0;
      var total = subtotal + fees;

      if (summary) {
        var sCount = summary.querySelector("[data-sum-count]");
        var sSub = summary.querySelector("[data-sum-subtotal]");
        var sFee = summary.querySelector("[data-sum-fees]");
        var sTotal = summary.querySelector("[data-sum-total]");
        var sNote = summary.querySelector("[data-sum-note]");
        if (sCount) sCount.textContent = pad(count);
        if (sSub) sSub.textContent = "£" + subtotal.toFixed(2);
        if (sFee) sFee.textContent = "£" + fees.toFixed(2);
        if (sTotal) sTotal.textContent = "£" + total.toFixed(2);
        if (sNote) sNote.textContent = count === 0
          ? "No passes held yet. Add a tier to reserve."
          : count + (count === 1 ? " pass held for 15:00" : " passes held for 15:00") + " — checkout not started.";
        var confirm = summary.querySelector("[data-sum-confirm]");
        if (confirm) {
          confirm.setAttribute("aria-disabled", count === 0 ? "true" : "false");
          confirm.disabled = count === 0;
        }
      }
    }

    builder.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-step]");
      if (!btn) return;
      var row = btn.closest("[data-price]");
      var input = row && row.querySelector("[data-qty]");
      if (!input || input.disabled) return;
      var next = (parseInt(input.value, 10) || 0) + parseInt(btn.getAttribute("data-step"), 10);
      input.value = String(Math.min(MAX, Math.max(0, next)));
      paint();
    });

    builder.addEventListener("change", function (event) {
      if (event.target.matches("[data-qty]")) paint();
    });

    paint();
  }

  /* ------------------------------------------------------------------
     8. Gallery — seamless marquee + lightbox
     ------------------------------------------------------------------ */
  function initGallery() {
    var tracks = document.querySelectorAll("[data-marquee-track]");
    if (tracks.length) {
      Array.prototype.forEach.call(tracks, function (track) {
        if (track.getAttribute("data-duplicated") === "true") return;
        var children = Array.prototype.slice.call(track.children);
        children.forEach(function (child) {
          var clone = child.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          Array.prototype.forEach.call(clone.querySelectorAll("button"), function (b) { b.disabled = true; });
          track.appendChild(clone);
        });
        track.setAttribute("data-duplicated", "true");
      });
    }

    var lightbox = document.querySelector("[data-lightbox]");
    var grids = document.querySelectorAll("[data-shot-grid]");
    if (!lightbox || !grids.length) return;

    var img = lightbox.querySelector("img");
    var cap = lightbox.querySelector("figcaption");
    var closeBtn = lightbox.querySelector("[data-lightbox-close]");
    var lastFocus = null;

    function open(src, alt, text) {
      img.src = src;
      img.alt = alt;
      cap.textContent = text;
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      root.style.overflow = "hidden";
      closeBtn.focus();
    }

    function close() {
      lightbox.hidden = true;
      root.style.overflow = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    Array.prototype.forEach.call(grids, function (grid) {
      grid.addEventListener("click", function (event) {
        var shot = event.target.closest("[data-shot-src]");
        if (!shot) return;
        var figure = shot.closest(".shot") || shot.closest(".postcard") || shot;
        var caption = figure.getAttribute("data-shot-cap") || shot.getAttribute("aria-label") || "Festival photograph";
        open(shot.getAttribute("data-shot-src"), shot.getAttribute("data-shot-alt") || caption, caption);
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
    });
    document.addEventListener("keydown", function (event) {
      if (!lightbox.hidden && event.key === "Escape") close();
    });
  }

  /* ------------------------------------------------------------------
     9. Forms — client-side validation + inline status
     ------------------------------------------------------------------ */
  function initForms() {
    var forms = document.querySelectorAll("[data-form]");
    if (!forms.length) return;

    Array.prototype.forEach.call(forms, function (form) {
      var status = form.querySelector("[data-form-status]");

      function validate() {
        var ok = true;
        var firstBad = null;
        var fields = form.querySelectorAll("[data-required], [data-pattern]");

        Array.prototype.forEach.call(fields, function (input) {
          var field = input.closest(".field") || input;
          var value = input.type === "checkbox" ? (input.checked ? "on" : "") : (input.value || "").trim();
          var problem = "";

          if (input.hasAttribute("data-required") && !value) {
            problem = input.getAttribute("data-name") + " is required.";
          } else if (value && input.hasAttribute("data-pattern") &&
            !new RegExp(input.getAttribute("data-pattern")).test(value)) {
            problem = "That " + (input.getAttribute("data-name") || "entry") + " does not look right.";
          }

          if (problem) {
            ok = false;
            field.setAttribute("data-invalid", "true");
            var err = form.querySelector('[data-error-for="' + input.id + '"]');
            if (err) err.textContent = problem;
            if (!firstBad) firstBad = input;
          } else {
            field.removeAttribute("data-invalid");
            var clean = form.querySelector('[data-error-for="' + input.id + '"]');
            if (clean) clean.textContent = "";
          }
        });

        if (!ok && firstBad) firstBad.focus();
        return ok;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!validate()) {
          if (status) {
            status.hidden = false;
            status.textContent = "CHECK FAILED ❯ fix the highlighted fields and submit again.";
            status.style.borderColor = "var(--magenta)";
            status.style.color = "var(--magenta)";
            status.style.background = "rgba(255,47,179,0.1)";
          }
          return;
        }
        var name = form.querySelector("[data-greet]");
        var who = name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : "friend";
        if (status) {
          status.hidden = false;
          status.style.borderColor = "";
          status.style.color = "";
          status.style.background = "";
          status.textContent = "TRANSMISSION LOGGED ❯ " + who + ", you are on the list. Watch your inbox for the drop.";
        }
        form.reset();
      });

      form.addEventListener("input", function (event) {
        var input = event.target;
        if (!input.closest) return;
        var field = input.closest(".field");
        if (field && field.getAttribute("data-invalid") === "true" && (input.value || "").trim()) {
          field.removeAttribute("data-invalid");
          var err = form.querySelector('[data-error-for="' + input.id + '"]');
          if (err) err.textContent = "";
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     10. Small shared niceties
     ------------------------------------------------------------------ */
  function initMisc() {
    var year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

  }

  /* ------------------------------------------------------------------ */
  function boot() {
    initScrollProgress();
    initWordStagger();
    initCountdown();
    initNav();
    initLineup();
    initAccordion();
    initTicketBuilder();
    initGallery();
    initForms();
    initMisc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
