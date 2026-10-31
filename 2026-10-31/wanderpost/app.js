/* ============================================================
   WANDERPOST — shared behaviour
   Signature motion 1: 3D card tilt (lerped, with glare)
   Signature motion 2: cursor spotlight on hero backgrounds
   Everything else is guarded by element-existence checks.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Footer year ---------- */
  var years = document.querySelectorAll("[data-year]");
  for (var y = 0; y < years.length; y++) {
    years[y].textContent = String(new Date().getFullYear());
  }

  /* ---------- Selected state for radio/checkbox pills (no :has dependency) ---------- */
  function syncSelected() {
    document.querySelectorAll(".chip, .month-pill").forEach(function (label) {
      var input = label.querySelector("input");
      if (!input) return;
      if (input.checked) label.setAttribute("data-selected", "true");
      else label.removeAttribute("data-selected");
    });
  }
  document.addEventListener("change", syncSelected);
  syncSelected();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  if (navToggle && siteNav) {
    var closeNav = function () {
      siteNav.setAttribute("data-open", "false");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
    };
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      siteNav.setAttribute("data-open", String(!open));
      navToggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        navToggle.focus();
      }
    });
    for (var l = 0; l < siteNav.querySelectorAll("a").length; l++) {
      siteNav.querySelectorAll("a")[l].addEventListener("click", closeNav);
    }
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ============================================================
     SIGNATURE MOTION 2 — Cursor spotlight
     radial-gradient glow tracking the pointer, rAF-throttled
     ============================================================ */
  var spotlitZones = document.querySelectorAll("[data-spotlight], .page-hero");
  if (!reduceMotion && finePointer && spotlitZones.length) {
    for (var s = 0; s < spotlitZones.length; s++) {
      (function (zone) {
        var glow = zone.querySelector(".hero__spotlight");
        var pending = false;
        var last = { x: 0, y: 0 };

        zone.addEventListener("pointermove", function (e) {
          last.x = e.clientX;
          last.y = e.clientY;
          if (pending) return;
          pending = true;
          requestAnimationFrame(function () {
            pending = false;
            var r = zone.getBoundingClientRect();
            var px = ((last.x - r.left) / r.width) * 100;
            var py = ((last.y - r.top) / r.height) * 100;
            zone.style.setProperty("--mx", px.toFixed(2) + "%");
            zone.style.setProperty("--my", py.toFixed(2) + "%");
            if (glow) {
              glow.style.setProperty("--mx", px.toFixed(2) + "%");
              glow.style.setProperty("--my", py.toFixed(2) + "%");
              glow.setAttribute("data-live", "true");
            }
          });
        }, { passive: true });

        zone.addEventListener("pointerleave", function () {
          if (glow) glow.setAttribute("data-live", "false");
        });
      })(spotlitZones[s]);
    }
  }

  /* ============================================================
     SIGNATURE MOTION 1 — 3D card tilt (max 8deg, lerped)
     ============================================================ */
  var MAX_TILT = 8;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function initTilt(el) {
    var target = { rx: 0, ry: 0, gx: 50, gy: 50 };
    var current = { rx: 0, ry: 0, gx: 50, gy: 50 };
    var raf = null;
    var settledFrames = 0;

    function apply() {
      el.style.setProperty("--rx", current.rx.toFixed(3) + "deg");
      el.style.setProperty("--ry", current.ry.toFixed(3) + "deg");
      el.style.setProperty("--gx", current.gx.toFixed(2) + "%");
      el.style.setProperty("--gy", current.gy.toFixed(2) + "%");
    }

    function loop() {
      var drift = 0;
      ["rx", "ry", "gx", "gy"].forEach(function (k) {
        var diff = target[k] - current[k];
        if (Math.abs(diff) > 0.001) drift += Math.abs(diff);
        current[k] += diff * (k === "rx" || k === "ry" ? 0.14 : 0.2);
      });
      apply();
      if (drift > 0.02) {
        settledFrames = 0;
        raf = requestAnimationFrame(loop);
      } else if (settledFrames < 3) {
        settledFrames++;
        raf = requestAnimationFrame(loop);
      } else {
        current.rx = target.rx;
        current.ry = target.ry;
        apply();
        raf = null;
        settledFrames = 0;
      }
    }

    function start() {
      if (raf === null) raf = requestAnimationFrame(loop);
    }

    el.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      el.setAttribute("data-tilt-active", "true");
      start();
    });

    el.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = clamp((e.clientX - r.left) / r.width, 0, 1);
      var py = clamp((e.clientY - r.top) / r.height, 0, 1);
      target.ry = (px - 0.5) * 2 * MAX_TILT;
      target.rx = -(py - 0.5) * 2 * MAX_TILT;
      target.gx = px * 100;
      target.gy = py * 100;
      start();
    }, { passive: true });

    function reset() {
      el.removeAttribute("data-tilt-active");
      target.rx = 0;
      target.ry = 0;
      target.gx = 50;
      target.gy = 50;
      start();
    }

    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointercancel", reset);
    el.addEventListener("focusin", function () {
      target.ry = MAX_TILT * 0.5;
      target.rx = -MAX_TILT * 0.35;
      target.gx = 65;
      target.gy = 35;
      el.setAttribute("data-tilt-active", "true");
      start();
    });
    el.addEventListener("focusout", function () {
      if (!el.contains(document.activeElement)) reset();
    });
  }

  var tiltCards = document.querySelectorAll("[data-tilt]");
  if (!reduceMotion && finePointer) {
    for (var t = 0; t < tiltCards.length; t++) initTilt(tiltCards[t]);
  }

  /* ============================================================
     JOURNEYS PAGE — modals, filtering, deep links
     ============================================================ */
  var modal = document.querySelector("[data-modal]");
  if (modal) {
    var panel = modal.querySelector(".modal__panel");
    var closeBtn = modal.querySelector(".modal__close");
    var scrim = modal.querySelector(".modal__scrim");
    var lastFocus = null;
    var templates = {};

    document.querySelectorAll("template[data-journey]").forEach(function (node) {
      templates[node.getAttribute("data-journey")] = node;
    });

    var FOCUSABLE =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function openModal(slug, trigger) {
      var tpl = templates[slug];
      var body = modal.querySelector(".modal__body");
      if (!tpl || !body) return;

      body.textContent = "";
      body.appendChild(tpl.content.cloneNode(true));

      var img = modal.querySelector("[data-modal-img]");
      if (img) {
        img.src = tpl.getAttribute("data-image");
        img.alt = tpl.getAttribute("data-image-alt") || "";
      }
      var titleEl = modal.querySelector("[data-modal-title]");
      if (titleEl) titleEl.textContent = tpl.getAttribute("data-title") || "";
      var subEl = modal.querySelector("[data-modal-sub]");
      if (subEl) subEl.textContent = tpl.getAttribute("data-sub") || "";

      lastFocus = trigger || document.activeElement;
      modal.setAttribute("data-open", "true");
      document.body.classList.add("modal-open");
      window.setTimeout(function () {
        var first = panel.querySelector(FOCUSABLE);
        (first || closeBtn).focus();
      }, 60);
    }

    function closeModal() {
      modal.setAttribute("data-open", "false");
      document.body.classList.remove("modal-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-open-journey]");
      if (opener) {
        e.preventDefault();
        openModal(opener.getAttribute("data-open-journey"), opener);
        if (history.replaceState) {
          history.replaceState(null, "", "#" + opener.getAttribute("data-open-journey"));
        }
        return;
      }
      if (e.target.closest("[data-close-journey]")) {
        e.preventDefault();
        closeModal();
      }
    });

    if (scrim) scrim.addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (modal.getAttribute("data-open") !== "true") return;
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      if (e.key === "Tab") {
        var items = Array.prototype.filter.call(
          panel.querySelectorAll(FOCUSABLE),
          function (n) { return n.offsetParent !== null; }
        );
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    /* Deep link: journeys.html#kyoto opens that itinerary */
    var hashSlug = window.location.hash.replace("#", "");
    if (hashSlug && templates[hashSlug]) {
      var card = document.querySelector('[data-journey-card="' + hashSlug + '"]');
      openModal(hashSlug, card ? card.querySelector("[data-open-journey]") : null);
    }
  }

  /* Journey filtering + arrival from the homepage search */
  var filterForm = document.getElementById("journeyFilters");
  if (filterForm) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-journey-card]"));
    var q = document.getElementById("filterQ");
    var season = document.getElementById("filterSeason");
    var party = document.getElementById("filterParty");
    var count = document.getElementById("resultsCount");
    var empty = document.getElementById("noResults");

    var params = new URLSearchParams(window.location.search);

    function labelFor(slug) {
      var names = {
        kyoto: "Kyoto",
        patagonia: "Patagonia",
        marrakech: "Marrakech",
        lofoten: "Lofoten"
      };
      return names[slug] || "";
    }

    if (params.get("dest") && q) {
      q.value = labelFor(params.get("dest").toLowerCase());
    }
    if (params.get("when") && season) {
      var want = params.get("when").toLowerCase();
      var hasOption = Array.prototype.some.call(season.options, function (o) {
        return o.value === want;
      });
      if (hasOption) season.value = want;
    }
    if (params.get("party") && party) {
      var size = params.get("party");
      var hasSize = Array.prototype.some.call(party.options, function (o) {
        return o.value === size;
      });
      party.value = hasSize ? size : "";
    }

    function apply() {
      var term = (q && q.value ? q.value : "").toLowerCase().trim();
      var month = season && season.value ? season.value : "";
      var need = party && party.value ? parseInt(party.value, 10) : 1;
      var shown = 0;

      cards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        var months = (card.getAttribute("data-months") || "").split(" ");
        var capacity = parseInt(card.getAttribute("data-capacity") || "9", 10);
        var okText = !term || text.indexOf(term) !== -1;
        var okSeason = !month || months.indexOf(month) !== -1;
        var okParty = capacity >= need;
        var show = okText && okSeason && okParty;
        card.hidden = !show;
        if (show) shown++;
      });

      if (count) {
        count.textContent = "Showing " + shown + " of " + cards.length + " journeys";
      }
      if (empty) empty.hidden = shown !== 0;
    }

    ["input", "change"].forEach(function (evt) {
      filterForm.addEventListener(evt, apply);
    });

    var clearBtn = document.getElementById("filterClear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        filterForm.reset();
        apply();
        if (q) q.focus();
      });
    }

    var altClear = document.getElementById("noResultsReset");
    if (altClear && clearBtn) {
      altClear.addEventListener("click", function () {
        clearBtn.click();
      });
    }

    apply();
  }

  /* ============================================================
     DESTINATION PAGE — best-time-to-visit month picker
     ============================================================ */
  var monthFieldset = document.getElementById("monthPicker");
  var monthPanel = document.getElementById("monthPanel");

  if (monthFieldset && monthPanel) {
    var MONTH_DATA = {
      january: {
        name: "January",
        tier: "quiet",
        verdict: "Our quietest week of the year",
        temp: 5,
        crowd: 18,
        rain: 50,
        light: 10,
        blurb:
          "Frost on the moss gardens, shrines with queues of two, and the plum blossoms beginning in late month. Kamigyo is grey and honest; bring a proper coat and expect long, warm lunches.",
        notes: [
          "Temple crowds: near-empty outside New Year's first three days",
          "Highlight: Nanzen-ji's sub-temples without a single tour group",
          "Watch for: some family-run ryokan close for the first week"
        ]
      },
      february: {
        name: "February",
        tier: "shoulder",
        verdict: "Best value, best light",
        temp: 7,
        crowd: 34,
        rain: 62,
        light: 11,
        blurb:
          "Cold, clear and cheap. This is our own departure month — the snow on the northern hills makes the afternoon light go silver, and the first plum at Kitano Temmangu is worth a walk of its own.",
        notes: [
          "Setting: dry, bright, occasionally snowing twice in a week",
          "Highlight: Kitano Tenjin's plum festival, last week of month",
          "Watch for: shortest daylight on our 21-day plan"
        ]
      },
      march: {
        name: "March",
        tier: "peak",
        verdict: "Cherry watch begins",
        temp: 11,
        crowd: 72,
        rain: 118,
        light: 12,
        blurb:
          "The blossoms arrive in the last ten days and the city's mood changes overnight. Book now if you want it; book April if you want the same flowers and don't mind standing in them.",
        notes: [
          "Setting: mild mornings, damp afternoons, festival energy",
          "Highlight: Takao's slow bloom, a forty-minute train from town",
          "Watch for: rates double in the final week"
        ]
      },
      april: {
        name: "April",
        tier: "peak",
        verdict: "Peak, and worth the fuss",
        temp: 16,
        crowd: 88,
        rain: 124,
        light: 13,
        blurb:
          "Blossoms on the Kamo river, then the petals fall and the hills turn new-green. Rain is real in April — a wet, warm week — and our route has indoor days designed exactly for it.",
        notes: [
          "Setting: blossoms first fortnight, then the freshest green of the year",
          "Highlight: Miyako Odori dances, evenings only",
          "Watch for: the Golden Week tail at month's end"
        ]
      },
      may: {
        name: "May",
        tier: "peak",
        verdict: "Our favourite selling month",
        temp: 21,
        crowd: 66,
        rain: 96,
        light: 14,
        blurb:
          "After Golden Week empties the streets, May is the sweet spot: warm without humidity, everything open, and the Azalea Path at Okochi in full colour for about nine days.",
        notes: [
          "Setting: T-shirts by noon, light jacket after dinner",
          "Highlight: Okochi Azalea Path, mid-month for one week only",
          "Watch for: avoid the first four days"
        ]
      },
      june: {
        name: "June",
        tier: "quiet",
          verdict: "Rain season, and we love it",
        temp: 24,
        crowd: 42,
        rain: 154,
        light: 14,
        blurb:
          "Tsuyu — the long grey rain. Hydrangeas at Matsunoo Taisha are the reward; the crowds are not. We run a reduced June departure at a lower fare precisely because it is wet.",
        notes: [
          "Setting: humid, soft, dripping — the best moss month",
          "Highlight: Hydrangea weekend at Matsunoo",
          "Watch for: 10–14 rainy days; book indoor craft sessions"
        ]
      },
      july: {
        name: "July",
        tier: "quiet",
        verdict: "Hot, and we do not sell it",
        temp: 29,
        crowd: 38,
        rain: 150,
        light: 14,
        blurb:
          "We pause Kyoto departures in July. Thirty-five degrees, cicadas at volume, and a city built for walking. If you must come, come for the river nights and skip the hills.",
        notes: [
          "Setting: heat advisories are routine, not exceptional",
          "Highlight: Gion Matsuri's second week, and only that",
          "Watch for: we run no departures — consider Lofoten instead"
        ]
      },
      august: {
        name: "August",
        tier: "quiet",
        verdict: "Off season — deliberately unsold",
        temp: 31,
        crowd: 44,
        rain: 142,
        light: 13,
        blurb:
          "Obon week fills every train. The heat is the worst of the year and the typhoon season starts. We tell people plainly: pick Patagonia, pick Lofoten, come back to Kyoto in February.",
        notes: [
          "Setting: 33°C and 75% humidity by midday",
          "Highlight: Daimonji fire on the mountainside, 16 August",
          "Watch for: Obon travel week, mid-month"
        ]
      },
      september: {
        name: "September",
        tier: "shoulder",
        verdict: "Cultured pick for experienced travellers",
        temp: 26,
        crowd: 48,
        rain: 176,
        light: 12,
        blurb:
          "Typhoon tails, then a clean cool. Grand tea ceremony season begins and the summer crowds thin fast after the first week. Our guide's personal choice for a first visit.",
        notes: [
          "Setting: warm, then genuinely pleasant from the 20th",
          "Highlight: Jidai Matsuri, 22 October's rehearsal walks",
          "Watch for: two or three disrupted days from a typhoon"
        ]
      },
      october: {
        name: "October",
        tier: "peak",
        verdict: "The clear-air month",
        temp: 20,
        crowd: 62,
        rain: 120,
        light: 11,
        blurb:
          "The best walking weather of the year. Maples begin to turn in the northern hills in the last week, and you can sit outside for dinner without a blanket — for about three more days.",
        notes: [
          "Setting: dry, cool mornings, gold afternoon light",
          "Highlight: Kurama to Kibune ridge walk, before the leaf crowd",
          "Watch for: fares lift in the final fortnight"
        ]
      },
      november: {
        name: "November",
        tier: "peak",
        verdict: "Maples — book a year ahead",
        temp: 14,
        crowd: 92,
        rain: 108,
        light: 10,
        blurb:
          "Peak colour, peak people. Eikan-do at dusk is the most beautiful ten minutes in Japan and eight thousand people know it. Our route goes at 06:40, twice, and it works.",
        notes: [
          "Setting: coats, crimson, early darkness",
          "Highlight: Okochi and Otagaki Kannon, mid to late month",
          "Watch for: the last ten days are the busiest of the year"
        ]
      },
      december: {
        name: "December",
        tier: "shoulder",
        verdict: "Cold, clear, candle-lit",
        temp: 8,
        crowd: 40,
        rain: 52,
        light: 10,
        blurb:
          "The driest month with the sharpest mountain views. Temples light their maples in early December, the Christmas markets are small and lovely, and by the 28th everyone goes home.",
        notes: [
          "Setting: bright, frosty, beautiful daytime light",
          "Highlight: Ohara's three quiet temples, a bus ride north",
          "Watch for: New Year's week — businesses shut, shrines overflow"
        ]
      }
    };

    var TIER_LABEL = {
      peak: "Peak season",
      shoulder: "Shoulder season",
      quiet: "Quiet season"
    };

    var panelTitle = monthPanel.querySelector("[data-month-name]");
    var panelVerdict = monthPanel.querySelector("[data-month-verdict]");
    var panelBlurb = monthPanel.querySelector("[data-month-blurb]");
    var panelNotes = monthPanel.querySelector("[data-month-notes]");
    var gauges = {
      temp: monthPanel.querySelector('[data-gauge="temp"]'),
      crowd: monthPanel.querySelector('[data-gauge="crowd"]'),
      rain: monthPanel.querySelector('[data-gauge="rain"]'),
      light: monthPanel.querySelector('[data-gauge="light"]')
    };

    function setGauge(node, pct, valueText) {
      if (!node) return;
      var fill = node.querySelector(".g-fill");
      var out = node.querySelector(".g-value");
      if (fill) fill.style.width = clamp(pct, 0, 100) + "%";
      if (out) out.textContent = valueText;
    }

    function renderMonth(key) {
      var m = MONTH_DATA[key];
      if (!m) return;
      panelTitle.textContent = m.name;
      panelVerdict.textContent = m.verdict;
      panelBlurb.textContent = m.blurb;
      panelNotes.innerHTML = "";
      m.notes.forEach(function (n) {
        var li = document.createElement("li");
        li.textContent = n;
        panelNotes.appendChild(li);
      });
      monthPanel.setAttribute("data-tier", m.tier);
      monthPanel.querySelector("[data-month-tier]").textContent = TIER_LABEL[m.tier];
      setGauge(gauges.temp, ((m.temp + 5) / 40) * 100, m.temp + "°C avg");
      setGauge(gauges.crowd, m.crowd, m.crowd + "% busy");
      setGauge(gauges.rain, (m.rain / 190) * 100, m.rain + " mm");
      setGauge(gauges.light, ((m.light - 9) / 6) * 100, m.light + " hrs");
    }

    monthFieldset.addEventListener("change", function (e) {
      if (e.target && e.target.name === "month") renderMonth(e.target.value);
    });

    var initial = monthFieldset.querySelector('input[name="month"]:checked') ||
      monthFieldset.querySelector('input[name="month"]');
    if (initial) {
      initial.checked = true;
      renderMonth(initial.value);
    }
  }

  /* ============================================================
     STORIES PAGE — accessible scroll-snap slider
     ============================================================ */
  var carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    var viewport = carousel.querySelector(".carousel__viewport");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".slide"));
    var prevBtn = carousel.querySelector("[data-carousel-prev]");
    var nextBtn = carousel.querySelector("[data-carousel-next]");
    var dotsWrap = carousel.querySelector(".dots");
    var live = carousel.querySelector("[data-carousel-status]");
    var index = 0;

    slides.forEach(function (slide, i) {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", (i + 1) + " of " + slides.length);
      if (dotsWrap) {
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = "<i aria-hidden='true'></i>";
        b.setAttribute("aria-label", "Go to story " + (i + 1) + " of " + slides.length);
        b.addEventListener("click", function () {
          goTo(i);
        });
        dotsWrap.appendChild(b);
      }
    });

    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll("button")) : [];

    function goTo(i) {
      index = clamp(i, 0, slides.length - 1);
      var slide = slides[index];
      var left = slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2;
      viewport.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? "auto" : "smooth" });
      sync();
    }

    function sync() {
      if (dots.length) {
        dots.forEach(function (d, i) {
          if (i === index) d.setAttribute("aria-current", "true");
          else d.removeAttribute("aria-current");
        });
      }
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
      if (live) live.textContent = "Story " + (index + 1) + " of " + slides.length;
    }

    function nearest() {
      var center = viewport.scrollLeft + viewport.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft + s.clientWidth / 2 - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    }

    var scrollQueued = false;
    viewport.addEventListener("scroll", function () {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(function () {
        scrollQueued = false;
        var next = nearest();
        if (next !== index) {
          index = next;
          sync();
        }
      });
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });

    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    });

    if (window.ResizeObserver) {
      new ResizeObserver(function () { sync(); }).observe(viewport);
    }
    sync();
  }

  /* ============================================================
     ENQUIRY PAGE — three-step form with real validation
     ============================================================ */
  var enquiry = document.getElementById("enquiryForm");
  if (enquiry) {
    var steps = Array.prototype.slice.call(enquiry.querySelectorAll(".form-step"));
    var stepNav = Array.prototype.slice.call(enquiry.querySelectorAll(".steps li"));
    var current = 0;
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fieldOf(input) {
      return input.closest(".field");
    }

    function showError(input, message) {
      var wrap = fieldOf(input);
      var err = wrap && wrap.querySelector(".field-error");
      input.setAttribute("aria-invalid", "true");
      if (wrap) wrap.setAttribute("data-invalid", "true");
      if (err) {
        if (input.id) err.id = input.id + "-error";
        input.setAttribute("aria-describedby", err.id);
        err.textContent = message;
      }
    }

    function clearError(input) {
      var wrap = fieldOf(input);
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      if (wrap) wrap.removeAttribute("data-invalid");
    }

    function validateInput(input) {
      var value = (input.value || "").trim();
      var needed = input.hasAttribute("data-required");

      if (input.type === "email") {
        if (!value) { showError(input, "We need an address to reply to."); return false; }
        if (!EMAIL.test(value)) { showError(input, "That address looks incomplete — check for a dot."); return false; }
        clearError(input);
        return true;
      }
      if (input.type === "date" && value) {
        var chosen = new Date(value + "T00:00:00");
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (chosen < today) { showError(input, "Choose a month that has not already passed."); return false; }
        var lead = (chosen - today) / 86400000;
        if (lead < 120) {
          showError(input, "Enquiries open about four months ahead. Ask us anyway and we will try.");
          return true;
        }
        clearError(input);
        return true;
      }
      if (needed && !value) {
        showError(input, "This tells us how to plan your trip — please add it.");
        return false;
      }
      if (needed && input.minLength && value.length < input.minLength) {
        showError(input, "A little more detail, please — at least " + input.minLength + " characters.");
        return false;
      }
      clearError(input);
      return true;
    }

    function validateStep(i) {
      var ok = true;
      var firstBad = null;
      var inputs = steps[i].querySelectorAll("input, select, textarea");
      Array.prototype.forEach.call(inputs, function (input) {
        if (input.type === "hidden" || input.disabled) return;
        if (input.type === "radio" || input.type === "checkbox") {
          if (input.type === "checkbox" && input.hasAttribute("data-required") && !input.checked) {
            var cboxWrap = fieldOf(input) || input.closest("fieldset");
            if (cboxWrap) cboxWrap.setAttribute("data-invalid", "true");
            ok = false;
            if (!firstBad) firstBad = input;
            return;
          }
          if (input.hasAttribute("data-required-group")) {
            var group = steps[i].querySelectorAll('[name="' + input.name + '"]:checked');
            var wrap = input.closest(".field") || input.closest("fieldset");
            if (!group.length && wrap) {
              wrap.setAttribute("data-invalid", "true");
              var msg = wrap.querySelector(".field-error");
              if (msg) msg.textContent = input.getAttribute("data-required-group");
              ok = false;
              if (!firstBad) firstBad = input;
            } else if (wrap) {
              wrap.removeAttribute("data-invalid");
            }
          }
          return;
        }
        if (!validateInput(input)) {
          ok = false;
          if (!firstBad) firstBad = input;
        }
      });
      if (firstBad) firstBad.focus();
      return ok;
    }

    function show(i) {
      current = clamp(i, 0, steps.length - 1);
      steps.forEach(function (s, n) {
        s.hidden = n !== current;
      });
      stepNav.forEach(function (li, n) {
        li.setAttribute("data-state", n === current ? "current" : n < current ? "done" : "upcoming");
        var btn = li.querySelector("button");
        if (btn) {
          btn.setAttribute("aria-current", n === current ? "step" : "false");
          btn.disabled = n > current;
        }
      });
      var heading = steps[current].querySelector("h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: false });
      }
      window.scrollTo({ top: enquiry.getBoundingClientRect().top + window.scrollY - 110, behavior: reduceMotion ? "auto" : "smooth" });
    }

    enquiry.addEventListener("input", function (e) {
      if (e.target.type === "radio" || e.target.type === "checkbox") {
        var groupWrap = e.target.closest(".field") || e.target.closest("fieldset");
        if (groupWrap) groupWrap.removeAttribute("data-invalid");
        if (e.target.type === "checkbox") clearError(e.target);
      }
      if (e.target.matches("input, select, textarea") && e.target.getAttribute("aria-invalid") === "true") {
        validateInput(e.target);
      }
      if (e.target.id === "notes" && e.target.maxLength) {
        var counter = document.getElementById("notesCount");
        if (counter) counter.textContent = e.target.value.length + " / " + e.target.maxLength;
      }
    });

    enquiry.addEventListener("blur", function (e) {
      if (e.target.matches("input, select, textarea") && e.target.value) validateInput(e.target);
    }, true);

    enquiry.addEventListener("click", function (e) {
      var next = e.target.closest("[data-step-next]");
      var back = e.target.closest("[data-step-back]");
      var jump = e.target.closest(".steps button");

      if (next) {
        e.preventDefault();
        if (validateStep(current)) show(current + 1);
        return;
      }
      if (back) {
        e.preventDefault();
        show(current - 1);
        return;
      }
      if (jump && !jump.disabled) {
        e.preventDefault();
        var target = stepNav.indexOf(jump.parentNode);
        if (target <= current) show(target);
      }
    });

    enquiry.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;
      var submitBtn = enquiry.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Posting your enquiry…";
      }
      window.setTimeout(function () {
        var name = (document.getElementById("fullName") || {}).value || "traveller";
        var first = String(name).trim().split(/\s+/)[0];
        var routeSel = document.getElementById("journey");
        var dest = routeSel && routeSel.selectedIndex > -1
          ? routeSel.options[routeSel.selectedIndex].text
          : "a route";
        var ref = "WP-" + String(new Date().getFullYear()).slice(2) + "-" +
          Math.floor(1000 + Math.random() * 8999);
        var success = document.getElementById("enquirySuccess");
        if (success) {
          success.querySelector("[data-success-name]").textContent = first;
          success.querySelector("[data-success-ref]").textContent = "Reference " + ref;
          success.querySelector("[data-success-route]").textContent = dest;
          enquiry.hidden = true;
          success.hidden = false;
          success.setAttribute("tabindex", "-1");
          success.focus();
          window.scrollTo({ top: success.getBoundingClientRect().top + window.scrollY - 120, behavior: reduceMotion ? "auto" : "smooth" });
        }
      }, 700);
    });

    /* Suggested-arrival field unlocks the date hint */
    var paceInputs = enquiry.querySelectorAll('input[name="pace"]');
    var paceHint = document.getElementById("paceHint");
    Array.prototype.forEach.call(paceInputs, function (input) {
      input.addEventListener("change", function () {
        if (!paceHint) return;
        var copy = {
          slow: "Good — our standard shape. Three nights minimum per base, two unscheduled days.",
          medium: "Workable. We will move you every fourth day and keep one long lunch per week.",
          active: "We can do this, but we will warn you: our routes have fewer moving days than you expect."
        };
        paceHint.textContent = copy[input.value] || "";
      });
    });

    /* Arriving from a journey card: preselect that route */
    var routeParam = new URLSearchParams(window.location.search).get("route");
    if (routeParam) {
      var routeSel = document.getElementById("journey");
      if (routeSel) {
        var known = Array.prototype.some.call(routeSel.options, function (o) {
          return o.value === routeParam;
        });
        if (known) routeSel.value = routeParam;
      }
    }

    show(0);
  }

  /* ---------- Smooth-scroll any in-page anchor list item ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href*="#"]:not([data-open-journey])');
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href || href.indexOf("#") !== 0 && href.split("#")[0] !== window.location.pathname.split("/").pop()) return;
    var id = href.split("#")[1];
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#" + id);
    var focusTarget = el.querySelector("h1, h2, h3, [tabindex]");
    if (focusTarget) {
      focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    }
  });
})();
