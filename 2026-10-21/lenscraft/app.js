/* ============================================================
   Lenscraft — shared behaviour
   Signature motion: Parallax Layers (rAF) + Spring Accordion
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var doc = document;
  var measureParallax = null;

  /* ----------------------------------------------------------
     1. Parallax Layers — single rAF scroll handler
     ---------------------------------------------------------- */
  function initParallax() {
    var layers = [].slice.call(doc.querySelectorAll("[data-speed]"));
    if (!layers.length) return;

    var ticking = false;
    var y = 0;
    var midpoints = [];

    // Layer positions are cached with transforms cleared, so the scroll
    // handler never reads layout from an element it has just moved.
    function measure() {
      layers.forEach(function (el) { el.style.transform = ""; });
      var scroll = window.pageYOffset || doc.documentElement.scrollTop || 0;
      midpoints = layers.map(function (el) {
        var rect = el.getBoundingClientRect();
        return rect.top + scroll + rect.height / 2;
      });
      layers.forEach(function (el) { el.style.transform = ""; });
    }

    function apply() {
      ticking = false;
      if (reduced.matches) {
        layers.forEach(function (el) { el.style.transform = ""; });
        return;
      }
      var centre = y + window.innerHeight / 2;
      layers.forEach(function (el, i) {
        var speed = parseFloat(el.dataset.speed) || 0;
        var offset = (centre - midpoints[i]) * speed;
        el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
      });
    }

    function onScroll() {
      y = window.pageYOffset || doc.documentElement.scrollTop || 0;
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
    }

    function onResize() {
      measure();
      onScroll();
    }

    measure();
    measureParallax = onResize;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    reduced.addEventListener
      ? reduced.addEventListener("change", onScroll)
      : reduced.addListener(onScroll);
    onScroll();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(onResize);
    window.addEventListener("load", onResize);
  }

  /* ----------------------------------------------------------
     2. Header: hide on scroll down, show on scroll up
     ---------------------------------------------------------- */
  function initHeader() {
    var header = doc.querySelector(".site-header");
    if (!header) return;
    var last = 0;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || 0;
      if (doc.body.classList.contains("nav-open")) { last = y; return; }
      if (y > last && y > 260) {
        header.classList.add("is-hidden");
      } else {
        header.classList.remove("is-hidden");
      }
      last = y;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
  }

  /* ----------------------------------------------------------
     3. Mobile navigation
     ---------------------------------------------------------- */
  function initNav() {
    var toggle = doc.querySelector(".nav-toggle");
    var menu = doc.querySelector(".nav-mobile");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      doc.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) setOpen(false);
    });
  }

  /* ----------------------------------------------------------
     4. Spring Accordion — one panel open at a time
     ---------------------------------------------------------- */
  function initAccents() {
    var groups = [].slice.call(doc.querySelectorAll("[data-accordion]"));
    if (!groups.length) return;

    groups.forEach(function (group) {
      var buttons = [].slice.call(group.querySelectorAll("[data-accordion-toggle]"));

      function closeAll(except) {
        buttons.forEach(function (btn) {
          if (btn === except) return;
          btn.setAttribute("aria-expanded", "false");
          var panel = doc.getElementById(btn.getAttribute("aria-controls"));
          if (panel) panel.dataset.open = "false";
        });
      }

      buttons.forEach(function (btn, index) {
        var panel = doc.getElementById(btn.getAttribute("aria-controls"));
        if (!panel) return;
        if (btn.dataset.openOnInit === "true") {
          btn.setAttribute("aria-expanded", "true");
          panel.dataset.open = "true";
        }

        btn.addEventListener("click", function () {
          var isOpen = btn.getAttribute("aria-expanded") === "true";
          closeAll(btn);
          btn.setAttribute("aria-expanded", String(!isOpen));
          panel.dataset.open = String(!isOpen);
        });

        btn.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowDown") next = buttons[(index + 1) % buttons.length];
          if (e.key === "ArrowUp") next = buttons[(index - 1 + buttons.length) % buttons.length];
          if (e.key === "Home") next = buttons[0];
          if (e.key === "End") next = buttons[buttons.length - 1];
          if (next) {
            e.preventDefault();
            next.focus();
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     5. Gallery — filter index + lightbox registry
     ---------------------------------------------------------- */
  function initGallery() {
    var board = doc.querySelector("[data-gallery]");
    if (!board) return;

    var cards = [].slice.call(board.querySelectorAll("[data-category]"));
    var filters = [].slice.call(doc.querySelectorAll("[data-filter]"));
    var counter = doc.querySelector("[data-result-count]");

    function applyFilter(value, focusCard) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = value === "all" || card.dataset.category === value;
        card.toggleAttribute("hidden", !match);
        if (match) shown += 1;
      });
      filters.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.dataset.filter === value));
      });
      if (counter) {
        counter.textContent = String(shown).padStart(2, "0");
      }
      if (focusCard) {
        var first = board.querySelector("[data-category]:not([hidden])");
        if (first) first.focus();
      }
    }

    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.dataset.filter, true);
      });
    });

    applyFilter("all", false);

    /* --- lightbox --- */
    var box = doc.querySelector("[data-lightbox]");
    if (!box) return;

    var img = box.querySelector("img");
    var titleEl = box.querySelector("[data-lb-title]");
    var placeEl = box.querySelector("[data-lb-place]");
    var catEl = box.querySelector("[data-lb-cat]");
    var counterEl = box.querySelector("[data-lb-counter]");
    var lastFocus = null;
    var queue = [];
    var index = 0;

    function visibleCards() {
      return cards.filter(function (c) { return !c.hasAttribute("hidden"); });
    }

    function render() {
      var card = queue[index];
      if (!card) return;
      var full = card.querySelector("[data-full]");
      img.src = full ? full.dataset.full : card.querySelector("img").src;
      img.alt = card.querySelector("img").alt;
      titleEl.textContent = card.dataset.title || "";
      placeEl.textContent = card.dataset.place || "";
      catEl.textContent = card.dataset.categoryLabel || "";
      counterEl.textContent =
        String(index + 1).padStart(2, "0") + " / " + String(queue.length).padStart(2, "0");
    }

    function open(card) {
      queue = visibleCards();
      index = queue.indexOf(card);
      if (index < 0) index = 0;
      lastFocus = card;
      render();
      box.dataset.open = "true";
      doc.body.classList.add("is-locked");
      box.querySelector("[data-lb-close]").focus();
    }

    function close() {
      box.dataset.open = "false";
      doc.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }

    function step(delta) {
      index = (index + delta + queue.length) % queue.length;
      render();
    }

    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        e.preventDefault();
        open(card);
      });
    });

    box.querySelector("[data-lb-close]").addEventListener("click", close);
    box.querySelector("[data-lb-prev]").addEventListener("click", function () { step(-1); });
    box.querySelector("[data-lb-next]").addEventListener("click", function () { step(1); });

    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    doc.addEventListener("keydown", function (e) {
      if (box.dataset.open !== "true") return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") {
        var focusables = [].slice.call(box.querySelectorAll("button"));
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && doc.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ----------------------------------------------------------
     6. Enquiry form — validation + registry confirmation
     ---------------------------------------------------------- */
  function initForms() {
    var form = doc.querySelector("[data-enquiry-form]");
    if (!form) return;

    var status = doc.querySelector("[data-form-status]");
    var summary = doc.querySelector("[data-error-summary]");

    function fieldOf(input) {
      return input.closest(".field");
    }

    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.toggle("has-error", Boolean(message));
      var slot = field.querySelector(".error");
      if (slot && !slot.id) slot.id = input.id + "-error";
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (slot) {
        var hints = input.dataset.hintRefs || "";
        input.setAttribute(
          "aria-describedby",
          message ? (hints ? slot.id + " " + hints : slot.id) : hints
        );
        if (!hints && !message) input.removeAttribute("aria-describedby");
        slot.textContent = message || "";
      }
    }

    function validate(input) {
      var value = (input.value || "").trim();
      if (input.type === "checkbox" && input.required) {
        return input.checked ? "" : "Please tick this line so we can reply to you.";
      }
      if (input.required && !value) {
        return "This line of the registry is required — please complete it.";
      }
      if (input.type === "email" && value) {
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        if (!ok) return "Please enter an email address we can actually reach you at.";
      }
      if (input.type === "tel" && value && value.replace(/\D/g, "").length < 7) {
        return "Please enter a phone number with at least seven digits.";
      }
      if (input.type === "radio") {
        var group = form.querySelectorAll('input[name="' + input.name + '"]');
        var picked = [].some.call(group, function (r) { return r.checked; });
        if (input.required && !picked) {
          return "Choose the option that fits your day.";
        }
        return "";
      }
      if (input.dataset.minlength && value && value.length < Number(input.dataset.minlength)) {
        return "A little more detail helps — please use at least " + input.dataset.minlength + " characters.";
      }
      return "";
    }

    var inputs = [].slice.call(form.querySelectorAll("input, select, textarea")).filter(function (i) {
      return i.type !== "hidden";
    });

    inputs.forEach(function (input) {
      var slot = fieldOf(input) ? fieldOf(input).querySelector(".error") : null;
      var refs = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      if (slot) refs = refs.filter(function (id) { return id !== slot.id; });
      if (refs.length) input.dataset.hintRefs = refs.join(" ");
    });

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        setError(input, validate(input));
      });
      input.addEventListener("input", function () {
        if (fieldOf(input) && fieldOf(input).classList.contains("has-error")) {
          setError(input, validate(input));
        }
      });
      if (input.type === "radio" || input.type === "checkbox") {
        input.addEventListener("change", function () {
          if (input.type === "radio") {
            var group = form.querySelectorAll('input[name="' + input.name + '"]');
            [].forEach.call(group, function (r) { setError(r, ""); });
          } else {
            setError(input, "");
          }
        });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = [];
      inputs.forEach(function (input) {
        var message = validate(input);
        setError(input, message);
        if (message) problems.push(input);
      });

      if (problems.length) {
        if (summary) {
          summary.hidden = false;
          summary.dataset.kind = "error";
          summary.textContent = "";
          var count = doc.createElement("strong");
          count.textContent =
            problems.length + (problems.length === 1 ? " field needs" : " fields need");
          summary.appendChild(count);
          summary.appendChild(
            doc.createTextNode(" a quick fix before we can log this enquiry.")
          );
        }
        if (status) status.hidden = true;
        problems[0].focus();
        return;
      }

      if (summary) summary.hidden = true;

      var name = form.querySelector("[data-name-field]");
      var date = form.querySelector("[data-date-field]");
      var ref =
        "LC-" +
        String(new Date().getFullYear()).slice(2) +
        "-" +
        String(Math.floor(Math.random() * 900) + 100);

      if (status) {
        status.textContent = "";
        var prefix = doc.createElement("span");
        prefix.textContent = "Filed under reference ";
        var stamp = doc.createElement("strong");
        stamp.textContent = ref;
        var body = doc.createElement("span");
        body.textContent =
          ". Thank you" +
          (name && name.value.trim() ? ", " + name.value.trim().split(" ")[0] : "") +
          " — a date" +
          (date && date.value ? " around " + date.value : "") +
          " is now in the booking ledger. You will hear back within two working days, and the calendar hold lasts fourteen days.";
        status.appendChild(prefix);
        status.appendChild(stamp);
        status.appendChild(body);
        status.hidden = false;
        status.dataset.kind = "success";
      }

      form.reset();
      inputs.forEach(function (input) { setError(input, ""); });
      if (status) status.setAttribute("tabindex", "-1");
      if (status) status.focus();
    });
  }

  /* ----------------------------------------------------------
     7. Deep link support: #section opens its ledger row
     ---------------------------------------------------------- */
  function initDeepLinks() {
    if (!window.location.hash) return;
    var target = doc.getElementById(window.location.hash.slice(1));
    if (!target) return;
    var toggle = target.querySelector("[data-accordion-toggle]") ||
      (target.hasAttribute("data-accordion-toggle") ? target : null);
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  }

  function boot() {
    initParallax();
    initHeader();
    initNav();
    initAccents();
    initGallery();
    initForms();
    initDeepLinks();

    // Opening a panel changes the page height, which invalidates the cached
    // parallax positions.
    doc.addEventListener("transitionend", function (e) {
      if (e.propertyName === "grid-template-rows" && measureParallax) measureParallax();
    });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
