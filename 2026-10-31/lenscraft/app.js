/* ============================================================
   LENSCRAFT — shared behaviour
   Signature motion: Decode Text (hero) + Animated Counters (stats)
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile menu ---------- */
  function initMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("data-open", String(open));
      document.body.classList.toggle("is-locked", open);
    }

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

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) setOpen(false);
    });
  }

  /* ---------- primary motion 1: decode text ---------- */
  var GLYPHS = "▚▞█▓▒░/\\<>*#+=_·:;|ΩΔΣλφξ⌁⌂⌗0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function initDecode() {
    var nodes = document.querySelectorAll("[data-decode]");
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      var target = node.getAttribute("data-decode") || node.textContent.trim();
      if (reduce) {
        node.textContent = target;
        return;
      }
      node.textContent = "";
      node.setAttribute("aria-label", target);
      var span = document.createElement("span");
      span.setAttribute("aria-hidden", "true");
      node.appendChild(span);

      var start = null;
      var HOLD = 2600; // glyph churn window
      var SETTLE = 90; // ms per resolved character
      var TICK = 42;
      var acc = 0;
      var resolved = 0;

      node.setAttribute("data-decoding", "true");

      function frame(now) {
        if (start === null) start = now;
        var elapsed = now - start;
        acc += now - (frame.last || now);
        frame.last = now;

        if (elapsed > HOLD) {
          resolved = Math.min(target.length, Math.floor((elapsed - HOLD) / SETTLE) + 1);
        }

        var out = target.slice(0, resolved);
        for (var i = out.length; i < target.length; i++) {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        span.textContent = out;

        if (resolved >= target.length && acc > 0 && elapsed > HOLD + target.length * SETTLE + 120) {
          span.textContent = target;
          node.removeAttribute("data-decoding");
          node.removeAttribute("aria-label");
          return;
        }
        if (acc > 9000) {
          span.textContent = target;
          node.removeAttribute("data-decoding");
          node.removeAttribute("aria-label");
          return;
        }
        requestAnimationFrame(frame);
      }

      // slight delay so the page settles first
      window.setTimeout(function () {
        requestAnimationFrame(frame);
      }, 220);
    });
  }

  /* ---------- primary motion 2: animated counters ---------- */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function formatValue(value, decimals) {
    return value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (isNaN(target)) return;

    if (reduce) {
      el.textContent = formatValue(target, decimals);
      return;
    }

    var duration = 1200;
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / duration);
      el.textContent = formatValue(target * easeOutExpo(p), decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatValue(target, decimals);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    nodes.forEach(function (n) {
      var decimals = parseInt(n.getAttribute("data-decimals") || "0", 10);
      n.textContent = formatValue(0, decimals);
    });

    if (!("IntersectionObserver" in window) || reduce) {
      nodes.forEach(function (n) {
        n.textContent = formatValue(parseFloat(n.getAttribute("data-count")), parseInt(n.getAttribute("data-decimals") || "0", 10));
      });
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
      { threshold: 0.4, rootMargin: "0px 0px -5% 0px" }
    );
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- instrument bars (fill on view) ---------- */
  function initBars() {
    var bars = document.querySelectorAll("[data-bar]");
    if (!bars.length) return;
    function fill(el) {
      el.style.width = Math.max(0, Math.min(100, parseFloat(el.getAttribute("data-bar")))) + "%";
    }
    if (!("IntersectionObserver" in window)) {
      bars.forEach(fill);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          fill(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.5 }
    );
    bars.forEach(function (b) { io.observe(b); });
  }

  /* ---------- gallery: filters ---------- */
  function initFilters() {
    var board = document.getElementById("gallery-board");
    if (!board) return;
    var shots = Array.prototype.slice.call(board.querySelectorAll(".shot"));
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter"));
    var empty = document.getElementById("gallery-empty");
    var readout = document.getElementById("gallery-count");

    function apply(cat) {
      var shown = 0;
      shots.forEach(function (shot) {
        var match = cat === "all" || shot.getAttribute("data-category") === cat;
        shot.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      if (readout) readout.textContent = String(shown).padStart(2, "0");
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === cat));
      });
      visible = shots.filter(function (s) { return !s.hidden; });
    }

    var visible = shots.slice();
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-filter"));
      });
    });

    var initial = "all";
    if (window.location.hash) {
      var fromHash = window.location.hash.replace("#", "");
      if (["portraits", "ceremony", "details"].indexOf(fromHash) > -1) initial = fromHash;
    }
    apply(initial);

    /* ---------- gallery: lightbox ---------- */
    var box = document.getElementById("lightbox");
    if (!box) return;
    var img = box.querySelector(".lightbox__img");
    var titleEl = box.querySelector(".lightbox__title");
    var metaEl = box.querySelector(".lightbox__meta .mono");
    var indexEl = box.querySelector(".lightbox__index");
    var closeBtn = box.querySelector(".lightbox__close");
    var prevBtn = box.querySelector(".lightbox__nav.prev");
    var nextBtn = box.querySelector(".lightbox__nav.next");
    var current = 0;
    var lastFocus = null;

    function render() {
      var shot = visible[current];
      if (!shot) return;
      var node = shot.querySelector("img");
      var src = node.getAttribute("data-full") || node.currentSrc || node.src;
      img.setAttribute("src", src);
      img.setAttribute("alt", node.getAttribute("alt"));
      titleEl.textContent = shot.getAttribute("data-title") || "";
      metaEl.textContent = shot.getAttribute("data-meta") || "";
      indexEl.textContent = String(current + 1).padStart(2, "0") + " / " + String(visible.length).padStart(2, "0");
    }

    function open(shot) {
      lastFocus = document.activeElement;
      current = visible.indexOf(shot);
      if (current < 0) current = 0;
      render();
      box.setAttribute("data-open", "true");
      box.removeAttribute("aria-hidden");
      document.body.classList.add("is-locked");
      closeBtn.focus();
    }

    function close() {
      box.setAttribute("data-open", "false");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }

    function move(dir) {
      current = (current + dir + visible.length) % visible.length;
      render();
    }

    shots.forEach(function (shot) {
      var trigger = shot.querySelector(".shot__btn");
      if (trigger) trigger.addEventListener("click", function () { open(shot); });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { move(-1); });
    nextBtn.addEventListener("click", function () { move(1); });
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", function (e) {
      if (box.getAttribute("data-open") !== "true") return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "Tab") {
        var focusables = box.querySelectorAll("button");
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // touch swipe
    var x0 = null;
    box.addEventListener("touchstart", function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) move(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });
  }

  /* ---------- contact enquiry form ---------- */
  function initForm() {
    var form = document.getElementById("enquiry-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var message = form.querySelector("#c-message");
    var counter = document.getElementById("message-count");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fieldOf(input) {
      return input.closest(".field");
    }

    function setError(input, text) {
      var field = fieldOf(input);
      if (!field) return;
      var err = field.querySelector(".err");
      field.setAttribute("aria-invalid", text ? "true" : "false");
      if (err) err.textContent = text || "";
      input.setAttribute("aria-invalid", text ? "true" : "false");
    }

    function validate(input) {
      if (input.type === "checkbox") {
        if (input.hasAttribute("required") && !input.checked) {
          setError(input, "Please tick this to continue");
          return false;
        }
        setError(input, "");
        return true;
      }
      var value = (input.value || "").trim();
      if (input.hasAttribute("required") && !value) {
        setError(input, "Required — please add this detail");
        return false;
      }
      if (input.type === "email" && value && !emailRe.test(value)) {
        setError(input, "Check the format: name@studio.com");
        return false;
      }
      if (input.type === "tel" && value && value.replace(/\D/g, "").length < 9) {
        setError(input, "Number looks too short");
        return false;
      }
      if (input.id === "c-guests" && value && (isNaN(parseFloat(value)) || parseFloat(value) < 1)) {
        setError(input, "Enter a number of guests");
        return false;
      }
      setError(input, "");
      return true;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
    inputs.forEach(function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (fieldOf(input) && fieldOf(input).getAttribute("aria-invalid") === "true") validate(input);
      });
    });

    if (message && counter) {
      var update = function () {
        counter.textContent = String(message.value.length).padStart(3, "0") + " / 600 characters";
      };
      message.addEventListener("input", update);
      update();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = [];
      inputs.forEach(function (input) {
        if (!validate(input)) bad.push(input);
      });

      if (bad.length) {
        status.setAttribute("data-state", "bad");
        status.textContent = "Hold on — " + bad.length + " field" + (bad.length > 1 ? "s need" : " needs") + " attention before this can send.";
        bad[0].focus();
        return;
      }

      var submitBtn = form.querySelector("button[type=submit]");
      var label = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      window.setTimeout(function () {
        var name = (form.querySelector("#c-name") || {}).value || "there";
        var date = (form.querySelector("#c-date") || {}).value || "";
        var place = (form.querySelector("#c-place") || {}).value || "";
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = label;
        }
        status.setAttribute("data-state", "ok");
        status.textContent =
          "Enquiry logged · 2027 diary opened for " +
          String(name).trim().split(" ")[0] +
          (place ? " — " + place : "") +
          (date ? " on " + date : "") +
          ". A reply with full rates lands in your inbox within 24 hours.";
        form.reset();
        if (counter && message) counter.textContent = "000 / 600 characters";
      }, 900);
    });
  }

  /* ---------- newsletter (footer) ---------- */
  function initNewsletter() {
    document.querySelectorAll("[data-newsletter]").forEach(function (form) {
      var input = form.querySelector("input");
      var note = form.parentNode.querySelector(".form-note");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((input.value || "").trim());
        if (note) {
          note.textContent = ok
            ? "Added — one letter per season, no more."
            : "That address does not look right. Try again?";
        }
        if (ok) form.reset();
      });
    });
  }

  /* ---------- housekeeping ---------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initDecode();
    initCounters();
    initBars();
    initFilters();
    initForm();
    initNewsletter();
    initYear();
  });
})();
