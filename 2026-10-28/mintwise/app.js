/* =========================================================================
   MINTWISE — shared behaviour
   Every block is guarded by an element-existence check so one file serves
   all five pages. Vanilla JS only; honours prefers-reduced-motion.
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var money = function (n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  };
  var parseNum = function (v) {
    var n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : 0;
  };

  /* ---------- 1. Masthead: mobile nav + stuck state ------------------ */
  function initNav() {
    var masthead = $(".masthead");
    var toggle = $(".nav-toggle");
    var panel = $(".nav__panel");
    if (!masthead) return;

    var onScroll = function () {
      masthead.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !panel) return;
    panel.hidden = false;

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("data-open", open ? "true" : "false");
    };
    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1020) setOpen(false);
    });
  }

  /* ---------- 2. Reveal on scroll (clip-path + rise) ------------------ */
  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    var mark = function (el) {
      el.classList.add("is-in");
      el.removeAttribute("data-reveal");
    };

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(mark);
      return;
    }
    items.forEach(function (el) {
      el.classList.add(el.getAttribute("data-reveal") === "clip" ? "reveal-clip" : "reveal-rise");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        mark(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.16 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. Index rail: active section --------------------------- */
  function initRail() {
    var links = $$('.rail__list a[href^="#"]');
    if (!links.length) return;
    var map = {};
    var targets = links.filter(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) map[el.id] = a;
      return !!el;
    }).map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    if (!targets.length) return;

    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    };

    var io = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.6] });

    targets.forEach(function (t) { io.observe(t); });
    setActive(targets[0].id);
  }

  /* ---------- 4. Ticker: duplicate track for seamless loop ------------ */
  function initTicker() {
    $$(".ticker__track").forEach(function (track) {
      var group = track.querySelector(".ticker__group");
      if (!group) return;
      var ghost = group.cloneNode(true);
      ghost.setAttribute("aria-hidden", "true");
      ghost.removeAttribute("data-group");
      track.appendChild(ghost);
    });
  }

  /* ---------- 5. Scroll-top button ------------------------------------ */
  function initScrollTop() {
    var btn = $(".scrolltop");
    if (!btn) return;
    var onScroll = function () {
      btn.classList.toggle("is-on", window.scrollY > 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  }

  /* ---------- 6. FAQ accordion ---------------------------------------- */
  function initFaq() {
    var root = $(".faq");
    if (!root) return;
    $$(".faq__btn", root).forEach(function (btn, i) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      panel.id = panel.id || "faq-panel-" + (i + 1);
      btn.setAttribute("aria-expanded", "false");

      var setHeight = function (open) {
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
      };
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        setHeight(open);
      });
      window.addEventListener("resize", function () {
        if (btn.getAttribute("aria-expanded") === "true") setHeight(true);
      });
      if (i === 0) { btn.setAttribute("aria-expanded", "true"); setHeight(true); }
    });
  }

  /* ---------- 7. Pricing: monthly / annual toggle --------------------- */
  function initPricing() {
    var group = $("[data-price-toggle]");
    if (!group) return;
    var buttons = $$("button", group);
    var cards = $$("[data-monthly][data-annual]");

    var apply = function (mode) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-mode") === mode ? "true" : "false");
      });
      cards.forEach(function (card) {
        var raw = mode === "annual" ? card.getAttribute("data-annual") : card.getAttribute("data-monthly");
        var amt = $(".plan__amt", card);
        var per = $(".plan__per", card);
        var note = $(".plan__billnote", card);
        var free = card.getAttribute("data-monthly") === "0";
        if (amt) amt.textContent = "$" + raw;
        if (per) per.textContent = free ? "free forever" : mode === "annual" ? "/month, billed yearly" : "/month, billed monthly";
        if (note) note.textContent = free
          ? "Free forever. No card, no trial clock running."
          : mode === "annual"
            ? "Annual total " + money(parseFloat(raw) * 12) + " — two months free."
            : "Cancel any time. No card locked in.";
      });
    };

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-mode")); });
    });
    apply("monthly");
  }

  /* ---------- 8. Budget calculator (calculator.html) ------------------ */
  function initCalculator() {
    var form = $("[data-calc]");
    if (!form) return;

    var CATS = [
      { key: "housing", label: "Housing & utilities", def: 1650 },
      { key: "food", label: "Food & groceries", def: 560 },
      { key: "transport", label: "Transport & car", def: 380 },
      { key: "health", label: "Health & insurance", def: 220 },
      { key: "lifestyle", label: "Lifestyle & fun", def: 340 },
      { key: "debt", label: "Debt & loans", def: 260 }
    ];
    var R = 78, CIRC = 2 * Math.PI * R;

    var income = $("[data-input='income']", form);
    var give = $("[data-input='give']", form);
    var ringSave = $(".donut__ring--save");
    var ringOther = $(".donut__ring--spend");
    var outRate = $("[data-out='rate']");
    var outRateLabel = $("[data-out='rateraw']");
    var outLeft = $("[data-out='left']");
    var outSave = $("[data-out='save']");
    var outGive = $("[data-out='give']");
    var outYear = $("[data-out='year']");
    var outFree = $("[data-out='freeday']");
    var bars = $("[data-out='bars']");
    var verdict = $("[data-out='verdict']");
    var readoutTotal = $("[data-out='total-out']");
    var presetWrap = $("[data-presets]");

    var ring = function (el, frac, offsetFrac) {
      if (!el) return;
      var f = Math.max(0, Math.min(1, frac));
      var len = f * CIRC;
      el.style.strokeDasharray = len.toFixed(2) + " " + (CIRC - len).toFixed(2);
      el.style.strokeDashoffset = (-CIRC * Math.max(0, Math.min(1, offsetFrac || 0))).toFixed(2);
    };

    var values = function () {
      var v = { income: parseNum(income ? income.value : 0), give: parseNum(give ? give.value : 0) };
      CATS.forEach(function (c) {
        var el = $("[data-input='" + c.key + "']", form);
        v[c.key] = el ? parseNum(el.value) : c.def;
      });
      return v;
    };

    var tone = function (rate) {
      if (rate < 0) return "bad";
      if (rate < 0.1) return "mid";
      if (rate < 0.25) return "good";
      return "good";
    };

    var copy = function (rate, takeHome) {
      if (rate < 0) return {
        k: "Overdraft month",
        m: "Your commitments exceed what lands in the account. Mintwise would flag the three largest leaks and propose a 30-day floor you can actually keep."
      };
      if (rate < 0.05) return {
        k: "Thin margin",
        m: "You keep " + Math.round(rate * 100) + "% of take-home. Move one recurring charge down by " + money(Math.max(50, takeHome * 0.04)) + " and you cross into a buffer month."
      };
      if (rate < 0.15) return {
        k: "Steady",
        m: "A " + Math.round(rate * 100) + "% savings rate clears most emergency-fund plans. At this pace you bank " + money(takeHome * rate * 12) + " a year."
      };
      if (rate < 0.3) return {
        k: "Strong",
        m: "You save " + Math.round(rate * 100) + "% of take-home — top quartile for households your size. Redirect " + money(takeHome * rate * 0.15) + " a month toward a goal account and it compounds."
      };
      return {
        k: "Exceptional",
        m: "A " + Math.round(rate * 100) + "% savings rate is rare. Your next decision is not how much to save but how fast to deploy it — Mintwise maps the trade-off."
      };
    };

    var renderBars = function (v, spendTotal) {
      if (!bars) return;
      var rows = "";
      CATS.forEach(function (c) {
        var pct = v.income > 0 ? c && v[c.key] / v.income : 0;
        var share = spendTotal > 0 ? v[c.key] / spendTotal : 0;
        rows +=
          '<div class="bar">' +
          '<div class="bar__head"><b>' + c.label + "</b><span>" + money(v[c.key]) + " · " + Math.round(share * 100) + "%</span></div>" +
          '<div class="bar__track"><div class="bar__fill" style="width:' + Math.min(100, share * 100).toFixed(1) + '%"></div></div>' +
          '<div class="small mono" style="color:var(--ink-4)">' + (pct * 100).toFixed(1) + "% of gross income</div>" +
          "</div>";
      });
      rows +=
        '<div class="bar"><div class="bar__head"><b>Unallocated</b><span>' +
        money(Math.max(0, v.income - spendTotal - v.give)) + " · kept</span></div>" +
        '<div class="bar__track"><div class="bar__fill bar__fill--alt" style="width:' +
        Math.min(100, (Math.max(0, v.income - spendTotal - v.give) / Math.max(1, v.income)) * 100).toFixed(1) +
        '%"></div></div><div class="small mono" style="color:var(--ink-4)">Routes to your goal jars</div></div>';
      bars.innerHTML = rows;
    };

    var update = function () {
      var v = values();
      var spendTotal = CATS.reduce(function (s, c) { return s + v[c.key]; }, 0);
      var takeHome = Math.max(0, v.income - v.give);
      var left = takeHome - spendTotal;
      var rate = takeHome > 0 ? left / takeHome : 0;
      var spendFrac = takeHome > 0 ? Math.min(1, spendTotal / takeHome) : 0;

      if (outRate) outRate.textContent = (rate * 100).toFixed(1) + "%";
      if (outRateLabel) outRateLabel.textContent = "of " + money(takeHome) + " take-home";
      if (outSave) outSave.textContent = money(Math.max(0, left));
      if (outLeft && left < 0) outLeft.textContent = money(left);
      else if (outLeft) outLeft.textContent = money(Math.max(0, left));
      if (outGive) outGive.textContent = money(v.give);
      if (outYear) outYear.textContent = money(Math.max(0, left) * 12);
      if (readoutTotal) readoutTotal.textContent = money(spendTotal);
      if (outFree) {
        var perDay = takeHome / 30;
        var freeDays = perDay > 0 ? Math.max(0, left / perDay) : 0;
        outFree.textContent = freeDays.toFixed(1) + " days";
      }

      ring(ringOther, spendFrac, 0);
      ring(ringSave, rate, spendFrac);
      if (ringSave) ringSave.style.stroke = rate < 0 ? "#be123c" : rate < 0.1 ? "#f59e0b" : "#10b981";

      if (verdict) {
        var t = tone(rate), msg = copy(rate, takeHome);
        verdict.className = "verdict verdict--" + (t === "bad" ? "bad" : t === "mid" ? "mid" : "good");
        verdict.innerHTML = "<b>" + msg.k + "</b>" + msg.m;
      }
      renderBars(v, spendTotal);

      CATS.forEach(function (c) {
        var range = $("[data-range='" + c.key + "']", form);
        if (range) range.value = Math.min(100, Math.round((v[c.key] / Math.max(1, v.income)) * 100));
      });
    };

    $$("input, select", form).forEach(function (el) {
      el.addEventListener("input", update);
      el.addEventListener("change", update);
    });

    if (presetWrap) {
      $$("button", presetWrap).forEach(function (btn) {
        btn.addEventListener("click", function () {
          $$("button", presetWrap).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          btn.setAttribute("aria-pressed", "true");
          var p = btn.getAttribute("data-preset");
          var presets = {
            solo: { income: 5200, housing: 1500, food: 480, transport: 340, health: 190, lifestyle: 320, debt: 200, give: 150 },
            family: { income: 9400, housing: 2650, food: 940, transport: 620, health: 430, lifestyle: 560, debt: 480, give: 300 },
            freelancer: { income: 6800, housing: 1750, food: 620, transport: 380, health: 640, lifestyle: 400, debt: 320, give: 200 },
            lean: { income: 4600, housing: 1250, food: 420, transport: 260, health: 160, lifestyle: 180, debt: 140, give: 90 }
          };
          var set = presets[p];
          if (!set) return;
          Object.keys(set).forEach(function (k) {
            var el = $("[data-input='" + k + "']", form);
            if (el) el.value = set[k];
          });
          update();
        });
      });
    }

    /* seed default values so the donut is never empty */
    CATS.forEach(function (c) {
      var el = $("[data-input='" + c.key + "']", form);
      if (el && el.value === "") el.value = c.def;
    });
    if (income && income.value === "") income.value = 6100;
    if (give && give.value === "") give.value = 170;
    update();

    var copyBtn = $("[data-copy-plan]");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var v = values();
        var spendTotal = CATS.reduce(function (s, c) { return s + v[c.key]; }, 0);
        var takeHome = Math.max(0, v.income - v.give);
        var lines = ["Mintwise budget snapshot", "Take-home " + money(takeHome)]
          .concat(CATS.map(function (c) { return c.label + ": " + money(v[c.key]); }))
          .concat(["Savings rate: " + outRate.textContent, "Banked / year: " + outYear.textContent]);
        var done = function () {
          var original = copyBtn.textContent;
          copyBtn.textContent = "Snapshot copied";
          setTimeout(function () { copyBtn.textContent = original; }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lines.join("\n")).then(done, done);
        } else { done(); }
      });
    }
  }

  /* ---------- 9. Support form validation ------------------------------ */
  function initForms() {
    $$("[data-validate]").forEach(function (form) {
      var status = $(".form-status", form);
      var list = [];

      var fields = $$("[data-rule]", form).map(function (el) {
        var wrap = el.closest(".field") || el.parentNode;
        var err = $("[data-error-for='" + el.id + "']", form);
        list.push({ el: el, wrap: wrap, err: err });
        return el;
      });

      var check = function (f) {
        var v = (f.el.value || "").trim();
        var rule = f.el.getAttribute("data-rule");
        var msg = "";
        if (f.el.type === "checkbox") {
          if (!f.el.checked) msg = "Tick this so we can reply to you.";
        } else if (rule === "required" || (f.el.hasAttribute("required") && rule !== "email" && rule !== "min20")) {
          if (!v) msg = "Add this so we can route your message.";
        } else if (rule === "email") {
          if (!v) msg = "We need an address to reply to.";
          else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) msg = "That address looks incomplete.";
        } else if (rule === "min20") {
          if (!v) msg = "Tell us what happened, in your words.";
          else if (v.length < 20) msg = "Give us at least 20 characters — " + (20 - v.length) + " to go.";
        }
        if (f.err) {
          f.err.textContent = msg;
          f.err.classList.toggle("is-shown", !!msg);
        }
        f.el.classList.toggle("is-error", !!msg);
        f.el.setAttribute("aria-invalid", msg ? "true" : "false");
        return !msg;
      };

      list.forEach(function (f) {
        var late = function () { check(f); };
        f.el.addEventListener("blur", late);
        if (f.el.type === "checkbox") f.el.addEventListener("change", late);
        f.el.addEventListener("input", function () {
          if (f.el.classList.contains("is-error")) check(f);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var bad = list.filter(function (f) { return !check(f); });
        if (bad.length) {
          if (status) {
            status.className = "form-status form-status--err is-shown";
            status.innerHTML = "<b>" + bad.length + (bad.length === 1 ? " field needs" : " fields need") + " a look</b>The highlighted answers are above.";
          }
          bad[0].el.focus();
          return;
        }
        var name = ($("[data-input='name']", form) || {}).value || "there";
        var ref = "MW-" + Math.floor(1000 + Math.random() * 8999);
        if (status) {
          status.className = "form-status form-status--ok is-shown";
          status.innerHTML = "<b>Thanks, " + String(name).split(" ")[0] + " — ticket " + ref + " is open.</b>A human replies within one business day. Weekday median response: 2 hours 14 minutes.";
          status.setAttribute("tabindex", "-1");
          status.focus();
        }
        form.reset();
        list.forEach(function (f) {
          f.el.classList.remove("is-error");
          if (f.err) f.err.classList.remove("is-shown");
        });
      });
    });

    /* newsletter — footer */
    $$("[data-newsletter]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = $("input", form);
        var note = $(".nl-note", form) || form.parentNode.querySelector(".nl-note");
        if (!input) return;
        var ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim());
        if (note) {
          note.textContent = ok
            ? "You're on the list — first issue lands Thursday 6 a.m."
            : "Enter a complete email address so we can reach you.";
          note.style.color = ok ? "#6ee7b7" : "#fda4af";
        }
        if (ok) input.value = "";
      });
    });
  }

  /* ---------- 10. Current year + folio counter ------------------------ */
  function initMeta() {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- boot ----------------------------------------------------- */
  var boot = function () {
    initNav();
    initTicker();
    initReveal();
    initRail();
    initScrollTop();
    initFaq();
    initPricing();
    initCalculator();
    initForms();
    initMeta();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
