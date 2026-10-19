/* ============================================================
   Haven Estates — shared behaviour
   Signature motion: Magnetic Elements (primary buttons) + Marquee Ticker
   ============================================================ */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var siteNav = document.getElementById("site-nav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close main menu" : "Open main menu");
    });

    siteNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open main menu");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }

  /* ---------- Header scroll shadow ---------- */
  var header = document.querySelector(".site-header");

  if (header) {
    var lastScrolled = false;
    var onHeaderScroll = function () {
      var scrolled = window.scrollY > 8;
      if (scrolled !== lastScrolled) {
        header.classList.toggle("is-scrolled", scrolled);
        lastScrolled = scrolled;
      }
    };
    window.addEventListener("scroll", onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  /* ---------- Magnetic primary buttons (signature motion #1) ---------- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (finePointer && !prefersReducedMotion) {
    var RADIUS = 120;
    var MAX_PULL = 18;
    var magnets = document.querySelectorAll("[data-magnetic]");

    magnets.forEach(function (el) {
      var targetX = 0;
      var targetY = 0;
      var currentX = 0;
      var currentY = 0;
      var scale = 1;
      var raf = null;
      var tracking = false;

      function frame() {
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        scale += (targetScale - scale) * 0.18;
        var done = !tracking && Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05;
        if (done) {
          currentX = targetX;
          currentY = targetY;
          scale = targetScale;
        }
        el.style.transform = "translate3d(" + currentX.toFixed(2) + "px," + currentY.toFixed(2) + "px,0) scale(" + scale.toFixed(3) + ")";
        raf = done ? null : requestAnimationFrame(frame);
      }

      var targetScale = 1;

      function start() {
        if (raf === null) raf = requestAnimationFrame(frame);
      }

      function onMove(event) {
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = event.clientX - cx;
        var dy = event.clientY - cy;
        var distance = Math.hypot(dx, dy);

        if (distance > RADIUS + Math.max(rect.width, rect.height) / 2) {
          release();
          return;
        }

        tracking = true;
        var pull = Math.min(1, distance / RADIUS);
        var strength = (1 - pull) * 0.35;
        targetX = Math.max(-MAX_PULL, Math.min(MAX_PULL, dx * strength));
        targetY = Math.max(-MAX_PULL, Math.min(MAX_PULL, dy * strength));
        targetScale = 1 + 0.04 * (1 - pull);
        el.classList.add("is-magnet");
        start();
      }

      function release() {
        tracking = false;
        targetX = 0;
        targetY = 0;
        targetScale = 1;
        start();
      }

      document.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", release);
      el.addEventListener("blur", release);

      el.addEventListener("transitionend", function (event) {
        if (event.propertyName === "transform" && !tracking) {
          el.classList.remove("is-magnet");
        }
      });

      el.addEventListener("focus", function () {
        tracking = false;
      });
    });
  }

  /* ---------- Marquee ticker (signature motion #2) — duplicate for seamless wrap ---------- */
  var marqueeTrack = document.querySelector("[data-marquee]");

  if (marqueeTrack && !marqueeTrack.dataset.marqueeDone) {
    var group = marqueeTrack.firstElementChild;
    if (group) {
      var clone = group.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      marqueeTrack.appendChild(clone);
      marqueeTrack.dataset.marqueeDone = "true";
    }
  }

  /* ---------- Scroll reveals ---------- */
  var revealNodes = document.querySelectorAll(".reveal");

  if (revealNodes.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealNodes.forEach(function (node) {
        node.classList.add("is-in");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
      );
      revealNodes.forEach(function (node) {
        revealObserver.observe(node);
      });
    }
  }

  /* ---------- Listings filters ---------- */
  var filterForm = document.getElementById("filter-form");

  if (filterForm) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-listing]"));
    var resultCount = document.getElementById("result-count");
    var resultTotal = document.getElementById("result-total");
    var noResults = document.getElementById("no-results");
    var resetBtn = document.getElementById("filter-reset");

    function readFilters() {
      var data = new FormData(filterForm);
      return {
        location: String(data.get("location") || "any"),
        price: Number(data.get("price") || 0),
        beds: Number(data.get("beds") || 0),
        baths: Number(data.get("baths") || 0),
        sqft: Number(data.get("sqft") || 0)
      };
    }

    function applyFilters() {
      var f = readFilters();
      var shown = 0;
      cards.forEach(function (card) {
        var match =
          (f.location === "any" || card.dataset.location === f.location) &&
          Number(card.dataset.price) >= f.price &&
          Number(card.dataset.beds) >= f.beds &&
          Number(card.dataset.baths) >= f.baths &&
          Number(card.dataset.sqft) >= f.sqft;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (resultCount) resultCount.textContent = String(shown);
      if (resultTotal) resultTotal.textContent = String(cards.length);
      if (noResults) noResults.classList.toggle("is-shown", shown === 0);
    }

    /* Pre-select from query string (?location=lakeshore&price=2000000&beds=3) */
    var params = new URLSearchParams(window.location.search);
    ["location", "price", "beds", "baths", "sqft"].forEach(function (key) {
      var value = params.get(key);
      var input = filterForm.elements[key];
      if (value && input) input.value = value;
    });

    filterForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilters();
    });
    filterForm.addEventListener("input", applyFilters);

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        filterForm.reset();
        applyFilters();
      });
    }

    applyFilters();
  }

  /* ---------- Property gallery ---------- */
  var gallery = document.querySelector("[data-gallery]");

  if (gallery) {
    var stageImg = gallery.querySelector("[data-gallery-stage]");
    var stageCaption = gallery.querySelector("[data-gallery-caption]");
    var thumbs = gallery.querySelectorAll("[data-gallery-thumb]");

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        thumbs.forEach(function (other) {
          other.classList.toggle("is-active", other === thumb);
          other.setAttribute("aria-pressed", String(other === thumb));
        });
        if (stageImg) {
          stageImg.classList.add("is-fading");
          window.setTimeout(function () {
            stageImg.src = thumb.dataset.galleryThumb;
            stageImg.alt = thumb.dataset.thumbAlt || stageImg.alt;
            stageImg.classList.remove("is-fading");
          }, prefersReducedMotion ? 0 : 200);
        }
        if (stageCaption && thumb.dataset.thumbCaption) {
          stageCaption.textContent = thumb.dataset.thumbCaption;
        }
      });
    });

    if (thumbs.length) {
      thumbs[0].classList.add("is-active");
      thumbs[0].setAttribute("aria-pressed", "true");
    }
  }

  /* ---------- Mortgage calculator ---------- */
  var calculator = document.getElementById("mortgage-calculator");

  if (calculator) {
    var priceInput = document.getElementById("loan-amount");
    var priceRange = document.getElementById("loan-amount-range");
    var priceOut = document.getElementById("loan-amount-out");
    var rateInput = document.getElementById("interest-rate");
    var termInput = document.getElementById("loan-term");
    var termRange = document.getElementById("loan-term-range");
    var termOut = document.getElementById("loan-term-out");
    var downInput = document.getElementById("down-payment");
    var monthlyOut = document.getElementById("monthly-payment");
    var loanFigOut = document.getElementById("loan-fig");
    var totalInterestOut = document.getElementById("total-interest");
    var totalPayOut = document.getElementById("total-pay");
    var calcError = document.getElementById("calc-error");

    var fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });

    function syncRange(rangeEl, numberEl) {
      if (!rangeEl || !numberEl) return;
      rangeEl.value = numberEl.value;
    }

    function calculate() {
      var principal = Number(priceInput.value);
      var annualRate = Number(rateInput.value);
      var years = Number(termInput.value);
      var down = Number(downInput.value || 0);

      var invalid =
        !Number.isFinite(principal) ||
        principal <= 0 ||
        !Number.isFinite(annualRate) ||
        annualRate < 0 ||
        !Number.isFinite(years) ||
        years <= 0 ||
        down < 0 ||
        down >= principal;

      if (priceOut) priceOut.textContent = fmt.format(principal || 0);
      if (termOut) termOut.textContent = (years || 0) + " yr";
      syncRange(priceRange, priceInput);
      syncRange(termRange, termInput);

      if (invalid) {
        if (calcError) calcError.hidden = false;
        if (loanFigOut) loanFigOut.textContent = "—";
        if (monthlyOut) monthlyOut.textContent = "—";
        if (totalInterestOut) totalInterestOut.textContent = "—";
        if (totalPayOut) totalPayOut.textContent = "—";
        return;
      }

      if (calcError) calcError.hidden = true;

      var loan = principal - down;
      var monthlyRate = annualRate / 100 / 12;
      var months = years * 12;
      var monthly;

      if (monthlyRate === 0) {
        monthly = loan / months;
      } else {
        var factor = Math.pow(1 + monthlyRate, months);
        monthly = (loan * monthlyRate * factor) / (factor - 1);
      }

      var totalPaid = monthly * months + down;
      var totalInterest = totalPaid - principal;

      if (loanFigOut) loanFigOut.textContent = fmt.format(loan);
      if (monthlyOut) monthlyOut.textContent = fmt.format(monthly);
      if (totalInterestOut) totalInterestOut.textContent = fmt.format(totalInterest);
      if (totalPayOut) totalPayOut.textContent = fmt.format(totalPaid);
    }

    ["input", "change"].forEach(function (type) {
      [priceInput, priceRange, rateInput, termInput, termRange, downInput].forEach(function (el) {
        if (el) el.addEventListener(type, calculate);
      });
    });

    if (priceRange) priceRange.addEventListener("input", function () { priceInput.value = priceRange.value; });
    if (termRange) termRange.addEventListener("input", function () { termInput.value = termRange.value; });

    calculate();
  }

  /* ---------- Enquiry form validation ---------- */
  var enquiryForm = document.getElementById("enquiry-form");

  if (enquiryForm) {
    var successBox = document.getElementById("enquiry-success");

    var validators = [
      {
        id: "enquiry-name",
        test: function (value) {
          return value.trim().length >= 2;
        },
        message: "Please enter your full name."
      },
      {
        id: "enquiry-email",
        test: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
        },
        message: "Please enter a valid email address."
      },
      {
        id: "enquiry-interest",
        test: function (value) {
          return value !== "";
        },
        message: "Please choose what you are interested in."
      },
      {
        id: "enquiry-message",
        test: function (value) {
          return value.trim().length >= 10;
        },
        message: "Please tell us a little more (10 characters or more)."
      }
    ];

    function setError(fieldId, message) {
      var input = document.getElementById(fieldId);
      if (!input) return;
      var field = input.closest(".field");
      if (!field) return;
      var errorEl = field.querySelector(".field__error");
      field.classList.toggle("has-error", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) {
        errorEl.textContent = message || "";
        if (message) {
          errorEl.id = fieldId + "-error";
          input.setAttribute("aria-describedby", errorEl.id);
        } else {
          input.removeAttribute("aria-describedby");
        }
      }
    }

    enquiryForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstInvalid = null;

      validators.forEach(function (rule) {
        var input = document.getElementById(rule.id);
        if (!input) return;
        var ok = rule.test(input.value);
        setError(rule.id, ok ? "" : rule.message);
        if (!ok && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        if (successBox) successBox.classList.remove("is-shown");
        return;
      }

      if (successBox) {
        successBox.classList.add("is-shown");
        successBox.focus();
      }
      enquiryForm.reset();
    });

    enquiryForm.addEventListener("input", function (event) {
      var target = event.target;
      var rule = validators.filter(function (r) {
        return r.id === target.id;
      })[0];
      if (rule && target.closest(".field") && target.closest(".field").classList.contains("has-error")) {
        setError(rule.id, rule.test(target.value) ? "" : rule.message);
      }
    });
  }

  /* ---------- Footer year ---------- */
  var yearNode = document.querySelector("[data-year]");
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
})();
