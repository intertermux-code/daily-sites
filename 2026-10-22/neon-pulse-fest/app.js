/* ==========================================================================
   NEON PULSE 2026 — shared behaviour
   Every block is guarded by element-existence checks so one file serves
   all five pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FEST_START = new Date("2026-12-18T18:00:00");

  /* ---------- 1. Mobile nav ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.querySelector("[data-nav-label]").textContent = open ? "menu" : "close";
    });

    nav.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.querySelector("[data-nav-label]").textContent = "menu";
        toggle.focus();
      }
    });
  }

  /* ---------- 2. Countdown to gates open ---------- */
  var clock = document.querySelector("[data-countdown]");

  if (clock) {
    var cells = {
      days: clock.querySelector("[data-unit='days']"),
      hours: clock.querySelector("[data-unit='hours']"),
      minutes: clock.querySelector("[data-unit='minutes']"),
      seconds: clock.querySelector("[data-unit='seconds']"),
    };
    var caption = document.querySelector("[data-countdown-caption]");
    var rafId = null;

    function pad(value, width) {
      var out = String(Math.max(0, value));
      while (out.length < width) out = "0" + out;
      return out;
    }

    function render() {
      var diff = FEST_START.getTime() - Date.now();

      if (diff <= 0) {
        cells.days.textContent = "00";
        cells.hours.textContent = "00";
        cells.minutes.textContent = "00";
        cells.seconds.textContent = "00";
        if (caption) caption.textContent = "// gates are open — signal live at warehouse district";
        return;
      }

      var total = Math.floor(diff / 1000);
      var days = Math.floor(total / 86400);
      var hours = Math.floor((total % 86400) / 3600);
      var minutes = Math.floor((total % 3600) / 60);
      var seconds = total % 60;

      cells.days.textContent = pad(days, days > 99 ? 3 : 2);
      cells.hours.textContent = pad(hours, 2);
      cells.minutes.textContent = pad(minutes, 2);
      cells.seconds.textContent = pad(seconds, 2);

      rafId = window.setTimeout(function () {
        requestAnimationFrame(render);
      }, 1000);
    }

    render();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        window.clearTimeout(rafId);
      } else {
        render();
      }
    });
  }

  /* ---------- 3. Cursor spotlight (rAF throttled) ---------- */
  var spotlightHosts = document.querySelectorAll("[data-spotlight]");

  if (spotlightHosts.length && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    spotlightHosts.forEach(function (host) {
      var pending = false;
      var lastX = 0;
      var lastY = 0;

      host.addEventListener("pointermove", function (event) {
        lastX = event.clientX;
        lastY = event.clientY;

        if (pending) return;
        pending = true;

        requestAnimationFrame(function () {
          pending = false;
          var rect = host.getBoundingClientRect();
          if (!rect.width) return;
          var x = ((lastX - rect.left) / rect.width) * 100;
          var y = ((lastY - rect.top) / rect.height) * 100;
          host.style.setProperty("--spot-x", x.toFixed(2) + "%");
          host.style.setProperty("--spot-y", y.toFixed(2) + "%");
          host.classList.add("spotlight--on");
        });
      });

      host.addEventListener("pointerleave", function () {
        host.classList.remove("spotlight--on");
      });
    });
  }

  /* ---------- 4. Decode text ---------- */
  var GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/\\[]{}=+*#%$&@";
  var decodeNodes = document.querySelectorAll("[data-decode]");

  decodeNodes.forEach(function (node) {
    var target = node.getAttribute("data-decode") || node.textContent.trim();

    if (reduceMotion) {
      node.textContent = target;
      return;
    }

    var delay = parseInt(node.getAttribute("data-decode-delay") || "0", 10);
    node.textContent = target.replace(/\S/g, "0");

    window.setTimeout(function () {
      var frame = 0;
      var perChar = 2.6;

      function tick() {
        var out = "";
        for (var i = 0; i < target.length; i++) {
          var ch = target.charAt(i);
          if (ch === " ") {
            out += " ";
            continue;
          }
          var settled = frame > i * perChar + 12;
          if (settled) {
            out += ch;
          } else if (frame > i * perChar - 6) {
            out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
          } else {
            out += "0";
          }
        }
        node.textContent = out;
        frame += 1;

        if (frame <= target.length * perChar + 14) {
          requestAnimationFrame(tick);
        } else {
          node.textContent = target;
        }
      }

      requestAnimationFrame(tick);
    }, delay);
  });

  /* ---------- 5. Ledger rows: expand into detail view ---------- */
  document.querySelectorAll("[data-ledger]").forEach(function (ledger) {
    var rows = ledger.querySelectorAll("[data-ledger-row]");

    rows.forEach(function (row) {
      var summary = row.querySelector(".ledger-row__summary");
      var detail = row.querySelector(".ledger-detail");
      if (!summary || !detail) return;

      var panelId = detail.id || "panel-" + Math.random().toString(36).slice(2, 8);
      detail.id = panelId;
      summary.setAttribute("aria-expanded", "false");
      summary.setAttribute("aria-controls", panelId);

      summary.addEventListener("click", function () {
        var open = row.getAttribute("data-state") === "open";

        rows.forEach(function (other) {
          other.setAttribute("data-state", "closed");
          var otherSummary = other.querySelector(".ledger-row__summary");
          if (otherSummary) otherSummary.setAttribute("aria-expanded", "false");
        });

        if (!open) {
          row.setAttribute("data-state", "open");
          summary.setAttribute("aria-expanded", "true");
        }
      });
    });
  });

  /* ---------- 6. Lineup filters ---------- */
  var lineup = document.querySelector("[data-lineup]");

  if (lineup) {
    var entries = Array.prototype.slice.call(lineup.querySelectorAll("[data-day]"));
    var statusEl = document.querySelector("[data-filter-status]");
    var emptyEl = document.querySelector("[data-empty-state]");
    var active = { day: "all", stage: "all" };

    function applyFilters() {
      var shown = 0;

      entries.forEach(function (entry) {
        var dayOk = active.day === "all" || entry.getAttribute("data-day") === active.day;
        var stageOk = active.stage === "all" || entry.getAttribute("data-stage") === active.stage;
        var visible = dayOk && stageOk;
        entry.hidden = !visible;
        if (visible) shown += 1;
        if (!visible && entry.getAttribute("data-state") === "open") {
          entry.setAttribute("data-state", "closed");
          var s = entry.querySelector(".ledger-row__summary");
          if (s) s.setAttribute("aria-expanded", "false");
        }
      });

      if (statusEl) {
        statusEl.textContent = shown + " / " + entries.length + " sets indexed";
      }
      if (emptyEl) {
        emptyEl.setAttribute("data-show", shown === 0 ? "true" : "false");
      }
    }

    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      var key = group.getAttribute("data-filter-group");

      group.addEventListener("click", function (event) {
        var chip = event.target.closest("[data-filter-value]");
        if (!chip) return;

        group.querySelectorAll("[data-filter-value]").forEach(function (btn) {
          btn.setAttribute("aria-pressed", String(btn === chip));
        });

        active[key] = chip.getAttribute("data-filter-value");
        applyFilters();
      });
    });

    var reset = document.querySelector("[data-filter-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        active = { day: "all", stage: "all" };
        document.querySelectorAll("[data-filter-value]").forEach(function (btn) {
          btn.setAttribute("aria-pressed", String(btn.getAttribute("data-filter-value") === "all"));
        });
        applyFilters();
      });
    }

    var requested = new URLSearchParams(window.location.search);
    ["day", "stage"].forEach(function (key) {
      var value = requested.get(key);
      if (!value || value === "all") return;
      var group = document.querySelector('[data-filter-group="' + key + '"]');
      var chip = group ? group.querySelector('[data-filter-value="' + value + '"]') : null;
      if (!chip) return;
      active[key] = value;
      group.querySelectorAll("[data-filter-value]").forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn === chip));
      });
    });

    applyFilters();
  }

  /* ---------- 7. FAQ accordion ---------- */
  document.querySelectorAll("[data-accordion]").forEach(function (accordion) {
    var items = accordion.querySelectorAll("[data-accordion-item]");
    var allowMultiple = accordion.getAttribute("data-accordion") === "multiple";

    items.forEach(function (item) {
      var button = item.querySelector("[data-accordion-trigger]");
      var panel = item.querySelector("[data-accordion-panel]");
      if (!button || !panel) return;

      var panelId = panel.id || "acc-" + Math.random().toString(36).slice(2, 8);
      panel.id = panelId;
      var initiallyOpen = item.getAttribute("data-state") === "open";
      if (!initiallyOpen) item.setAttribute("data-state", "closed");
      button.setAttribute("aria-expanded", String(initiallyOpen));
      button.setAttribute("aria-controls", panelId);

      button.addEventListener("click", function () {
        var open = item.getAttribute("data-state") === "open";

        if (!allowMultiple) {
          items.forEach(function (other) {
            other.setAttribute("data-state", "closed");
            var otherButton = other.querySelector("[data-accordion-trigger]");
            if (otherButton) otherButton.setAttribute("aria-expanded", "false");
          });
        }

        item.setAttribute("data-state", open ? "closed" : "open");
        button.setAttribute("aria-expanded", String(!open));
      });
    });
  });

  /* ---------- 8. Marquee: duplicate rows for seamless loop ---------- */
  document.querySelectorAll("[data-marquee]").forEach(function (marquee) {
    marquee.querySelectorAll(".marquee__row").forEach(function (row) {
      if (reduceMotion) return;
      var clones = row.innerHTML;
      row.insertAdjacentHTML("beforeend", clones);
      row.setAttribute("aria-hidden", "false");
      Array.prototype.forEach.call(row.children, function (child, index) {
        if (index >= row.children.length / 2) child.setAttribute("aria-hidden", "true");
      });
    });
  });

  /* ---------- 9. Gallery lightbox ---------- */
  var lightbox = document.querySelector("[data-lightbox]");

  if (lightbox) {
    var figure = lightbox.querySelector("figure");
    var lbImg = lightbox.querySelector("img");
    var lbTitle = lightbox.querySelector("[data-lightbox-title]");
    var lbMeta = lightbox.querySelector("[data-lightbox-meta]");
    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox-item]"));
    var index = 0;
    var lastFocused = null;

    function paint(entry) {
      var img = entry.querySelector("img");
      lbImg.src = entry.getAttribute("data-full") || (img ? img.src : "");
      lbImg.alt = img ? img.alt : "";
      lbTitle.textContent = entry.getAttribute("data-title") || "";
      lbMeta.textContent = entry.getAttribute("data-meta") || "";
    }

    function open(entry, position) {
      lastFocused = document.activeElement;
      index = position;
      paint(entry);
      lightbox.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
      lightbox.querySelector("[data-lightbox-close]").focus();
    }

    function close() {
      lightbox.setAttribute("data-open", "false");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    function step(direction) {
      if (!triggers.length) return;
      index = (index + direction + triggers.length) % triggers.length;
      paint(triggers[index]);
    }

    triggers.forEach(function (entry, position) {
      entry.addEventListener("click", function () {
        open(entry, position);
      });
    });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
      if (event.target.closest("[data-lightbox-close]")) close();
      if (event.target.closest("[data-lightbox-prev]")) step(-1);
      if (event.target.closest("[data-lightbox-next]")) step(1);
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.getAttribute("data-open") !== "true") return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });

    if (figure) figure.setAttribute("role", "dialog");
    if (figure) figure.setAttribute("aria-modal", "true");
    if (figure) figure.setAttribute("aria-label", "Photo viewer");
  }

  /* ---------- 10. Forms: local terminal-style confirmation ---------- */
  document.querySelectorAll("[data-demo-form]").forEach(function (form) {
    var status = form.querySelector("[data-form-status]");
    var successText = form.getAttribute("data-form-status-ok") || "// entry logged to the ledger";

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var invalid = false;
      form.querySelectorAll("[required]").forEach(function (input) {
        if (!input.value.trim()) {
          invalid = true;
          input.setAttribute("aria-invalid", "true");
        } else {
          input.removeAttribute("aria-invalid");
        }
      });

      if (!status) return;

      status.hidden = false;

      if (invalid) {
        status.setAttribute("data-tone", "error");
        status.textContent = "!! missing required field — check the rows marked above";
        return;
      }

      var name = form.querySelector("input[type='text'], input[type='email']");
      var who = name && name.value.trim() ? name.value.trim().split("@")[0] : "guest";

      status.removeAttribute("data-tone");
      status.textContent = "$ " + successText + "  →  receipt queued for " + who;
      form.reset();
    });
  });

  /* ---------- 11. Tier buy buttons: checkout handoff ---------- */
  var checkoutStatus = document.querySelector("[data-checkout-status]");
  var buyButtons = document.querySelectorAll(".tier__actions button");

  if (checkoutStatus && buyButtons.length) {
    buyButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var tier = button.closest(".tier");
        var name = tier ? tier.querySelector(".tier__name") : null;
        var stock = tier ? tier.querySelector(".tier__stock") : null;
        var label = name ? name.textContent.trim() : "selected pass";

        checkoutStatus.hidden = false;
        checkoutStatus.removeAttribute("data-tone");
        checkoutStatus.textContent =
          "// " + label + " held for 15:00 · secure checkout opens 24 Oct, window 3 · " +
          (stock ? stock.textContent.replace(/\s+/g, " ").trim() : "inventory confirmed");
      });
    });
  }

  /* ---------- 12. Footer stamp ---------- */
  var stamp = document.querySelector("[data-year]");
  if (stamp) stamp.textContent = String(new Date().getFullYear());
})();
