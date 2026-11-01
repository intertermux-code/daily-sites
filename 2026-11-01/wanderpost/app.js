/* ============================================================
   Wanderpost — shared behaviour
   Signature motion: cursor spotlight + magnetic elements.
   Everything is guarded by element existence and reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 1. mobile navigation ---------- */
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("site-nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      burger.setAttribute("aria-label", open ? "Open main menu" : "Close main menu");
      nav.setAttribute("data-open", String(!open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        burger.setAttribute("aria-expanded", "false");
        nav.removeAttribute("data-open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        burger.setAttribute("aria-expanded", "false");
        nav.removeAttribute("data-open");
        burger.focus();
      }
    });
  }

  /* ---------- 2. cursor spotlight (hero) ---------- */
  if (!reduce && fine) {
    document.querySelectorAll(".hero").forEach(function (hero) {
      var spot = hero.querySelector(".hero__spot");
      if (!spot) return;
      var queued = false, px = 0, py = 0;

      function paint() {
        queued = false;
        spot.style.setProperty("--mx", px + "px");
        spot.style.setProperty("--my", py + "px");
      }
      hero.addEventListener("pointerenter", function () { hero.setAttribute("data-spot", "on"); });
      hero.addEventListener("pointerleave", function () { hero.setAttribute("data-spot", "off"); });
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        px = e.clientX - r.left;
        py = e.clientY - r.top;
        if (!queued) { queued = true; requestAnimationFrame(paint); }
      }, { passive: true });
      hero.addEventListener("pointerdown", function (e) {
        hero.setAttribute("data-spot", "on");
        var r = hero.getBoundingClientRect();
        px = e.clientX - r.left; py = e.clientY - r.top;
        paint();
      }, { passive: true });
    });
  }

  /* ---------- 3. magnetic primary buttons ---------- */
  if (!reduce && fine) {
    var RADIUS = 120;
    var magnets = Array.prototype.slice.call(document.querySelectorAll(".magnet"));
    var active = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = null, running = false;

    function loop() {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      if (active) {
        var d = Math.hypot(cx, cy);
        var scale = d < 12 ? 1.04 : 1;
        active.style.transform = "translate(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px) scale(" + scale + ")";
      }
      if (Math.abs(tx - cx) < 0.15 && Math.abs(ty - cy) < 0.15 && tx === 0 && ty === 0) {
        if (active) active.style.transform = "";
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }

    document.addEventListener("pointermove", function (e) {
      var best = null, bestD = RADIUS;
      for (var i = 0; i < magnets.length; i++) {
        var el = magnets[i];
        if (!el.isConnected) continue;
        var r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        var mx = r.left + r.width / 2, my = r.top + r.height / 2;
        var d = Math.hypot(e.clientX - mx, e.clientY - my);
        if (d < bestD) { bestD = d; best = { el: el, mx: mx, my: my, e: e }; }
      }
      if (best) {
        var pull = 1 - bestD / RADIUS;
        if (active && active !== best.el) { active.style.transform = ""; }
        active = best.el;
        tx = (best.e.clientX - best.mx) * 0.34 * pull;
        ty = (best.e.clientY - best.my) * 0.42 * pull;
        start();
      } else if (active) {
        tx = 0; ty = 0; active = null; start();
      }
    }, { passive: true });

    window.addEventListener("blur", function () { tx = 0; ty = 0; if (active) { active.style.transform = ""; active = null; } start(); });
  }

  /* ---------- 4. scroll reveals + gauges ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
      document.querySelectorAll(".gauge__fill").forEach(function (f) {
        f.style.width = (f.getAttribute("data-fill") || 0) + "%";
      });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });

      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.style.width = (en.target.getAttribute("data-fill") || 0) + "%";
          gio.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      document.querySelectorAll(".gauge__fill").forEach(function (f) { gio.observe(f); });
    }
  }

  /* ---------- 5. homepage journey search ---------- */
  var searchForm = document.getElementById("search-form");
  if (searchForm) {
    var out = document.getElementById("search-out");
    var picks = {
      maple: { region: "kyoto", month: "November", pace: "still" },
      light: { region: "lofoten", month: "February", pace: "still" },
      berber: { region: "marrakech", month: "April", pace: "slow" },
      granite: { region: "patagonia", month: "December", pace: "moving" }
    };
    searchForm.querySelectorAll("[data-pick]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = picks[btn.getAttribute("data-pick")];
        if (!p) return;
        document.getElementById("q-region").value = p.region;
        document.getElementById("q-month").value = p.month;
        document.getElementById("q-pace").value = p.pace;
        document.getElementById("q-nights").value = "";
        if (out) out.textContent = "Loaded: " + btn.textContent.trim() + " — press Find Journeys.";
      });
    });
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var region = document.getElementById("q-region").value;
      var month = document.getElementById("q-month").value;
      var pace = document.getElementById("q-pace").value;
      var nights = document.getElementById("q-nights").value;
      var qs = [];
      if (pace) qs.push("pace=" + pace);
      if (month) qs.push("month=" + month.replace(/\s+/g, "").toLowerCase());
      if (nights) qs.push("nights=" + nights);
      var url = "journeys.html" + (qs.length ? "?" + qs.join("&") : "") + (region ? "#" + region : "");
      if (out) out.textContent = "Opening the desk" + (region ? " for " + region : "") + "…";
      window.setTimeout(function () { window.location.href = url; }, reduce ? 0 : 320);
    });
  }

  /* ---------- 6. journeys: filters + detail modals ---------- */
  var JOURNEYS = {
    kyoto: {
      eyebrow: "Journey 01 · Japan · Still pace",
      title: "Kyoto & the Inland Sea",
      lede: "Nineteen nights, two bases. Nine mornings in a machiya townhouse on the Higashiyama slope, then ten on a sailmaker's island in the Seto chain where the ferry timetable is the only agenda.",
      img: "https://images.unsplash.com/photo-1545569341-9ebdbbba9aec?auto=format&fit=crop&w=1400&q=80",
      alt: "Temple roofline and autumn maples in a Kyoto garden",
      tags: ["19 nights", "2 bases", "Up to 14 km flat", "6 travellers", "From £4,380"],
      price: "£4,380",
      window: "Depart 12 Nov – 8 Dec · 7 seats left",
      gauges: [
        { k: "Crowds", v: 46, lab: "Low" },
        { k: "Effort", v: 38, lab: "Easy" },
        { k: "Value", v: 74, lab: "Good" }
      ],
      guide: "Haruko Nasu · 7 years on this route",
      guideNote: "Grew up two streets from the machiya, worked fifteen years in a paper mill, and refuses to take anyone to a temple before eight o'clock.",
      itin: [
        { h: "Arrive, and do nothing", t: "Haruka train from Kansai, rice at the machiya, one street at dusk." },
        { h: "Nanzen-ji at opening", t: "The aqueduct before the gate, then the sub-temple that lets you sit." },
        { h: "Knife grinder morning", t: "Sanjo street, then a lunch counter with eleven seats and no menu." },
        { h: "Ohara, the long way", t: "Bus up at eight, Kamo river walk back, tea in the thatched hall." },
        { h: "A morning of yours", t: "Unstructured. Shortlist of four lunches, no guide, no plan." },
        { h: "Echizen paper bench", t: "Train west, two hours making a sheet you keep, lunch with the mill family." },
        { h: "Ferry south to the island", t: "Yoshie-san meets the boat. Veranda dinner, first squid of the season." },
        { h: "Boathouse and back", t: "Borrow the small boat. Afternoons free. Two more unstructured mornings follow." }
      ]
    },
    patagonia: {
      eyebrow: "Journey 02 · Argentina · Moving pace",
      title: "Patagonia, the Slow Face",
      lede: "Twenty-one nights from the wind-farmed steppe to the granite. Two working estancias, four gradual days up to Fitz Roy, and a boat day on the ice field that most operators fly over.",
      img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
      alt: "Granite peaks above a glacial valley in Patagonia",
      tags: ["21 nights", "4 bases", "5–6 hr walks", "6 travellers", "From £6,950"],
      price: "£6,950",
      window: "Depart 1 Nov – 20 Mar · 4 seats left",
      gauges: [
        { k: "Crowds", v: 58, lab: "Moderate" },
        { k: "Effort", v: 79, lab: "Demanding" },
        { k: "Value", v: 68, lab: "Fair" }
      ],
      guide: "Iker Barturen · 6 years on the south face",
      guideNote: "Former estancia shepherd, reads weather off the western ridge better than the forecast, and cooks the only acceptable lamb on the route.",
      itin: [
        { h: "Buenos Aires to the steppe", t: "Night flight on, then a four-hour drive east to the first estancia." },
        { h: "Sheep muster morning", t: "You work. Not a demonstration — an actual count, with a real dog." },
        { h: "Ride out to the lagoon", t: "Six hours horseback across pampas grass, flamingos at the far end." },
        { h: "South to El Chaltén", t: "Unpacking number three. House with a wood stove and a view that silences the table." },
        { h: "Laguna de los Tres, slowly", t: "Four days of ascent with a porter for the group, hut nights, no summit pressure." },
        { h: "A rest day of yours", t: "Bakery, river, and the second-hand bookshop with one shelf." },
        { h: "Ice field by boat", t: "Three hours on grey water against the glacier face, then a walk on the moraine." },
        { h: "North, kitchen tables", t: "Two nights at a family estancia where dinner is the event of the day." }
      ]
    },
    marrakech: {
      eyebrow: "Journey 03 · Morocco · Slow pace",
      title: "Marrakech & the High Atlas",
      lede: "Sixteen nights, one riad for a fortnight, then a five-day mule traverse into the Aït Bou Guemez valley with three families and no road in.",
      img: "https://images.unsplash.com/photo-1489749320653-a11afed114f0?auto=format&fit=crop&w=1400&q=80",
      alt: "Ochre kasbah walls and palm beds in a Moroccan valley",
      tags: ["16 nights", "2 bases", "2,400 m pass", "6 travellers", "From £3,620"],
      price: "£3,620",
      window: "Depart 20 Mar – 15 Jun · 9 seats left",
      gauges: [
        { k: "Crowds", v: 41, lab: "Low" },
        { k: "Effort", v: 62, lab: "Steady" },
        { k: "Value", v: 86, lab: "Strong" }
      ],
      guide: "Fatima Zerouali · 9 years, Atlas kitchens",
      guideNote: "Cook from Aït Bou Oulli, runs the three market mornings, and will not let anyone hold the spoon until the sixth day.",
      itin: [
        { h: "Riad, rooftop, mint", t: "Settle in the medina while the light goes amber over the Koutoubia walls." },
        { h: "Souk at seven", t: "Spice alley before the tour groups, then the tile courtyard most people walk past." },
        { h: "Cooking morning one", t: "Market, then bread on the plate and a tagine that takes four hours." },
        { h: "Drive to the valley", t: "Three hours over the Tizi n'Tichka pass, unpack at the village guesthouse." },
        { h: "Mule day to Ichbiren", t: "Five hours on a good path, walnut groves, lunch with a family who expect you." },
        { h: "The 2,400 m col", t: "The hardest morning of the trip, and the one every letter mentions." },
        { h: "An afternoon of yours", t: "No schedule, one shared garden, tea at four." },
        { h: "Back to Marrakech", t: "Two nights, one hammam, and a last dinner cooked by Fatima's sister." }
      ]
    },
    lofoten: {
      eyebrow: "Journey 04 · Norway · Still pace",
      title: "Lofoten · Fishing Winters",
      lede: "Fourteen nights in a rorbu cabin on the water at Reine, skrei season with the Aarvik family, and three hut nights above the treeline on the west coast.",
      img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80",
      alt: "Snow-covered Arctic peaks under a night sky above still fjord water",
      tags: ["14 nights", "2 bases", "2–5 hr in snow", "5 travellers", "From £5,240"],
      price: "£5,240",
      window: "Depart 1 Feb – 14 Apr · 2 seats left",
      gauges: [
        { k: "Crowds", v: 34, lab: "Very low" },
        { k: "Effort", v: 55, lab: "Moderate" },
        { k: "Value", v: 61, lab: "Fair" }
      ],
      guide: "Lars Aarvik · 12 winters, fourth generation",
      guideNote: "Runs the boat his grandfather built, asks after your family exactly once, and knows where the aurora clears when the forecast says it will not.",
      itin: [
        { h: "Bodø to Reine", t: "Ferry across, then the coast road in over three mountain shoulders." },
        { h: "Out with the skrei", t: "04:40 start, longline work, and the first fish of the season gutted on deck." },
        { h: "Fish, three ways", t: "Kitchen morning in the rorbu: raw, dried, and baked with butter and leeks." },
        { h: "Reinebringen steps", t: "1,973 of them, and the fjord arrives all at once at the top." },
        { h: "A day of yours", t: "Sauna, sea, or the shop that sells only wool and coffee." },
        { h: "West coast hut", t: "Two nights above the treeline, storm lamps, no aurora guarantee, one good evening." },
        { h: "Sled to the bay", t: "Two-hour dog team run across the frozen inlet at first blue light." },
        { h: "Return south", t: "Last morning on the water, then the ferry and the night flight home." }
      ]
    }
  };

  var grid = document.getElementById("journey-grid");
  var filterBar = document.getElementById("filters");

  function applyFilter(key) {
    if (!grid) return;
    var shown = 0;
    var cards = grid.querySelectorAll("[data-journey]");
    cards.forEach(function (card) {
      var tags = (card.getAttribute("data-tags") || "") + " " + card.getAttribute("data-journey");
      var ok = key === "all" || tags.indexOf(key) > -1;
      card.hidden = !ok;
      if (ok) shown++;
    });
    var count = document.getElementById("filter-count");
    if (count) count.textContent = "Showing " + shown + " of " + cards.length;
    var empty = document.getElementById("empty-note");
    if (empty) empty.hidden = shown !== 0;
    if (filterBar) {
      filterBar.querySelectorAll("[data-filter]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === key));
      });
    }
  }

  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]");
      if (b) applyFilter(b.getAttribute("data-filter"));
    });
    var reset = document.querySelector("[data-filter-reset]");
    if (reset) reset.addEventListener("click", function () { applyFilter("all"); });
  }

  /* modal */
  var modal = document.getElementById("journey-modal");
  var lastFocus = null;

  function fillModal(key) {
    var d = JOURNEYS[key];
    if (!d || !modal) return;
    var img = document.getElementById("modal-img");
    img.src = d.img; img.alt = d.alt;
    document.getElementById("modal-eyebrow").textContent = d.eyebrow;
    document.getElementById("modal-title").textContent = d.title;
    document.getElementById("modal-lede").textContent = d.lede;
    document.getElementById("modal-tags").innerHTML = d.tags.map(function (t) {
      return '<span class="tag tag--clay">' + t + "</span>";
    }).join("");
    document.getElementById("modal-itin").innerHTML = d.itin.map(function (s) {
      return "<li><span><b>" + s.h + "</b><span>" + s.t + "</span></span></li>";
    }).join("");
    document.getElementById("modal-price").innerHTML = d.price + '<sup>pp</sup>';
    document.getElementById("modal-gauges").innerHTML = d.gauges.map(function (g) {
      return '<div class="gauge__row"><span>' + g.k + '</span><span class="gauge__track"><span class="gauge__fill" style="width:' + g.v + '%"></span></span><b>' + g.lab + "</b></div>";
    }).join("");
    document.getElementById("modal-window").textContent = d.window;
    document.getElementById("modal-guide").textContent = d.guide;
    document.getElementById("modal-guide-note").textContent = d.guideNote;
    var cta = document.getElementById("modal-cta");
    cta.href = "enquiry.html?journey=" + key;
  }

  function openModal(key) {
    if (!modal || !JOURNEYS[key]) return;
    lastFocus = document.activeElement;
    fillModal(key);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal__close").focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) closeModal();
      var opener = e.target.closest("[data-open]");
      if (opener) openModal(opener.getAttribute("data-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab" && !modal.hidden) {
        var f = modal.querySelectorAll("button, a[href], input, select, textarea, [tabindex]");
        var list = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
        if (!list.length) return;
        var first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    if (grid) {
      grid.addEventListener("click", function (e) {
        var opener = e.target.closest("[data-open]");
        if (opener) { openModal(opener.getAttribute("data-open")); return; }
        var card = e.target.closest("[data-journey]");
        if (card && !e.target.closest("a")) openModal(card.getAttribute("data-journey"));
      });
    }
    /* deep links: journeys.html#kyoto, and ?pace= from the homepage search */
    var hash = decodeURIComponent(window.location.hash.replace("#", ""));
    var params = new URLSearchParams(window.location.search);
    if (params.get("pace")) applyFilter(params.get("pace"));
    if (JOURNEYS[hash]) {
      applyFilter("all");
      window.setTimeout(function () { openModal(hash); }, 120);
    } else if (hash) {
      applyFilter("all");
    }
  } else {
    var inlineOpen = document.querySelectorAll("[data-open]");
    inlineOpen.forEach(function (b) {
      b.addEventListener("click", function () {
        window.location.href = "journeys.html#" + b.getAttribute("data-open");
      });
    });
  }

  /* ---------- 7. destination almanac dial ---------- */
  var months = document.getElementById("months");
  if (months) {
    var ALM = [
      { m: "January", temp: "9° / 0°", crowd: 28, price: 34, rain: 7, comfort: "Cold, clear, very quiet",
        crowdLab: "Very low · you and the crows", priceLab: "Low season fares", rainLab: "Dry and bright, mostly",
        verdict: "Cold temples, hot baths, and almost nobody on the stone paths. Our second favourite month and the hardest to sell to first-time visitors.",
        score: "Yes", scoreNote: "Quiet, cheap, and the mountains behind the town still hold snow. Bring gloves for the 06:30 rice.",
        events: ["Shimekake ceremonies at a dozen shrines, 15 Jan", "First tea of the year, unbroken leaves", "Plum buds begin in the north gardens, late month"], best: false, off: false },
      { m: "February", temp: "10° / 0°", crowd: 33, price: 41, rain: 9, comfort: "Still cold, plum blossom",
        crowdLab: "Low · rooms easy", priceLab: "Standard fares", rainLab: "Occasional long showers",
        verdict: "Plum blossom before the cherry hysteria, and the last of the snow on Hiei. A very good month to be left alone in Kyoto.",
        score: "Yes", scoreNote: "Ume rather than sakura. Kitano tenmangu has the best of it, and no queue.",
        events: ["Umashi festival, Shimogamo, 1 Feb", "Kitano plum, peak around 14 Feb", "Setsubun bean-throwing at Yoshida"], best: false, off: false },
      { m: "March", temp: "14° / 4°", crowd: 61, price: 68, rain: 10, comfort: "Crisp, warming daily",
        crowdLab: "Rising · book rooms early", priceLab: "Above standard", rainLab: "Spring rain, light",
        verdict: "Late March is our compromise month: plum gone, cherry not yet, and the Higashiyama slopes in their best light of the year.",
        score: "Yes, late only", scoreNote: "Ask for 20 March onward, and we will keep you out of the bloom crowds by an hour either side of dawn.",
        events: ["Oku Hina display in the machiya, all month", "Kamo river birds return to nest", "First cherry, north face, last week"], best: true, off: false },
      { m: "April", temp: "20° / 10°", crowd: 94, price: 96, rain: 11, comfort: "Warm days, cool nights",
        crowdLab: "Over our ceiling", priceLab: "Peak · nearly double", rainLab: "Showers, then bloom clears",
        verdict: "The most beautiful fortnight in Japan and the least travelable. We will talk you into late March or November instead.",
        score: "Not for us", scoreNote: "Three-hour queues for a five-minute walk, and rooms we cannot price honestly. If you must, come for the last week.",
        events: ["Bloom peak, 1–9 Apr (moves yearly)", "Miyako odori, public garden, all month", "Kurama fire festival, 12 Oct rehearsal nights"], best: false, off: false },
      { m: "May", temp: "24° / 14°", crowd: 70, price: 74, rain: 10, comfort: "Warm, long light",
        crowdLab: "Moderate after Golden Week", priceLab: "Standard, then firm", rainLab: "Pleasant, brief",
        verdict: "After the 6th, the crowds vanish and the city becomes itself again: green maples, river dinners, and the first Shijako fish.",
        score: "Yes", scoreNote: "Excellent walking weather, and the best month for the island half of the trip.",
        events: ["Golden Week ends 6 May, city empties", "Shijako, the river fish, from mid-May", "Matsuri fittings begin in the old town"], best: false, off: false },
      { m: "June", temp: "27° / 20°", crowd: 44, price: 52, rain: 16, comfort: "Humid, then the rains",
        crowdLab: "Low · rain keeps people away", priceLab: "Below standard", rainLab: "Tsuyu: 16 wet days",
        verdict: "The rainy season, and the month the moss gardens are worth crossing an ocean for. Take the umbrella and go on the sixth day.",
        score: "For moss lovers", scoreNote: "Saiho-ji and the bamboo at 07:00 in light rain is the best hour of the Kyoto year.",
        events: ["Tsuyu begins around 7 June", "Yasaka shrine, Nagoshi purification, 30 Jun", "Moss at its deepest green"], best: false, off: false },
      { m: "July", temp: "33° / 25°", crowd: 52, price: 58, rain: 14, comfort: "Hot and humid",
        crowdLab: "Busy with holidays", priceLab: "Holiday pricing", rainLab: "Storms, then humid clear",
        verdict: "Gion matsuri is genuinely worth two nights, but daytime temperatures reach 33° and the machiya has no air conditioning by design.",
        score: "Only for the festival", scoreNote: "We would send you 14–17 July for the processions and nothing else. Avoid the middle of the month.",
        events: ["Gion matsuri, 1–31 Jul, peak 17", "Kamo river dinners under the lights", "Gozen lamb, the street market, 13–14 Jul"], best: false, off: false },
      { m: "August", temp: "34° / 26°", crowd: 58, price: 61, rain: 13, comfort: "Oppressive heat",
        crowdLab: "Half the city shuts", priceLab: "Mixed, sometimes cheap", rainLab: "Typhoon risk late month",
        verdict: "The obon holidays empty the town and fill the mountain paths. Beautiful at 05:30, unreasonable by 11:00.",
        score: "No", scoreNote: "We do not sell Kyoto in August. The island half of the trip is possible; the town is not.",
        events: ["Gozan okuribi, the fires, 16 Aug", "Obon: shops close for four days", "Typhoon season opens"], best: false, off: true },
      { m: "September", temp: "29° / 21°", crowd: 49, price: 47, rain: 17, comfort: "Warm, wet, calming",
        crowdLab: "Low after Golden Week", priceLab: "Below standard", rainLab: "17 days, often heavy",
        verdict: "The month the heat breaks. Wet, yes, but the light returns and the temple gardens are finally empty enough to sit in.",
        score: "Yes, with rain kit", scoreNote: "Bring the boots we list in the folio. Two of the three island days will be indoors and worth it.",
        events: ["Kugatsu no kansho, mid-month viewing", "Autumn equities, shrine visits, 22–23 Sep", "Typhoon residue early, then stable"], best: false, off: false },
      { m: "October", temp: "23° / 15°", crowd: 66, price: 66, rain: 11, comfort: "The best walking month",
        crowdLab: "Moderate · weekends fill", priceLab: "Standard", rainLab: "Nine dry days out of ten",
        verdict: "Stable, warm at noon, cool at dawn, and the maples begin in the north. Our recommendation if you dislike crowds more than colour.",
        score: "Yes", scoreNote: "Book the Ohara day for a weekday and you will have the thatched hall to yourself at four o'clock.",
        events: ["Kurama fire festival, 12 Oct", "Okura's harvest stage begins", "First colour above 800 m"], best: false, off: false },
      { m: "November", temp: "16° / 7°", crowd: 46, price: 38, rain: 8, comfort: "Cool, layered, luminous",
        crowdLab: "Low · temples at 07:00 are yours", priceLab: "Fair · rooms hold", rainLab: "Short showers, rarely all day",
        verdict: "This is the month we defend. Cold temples, warm baths, maple still holding above the city, and fares that have not noticed how beautiful it is.",
        score: "Yes — the window", scoreNote: "12 Nov – 8 Dec. Two-thirds of our Kyoto departures land here, and no traveller has ever written to complain about it.",
        events: ["Maple peak, city 18–28 Nov", "Hoba miso on the Ohara terrace", "Night illuminations, east temple belt"], best: true, off: false },
      { m: "December", temp: "11° / 2°", crowd: 36, price: 44, rain: 7, comfort: "Sharp cold, low sun",
        crowdLab: "Very low after the 20th", priceLab: "Standard, then holiday", rainLab: "Dry, occasionally snow",
        verdict: "Late December: bare gardens, wood fires, one monk raking, and the year ending with the temple bells walked between.",
        score: "Yes, from 20 Dec", scoreNote: "Buckwheat noodles at 22:30 on New Year's Eve, walked to, in the cold. Our staff trip, and the quietest week of the year.",
        events: ["Momiji remnants, first week", "Oshogatsu preparations from 28 Dec", "Joya no kane, 108 bells, 31 Dec"], best: true, off: false }
    ];

    var el = {
      label: document.getElementById("almanac-month-label"),
      verdict: document.getElementById("month-verdict"),
      temp: document.getElementById("d-temp"),
      comfort: document.getElementById("d-comfort"),
      mTemp: document.getElementById("m-temp"),
      crowd: document.getElementById("d-crowd"),
      crowdLab: document.getElementById("d-crowd-lab"),
      mCrowd: document.getElementById("m-crowd"),
      price: document.getElementById("d-price"),
      priceLab: document.getElementById("d-price-lab"),
      mPrice: document.getElementById("m-price"),
      rain: document.getElementById("d-rain"),
      rainLab: document.getElementById("d-rain-lab"),
      mRain: document.getElementById("m-rain"),
      events: document.getElementById("month-events"),
      score: document.getElementById("month-score"),
      scoreNote: document.getElementById("month-score-note"),
      lab: document.getElementById("d-temp-lab")
    };

    function showMonth(i) {
      var d = ALM[i];
      if (!d) return;
      months.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-month")) === i));
      });
      if (el.label) el.label.textContent = d.m;
      if (el.verdict) el.verdict.textContent = "“" + d.verdict + "”";
      if (el.temp) el.temp.textContent = d.temp;
      if (el.comfort) el.comfort.textContent = d.comfort;
      if (el.lab) el.lab.textContent = d.m.slice(0, 3);
      if (el.mTemp) el.mTemp.style.width = Math.min(100, (parseInt(d.temp, 10) - 6) * 7) + "%";
      if (el.crowd) el.crowd.textContent = d.crowd;
      if (el.crowdLab) el.crowdLab.textContent = d.crowdLab;
      if (el.mCrowd) el.mCrowd.style.width = d.crowd + "%";
      if (el.price) el.price.textContent = d.priceLab.split(" · ")[0];
      if (el.priceLab) el.priceLab.textContent = d.priceLab;
      if (el.mPrice) el.mPrice.style.width = d.price + "%";
      if (el.rain) el.rain.textContent = d.rain;
      if (el.rainLab) el.rainLab.textContent = d.rainLab;
      if (el.mRain) el.mRain.style.width = Math.round(d.rain / 18 * 100) + "%";
      if (el.events) el.events.innerHTML = d.events.map(function (e) { return "<li>" + e + "</li>"; }).join("");
      if (el.score) el.score.textContent = d.score;
      if (el.scoreNote) el.scoreNote.textContent = d.scoreNote;
    }

    months.querySelectorAll("button").forEach(function (b) {
      var i = Number(b.getAttribute("data-month"));
      var d = ALM[i];
      if (d.crowd >= 80) b.setAttribute("data-crowd", "true");
      if (d.off) b.setAttribute("data-off", "true");
      b.addEventListener("click", function () { showMonth(i); });
    });
    showMonth(10);
  }

  /* ---------- 8. stories slider ---------- */
  var slider = document.getElementById("story-slider");
  if (slider) {
    var track = document.getElementById("story-track");
    var slides = track ? Array.prototype.slice.call(track.children) : [];
    var dotsBox = document.getElementById("story-dots");
    var prog = document.getElementById("story-prog");
    var counter = document.getElementById("story-count");
    var prev = document.getElementById("story-prev");
    var next = document.getElementById("story-next");
    var toggle = document.getElementById("story-toggle");
    var idx = 0, timer = null, playing = !reduce;

    slides.forEach(function (s, i) {
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute("aria-label", (i + 1) + " of " + slides.length);
    });

    if (dotsBox) {
      slides.forEach(function (s, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "Story " + (i + 1));
        b.setAttribute("aria-current", i === 0 ? "true" : "false");
        b.innerHTML = "<i></i>";
        b.addEventListener("click", function () { go(i, true); });
        dotsBox.appendChild(b);
      });
    }

    function go(i, stop) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = "translate3d(" + (-100 * idx) + "%,0,0)";
      if (dotsBox) {
        Array.prototype.forEach.call(dotsBox.children, function (d, n) {
          d.setAttribute("aria-current", String(n === idx));
        });
      }
      if (prog) prog.style.width = ((idx + 1) / slides.length * 100) + "%";
      if (counter) {
        counter.textContent = ("0" + (idx + 1)).slice(-2) + " / " + ("0" + slides.length).slice(-2);
      }
      if (stop) { playing = false; setPlay(); }
    }
    function setPlay() {
      if (!toggle) return;
      toggle.setAttribute("aria-pressed", String(!playing));
      toggle.textContent = playing ? "Pause auto-advance" : "Resume auto-advance";
    }
    function tick() {
      timer = window.setInterval(function () { if (playing && !document.hidden) go(idx + 1); }, 7000);
    }
    if (prev) prev.addEventListener("click", function () { go(idx - 1, true); });
    if (next) next.addEventListener("click", function () { go(idx + 1, true); });
    if (toggle) {
      toggle.addEventListener("click", function () { playing = !playing; setPlay(); });
      setPlay();
    }
    slider.addEventListener("pointerenter", function () { playing = false; setPlay(); });
    slider.addEventListener("pointerleave", function () { if (!reduce) { playing = true; setPlay(); } });
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(idx - 1, true); }
      if (e.key === "ArrowRight") { go(idx + 1, true); }
    });
    go(0);
    if (!reduce) tick();
  }

  /* ---------- 9. enquiry form ---------- */
  var eq = document.getElementById("enquiry-form");
  if (eq) {
    var why = document.getElementById("f-why");
    var count = document.getElementById("why-count");
    if (why && count) {
      why.addEventListener("input", function () {
        count.textContent = why.value.length + " / " + (why.maxLength || 900);
      });
    }

    function markField(input, ok) {
      var f = input.closest(".field") || input.closest(".full");
      if (f) f.setAttribute("data-invalid", ok ? "false" : "true");
      if (!ok) { input.setAttribute("aria-invalid", "true"); } else { input.removeAttribute("aria-invalid"); }
    }

    var reqFields = eq.querySelectorAll("[required]");
    Array.prototype.forEach.call(reqFields, function (input) {
      input.addEventListener("blur", function () { validateOne(input); });
      input.addEventListener("change", function () { validateOne(input); });
    });

    function validateOne(input) {
      if (input.type === "radio") return;
      var ok = true;
      if (input.type === "checkbox") ok = input.checked;
      else if (!input.value.trim()) ok = false;
      else if (input.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      else if (input.type === "number") {
        var n = Number(input.value);
        ok = input.value !== "" && !isNaN(n) && n >= Number(input.min || 0) && n <= Number(input.max || 1e9);
      }
      else if (input.type === "tel") ok = /^[\d\s+()\-\.]*$/.test(input.value);
      markField(input, ok);
      return ok;
    }

    eq.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      Array.prototype.forEach.call(reqFields, function (input) {
        if (input.type === "radio") return;
        if (!validateOne(input) && !bad) bad = input;
      });
      var pace = eq.querySelector('input[name="pace"]:checked');
      var paceErr = document.getElementById("pace-err");
      if (!pace) {
        if (paceErr) paceErr.style.display = "block";
        if (!bad) bad = eq.querySelector('input[name="pace"]');
      } else if (paceErr) paceErr.style.display = "none";

      var status = document.getElementById("form-status");
      if (bad) {
        var missing = eq.querySelectorAll('[data-invalid="true"]').length + (!pace ? 1 : 0);
        if (status) status.textContent = missing + (missing === 1 ? " field still needs you" : " fields still need you") + " — see the notes below them.";
        bad.focus();
        return;
      }
      if (status) status.textContent = "Sending…";

      var data = new FormData(eq);
      var ref = "WP-" + String(new Date().getFullYear()).slice(2) + "-" +
        String(Math.floor(Math.random() * 9000) + 1000);
      var paceWord = { still: "Still · one base", slow: "Slow · two bases", moving: "Moving · daily transfer" };
      var jSel = document.getElementById("f-journey");
      var fields = {
        "r-ref": ref,
        "r-travellers": data.get("travellers"),
        "r-journey": jSel ? jSel.options[jSel.selectedIndex].text : "",
        "r-month": data.get("month") || "Not decided yet",
        "r-nights": data.get("nights") || "",
        "r-pace": paceWord[pace.value] || pace.value,
        "r-folio": data.get("folio") ? "Posted, first class" : "Email only"
      };
      Object.keys(fields).forEach(function (id) {
        var node = document.getElementById(id);
        if (node) node.textContent = fields[id];
      });
      var receipt = document.getElementById("receipt");
      var status2 = document.getElementById("form-status");
      window.setTimeout(function () {
        eq.hidden = true;
        if (receipt) { receipt.hidden = false; receipt.focus(); }
        if (status2) status2.textContent = "";
        if (window.innerWidth < 900) window.scrollTo(0, receipt ? receipt.offsetTop - 80 : 0);
      }, reduce ? 0 : 420);
    });

    var again = document.getElementById("r-again");
    if (again) again.addEventListener("click", function () {
      eq.reset();
      eq.hidden = false;
      var receipt = document.getElementById("receipt");
      if (receipt) receipt.hidden = true;
      eq.querySelectorAll("[data-invalid]").forEach(function (f) { f.setAttribute("data-invalid", "false"); });
      var n = document.getElementById("f-name");
      if (n) n.focus();
      if (count && why) count.textContent = "0 / " + (why.maxLength || 900);
    });

    /* prefill from a modal deep link */
    var pre = new URLSearchParams(window.location.search).get("journey");
    var jPre = document.getElementById("f-journey");
    if (pre && JOURNEYS[pre] && jPre) jPre.value = pre;
  }

  /* ---------- 10. footer dispatch ---------- */
  var news = document.getElementById("news-form");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("news-email");
      var out = document.getElementById("news-out");
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (!ok) {
        if (out) { out.textContent = "That address looks incomplete — try again."; out.style.color = "#a52a2a"; }
        input.focus();
        return;
      }
      if (out) {
        out.textContent = "Filed. Four dispatches a year, posted with the season notes.";
        out.style.color = "var(--moss)";
      }
      news.reset();
    });
  }
})();
