/* =========================================================
   Neon Pulse — shared behaviour
   Motion identity: Word-Stagger Headline + Blur-Fade Ascend
   ========================================================= */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GATES_OPEN = new Date("2026-12-18T18:00:00");

  /* ---------- mobile nav ---------- */
  function initNav() {
    var nav = document.querySelector(".primary-nav");
    var toggle = document.querySelector(".nav-toggle");
    if (!nav || !toggle) return;

    function setOpen(open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) return;
      var first = nav.querySelector("a");
      if (first && document.activeElement && document.activeElement !== toggle) first.focus();
    }

    toggle.setAttribute("aria-controls", nav.id);
    setOpen(false);
    toggle.addEventListener("click", function () {
      setOpen(nav.getAttribute("data-open") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 900) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---------- motion 1: word-stagger headline ---------- */
  function initWordStagger() {
    var title = document.querySelector("[data-split]");
    if (!title) return;

    var nodes = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/\s+/).filter(Boolean);
          if (!parts.length) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (w) {
            var span = document.createElement("span");
            span.className = "word";
            span.textContent = w;
            frag.appendChild(span);
            frag.appendChild(document.createTextNode(" "));
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(title);

    nodes = Array.prototype.slice.call(title.querySelectorAll(".word"));
    title.classList.add("split");

    if (REDUCED) {
      nodes.forEach(function (w) { w.classList.add("settled"); });
      return;
    }
    nodes.forEach(function (w, i) {
      w.style.transitionDelay = (i * 60) + "ms";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        nodes.forEach(function (w) { w.classList.add("settled"); });
      });
    });
  }

  /* ---------- motion 2: blur-fade ascend ---------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    if (REDUCED || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        var group = entry.target.getAttribute("data-reveal-group");
        var peers = group
          ? Array.prototype.slice.call(document.querySelectorAll('[data-reveal-group="' + group + '"]'))
          : [entry.target];
        var idx = peers.indexOf(entry.target);
        entry.target.style.transitionDelay = (Math.max(idx, 0) * 80) + "ms";
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- countdown ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function initCountdown() {
    var root = document.querySelector("[data-countdown]");
    if (!root) return;
    var cells = {
      d: root.querySelector("[data-unit='days']"),
      h: root.querySelector("[data-unit='hours']"),
      m: root.querySelector("[data-unit='mins']"),
      s: root.querySelector("[data-unit='secs']")
    };
    var note = root.querySelector("[data-countdown-note]");

    function tick() {
      var diff = GATES_OPEN.getTime() - Date.now();
      if (diff <= 0) {
        Object.keys(cells).forEach(function (k) { if (cells[k]) cells[k].textContent = "00"; });
        if (note) note.textContent = "Gates are open — the pulse is live.";
        return;
      }
      var secs = Math.floor(diff / 1000);
      var days = Math.floor(secs / 86400);
      var hours = Math.floor((secs % 86400) / 3600);
      var mins = Math.floor((secs % 3600) / 60);
      var sec = secs % 60;
      if (cells.d) cells.d.textContent = days;
      if (cells.h) cells.h.textContent = pad(hours);
      if (cells.m) cells.m.textContent = pad(mins);
      if (cells.s) cells.s.textContent = pad(sec);
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- lineup filtering ---------- */
  function initLineup() {
    var board = document.querySelector("[data-lineup]");
    if (!board) return;
    var cards = Array.prototype.slice.call(board.querySelectorAll("[data-artist]"));
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var search = document.querySelector("[data-lineup-search]");
    var countEl = document.querySelector("[data-lineup-count]");
    var emptyEl = document.querySelector("[data-lineup-empty]");
    var state = { day: "all", stage: "all", q: "" };

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var okDay = state.day === "all" || card.getAttribute("data-day") === state.day;
        var okStage = state.stage === "all" || card.getAttribute("data-stage") === state.stage;
        var okQ = !state.q || card.textContent.toLowerCase().indexOf(state.q) !== -1;
        var show = okDay && okStage && okQ;
        card.setAttribute("data-hidden", show ? "false" : "true");
        if (show) shown++;
      });
      if (countEl) {
        countEl.textContent = "Showing " + shown + " of " + cards.length + " artists";
      }
      if (emptyEl) emptyEl.hidden = shown !== 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var kind = chip.getAttribute("data-filter");
        var value = chip.getAttribute("data-value");
        state[kind] = value;
        chips.forEach(function (c) {
          if (c.getAttribute("data-filter") === kind) {
            c.setAttribute("aria-pressed", c === chip ? "true" : "false");
          }
        });
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", function () {
        state.q = search.value.trim().toLowerCase();
        apply();
      });
    }

    var clear = document.querySelector("[data-lineup-clear]");
    if (clear) {
      clear.addEventListener("click", function () {
        state = { day: "all", stage: "all", q: "" };
        if (search) search.value = "";
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c.getAttribute("data-value") === "all" ? "true" : "false");
        });
        apply();
      });
    }

    apply();
  }

  /* ---------- ticket calculator ---------- */
  var TIERS = {
    friday: { name: "Friday Single Day", price: 129 },
    saturday: { name: "Saturday Single Day", price: 149 },
    weekend: { name: "Weekend General", price: 289 },
    vip: { name: "Neon VIP", price: 549 }
  };

  function money(n) {
    return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function initTicketCalc() {
    var calc = document.querySelector("[data-ticket-calc]");
    if (!calc) return;
    var tierSel = calc.querySelector("[data-calc-tier]");
    var qtyOut = calc.querySelector("[data-calc-qty-out]");
    var minus = calc.querySelector("[data-calc-minus]");
    var plus = calc.querySelector("[data-calc-plus]");
    var addons = Array.prototype.slice.call(calc.querySelectorAll("[data-addon]"));
    var lines = calc.querySelector("[data-calc-lines]");
    var totalEl = calc.querySelector("[data-calc-total]");
    var qty = 2;

    function render() {
      var tierKey = tierSel ? tierSel.value : "weekend";
      var tier = TIERS[tierKey];
      var rows = [];
      var subtotal = 0;

      if (tier) {
        subtotal += tier.price * qty;
        rows.push({ label: tier.name + " × " + qty, value: money(tier.price * qty) });
      }
      addons.forEach(function (box) {
        if (!box.checked) return;
        var price = parseFloat(box.getAttribute("data-price")) || 0;
        var fee = box.getAttribute("data-perPerson") === "true" ? price * qty : price;
        subtotal += fee;
        rows.push({
          label: box.getAttribute("data-addon-name") + (box.getAttribute("data-perPerson") === "true" ? " × " + qty : ""),
          value: money(fee)
        });
      });

      var fees = subtotal * 0.0875;
      rows.push({ label: "Service + facility fee", value: money(fees) });

      if (lines) {
        lines.textContent = "";
        rows.forEach(function (r) {
          var row = document.createElement("div");
          row.className = "calc-line";
          var label = document.createElement("span");
          label.textContent = r.label;
          var value = document.createElement("b");
          value.textContent = r.value;
          row.appendChild(label);
          row.appendChild(value);
          lines.appendChild(row);
        });
      }
      if (totalEl) totalEl.textContent = money(subtotal + fees);
      if (qtyOut) qtyOut.textContent = qty;
      var summary = calc.querySelector("[data-calc-summary]");
      if (summary && tier) {
        summary.textContent = tier.name + " — 3 nights of sets, gates 18:00 each day." ;
      }
    }

    if (minus) minus.addEventListener("click", function () { qty = Math.max(1, qty - 1); render(); });
    if (plus) plus.addEventListener("click", function () { qty = Math.min(10, qty + 1); render(); });
    if (tierSel) tierSel.addEventListener("change", render);
    addons.forEach(function (b) { b.addEventListener("change", render); });
    render();
  }

  /* ---------- FAQ accordion ---------- */
  function initAccordion() {
    var heads = Array.prototype.slice.call(document.querySelectorAll(".acc-head"));
    if (!heads.length) return;

    heads.forEach(function (head, i) {
      var panel = document.getElementById(head.getAttribute("aria-controls"));
      if (!panel) return;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", head.id);

      head.addEventListener("click", function () {
        var open = head.getAttribute("aria-expanded") === "true";
        head.setAttribute("aria-expanded", open ? "false" : "true");
        panel.setAttribute("data-open", open ? "false" : "true");
      });

      head.addEventListener("keydown", function (e) {
        var map = { ArrowDown: 1, ArrowUp: -1 };
        if (map[e.key]) {
          e.preventDefault();
          var next = heads[(i + map[e.key] + heads.length) % heads.length];
          next.focus();
        } else if (e.key === "Home") {
          e.preventDefault(); heads[0].focus();
        } else if (e.key === "End") {
          e.preventDefault(); heads[heads.length - 1].focus();
        }
      });
    });

    var deep = window.location.hash.match(/^#faq-(.+)$/);
    if (deep) {
      var target = document.querySelector('[data-faq-id="' + deep[1] + '"]');
      if (target) {
        target.setAttribute("aria-expanded", "true");
        var p = document.getElementById(target.getAttribute("aria-controls"));
        if (p) p.setAttribute("data-open", "true");
      }
    }
  }

  /* ---------- gallery lightbox ---------- */
  function initLightbox() {
    var box = document.querySelector("[data-lightbox]");
    if (!box) return;
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var closeBtn = box.querySelector(".lightbox-close");
    var shots = Array.prototype.slice.call(document.querySelectorAll("[data-shot]"));
    var lastFocus = null;

    function open(src, alt, text) {
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = alt;
      if (cap) cap.textContent = text || alt;
      box.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }
    function close() {
      box.setAttribute("data-open", "false");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    shots.forEach(function (shot) {
      shot.addEventListener("click", function () {
        var src = shot.getAttribute("data-shot");
        var alt = shot.getAttribute("data-shot-alt") || shot.querySelector("img").alt;
        open(src, alt, shot.getAttribute("data-shot-caption"));
      });
    });

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.getAttribute("data-open") === "true") close();
    });
  }

  /* ---------- newsletter ---------- */
  function initForms() {
    document.querySelectorAll("[data-newsletter]").forEach(function (form) {
      var email = form.querySelector("input[type='email']");
      var status = form.querySelector(".form-status");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var value = (email.value || "").trim();
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        if (status) {
          status.textContent = ok
            ? "You are on the list — dispatch #009 lands 07 Nov."
            : "Check that address — we need a full name@domain.";
          status.style.color = ok ? "var(--c-yellow)" : "#ff6b6b";
        }
        if (ok) form.reset();
        else if (email) email.focus();
      });
    });

    var select = document.querySelector("[data-sort-select]");
    if (select) {
      var grid = document.querySelector("[data-sortable]");
      if (grid) {
        select.addEventListener("change", function () {
          var key = select.value;
          var cards = Array.prototype.slice.call(grid.children);
          cards.sort(function (a, b) {
            var av = a.getAttribute("data-sort-" + key) || "";
            var bv = b.getAttribute("data-sort-" + key) || "";
            var an = parseFloat(av);
            var bn = parseFloat(bv);
            if (!isNaN(an) && !isNaN(bn)) return an - bn;
            return av.localeCompare(bv);
          });
          cards.forEach(function (c) { grid.appendChild(c); });
        });
      }
    }
  }

  /* ---------- footer year ---------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- gallery marquee ---------- */
  function initMarquee() {
    var tracks = Array.prototype.slice.call(document.querySelectorAll("[data-marquee]"));
    if (!tracks.length || REDUCED) return;
    tracks.forEach(function (track) {
      var items = Array.prototype.slice.call(track.children);
      items.forEach(function (item) {
        var clone = item.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.removeAttribute("data-shot");
        clone.setAttribute("tabindex", "-1");
        track.appendChild(clone);
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initNav();
    initWordStagger();
    initCountdown();
    initLineup();
    initTicketCalc();
    initAccordion();
    initLightbox();
    initMarquee();
    initForms();
    initYear();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
