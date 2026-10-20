/* ==========================================================================
   Mintwise — shared behaviour
   Signature motion: Cursor Spotlight + Decode Text. Structure: Index Manuscript.
   Every page-specific block is guarded by an element-existence check.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var clamp = function (n, min, max) {
    return Math.min(Math.max(n, min), max);
  };
  var el = function (tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };

  /* ------------------------------------------------------------------
     Header: stuck state + mobile navigation
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    var toggle = header.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !nav) return;

    var setOpen = function (open) {
      header.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close main menu" : "Open main menu");
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 981) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     Marquee ticker: keep a constant travel speed regardless of copy length
     ------------------------------------------------------------------ */
  function initMarquees() {
    var marquees = document.querySelectorAll("[data-marquee]");
    if (!marquees.length) return;

    var size = function () {
      marquees.forEach(function (m) {
        var group = m.querySelector(".marquee__group");
        if (!group) return;
        var width = group.getBoundingClientRect().width;
        if (!width) return;
        var speed = parseFloat(m.getAttribute("data-marquee-speed") || "72");
        m.style.setProperty("--marquee-dur", Math.round((width / speed) * 2) + "s");
      });
    };

    size();
    window.addEventListener("resize", size);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(size).catch(function () {});
    }
  }

  /* ------------------------------------------------------------------
     Card Deck: stacked cards fan out while the section scrolls
     ------------------------------------------------------------------ */
  function initDecks() {
    var decks = document.querySelectorAll("[data-deck]");
    if (!decks.length) return;

    var wide = window.matchMedia("(min-width: 980px)");

    var apply = function (deck, p) {
      deck.style.setProperty("--p", p.toFixed(3));
      var stage = deck.querySelector(".deck__cards");
      if (stage) stage.style.setProperty("--p", p.toFixed(3));
      var hint = deck.parentElement && deck.parentElement.querySelector("[data-deck-hint]");
      if (hint) hint.style.setProperty("--deck-p", p.toFixed(3));
    };

    var measure = function () {
      decks.forEach(function (deck) {
        var p;
        var rect = deck.getBoundingClientRect();
        var vh = window.innerHeight;
        if (wide.matches) {
          var span = deck.offsetHeight - vh;
          p = span > 0 ? clamp(-rect.top / span, 0, 1) : 1;
        } else {
          var cards = deck.querySelector(".deck__cards");
          var cr = (cards || deck).getBoundingClientRect();
          p = cr.height > 0 ? clamp((vh * 0.9 - cr.top) / (cr.height * 0.85), 0, 1) : 1;
        }
        apply(deck, p);
      });
    };

    var ticking = false;

    var run = function () {
      ticking = false;
      measure();
    };

    var request = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(run);
    };

    if (reduceMotion.matches) {
      decks.forEach(function (deck) {
        apply(deck, 1);
      });
      return;
    }

    /* Only animate while a deck is on screen; the scroll handler stays idle otherwise. */
    var onScreen = 0;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          onScreen += entry.isIntersecting ? 1 : -1;
        });
        onScreen = Math.max(0, onScreen);
        if (onScreen > 0) request();
      },
      { rootMargin: "30% 0px 30% 0px" }
    );

    decks.forEach(function (deck) {
      io.observe(deck);
    });

    window.addEventListener("scroll", function () {
      if (onScreen > 0) request();
    }, { passive: true });
    window.addEventListener("resize", request);
    wide.addEventListener("change", request);
    request();
  }

  /* ------------------------------------------------------------------
     3D card tilt with a following glare
     ------------------------------------------------------------------ */
  function initTilt() {
    var cards = document.querySelectorAll("[data-tilt]");
    if (!cards.length) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var MAX = 8;

    cards.forEach(function (card) {
      var target = { rx: 0, ry: 0, gx: 50, gy: 50 };
      var current = { rx: 0, ry: 0 };
      var frame = null;
      var hovering = false;

      var tick = function () {
        current.rx += (target.rx - current.rx) * 0.14;
        current.ry += (target.ry - current.ry) * 0.14;

        card.style.setProperty("--rx", current.rx.toFixed(2) + "deg");
        card.style.setProperty("--ry", current.ry.toFixed(2) + "deg");
        card.style.setProperty("--gx", target.gx.toFixed(1) + "%");
        card.style.setProperty("--gy", target.gy.toFixed(1) + "%");

        var settled = Math.abs(target.rx - current.rx) < 0.02 && Math.abs(target.ry - current.ry) < 0.02;
        if (settled && !hovering) {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
          frame = null;
          return;
        }
        frame = window.requestAnimationFrame(tick);
      };

      var start = function () {
        if (frame === null) frame = window.requestAnimationFrame(tick);
      };

      card.addEventListener("pointerenter", function (event) {
        if (event.pointerType === "touch") return;
        if (reduceMotion.matches) return;
        hovering = true;
        card.classList.add("is-tilting");
        start();
      });

      card.addEventListener("pointermove", function (event) {
        if (!hovering || reduceMotion.matches) return;
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        target.ry = (x - 0.5) * 2 * MAX;
        target.rx = -(y - 0.5) * 2 * MAX;
        target.gx = x * 100;
        target.gy = y * 100;
      });

      card.addEventListener("pointerleave", function () {
        hovering = false;
        target.rx = 0;
        target.ry = 0;
        target.gx = 50;
        target.gy = 50;
        card.classList.remove("is-tilting");
        start();
      });
    });
  }

  /* ------------------------------------------------------------------
     Features page: filter chips
     ------------------------------------------------------------------ */
  function initFeatureFilter() {
    var wrap = document.querySelector("[data-feature-filter]");
    if (!wrap) return;

    var buttons = wrap.querySelectorAll("[data-filter]");
    var cards = document.querySelectorAll("[data-feature-card]");
    var count = document.querySelector("[data-filter-count]");

    var apply = function (value) {
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        var match = value === "all" || tags.indexOf(value) > -1;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (count) count.textContent = shown === cards.length ? "All " + shown + " features" : shown + " of " + cards.length + " features";
    };

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (other) {
          other.setAttribute("aria-pressed", other === button ? "true" : "false");
        });
        apply(button.getAttribute("data-filter"));
      });
    });

    apply("all");
  }

  /* ------------------------------------------------------------------
     Calculator page: budget inputs -> savings-rate donut
     ------------------------------------------------------------------ */
  function initCalculator() {
    var form = document.querySelector("[data-calc]");
    if (!form) return;

    var STORE = "mintwise.budget.v1";
    var money = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });
    var money2 = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    var incomeInput = form.querySelector("#income");
    var bufferInput = form.querySelector("#buffer");
    var rowsHost = form.querySelector("[data-expense-rows]");
    var donut = form.querySelector("[data-donut-arc]");
    var donutValue = form.querySelector("[data-donut-value]");
    var donutLabel = form.querySelector("[data-donut-label]");
    var savingsBig = form.querySelector("[data-out-savings]");
    var savingsRate = form.querySelector("[data-out-rate]");
    var verdict = form.querySelector("[data-verdict]");
    var verdictText = form.querySelector("[data-verdict-text]");
    var barsHost = form.querySelector("[data-breakdown]");
    var srSummary = form.querySelector("[data-sr-summary]");
    var outIncome = form.querySelector("[data-out-income]");
    var outExpenses = form.querySelector("[data-out-expenses]");
    var outYear = form.querySelector("[data-out-year]");
    var outBuffer = form.querySelector("[data-out-buffer]");
    var outTargets = form.querySelector("[data-out-targets]");

    var CIRC = 2 * Math.PI * 70;
    var announceTimer = 0;
    if (donut) {
      donut.setAttribute("stroke-dasharray", CIRC.toFixed(2) + " " + CIRC.toFixed(2));
      donut.setAttribute("stroke-dashoffset", CIRC.toFixed(2));
    }

    function baseRows() {
      return [
        { name: "Rent or mortgage", amount: 1650, bucket: "needs" },
        { name: "Groceries", amount: 520, bucket: "needs" },
        { name: "Transport", amount: 310, bucket: "needs" },
        { name: "Bills and subscriptions", amount: 240, bucket: "needs" },
        { name: "Dining and fun", amount: 380, bucket: "wants" }
      ];
    }

    var state = load() || {
      income: 5200,
      buffer: 7400,
      rows: baseRows()
    };

    function load() {
      try {
        var raw = window.localStorage.getItem(STORE);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.rows)) return null;
        parsed.rows = parsed.rows.slice(0, 8).map(function (row) {
          return {
            name: String(row.name || "").slice(0, 40),
            amount: Number(row.amount) || 0,
            bucket: row.bucket === "wants" ? "wants" : "needs"
          };
        });
        return parsed;
      } catch (err) {
        return null;
      }
    }

    function save() {
      try {
        window.localStorage.setItem(STORE, JSON.stringify(state));
      } catch (err) {
        /* storage unavailable — the calculator still works in memory */
      }
    }

    function numberValue(input, fallback) {
      var n = parseFloat(String(input.value).replace(/[^0-9.\-]/g, ""));
      return isFinite(n) ? n : fallback;
    }

    function buildRows() {
      rowsHost.textContent = "";
      state.rows.forEach(function (row, index) {
        var suffix = "-" + index;

        var nameField = el("div", "expense-row__cell");
        var nameLabel = el("label", "sr-only");
        nameLabel.setAttribute("for", "expense-name" + suffix);
        nameLabel.textContent = "Category name, row " + (index + 1);
        var nameInput = el("input", "expense-row__name");
        nameInput.id = "expense-name" + suffix;
        nameInput.type = "text";
        nameInput.autocomplete = "off";
        nameInput.value = row.name;
        nameField.append(nameLabel, nameInput);

        var amountField = el("div", "expense-row__cell field--amount");
        var amountLabel = el("label", "sr-only");
        amountLabel.setAttribute("for", "expense-amount" + suffix);
        amountLabel.textContent = "Monthly amount for " + (row.name || "row " + (index + 1));
        var moneyBox = el("div", "field__money");
        var sign = el("span", null);
        sign.setAttribute("aria-hidden", "true");
        sign.textContent = "$";
        var amountInput = el("input", null);
        amountInput.id = "expense-amount" + suffix;
        amountInput.type = "number";
        amountInput.min = "0";
        amountInput.step = "10";
        amountInput.inputMode = "decimal";
        amountInput.value = row.amount;
        moneyBox.append(sign, amountInput);
        amountField.append(amountLabel, moneyBox);

        var bucketField = el("div", "expense-row__cell");
        var bucketLabel = el("label", "sr-only");
        bucketLabel.setAttribute("for", "expense-bucket" + suffix);
        bucketLabel.textContent = "Is " + (row.name || "this category") + " a need or a want?";
        var bucketSelect = el("select", null);
        bucketSelect.id = "expense-bucket" + suffix;
        [
          ["needs", "Need"],
          ["wants", "Want"]
        ].forEach(function (pair) {
          var option = el("option", null);
          option.value = pair[0];
          option.textContent = pair[1];
          bucketSelect.append(option);
        });
        bucketSelect.value = row.bucket;
        bucketField.append(bucketLabel, bucketSelect);

        var remove = el("button", "row-remove");
        remove.type = "button";
        remove.setAttribute("aria-label", "Remove " + (row.name || "this category"));
        remove.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

        var line = el("div", "expense-row");
        line.append(nameField, amountField, bucketField, remove);

        nameInput.addEventListener("input", function () {
          row.name = nameInput.value.slice(0, 40);
          remove.setAttribute("aria-label", "Remove " + (row.name || "this category"));
          bucketLabel.textContent = "Is " + (row.name || "this category") + " a need or a want?";
          amountLabel.textContent = "Monthly amount for " + (row.name || "this row");
          update();
        });

        amountInput.addEventListener("input", function () {
          row.amount = Math.max(0, numberValue(amountInput, 0));
          update();
        });

        bucketSelect.addEventListener("change", function () {
          row.bucket = bucketSelect.value === "wants" ? "wants" : "needs";
          update();
        });

        remove.addEventListener("click", function () {
          if (state.rows.length <= 1) return;
          state.rows.splice(index, 1);
          buildRows();
          update();
        });

        rowsHost.append(line);
      });
    }

    function bar(label, value, total, tone) {
      var pct = total > 0 ? clamp((value / total) * 100, 0, 100) : 0;
      var el = document.createElement("li");
      el.className = "bar";
      el.innerHTML =
        '<div class="bar__head"><b></b><span class="num"></span></div>' +
        '<div class="bar__rail"><div class="bar__fill"></div></div>';
      el.querySelector("b").textContent = label;
      el.querySelector(".bar__head span").textContent =
        money.format(value) + " · " + Math.round(pct) + "%";
      var fill = el.querySelector(".bar__fill");
      fill.style.width = pct.toFixed(1) + "%";
      if (tone) fill.classList.add("bar__fill--" + tone);
      return el;
    }

    function essentialTotal() {
      var needs = state.rows.reduce(function (sum, row) {
        return row.bucket === "needs" ? sum + Math.max(0, row.amount || 0) : sum;
      }, 0);
      if (needs > 0) return needs;
      return state.rows.reduce(function (sum, row) {
        return sum + Math.max(0, row.amount || 0);
      }, 0);
    }

    function update() {
      var income = Math.max(0, numberValue(incomeInput, 0));
      var buffer = Math.max(0, numberValue(bufferInput, 0));
      var expenses = state.rows.reduce(function (sum, row) {
        return sum + Math.max(0, row.amount || 0);
      }, 0);
      var needs = state.rows.reduce(function (sum, row) {
        return row.bucket === "needs" ? sum + Math.max(0, row.amount || 0) : sum;
      }, 0);
      var wants = expenses - needs;
      var savings = income - expenses;
      var rate = income > 0 ? (savings / income) * 100 : 0;

      if (outIncome) outIncome.textContent = money.format(income);
      if (outExpenses) outExpenses.textContent = money.format(expenses);
      if (savingsBig) savingsBig.textContent = (savings < 0 ? "-" : "") + money.format(Math.abs(savings));
      if (outYear) outYear.textContent = money.format(savings * 12);
      if (savingsRate) savingsRate.textContent = (rate < 0 ? "-" : "") + Math.abs(rate).toFixed(1) + "%";

      var essentials = essentialTotal();
      if (outBuffer) {
        outBuffer.textContent =
          buffer > 0 && essentials > 0 ? (buffer / essentials).toFixed(1) : "0.0";
      }
      if (outTargets) {
        outTargets.textContent =
          "Needs " +
          (income > 0 ? Math.round((needs / income) * 100) : 0) +
          "% · Wants " +
          (income > 0 ? Math.round((wants / income) * 100) : 0) +
          "% · Saved " +
          (income > 0 ? Math.round(clamp(rate, 0, 100)) : 0) +
          "%";
      }

      /* Donut */
      var shown = clamp(rate, 0, 100) / 100;
      if (donut) {
        donut.setAttribute("stroke-dashoffset", (CIRC * (1 - shown)).toFixed(2));
        donut.dataset.tone = savings < 0 ? "negative" : rate < 10 ? "low" : "good";
      }
      if (donutValue) donutValue.textContent = Math.round(clamp(rate, 0, 100)) + "%";
      if (donutLabel) donutLabel.textContent = savings < 0 ? "In the red" : "Saved each month";

      /* Verdict */
      var tone = "good";
      var copy;
      if (income <= 0) {
        tone = "warn";
        copy = "Add your monthly take-home pay to see your savings rate.";
      } else if (savings < 0) {
        tone = "bad";
        copy =
          "You are spending " +
          money.format(Math.abs(savings)) +
          " more than you earn. Trim one want category first — that is usually the fastest fix.";
      } else if (rate < 10) {
        tone = "warn";
        copy =
          "At " +
          Math.round(rate) +
          "% you save " +
          money.format(savings) +
          " a month. Moving one subscription or dining week into savings gets you to 10%.";
      } else if (rate < 20) {
        copy =
          "Solid ground: " +
          Math.round(rate) +
          "% saved is " +
          money.format(savings * 12) +
          " a year. The next milestone is 20%, which is " +
          money.format(income * 0.2 - savings) +
          " more each month.";
      } else {
        copy =
          "Excellent. " +
          Math.round(rate) +
          "% puts " +
          money.format(savings * 12) +
          " a year to work — ahead of roughly 8 in 10 households Mintwise tracks.";
      }
      if (verdict) verdict.dataset.tone = tone;
      if (verdictText) verdictText.textContent = copy;

      /* Breakdown */
      if (barsHost) {
        barsHost.textContent = "";
        var total = Math.max(income, expenses, 1);
        if (income > 0) {
          state.rows
            .slice()
            .sort(function (a, b) {
              return b.amount - a.amount;
            })
            .forEach(function (row) {
              if (row.amount <= 0) return;
              barsHost.append(bar(row.name || "Untitled category", row.amount, total, row.bucket === "wants" ? "wants" : null));
            });
          barsHost.append(bar("Left to save", Math.max(savings, 0), total, "savings"));
        }
      }

      if (srSummary) {
        window.clearTimeout(announceTimer);
        announceTimer = window.setTimeout(function () {
          srSummary.textContent =
            "Income " +
            money.format(income) +
            ". Expenses " +
            money.format(expenses) +
            ". " +
            (savings >= 0 ? "Saved " : "Short by ") +
            money2.format(Math.abs(savings)) +
            ", a savings rate of " +
            rate.toFixed(1) +
            " percent.";
        }, 400);
      }

      save();
    }

    /* Wire top-level inputs */
    incomeInput.value = state.income;
    bufferInput.value = state.buffer;
    [incomeInput, bufferInput].forEach(function (input) {
      input.addEventListener("input", update);
    });

    form.querySelector("[data-add-row]") &&
      form.querySelector("[data-add-row]").addEventListener("click", function () {
        if (state.rows.length >= 8) return;
        state.rows.push({ name: "New category", amount: 0, bucket: "wants" });
        buildRows();
        update();
        var names = rowsHost.querySelectorAll(".expense-row__name");
        var last = names[names.length - 1];
        if (last) {
          last.focus();
          last.select();
        }
      });

    form.querySelectorAll("[data-preset]").forEach(function (button) {
      button.addEventListener("click", function () {
        var preset = button.getAttribute("data-preset");
        if (preset === "starter") {
          state = {
            income: 3400,
            buffer: 1800,
            rows: [
              { name: "Rent", amount: 1150, bucket: "needs" },
              { name: "Groceries", amount: 340, bucket: "needs" },
              { name: "Transit and fuel", amount: 210, bucket: "needs" },
              { name: "Phone and streaming", amount: 95, bucket: "needs" },
              { name: "Going out", amount: 260, bucket: "wants" }
            ]
          };
        } else if (preset === "roommates") {
          state = {
            income: 5200,
            buffer: 7400,
            rows: baseRows()
          };
        } else if (preset === "family") {
          state = {
            income: 8600,
            buffer: 19500,
            rows: [
              { name: "Mortgage and tax", amount: 2450, bucket: "needs" },
              { name: "Groceries", amount: 980, bucket: "needs" },
              { name: "Two cars", amount: 760, bucket: "needs" },
              { name: "Childcare", amount: 1150, bucket: "needs" },
              { name: "Utilities and bills", amount: 420, bucket: "needs" },
              { name: "Activities and fun", amount: 640, bucket: "wants" }
            ]
          };
        }
        incomeInput.value = state.income;
        bufferInput.value = state.buffer;
        buildRows();
        update();
      });
    });

    var reset = form.querySelector("[data-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        state = { income: 0, buffer: 0, rows: [{ name: "Rent or mortgage", amount: 0, bucket: "needs" }] };
        incomeInput.value = "";
        bufferInput.value = "";
        buildRows();
        update();
        incomeInput.focus();
      });
    }

    buildRows();
    update();
  }

  /* ------------------------------------------------------------------
     Pricing: monthly / annual switch
     ------------------------------------------------------------------ */
  function initPricingSwitch() {
    var switchEl = document.querySelector("[data-billing-switch]");
    if (!switchEl) return;

    var buttons = switchEl.querySelectorAll("[data-cycle]");
    var prices = document.querySelectorAll("[data-price-monthly]");

    var setCycle = function (cycle) {
      buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-cycle") === cycle ? "true" : "false");
      });
      prices.forEach(function (price) {
        var monthly = price.getAttribute("data-price-monthly");
        var annual = price.getAttribute("data-price-annual");
        var value = cycle === "annual" ? annual : monthly;
        var unit = price.querySelector("[data-price-unit]");
        var amount = price.querySelector("[data-price-amount]");
        if (amount) amount.textContent = value;
        if (unit) unit.textContent = cycle === "annual" ? "per month, billed yearly" : "per month, billed monthly";
      });
      document.querySelectorAll("[data-annual-note]").forEach(function (note) {
        note.hidden = cycle !== "annual";
      });
    };

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        setCycle(button.getAttribute("data-cycle"));
      });
    });

    setCycle("monthly");
  }

  /* ------------------------------------------------------------------
     FAQ accordions
     ------------------------------------------------------------------ */
  function initFaqs() {
    var lists = document.querySelectorAll("[data-faq]");
    if (!lists.length) return;

    lists.forEach(function (list) {
      var items = Array.prototype.slice.call(list.querySelectorAll(".faq__item"));

      items.forEach(function (item) {
        var button = item.querySelector(".faq__q");
        var panel = item.querySelector(".faq__a");
        if (!button || !panel) return;

        var id = panel.id || "faq-panel-" + Math.random().toString(36).slice(2, 8);
        panel.id = id;
        button.setAttribute("aria-controls", id);
        button.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");

        button.addEventListener("click", function () {
          var open = button.getAttribute("aria-expanded") === "true";
          button.setAttribute("aria-expanded", open ? "false" : "true");
          item.classList.toggle("is-open", !open);
        });

        button.addEventListener("keydown", function (event) {
          var index = items.indexOf(item);
          var next = -1;
          if (event.key === "ArrowDown") next = (index + 1) % items.length;
          else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = items.length - 1;
          if (next > -1) {
            event.preventDefault();
            var target = items[next].querySelector(".faq__q");
            if (target) target.focus();
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     Form validation helpers
     ------------------------------------------------------------------ */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function markField(field, message) {
    if (!field) return;
    var wrap = field.closest(".field");
    if (!wrap) return;
    var error = wrap.querySelector(".field__error");
    if (message) {
      wrap.classList.add("has-error");
      field.setAttribute("aria-invalid", "true");
      if (error) {
        error.textContent = message;
        error.id = error.id || "err-" + Math.random().toString(36).slice(2, 7);
        field.setAttribute("aria-describedby", error.id);
      }
    } else {
      wrap.classList.remove("has-error");
      field.removeAttribute("aria-invalid");
      if (error) error.textContent = "";
    }
  }

  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var status = form.querySelector("[data-form-status]");
    var success = document.querySelector("[data-form-success]");
    var name = form.querySelector("#c-name");
    var email = form.querySelector("#c-email");
    var topic = form.querySelector("#c-topic");
    var message = form.querySelector("#c-message");
    var consent = form.querySelector("#c-consent");

    var checks = [
      {
        el: name,
        test: function () {
          return name.value.trim().length >= 2;
        },
        msg: "Enter your name so we know who to reply to.",
        label: "Your name"
      },
      {
        el: email,
        test: function () {
          return EMAIL.test(email.value.trim());
        },
        msg: "Enter a valid email address, like you@example.com.",
        label: "Email address"
      },
      {
        el: topic,
        test: function () {
          return topic.value !== "";
        },
        msg: "Choose the topic that fits your question.",
        label: "Topic"
      },
      {
        el: message,
        test: function () {
          return message.value.trim().length >= 25;
        },
        msg: "Add a little more detail — at least 25 characters.",
        label: "Message"
      },
      {
        el: consent,
        test: function () {
          return consent.checked;
        },
        msg: "Tick the box so we can email you back.",
        label: "Consent"
      }
    ];

    var showStatus = function (kind, html) {
      if (!status) return;
      status.className = "form__status is-visible form__status--" + kind;
      status.textContent = "";
      var box = document.createElement("div");
      box.innerHTML = html;
      status.append(box);
    };

    var clearStatus = function () {
      if (!status) return;
      status.className = "form__status";
      status.textContent = "";
    };

    checks.forEach(function (check) {
      if (!check.el) return;
      var handler = function () {
        if (check.el.value || check.el.checked) {
          markField(check.el, check.test() ? "" : check.msg);
        }
        if (check.test()) markField(check.el, "");
      };
      check.el.addEventListener("blur", handler);
      check.el.addEventListener("input", function () {
        var wrap = check.el.closest(".field");
        if (wrap && wrap.classList.contains("has-error")) handler();
        clearStatus();
      });
      if (check.el.tagName === "SELECT") check.el.addEventListener("change", handler);
      if (check.el.type === "checkbox") check.el.addEventListener("change", handler);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var failed = checks.filter(function (check) {
        return check.el && !check.test();
      });

      checks.forEach(function (check) {
        if (check.el) markField(check.el, check.test() ? "" : check.msg);
      });

      if (failed.length) {
        showStatus(
          "error",
          "<h3>We need " +
            failed.length +
            " more " +
            (failed.length === 1 ? "thing" : "things") +
            "</h3><ul>" +
            failed
              .map(function (check) {
                return "<li>" + check.label + ": " + check.msg + "</li>";
              })
              .join("") +
            "</ul>"
        );
        if (failed[0] && failed[0].el) failed[0].el.focus();
        return;
      }

      clearStatus();
      form.hidden = true;
      if (success) {
        success.hidden = false;
        var ref = success.querySelector("[data-ticket]");
        if (ref) {
          var stamp = Date.now().toString(36).toUpperCase().slice(-5);
          ref.textContent = "MW-" + stamp;
        }
        var who = success.querySelector("[data-success-name]");
        if (who) who.textContent = name.value.trim().split(" ")[0];
        var heading = success.querySelector("h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
      }
    });
  }

  function initNewsletter() {
    var form = document.querySelector("[data-newsletter]");
    if (!form) return;

    var input = form.querySelector("input[type='email']");
    var note = form.parentElement.querySelector("[data-news-note]");
    if (!input || !note) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value.trim();
      if (!EMAIL.test(value)) {
        note.classList.remove("is-visible");
        note.textContent = "Enter a valid email address, like you@example.com.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      input.setAttribute("aria-invalid", "false");
      note.textContent = "Thanks — the first Money Notes issue lands on Sunday.";
      note.classList.add("is-visible");
      form.reset();
    });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ------------------------------------------------------------------
     Signature motion 1: cursor spotlight (rAF-throttled pointer tracking)
     ------------------------------------------------------------------ */
  function initSpotlight() {
    var zones = document.querySelectorAll("[data-spotlight]");
    if (!zones.length) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var track = function (zone) {
      var frame = 0;
      var point = { x: 0, y: 0 };

      zone.addEventListener("pointerenter", function () {
        zone.classList.add("is-spotlit");
      });

      zone.addEventListener("pointermove", function (event) {
        point.x = event.clientX;
        point.y = event.clientY;
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          var box = zone.getBoundingClientRect();
          if (!box.width || !box.height) return;
          zone.style.setProperty("--sx", (((point.x - box.left) / box.width) * 100).toFixed(2) + "%");
          zone.style.setProperty("--sy", (((point.y - box.top) / box.height) * 100).toFixed(2) + "%");
        });
      });

      zone.addEventListener("pointerleave", function () {
        zone.classList.remove("is-spotlit");
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      });
    };

    Array.prototype.forEach.call(zones, track);
  }

  /* ------------------------------------------------------------------
     Signature motion 2: decode text — one keyword resolves on load
     ------------------------------------------------------------------ */
  function initDecode() {
    var nodes = document.querySelectorAll("[data-decode]");
    if (!nodes.length) return;
    if (reduceMotion.matches) return;

    var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%$&*+=/<>0123456789";

    var run = function (node) {
      var answer = node.textContent;
      var length = answer.length;
      var duration = 760 + length * 62;
      var start = null;

      node.classList.add("is-decoding");

      var step = function (stamp) {
        if (start === null) start = stamp;
        var progress = Math.min(1, (stamp - start) / duration);
        var settled = Math.floor(progress * length * 1.12);
        var out = "";

        for (var i = 0; i < length; i++) {
          var ch = answer.charAt(i);
          if (ch === " ") {
            out += " ";
          } else if (i < settled) {
            out += ch;
          } else {
            out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
          }
        }

        node.textContent = out;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          node.textContent = answer;
          node.classList.remove("is-decoding");
        }
      };

      window.setTimeout(function () {
        requestAnimationFrame(step);
      }, 260);
    };

    Array.prototype.forEach.call(nodes, run);
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    initHeader();
    initMarquees();
    initDecks();
    initTilt();
    initFeatureFilter();
    initCalculator();
    initPricingSwitch();
    initFaqs();
    initContactForm();
    initNewsletter();
    initSpotlight();
    initDecode();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
