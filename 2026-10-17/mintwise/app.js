/* =====================================================================
   Mintwise — shared behaviour
   Signature motion 1: Magnetic Elements (primary buttons, rAF lerp)
   Signature motion 2: Clip-Path Image Reveal (IntersectionObserver)
   Structural:         Card Deck fan-out on scroll
   Page logic guarded by element-existence checks.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.getElementById("primary-nav");
    if (!toggle || !links) return;

    function close() {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
    function open() {
      links.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }
    toggle.addEventListener("click", function () {
      if (links.classList.contains("open")) close(); else open();
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        close();
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) close();
    });
  }

  /* ---------------------------------------------------------------
     Signature motion 1 — Magnetic Elements
     Primary buttons drift toward the cursor inside a 120px radius,
     peak at scale(1.04), and spring back when the pointer leaves.
     --------------------------------------------------------------- */
  function initMagnets() {
    if (reduceMotion || !finePointer) return;
    var magnets = Array.prototype.slice.call(document.querySelectorAll(".magnetic"));
    if (!magnets.length) return;

    var RADIUS = 120;
    var magnetsState = magnets.map(function (el) {
      return { el: el, x: 0, y: 0, tx: 0, ty: 0, scale: 1, tscale: 1, cx: 0, cy: 0 };
    });
    var rafId = null;

    function nearest(state, mx, my) {
      var r = state.el.getBoundingClientRect();
      state.cx = r.left + r.width / 2;
      state.cy = r.top + r.height / 2;
      var dx = mx - state.cx, dy = my - state.cy;
      var dist = Math.hypot(dx, dy);
      var max = RADIUS + Math.max(r.width, r.height) / 2;
      if (dist > max) { state.tx = 0; state.ty = 0; state.tscale = 1; return; }
      var closeness = 1 - dist / max;              // 0 (far) → 1 (closest)
      var pull = 0.35 * closeness;
      state.tx = dx * pull;
      state.ty = dy * pull;
      state.tscale = 1 + 0.04 * closeness;          // subtle scale(1.04) at closest
    }

    function loop() {
      var moving = false;
      for (var i = 0; i < magnetsState.length; i++) {
        var s = magnetsState[i];
        // lerp toward target
        s.x += (s.tx - s.x) * 0.18;
        s.y += (s.ty - s.y) * 0.18;
        s.scale += (s.tscale - s.scale) * 0.18;
        if (Math.abs(s.tx - s.x) > 0.1 || Math.abs(s.ty - s.y) > 0.1 || Math.abs(s.tscale - s.scale) > 0.001) moving = true;
        s.el.style.transform = "translate3d(" + s.x.toFixed(2) + "px," + s.y.toFixed(2) + "px,0) scale(" + s.scale.toFixed(3) + ")";
      }
      if (moving) rafId = requestAnimationFrame(loop);
      else rafId = null;
    }

    function onMove(e) {
      var mx = e.clientX, my = e.clientY;
      for (var i = 0; i < magnetsState.length; i++) nearest(magnetsState[i], mx, my);
      if (!rafId) rafId = requestAnimationFrame(loop);
    }
    function onLeave() {
      magnetsState.forEach(function (s) { s.tx = 0; s.ty = 0; s.tscale = 1; });
      if (!rafId) rafId = requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("mouseleave", onLeave);

    // Reset transform cleanly on keyboard focus so focus ring is never offset.
    magnets.forEach(function (el) {
      el.addEventListener("blur", function () {
        var s = magnetsState.filter(function (m) { return m.el === el; })[0];
        if (s) { s.tx = 0; s.ty = 0; s.tscale = 1; if (!rafId) rafId = requestAnimationFrame(loop); }
      });
    });
  }

  /* ---------------------------------------------------------------
     Signature motion 2 — Clip-Path Image Reveal
     Images wipe in from inset(12% 8% round 12px) → inset(0).
     --------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------
     Card Deck — overlapping stack fans out on scroll
     --------------------------------------------------------------- */
  function initDeck() {
    var deck = document.querySelector("[data-deck]");
    if (!deck) return;

    if (reduceMotion) { deck.style.setProperty("--t", "1"); return; }

    var cards = deck.querySelectorAll(".deck-card");
    var ticking = false;

    function update() {
      ticking = false;
      var r = deck.getBoundingClientRect();
      var vh = window.innerHeight || 0;
      // Start fanning once the deck's top passes ~85% of the viewport,
      // fully open once its centre reaches ~40% from the top.
      var p = (vh * 0.9 - r.top) / (vh * 0.55);
      p = Math.max(0, Math.min(1, p));
      deck.style.setProperty("--t", p.toFixed(3));
      Array.prototype.forEach.call(cards, function (c, i) {
        var stagger = Math.max(0, Math.min(1, (p * cards.length) - i));
        c.style.opacity = (0.55 + 0.45 * stagger).toFixed(3);
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------------------------------------------------------------
     Budget calculator (calculator.html only)
     --------------------------------------------------------------- */
  function initCalculator() {
    var form = document.getElementById("calc-form");
    if (!form) return;

    var CIRC = 2 * Math.PI * 86; // 540.35
    var ids = {
      income: document.getElementById("income"),
      oneoff: document.getElementById("one-off"),
      buffer: document.getElementById("savings-goal"),
      housing: document.getElementById("exp-housing"),
      groceries: document.getElementById("exp-groceries"),
      transport: document.getElementById("exp-transport"),
      utilities: document.getElementById("exp-utilities"),
      lifestyle: document.getElementById("exp-lifestyle"),
      other: document.getElementById("exp-other")
    };
    var out = {
      val: document.getElementById("donut-val"),
      segSave: document.getElementById("seg-save"),
      segSpend: document.getElementById("seg-spend"),
      rateKbd: document.getElementById("rate-kbd"),
      legSave: document.getElementById("leg-save"),
      legSpend: document.getElementById("leg-spend"),
      income: document.getElementById("out-income"),
      spend: document.getElementById("out-spend"),
      spendFoot: document.getElementById("out-spend-foot"),
      savings: document.getElementById("out-savings"),
      annual: document.getElementById("out-annual"),
      runway: document.getElementById("out-runway"),
      vHead: document.getElementById("verdict-head"),
      vBody: document.getElementById("verdict-body"),
      vTip: document.getElementById("verdict-tip"),
      bars: document.getElementById("category-bars")
    };

    var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    function val(el) { var n = parseFloat(el && el.value); return isNaN(n) || n < 0 ? 0 : n; }

    var CATS = [
      ["Housing", ids.housing],
      ["Groceries", ids.groceries],
      ["Transport", ids.transport],
      ["Utilities", ids.utilities],
      ["Lifestyle", ids.lifestyle],
      ["Debt & other", ids.other]
    ];

    function buildBars() {
      out.bars.innerHTML = "";
      CATS.forEach(function (c) {
        var row = document.createElement("div");
        row.className = "tile-label";
        row.style.color = "var(--muted)";
        row.innerHTML = '<span>' + c[0] + '</span><span data-bar-amt class="mono">$0</span>';
        var meter = document.createElement("div");
        meter.style.cssText = "height:8px;border-radius:999px;background:var(--line);overflow:hidden;margin-top:2px;";
        meter.innerHTML = '<span data-bar-fill style="display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--mint),#6ee7b7);width:0%;transition:width .5s var(--ease-out);"></span>';
        var wrapEl = document.createElement("div");
        wrapEl.appendChild(row); wrapEl.appendChild(meter);
        wrapEl.dataset.ref = c[0];
        out.bars.appendChild(wrapEl);
        c[2] = wrapEl; // stash ref
      });
    }

    function render() {
      var income = val(ids.income) + val(ids.oneoff);
      var spend = val(ids.housing) + val(ids.groceries) + val(ids.transport) +
                  val(ids.utilities) + val(ids.lifestyle) + val(ids.other);
      var buffer = val(ids.buffer);
      var savings = income - spend;
      var rate = income > 0 ? (savings / income) * 100 : 0;

      // Donut — spent arc (dark) fills remainder, saved arc (mint) the rate.
      var saveFrac = Math.max(0, Math.min(1, rate / 100));
      var spendFrac = 1 - saveFrac;
      out.segSave.setAttribute("stroke-dasharray", (CIRC * saveFrac) + " " + CIRC);
      out.segSave.setAttribute("stroke-dashoffset", "0");
      out.segSpend.setAttribute("stroke-dasharray", (CIRC * spendFrac) + " " + CIRC);
      out.segSpend.setAttribute("stroke-dashoffset", "-" + (CIRC * saveFrac));

      out.val.textContent = Math.round(rate) + "%";

      out.legSave.textContent = money.format(Math.max(0, savings));
      out.legSpend.textContent = money.format(spend);

      out.income.textContent = money.format(income);
      out.spend.textContent = money.format(spend);
      out.savings.textContent = money.format(savings);
      out.annual.textContent = "▲ " + money.format(Math.max(0, savings) * 12) + " / yr";
      var runway = spend > 0 ? buffer / spend : 0;
      out.runway.innerHTML = runway.toFixed(1) + "<small>mo</small>";

      var share = spend > 0 ? (spend / income) * 100 : 0;
      out.spendFoot.innerHTML = share > 100
        ? '<span class="warn">' + Math.round(share) + '% of income</span>'
        : Math.round(share) + "% of income";

      // category bars
      CATS.forEach(function (c) {
        var w = spend > 0 ? (val(c[1]) / spend) * 100 : 0;
        if (c[2]) {
          c[2].querySelector("[data-bar-amt]").textContent = money.format(val(c[1]));
          c[2].querySelector("[data-bar-fill]").style.width = Math.min(100, w) + "%";
        }
      });

      // verdict
      var head, body, tip, band, isDown = savings < 0;
      if (isDown) {
        head = "Overdrawn by " + money.format(-savings) + " / mo";
        body = "Your listed spending is higher than the income you entered. Mintwise would flag the shortfall on day one and show exactly which lane to trim.";
        tip = "Cut the largest single category and watch the rate recover.";
        band = "▼ over budget";
      } else if (rate < 10) {
        head = "Tight but workable";
        body = "You are keeping about " + money.format(savings) + " a month. That is a real buffer — Mintwise round-ups can lift it without any extra transfer.";
        tip = "Aim for the 10% band first: trim one lifestyle category.";
        band = "◐ survival zone";
      } else if (rate < 20) {
        head = "Steady and climbing";
        body = "At " + Math.round(rate) + "% you save " + money.format(savings) + " a month, roughly " + money.format(savings * 12) + " a year. That is ahead of most savers.";
        tip = "Autopilot nudges you toward the 20% accelerator band.";
        band = "▲ steady";
      } else if (rate < 35) {
        head = "Accelerator territory";
        body = "Saving " + money.format(savings) + " each month is strong. Your runway on the current buffer is " + runway.toFixed(1) + " months.";
        tip = "Add an investment vault and let idle cash compound.";
        band = "▲ healthy";
      } else {
        head = "Independence mode";
        body = "You keep " + Math.round(rate) + "% of everything that comes in. That kind of rate is what makes early-independence plans real.";
        tip = "Lock the habit with goal lanes so the surplus has somewhere to go.";
        band = "★ elite rate";
      }
      out.vHead.textContent = head;
      out.vBody.textContent = body;
      out.vTip.textContent = tip;
      out.rateKbd.textContent = band;
      if (out.segSave) out.segSave.setAttribute("stroke", isDown ? "#f43f5e" : "#10b981");
    }

    buildBars();
    form.addEventListener("input", render);
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
    document.getElementById("calc-reset").addEventListener("click", function () {
      ids.income.value = 5200; ids.oneoff.value = 250; ids.buffer.value = 6000;
      ids.housing.value = 1450; ids.groceries.value = 520; ids.transport.value = 310;
      ids.utilities.value = 240; ids.lifestyle.value = 430; ids.other.value = 360;
      render();
    });
    render();
  }

  /* ---------------------------------------------------------------
     Pricing toggle (pricing.html only)
     --------------------------------------------------------------- */
  function initPricing() {
    var monthly = document.getElementById("bill-monthly");
    var annual = document.getElementById("bill-annual");
    if (!monthly || !annual) return;

    function setMode(mode) {
      var isAnnual = mode === "annual";
      monthly.setAttribute("aria-pressed", String(!isAnnual));
      annual.setAttribute("aria-pressed", String(isAnnual));
      document.querySelectorAll(".price[data-monthly]").forEach(function (p) {
        var shown = isAnnual ? p.getAttribute("data-annual") : p.getAttribute("data-monthly");
        var amt = p.querySelector(".amt");
        if (amt) amt.textContent = shown;
        else {
          // keep the "/mo" suffix node intact
          var small = p.querySelector("small");
          p.textContent = shown;
          if (small) p.appendChild(small);
        }
      });
      document.querySelectorAll(".bill-note[data-monthly]").forEach(function (n) {
        n.textContent = isAnnual ? n.getAttribute("data-annual") : n.getAttribute("data-monthly");
      });
    }
    monthly.addEventListener("click", function () { setMode("monthly"); });
    annual.addEventListener("click", function () { setMode("annual"); });
    document.addEventListener("keydown", function (e) {
      if (e.shiftKey && (e.key === "t" || e.key === "T")) {
        setMode(annual.getAttribute("aria-pressed") === "true" ? "monthly" : "annual");
      }
    });
    setMode("monthly");
  }

  /* ---------------------------------------------------------------
     FAQ accordion (contact.html + pricing.html)
     --------------------------------------------------------------- */
  function initAccordion() {
    document.querySelectorAll("[data-accordion]").forEach(function (acc) {
      var buttons = acc.querySelectorAll(".acc-btn");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var isOpen = btn.getAttribute("aria-expanded") === "true";
          buttons.forEach(function (b) {
            b.setAttribute("aria-expanded", "false");
            var panel = document.getElementById(b.getAttribute("aria-controls"));
            if (panel) panel.hidden = false;
          });
          btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        });
      });
    });
  }

  /* ---------------------------------------------------------------
     Contact form (contact.html only)
     --------------------------------------------------------------- */
  function initToast() {
    if (document.querySelector(".toast")) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg><span class="toast-msg"></span>';
    document.body.appendChild(t);
    return t;
  }
  function toast(msg) {
    var t = initToast();
    if (!t) return;
    t.querySelector(".toast-msg").textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var counter = document.getElementById("message-count");
    var message = document.getElementById("message");
    if (message && counter) {
      message.addEventListener("input", function () {
        counter.textContent = message.value.length + " / 800 characters";
      });
    }

    function setInvalid(id, on) {
      var input = document.getElementById(id);
      if (!input) return;
      var field = input.closest(".form-field");
      if (field) field.setAttribute("data-invalid", on ? "true" : "false");
      input.setAttribute("aria-invalid", on ? "true" : "false");
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validate() {
      var ok = true;
      var name = document.getElementById("name");
      var email = document.getElementById("email");
      var consent = document.getElementById("consent");

      var badName = !name.value.trim();
      setInvalid("name", badName); if (badName) ok = false;

      var badEmail = !emailRe.test(email.value.trim());
      setInvalid("email", badEmail); if (badEmail) ok = false;

      var badMsg = message.value.trim().length < 12;
      setInvalid("message", badMsg); if (badMsg) ok = false;

      var badConsent = !consent.checked;
      var cerr = document.getElementById("consent-err");
      if (cerr) cerr.style.display = badConsent ? "block" : "none";
      consent.setAttribute("aria-invalid", badConsent ? "true" : "false");
      if (badConsent) ok = false;

      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (validate()) {
        form.reset();
        ["name", "email", "message"].forEach(function (id) { setInvalid(id, false); });
        var cerr = document.getElementById("consent-err");
        if (cerr) cerr.style.display = "none";
        if (counter) counter.textContent = "0 / 800 characters";
        status.textContent = "Thanks — your message is queued. The support desk replies within one business day.";
        status.className = "form-status ok";
        toast("Message sent to Mintwise support.");
      } else {
        status.textContent = "Please fix the highlighted fields and send again.";
        status.className = "form-status bad";
        var firstBad = form.querySelector('[data-invalid="true"] input, [data-invalid="true"] textarea');
        if (firstBad) firstBad.focus();
      }
    });
    form.addEventListener("reset", function () {
      ["name", "email", "message"].forEach(function (id) { setInvalid(id, false); });
      var cerr = document.getElementById("consent-err");
      if (cerr) cerr.style.display = "none";
      status.textContent = "";
      status.className = "form-status";
      if (counter) counter.textContent = "0 / 800 characters";
    });
  }

  /* ---------------------------------------------------------------
     Boot
     --------------------------------------------------------------- */
  function boot() {
    initNav();
    initMagnets();
    initReveal();
    initDeck();
    initCalculator();
    initPricing();
    initAccordion();
    initContactForm();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
