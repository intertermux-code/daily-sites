/* ==========================================================================
   Chapter & Verse — shared behaviour
   Signature motion: Animated Counters + Spring Accordion
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ---------- 1. Header: stuck state + mobile menu ---------- */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = $(".nav-toggle", header);
    var nav = $("#primary-nav");
    if (!toggle || !nav) return;

    var setOpen = function (open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      if (open) {
        var first = $(".nav-link", nav);
        if (first) first.focus();
      }
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    var mq = window.matchMedia("(min-width: 901px)");
    var mqHandler = function (e) {
      if (e.matches) setOpen(false);
    };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", mqHandler);
  }

  /* ---------- 2. Animated Counters (easeOutExpo, 1.2s, locale groups) ---------- */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function formatValue(value, decimals) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var duration = 1200;

    if (reduceMotion) {
      el.textContent = formatValue(target, decimals);
      return;
    }

    var start = null;
    var step = function (now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      el.textContent = formatValue(target * easeOutExpo(t), decimals);
      if (t < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = formatValue(target, decimals);
      }
    };
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = $$("[data-count]");
    if (!counters.length) return;

    counters.forEach(function (el) {
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      el.textContent = formatValue(0, decimals);
    });

    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4, rootMargin: "0px 0px -8% 0px" }
    );
    counters.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- 3. Gold rule sweeps on section entry ---------- */
  function initSweeps() {
    var rules = $$(".rule-sweep");
    if (!rules.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      rules.forEach(function (r) {
        r.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    rules.forEach(function (r) {
      io.observe(r);
    });
  }

  /* ---------- 4. Spring Accordion (one panel open at a time) ---------- */
  function initAccordions() {
    $$(".accordion, [data-accordion-group]").forEach(function (group) {
      var triggers = $$("[data-accordion-trigger], .accordion__trigger", group);
      if (!triggers.length) return;

      var closeAll = function (except) {
        triggers.forEach(function (t) {
          if (t === except) return;
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (!panel) return;
          t.setAttribute("aria-expanded", "false");
          panel.classList.remove("is-open");
        });
      };

      triggers.forEach(function (trigger) {
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        if (!panel) return;
        trigger.setAttribute("aria-expanded", trigger.getAttribute("aria-expanded") === "true" ? "true" : "false");

        trigger.addEventListener("click", function () {
          var open = trigger.getAttribute("aria-expanded") === "true";
          closeAll(trigger);
          trigger.setAttribute("aria-expanded", open ? "false" : "true");
          panel.classList.toggle("is-open", !open);
        });

        trigger.addEventListener("keydown", function (e) {
          var idx = triggers.indexOf(trigger);
          var next = -1;
          if (e.key === "ArrowDown") next = (idx + 1) % triggers.length;
          if (e.key === "ArrowUp") next = (idx - 1 + triggers.length) % triggers.length;
          if (e.key === "Home") next = 0;
          if (e.key === "End") next = triggers.length - 1;
          if (next > -1) {
            e.preventDefault();
            triggers[next].focus();
          }
        });
      });
    });
  }

  /* ---------- 5. Horizontal Diorama controls ---------- */
  function initDioramas() {
    $$(".diorama-wrap").forEach(function (wrap) {
      var track = $(".diorama", wrap);
      if (!track) return;

      var prev = $("[data-diorama='prev']", wrap);
      var next = $("[data-diorama='next']", wrap);
      var bar = $(".diorama-progress__bar", wrap);
      var cards = $$(".diorama-card", track);
      if (!cards.length) return;

      var stepSize = function () {
        var card = cards[0];
        var gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
        return card.getBoundingClientRect().width + gap;
      };

      var scrollBy = function (dir) {
        track.scrollBy({ left: dir * stepSize(), behavior: reduceMotion ? "auto" : "smooth" });
      };

      if (prev) prev.addEventListener("click", function () { scrollBy(-1); });
      if (next) next.addEventListener("click", function () { scrollBy(1); });

      var update = function () {
        if (!bar) return;
        var max = track.scrollWidth - track.clientWidth;
        var ratio = max > 0 ? track.scrollLeft / max : 0;
        var visible = Math.max(track.clientWidth / track.scrollWidth, 0.12);
        bar.style.width = (visible * 100).toFixed(2) + "%";
        bar.style.transform = "translateX(" + (ratio * (100 / visible - 100)).toFixed(2) + "%)";
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = max > 0 && track.scrollLeft >= max - 2;
      };

      var ticking = false;
      track.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          update();
          ticking = false;
        });
      }, { passive: true });
      window.addEventListener("resize", update);
      update();
    });
  }

  /* ---------- 6. Book shelf: genre filter + spine detail ---------- */
  function initShelf() {
    var shelf = $("#shelf");
    if (!shelf) return;

    var spines = $$(".spine", shelf);
    var rows = $$(".shelf-row", shelf);
    var buttons = $$("[data-genre-filter]");
    var readout = $("#shelf-count");
    var empty = $("#shelf-empty");
    var detail = $("#book-detail");

    var render = function (genre) {
      var shown = 0;
      spines.forEach(function (spine) {
        var match = genre === "all" || spine.getAttribute("data-genre") === genre;
        spine.hidden = !match;
        if (match) shown += 1;
      });

      rows.forEach(function (row) {
        var visible = $$(".spine", row).some(function (s) {
          return !s.hidden;
        });
        row.style.display = visible ? "" : "none";
      });

      if (readout) {
        readout.textContent = shown === 1
          ? shown + " title on the shelf"
          : shown + " titles on the shelf";
      }
      if (empty) empty.hidden = shown !== 0;
    };

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        render(btn.getAttribute("data-genre-filter"));
      });
    });

    var select = function (spine) {
      spines.forEach(function (s) {
        s.classList.toggle("is-selected", s === spine);
        s.setAttribute("aria-pressed", s === spine ? "true" : "false");
      });
      if (!detail) return;
      detail.querySelector("[data-detail='title']").textContent = spine.getAttribute("data-title");
      detail.querySelector("[data-detail='author']").textContent = spine.getAttribute("data-author");
      detail.querySelector("[data-detail='year']").textContent = spine.getAttribute("data-year");
      detail.querySelector("[data-detail='genre']").textContent = spine.getAttribute("data-genre-label");
      detail.querySelector("[data-detail='price']").textContent = spine.getAttribute("data-price");
      detail.querySelector("[data-detail='note']").textContent = spine.getAttribute("data-note");
      detail.querySelector("[data-detail='cover']").textContent = spine.getAttribute("data-title");
      detail.querySelector("[data-detail='cover']").style.setProperty("--detail-bg", spine.getAttribute("data-bg"));
      detail.hidden = false;
    };

    spines.forEach(function (spine) {
      spine.addEventListener("click", function () {
        select(spine);
        if (detail) {
          detail.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
        }
      });
    });

    render("all");
    if (spines.length) select(spines[0]);
  }

  /* ---------- 7. Form validation ---------- */
  function initForms() {
    $$("form[data-validate]").forEach(function (form) {
      var status = $(".form-status", form);
      var fields = $$("[data-required]", form);

      var setError = function (field, message) {
        var slot = $(".field-error", field);
        if (slot) slot.textContent = message || "";
        $$("input, select, textarea", field).forEach(function (input) {
          input.setAttribute("aria-invalid", message ? "true" : "false");
        });
      };

      var validateField = function (field) {
        var inputs = $$("input, select, textarea", field);
        if (!inputs.length) return true;
        var input = inputs[0];
        var kind = field.getAttribute("data-required");
        var value;

        if (input.type === "radio" || input.type === "checkbox") {
          var picked = field.querySelector("input:checked");
          value = picked ? picked.value : "";
        } else {
          value = input.value.trim();
        }

        if (!value) {
          setError(field, input.getAttribute("data-msg-missing") || "This field needs an answer.");
          return false;
        }
        if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
          setError(field, "That email address looks incomplete — check for a typo.");
          return false;
        }
        if (kind === "phone" && value.replace(/[^\d]/g, "").length < 7) {
          setError(field, "Enter at least 7 digits so we can reach you.");
          return false;
        }
        if (kind === "min10" && value.length < 10) {
          setError(field, "A few more words, please — 10 characters minimum.");
          return false;
        }
        setError(field, "");
        return true;
      };

      fields.forEach(function (field) {
        $$("input, select, textarea", field).forEach(function (input) {
          input.addEventListener("blur", function () {
            validateField(field);
          });
          input.addEventListener("input", function () {
            if (input.getAttribute("aria-invalid") === "true") validateField(field);
          });
          input.addEventListener("change", function () {
            if (input.type === "radio" || input.type === "checkbox") validateField(field);
          });
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        var firstBad = null;
        fields.forEach(function (field) {
          if (!validateField(field)) {
            ok = false;
            if (!firstBad) firstBad = field;
          }
        });

        if (!ok) {
          if (status) {
            status.setAttribute("data-state", "error");
            status.textContent = "Almost there — a few answers need attention before we can save your place.";
          }
          if (firstBad) {
            var bad = $("input, select, textarea", firstBad);
            if (bad) bad.focus();
          }
          return;
        }

        var name = form.querySelector('[name="name"]');
        var greeting = name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : "friend";
        if (status) {
          status.setAttribute("data-state", "ok");
          status.textContent = "Welcome to the club, " + greeting + ". We held your seat — check your inbox for the first reading list.";
        }
        form.reset();
        fields.forEach(function (field) {
          setError(field, "");
        });
      });
    });
  }

  /* ---------- 8. Current year in footers ---------- */
  function initYear() {
    $$("[data-year-now]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function init() {
    initHeader();
    initCounters();
    initSweeps();
    initAccordions();
    initDioramas();
    initShelf();
    initForms();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
