/* Haven Estates — shared behaviour
   Every block is guarded by element existence so one file serves all pages. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navList = document.querySelector("[data-nav-list]");
  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navList.classList.toggle("is-open", !open);
    });
    document.addEventListener("click", function (e) {
      if (!navList.contains(e.target) && !navToggle.contains(e.target)) {
        navToggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navList.classList.contains("is-open")) {
        navToggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
        navToggle.focus();
      }
    });
  }

  /* ---------- Card deck fan-out on scroll ---------- */
  var deck = document.querySelector("[data-deck-cards]");
  if (deck) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      deck.classList.add("is-fanned");
    } else {
      var deckObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            deck.classList.add("is-fanned");
            deckObserver.disconnect();
          }
        });
      }, { threshold: 0.4 });
      deckObserver.observe(deck);
    }
  }

  /* ---------- 3D card tilt (signature motion) ---------- */
  var MAX_TILT = 8; /* degrees */
  var LERP = 0.12;

  function initTilt(card) {
    var glare = document.createElement("span");
    glare.className = "tilt-glare";
    glare.setAttribute("aria-hidden", "true");
    card.appendChild(glare);

    var current = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var raf = null;
    var hovering = false;

    function tick() {
      current.x += (target.x - current.x) * LERP;
      current.y += (target.y - current.y) * LERP;
      var settled = Math.abs(target.x - current.x) < 0.05 && Math.abs(target.y - current.y) < 0.05;
      if (settled) {
        current.x = target.x;
        current.y = target.y;
      }
      card.style.transform =
        "perspective(900px) rotateX(" + current.y.toFixed(2) + "deg) rotateY(" + current.x.toFixed(2) + "deg)";
      if (!settled || hovering) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    card.addEventListener("pointermove", function (e) {
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      target.x = (px - 0.5) * 2 * MAX_TILT;
      target.y = (0.5 - py) * 2 * MAX_TILT;
      glare.style.setProperty("--glare-x", (px * 100).toFixed(1) + "%");
      glare.style.setProperty("--glare-y", (py * 100).toFixed(1) + "%");
      hovering = true;
      card.classList.add("is-tilting");
      start();
    });

    card.addEventListener("pointerleave", function () {
      hovering = false;
      target.x = 0;
      target.y = 0;
      card.classList.remove("is-tilting");
      start();
    });
  }

  if (!reduceMotion && finePointer) {
    var tiltCards = document.querySelectorAll("[data-tilt]");
    for (var t = 0; t < tiltCards.length; t++) initTilt(tiltCards[t]);
  }

  /* ---------- Listings filter (listings.html) ---------- */
  var filterForm = document.querySelector("[data-filter-form]");
  if (filterForm) {
    var grid = document.querySelector("[data-listings-grid]");
    var countEl = document.querySelector("[data-result-count]");
    var emptyEl = document.querySelector("[data-listings-empty]");
    var selects = filterForm.querySelectorAll("select[data-filter]");
    var cards = grid ? grid.querySelectorAll(".listing-card") : [];
    var total = cards.length;

    function filterValue(name) {
      for (var i = 0; i < selects.length; i++) {
        if (selects[i].getAttribute("data-filter") === name) return selects[i].value;
      }
      return "";
    }

    function applyFilters(updateUrl) {
      var loc = filterValue("location");
      var maxPrice = parseInt(filterValue("price"), 10) || Infinity;
      var minBeds = parseInt(filterValue("beds"), 10) || 0;
      var minBaths = parseInt(filterValue("baths"), 10) || 0;
      var shown = 0;

      for (var c = 0; c < cards.length; c++) {
        var card = cards[c];
        var ok =
          (!loc || card.getAttribute("data-location") === loc) &&
          Number(card.getAttribute("data-price")) <= maxPrice &&
          Number(card.getAttribute("data-beds")) >= minBeds &&
          Number(card.getAttribute("data-baths")) >= minBaths;
        card.hidden = !ok;
        if (ok) shown++;
      }

      if (countEl) {
        countEl.textContent = shown === total
          ? "Showing all " + total + " residences."
          : "Showing " + shown + " of " + total + " residences.";
      }
      if (emptyEl) emptyEl.hidden = shown !== 0;

      if (updateUrl && window.history && window.history.replaceState) {
        var params = new URLSearchParams();
        if (loc) params.set("location", loc);
        if (filterValue("price")) params.set("maxPrice", filterValue("price"));
        if (filterValue("beds")) params.set("beds", filterValue("beds"));
        if (filterValue("baths")) params.set("baths", filterValue("baths"));
        var qs = params.toString();
        window.history.replaceState(null, "", qs ? "listings.html?" + qs : "listings.html");
      }
    }

    for (var s = 0; s < selects.length; s++) {
      selects[s].addEventListener("change", function () { applyFilters(true); });
    }

    var resetBtn = filterForm.querySelector("[data-filter-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        for (var i = 0; i < selects.length; i++) selects[i].value = "";
        applyFilters(true);
      });
    }

    /* Prefill from ?location=&maxPrice=&beds=&baths= (hero search links here) */
    var urlParams = new URLSearchParams(window.location.search);
    for (var j = 0; j < selects.length; j++) {
      var name = selects[j].getAttribute("data-filter");
      var paramKey = name === "price" ? "maxPrice" : name;
      var value = urlParams.get(paramKey);
      if (value) {
        var opt = filterForm.querySelector('select[data-filter="' + name + '"] option[value="' + value + '"]');
        if (opt) selects[j].value = value;
      }
    }
    applyFilters(false);
  }

  /* ---------- Property gallery thumbs (property.html) ---------- */
  var thumbsWrap = document.querySelector("[data-gallery-thumbs]");
  var mainImg = document.querySelector("[data-gallery-main]");
  if (thumbsWrap && mainImg) {
    var thumbButtons = thumbsWrap.querySelectorAll(".thumb");
    for (var g = 0; g < thumbButtons.length; g++) {
      thumbButtons[g].addEventListener("click", function () {
        for (var k = 0; k < thumbButtons.length; k++) {
          thumbButtons[k].classList.remove("is-active");
          thumbButtons[k].setAttribute("aria-pressed", "false");
        }
        this.classList.add("is-active");
        this.setAttribute("aria-pressed", "true");
        var full = this.getAttribute("data-full");
        if (full) {
          mainImg.src = full;
          mainImg.alt = this.getAttribute("aria-label").replace(/^Show /, "").replace(/^the /i, "") + " of the residence";
        }
      });
    }
  }

  /* ---------- Spring accordion (one open at a time) ---------- */
  var accordions = document.querySelectorAll("[data-accordion]");
  for (var a = 0; a < accordions.length; a++) {
    (function (acc) {
      var triggers = acc.querySelectorAll(".acc-trigger");
      for (var i = 0; i < triggers.length; i++) {
        triggers[i].addEventListener("click", function () {
          var expanded = this.getAttribute("aria-expanded") === "true";
          for (var k = 0; k < triggers.length; k++) {
            triggers[k].setAttribute("aria-expanded", "false");
            var panel = document.getElementById(triggers[k].getAttribute("aria-controls"));
            if (panel) panel.classList.remove("is-open");
          }
          if (!expanded) {
            this.setAttribute("aria-expanded", "true");
            var open = document.getElementById(this.getAttribute("aria-controls"));
            if (open) open.classList.add("is-open");
          }
        });
      }
    })(accordions[a]);
  }

  /* ---------- Mortgage calculator (contact.html) ---------- */
  var calcForm = document.querySelector("[data-mortgage-form]");
  if (calcForm) {
    var outEl = document.querySelector("[data-calc-output]");
    var loanEl = document.querySelector("[data-calc-loan]");
    var interestEl = document.querySelector("[data-calc-interest]");
    var rateLineEl = document.querySelector("[data-calc-rateline]");
    var downHint = document.querySelector("[data-down-hint]");

    var usd = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });

    function calc() {
      var price = Number(calcForm.elements.price.value) || 0;
      var downPct = Math.min(Math.max(Number(calcForm.elements.down.value) || 0, 0), 90);
      var rate = Math.min(Math.max(Number(calcForm.elements.rate.value) || 0, 0.01), 20);
      var years = Number(calcForm.elements.term.value) || 30;

      var loan = price * (1 - downPct / 100);
      var monthlyRate = rate / 100 / 12;
      var n = years * 12;
      var monthly = monthlyRate === 0
        ? loan / n
        : loan * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      var totalInterest = monthly * n - loan;

      if (outEl) outEl.textContent = usd.format(Math.round(monthly));
      if (loanEl) loanEl.textContent = usd.format(Math.round(loan));
      if (interestEl) interestEl.textContent = usd.format(Math.round(totalInterest));
      if (rateLineEl) rateLineEl.textContent = rate.toFixed(2) + "% · " + years + " yrs";
      if (downHint) {
        downHint.textContent = usd.format(Math.round(price * downPct / 100)) + " down · " + usd.format(Math.round(loan)) + " borrowed";
      }
    }

    calcForm.addEventListener("input", calc);
    calcForm.addEventListener("change", calc);
    calc();
  }

  /* ---------- Enquiry form (contact.html) ---------- */
  var enquiryForm = document.querySelector("[data-enquiry-form]");
  if (enquiryForm) {
    var successEl = document.querySelector("[data-form-success]");

    function setError(input, show) {
      var field = input.closest(".field");
      var errorEl = field ? field.querySelector("[data-error-for='" + input.id + "'], .field-error") : null;
      if (field) field.classList.toggle("has-error", show);
      if (errorEl) errorEl.hidden = !show;
      input.setAttribute("aria-invalid", show ? "true" : "false");
    }

    enquiryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;

      var required = enquiryForm.querySelectorAll("[required]");
      for (var i = 0; i < required.length; i++) {
        var input = required[i];
        var valid = input.checkValidity();
        setError(input, !valid);
        if (!valid && !firstInvalid) firstInvalid = input;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        if (successEl) successEl.hidden = true;
        return;
      }

      enquiryForm.reset();
      for (var r = 0; r < required.length; r++) setError(required[r], false);
      if (successEl) {
        successEl.hidden = false;
        successEl.focus && successEl.setAttribute("tabindex", "-1");
        successEl.focus({ preventScroll: false });
      }
    });

    var inputs = enquiryForm.querySelectorAll("input[required], select[required], textarea[required]");
    for (var b = 0; b < inputs.length; b++) {
      inputs[b].addEventListener("blur", function () {
        if (this.closest(".field").classList.contains("has-error")) {
          setError(this, !this.checkValidity());
        }
      });
    }
  }
})();
