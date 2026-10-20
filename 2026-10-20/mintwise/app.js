/* ==========================================================================
   Mintwise — shared behaviors
   Vanilla JS, no dependencies. Every feature is guarded by element checks so
   one file can serve all five pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* -----------------------------------------------------------------------
     1. Mission clock in the status strip
     --------------------------------------------------------------------- */
  function initClock() {
    var el = $("[data-clock]");
    if (!el) return;
    function tick() {
      var d = new Date();
      var p = function (n) { return String(n).padStart(2, "0"); };
      el.textContent = p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + " UTC";
    }
    tick();
    setInterval(tick, 1000);
  }

  /* -----------------------------------------------------------------------
     2. Mobile navigation
     --------------------------------------------------------------------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("[data-nav]");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) setOpen(false);
    });
  }

  /* -----------------------------------------------------------------------
     3. Scroll progress line under the sticky header
     --------------------------------------------------------------------- */
  function initScrollLine() {
    var bar = $("[data-scroll-line]");
    if (!bar) return;
    var queued = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      queued = false;
    }
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* -----------------------------------------------------------------------
     4. Word-stagger headline (signature motion)
     --------------------------------------------------------------------- */
  function initStagger() {
    $$("[data-stagger]").forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      if (!words.length) return;
      el.textContent = "";
      words.forEach(function (word, i) {
        var outer = document.createElement("span");
        outer.className = "w";
        outer.setAttribute("aria-hidden", "true");
        outer.style.setProperty("--d", (i * 60) + "ms");
        var inner = document.createElement("i");
        inner.textContent = word;
        outer.appendChild(inner);
        el.appendChild(outer);
        el.appendChild(document.createTextNode(" "));
      });
      /* the visible text is aria-hidden while animating, so expose it once */
      var sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = words.join(" ");
      el.appendChild(sr);
      if (reduceMotion) {
        $$(".w", el).forEach(function (w) { w.style.overflow = "visible"; });
      }
    });
  }

  /* -----------------------------------------------------------------------
     5. Spring accordion — one panel open per group
     --------------------------------------------------------------------- */
  function initAccordion() {
    $$(".acc").forEach(function (acc) {
      var buttons = $$(".acc__btn", acc);
      if (!buttons.length) return;

      function close(others) {
        others.forEach(function (btn) {
          var item = btn.closest(".acc__item");
          if (!item) return;
          item.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
        });
      }

      buttons.forEach(function (btn) {
        var item = btn.closest(".acc__item");
        var panel = $(".acc__panel", item);
        if (panel && !panel.id) panel.id = "panel-" + Math.random().toString(36).slice(2, 8);
        if (panel) btn.setAttribute("aria-controls", panel.id);

        btn.addEventListener("click", function () {
          var isOpen = btn.getAttribute("aria-expanded") === "true";
          close(buttons.filter(function (b) { return b !== btn; }));
          btn.setAttribute("aria-expanded", String(!isOpen));
          item.classList.toggle("is-open", !isOpen);
        });

        btn.addEventListener("keydown", function (e) {
          var i = buttons.indexOf(btn);
          var next = -1;
          if (e.key === "ArrowDown") next = (i + 1) % buttons.length;
          if (e.key === "ArrowUp") next = (i - 1 + buttons.length) % buttons.length;
          if (e.key === "Home") next = 0;
          if (e.key === "End") next = buttons.length - 1;
          if (next > -1) { e.preventDefault(); buttons[next].focus(); }
        });
      });

      var first = acc.querySelector('.acc__btn[aria-expanded="true"]');
      if (first) first.closest(".acc__item").classList.add("is-open");

      /* deep link: open the panel whose id is in the URL hash */
      if (window.location.hash) {
        var target = acc.querySelector(window.location.hash + " .acc__btn");
        if (target) {
          close(buttons.filter(function (b) { return b !== target; }));
          target.setAttribute("aria-expanded", "true");
          target.closest(".acc__item").classList.add("is-open");
        }
      }
    });
  }

  /* -----------------------------------------------------------------------
     6. Command palette (⌘K / Ctrl+K)
     --------------------------------------------------------------------- */
  function initPalette() {
    var trigger = $("[data-palette-open]");
    var palette = $("[data-palette]");
    if (!palette) return;

    var list = $("[data-palette-list]", palette);
    var input = $("[data-palette-input]", palette);
    var items = $$("li", list);
    var lastFocus = null;
    var active = 0;

    function visible() {
      return items.filter(function (li) { return li.hidden !== true; });
    }
    function mark() {
      var vis = visible();
      items.forEach(function (li) { li.classList.remove("is-active"); });
      if (!vis.length) return;
      active = Math.min(active, vis.length - 1);
      vis[active].classList.add("is-active");
      var link = vis[active].querySelector("a");
      if (link && input) input.setAttribute("aria-activedescendant", link.id);
    }
    function open() {
      lastFocus = document.activeElement;
      palette.hidden = false;
      if (input) { input.value = ""; filter(""); }
      active = 0;
      mark();
      if (input) input.focus();
      document.addEventListener("keydown", onKey, true);
    }
    function close() {
      palette.hidden = true;
      document.removeEventListener("keydown", onKey, true);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function filter(q) {
      var needle = q.toLowerCase().trim();
      items.forEach(function (li) {
        var hay = (li.textContent || "").toLowerCase();
        li.hidden = needle.length > 0 && hay.indexOf(needle) === -1;
      });
      active = 0;
      mark();
    }

    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      var vis = visible();
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(1, vis.length); mark(); }
      if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + vis.length) % Math.max(1, vis.length); mark(); }
      if (e.key === "Enter" && vis.length) {
        var link = vis[Math.min(active, vis.length - 1)].querySelector("a");
        if (link) { e.preventDefault(); window.location.href = link.getAttribute("href"); }
      }
      if (e.key === "Tab") { e.preventDefault(); if (input) input.focus(); }
    }

    if (trigger) trigger.addEventListener("click", open);
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (palette.hidden) open(); else close();
      }
    });
    palette.addEventListener("click", function (e) {
      if (e.target === palette) close();
    });
    if (input) input.addEventListener("input", function () { filter(input.value); });
    mark();
  }

  /* -----------------------------------------------------------------------
     7. Station rail — sticky pane tracks the flowing column
     --------------------------------------------------------------------- */
  function initStations() {
    var rail = $("[data-rail]");
    var blocks = $$("[data-station]");
    if (!rail || !blocks.length) return;

    var entries = $$("li", rail);
    var nameEl = $("[data-station-name]");
    var descEl = $("[data-station-desc]");
    var idxEl = $("[data-station-index]");

    function select(i) {
      entries.forEach(function (li, n) { li.classList.toggle("is-active", n === i); });
      var block = blocks[i];
      if (!block) return;
      if (nameEl) nameEl.textContent = block.getAttribute("data-station-name") || "";
      if (descEl) descEl.textContent = block.getAttribute("data-station-desc") || "";
      if (idxEl) idxEl.textContent = "Station " + String(i + 1).padStart(2, "0") + " / " + String(blocks.length).padStart(2, "0");
    }

    entries.forEach(function (li, i) {
      var btn = $("button", li);
      if (!btn) return;
      btn.addEventListener("click", function () {
        blocks[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        select(i);
      });
    });

    if (!("IntersectionObserver" in window)) { select(0); return; }
    var current = -1;
    var pending = false;

    function pick() {
      var line = window.innerHeight * 0.42;
      var best = 0;
      blocks.forEach(function (b, i) {
        if (b.getBoundingClientRect().top <= line) best = i;
      });
      if (best !== current) { current = best; select(best); }
    }

    function onScroll() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; pick(); });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    pick();
  }

  /* -----------------------------------------------------------------------
     8. Savings-rate calculator
     --------------------------------------------------------------------- */
  var CATS = [
    { key: "housing", label: "Housing & Utilities", color: "#064e3b", share: 0.30 },
    { key: "food", label: "Food & Household", color: "#0d9488", share: 0.12 },
    { key: "transport", label: "Transport", color: "#0369a3", share: 0.09 },
    { key: "health", label: "Health & Insurance", color: "#f59e0b", share: 0.05 },
    { key: "leisure", label: "Leisure & Dining Out", color: "#38bdf8", share: 0.07 },
    { key: "debt", label: "Debt Payments", color: "#be123c", share: 0.06 }
  ];
  var SAVE_COLOR = "#10b981";
  var R = 80;
  var C = 2 * Math.PI * R;

  function initCalculator() {
    var form = $("[data-calc]");
    if (!form) return;

    var income = $("[data-calc-income]", form);
    var buffer = $("[data-calc-buffer]", form);
    var incomeError = $("[data-error-income]");
    var donut = $("[data-donut]", form);
    var segGroup = $("[data-donut-segments]", donut);
    var rateEl = $("[data-out-rate]");
    var legend = $("[data-legend]");
    var live = $("[data-calc-live]");
    var verdict = $("[data-verdict]");
    var presetWrap = $("[data-presets]");

    /* build segments + legend + slider rows once */
    var segs = {};
    if (segGroup && !segGroup.children.length) {
      var ns = "http://www.w3.org/2000/svg";
      CATS.forEach(function (c) {
        var circle = document.createElementNS(ns, "circle");
        circle.setAttribute("class", "donut__seg");
        circle.setAttribute("cx", "100");
        circle.setAttribute("cy", "100");
        circle.setAttribute("r", String(R));
        circle.setAttribute("stroke", c.color);
        circle.setAttribute("stroke-dasharray", "0 " + C.toFixed(2));
        circle.setAttribute("stroke-dashoffset", "0");
        segGroup.appendChild(circle);
        segs[c.key] = circle;
      });
      var save = document.createElementNS(ns, "circle");
      save.setAttribute("class", "donut__seg");
      save.setAttribute("cx", "100");
      save.setAttribute("cy", "100");
      save.setAttribute("r", String(R));
      save.setAttribute("stroke", SAVE_COLOR);
      save.setAttribute("stroke-linecap", "round");
      save.setAttribute("stroke-dasharray", "0 " + C.toFixed(2));
      segGroup.appendChild(save);
      segs.savings = save;
    }

    var catInputs = {};
    CATS.forEach(function (c) {
      var num = form.querySelector('[data-cat="' + c.key + '"]');
      var range = form.querySelector('[data-cat-range="' + c.key + '"]');
      if (num) catInputs[c.key] = { num: num, range: range };
    });

    function val(el) {
      var n = parseFloat(el && el.value);
      return isFinite(n) && n > 0 ? n : 0;
    }

    function syncRange(input, max) {
      if (!input.range) return;
      input.range.max = String(Math.max(100, Math.round(max)));
      var v = val(input.num);
      input.range.value = String(Math.min(v, input.range.max));
      var pct = input.range.max > 0 ? (v / input.range.max) * 100 : 0;
      input.range.style.setProperty("--fill", Math.min(100, Math.max(0, pct)).toFixed(1) + "%");
    }

    function fmtPct(n) { return (Math.round(n * 10) / 10).toFixed(1) + "%"; }

    function render() {
      var incomeV = val(income);
      var total = 0;
      var rows = [];
      CATS.forEach(function (c) {
        var v = catInputs[c.key] ? val(catInputs[c.key].num) : 0;
        total += v;
        rows.push({ c: c, v: v });
      });
      var savings = incomeV - total;
      var rate = incomeV > 0 ? (savings / incomeV) * 100 : 0;
      var bufferV = val(buffer);
      var runway = total > 0 ? bufferV / total : 0;

      /* invalid income → reset the readout, explain why */
      if (incomeV <= 0) {
        if (incomeError) {
          incomeError.textContent = "Enter a monthly take-home amount above $0 to run the model.";
        }
        if (income) income.setAttribute("aria-invalid", "true");
      } else {
        if (incomeError) incomeError.textContent = "";
        if (income) income.removeAttribute("aria-invalid");
      }

      /* donut */
      var base = Math.max(incomeV, total);
      var offset = 0;
      rows.forEach(function (r) {
        var frac = base > 0 ? r.v / base : 0;
        var len = frac * C;
        var el = segs[r.c.key];
        if (!el) return;
        el.setAttribute("stroke-dasharray", len.toFixed(2) + " " + (C - len).toFixed(2));
        el.setAttribute("stroke-dashoffset", (-offset).toFixed(2));
        offset += len;
      });
      var saveEl = segs.savings;
      if (saveEl) {
        var sLen = base > 0 ? Math.max(0, savings) / base * C : 0;
        saveEl.setAttribute("stroke-dasharray", sLen.toFixed(2) + " " + (C - sLen).toFixed(2));
        saveEl.setAttribute("stroke-dashoffset", (-offset).toFixed(2));
      }
      if (rateEl) rateEl.textContent = incomeV > 0 ? fmtPct(rate) : "—";
      $$("[data-out-rate]", form).forEach(function (el) {
        el.textContent = incomeV > 0 ? fmtPct(rate) : "—";
      });
      var capEl = $("[data-donut-cap]", form);
      if (capEl) capEl.textContent = incomeV > 0 ? (savings >= 0 ? "kept monthly" : "short monthly") : "awaiting income";

      /* legend */
      if (legend) {
        legend.textContent = "";
        var addRow = function (color, label, value, pct) {
          var li = document.createElement("li");
          var sw = document.createElement("span");
          sw.className = "cat__swatch";
          sw.style.background = color;
          var nm = document.createElement("span");
          nm.textContent = label;
          var vv = document.createElement("span");
          vv.className = "legend__v";
          vv.textContent = value;
          var pp = document.createElement("span");
          pp.className = "legend__p";
          pp.textContent = pct;
          li.append(sw, nm, vv, pp);
          legend.appendChild(li);
        };
        rows.forEach(function (r) {
          addRow(r.c.color, r.c.label, usd.format(r.v), (base > 0 ? (r.v / base) * 100 : 0).toFixed(0) + "%");
        });
        addRow(SAVE_COLOR, "Savings & Investing", usd.format(Math.max(0, savings)), savings >= 0 ? fmtPct(rate) : "0%");
        if (savings < 0) {
          addRow("#be123c", "Monthly Shortfall", usd.format(Math.abs(savings)), "over");
        }
      }

      /* readouts */
      set("[data-out-burn]", usd.format(total));
      set("[data-out-surplus]", savings >= 0 ? usd.format(savings) : "−" + usd.format(Math.abs(savings)));
      set("[data-out-year]", savings >= 0 ? usd.format(savings * 12) : "−" + usd.format(Math.abs(savings) * 12));
      set("[data-out-runway]", incomeV > 0 ? runway.toFixed(1) + " months" : "—");
      set("[data-out-fixed]", pctOf(base, rows[0].v + rows[5].v));
      set("[data-out-flex]", pctOf(base, rows[1].v + rows[2].v + rows[3].v + rows[4].v));

      /* verdict */
      var v = verdict;
      if (v) {
        var cls = "verdict ";
        var title = "";
        var body = "";
        if (incomeV <= 0) {
          cls += "verdict--mid";
          title = "Waiting on income";
          body = "Add your monthly take-home pay and the model will plot your savings rate.";
        } else if (savings < 0) {
          cls += "verdict--low";
          title = "You are " + usd.format(Math.abs(savings)) + " over each month";
          body = "Trim one flexible category or move a bill to a cheaper plan. Mintwise flags the three easiest cuts the moment you connect an account.";
        } else if (rate < 5) {
          cls += "verdict--low";
          title = "Building a floor";
          body = "At " + fmtPct(rate) + " you are saving under half a week per month. Aim for 5% first — that is roughly one autopay you can redirect.";
        } else if (rate < 15) {
          cls += "verdict--mid";
          title = "On the climb";
          body = "At " + fmtPct(rate) + " you bank " + usd.format(savings) + " a month. Raising it 5 points adds " + usd.format(incomeV * 0.05) + " a month, or " + usd.format(incomeV * 0.6) + " a year.";
        } else if (rate < 25) {
          cls += "verdict--good";
          title = "Solid trajectory";
          body = "At " + fmtPct(rate) + " you reach an emergency fund in about " + monthsToFund(bufferV, savings) + " months and retire roughly a decade early versus a 5% saver.";
        } else {
          cls += "verdict--good";
          title = "Flight-deck discipline";
          body = "At " + fmtPct(rate) + " you keep " + usd.format(savings) + " of every month. Protect it with a separate goal account before lifestyle creep finds it.";
        }
        v.className = cls;
        $("[data-verdict-title]", v).textContent = title;
        $("[data-verdict-body]", v).textContent = body;
      }

      CATS.forEach(function (c) {
        if (catInputs[c.key]) syncRange(catInputs[c.key], Math.max(val(income), 1000));
      });

      if (live) {
        live.textContent = incomeV > 0
          ? "Savings rate " + fmtPct(rate) + ". Spending " + usd.format(total) + " of " + usd.format(incomeV) + " monthly."
          : "Enter income to calculate.";
      }
    }

    function set(sel, text) {
      var el = $(sel, form);
      if (el) el.textContent = text;
    }
    function pctOf(base, v) {
      return base > 0 ? ((v / base) * 100).toFixed(0) + "%" : "—";
    }
    function monthsToFund(current, monthly) {
      var target = 12000;
      if (monthly <= 0) return "∞";
      return Math.max(0, Math.ceil((target - current) / monthly));
    }

    /* wire inputs */
    [income, buffer].concat(CATS.map(function (c) { return catInputs[c.key]; }).filter(Boolean).map(function (o) { return o.num; }))
      .forEach(function (el) {
        if (!el) return;
        el.addEventListener("input", render);
      });
    CATS.forEach(function (c) {
      var o = catInputs[c.key];
      if (!o || !o.range) return;
      o.range.addEventListener("input", function () {
        o.num.value = o.range.value;
        render();
      });
    });

    /* presets */
    var PRESETS = {
      solo: { income: 5200, buffer: 6400, v: { housing: 1550, food: 520, transport: 400, health: 240, leisure: 380, debt: 260 } },
      balanced: { income: 8600, buffer: 14200, v: { housing: 2650, food: 980, transport: 720, health: 460, leisure: 700, debt: 640 } },
      family: { income: 12400, buffer: 22800, v: { housing: 4200, food: 1780, transport: 1150, health: 890, leisure: 940, debt: 1120 } },
      student: { income: 2900, buffer: 1800, v: { housing: 1050, food: 380, transport: 210, health: 120, leisure: 240, debt: 180 } }
    };
    if (presetWrap) {
      $$("[data-preset]", presetWrap).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var p = PRESETS[btn.getAttribute("data-preset")];
          if (!p) return;
          income.value = String(p.income);
          buffer.value = String(p.buffer);
          CATS.forEach(function (c) {
            if (catInputs[c.key]) catInputs[c.key].num.value = String(p.v[c.key]);
          });
          $$("[data-preset]", presetWrap).forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === btn));
          });
          render();
        });
      });
    }

    var resetBtn = $("[data-calc-reset]", form);
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        income.value = "0";
        buffer.value = "0";
        CATS.forEach(function (c) { if (catInputs[c.key]) catInputs[c.key].num.value = "0"; });
        $$("[data-preset]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        render();
        if (income) income.focus();
      });
    }

    render();
  }

  /* -----------------------------------------------------------------------
     9. Contact form validation
     --------------------------------------------------------------------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;

    var status = $("[data-form-status]", form);
    var fields = $$("[data-validate]", form);

    function errorFor(el) {
      var v = (el.value || "").trim();
      var type = el.getAttribute("data-validate");
      if (type === "required" && !v) return "Add this so we can route your message.";
      if (type === "email") {
        if (!v) return "We need an email address to reply to you.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return "That address looks incomplete — check for a missing @ or domain.";
      }
      if (type === "message") {
        if (!v) return "Tell us what happened in a sentence or two.";
        if (v.length < 20) return "Add a little more detail — about " + (20 - v.length) + " more characters helps.";
      }
      if (type === "select" && !v) return "Choose the team that should pick this up.";
      if (type === "consent" && !el.checked) return "Tick this so we can contact you about your request.";
      return "";
    }

    function show(el, msg) {
      var box = form.querySelector('[data-error-for="' + el.id + '"]');
      if (box) box.textContent = msg;
      if (msg) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    }

    fields.forEach(function (el) {
      el.addEventListener("blur", function () { show(el, errorFor(el)); });
      el.addEventListener("input", function () {
        if (el.getAttribute("aria-invalid") === "true") show(el, errorFor(el));
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      fields.forEach(function (el) {
        var msg = errorFor(el);
        show(el, msg);
        if (msg && !first) first = el;
      });
      if (first) {
        first.focus();
        if (status) {
          status.classList.remove("is-visible");
        }
        return;
      }
      var name = (form.querySelector('[name="name"]') || {}).value || "there";
      var ticket = "MW-" + String(Math.floor(1000 + Math.random() * 8999));
      if (status) {
        $("[data-ticket]", status).textContent = ticket;
        $("[data-first]", status).textContent = name.split(" ")[0];
        status.classList.add("is-visible");
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      form.reset();
      $$("[data-error]", form).forEach(function (b) { b.textContent = ""; });
      var counter = $("[data-counter]", form);
      if (counter) {
        counter.textContent = "0";
        if (counter.parentNode) counter.parentNode.classList.remove("is-over");
      }
    });
  }

  /* -----------------------------------------------------------------------
     10. Character counter
     --------------------------------------------------------------------- */
  function initCounter() {
    $$("[data-counter-for]").forEach(function (out) {
      var src = document.getElementById(out.getAttribute("data-counter-for"));
      if (!src) return;
      var max = parseInt(src.getAttribute("maxlength") || "600", 10);
      function upd() {
        out.textContent = String(src.value.length);
        out.parentNode.classList.toggle("is-over", src.value.length > max);
      }
      src.addEventListener("input", upd);
      upd();
    });
  }

  /* -----------------------------------------------------------------------
     11. Pricing billing toggle
     --------------------------------------------------------------------- */
  function initPricing() {
    var group = $("[data-billing-toggle]");
    if (!group) return;
    var buttons = $$("[data-billing]", group);
    var prices = $$("[data-price-monthly]");
    var period = $("[data-price-period]");

    function apply(mode) {
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-billing") === mode)); });
      prices.forEach(function (el) {
        var m = parseFloat(el.getAttribute("data-price-monthly"));
        var a = parseFloat(el.getAttribute("data-price-annual"));
        el.textContent = usd.format(mode === "annual" ? a : m);
      });
      $$("[data-bill-note]").forEach(function (el) {
        var m = parseFloat(el.getAttribute("data-monthly"));
        var a = parseFloat(el.getAttribute("data-annual"));
        el.textContent = mode === "annual"
          ? "Billed " + usd.format(a * 12) + " once a year — you keep " + usd.format(m * 12 - a * 12) + "."
          : "Billed " + usd.format(m) + " every month, cancel any time.";
      });
      if (period) period.textContent = mode === "annual" ? "Annual · two months free" : "Monthly · no commitment";
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-billing")); });
    });
    apply("monthly");
  }

  /* -----------------------------------------------------------------------
     12. Boot
     --------------------------------------------------------------------- */
  function boot() {
    initClock();
    initNav();
    initScrollLine();
    initStagger();
    initAccordion();
    initPalette();
    initStations();
    initCalculator();
    initContactForm();
    initCounter();
    initPricing();
    var year = $("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
