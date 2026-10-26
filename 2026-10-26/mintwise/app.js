/* ==========================================================================
   MINTWISE — shared behaviour
   Signature motion: word-stagger headline + decode keyword.
   Everything is guarded by element existence so one file serves all pages.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var navList = document.getElementById("nav-list");
  if (toggle && navList) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      navList.classList.toggle("is-open", !open);
    });
    navList.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navList.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  /* ---------- Word-stagger headline ---------- */
  var title = document.querySelector("[data-stagger]");
  if (title && !reduceMotion) {
    document.documentElement.classList.add("js-ready");

    var originals = Array.prototype.slice.call(title.childNodes);
    var fragment = document.createDocumentFragment();
    title.innerHTML = "";
    var animated = [];
    originals.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) {
          var outer = document.createElement("span");
          outer.className = "word";
          var inner = document.createElement("span");
          inner.textContent = w;
          outer.appendChild(inner);
          fragment.appendChild(outer);
          fragment.appendChild(document.createTextNode(" "));
          animated.push(outer);
        });
      } else if (node.nodeType === 1) {
        var outer2 = document.createElement("span");
        outer2.className = "word";
        var inner2b = document.createElement("span");
        inner2b.appendChild(node);
        outer2.appendChild(inner2b);
        fragment.appendChild(outer2);
        fragment.appendChild(document.createTextNode(" "));
        animated.push(outer2);
      }
    });
    title.appendChild(fragment);

    animated.forEach(function (w, i) {
      window.setTimeout(function () {
        w.classList.add("is-in");
      }, 120 + i * 60);
    });
  }

  /* ---------- Decode keyword (runs once, on load) ---------- */
  var decode = document.querySelector(".decode-target");
  if (decode) {
    var finalWord = decode.getAttribute("data-decode-word") || decode.textContent.trim();
    if (reduceMotion) {
      decode.textContent = finalWord;
    } else {
      var glyphs = "▓▒░#$%&@!?*+=<>/\\{}0123456789";
      var frame = 0;
      var settled = 0;
      decode.setAttribute("aria-label", finalWord);
      var tick = function () {
        frame++;
        if (frame % 3 === 0 && settled < finalWord.length) settled++;
        var out = finalWord.slice(0, settled);
        for (var i = settled; i < finalWord.length; i++) {
          out += glyphs.charAt(Math.floor(Math.random() * glyphs.length));
        }
        decode.textContent = out;
        if (settled < finalWord.length) {
          window.requestAnimationFrame(tick);
        } else {
          decode.textContent = finalWord;
        }
      };
      window.setTimeout(function () {
        window.requestAnimationFrame(tick);
      }, 650);
    }
  }

  /* ---------- FAQ accordion (contact.html) ---------- */
  document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      item.classList.toggle("is-open", !open);
    });
  });

  /* ---------- Pricing toggle (pricing.html) ---------- */
  var priceSwitch = document.getElementById("billing-switch");
  if (priceSwitch) {
    priceSwitch.addEventListener("click", function () {
      var annual = priceSwitch.getAttribute("aria-pressed") === "true";
      var next = !annual;
      priceSwitch.setAttribute("aria-pressed", String(next));
      priceSwitch.setAttribute("aria-label", next ? "Switch to monthly billing" : "Switch to annual billing");
      document.querySelectorAll("[data-price-m]").forEach(function (el) {
        el.textContent = next ? el.getAttribute("data-price-y") : el.getAttribute("data-price-m");
      });
      document.querySelectorAll("[data-per-m]").forEach(function (el) {
        el.textContent = next ? el.getAttribute("data-per-y") : el.getAttribute("data-per-m");
      });
    });
  }

  /* ---------- Savings calculator (calculator.html) ---------- */
  var calc = document.getElementById("budget-form");
  if (calc) {
    var arc = document.getElementById("donut-arc");
    var rateEl = document.getElementById("donut-rate");
    var verdictEl = document.getElementById("verdict");
    var summary = {
      income: document.getElementById("out-income"),
      expenses: document.getElementById("out-expenses"),
      savings: document.getElementById("out-savings"),
      yearly: document.getElementById("out-yearly"),
      runway: document.getElementById("out-runway")
    };
    var CIRC = 2 * Math.PI * 90;

    var fmt = function (n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    };

    var readNum = function (input) {
      var v = parseFloat(input.value);
      return isNaN(v) || v < 0 ? 0 : v;
    };

    var update = function () {
      var income = readNum(calc.elements["income"]);
      var side = calc.elements["income2"];
      if (side) income += readNum(side);
      var expenses = 0;
      calc.querySelectorAll(".expense-input").forEach(function (inp) {
        expenses += readNum(inp);
      });
      var savings = Math.max(income - expenses, 0);
      var spent = Math.min(expenses, income);
      var rate = income > 0 ? savings / income : 0;

      arc.setAttribute("stroke-dasharray", String(CIRC));
      arc.setAttribute("stroke-dashoffset", String(CIRC * (1 - rate)));
      rateEl.textContent = Math.round(rate * 100) + "%";

      summary.income.textContent = fmt(income);
      summary.expenses.textContent = fmt(expenses);
      summary.savings.textContent = fmt(savings);
      summary.yearly.textContent = fmt(savings * 12);
      summary.runway.textContent = savings > 0
        ? (fmt(savings) + " / mo")
        : (spent > 0 ? "−" + fmt(expenses - income) + " / mo" : "—");

      var level, label;
      if (income === 0) { level = "zero"; label = "Add your monthly income to begin"; }
      else if (savings === 0) { level = "zero"; label = "Spending meets or exceeds income"; }
      else if (rate < 0.1) { level = "tight"; label = "Under 10% — start with one flagged subscription"; }
      else if (rate < 0.2) { level = "solid"; label = "Solid — most households stall out below 15%"; }
      else { level = "high"; label = "Excellent — you are in the top decile of savers"; }
      verdictEl.setAttribute("data-level", level);
      verdictEl.textContent = label;
    };

    calc.addEventListener("input", update);

    var addBtn = document.getElementById("add-expense");
    if (addBtn) {
      var addCount = 0;
      addBtn.addEventListener("click", function () {
        addCount++;
        var slot = document.getElementById("custom-expenses");
        var row = document.createElement("div");
        row.className = "field";
        var id = "custom-" + addCount;
        var label = document.createElement("label");
        label.setAttribute("for", id);
        label.textContent = "Custom line " + addCount;
        var box = document.createElement("span");
        box.className = "money-input";
        var input = document.createElement("input");
        input.type = "number";
        input.id = id;
        input.name = "custom-" + addCount;
        input.min = "0";
        input.step = "10";
        input.placeholder = "0";
        input.className = "expense-input";
        input.inputMode = "decimal";
        box.appendChild(input);
        row.appendChild(label);
        row.appendChild(box);
        slot.appendChild(row);
        input.focus();
        update();
      });
    }

    var resetBtn = document.getElementById("calc-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        calc.reset();
        var slot = document.getElementById("custom-expenses");
        if (slot) slot.innerHTML = "";
        update();
      });
    }

    update();
  }

  /* ---------- Contact form (contact.html) ---------- */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = document.getElementById("form-success");
      if (ok) {
        ok.classList.add("is-visible");
        ok.focus && ok.focus();
      }
      contactForm.reset();
    });
  }
})();
