/* =====================================================================
   Wanderpost — shared behaviour
   Page modules are guarded by element-existence checks.
   No external dependencies. Dynamic text is always written with
   textContent / createElement, never innerHTML, so page copy and any
   URL-supplied value can never be parsed as markup.
   ===================================================================== */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function (e) { reduced = e.matches; });
  }

  var doc = document;
  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || doc).querySelectorAll(sel));
  };

  /* ---------------------------------------------------------------
     Header: scrolled state + mobile navigation
     --------------------------------------------------------------- */
  function initHeader() {
    var header = $(".site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 12);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    var burger = $(".burger");
    var nav = $(".nav");
    if (!burger || !nav) return;

    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.focus();
      }
    });

    $$(".nav__link", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------------
     Signature motion 2 — Word-Stagger Headline
     Hero headline split into word spans; each rises 0.6em -> 0 with a
     60 ms stagger and settles a slight rotate(2deg) -> 0.
     --------------------------------------------------------------- */
  function initWordStagger() {
    $$("[data-stagger]").forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach(function (word, i) {
        var span = doc.createElement("span");
        span.className = "w";
        span.style.setProperty("--i", String(i));
        span.textContent = word;
        el.appendChild(span);
        if (i < words.length - 1) {
          var space = doc.createElement("span");
          space.className = "sp";
          space.setAttribute("aria-hidden", "true");
          el.appendChild(space);
        }
      });
      // Keep the accessible string identical to the visible headline.
      el.setAttribute("aria-label", words.join(" "));
    });
  }

  /* ---------------------------------------------------------------
     Signature motion 1 — Decode Text
     One keyword cycles random glyphs before resolving; runs once on load.
     --------------------------------------------------------------- */
  var GLYPHS = "アカサタナハマヤラワイキシチニヒミリギクグスツヌフムユルケセテネフェメレコソトノホモヨロ0123456789#%&@*/\\|<>[]{}+=~^";

  function initDecode() {
    $$("[data-decode]").forEach(function (el) {
      var target = (el.getAttribute("data-decode") || el.textContent).trim();
      el.setAttribute("aria-label", target);
      if (reduced) {
        el.textContent = target;
        return;
      }
      el.textContent = "";
      el.setAttribute("aria-hidden", "false");

      var frames = 0;
      var revealAt = [];
      var i;
      for (i = 0; i < target.length; i++) revealAt.push(6 + i * 3);
      var total = revealAt[revealAt.length - 1] + 8;

      var timer = window.setInterval(function () {
        var out = "";
        for (var c = 0; c < target.length; c++) {
          var ch = target.charAt(c);
          if (ch === " ") { out += " "; continue; }
          if (frames >= revealAt[c]) out += ch;
          else out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
        el.textContent = out;
        frames++;
        if (frames > total) {
          window.clearInterval(timer);
          el.textContent = target;
        }
      }, 45);
    });
  }

  /* ---------------------------------------------------------------
     Structural concept — Card Deck
     Overlapping stacked cards fan out as the stage enters the viewport.
     --------------------------------------------------------------- */
  function initDeck() {
    $$("[data-deck]").forEach(function (deck) {
      var stage = deck.closest(".deck-stage") || deck;

      function setT(t) {
        deck.style.setProperty("--t", t.toFixed(3));
      }

      if (reduced) { setT(1); return; }
      setT(0);

      var ticking = false;
      function update() {
        ticking = false;
        var rect = stage.getBoundingClientRect();
        var vh = window.innerHeight || doc.documentElement.clientHeight;
        // Progress: 0 when the stage top hits the viewport bottom,
        // 1 once it has travelled 65% of a viewport up the screen.
        var span = vh * 0.65;
        var raw = (vh - rect.top) / (span + rect.height * 0.35);
        var t = Math.max(0, Math.min(1, raw));
        // ease-out for a settling, paper-like finish
        setT(1 - Math.pow(1 - t, 2.4));
      }
      function onScroll() {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
    });
  }

  /* ---------------------------------------------------------------
     Restrained scroll reveals (images and sidebars only)
     --------------------------------------------------------------- */
  function initReveals() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------
     index.html — destination search
     Whitelisted journey keys only; navigation uses URLSearchParams so a
     typed value can never be interpolated into markup or a raw URL.
     --------------------------------------------------------------- */
  var JOURNEY_KEYS = ["kyoto", "patagonia", "marrakech", "lofoten"];
  var TONES = { peak: true, quiet: true };
  var SEASON_BLURB = {
    apr: "cherry thin, temple mornings quiet before eight",
    may: "fresh green, warm evenings, few tour buses",
    jun: "hydrangea season, soft rain, low crowds",
    jul: "festival heat, book a garden stay with shade",
    aug: "still and humid, best for the highlands",
    sep: "typhoon tail, then clear golden light",
    oct: "crisp air, maples turning in the second half",
    nov: "peak colour, busiest and most beautiful",
    dec: "cold, empty shrines, wood-smoke in the lanes",
    jan: "still water, first light, deepest quiet",
    feb: "plum blossom, setchubun sweets, thin crowds",
    mar: "early magnolia, cool mornings, good walking",
    other: "we will shape the calendar around you"
  };

  function initHeroSearch() {
    var form = $("#destination-search");
    if (!form) return;
    var results = $(".search__results", form);
    var journey = $("#search-journey", form);
    var month = $("#search-month", form);
    var pace = $("#search-pace", form);

    if (journey && month) {
      var sync = function () {
        if (!results) return;
        var key = journey.value;
        var when = month.value;
        if (!key) { results.textContent = ""; return; }
        var label = month.selectedIndex >= 0 && month.value
          ? month.options[month.selectedIndex].textContent.trim()
          : "your month";
        var text = "Best window in " + label + " — " + (SEASON_BLURB[when] || SEASON_BLURB.other) + ".";
        if (pace && pace.value) text += " paced " + pace.value + ".";
        results.textContent = text;
      };
      journey.addEventListener("change", sync);
      month.addEventListener("change", sync);
      pace.addEventListener("change", sync);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var key = journey ? journey.value : "";
      if (!key || JOURNEY_KEYS.indexOf(key) === -1) {
        if (results) results.textContent = "Choose one of our four journeys to see its window.";
        if (journey) journey.focus();
        return;
      }
      var params = new URLSearchParams();
      params.set("journey", key);
      if (month && month.value) params.set("when", month.value);
      var qs = params.toString();
      window.location.href = "journeys.html" + (qs ? "?" + qs : "");
    });
  }

  /* ---------------------------------------------------------------
     journeys.html — detail modals
    --------------------------------------------------------------- */
  function openModal(modal, focusReturn) {
    if (!modal) return;
    modal.lastFocus = focusReturn || doc.activeElement;
    modal.classList.add("is-open");
    modal.removeAttribute("aria-hidden");
    modal.setAttribute("aria-hidden", "false");
    doc.body.classList.add("modal-open");
    var panel = $(".modal__panel", modal);
    var target = $(".modal__close", modal);
    if (target) target.focus();
    if (panel) {
      panel.addEventListener("keydown", modal._keyHandler = function (event) {
        if (event.key === "Escape") {
          closeModal(modal);
          return;
        }
        if (event.key !== "Tab") return;
        var focusables = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', panel)
          .filter(function (el) { return el.offsetParent !== null; });
        if (!focusables.length) return;
        var firstEl = focusables[0];
        var lastEl = focusables[focusables.length - 1];
        if (event.shiftKey && doc.activeElement === firstEl) {
          event.preventDefault(); lastEl.focus();
        } else if (!event.shiftKey && doc.activeElement === lastEl) {
          event.preventDefault(); firstEl.focus();
        }
      });
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    doc.body.classList.remove("modal-open");
    var panel = $(".modal__panel", modal);
    if (panel && modal._keyHandler) panel.removeEventListener("keydown", modal._keyHandler);
    if (modal.lastFocus && typeof modal.lastFocus.focus === "function") modal.lastFocus.focus();
  }

  function initModals() {
    var modals = $$(".modal");
    if (!modals.length) return;

    modals.forEach(function (modal) {
      modal.setAttribute("aria-hidden", "true");
      $$("[data-modal-close]", modal).forEach(function (btn) {
        btn.addEventListener("click", function () { closeModal(modal); });
      });
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal(modal);
      });
    });

    $$("[data-modal-open]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var modal = doc.getElementById(trigger.getAttribute("data-modal-open"));
        openModal(modal, trigger);
      });
    });

    // Deep link: journeys.html?journey=kyoto — value matched against a
    // whitelist of existing modal ids, never used to build markup.
    var params = new URLSearchParams(window.location.search);
    var key = params.get("journey");
    if (key && JOURNEY_KEYS.indexOf(key) !== -1) {
      var modal = doc.getElementById("modal-" + key);
      if (modal) {
        window.setTimeout(function () {
          openModal(modal, $('[data-modal-open="modal-' + key + '"]') || null);
        }, 420);
      }
    }
  }

  /* ---------------------------------------------------------------
     destination.html — best-time-to-visit month picker
     All month copy lives in the button's data attributes and is written
     out with textContent; nothing is ever parsed as HTML.
     --------------------------------------------------------------- */
  function initMonthPicker() {
    var picker = $(".months__picker");
    if (!picker) return;
    var panel = $("[data-month-panel]");
    if (!panel) return;

    var buttons = $$("[data-month]", picker);
    var bars = $$(".climate__bar");
    if (!buttons.length) return;

    var out = {
      jp: $("[data-out='jp']", panel),
      title: $("[data-out='title']", panel),
      verdict: $("[data-out='verdict']", panel),
      high: $("[data-out='high']", panel),
      low: $("[data-out='low']", panel),
      rain: $("[data-out='rain']", panel),
      crowds: $("[data-out='crowds']", panel),
      advice: $("[data-out='advice']", panel),
      list: $("[data-out='happenings']", panel)
    };

    function select(btn) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      var num = parseInt(btn.getAttribute("data-month"), 10);
      bars.forEach(function (bar, i) {
        bar.classList.toggle("is-active", i === num - 1);
      });

      var d = btn.dataset;
      if (out.jp) out.jp.textContent = d.jp || "";
      if (out.title) out.title.textContent = d.label || "";
      if (out.verdict) {
        out.verdict.textContent = d.verdict || "";
        // class names are limited to a fixed vocabulary; data attributes
        // are never written straight into className
        var tone = TONES[d.tone] ? "verdict--" + d.tone : null;
        out.verdict.className = "verdict";
        if (tone) out.verdict.classList.add(tone);
      }
      if (out.high) out.high.textContent = d.high ? d.high + "°C" : "";
      if (out.low) out.low.textContent = d.low ? d.low + "°C" : "";
      if (out.rain) out.rain.textContent = d.rain ? d.rain + " mm" : "";
      if (out.crowds) out.crowds.textContent = d.crowds || "";
      if (out.advice) out.advice.textContent = d.advice || "";
      if (out.list) {
        out.list.textContent = "";
        (d.happenings || "").split("|").forEach(function (item) {
          if (!item) return;
          var li = doc.createElement("li");
          li.textContent = item.trim();
          out.list.appendChild(li);
        });
      }
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () { select(btn); });
      btn.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight") next = buttons[(i + 1) % buttons.length];
        if (event.key === "ArrowLeft") next = buttons[(i - 1 + buttons.length) % buttons.length];
        if (event.key === "Home") next = buttons[0];
        if (event.key === "End") next = buttons[buttons.length - 1];
        if (next) { event.preventDefault(); next.focus(); select(next); }
      });
    });

    bars.forEach(function (bar) {
      var index = parseInt(bar.getAttribute("data-month"), 10);
      bar.addEventListener("click", function () {
        var btn = buttons[index - 1];
        if (btn) { btn.focus(); select(btn); }
      });
    });

    var start = buttons[0];
    var params = new URLSearchParams(window.location.search);
    var monthParam = parseInt(params.get("when"), 10);
    if (monthParam >= 1 && monthParam <= 12) start = buttons[monthParam - 1] || start;
    start.setAttribute("aria-pressed", "true");
    select(start);
  }

  /* ---------------------------------------------------------------
     stories.html — accessible slider
     --------------------------------------------------------------- */
  function initSlider() {
    var slider = $("[data-slider]");
    if (!slider) return;
    var track = $(".slider__track", slider);
    var slides = $$(".slide", track);
    var prev = $(".slider__btn[data-prev]", slider);
    var next = $(".slider__btn[data-next]", slider);
    var dots = $$(".slider__dot", slider);
    var count = $(".slider__count", slider);
    if (!track || !slides.length) return;

    var index = 0;
    slides.forEach(function (slide, i) {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", (i + 1) + " of " + slides.length);
    });

    function render() {
      track.style.transform = "translate3d(" + (-index * 100) + "%, 0, 0)";
      slides.forEach(function (slide, i) {
        if (i === index) slide.removeAttribute("aria-hidden");
        else slide.setAttribute("aria-hidden", "true");
        $$("a[href], button", slide).forEach(function (el) {
          if (i === index) el.removeAttribute("tabindex");
          else el.setAttribute("tabindex", "-1");
        });
      });
      dots.forEach(function (dot, i) {
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;
      if (count) count.textContent = pad(index + 1) + " / " + pad(slides.length);
    }
    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function goTo(i) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      render();
    }

    if (prev) prev.addEventListener("click", function () { goTo(index - 1); });
    if (next) next.addEventListener("click", function () { goTo(index + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { goTo(i); });
    });

    slider.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); goTo(index + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); goTo(index - 1); }
    });

    var startX = null;
    track.addEventListener("touchstart", function (event) {
      startX = event.touches[0].clientX;
    }, { passive: true });
    track.addEventListener("touchend", function (event) {
      if (startX === null) return;
      var dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 56) goTo(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    render();
  }

  /* ---------------------------------------------------------------
     enquiry.html — validation with inline, field-level errors
     --------------------------------------------------------------- */
  function initEnquiry() {
    var form = $("#trip-enquiry");
    if (!form) return;
    var summary = $(".form-summary", form);
    var summaryList = summary ? $("ul", summary) : null;
    var success = $("#enquiry-success");
    var submitBtn = $("button[type='submit']", form);

    var rules = [
      {
        id: "enq-name",
        test: function (v) { return v.trim().length >= 2; },
        message: "Tell us the name to put on the itinerary."
      },
      {
        id: "enq-email",
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
        message: "We need a valid email to send your draft route."
      },
      {
        id: "enq-journey",
        test: function (v) { return v !== ""; },
        message: "Pick a journey, or choose “Not sure yet”."
      },
      {
        id: "enq-travellers",
        test: function (v) {
          var n = parseInt(v, 10);
          return !isNaN(n) && n >= 1 && n <= 12;
        },
        message: "Travellers should be between 1 and 12."
      },
      {
        id: "enq-month",
        test: function (v) { return v !== ""; },
        message: "Choose the month you would like to travel."
      },
      {
        id: "enq-length",
        test: function (v) {
          var n = parseInt(v, 10);
          return !isNaN(n) && n >= 5 && n <= 60;
        },
        message: "Our journeys run from 5 to 60 days."
      },
      {
        id: "enq-message",
        test: function (v) { return v.trim().length >= 20; },
        message: "Add at least 20 characters so we can write something useful back."
      },
      {
        id: "enq-consent",
        type: "checkbox",
        test: function (el) { return el.checked; },
        message: "Tick this so we may email you a reply."
      }
    ];

    function fieldOf(el) {
      return el.closest(".field");
    }

    function setError(el, message) {
      var field = fieldOf(el);
      if (!field) return;
      var box = $(".error", field);
      field.classList.add("is-invalid");
      el.setAttribute("aria-invalid", "true");
      if (box) {
        box.textContent = message;
        if (!box.id) box.id = el.id + "-error";
        el.setAttribute("aria-describedby", box.id);
      }
    }

    function clearError(el) {
      var field = fieldOf(el);
      if (!field) return;
      field.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
      var box = $(".error", field);
      if (box) box.textContent = "";
    }

    function resolve(rule) {
      var el = doc.getElementById(rule.id);
      if (!el) return null;
      var bad = rule.type === "checkbox" ? !rule.test(el) : !rule.test(el.value);
      return { el: el, bad: bad, message: rule.message };
    }

    rules.forEach(function (rule) {
      var el = doc.getElementById(rule.id);
      if (!el) return;
      var evt = rule.type === "checkbox" ? "change" : "input";
      el.addEventListener(evt, function () {
        var field = fieldOf(el);
        if (field && field.classList.contains("is-invalid")) {
          var r = resolve(rule);
          if (r && !r.bad) clearError(el);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var problems = [];
      rules.forEach(function (rule) {
        var r = resolve(rule);
        if (!r) return;
        if (r.bad) { setError(r.el, r.message); problems.push(r); }
        else clearError(r.el);
      });

      if (problems.length) {
        if (summaryList) {
          summaryList.textContent = "";
          problems.forEach(function (p) {
            var li = doc.createElement("li");
            var a = doc.createElement("a");
            a.href = "#" + p.el.id;
            a.textContent = p.message;
            li.appendChild(a);
            summaryList.appendChild(li);
          });
        }
        if (summary) {
          summary.classList.add("is-visible");
          summary.setAttribute("tabindex", "-1");
          summary.focus();
        }
        return;
      }

      if (summary) summary.classList.remove("is-visible");
      var nameEl = doc.getElementById("enq-name");
      var first = nameEl ? nameEl.value.trim().split(" ")[0].replace(/[<>&]/g, "") : "traveller";
      var slot = $("#enquiry-name-out");
      if (slot) slot.textContent = first;

      form.style.display = "none";
      if (success) {
        success.classList.add("is-visible");
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  /* ---------------------------------------------------------------
     Footer newsletter (every page)
     --------------------------------------------------------------- */
  function initNewsletter() {
    $$("[data-newsletter]").forEach(function (form) {
      var input = $("input[type='email']", form);
      var note = $(".form-note", form);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!input || !note) return;
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        note.setAttribute("data-tone", ok ? "ok" : "error");
        note.textContent = ok
          ? "Thank you — a new dispatch lands the first Thursday of each month."
          : "Please enter a valid email address.";
        if (ok) {
          input.value = "";
        } else {
          input.focus();
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     Boot
     --------------------------------------------------------------- */
  function boot() {
    initHeader();
    initWordStagger();
    initDecode();
    initDeck();
    initReveals();
    initHeroSearch();
    initModals();
    initMonthPicker();
    initSlider();
    initEnquiry();
    initNewsletter();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
