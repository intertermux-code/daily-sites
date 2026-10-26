/* ============================================================
   Haven Estates — shared behaviour
   Signature motion: Parallax Layers (rAF) + Animated Counters
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Navigation ---------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScrollHeader = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* ---------------- Parallax Layers ----------------
     One rAF loop for every [data-speed] layer.
     translate3d at differing rates, driven by scroll offset. */
  var parallaxLayers = [];
  function collectParallax() {
    parallaxLayers = Array.prototype.slice.call(document.querySelectorAll("[data-speed]")).map(function (el) {
      return {
        el: el,
        speed: parseFloat(el.getAttribute("data-speed")) || 0,
        anchor: el.closest("section, header, .page-head, .prop-hero, .band") || document.body
      };
    });
  }

  var ticking = false;
  function applyParallax() {
    ticking = false;
    if (reduced) return;
    var vh = window.innerHeight;
    for (var i = 0; i < parallaxLayers.length; i++) {
      var layer = parallaxLayers[i];
      var box = layer.anchor.getBoundingClientRect();
      if (box.bottom < -400 || box.top > vh + 400) continue;
      var progress = (box.top + box.height / 2) - vh / 2;
      var offset = -progress * layer.speed;
      layer.el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
    }
  }
  function onScrollParallax() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  }
  function initParallax() {
    if (!document.querySelector("[data-speed]")) return;
    collectParallax();
    applyParallax();
    window.addEventListener("scroll", onScrollParallax, { passive: true });
    window.addEventListener("resize", function () {
      collectParallax();
      requestAnimationFrame(applyParallax);
    });
  }

  /* ---------------- Animated Counters ----------------
     0 -> target, easeOutExpo over 1.2s, locale formatting. */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var suffixHTML = suffix ? '<span class="suffix">' + suffix + "</span>" : "";

    if (reduced) {
      el.innerHTML = prefix + target.toLocaleString(undefined, {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffixHTML;
      return;
    }

    var start = null;
    var DURATION = 1200;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / DURATION, 1);
      var value = target * easeOutExpo(t);
      el.innerHTML = prefix + value.toLocaleString(undefined, {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffixHTML;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, runCounter);
      return;
    }
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        runCounter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---------------- Listings filters ---------------- */
  function initListingFilters() {
    var grid = document.getElementById("listings-grid");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-price]"));
    var q = document.getElementById("filter-q");
    var loc = document.getElementById("filter-location");
    var price = document.getElementById("filter-price");
    var beds = document.getElementById("filter-beds");
    var baths = document.getElementById("filter-baths");
    var sort = document.getElementById("filter-sort");
    var countOut = document.getElementById("results-count");
    var emptyOut = document.getElementById("results-empty");
    var resetBtn = document.getElementById("filter-reset");

    var inputs = [q, loc, price, beds, baths, sort].filter(Boolean);

    function num(el, key) {
      return parseFloat(el.getAttribute("data-" + key)) || 0;
    }

    function apply() {
      var text = (q && q.value || "").trim().toLowerCase();
      var place = loc && loc.value || "any";
      var maxPrice = price && price.value ? parseInt(price.value, 10) : Infinity;
      var minBeds = beds && beds.value ? parseInt(beds.value, 10) : 0;
      var minBaths = baths && baths.value ? parseInt(baths.value, 10) : 0;

      var visible = cards.filter(function (card) {
        var hay = (card.getAttribute("data-search") || "").toLowerCase();
        if (text && hay.indexOf(text) === -1) return false;
        if (place !== "any" && card.getAttribute("data-location") !== place) return false;
        if (num(card, "price") > maxPrice) return false;
        if (num(card, "beds") < minBeds) return false;
        if (num(card, "baths") < minBaths) return false;
        return true;
      });

      cards.forEach(function (c) { c.hidden = true; c.style.display = "none"; });

      if (sort && sort.value) {
        var dir = sort.value;
        visible.sort(function (a, b) {
          if (dir === "price-desc") return num(b, "price") - num(a, "price");
          if (dir === "price-asc") return num(a, "price") - num(b, "price");
          if (dir === "size-desc") return num(b, "sqft") - num(a, "sqft");
          if (dir === "newest") return num(b, "year") - num(a, "year");
          return 0;
        });
      }

      visible.forEach(function (c) { c.hidden = false; c.style.display = ""; grid.appendChild(c); });

      if (countOut) {
        countOut.innerHTML = "Showing <b>" + visible.length + "</b> of " + cards.length + " residences";
      }
      if (emptyOut) emptyOut.hidden = visible.length !== 0;
    }

    inputs.forEach(function (el) {
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        inputs.forEach(function (el) {
          if (el.tagName === "SELECT") { el.selectedIndex = 0; } else { el.value = ""; }
        });
        apply();
      });
    }

    apply();
  }

  /* ---------------- Property gallery lightbox ---------------- */
  function initLightbox() {
    var gallery = document.getElementById("gallery");
    var box = document.getElementById("lightbox");
    if (!gallery || !box) return;

    var shots = Array.prototype.slice.call(gallery.querySelectorAll("img"));
    if (!shots.length) return;

    var big = box.querySelector("img");
    var caption = box.querySelector(".lightbox__caption");
    var prev = box.querySelector(".lightbox__prev");
    var next = box.querySelector(".lightbox__next");
    var close = box.querySelector(".lightbox__close");
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + shots.length) % shots.length;
      var src = shots[index];
      big.src = src.currentSrc || src.src;
      big.alt = src.alt || "Property photograph";
      if (caption) caption.textContent = src.alt || "Property photograph";
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (close) close.focus();
    }
    function shut() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    shots.forEach(function (img, i) {
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");
      img.addEventListener("click", function () { open(i); });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
      });
    });

    if (close) close.addEventListener("click", shut);
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) shut(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") shut();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
  }

  /* ---------------- Mortgage calculator ---------------- */
  function money(n) {
    return "$" + Math.round(n).toLocaleString(undefined);
  }

  function initCalculator() {
    var root = document.getElementById("mortgage-calc");
    if (!root) return;

    var priceR = root.querySelector("#calc-price");
    var downR = root.querySelector("#calc-down");
    var rateR = root.querySelector("#calc-rate");
    var termR = root.querySelector("#calc-term");

    var priceO = root.querySelector("#calc-price-out");
    var downO = root.querySelector("#calc-down-out");
    var rateO = root.querySelector("#calc-rate-out");
    var termO = root.querySelector("#calc-term-out");
    var totalO = root.querySelector("#calc-monthly");
    var totalUnit = root.querySelector("#calc-unit");
    var loanO = root.querySelector("#calc-loan");
    var interestO = root.querySelector("#calc-interest");

    function calc() {
      var principal = parseFloat(priceR.value) || 0;
      var downPct = parseFloat(downR.value) || 0;
      var annualRate = (parseFloat(rateR.value) || 0) / 100;
      var years = parseFloat(termR.value) || 30;

      var down = principal * (downPct / 100);
      var loan = Math.max(principal - down, 0);
      var months = years * 12;
      var i = annualRate / 12;

      var payment;
      if (loan === 0) {
        payment = 0;
      } else if (i === 0) {
        payment = loan / months;
      } else {
        payment = loan * (i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
      }
      var totalInterest = payment * months - loan;

      if (priceO) priceO.textContent = money(principal);
      if (downO) downO.textContent = downPct + "% · " + money(down);
      if (rateO) rateO.textContent = annualRate.toFixed(2) + "%";
      if (termO) termO.textContent = years + " years";
      if (loanO) loanO.textContent = money(loan);
      if (interestO) interestO.textContent = money(totalInterest);
      if (totalO) totalO.textContent = money(payment);
      if (totalUnit) totalUnit.textContent = "/mo · " + years + "-year";
    }

    [priceR, downR, rateR, termR].forEach(function (r) {
      if (r) r.addEventListener("input", calc);
    });
    calc();
  }

  /* ---------------- Enquiry form ---------------- */
  function initEnquiryForm() {
    var form = document.getElementById("enquiry-form");
    if (!form) return;
    var status = document.getElementById("form-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problem = false;

      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (field) {
        var ok = typeof field.checkValidity === "function" ? field.checkValidity() : !!field.value;
        if (!ok) {
          problem = true;
          field.setAttribute("aria-invalid", "true");
        } else {
          field.removeAttribute("aria-invalid");
        }
      });

      if (!status) return;

      if (problem) {
        status.className = "form-status form-status--err is-visible";
        status.textContent = "Please complete the highlighted fields so we can reach you.";
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      var name = (form.querySelector("#enq-name") || {}).value || "";
      var first = name.trim().split(/\s+/)[0] || "there";
      status.className = "form-status form-status--ok is-visible";
      status.textContent = "Thank you, " + first + ". Your enquiry is logged — a Haven advisor replies within 4 business hours.";
      form.reset();
    });
  }

  /* ---------------- Accordions ---------------- */
  function initAccordions() {
    var buttons = document.querySelectorAll(".acc__btn");
    if (!buttons.length) return;
    Array.prototype.forEach.call(buttons, function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        panel.hidden = open;
      });
    });
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    initNav();
    initParallax();
    initCounters();
    initListingFilters();
    initLightbox();
    initCalculator();
    initEnquiryForm();
    initAccordions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
