/* Haven Estates — shared behaviour */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".primary-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- header solidifies over hero ---------- */
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero, .property-hero");
  if (header && hero) {
    var onScrollHeader = function () {
      header.classList.toggle("is-solid", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ---------- primary motion: parallax layers ---------- */
  var layers = document.querySelectorAll("[data-speed]");
  if (layers.length && !reducedMotion) {
    var ticking = false;
    var layerData = [];
    var measure = function () {
      layerData = Array.prototype.map.call(layers, function (layer) {
        return {
          el: layer,
          speed: parseFloat(layer.getAttribute("data-speed")) || 0,
          top: layer.getBoundingClientRect().top + window.scrollY
        };
      });
    };
    var applyParallax = function () {
      var y = window.scrollY;
      layerData.forEach(function (item) {
        var offset = (y - item.top) * item.speed;
        item.el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
      });
      ticking = false;
    };
    measure();
    applyParallax();
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(applyParallax);
      }
    }, { passive: true });
    window.addEventListener("resize", function () {
      measure();
      applyParallax();
    });
  }

  /* ---------- secondary motion: cursor spotlight ---------- */
  var spotlightHost = document.querySelector(".hero");
  if (spotlightHost && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    var pending = null;
    spotlightHost.addEventListener("pointermove", function (e) {
      if (pending) return;
      pending = window.requestAnimationFrame(function (pos) {
        return function () {
          var rect = spotlightHost.getBoundingClientRect();
          spotlightHost.style.setProperty("--spot-x", (pos.clientX - rect.left) + "px");
          spotlightHost.style.setProperty("--spot-y", (pos.clientY - rect.top) + "px");
          pending = null;
        };
      }(e));
    });
  }

  /* ---------- listings filtering ---------- */
  var filterForm = document.getElementById("listing-filters");
  if (filterForm) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".listing-card"));
    var countEl = document.getElementById("results-count");
    var emptyEl = document.getElementById("no-results");

    var applyFilters = function () {
      var loc = filterForm.elements.location.value;
      var priceBand = filterForm.elements.price.value;
      var beds = parseInt(filterForm.elements.beds.value, 10) || 0;
      var baths = parseInt(filterForm.elements.baths.value, 10) || 0;
      var minSqft = parseInt(filterForm.elements.sqft.value, 10) || 0;
      var shown = 0;

      cards.forEach(function (card) {
        var price = parseInt(card.getAttribute("data-price"), 10);
        var ok =
          (loc === "all" || card.getAttribute("data-location") === loc) &&
          (priceBand === "all" ||
            (priceBand === "low" && price < 5000000) ||
            (priceBand === "mid" && price >= 5000000 && price <= 10000000) ||
            (priceBand === "high" && price > 10000000)) &&
          parseInt(card.getAttribute("data-beds"), 10) >= beds &&
          parseInt(card.getAttribute("data-baths"), 10) >= baths &&
          parseInt(card.getAttribute("data-sqft"), 10) >= minSqft;
        card.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });

      if (countEl) countEl.textContent = "Showing " + shown + " of " + cards.length + " residences";
      if (emptyEl) emptyEl.classList.toggle("is-visible", shown === 0);
    };

    filterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      applyFilters();
    });
    filterForm.addEventListener("change", applyFilters);

    var resetBtn = document.getElementById("filter-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        filterForm.reset();
        applyFilters();
      });
    }
    applyFilters();
  }

  /* ---------- mortgage calculator ---------- */
  var calc = document.getElementById("mortgage-calc");
  if (calc) {
    var out = {
      monthly: document.getElementById("calc-monthly"),
      loan: document.getElementById("calc-loan"),
      interest: document.getElementById("calc-interest")
    };
    var money = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });
    var runCalc = function () {
      var price = parseFloat(calc.elements.price.value) || 0;
      var down = parseFloat(calc.elements.down.value) || 0;
      var rate = (parseFloat(calc.elements.rate.value) || 0) / 100 / 12;
      var years = parseFloat(calc.elements.years.value) || 0;
      var loan = Math.max(price - down, 0);
      var monthly = 0;
      if (rate > 0 && years > 0) {
        var n = years * 12;
        monthly = (loan * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
      } else if (years > 0) {
        monthly = loan / (years * 12);
      }
      out.monthly.textContent = money.format(Math.round(monthly));
      out.loan.textContent = money.format(loan);
      out.interest.textContent = money.format(Math.round(monthly * years * 12 - loan));
    };
    calc.addEventListener("input", runCalc);
    runCalc();
  }

  /* ---------- enquiry form validation ---------- */
  var enquiry = document.getElementById("enquiry-form");
  if (enquiry) {
    var success = document.getElementById("form-success");
    var setError = function (input, on) {
      var field = input.closest(".field");
      if (field) field.classList.toggle("has-error", on);
      input.setAttribute("aria-invalid", on ? "true" : "false");
    };
    enquiry.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      enquiry.querySelectorAll("[required]").forEach(function (input) {
        var bad = !input.value.trim();
        if (input.type === "email") {
          bad = bad || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        setError(input, bad);
        if (bad && valid) {
          input.focus();
          valid = false;
        }
      });
      if (valid) {
        enquiry.reset();
        if (success) {
          success.classList.add("is-visible");
          success.focus();
        }
      }
    });
    enquiry.addEventListener("input", function (e) {
      if (e.target.matches("[required]")) setError(e.target, false);
    });
  }

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
