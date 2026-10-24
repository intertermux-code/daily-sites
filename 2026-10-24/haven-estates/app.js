/* ==========================================================================
   Haven Estates — shared behaviour
   Each module is guarded by element-existence checks so one file serves
   every page. Motion respects prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Header state ---------- */

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  /* ---------- 2. Mobile navigation ---------- */

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    nav.addEventListener("focusout", function (event) {
      if (window.innerWidth > 900) return;
      window.setTimeout(function () {
        if (!nav.contains(document.activeElement) && !toggle.contains(document.activeElement)) {
          setOpen(false);
        }
      }, 0);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---------- 3. Signature motion: clip-path image reveal ---------- */

  function initReveals() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
          el.style.setProperty("--reveal-delay", delay + "ms");
          el.classList.add("is-revealed");
          observer.unobserve(el);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- 4. Signature motion: animated counters ---------- */

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function formatCount(value, decimals, prefix, suffix, grouping) {
    var out = value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping !== "false"
    });
    return (prefix || "") + out + (suffix || "");
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;

    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var grouping = el.getAttribute("data-grouping");

    if (reduceMotion) {
      el.textContent = formatCount(target, decimals, prefix, suffix, grouping);
      return;
    }

    var duration = 1200;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var value = target * easeOutExpo(progress);
      el.textContent = formatCount(value, decimals, prefix, suffix, grouping);
      if (progress < 1) window.requestAnimationFrame(step);
    }

    el.textContent = formatCount(0, decimals, prefix, suffix, grouping);
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
      return;
    }

    counters.forEach(function (el) {
      el.textContent = "0";
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- 5. Listing filters (listings.html) ---------- */

  function initListings() {
    var form = document.getElementById("listing-filters");
    var grid = document.getElementById("listing-grid");
    if (!form || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-listing]"));
    var countNode = document.getElementById("result-count");
    var empty = document.getElementById("no-results");
    var sortSelect = form.querySelector('[name="sort"]');

    function chipValue(group) {
      var pressed = form.querySelector('[data-group="' + group + '"][aria-pressed="true"]');
      return pressed ? parseFloat(pressed.getAttribute("data-value")) : 0;
    }

    function field(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? el.value : "";
    }

    function apply() {
      var location = field("location") || "all";
      var type = field("type") || "all";
      var maxPrice = parseFloat(field("maxPrice")) || Infinity;
      var minBeds = chipValue("beds");
      var minBaths = chipValue("baths");

      var visible = cards.filter(function (card) {
        var price = parseFloat(card.getAttribute("data-price"));
        var beds = parseFloat(card.getAttribute("data-beds"));
        var baths = parseFloat(card.getAttribute("data-baths"));
        return (
          (location === "all" || card.getAttribute("data-location") === location) &&
          (type === "all" || card.getAttribute("data-type") === type) &&
          price <= maxPrice &&
          beds >= minBeds &&
          baths >= minBaths
        );
      });

      cards.forEach(function (card) {
        card.classList.toggle("is-hidden", visible.indexOf(card) === -1);
      });

      if (sortSelect && visible.length) {
        var mode = sortSelect.value;
        var sorted = visible.slice().sort(function (a, b) {
          var priceA = parseFloat(a.getAttribute("data-price"));
          var priceB = parseFloat(b.getAttribute("data-price"));
          var sizeA = parseFloat(a.getAttribute("data-sqft"));
          var sizeB = parseFloat(b.getAttribute("data-sqft"));
          if (mode === "price-asc") return priceA - priceB;
          if (mode === "price-desc") return priceB - priceA;
          if (mode === "largest") return sizeB - sizeA;
          return (
            parseFloat(b.getAttribute("data-order")) - parseFloat(a.getAttribute("data-order"))
          );
        });
        sorted.forEach(function (card) {
          grid.appendChild(card);
        });
      }

      if (countNode) {
        countNode.textContent =
          visible.length + (visible.length === 1 ? " residence" : " residences") + " matching";
      }
      if (empty) {
        empty.classList.toggle("is-visible", visible.length === 0);
      }
    }

    /* Chip groups behave as toggleable minimums */
    form.querySelectorAll(".chip[data-group]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var group = chip.getAttribute("data-group");
        var wasPressed = chip.getAttribute("aria-pressed") === "true";
        form.querySelectorAll('.chip[data-group="' + group + '"]').forEach(function (item) {
          item.setAttribute("aria-pressed", "false");
        });
        chip.setAttribute("aria-pressed", wasPressed ? "false" : "true");
        apply();
      });
    });

    form.querySelectorAll("select").forEach(function (select) {
      select.addEventListener("change", apply);
    });

    var reset = document.getElementById("reset-filters");
    if (reset) {
      reset.addEventListener("click", function () {
        form.querySelectorAll("select").forEach(function (select) {
          select.selectedIndex = 0;
        });
        form.querySelectorAll(".chip[data-group]").forEach(function (chip) {
          chip.setAttribute("aria-pressed", "false");
        });
        apply();
        form.querySelector("select").focus();
      });
    }

    /* Deep links: index.html search hands off query params */
    var params = new URLSearchParams(window.location.search);
    var mapped = false;
    ["location", "type", "maxPrice", "sort"].forEach(function (key) {
      var value = params.get(key);
      if (!value) return;
      var control = form.querySelector('[name="' + key + '"]');
      if (control && control.querySelector('option[value="' + value + '"]')) {
        control.value = value;
        mapped = true;
      }
    });
    ["beds", "baths"].forEach(function (group) {
      var value = params.get(group);
      if (!value) return;
      var chip = form.querySelector('.chip[data-group="' + group + '"][data-value="' + value + '"]');
      if (chip) {
        chip.setAttribute("aria-pressed", "true");
        mapped = true;
      }
    });

    apply();
    if (mapped && countNode) {
      countNode.setAttribute("data-deep-linked", "true");
    }
  }

  /* ---------- 6. Property gallery (property.html) ---------- */

  function initGallery() {
    var stage = document.getElementById("gallery-main-img");
    var thumbs = document.querySelectorAll(".thumb");
    if (!stage || !thumbs.length) return;

    var caption = document.getElementById("gallery-caption");

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var image = thumb.getAttribute("data-img");
        var label = thumb.getAttribute("data-label");
        if (!image) return;

        thumbs.forEach(function (other) {
          other.setAttribute("aria-pressed", other === thumb ? "true" : "false");
        });

        stage.src = image;
        stage.setAttribute("alt", label || "Property photograph");
        if (caption) caption.textContent = label || "";

        if (!reduceMotion) {
          stage.animate(
            [{ opacity: 0.25 }, { opacity: 1 }],
            { duration: 380, easing: "cubic-bezier(0.16,0.84,0.28,1)" }
          );
        }
      });
    });
  }

  /* ---------- 7. Mortgage calculator (contact.html) ---------- */

  function money(value) {
    return value.toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0
    });
  }

  function initCalculator() {
    var calc = document.getElementById("mortgage-calculator");
    if (!calc) return;

    var priceRange = calc.querySelector('[name="priceRange"]');
    var priceInput = calc.querySelector('[name="price"]');
    var depositRange = calc.querySelector('[name="depositPct"]');
    var rateRange = calc.querySelector('[name="rate"]');
    var termSelect = calc.querySelector('[name="term"]');

    var depositValue = document.getElementById("out-deposit-amount");
    var depositNote = document.getElementById("out-deposit-note");
    var rateValue = document.getElementById("out-rate");
    var termValue = document.getElementById("out-term");
    var loanValue = document.getElementById("out-loan");
    var monthlyValue = document.getElementById("out-monthly");
    var interestValue = document.getElementById("out-interest");
    var totalValue = document.getElementById("out-total");
    var barValue = document.getElementById("out-bar");
    var payable = document.getElementById("out-payable-years");

    function sync() {
      var price = Math.max(0, parseFloat(priceInput.value) || 0);
      var depositPct = Math.min(90, Math.max(0, parseFloat(depositRange.value) || 0));
      var rate = Math.max(0.1, parseFloat(rateRange.value) || 0);
      var years = Math.max(1, parseInt(termSelect.value, 10) || 25);

      var deposit = Math.round((price * depositPct) / 100);
      var loan = Math.max(0, price - deposit);
      var monthlyFactor = rate / 100 / 12;
      var months = years * 12;
      var monthly =
        loan <= 0
          ? 0
          : (loan * monthlyFactor) / (1 - Math.pow(1 + monthlyFactor, -months));
      var totalPaid = monthly * months;
      var interest = Math.max(0, totalPaid - loan);

      priceRange.value = String(price);
      depositValue.textContent = money(deposit) + " (" + depositPct + "%)";
      if (depositNote) depositNote.textContent = money(deposit);
      rateValue.textContent = rate.toFixed(2) + "% APR";
      termValue.textContent = years + " years";
      loanValue.textContent = money(loan);
      monthlyValue.textContent = money(monthly);
      interestValue.textContent = money(interest);
      totalValue.textContent = money(totalPaid);
      payable.textContent =
        "Repaid over " + years + " years · " + months.toLocaleString("en-GB") + " monthly instalments";

      if (barValue) {
        var pct = price > 0 ? (deposit / price) * 100 : 0;
        barValue.style.width = Math.min(100, Math.max(2, pct)) + "%";
      }
    }

    priceRange.addEventListener("input", function () {
      priceInput.value = priceRange.value;
      sync();
    });

    priceInput.addEventListener("input", function () {
      var capped = Math.min(20000000, Math.max(0, parseFloat(priceInput.value) || 0));
      priceRange.value = String(capped);
      sync();
    });

    priceInput.addEventListener("blur", function () {
      priceInput.value = String(Math.min(20000000, Math.max(0, parseFloat(priceInput.value) || 0)));
      sync();
    });

    depositRange.addEventListener("input", sync);
    rateRange.addEventListener("input", sync);
    termSelect.addEventListener("change", sync);

    calc.addEventListener("submit", function (event) {
      event.preventDefault();
      sync();
      monthlyValue.focus();
    });

    sync();
  }

  /* ---------- 8. Enquiry forms ---------- */

  function initForms() {
    var forms = document.querySelectorAll("[data-enquiry]");
    if (!forms.length) return;

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    forms.forEach(function (form) {
      var status = form.querySelector(".form-status");
      var fields = Array.prototype.slice.call(form.querySelectorAll("[data-validate]"));

      function validateField(field) {
        var wrapper = field.closest(".field");
        var value = (field.value || "").trim();
        var message = "";

        if (field.hasAttribute("required") && !value) {
          message = "This line is required — please add it before sending.";
        } else if (field.type === "email" && value && !emailPattern.test(value)) {
          message = "That email address looks incomplete. Try name@example.com.";
        } else if (field.type === "tel" && value && value.replace(/\D/g, "").length < 9) {
          message = "Enter a phone number with at least 9 digits.";
        } else if (field.type === "number" && value && parseFloat(value) <= 0) {
          message = "Enter a figure greater than zero.";
        } else if (field.type === "checkbox" && field.hasAttribute("required") && !field.checked) {
          message = "Please tick to confirm we may contact you.";
        } else if (field.getAttribute("data-min-length") && value && value.length < parseFloat(field.getAttribute("data-min-length"))) {
          message = "Please write at least " + field.getAttribute("data-min-length") + " characters — one or two sentences.";
        } else if (field.getAttribute("data-min") && value && parseFloat(value) < parseFloat(field.getAttribute("data-min"))) {
          message = "Please enter a figure of at least " + field.getAttribute("data-min") + ".";
        }

        if (wrapper) {
          wrapper.classList.toggle("is-invalid", Boolean(message));
          var note = wrapper.querySelector(".field-error");
          if (note) note.textContent = message;
        }
        field.setAttribute("aria-invalid", message ? "true" : "false");
        return message;
      }

      fields.forEach(function (field) {
        field.addEventListener("blur", function () {
          validateField(field);
        });
        field.addEventListener("input", function () {
          var wrapper = field.closest(".field");
          if (wrapper && wrapper.classList.contains("is-invalid")) validateField(field);
        });
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var summary = document.getElementById("form-summary");
        var problems = [];
        fields.forEach(function (field) {
          var message = validateField(field);
          if (message) problems.push({ field: field, message: message });
        });

        if (problems.length) {
          if (status) {
            status.classList.remove("is-visible");
          }
          if (summary) {
            summary.textContent =
              problems.length +
              (problems.length === 1 ? " detail needs your attention" : " details need your attention") +
              " before this enquiry can be sent.";
            summary.classList.add("is-visible");
          }
          problems[0].field.focus();
          return;
        }

        if (summary) {
          summary.classList.remove("is-visible");
          summary.textContent = "";
        }

        if (status) {
          var firstName = (form.querySelector('[name="first-name"]') || {}).value || "";
          var greeting = document.createElement("strong");
          greeting.textContent =
            "Thank you" + (firstName.trim() ? ", " + firstName.trim() : "") + ".";
          status.textContent = "";
          status.appendChild(greeting);
          status.appendChild(
            document.createTextNode(
              " Your enquiry is logged with our " +
                (form.getAttribute("data-team") || "client services") +
                " desk. A director will reply within one working day with the documents and viewing slots you asked for."
            )
          );
          status.classList.add("is-visible");
          status.focus();
        }
        form.reset();
      });
    });
  }

  /* ---------- 9. Assorted polish ---------- */

  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    nodes.forEach(function (node) {
      node.textContent = year;
    });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach(function (link) {
      link.addEventListener("click", function (event) {
        var id = link.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  function init() {
    initHeader();
    initNav();
    initReveals();
    initCounters();
    initListings();
    initGallery();
    initCalculator();
    initForms();
    initYear();
    initSmoothAnchors();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
