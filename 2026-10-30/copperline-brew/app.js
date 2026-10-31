/* ==========================================================================
   Copperline Brewing Co. — shared behaviour
   Vanilla JS only. Every module is guarded by an element-existence check so a
   single file can be linked from every page.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  root.classList.add("js");
  root.classList.remove("js-off");

  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    reduced = false;
  }

  /* ---------------------------------------------------------------- 1. NAV */
  function initNav() {
    var toggle = doc.querySelector("[data-nav-toggle]");
    var nav = doc.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (nav.getAttribute("data-open") !== "true") return;
      nav.setAttribute("data-open", "false");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------------------------------- 2. AGE GATE 21+ */
  var GATE_KEY = "copperline-age-verified";

  function gateStorage() {
    try {
      return window.sessionStorage;
    } catch (e) {
      return null;
    }
  }

  function initAgeGate() {
    var gate = doc.getElementById("age-gate");
    if (!gate || typeof gate.showModal !== "function") return;

    var store = gateStorage();
    if (store && store.getItem(GATE_KEY) === "yes") return;

    var yes = gate.querySelector("[data-gate-yes]");
    var no = gate.querySelector("[data-gate-no]");
    var deny = gate.querySelector(".gate-deny");
    var question = gate.querySelector(".gate-question");
    var lastFocus = doc.activeElement;

    gate.showModal();
    doc.body.classList.add("is-locked");
    if (yes) yes.focus();

    function release() {
      doc.body.classList.remove("is-locked");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    if (yes) {
      yes.addEventListener("click", function () {
        if (store) {
          try {
            store.setItem(GATE_KEY, "yes");
          } catch (e) {
            /* storage full or blocked — gate simply re-asks next load */
          }
        }
        gate.close();
        release();
      });
    }

    if (no && deny && question) {
      no.addEventListener("click", function () {
        question.hidden = true;
        deny.hidden = false;
        var back = deny.querySelector("[data-gate-back]");
        if (back) back.focus();
      });
      var backBtn = deny.querySelector("[data-gate-back]");
      if (backBtn) {
        backBtn.addEventListener("click", function () {
          deny.hidden = true;
          question.hidden = false;
          if (yes) yes.focus();
        });
      }
    }

    /* the gate is a legal requirement: block backdrop dismissal */
    gate.addEventListener("cancel", function (e) {
      e.preventDefault();
    });
    gate.addEventListener("click", function (e) {
      if (e.target === gate) {
        if (yes) yes.focus();
      }
    });
  }

  /* ------------------------------------------- 3. BLUR-FADE ASCEND REVEAL */
  function initReveal() {
    var items = doc.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add("in");
      });
      return;
    }

    /* stagger siblings inside the same reveal group by 80ms */
    Array.prototype.forEach.call(items, function (el) {
      var group = el.parentElement;
      if (!group) return;
      var peers = Array.prototype.filter.call(group.children, function (c) {
        return c.classList && c.classList.contains("reveal");
      });
      if (peers.length > 1) {
        var i = peers.indexOf(el);
        el.style.setProperty("--d", Math.min(i, 8) * 80 + "ms");
      }
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    Array.prototype.forEach.call(items, function (el) {
      io.observe(el);
    });
  }

  /* --------------------------------------------- 4. PARALLAX HERO LAYERS */
  function initParallax() {
    var hero = doc.querySelector("[data-parallax]");
    if (!hero || reduced) return;

    var layers = Array.prototype.map.call(
      hero.querySelectorAll("[data-speed]"),
      function (el) {
        return { el: el, speed: parseFloat(el.getAttribute("data-speed")) || 0 };
      }
    );
    if (!layers.length) return;

    var ticking = false;
    var vh = window.innerHeight;

    function apply() {
      ticking = false;
      var y = window.pageYOffset || doc.documentElement.scrollTop || 0;
      if (y > vh + 240) return;
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        l.el.style.transform =
          "translate3d(0," + (y * l.speed).toFixed(2) + "px,0)";
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    vh = window.innerHeight;
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(
      "resize",
      function () {
        vh = window.innerHeight;
        onScroll();
      },
      { passive: true }
    );
  }

  /* --------------------------------------------------- 5. DIALS + COUNTERS */
  var DIAL_LEN = 151; /* path length of the gauge arc (r = 48 semicircle) */

  function initInstruments() {
    var dials = doc.querySelectorAll(".gauge[data-val]");
    Array.prototype.forEach.call(dials, function (g) {
      var max = parseFloat(g.getAttribute("data-max")) || 100;
      var val = parseFloat(g.getAttribute("data-val")) || 0;
      var frac = Math.max(0, Math.min(1, val / max));
      g.style.setProperty("--a", (-90 + 180 * frac).toFixed(2) + "deg");
      g.style.setProperty("--dash", (DIAL_LEN * (1 - frac)).toFixed(1));
      var live = g.querySelector(".dial-live");
      if (live) {
        live.setAttribute("stroke-dasharray", String(DIAL_LEN));
        live.setAttribute("stroke-dashoffset", String(DIAL_LEN));
      }
    });

    var meters = doc.querySelectorAll(".meter[data-val]");
    Array.prototype.forEach.call(meters, function (m) {
      var max = parseFloat(m.getAttribute("data-max")) || 100;
      var val = parseFloat(m.getAttribute("data-val")) || 0;
      m.style.setProperty("--k", Math.max(0, Math.min(1, val / max)).toFixed(3));
    });

    var counters = doc.querySelectorAll("[data-count-to]");
    if (!counters.length) return;

    function finalText(el) {
      var to = parseFloat(el.getAttribute("data-count-to"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      return prefix + to.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
    }

    Array.prototype.forEach.call(counters, function (el) {
      el.textContent = finalText(el);
    });

    if (reduced || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    function runCount(el) {
      var to = parseFloat(el.getAttribute("data-count-to"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var dur = 1150;
      var t0 = null;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var v = (to * eased).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        el.textContent = prefix + v + suffix;
        if (p < 1) window.requestAnimationFrame(frame);
        else el.textContent = finalText(el);
      }
      window.requestAnimationFrame(frame);
    }

    Array.prototype.forEach.call(counters, function (el) {
      var to = parseFloat(el.getAttribute("data-count-to"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      el.textContent =
        (0).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      io.observe(el);
    });
  }

  /* --------------------------------------------- 6. TAPROOM STATUS + HOURS */
  /* index 0 = Sunday. Minutes-from-midnight, half-hour granularity. */
  var HOURS = [
    { day: "Sunday", open: 11 * 60, close: 22 * 60 },
    { day: "Monday", open: 0, close: 0, closed: true },
    { day: "Tuesday", open: 16 * 60, close: 23 * 60 },
    { day: "Wednesday", open: 16 * 60, close: 23 * 60 },
    { day: "Thursday", open: 15 * 60, close: 24 * 60 + 30 },
    { day: "Friday", open: 14 * 60, close: 24 * 60 + 60 },
    { day: "Saturday", open: 11 * 60, close: 24 * 60 + 60 },
  ];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function fmt(mins) {
    var m = ((mins % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60);
    var mm = m % 60;
    var ampm = h >= 12 && h < 24 ? "PM" : "AM";
    var hh = h % 12;
    if (hh === 0) hh = 12;
    return hh + (mm ? ":" + (mm < 10 ? "0" + mm : mm) : ":00") + " " + ampm;
  }

  function initHours() {
    var slots = doc.querySelectorAll("[data-hours-slot]");
    var rows = doc.querySelectorAll("[data-day-index]");
    if (!slots.length && !rows.length) return;

    var now = new Date();
    var di = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = HOURS[di];
    var openNow = !today.closed && mins >= today.open && mins < today.close;

    var status = openNow
      ? "Open now — pours until " + fmt(today.close)
      : today.closed
        ? "Closed Mondays — reopens Tuesday " + fmt(HOURS[2].open)
        : mins < today.open
          ? "Opens today at " + fmt(today.open)
          : "Closed for the night — back " + DAY_NAMES[(di + 1) % 7] + " at " +
            fmt(HOURS[(di + 1) % 7].closed ? HOURS[2].open : HOURS[(di + 1) % 7].open);

    Array.prototype.forEach.call(slots, function (el) {
      var kind = el.getAttribute("data-hours-slot");
      if (kind === "status") {
        el.textContent = status;
        var lamp = el.closest(".chip, .tile, p") ? el.parentElement.querySelector(".lamp") : null;
        if (lamp) {
          lamp.classList.remove("lamp--on", "lamp--warn", "lamp--off");
          lamp.classList.add(openNow ? "lamp--on" : "lamp--warn");
        }
      } else if (kind === "clock") {
        el.textContent =
          DAY_NAMES[di].slice(0, 3).toUpperCase() +
          " " +
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (kind === "today") {
        el.textContent = DAY_NAMES[di];
      }
    });

    Array.prototype.forEach.call(rows, function (row) {
      if (parseInt(row.getAttribute("data-day-index"), 10) === di) {
        row.setAttribute("data-today", "true");
      }
    });
  }

  /* ------------------------------------------------------ 7. BEER REGISTRY */
  var BEERS = {
    "wirecutter-ipa": {
      name: "Wirecutter IPA",
      style: "West Coast IPA",
      abv: "6.8%",
      ibu: "65",
      srm: "7 SRM",
      og: "1.062",
      fg: "1.011",
      yeast: "London Ale III",
      hops: "Simcoe, Centennial, Columbus",
      malt: "Maris Otter, Golden Naked Oats, Carapils",
      avail: "On the wall year-round · 12 oz pour $8",
      img: "https://images.unsplash.com/photo-1535353805498-442f5186f3ba?auto=format&fit=crop&w=1600&q=80",
      alt: "A tall textured pint glass of clear golden West Coast IPA on a steel bar top",
      blurb:
        "The beer that put our name on the foundry wall. Wirecutter is bone-dry and resinous, built for people who like an IPA with edges.",
      notes: [
        "Pine resin and grapefruit pith up front",
        "Cracker-biscuit malt behind a firm bitterness",
        "Finishes dry, clean, and lingering",
      ],
      pairing:
        "Smoked pork ribs, aged cheddar, or anything charred on the patio grill.",
      story:
        "We brewed the first batch the week we got the 12-barrel brewhouse certified, and we have been arguing about the dry-hop schedule ever since. The current recipe landed in 2019: a Columbus first-walk at sixty minutes, then Simcoe and Centennial added at flame-out and again cold-side. No oat bombs, no haze, no apologies. If you want the hazy version of this idea, Slag Heap is two taps down."
    },
    "slag-heap-hazy": {
      name: "Slag Heap Hazy",
      style: "New England IPA",
      abv: "7.2%",
      ibu: "40",
      srm: "5 SRM",
      og: "1.070",
      fg: "1.016",
      yeast: "Voss Kveik",
      hops: "Citra, Mosaic, Galaxy",
      malt: "Pilsner, Flaked Oats, White Wheat",
      avail: "On the wall year-round · 12 oz pour $9",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d1a212eb2?auto=format&fit=crop&w=1600&q=80",
      alt: "A hazy pale-gold New England IPA in a nonic pint glass with a thick white head",
      blurb:
        "Soft, full, and tropical. We use kveik so we can ferment hot, hop heavy, and get it on the wall inside eleven days.",
      notes: [
        "Mango and tangerine zest",
        "Pillow-soft body with a faint vanilla sweetness",
        "Bitterness kept low so the hops stay juicy",
      ],
      pairing: "Korean fried chicken, jalapeño cornbread, mango-lime slaw.",
      story:
        "Slag Heap started as a one-off for our third anniversary and refused to leave. The trick was temperature: we ferment at 98°F with kveik, which strips out the rough edges that a cool-fermented hazy keeps. Skip the can, drink this one on the wall — the head is better and it is out eleven days after the tanks empty."
    },
    "rolling-mill-amber": {
      name: "Rolling Mill Amber",
      style: "Amber Ale",
      abv: "5.6%",
      ibu: "28",
      srm: "17 SRM",
      og: "1.054",
      fg: "1.013",
      yeast: "Copperline House (propagated 2014)",
      malt: "Pale, Vienna, Munich, Crystal 60, Chocolate",
      hops: "East Kent Goldings, Northern Brewer",
      avail: "On the wall year-round · 12 oz pour $7",
      img: "https://images.unsplash.com/photo-1461344577544-4e5096a6d586?auto=format&fit=crop&w=1600&q=80",
      alt: "A copper-amber ale glowing in a pint glass against a dark background",
      blurb:
        "Our house lager-adjacent amber and the exact colour of our logo. Toffee, toast, and a clean finish — the beer we drink on the line.",
      notes: [
        "Toffee and lightly burnt caramel",
        "Toasted bread crust with a whisper of cocoa",
        "Medium body, no cloying sweetness",
      ],
      pairing: "Brisket sandwich, mushroom burger, sharp gouda, pretzel bread.",
      story:
        "Rolling Mill is the control sample for our entire palate. Our yeast has been in continuous use since the first run in 2014; we pitch from the same jar every Friday and take it out of cold storage on the anniversary to make a small batch we give away at the Founders' Brunch. If you want to know what Copperline tastes like before we taste like anything else, order this."
    },
    "cold-draw-stout": {
      name: "Cold Draw Stout",
      style: "Oatmeal Stout",
      abv: "6.1%",
      ibu: "38",
      srm: "42 SRM",
      og: "1.060",
      fg: "1.018",
      yeast: "Copperline House",
      hops: "Magnum, Fuggle",
      malt: "Maris Otter, Golden Naked Oats, Roasted Barley, Midnight Wheat",
      avail: "On the wall year-round · Nitrogen pour available",
      img: "https://images.unsplash.com/photo-1515526008459-2ee8dd4a0d6c?auto=format&fit=crop&w=1600&q=80",
      alt: "A near-black nitro stout with a dense tan head settling in a snifter",
      blurb:
        "Silky and roasted with real cocoa depth, not ash. Try it on nitro from the tower at the end of the bar.",
      notes: [
        "Unsweetened cocoa and cold-brew coffee",
        "Vanilla and toasted malt from the oats",
        "Charcoal-dry finish that keeps it sessionable",
      ],
      pairing: "Oysters, beef stew, dark chocolate torte, blue cheese.",
      story:
        "Cold drawing is how you pull copper wire without heat — the same principle we use on this beer: roast hard, ferment cool, and let the oats smooth the seam. We run it off a dedicated nitro blend on the tower, which is why it takes three minutes to pour and why we will never rush you."
    },
    "flux-state-pils": {
      name: "Flux State Pils",
      style: "Czech-Style Pilsner",
      abv: "4.8%",
      ibu: "35",
      srm: "4 SRM",
      og: "1.048",
      fg: "1.012",
      yeast: "W-34/70 lager",
      hops: "Saaz, Tettnang",
      malt: "Bohemian Pilsner, Acidulated",
      avail: "On the wall May through October · Decoction-mashed",
      img: "https://images.unsplash.com/photo-1608270586620-9889bc207225?auto=format&fit=crop&w=1600&q=80",
      alt: "A brilliant clear straw-coloured pilsner with a lingering white head in a stemmed glass",
      blurb:
        "Three-vessel decoction, six weeks of cold conditioning. The most technically demanding beer we make and the one we sell the most of.",
      notes: [
        "Fresh-cut hay and lemon peel",
        "Cracker malt with a soft herbal spice",
        "Firm, dry, hop-bitter close",
      ],
      pairing: "Fried fish, goulash, soft pretzels, anything from a smoker.",
      story:
        "We decoct-mash this the long way — a third of the mash boiled and returned, twice — because a single infusion cannot build the malt depth a pilsner needs to survive that much hop bitterness. It lageres for six weeks in the cellar, which is the only reason the taproom stays patient through summer."
    },
    "patina-gose": {
      name: "Patina Gose",
      style: "Kettle-Sour Gose",
      abv: "4.2%",
      ibu: "10",
      srm: "3 SRM",
      og: "1.038",
      fg: "1.006",
      yeast: "Lactobacillus then Belle Saison",
      hops: "Hallertau Blanc (60 min, 8 IBU)",
      malt: "Pilsner, White Wheat, Sea Salt, Lime Zest",
      avail: "On the wall March through June · Limited kegs",
      img: "https://images.unsplash.com/photo-1514933651180-118f29f2f6ce?auto=format&fit=crop&w=1600&q=80",
      alt: "A pale, cloudy sour gose garnished with a lime wheel on a bar top",
      blurb:
        "Kettle-soured with a real salt line. Bright without being a candy drink — this is a gose that tastes like a foundry, not a juice bar.",
      notes: [
        "Green apple and lime leaf",
        "Saline minerality through the middle",
        "Crisp, bone-dry, tart finish",
      ],
      pairing: "Ceviche, oysters, goat cheese, salt-and-vinegar chips.",
      story:
        "Patina is what copper becomes when it is left honest — and that is the whole point of the beer. We sour in the kettle for thirty-six hours with a house lacto culture we have been repitching since 2018, then boil hard and pitch Belle Saison for a dry, carbonic finish. No fruit purée. Salt and lime only."
    },
    "ten-thousand-hours": {
      name: "Ten Thousand Hours",
      style: "Barrel-Aged Barleywine",
      abv: "11.4%",
      ibu: "55",
      srm: "14 SRM",
      og: "1.112",
      fg: "1.034",
      yeast: "Copperline House, cropped high",
      hops: "Northern Brewer, East Kent Goldings",
      malt: "Maris Otter, Crystal 120, Aromatic, Golden Naked Oats",
      avail: "Release: Dec 3 · 12 oz pour $16, 500 ml bottle $26",
      img: "https://images.unsplash.com/photo-1569529417517-1e3b5129c784?auto=format&fit=crop&w=1600&q=80",
      alt: "Dark oak spirit barrels stacked in a dim warehouse aisle",
      blurb:
        "Twenty-two months in once-used rye whiskey barrels, blended across four vessels the week before release. We bottle it because we cannot keep it.",
      notes: [
        "Fig, dates, and rye-spiced oak",
        "Burnt toffee and dark plum",
        "Warming but never hot — 11.4% hidden",
      ],
      pairing: "Stilton, dark chocolate, cigar, Thanksgiving leftovers.",
      story:
        "The name is roughly how long a batch spends in the cellar before it is worth drinking. We fill in the spring, pull a sample every month, and only blend when the four barrels agree. Release night is the fullest room of the year: 900 bottles, an hour and a half, no pre-orders. Get on the crew list so you hear about it first."
    },
    "static-cling": {
      name: "Static Cling",
      style: "Session Pale Ale",
      abv: "4.6%",
      ibu: "32",
      srm: "6 SRM",
      og: "1.044",
      fg: "1.010",
      yeast: "Copperline House",
      hops: "Idaho 7, Amarillo",
      malt: "Pale, Golden Naked Oats, Carapils",
      avail: "On the wall year-round · 12 oz pour $7, pitcher $26",
      img: "https://images.unsplash.com/photo-1535353805498-442f5186f3ba?auto=format&fit=crop&w=1600&q=80",
      alt: "A row of pale ale pints lined up on a tasting paddle",
      blurb:
        "The four-hour beer. Low gravity, high Idaho 7, and the glass you refill without thinking about it.",
      notes: [
        "Orange peel and melon rind",
        "Light cracker malt",
        "Clean, snappy, low-finishing bitterness",
      ],
      pairing: "Tacos, pizza, nachos, whatever the truck is doing on Thursday.",
      story:
        "Our shift beer. Every employee gets one at the end of the line, and the recipe has been tweaked maybe ten times in six years to keep it exactly this simple. We brew it in the smallest vessel we own because it is the fastest turn on the board."
    },
    "kiln-light": {
      name: "Kiln Light",
      style: "Cream Ale",
      abv: "5.0%",
      ibu: "18",
      srm: "3 SRM",
      og: "1.046",
      fg: "1.008",
      yeast: "Copperline House with a lager blend",
      hops: "Liberty, Tettnang",
      malt: "Eight Row Pale, Flaked Maize",
      avail: "On the wall April through September",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d1a212eb2?auto=format&fit=crop&w=1600&q=80",
      alt: "A pale golden cream ale in a classic pint glass on an outdoor picnic table",
      blurb:
        "Maize-forward, effervescent, and colder than the pilsner. A pre-prohibition American style that we brew with real corn, not syrup.",
      notes: [
        "Sweet corn and lemon drops",
        "Light honey malt",
        "Dry, spritzy finish",
      ],
      pairing: "Hot dogs, fried chicken, corn on the cob, patio heat.",
      story:
        "We flake our own corn in the milling room because the smell alone is worth it. Kiln Light is what the foundry drank at lunch in 1911, as far as we can tell from the payroll ledgers we found under the floorboards."
    },
  };

  /* -------------------------------------------------------- 8. BEER MODALS */
  function initBeerModal() {
    var dialog = doc.getElementById("beer-modal");
    var cards = doc.querySelectorAll("[data-beer]");
    if (!dialog || !cards.length) return;

    var title = dialog.querySelector("[data-modal-title]");
    var styleEl = dialog.querySelector("[data-modal-style]");
    var img = dialog.querySelector("[data-modal-img]");
    var blurb = dialog.querySelector("[data-modal-blurb]");
    var notes = dialog.querySelector("[data-modal-notes]");
    var specs = dialog.querySelector("[data-modal-specs]");
    var pairing = dialog.querySelector("[data-modal-pairing]");
    var story = dialog.querySelector("[data-modal-story]");
    var avail = dialog.querySelector("[data-modal-avail]");
    var closeBtn = dialog.querySelector(".modal-close");
    var lastFocus = null;

    var SPEC_MAP = [
      ["Style", "style"],
      ["ABV", "abv"],
      ["IBU", "ibu"],
      ["Colour", "srm"],
      ["Orig. Gravity", "og"],
      ["Final Gravity", "fg"],
      ["Yeast", "yeast"],
      ["Hops", "hops"],
      ["Malt", "malt"],
    ];

    function fill(slug) {
      var b = BEERS[slug];
      if (!b) return false;
      title.textContent = b.name;
      styleEl.textContent = b.style;
      if (img) {
        img.src = b.img;
        img.alt = b.alt;
      }
      blurb.textContent = b.blurb;
      notes.innerHTML = "";
      b.notes.forEach(function (n) {
        var li = doc.createElement("li");
        li.textContent = n;
        notes.appendChild(li);
      });
      specs.innerHTML = "";
      SPEC_MAP.forEach(function (pair) {
        if (!b[pair[1]]) return;
        var li = doc.createElement("li");
        var dt = doc.createElement("dt");
        dt.textContent = pair[0];
        var dd = doc.createElement("dd");
        dd.textContent = b[pair[1]];
        li.appendChild(dt);
        li.appendChild(dd);
        specs.appendChild(li);
      });
      pairing.textContent = b.pairing;
      story.textContent = b.story;
      avail.textContent = b.avail;
      doc.getElementById("m-alt").textContent = b.alt;
      return true;
    }

    function open(slug) {
      if (!fill(slug)) return;
      lastFocus = doc.activeElement;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      doc.body.classList.add("is-locked");
      if (closeBtn) closeBtn.focus();
      history.replaceState(null, "", "#" + slug);
    }

    function shut() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      doc.body.classList.remove("is-locked");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      history.replaceState(null, "", location.pathname + location.search);
    }

    Array.prototype.forEach.call(cards, function (card) {
      var slug = card.getAttribute("data-beer");
      var btn = card.querySelector("[data-beer-open]");
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        open(slug);
      });
      card.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && e.target === card) {
          e.preventDefault();
          open(slug);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", shut);

    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) shut();
    });
    dialog.addEventListener("close", function () {
      doc.body.classList.remove("is-locked");
    });

    /* deep link: beers.html#cold-draw-stout */
    var hash = decodeURIComponent((location.hash || "").replace("#", ""));
    if (hash && BEERS[hash]) {
      var target = doc.querySelector('[data-beer="' + hash + '"]');
      if (target) open(hash);
    }
  }

  /* --------------------------------------------------- 9. EVENT / MERCH FILTER */
  function initFilters() {
    var groups = doc.querySelectorAll("[data-filter-group]");
    if (!groups.length) return;

    Array.prototype.forEach.call(groups, function (group) {
      var targets = doc.querySelectorAll(group.getAttribute("data-filter-targets"));
      var chips = group.querySelectorAll("[data-filter]");
      var counter = doc.querySelector(group.getAttribute("data-filter-count") || "__none");
      if (!targets.length) return;

      Array.prototype.forEach.call(chips, function (chip) {
        chip.addEventListener("click", function () {
          var want = chip.getAttribute("data-filter");
          Array.prototype.forEach.call(chips, function (c) {
            c.setAttribute("aria-pressed", String(c === chip));
          });
          var shown = 0;
          Array.prototype.forEach.call(targets, function (row) {
            var kinds = (row.getAttribute("data-kind") || "").split(/\s+/);
            var match = want === "all" || kinds.indexOf(want) > -1;
            row.setAttribute("data-hidden", String(!match));
            if (match) shown++;
          });
          if (counter) {
            counter.textContent = shown === targets.length
              ? "Showing all " + targets.length
              : "Showing " + shown + " of " + targets.length;
          }
        });
      });
    });
  }

  /* ------------------------------------------------------- 10. ACCORDION FAQ */
  function initAccordion() {
    var btns = doc.querySelectorAll("[data-accordion-btn]");
    if (!btns.length) return;
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener("click", function () {
        var panel = doc.getElementById(btn.getAttribute("aria-controls"));
        if (!panel) return;
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        panel.hidden = open;
      });
    });
  }

  /* ---------------------------------------------------------- 11. FORMS */
  function initForms() {
    var forms = doc.querySelectorAll("[data-form]");
    if (!forms.length) return;

    var EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    Array.prototype.forEach.call(forms, function (form) {
      var status = form.querySelector("[data-form-status]");

      function setErr(input, message) {
        var field = input.closest(".field");
        if (!field) return;
        var slot = field.querySelector(".field__error");
        field.setAttribute("data-invalid", message ? "true" : "false");
        input.setAttribute("aria-invalid", message ? "true" : "false");
        if (slot) slot.textContent = message || "";
      }

      function validate(input) {
        var value = (input.value || "").trim();
        var needed = input.hasAttribute("required");
        if (needed && !value) {
          setErr(input, input.getAttribute("data-missing") || "This field is required.");
          return false;
        }
        if (input.type === "email" && value && !EMAIL.test(value)) {
          setErr(input, "Enter an email we can actually reply to.");
          return false;
        }
        if (input.getAttribute("type") === "number" && value) {
          var min = parseFloat(input.getAttribute("min"));
          if (!isNaN(min) && parseFloat(value) < min) {
            setErr(input, "Minimum is " + min + ".");
            return false;
          }
        }
        if (input.hasAttribute("data-minlen") && value.length < parseInt(input.getAttribute("data-minlen"), 10)) {
          setErr(input, "Give us a little more detail (" + input.getAttribute("data-minlen") + "+ characters).");
          return false;
        }
        setErr(input, "");
        return true;
      }

      var inputs = form.querySelectorAll("input, select, textarea");
      Array.prototype.forEach.call(inputs, function (input) {
        if (input.type === "checkbox" || input.type === "radio") return;
        input.addEventListener("blur", function () {
          if (input.value.trim() || input.hasAttribute("required")) validate(input);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        var firstBad = null;
        Array.prototype.forEach.call(inputs, function (input) {
          if (input.type === "checkbox") {
            if (input.hasAttribute("required") && !input.checked) {
              ok = false;
              var box = input.closest(".choice") || input.closest(".field");
              if (box) box.setAttribute("data-invalid", "true");
              if (!firstBad) firstBad = input;
            } else {
              var bx = input.closest(".choice") || input.closest(".field");
              if (bx) bx.setAttribute("data-invalid", "false");
            }
            return;
          }
          if (!validate(input)) {
            ok = false;
            if (!firstBad) firstBad = input;
          }
        });

        if (!ok) {
          if (status) {
            status.hidden = false;
            status.style.borderColor = "var(--rust)";
            status.style.background = "rgba(163,73,42,0.14)";
            status.style.color = "#f0a58f";
            status.textContent = "Check the highlighted fields, then send it again.";
          }
          if (firstBad && typeof firstBad.focus === "function") firstBad.focus();
          return;
        }

        var nameField = form.querySelector("[data-name-field]");
        var who = nameField && nameField.value.trim() ? nameField.value.trim().split(/\s+/)[0] : "friend";
        var okMsg = form.getAttribute("data-success") ||
          "Sent. We answer every message within one working day.";
        if (status) {
          status.hidden = false;
          status.style.borderColor = "";
          status.style.background = "";
          status.style.color = "";
          status.textContent = okMsg.replace("{name}", who);
          status.setAttribute("role", "status");
        }
        form.reset();
        Array.prototype.forEach.call(inputs, function (i) {
          var f = i.closest(".field");
          if (f) f.setAttribute("data-invalid", "false");
        });
        if (status) status.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  /* -------------------------------------------------- 12. TICKER / ODDS BOARD */
  function initLiveBoards() {
    var board = doc.querySelector("[data-live-board]");
    if (!board) return;
    var rows = board.querySelectorAll("[data-drift]");
    if (!rows.length || reduced) return;

    window.setInterval(function () {
      if (doc.hidden) return;
      var pick = rows[Math.floor(Math.random() * rows.length)];
      var fill = pick.querySelector(".meter-fill");
      if (!fill) return;
      var cur = parseFloat(fill.style.getPropertyValue("--k")) ||
        parseFloat(getComputedStyle(pick).getPropertyValue("--k")) || 0.5;
      var next = Math.max(0.22, Math.min(0.96, cur + (Math.random() - 0.5) * 0.16));
      fill.style.setProperty("--k", next.toFixed(3));
      var out = pick.querySelector("[data-drift-out]");
      if (out) out.textContent = Math.round(next * 100) + "%";
    }, 4200);
  }

  /* ---------------------------------------------------------- 13. MISC TIES */
  function initMisc() {
    var year = doc.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

    /* press feedback on cards that behave like buttons */
    Array.prototype.forEach.call(doc.querySelectorAll("[data-beer-open]"), function (btn) {
      btn.addEventListener("pointerdown", function () {
        btn.style.transform = "translate(2px,2px)";
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
        btn.addEventListener(ev, function () {
          btn.style.transform = "";
        });
      });
    });
  }

  /* --------------------------------------------------------------- launch */
  function boot() {
    initNav();
    initAgeGate();
    initReveal();
    initParallax();
    initInstruments();
    initHours();
    initBeerModal();
    initFilters();
    initAccordion();
    initForms();
    initLiveBoards();
    initMisc();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
