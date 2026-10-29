/* ==========================================================================
   EMBER & OAK — shared behaviour
   Signature motion: Spring Accordion + Clip-Path Image Reveal
   Every module is guarded by element-existence checks so one file serves
   all pages.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var doc = document;
  doc.documentElement.classList.add("js");

  /* ------------------------------------------------------------------
     Header: condense on scroll
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = doc.querySelector(".site-header");
    if (!header) return;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle("is-scrolled", window.scrollY > 40);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     Mobile navigation drawer
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = doc.querySelector(".nav-toggle");
    var nav = doc.getElementById("site-nav");
    if (!toggle || !nav) return;
    var scrim = doc.querySelector(".scrim");

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      doc.body.classList.toggle("nav-locked", open);
      if (scrim) scrim.classList.toggle("is-on", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    if (scrim) scrim.addEventListener("click", function () { setOpen(false); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1020 && nav.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     Clip-path image reveal + line rise (IntersectionObserver)
     ------------------------------------------------------------------ */
  function initReveals() {
    var targets = doc.querySelectorAll(".reveal-clip, .rise");
    if (!targets.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    targets.forEach(function (el, i) {
      // Stagger siblings that enter together
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      if (sibs > 0 && sibs < 5) el.style.transitionDelay = (sibs * 90) + "ms";
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Spring accordion — one panel open at a time
     ------------------------------------------------------------------ */
  function initAccordions() {
    var groups = doc.querySelectorAll(".accordion");
    if (!groups.length) return;

    groups.forEach(function (group) {
      var items = group.querySelectorAll(".accordion__item");

      function closeAll(except) {
        items.forEach(function (item) {
          if (item === except) return;
          item.classList.remove("is-open");
          var btn = item.querySelector(".accordion__trigger");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
      }

      items.forEach(function (item) {
        var btn = item.querySelector(".accordion__trigger");
        var panelId = item.querySelector(".accordion__panel");
        if (!btn || !panelId) return;
        panelId.id = panelId.id || "panel-" + Math.random().toString(36).slice(2, 8);
        btn.setAttribute("aria-controls", panelId.id);

        btn.addEventListener("click", function () {
          var isOpen = item.classList.contains("is-open");
          closeAll(isOpen ? null : item);
          item.classList.toggle("is-open", !isOpen);
          btn.setAttribute("aria-expanded", String(!isOpen));
        });

        btn.addEventListener("keydown", function (e) {
          var list = Array.prototype.slice.call(items).map(function (it) {
            return it.querySelector(".accordion__trigger");
          });
          var idx = list.indexOf(btn);
          var next = -1;
          if (e.key === "ArrowDown") next = (idx + 1) % list.length;
          if (e.key === "ArrowUp") next = (idx - 1 + list.length) % list.length;
          if (e.key === "Home") next = 0;
          if (e.key === "End") next = list.length - 1;
          if (next > -1) { e.preventDefault(); list[next].focus(); }
        });
      });

      // Open the first panel so the section never reads as empty
      var preselect = group.querySelector(".accordion__item[data-open]");
      if (preselect) {
        preselect.classList.add("is-open");
        var b = preselect.querySelector(".accordion__trigger");
        if (b) b.setAttribute("aria-expanded", "true");
      }
    });
  }

  /* ------------------------------------------------------------------
     Menu tabs (starters / mains / desserts)
     ------------------------------------------------------------------ */
  function initTabs() {
    var tablist = doc.querySelector('[role="tablist"]');
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function select(tab, moveFocus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.setAttribute("tabindex", on ? "0" : "-1");
        var panel = doc.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (moveFocus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var idx = tabs.indexOf(tab);
        var next = -1;
        if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
        if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next > -1) { e.preventDefault(); select(tabs[next], true); }
      });
    });
    var current = tablist.querySelector('[aria-selected="true"]') || tabs[0];
    if (current) select(current, false);
  }

  /* ------------------------------------------------------------------
     Gallery lightbox
     ------------------------------------------------------------------ */
  function initLightbox() {
    var shots = doc.querySelectorAll(".shot");
    if (!shots.length) return;

    var box = doc.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Gallery viewer");
    box.innerHTML =
      '<div class="lightbox__bar">' +
        '<span class="lightbox__count"></span>' +
        '<button type="button" class="icon-btn lb-close" aria-label="Close gallery viewer">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="lightbox__stage"><img alt=""></div>' +
      '<div class="lightbox__nav" style="display:flex;align-items:center;justify-content:center;gap:1rem;padding-bottom:.5rem">' +
        '<button type="button" class="icon-btn lb-prev" aria-label="Previous image">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>' +
        '</button>' +
        '<button type="button" class="icon-btn lb-next" aria-label="Next image">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>' +
        '</button>' +
      '</div>' +
      '<p class="lightbox__foot"></p>';
    doc.body.appendChild(box);

    var img = box.querySelector(".lightbox__stage img");
    var count = box.querySelector(".lightbox__count");
    var caption = box.querySelector(".lightbox__foot");
    var prevBtn = box.querySelector(".lb-prev");
    var nextBtn = box.querySelector(".lb-next");
    var closeBtn = box.querySelector(".lb-close");
    var lastFocus = null;
    var index = 0;
    var list = Array.prototype.slice.call(shots);

    function render() {
      var shot = list[index];
      var src = shot.getAttribute("data-full") || shot.querySelector("img").currentSrc ||
                shot.querySelector("img").src;
      img.style.opacity = "0";
      img.onload = function () { img.style.opacity = "1"; };
      img.src = src;
      img.alt = shot.querySelector("img").alt;
      caption.textContent = shot.getAttribute("data-caption") || shot.querySelector("img").alt;
      count.textContent = "View " + (index + 1) + " of " + list.length;
    }

    function open(i) {
      index = i;
      lastFocus = doc.activeElement;
      render();
      box.classList.add("is-open");
      doc.body.style.overflow = "hidden";
      closeBtn.focus();
    }
    function close() {
      box.classList.remove("is-open");
      doc.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    function step(d) { index = (index + d + list.length) % list.length; render(); }

    list.forEach(function (shot, i) {
      shot.addEventListener("click", function (e) { e.preventDefault(); open(i); });
    });
    prevBtn.addEventListener("click", function () { step(-1); });
    nextBtn.addEventListener("click", function () { step(1); });
    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    doc.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "Tab") {
        var focusables = box.querySelectorAll("button");
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ------------------------------------------------------------------
     Reservation form — inline validation + confirmation state
     ------------------------------------------------------------------ */
  function initReservationForm() {
    var form = doc.getElementById("reservation-form");
    if (!form) return;

    var confirmWrap = doc.querySelector(".confirm");
    var status = doc.querySelector(".form-status");

    // Never allow a booking in the past, or on a night the fire is cold
    var dateInput = form.querySelector('[name="date"]');
    function iso(d) {
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    if (dateInput) {
      var seed = new Date(Date.now() + 86400000);
      while (seed.getDay() === 0 || seed.getDay() === 1) { seed.setDate(seed.getDate() + 1); }
      dateInput.min = iso(new Date());
      if (!dateInput.value) dateInput.value = iso(seed);
    }

    var rules = {
      name: function (v) {
        if (!v.trim()) return "Please tell us who the table is for.";
        if (v.trim().length < 2) return "That name looks too short — full name, please.";
        return "";
      },
      phone: function (v) {
        var digits = v.replace(/\D/g, "");
        if (!digits) return "We text a reminder, so we need a phone number.";
        if (digits.length < 10) return "Enter at least 10 digits so we can reach you.";
        if (/[^\d\s().+-]/.test(v)) return "Only digits, spaces and ( ) + - are allowed.";
        return "";
      },
      email: function (v) {
        if (!v.trim()) return "An email gives us a second way to confirm.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())) return "That email address isn’t complete — check for a typo.";
        return "";
      },
      date: function (v) {
        if (!v) return "Choose the evening you’d like to join us.";
        if (dateInput && v < dateInput.min) return "That date has already passed.";
        var p = v.split("-");
        var wd = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay();
        if (wd === 0 || wd === 1) return "We serve Tuesday through Saturday — try another night.";
        return "";
      },
      time: function (v) { return v ? "" : "Pick a seating time between 5 PM and 10 PM."; },
      party: function (v) { return v ? "" : "Select how many guests are dining."; }
    };

    function fieldOf(input) { return input.closest(".field"); }

    function validateInput(input, showValid) {
      var rule = rules[input.name];
      if (!rule) return true;
      var msg = rule(input.value);
      var field = fieldOf(input);
      var err = field ? field.querySelector(".error") : null;
      if (field) {
        field.classList.toggle("is-invalid", Boolean(msg));
        field.classList.toggle("is-valid", !msg && Boolean(input.value) && Boolean(showValid));
      }
      if (err) { (err.querySelector("span") || err).textContent = msg; }
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
    inputs.forEach(function (input) {
      if (!rules[input.name]) return;
      input.addEventListener("blur", function () { validateInput(input, true); });
      input.addEventListener("input", function () {
        var field = fieldOf(input);
        if (field && field.classList.contains("is-invalid")) validateInput(input, false);
      });
    });

    // Party-size choice pills
    var choices = form.querySelectorAll(".choice input");
    choices.forEach(function (radio) {
      radio.addEventListener("change", function () {
        form.querySelectorAll(".choice").forEach(function (c) {
          c.classList.toggle("is-selected", c.contains(radio) && radio.checked);
        });
        var party = form.querySelector('[name="party"]');
        if (party) validateInput(party, true);
      });
    });

    function pad(n) { return String(n).padStart(2, "0"); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = [];
      inputs.forEach(function (input) {
        if (rules[input.name] && !validateInput(input, true)) bad.push(input);
      });

      if (bad.length) {
        if (status) {
          status.textContent = bad.length === 1
            ? "One detail needs a fix before we can hold the table."
            : bad.length + " details need a fix before we can hold the table.";
          status.classList.add("is-error");
        }
        bad[0].focus();
        bad[0].scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
        return;
      }

      if (status) { status.classList.remove("is-error"); status.textContent = "Sending your request…"; }

      var data = {};
      inputs.forEach(function (i) { if (i.name) data[i.name] = i.value; });

      var pretty = "";
      if (data.date) {
        var parts = data.date.split("-");
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        pretty = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      }

      var code = "EO-" + pad(d2num(data.date)) + "-" + Math.floor(1000 + Math.random() * 9000);
      function d2num(s) {
        if (!s) return 1;
        var p = s.split("-");
        return Number(p[1]) * 100 + Number(p[2]);
      }

      var set = function (key, value) {
        var el = doc.querySelector('[data-confirm="' + key + '"]');
        if (el) el.textContent = value;
      };
      set("name", data.name || "Guest");
      set("date", pretty || data.date || "");
      set("time", data.time || "");
      set("party", data.party || "");
      set("phone", data.phone || "");
      set("code", code);

      window.setTimeout(function () {
        form.hidden = true;
        if (status) status.textContent = "";
        if (confirmWrap) {
          confirmWrap.classList.add("is-shown");
          requestAnimationFrame(function () { confirmWrap.classList.add("is-open"); });
          var heading = confirmWrap.querySelector("h2");
          if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
        }
      }, reduceMotion.matches ? 0 : 620);
    });

    var again = doc.querySelector("[data-reset-form]");
    if (again) {
      again.addEventListener("click", function () {
        if (confirmWrap) {
          confirmWrap.classList.remove("is-open");
          confirmWrap.classList.remove("is-shown");
        }
        form.hidden = false;
        form.reset();
        if (dateInput) {
          var seed = new Date(Date.now() + 86400000);
          while (seed.getDay() === 0 || seed.getDay() === 1) { seed.setDate(seed.getDate() + 1); }
          dateInput.value = iso(seed);
        }
        form.querySelectorAll(".field").forEach(function (f) {
          f.classList.remove("is-invalid", "is-valid");
        });
        var first = form.querySelector("input, select");
        if (first) first.focus();
      });
    }
  }

  /* ------------------------------------------------------------------
     Contact form (visit page) — same validation language, lighter
     ------------------------------------------------------------------ */
  function initContactForm() {
    var form = doc.getElementById("contact-form");
    if (!form) return;
    var note = doc.querySelector("[data-contact-note]");
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="cname"]');
      var email = form.querySelector('[name="cemail"]');
      var msg = form.querySelector('[name="cmessage"]');
      var fields = [
        { el: name, ok: name.value.trim().length > 1, text: "Please add your name." },
        { el: email, ok: emailRe.test(email.value.trim()), text: "Enter a complete email address." },
        { el: msg, ok: msg.value.trim().length > 9, text: "A sentence or two helps us route your note." }
      ];
      var invalid = fields.filter(function (f) { return !f.ok; });
      fields.forEach(function (f) {
        var field = f.el.closest(".field");
        if (field) field.classList.toggle("is-invalid", !f.ok);
        var err = field ? field.querySelector(".error") : null;
        if (err) { (err.querySelector("span") || err).textContent = f.text; }
        f.el.setAttribute("aria-invalid", f.ok ? "false" : "true");
      });
      if (invalid.length) {
        invalid[0].el.focus();
        if (note) { note.textContent = "Check the highlighted fields and send again."; note.style.color = "var(--error)"; }
        return;
      }
      if (note) {
        note.textContent = "Message received — “" + name.value.trim().split(" ")[0] + ", we reply within one working day.";
        note.style.color = "var(--ok)";
      }
      form.reset();
    });
  }

  /* ------------------------------------------------------------------
     Newsletter
     ------------------------------------------------------------------ */
  function initNewsletter() {
    var form = doc.getElementById("newsletter-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type=email]");
      var out = form.querySelector(".newsletter__note");
      if (!input || !out) return;
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim())) {
        out.className = "newsletter__note";
        out.style.color = "var(--error)";
        out.textContent = "That address looks incomplete — try again.";
        input.focus();
        return;
      }
      out.className = "newsletter__note newsletter__ok";
      out.style.color = "";
      out.textContent = "You’re on the list. Look for the Fire Note on the first Tuesday.";
      form.reset();
    });
  }

  /* ------------------------------------------------------------------
     Tonight highlight on the hours table
     ------------------------------------------------------------------ */
  function initTonight() {
    var table = doc.querySelector("[data-hours]");
    if (!table) return;
    var day = new Date().getDay(); // 0 Sun … 6 Sat
    var row = table.querySelector('[data-day="' + day + '"]');
    if (row) row.classList.add("is-today");
  }

  /* ------------------------------------------------------------------
     Choice pills that are plain buttons (seating preference)
     ------------------------------------------------------------------ */
  function initPills() {
    doc.querySelectorAll("[data-pill-group]").forEach(function (group) {
      var name = group.getAttribute("data-pill-group");
      group.querySelectorAll(".choice").forEach(function (pill) {
        pill.addEventListener("click", function () {
          group.querySelectorAll(".choice").forEach(function (p) {
            p.classList.toggle("is-selected", p === pill);
          });
          var hidden = doc.querySelector('[name="' + name + '"]');
          if (hidden) {
            hidden.value = pill.getAttribute("data-value") || pill.textContent.trim();
            hidden.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  function initYear() {
    doc.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    initHeader();
    initNav();
    initReveals();
    initAccordions();
    initTabs();
    initLightbox();
    initReservationForm();
    initContactForm();
    initNewsletter();
    initTonight();
    initPills();
    initYear();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
