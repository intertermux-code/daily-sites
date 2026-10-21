/* =========================================================
   HAVEN ESTATES — shared behaviour
   Motion: Blur-Fade Ascend (primary) + Scroll Progress (secondary)
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll progress bar ---------- */
  var bar = document.querySelector(".scroll-progress__bar");
  if (bar) {
    var raf = 0;
    var paint = function () {
      raf = 0;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };
    var onScroll = function () {
      if (!raf) raf = window.requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    paint();
  }

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var syncHeader = function () {
      header.classList.toggle("is-stuck", window.scrollY > 24);
    };
    window.addEventListener("scroll", syncHeader, { passive: true });
    syncHeader();
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setNav(false);
    });
  }

  /* ---------- Blur-Fade Ascend reveals, 80ms stagger ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (revealables.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) {
        el.classList.add("in");
      });
    } else {
      // Group siblings by their nearest [data-stagger] parent (or own parent).
      revealables.forEach(function (el) {
        var group = el.parentElement ? el.parentElement.closest("[data-stagger]") || el.parentElement : null;
        if (!group) return;
        var sibs = Array.prototype.filter.call(group.children, function (c) {
          return c.classList && c.classList.contains("reveal");
        });
        var i = sibs.indexOf(el);
        el.style.setProperty("--delay", Math.max(0, i) * 80 + "ms");
      });

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );
      revealables.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ---------- Pinned narrative: chapter drives the sticky caption ---------- */
  var pin = document.querySelector(".pin");
  if (pin && !reduce && "IntersectionObserver" in window) {
    var capIdx = pin.querySelector("[data-pin-index]");
    var capTitle = pin.querySelector("[data-pin-title]");
    var shots = Array.prototype.slice.call(pin.querySelectorAll("[data-pin-shot]"));
    var chapters = Array.prototype.slice.call(pin.querySelectorAll(".chapter"));
    if (chapters.length) {
      shots.forEach(function (s, si) {
        s.style.transition = "opacity 900ms cubic-bezier(0.16,1,0.3,1)";
        s.style.zIndex = si === 0 ? "1" : "0";
      });
      var chapterIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var i = chapters.indexOf(entry.target);
            if (capIdx) capIdx.textContent = "0" + (i + 1);
            if (capTitle) capTitle.textContent = entry.target.getAttribute("data-pin-label") || "";
            shots.forEach(function (s, si) {
              s.style.opacity = si === i ? "1" : "0.28";
              s.style.zIndex = si === i ? "1" : "0";
            });
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      chapters.forEach(function (c) {
        chapterIO.observe(c);
      });
    }
  }

  /* ---------- Stat counters ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count-to]"));
  if (counters.length && "IntersectionObserver" in window) {
    var fmt = function (n, dec) {
      return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    var cIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          cIO.unobserve(el);
          var to = parseFloat(el.getAttribute("data-count-to"));
          var dec = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
          var prefix = el.getAttribute("data-count-prefix") || "";
          var suffix = el.getAttribute("data-count-suffix") || "";
          if (reduce) {
            el.textContent = prefix + fmt(to, dec) + suffix;
            return;
          }
          var start = performance.now();
          var dur = 1400;
          var step = function (now) {
            var t = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = prefix + fmt(to * eased, dec) + suffix;
            if (t < 1) window.requestAnimationFrame(step);
          };
          window.requestAnimationFrame(step);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (c) {
      cIO.observe(c);
    });
  }

  /* ---------- Search form -> listings query string ---------- */
  var search = document.getElementById("search-form");
  if (search) {
    search.addEventListener("submit", function (e) {
      e.preventDefault();
      var params = new URLSearchParams();
      var f = search.elements;
      if (f.location && f.location.value) params.set("location", f.location.value);
      if (f.type && f.type.value !== "any") params.set("type", f.type.value);
      if (f.price) params.set("price", f.price.value);
      if (f.beds && f.beds.value !== "0") params.set("beds", f.beds.value);
      if (f.baths && f.baths.value !== "0") params.set("baths", f.baths.value);
      if (f.sqft && f.sqft.value !== "0") params.set("sqft", f.sqft.value);
      var qs = params.toString();
      window.location.href = "listings.html" + (qs ? "?" + qs : "");
    });
  }

  /* ---------- Listings filters ---------- */
  var filterForm = document.getElementById("filter-form");
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-listing]"));
  if (filterForm && cards.length) {
    var els = filterForm.elements;
    var grid = document.querySelector("[data-cards]");
    var empty = document.querySelector("[data-empty]");
    var countOut = document.querySelector("[data-count]");
    var chipOut = document.querySelector("[data-chips]");
    var priceOut = document.querySelector("[data-price-out]");
    var PRICE_MAX = 14500000;

    var money = function (n) {
      return "$" + n.toLocaleString("en-US");
    };
    var moneyShort = function (n) {
      return n >= 1000000 ? "$" + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2).replace(/0$/, "") + "M" : money(n);
    };

    var readState = function () {
      return {
        location: els.location ? els.location.value : "any",
        type: els.type ? els.type.value : "any",
        price: els.price ? Number(els.price.value) : PRICE_MAX,
        beds: els.beds ? Number(els.beds.value) : 0,
        baths: els.baths ? Number(els.baths.value) : 0,
        sqft: els.sqft ? Number(els.sqft.value) : 0,
        sort: els.sort ? els.sort.value : "featured"
      };
    };

    var apply = function () {
      var s = readState();
      var visible = cards.filter(function (card) {
        var d = card.dataset;
        return (
          (s.location === "any" || d.location === s.location) &&
          (s.type === "any" || d.type === s.type) &&
          Number(d.price) <= s.price &&
          Number(d.beds) >= s.beds &&
          Number(d.baths) >= s.baths &&
          Number(d.sqft) >= s.sqft
        );
      });

      visible.sort(function (a, b) {
        if (s.sort === "price-asc") return Number(a.dataset.price) - Number(b.dataset.price);
        if (s.sort === "price-desc") return Number(b.dataset.price) - Number(a.dataset.price);
        if (s.sort === "size-desc") return Number(b.dataset.sqft) - Number(a.dataset.sqft);
        if (s.sort === "newest") return Number(b.dataset.yearBuilt) - Number(a.dataset.yearBuilt);
        return Number(a.dataset.order || 0) - Number(b.dataset.order || 0);
      });

      cards.forEach(function (card) {
        card.hidden = true;
      });
      visible.forEach(function (card, i) {
        card.hidden = false;
        card.style.order = String(i);
      });

      if (countOut) {
        countOut.textContent = "";
        var strong = document.createElement("strong");
        strong.textContent = String(visible.length);
        countOut.appendChild(strong);
        countOut.appendChild(document.createTextNode(" of " + cards.length + " residences"));
      }
      if (empty) empty.classList.toggle("is-on", visible.length === 0);
      if (grid) grid.classList.toggle("is-filtered", true);
      if (priceOut) priceOut.textContent = s.price >= PRICE_MAX ? "Any" : moneyShort(s.price);

      var chips = [];
      if (s.location !== "any") chips.push(["location", els.location.options[els.location.selectedIndex].text]);
      if (s.type !== "any") chips.push(["type", els.type.options[els.type.selectedIndex].text]);
      if (s.price < PRICE_MAX) chips.push(["price", "Under " + moneyShort(s.price)]);
      if (s.beds) chips.push(["beds", s.beds + "+ beds"]);
      if (s.baths) chips.push(["baths", s.baths + "+ baths"]);
      if (s.sqft) chips.push(["sqft", s.sqft.toLocaleString("en-US") + "+ sq ft"]);

      if (chipOut) {
        chipOut.textContent = "";
        chips.forEach(function (c) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "fchip";
          b.setAttribute("data-clear", c[0]);
          b.setAttribute("aria-label", "Remove filter: " + c[1]);
          b.appendChild(document.createTextNode(c[1] + " "));
          var x = document.createElement("span");
          x.setAttribute("aria-hidden", "true");
          x.textContent = "×";
          b.appendChild(x);
          chipOut.appendChild(b);
        });
      }
    };

    filterForm.addEventListener("input", apply);
    filterForm.addEventListener("change", apply);

    if (chipOut) {
      chipOut.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-clear]");
        if (!btn) return;
        var key = btn.getAttribute("data-clear");
        if (key === "price") els.price.value = PRICE_MAX;
        else if (key === "beds" || key === "baths" || key === "sqft") els[key].value = "0";
        else els[key].value = "any";
        apply();
        filterForm.querySelector(".control").focus();
      });
    }

    var doReset = function () {
      if (els.location) els.location.value = "any";
      if (els.type) els.type.value = "any";
      if (els.price) els.price.value = PRICE_MAX;
      if (els.beds) els.beds.value = "0";
      if (els.baths) els.baths.value = "0";
      if (els.sqft) els.sqft.value = "0";
      if (els.sort) els.sort.value = "featured";
      apply();
    };

    Array.prototype.forEach.call(document.querySelectorAll("[data-reset]"), function (btn) {
      btn.addEventListener("click", doReset);
    });

    // Deep links from the home search panel.
    var q = new URLSearchParams(window.location.search);
    if (q.toString()) {
      if (els.location && q.get("location")) els.location.value = q.get("location");
      if (els.type && q.get("type")) els.type.value = q.get("type");
      if (els.price && q.get("price")) els.price.value = q.get("price");
      if (els.beds && q.get("beds")) els.beds.value = q.get("beds");
      if (els.baths && q.get("baths")) els.baths.value = q.get("baths");
      if (els.sqft && q.get("sqft")) els.sqft.value = q.get("sqft");
    }
    apply();
  }

  /* ---------- Property gallery ---------- */
  var gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    var mainImg = gallery.querySelector("[data-gallery-main]");
    var mainCap = gallery.querySelector("[data-gallery-caption]");
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll(".thumb"));
    thumbs.forEach(function (t) {
      t.addEventListener("click", function () {
        var src = t.getAttribute("data-src");
        var label = t.getAttribute("data-label") || "";
        if (!src || !mainImg) return;
        gallery.classList.add("is-swapping");
        var swap = function () {
          mainImg.src = src;
          mainImg.alt = label;
          if (mainCap) mainCap.textContent = label;
          gallery.classList.remove("is-swapping");
        };
        if (reduce) swap();
        else window.setTimeout(swap, 220);
        thumbs.forEach(function (o) {
          o.setAttribute("aria-pressed", String(o === t));
        });
      });
    });
  }

  /* ---------- Mortgage calculator ---------- */
  var calc = document.getElementById("mortgage-calc");
  if (calc) {
    var c = calc.elements;
    var out = {
      total: document.querySelector("[data-out-total]"),
      principal: document.querySelector("[data-out-principal]"),
      interest: document.querySelector("[data-out-interest]"),
      taxes: document.querySelector("[data-out-taxes]"),
      insurance: document.querySelector("[data-out-insurance]"),
      loan: document.querySelector("[data-out-loan]"),
      lifetime: document.querySelector("[data-out-lifetime]"),
      p: document.querySelector("[data-bar-principal]"),
      i: document.querySelector("[data-bar-interest]"),
      e: document.querySelector("[data-bar-taxes]")
    };

    var usd = function (n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    };
    var usdC = function (n) {
      return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    var syncLabels = function () {
      calc.querySelector("[data-label-price]").textContent = usd(Number(c.price.value));
      calc.querySelector("[data-label-down]").textContent =
        Number(c.down.value).toLocaleString("en-US") + "%";
      calc.querySelector("[data-label-rate]").textContent = Number(c.rate.value).toFixed(2) + "%";
      calc.querySelector("[data-label-term]").textContent = c.term.value + " yrs";
    };

    var run = function () {
      var price = Math.max(0, Number(c.price.value) || 0);
      var downPct = Math.min(90, Math.max(0, Number(c.down.value) || 0));
      var rate = Math.max(0, Number(c.rate.value) || 0) / 100 / 12;
      var years = Math.max(1, Number(c.term.value) || 30);
      var n = years * 12;
      var loan = price * (1 - downPct / 100);
      var PI = loan * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1);
      var monthly = isFinite(PI) ? PI : loan / n;
      var taxes = (price * 0.0112) / 12;
      var insurance = 620 + price * 0.00042;
      var hoa = c.hoa ? Number(c.hoa.value) : 0;
      var totalPMT = monthly + taxes + insurance + hoa;

      if (out.total) out.total.textContent = usdC(totalPMT);
      if (out.principal) out.principal.textContent = usd(monthly / n);
      if (out.interest) out.interest.textContent = usd(monthly - monthly / n);
      if (out.taxes) out.taxes.textContent = usd(taxes);
      if (out.insurance) out.insurance.textContent = usd(insurance + hoa);
      if (out.loan) out.loan.textContent = usd(loan);
      if (out.lifetime) out.lifetime.textContent = usd(monthly * n);

      if (out.p && out.i && out.e) {
        var base = monthly + taxes || 1;
        var pctP = ((monthly / n) / base) * 100;
        var pctI = ((monthly - monthly / n) / base) * 100;
        var pctT = (taxes / base) * 100;
        out.p.style.width = pctP.toFixed(2) + "%";
        out.p.style.background = "#c9a227";
        out.i.style.width = pctI.toFixed(2) + "%";
        out.i.style.background = "#1a3a56";
        out.e.style.width = pctT.toFixed(2) + "%";
        out.e.style.background = "#efe3c8";
      }
      syncLabels();
    };

    calc.addEventListener("input", run);
    calc.addEventListener("change", run);
    run();
  }

  /* ---------- Enquiry + newsletter forms ---------- */
  var forms = document.querySelectorAll("[data-validate]");
  Array.prototype.forEach.call(forms, function (form) {
    var status = form.querySelector("[data-form-status]");

    var markField = function (input, ok) {
      var field = input.closest(".field");
      if (!field) return ok;
      field.classList.toggle("is-invalid", !ok);
      return ok;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      var ok = true;

      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (input) {
        var valid = input.type === "checkbox" ? input.checked : String(input.value).trim() !== "";
        if (valid && input.type === "email") {
          valid = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim());
        }
        if (!markField(input, valid)) {
          ok = false;
          if (!first) first = input;
        }
      });

      if (!ok) {
        if (status) {
          status.classList.remove("is-on");
        }
        if (first) first.focus();
        return;
      }

      var name = form.elements["name"] ? form.elements["name"].value.trim().split(" ")[0] : "";
      if (status) {
        status.textContent = form.hasAttribute("data-success-msg")
          ? form.getAttribute("data-success-msg")
          : "Thank you" + (name ? ", " + name : "") + ". Your enquiry is with our private office.";
        status.classList.add("is-on");
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      form.reset();
    });

    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field.is-invalid");
      if (field && String(e.target.value || "").trim() !== "") {
        field.classList.remove("is-invalid");
      }
    });
  });

  /* ---------- Accordion ---------- */
  var accBtns = document.querySelectorAll(".acc__btn");
  Array.prototype.forEach.call(accBtns, function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      Array.prototype.forEach.call(accBtns, function (other) {
        if (other === btn) return;
        other.setAttribute("aria-expanded", "false");
        var p = document.getElementById(other.getAttribute("aria-controls"));
        if (p) p.classList.remove("is-open");
      });
      btn.setAttribute("aria-expanded", String(!open));
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.classList.toggle("is-open", !open);
    });
  });

  /* ---------- Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
