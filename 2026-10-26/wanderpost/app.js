/* ============================================================
   Wanderpost — shared behaviour
   Signature motion: cursor spotlight + word-stagger headline.
   Plus: nav, spine draw, journey modals, month picker,
   stories slider, enquiry form. Guarded per page.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Mobile navigation ---------- */
  var toggle = $(".nav-toggle");
  var nav = $("#primary-nav");
  if (toggle && nav) {
    var closeNav = function () {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    };
    var openNav = function () {
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation");
    };
    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) { closeNav(); } else { openNav(); }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { closeNav(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        closeNav();
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 880) { closeNav(); }
    });
  }

  /* ---------- Signature motion 1: cursor spotlight ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    $$("[data-spotlight]").forEach(function (zone) {
      var queued = false;
      var x = 0, y = 0;
      var move = function (e) {
        var r = zone.getBoundingClientRect();
        x = e.clientX - r.left;
        y = e.clientY - r.top;
        if (!queued) {
          queued = true;
          window.requestAnimationFrame(function () {
            zone.style.setProperty("--mx", (x / r.width * 100).toFixed(2) + "%");
            zone.style.setProperty("--my", (y / r.height * 100).toFixed(2) + "%");
            zone.classList.add("spotlit");
            queued = false;
          });
        }
      };
      zone.addEventListener("pointermove", move, { passive: true });
      zone.addEventListener("pointerleave", function () { zone.classList.remove("spotlit"); });
    });
  }

  /* ---------- Signature motion 2: word-stagger headline ---------- */
  $$("[data-stagger]").forEach(function (title) {
    var words = title.textContent.trim().split(/\s+/);
    title.textContent = "";
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      span.style.setProperty("--wi", String(i));
      title.appendChild(span);
      if (i < words.length - 1) { title.appendChild(document.createTextNode(" ")); }
    });
  });

  /* ---------- Timeline spine draw ---------- */
  var spine = $("[data-spine]");
  if (spine) {
    if (reduced || !("IntersectionObserver" in window)) {
      spine.classList.add("is-drawing");
    } else {
      var spineObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            spine.classList.add("is-drawing");
            spineObserver.disconnect();
          }
        });
      }, { threshold: 0.08 });
      spineObserver.observe(spine);
    }
  }

  /* ---------- Journeys: read the ?q= from the homepage search ---------- */
  var params = new URLSearchParams(window.location.search);
  var query = (params.get("q") || "").trim();
  var monthParam = (params.get("month") || "").trim();
  var resultsHeading = $("[data-results-heading]");
  var queryClear = $("[data-query-clear]");
  var journeyCards = $$(".journey-row");
  var statusEl = $("[data-filter-status]");

  /* ---------- Journeys: filter bar ---------- */
  var seasonSelect = $("#filter-season");
  var paceSelect = $("#filter-pace");

  function applyFilters() {
    var season = seasonSelect ? seasonSelect.value : "";
    var pace = paceSelect ? paceSelect.value : "";
    var shown = 0;

    journeyCards.forEach(function (card) {
      var text = card.textContent.toLowerCase();
      var qOk = !query || text.indexOf(query.toLowerCase()) !== -1;
      var sOk = !season || card.getAttribute("data-seasons").split(",").indexOf(season) !== -1;
      var pOk = !pace || card.getAttribute("data-pace") === pace;
      var visible = qOk && sOk && pOk;
      card.classList.toggle("is-hidden", !visible);
      if (visible) { shown += 1; }
    });

    if (resultsHeading) {
      resultsHeading.textContent = query
        ? "Journeys matching “" + query + "”"
        : "Four routes, four seasons.";
    }
    if (statusEl) {
      var bits = [shown + (shown === 1 ? " journey" : " journeys")];
      if (season) { bits.push("season: " + season); }
      if (pace) { bits.push("pace: " + pace); }
      statusEl.textContent = bits.join(" · ");
    }
    if (queryClear) {
      queryClear.classList.toggle("is-hidden", !query);
    }
  }

  if (journeyCards.length) {
    if (seasonSelect && monthParam) {
      var map = {
        March: "spring", April: "spring", May: "spring",
        June: "summer", July: "summer", August: "summer",
        September: "autumn", October: "autumn", November: "autumn",
        December: "winter", January: "winter", February: "winter"
      };
      var guess = map[monthParam];
      if (guess) { seasonSelect.value = guess; }
    }
    [seasonSelect, paceSelect].forEach(function (el) {
      if (el) { el.addEventListener("change", applyFilters); }
    });
    if (queryClear) {
      queryClear.addEventListener("click", function () {
        window.history.replaceState({}, "", "journeys.html");
        query = "";
        applyFilters();
      });
    }
    applyFilters();

    /* Deep link straight to a journey from the homepage cards */
    if (window.location.hash) {
      var target = document.getElementById(window.location.hash.slice(1));
      if (target && target.classList.contains("journey-row")) {
        window.setTimeout(function () { target.scrollIntoView({ block: "start" }); }, 60);
      }
    }
  }

  /* ---------- Journeys: detail modals ---------- */
  var backdrop = $("[data-modal-backdrop]");
  var modal = $("[data-modal]");
  var modalTitle = $("[data-modal-title]");
  var modalBody = $("[data-modal-body]");
  var lastFocus = null;

  function closeModal() {
    if (!backdrop || !backdrop.classList.contains("is-open")) { return; }
    backdrop.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    backdrop.setAttribute("aria-hidden", "true");
    if (modalBody) { modalBody.innerHTML = ""; }
    if (lastFocus) { lastFocus.focus(); }
  }

  function openModal(id) {
    var tpl = document.getElementById(id);
    if (!tpl || !modalBody) { return; }
    lastFocus = document.activeElement;
    modalBody.innerHTML = "";
    modalBody.appendChild(tpl.content.cloneNode(true));
    var h = $("[data-modal-heading]", modalBody);
    if (h && modalTitle) { modalTitle.textContent = h.textContent; }
    backdrop.classList.add("is-open");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(function () {
      var first = $("[data-modal-close]", modal) || $("a, button", modal);
      if (first) { first.focus(); }
    }, 80);
  }

  if (backdrop && modal) {
    $$("[data-modal-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-modal-open"));
      });
    });
    $$("[data-modal-close]", modal).forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });
    backdrop.addEventListener("click", function (e) {
      if (!e.target.closest("[data-modal]") || e.target.hasAttribute("data-modal-backdrop")) { closeModal(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeModal(); }
      if (e.key !== "Tab" || !backdrop.classList.contains("is-open")) { return; }
      var focusables = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusables.length) { return; }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Destination: month picker ---------- */
  var monthData = {
    January:  { verdict: "avoid", crowd: "Low", colour: "Bare cryptomeria", temp: "1°C – 8°C", price: "££", note: "Cold, grey, and genuinely quiet. Wonderful if you want moss and empty temples; the northern hills can see 40 cm of snow, which closes Kōyasan roads without notice. We plan around it, not through it." },
    February: { verdict: "good", crowd: "Low", colour: "Plum blossom", temp: "1°C – 10°C", price: "££", note: "Our quietest month and our favourite secret. Plum at Kitano Temple opens late in the month, the light is sharp, and you will share Yōkaichi-guchi with delivery bikes rather than tour buses." },
    March:    { verdict: "good", crowd: "Rising", colour: "Early plum, willow", temp: "4°C – 13°C", price: "£££", note: "Hinami-zuke and the first warm days. Book by December if you want a machiya with a garden; the good small places go early because the cherry forecasters start talking." },
    April:    { verdict: "avoid", crowd: "Peak", colour: "Sakura, then fresh green", temp: "9°C – 19°C", price: "££££", note: "We do not open departures in April. The cherry fortnight triples the street population and quadruples the rate. The Nara-ike backwater we love becomes a queue. Come the second week of April onwards for the green instead." },
    May:      { verdict: "best", crowd: "Moderate", colour: "Shinryoku — new green", temp: "13°C – 24°C", price: "£££", note: "After Golden Week (first week) Kyoto is at its most generous. Moss gardens glow, the Kamo River is full of students and nobody else, and the evenings sit at 20°C. Arguably better than autumn." },
    June:     { verdict: "avoid", crowd: "Low", colour: "Hydrangea", temp: "18°C – 26°C", price: "££", note: "Tsuyu, the rainy season. Humidity reaches 80% and the fog under the cedars is beautiful but persistent. We run a single June departure, centred on the moss garden at morning, and we tell you plainly that shoes will get wet." },
    July:     { verdict: "avoid", crowd: "Moderate", colour: "Lotus", temp: "23°C – 33°C", price: "£££", note: "Gion Matsuri is extraordinary and the city shuts to watch it parade. Otherwise the heat is real. If you come, we build the day around water and the engawa after eight." },
    August:   { verdict: "avoid", crowd: "Moderate", colour: "Cicada-light", temp: "25°C – 35°C", price: "£££", note: "The hottest month, and the one we actively talk people out of. Goji and Daimonji aside, the temple gardens sell tickets at midday for shade. We recommend the mountains north instead." },
    September:{ verdict: "good", crowd: "Moderate", colour: "First colour in Ōhara", temp: "19°C – 28°C", price: "£££", note: "Typhoon risk in the first half, then the heat breaks. Ōhara and Kibune turn ten days before the city does, which is exactly why we start there." },
    October:  { verdict: "best", crowd: "Building", colour: "Maple at the edges", temp: "12°C – 22°C", price: "££££", note: "The month we build Deep Autumn around. Late October gives colour in the northern valleys, comfortable 20°C afternoons, and the crowds have not yet found the west-facing gardens." },
    November: { verdict: "best", crowd: "Peak colour", colour: "Full kōyō", temp: "6°C – 16°C", price: "££££", note: "The maples burn from north to south across a three-week arc. Yes, popular spots are busy — so we open at 07.00 with a teacher, then hand you the afternoon. Best colour usually lands in the second and third weeks." },
    December: { verdict: "good", crowd: "Low", colour: "Camellia, frost", temp: "2°C – 10°C", price: "££", note: "Clear cold days, camellias in the temple courtyards, and the thousand-year-old cedars at their starkest. Number-light, and the onsen towns within two hours are blissfully empty." }
  };

  var monthGrid = $("[data-month-grid]");
  if (monthGrid) {
    var readout = $("[data-month-readout]");
    var verdictLabel = { best: "Best time", good: "Good time", avoid: "We would wait" };

    function selectMonth(name, btn) {
      $$(".month-btn", monthGrid).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      var d = monthData[name];
      if (!d || !readout) { return; }
      readout.querySelector("[data-ro-month]").textContent = name + " in Kyoto";
      var badge = readout.querySelector("[data-ro-badge]");
      badge.textContent = verdictLabel[d.verdict];
      badge.className = "badge" + (d.verdict === "best" ? "" : d.verdict === "good" ? " badge--good" : " badge--avoid");
      readout.querySelector("[data-ro-crowd]").textContent = d.crowd;
      readout.querySelector("[data-ro-colour]").textContent = d.colour;
      readout.querySelector("[data-ro-temp]").textContent = d.temp;
      readout.querySelector("[data-ro-price]").textContent = d.price;
      readout.querySelector("[data-ro-note]").textContent = d.note;
      readout.setAttribute("data-verdict", d.verdict);
    }

    $$(".month-btn", monthGrid).forEach(function (btn) {
      btn.addEventListener("click", function () { selectMonth(btn.getAttribute("data-month"), btn); });
    });
    var initial = monthParam && monthData[monthParam]
      ? monthGrid.querySelector('[data-month="' + monthParam + '"]')
      : monthGrid.querySelector('[data-month="November"]') || $$(".month-btn", monthGrid)[0];
    if (initial) { selectMonth(initial.getAttribute("data-month"), initial); }
  }

  /* ---------- Stories slider ---------- */
  var slider = $("[data-slider]");
  if (slider) {
    var track = $("[data-slider-track]", slider);
    var slides = $$(".slide", track);
    var dots = $$(".slider-dot", slider);
    var prev = $("[data-slider-prev]", slider);
    var next = $("[data-slider-next]", slider);
    var counter = $("[data-slider-count]", slider);
    var index = 0;

    function go(i, announce) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      track.style.transform = "translate3d(" + (-index * 100) + "%,0,0)";
      slides.forEach(function (s, n) { s.setAttribute("aria-hidden", n === index ? "false" : "true"); });
      dots.forEach(function (d, n) { d.setAttribute("aria-current", n === index ? "true" : "false"); });
      if (prev) { prev.disabled = index === 0; }
      if (next) { next.disabled = index === slides.length - 1; }
      if (counter) { counter.textContent = String(index + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0"); }
    }

    if (prev) { prev.addEventListener("click", function () { go(index - 1); }); }
    if (next) { next.addEventListener("click", function () { go(index + 1); }); }
    dots.forEach(function (d, n) { d.addEventListener("click", function () { go(n); }); });

    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    });

    /* Touch: swipe between stories */
    var startX = null;
    track.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    track.addEventListener("pointerup", function (e) {
      if (startX === null) { return; }
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 60) { go(dx < 0 ? index + 1 : index - 1); }
      startX = null;
    });

    go(0);
  }

  /* ---------- Enquiry form ---------- */
  var form = $("[data-enquiry-form]");
  if (form) {
    var status = $("[data-form-status]", form);
    var summary = $("[data-form-summary]");

    var rules = {
      name: function (v) { return v.trim().length >= 2 || "Please tell us your name."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "We need a working email to reply to."; },
      journey: function (v) { return v !== "" || "Choose the journey you have in mind, or “Not sure yet”."; },
      travellers: function (v) {
        var n = parseInt(v, 10);
        return (!isNaN(n) && n >= 1 && n <= 8) || "We take between one and eight travellers.";
      },
      month: function (v) { return v !== "" || "Pick a month, even if you are guessing."; },
      pace: function () { return Boolean(form.querySelector('input[name="pace"]:checked')) || "Choose the pace you want."; },
      consent: function () { return Boolean(form.querySelector("#consent").checked) || "Please confirm you are happy for us to reply."; }
    };

    function validateField(el) {
      var rule = rules[el.name];
      if (!rule) { return true; }
      var result = rule(el.type === "checkbox" ? undefined : el.value);
      var ok = result === true;
      var target = el.closest(".field");
      if (target) {
        target.classList.toggle("has-error", !ok);
        var err = target.querySelector(".field-error");
        if (err && !ok) { err.textContent = result; }
      }
      return ok;
    }

    $$("input, select, textarea", form).forEach(function (el) {
      if (!rules[el.name]) { return; }
      el.addEventListener("blur", function () { validateField(el); });
      el.addEventListener("change", function () { validateField(el); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      var allOk = true;
      Object.keys(rules).forEach(function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        if (!el) { return; }
        if (!validateField(el) && !firstBad) { firstBad = el; allOk = false; }
        else if (!validateField(el)) { allOk = false; }
      });

      if (!allOk) {
        status.dataset.tone = "error";
        status.textContent = "A few fields still need you. We have marked them below — nothing has been sent.";
        status.classList.add("is-visible");
        if (firstBad) { firstBad.focus(); }
        return;
      }

      var data = new FormData(form);
      var name = (data.get("name") || "").toString().split(" ")[0];
      var journey = (data.get("journey") || "").toString();
      var month = (data.get("month") || "").toString();
      var nights = journeyNights[journey] || "eleven";

      if (summary) {
        summary.classList.add("is-visible");
        summary.innerHTML =
          "<p><strong>Thank you, " + escapeHtml(name) + ".</strong> Your note is with the planning desk.</p>" +
          "<p>We will reply within two working days from a real person, with a view on " +
          escapeHtml(month.toLowerCase()) + ", " + nights + " nights, and the one place we think you should drop.</p>";
      }
      status.dataset.tone = "ok";
      status.textContent = "Sent. Nothing leaves this browser in this demo — but on the live site that is exactly the reply you would get.";
      status.classList.add("is-visible");
      form.reset();
      status.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    });

    var journeyNights = {
      "Kyoto — Deep Autumn": "eleven",
      "Patagonia — The Long Wind": "fourteen",
      "Marrakech — Slow Medina": "nine",
      "Lofoten — Blue Hour": "ten",
      "Not sure yet — advise me": "an honest"
    };

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }

    /* Pre-select a journey when arriving from a card */
    var pre = (params.get("journey") || "").trim();
    if (pre) {
      var select = form.querySelector('[name="journey"]');
      if (select) {
        $$("option", select).forEach(function (opt) {
          if (opt.value === pre) { select.value = pre; }
        });
      }
    }
  }

  /* ---------- Newsletter-ish footer note: nothing to submit ---------- */
  $$("[data-noop]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); });
  });
})();
