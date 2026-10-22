/* ============================================================
   COPPERLINE BREWING CO. — shared behaviour
   Signature motion: (1) scroll progress bar, (2) animated counters.
   Everything is guarded by element-existence checks so one file
   serves every page.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var doc = document;
  doc.documentElement.classList.add("js");

  function on(selector, fn) {
    var el = doc.querySelector(selector);
    if (el) fn(el);
  }
  function all(selector, fn) {
    Array.prototype.forEach.call(doc.querySelectorAll(selector), fn);
  }
  function supportsIO() {
    return "IntersectionObserver" in window;
  }

  /* ----------------------------------------------------------
     1. Scroll progress — 2px bar pinned to the viewport top
     ---------------------------------------------------------- */
  (function scrollProgress() {
    var bar = doc.querySelector(".progress");
    if (!bar) return;
    var queued = false;

    function paint() {
      queued = false;
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      var ratio = h > 0 ? Math.min(Math.max(window.pageYOffset / h, 0), 1) : 0;
      bar.style.setProperty("--sp", ratio.toFixed(4));
    }
    function request() {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(paint);
      }
    }
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    paint();
  })();

  /* ----------------------------------------------------------
     2. Animated counters — 0 -> target, easeOutExpo, 1.2s
     ---------------------------------------------------------- */
  (function counters() {
    var nums = doc.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function format(value, decimals, grouping) {
      var out = value.toFixed(decimals);
      if (!grouping) return out;
      var parts = out.split(".");
      parts[0] = Number(parts[0]).toLocaleString("en-US");
      return parts.join(".");
    }

    function render(el, value) {
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var grouping = el.getAttribute("data-group") !== "off";
      el.textContent = format(value, decimals, grouping);
    }

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (isNaN(target)) return;
      if (reduce.matches) {
        render(el, target);
        return;
      }
      var duration = 1200;
      var start = null;
      render(el, 0);

      function tick(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        render(el, target * eased);
        if (t < 1) window.requestAnimationFrame(tick);
        else render(el, target);
      }
      window.requestAnimationFrame(tick);
    }

    if (!supportsIO()) {
      Array.prototype.forEach.call(nums, run);
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
      { threshold: 0.4 }
    );
    Array.prototype.forEach.call(nums, function (el) {
      render(el, 0);
      io.observe(el);
    });
  })();

  /* ----------------------------------------------------------
     3. Mosaic wall — tiles lock into the grid as they enter
     ---------------------------------------------------------- */
  (function mosaic() {
    all(".mosaic", function (wall) {
      Array.prototype.forEach.call(wall.children, function (tile, i) {
        tile.style.setProperty("--i", i % 12);
      });
      if (reduce.matches || !supportsIO()) {
        wall.classList.add("is-locked");
        return;
      }
      var io = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) {
            wall.classList.add("is-locked");
            io.disconnect();
          }
        },
        { threshold: 0.12 }
      );
      io.observe(wall);
    });
  })();

  /* ----------------------------------------------------------
     4. Age gate (21+) — index.html only
     ---------------------------------------------------------- */
  (function ageGate() {
    var gate = doc.getElementById("agegate");
    if (!gate) return;
    var KEY = "copperline.age-verified";
    var verified = false;
    try {
      verified = window.sessionStorage.getItem(KEY) === "yes";
    } catch (err) {
      verified = false;
    }

    if (verified) {
      gate.hidden = true;
      return;
    }

    gate.hidden = false;
    doc.body.classList.add("locked");
    var first = gate.querySelector("[data-age-yes]");
    if (first) first.focus();

    function trap(event) {
      if (event.key !== "Tab") return;
      var focusables = gate.querySelectorAll("button, [href], input");
      if (!focusables.length) return;
      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && doc.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && doc.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    gate.addEventListener("keydown", trap);

    on("[data-age-yes]", function (btn) {
      btn.addEventListener("click", function () {
        try {
          window.sessionStorage.setItem(KEY, "yes");
        } catch (err) {
          /* storage blocked: gate still clears for this page view */
        }
        gate.hidden = true;
        doc.body.classList.remove("locked");
        gate.removeEventListener("keydown", trap);
        var main = doc.getElementById("main");
        if (main) main.focus();
      });
    });

    on("[data-age-no]", function (btn) {
      btn.addEventListener("click", function () {
        var msg = gate.querySelector(".agegate__denied");
        if (msg) {
          msg.textContent = "Sorry — our taproom is 21 and over. Come back when you are.";
        }
      });
    });
  })();

  /* ----------------------------------------------------------
     5. Mobile navigation
     ---------------------------------------------------------- */
  (function nav() {
    var burger = doc.querySelector(".burger");
    var menu = doc.querySelector(".nav");
    if (!burger || !menu) return;

    function setOpen(open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("data-open", open ? "true" : "false");
    }
    setOpen(false);

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setOpen(false);
    });
  })();

  /* ----------------------------------------------------------
     6. Beer grid — filter + detail modal (beers.html)
     ---------------------------------------------------------- */
  (function beers() {
    var grid = doc.getElementById("beer-grid");
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".beer"));

    /* Filters */
    all("[data-filter]", function (btn) {
      btn.addEventListener("click", function () {
        var want = btn.getAttribute("data-filter");
        all("[data-filter]", function (other) {
          other.setAttribute("aria-pressed", other === btn ? "true" : "false");
        });
        var shown = 0;
        cards.forEach(function (card) {
          var match = want === "all" || card.getAttribute("data-style-group") === want;
          card.hidden = !match;
          if (match) shown += 1;
        });
        var count = doc.getElementById("beer-count");
        var empty = doc.getElementById("beer-empty");
        if (count) count.textContent = shown;
        if (empty) empty.hidden = shown !== 0;
      });
    });

    /* Detail modal */
    var overlay = doc.getElementById("beer-modal");
    var dialog = overlay && overlay.querySelector("[role='dialog']");
    if (!overlay || !dialog) return;
    var lastFocus = null;

    var FIELDS = {
      name: "h2[data-field='name']",
      style: "[data-field='style']",
      abv: "[data-field='abv']",
      ibu: "[data-field='ibu']",
      srm: "[data-field='srm']",
      season: "[data-field='season']",
      notes: "[data-field='notes']",
      malt: "[data-field='malt']",
      hops: "[data-field='hops']",
      yeast: "[data-field='yeast']",
      pairing: "[data-field='pairing']",
      batch: "[data-field='batch']",
      availability: "[data-field='availability']"
    };

    function set(field, value) {
      var el = dialog.querySelector(FIELDS[field]);
      if (el) el.textContent = value || el.getAttribute("data-fallback") || "—";
    }

    function meter(key, value, max) {
      var fill = dialog.querySelector("[data-meter='" + key + "']");
      var label = dialog.querySelector("[data-meter-label='" + key + "']");
      var pct = Math.round((parseFloat(value) / max) * 100);
      pct = Math.min(Math.max(pct, 4), 100);
      if (fill) fill.style.width = pct + "%";
      if (label) label.textContent = String(value);
    }

    function open(card) {
      var d = card.dataset;
      set("name", d.name);
      set("style", d.style);
      set("abv", d.abv);
      set("ibu", d.ibu);
      set("srm", d.srm);
      set("season", d.season);
      set("notes", d.notes);
      set("malt", d.malt);
      set("hops", d.hops);
      set("yeast", d.yeast);
      set("pairing", d.pairing);
      set("batch", d.batch);
      set("availability", d.availability);

      var img = dialog.querySelector("[data-field='img']");
      if (img) {
        img.src = d.img;
        img.alt = d.alt || (d.name + " poured at the Copperline taproom");
      }
      meter("bitter", d.ibu, 100);
      meter("strength", parseFloat(d.abv), 12);
      meter("color", parseInt(d.srm.replace(/[^0-9]/g, ""), 10) || 10, 80);

      lastFocus = doc.activeElement;
      overlay.hidden = false;
      doc.body.classList.add("locked");
      var closeBtn = overlay.querySelector(".modal__close");
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.hidden = true;
      doc.body.classList.remove("locked");
      if (lastFocus) lastFocus.focus();
    }

    cards.forEach(function (card) {
      card.addEventListener("click", function () { open(card); });
    });
    all("[data-open-beer]", function (trigger) {
      trigger.addEventListener("click", function () {
        var target = grid.querySelector('#' + trigger.getAttribute("data-open-beer"));
        if (target) open(target);
      });
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay || event.target.closest("[data-close]")) close();
    });
    doc.addEventListener("keydown", function (event) {
      if (overlay.hidden) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      var focusables = overlay.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (!focusables.length) return;
      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && doc.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && doc.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    });
  })();

  /* ----------------------------------------------------------
     7. Taproom hours — flag today's row (visit.html)
     ---------------------------------------------------------- */
  (function hours() {
    var table = doc.querySelector("[data-hours]");
    if (!table) return;
    var day = new Date().getDay(); /* 0 = Sunday */
    var rows = table.querySelectorAll("tbody tr");
    Array.prototype.forEach.call(rows, function (row) {
      var value = parseInt(row.getAttribute("data-day"), 10);
      if (value === day) row.classList.add("is-today");
    });
    var status = doc.getElementById("open-status");
    if (!status) return;
    var today = table.querySelector("tbody tr[data-day='" + day + "']");
    var closes = today ? today.getAttribute("data-close") : null;
    var now = new Date();
    var minutes = now.getHours() * 60 + now.getMinutes();
    var parts = closes && closes.indexOf(":") > 0 ? closes.split(":") : null;

    if (!parts) {
      status.textContent = "Closed today — the taps reopen Wednesday at 11:00";
      status.classList.add("chip--out");
      return;
    }
    var closeMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    var isOpen = minutes >= 11 * 60 && minutes < closeMin;
    status.textContent = isOpen
      ? "Open now — pouring until " + closes
      : "Closed right now — taps reopen at 11:00";
    if (!isOpen) status.classList.add("chip--out");
    else status.classList.remove("chip--out");
  })();

  /* ----------------------------------------------------------
     8. Forms — validation + confirmed state (no network)
     ---------------------------------------------------------- */
  (function forms() {
    all("form[data-form]", function (form) {
      var status = form.querySelector("[data-form-status]");
      var required = Array.prototype.slice.call(
        form.querySelectorAll("[required]")
      );

      function slot(input) {
        var field = input.closest(".field");
        return field ? field.querySelector(".field__err") : null;
      }
      function fail(input, message) {
        var out = slot(input);
        input.setAttribute("aria-invalid", "true");
        if (out) out.textContent = message;
        else if (status) {
          status.hidden = false;
          status.setAttribute("data-tone", "error");
          status.textContent = message;
        }
      }
      function clear(input) {
        var out = slot(input);
        input.removeAttribute("aria-invalid");
        if (out) out.textContent = "";
      }

      required.forEach(function (input) {
        input.addEventListener("input", function () { clear(input); });
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var bad = null;
        var errors = 0;

        required.forEach(function (input) {
          clear(input);
          var value = (input.value || "").trim();
          if (!value) {
            fail(input, "Required");
            errors += 1;
            if (!bad) bad = input;
            return;
          }
          if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
            fail(input, "Enter a valid email");
            errors += 1;
            if (!bad) bad = input;
          }
          if (input.getAttribute("data-min-chars") && value.length < Number(input.getAttribute("data-min-chars"))) {
            fail(input, "Add more detail (" + input.getAttribute("data-min-chars") + "+ characters)");
            errors += 1;
            if (!bad) bad = input;
          }
        });

        var agree = form.querySelector("[data-agree]");
        if (agree && !agree.checked) {
          var agreeSlot = slot(agree);
          if (agreeSlot) agreeSlot.textContent = "Please tick to continue";
          errors += 1;
          if (!bad) bad = agree;
        }

        if (errors) {
          if (status) {
            status.hidden = false;
            status.setAttribute("data-tone", "error");
            status.textContent = errors + (errors === 1 ? " field needs" : " fields need") + " attention before we can send this.";
          }
          if (bad) bad.focus();
          return;
        }

        var name = form.querySelector("[data-form-name]");
        var kind = form.getAttribute("data-form");
        var copy = {
          tour: "Tour request logged. Our events lead confirms by email within one business day.",
          private: "Private event enquiry received — we will reply with a floor plan and pricing.",
          newsletter: "You are on the keg-list. New pours land in your inbox each Thursday.",
          contact: "Message delivered to the taproom crew. Expect a reply within a day.",
          table: "Table held for 20 minutes past your arrival window. See you soon."
        };
        if (status) {
          status.hidden = false;
          status.removeAttribute("data-tone");
          status.textContent = (name && name.value.trim() ? name.value.trim().split(" ")[0] + ", " : "") + (copy[kind] || "Sent. We will be in touch.");
        }
        form.reset();
      });
    });
  })();

  /* ----------------------------------------------------------
     9. Small polish
     ---------------------------------------------------------- */
  (function polish() {
    /* Current year in every footer */
    all("[data-year]", function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    /* Jump-to-anchor links keep focus on the target for keyboard users */
    all('a[href^="#"]', function (link) {
      link.addEventListener("click", function () {
        var id = link.getAttribute("href").slice(1);
        var target = id && doc.getElementById(id);
        if (!target) return;
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        window.setTimeout(function () { target.focus({ preventScroll: true }); }, 400);
      });
    });

    /* Make the main landmark programmatically focusable for skip link */
    on("#main", function (main) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    });
  })();
})();
