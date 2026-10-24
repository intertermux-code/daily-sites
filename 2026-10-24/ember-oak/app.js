/* ==========================================================================
   Ember & Oak — shared behaviour
   Every feature is guarded by an element-existence check so one file serves
   all five pages. Vanilla only, no dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function reduced() { return motionQuery.matches; }

  /* -------------------------------------------------- 1. Header + mobile nav */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var toggle = header.querySelector(".nav-toggle");
    var nav = header.querySelector(".primary-nav");

    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }
  }

  /* -------------------------------------------------- 2. Footer year */
  function initYear() {
    var slots = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    slots.forEach(function (el) { el.textContent = y; });
  }

  /* -------------------------------------------------- 3. Word-stagger headline
     Signature motion: each word rises 0.6em -> 0 and settles rotate(2deg) -> 0
     with a 60ms stagger. Runs on load for [data-words]. */
  function initWords() {
    var targets = document.querySelectorAll("[data-words]");
    targets.forEach(function (el) {
      var parts = el.textContent.trim().split(/\s+/);
      var base = parseInt(el.getAttribute("data-words-base") || "0", 10) || 0;
      el.textContent = "";
      parts.forEach(function (word, i) {
        var span = document.createElement("span");
        span.className = "w";
        span.textContent = word;
        span.style.transitionDelay = (base + i * 60) + "ms";
        el.appendChild(span);
        if (i < parts.length - 1) el.appendChild(document.createTextNode(" "));
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add("is-settled"); });
      });
    });
  }

  /* -------------------------------------------------- 4. Clip-path image reveal
     Signature motion: inset(12% 8% round 12px) -> inset(0), 900ms ease-out. */
  function initReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduced() || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------- 5. Split Dialogue
     Sticky visual pane swaps layers as flowing sections enter view. */
  function initSplit() {
    var sections = document.querySelectorAll("[data-stage]");
    var layers = document.querySelectorAll(".split__layer");
    if (!sections.length || !layers.length) return;

    var first = layers[0];
    first.classList.add("is-active");

    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var key = entry.target.getAttribute("data-stage");
        layers.forEach(function (layer) {
          layer.classList.toggle("is-active", layer.getAttribute("data-layer") === key);
        });
        var capNum = document.querySelector("[data-stage-index]");
        if (capNum) {
          var active = document.querySelector('.split__layer[data-layer="' + key + '"]');
          if (active) {
            var flow = document.querySelectorAll(".flow__section");
            flow.forEach(function (s, i) {
              if (s.getAttribute("data-stage") === key) {
                capNum.textContent = String(i + 1).padStart(2, "0");
              }
            });
          }
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* -------------------------------------------------- 6. Menu tabs */
  function initTabs() {
    var tablist = document.querySelector("[role='tablist'][data-tabs]");
    if (!tablist) return;

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role='tab']"));
    var panels = tabs.map(function (t) {
      return document.getElementById(t.getAttribute("aria-controls"));
    });

    function select(index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.setAttribute("tabindex", on ? "0" : "-1");
        if (panels[i]) {
          panels[i].hidden = !on;
          if (on && !reduced()) {
            panels[i].classList.remove("fade-swap");
            void panels[i].offsetWidth;
            panels[i].classList.add("fade-swap");
          }
        }
        var layer = document.querySelector('.split__layer[data-layer="menu-' + i + '"]');
        if (layer) {
          document.querySelectorAll(".split__layer").forEach(function (l) {
            l.classList.toggle("is-active", l === layer);
          });
        }
      });
      if (moveFocus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(next, true);
      });
    });

    var startIndex = 0;
    var hash = window.location.hash.replace("#", "");
    tabs.forEach(function (tab, i) {
      if (tab.getAttribute("aria-controls") === hash) startIndex = i;
    });
    select(startIndex, false);
  }

  /* -------------------------------------------------- 7. Gallery lightbox + filters */
  function initGallery() {
    var grid = document.querySelector("[data-gallery]");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".gal-item"));
    var box = document.querySelector(".lightbox");
    if (!box) return;

    var img = box.querySelector("[data-lb-img]");
    var cap = box.querySelector("[data-lb-cap]");
    var count = box.querySelector("[data-lb-count]");
    var closeBtn = box.querySelector(".lb-close");
    var prevBtn = box.querySelector(".lb-prev");
    var nextBtn = box.querySelector(".lb-next");
    var lastFocus = null;
    var current = 0;

    function visible() {
      return cards.filter(function (c) { return !c.hidden; });
    }

    function render() {
      var list = visible();
      if (!list.length) return;
      current = (current + list.length) % list.length;
      var card = list[current];
      var full = card.querySelector("[data-full]").getAttribute("data-full");
      img.src = full;
      img.alt = card.querySelector("[data-full]").getAttribute("alt");
      cap.textContent = card.getAttribute("data-caption");
      count.textContent = String(current + 1).padStart(2, "0") + " / " +
        String(list.length).padStart(2, "0");
    }

    function open(card) {
      var list = visible();
      current = list.indexOf(card);
      lastFocus = document.activeElement;
      render();
      box.classList.add("is-open");
      document.body.classList.add("is-locked");
      closeBtn.focus();
    }

    function shut() {
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }

    cards.forEach(function (card) {
      card.addEventListener("click", function () { open(card); });
    });

    closeBtn.addEventListener("click", shut);
    prevBtn.addEventListener("click", function () { current -= 1; render(); });
    nextBtn.addEventListener("click", function () { current += 1; render(); });

    box.addEventListener("click", function (e) {
      if (e.target === box) shut();
    });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") { shut(); return; }
      if (e.key === "ArrowLeft") { current -= 1; render(); return; }
      if (e.key === "ArrowRight") { current += 1; render(); return; }
      if (e.key === "Tab") {
        var focusables = box.querySelectorAll("button");
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* category filters */
    var chips = document.querySelectorAll("[data-filter]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var want = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        cards.forEach(function (card) {
          var cat = card.getAttribute("data-cat");
          card.hidden = !(want === "all" || cat === want);
        });
        current = 0;
      });
    });
  }

  /* -------------------------------------------------- 8. Reservation form */
  function initBooking() {
    var form = document.getElementById("booking-form");
    var done = document.getElementById("booking-confirm");
    if (!form || !done) return;

    var errorIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>';

    var rules = {
      name: function (v) {
        if (!v.trim()) return "Please enter the name on the reservation.";
        if (v.trim().length < 2) return "Name must be at least two characters.";
        return "";
      },
      phone: function (v) {
        if (!v.trim()) return "We need a phone number to hold the table.";
        var digits = v.replace(/\D/g, "");
        if (digits.length < 7) return "Enter a reachable phone number, including area code.";
        return "";
      },
      email: function (v) {
        if (!v.trim()) return "Please enter an email for your confirmation.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "That email address looks incomplete.";
        return "";
      },
      date: function (v) {
        if (!v) return "Choose the evening you would like to join us.";
        var picked = new Date(v + "T17:00:00");
        if (isNaN(picked.getTime())) return "Enter the date as YYYY-MM-DD.";
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (picked < today) return "That date has already passed — pick a future evening.";
        var day = picked.getDay();
        if (day === 1) return "We are closed on Mondays. Try a Tuesday through Sunday.";
        return "";
      },
      time: function (v) {
        if (!v) return "Select an arrival time.";
        return "";
      },
      party: function (v) {
        if (!v) return "Select how many guests are joining.";
        return "";
      }
    };

    function fieldOf(input) { return input.closest(".field"); }

    function messageFor(input) {
      var field = fieldOf(input);
      return field ? field.querySelector(".error-msg") : null;
    }

    function validate(input, showError) {
      var rule = rules[input.name];
      if (!rule) return true;
      var msg = rule(input.value);
      var field = fieldOf(input);
      var out = messageFor(input);
      if (!field) return !msg;

      if (msg) {
        if (showError) {
          field.classList.add("is-invalid");
          field.classList.remove("is-valid");
          input.setAttribute("aria-invalid", "true");
          if (out) out.innerHTML = errorIcon + "<span>" + msg + "</span>";
        }
        return false;
      }
      field.classList.remove("is-invalid");
      field.classList.add("is-valid");
      input.removeAttribute("aria-invalid");
      if (out) out.textContent = "";
      return true;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
    inputs.forEach(function (input) {
      if (!rules[input.name]) return;
      input.addEventListener("blur", function () { validate(input, true); });
      input.addEventListener("input", function () {
        if (fieldOf(input).classList.contains("is-invalid")) validate(input, true);
      });
    });

    var minDate = new Date();
    var iso = function (d) {
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    };
    var dateInput = form.querySelector('[name="date"]');
    if (dateInput) dateInput.min = iso(minDate);
    var maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 180);
    if (dateInput) dateInput.max = iso(maxDate);

    var status = form.querySelector(".form-status");
    var submit = form.querySelector('[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      var ok = true;
      inputs.forEach(function (input) {
        if (!rules[input.name]) return;
        if (!validate(input, true)) {
          ok = false;
          if (!firstBad) firstBad = input;
        }
      });

      if (!ok) {
        if (status) status.textContent = "Please correct the highlighted fields.";
        if (firstBad) firstBad.focus();
        return;
      }

      if (status) status.textContent = "";
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Holding your table…";
      }

      window.setTimeout(function () {
        var data = new FormData(form);
        done.querySelector("[data-out-name]").textContent = data.get("name");
        done.querySelector("[data-out-ref]").textContent = "EBK-" +
          String(Math.floor(1000 + Math.random() * 8999));

        var when = new Date(data.get("date") + "T17:00:00");
        done.querySelector("[data-out-date]").textContent = when.toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric"
        });

        var timeSelect = form.querySelector('[name="time"]');
        done.querySelector("[data-out-time]").textContent =
          timeSelect.options[timeSelect.selectedIndex].text;

        var size = data.get("party");
        done.querySelector("[data-out-party]").textContent = size === "1"
          ? "1 guest" : size + " guests";

        var area = form.querySelector('[name="room"]:checked');
        done.querySelector("[data-out-room]").textContent = area
          ? area.parentElement.textContent.trim() : "Main Dining Room";

        if (submit) { submit.disabled = false; submit.textContent = "Confirm Reservation"; }
        form.hidden = true;
        done.hidden = false;
        done.setAttribute("tabindex", "-1");
        done.focus();
        done.querySelector(".confirm__ref").scrollIntoView({
          block: "center", behavior: reduced() ? "auto" : "smooth"
        });
      }, 620);
    });

    var again = done.querySelector("[data-again]");
    if (again) {
      again.addEventListener("click", function () {
        done.hidden = true;
        form.hidden = false;
        form.reset();
        inputs.forEach(function (input) {
          var field = fieldOf(input);
          if (field) field.classList.remove("is-valid", "is-invalid");
          var out = messageFor(input);
          if (out) out.textContent = "";
        });
        form.querySelector('[name="name"]').focus();
      });
    }
  }

  /* -------------------------------------------------- 9. Today highlight (hours) */
  function initHours() {
    var table = document.querySelector("[data-hours]");
    if (!table) return;
    var days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    var today = days[new Date().getDay()];
    var row = table.querySelector('[data-day="' + today + '"]');
    if (row) {
      row.classList.add("is-today");
      var note = row.querySelector("[data-today-note]");
      if (note) note.textContent = " — today";
    }
  }

  /* -------------------------------------------------- boot */
  function boot() {
    initHeader();
    initYear();
    initWords();
    initReveals();
    initSplit();
    initTabs();
    initGallery();
    initBooking();
    initHours();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
