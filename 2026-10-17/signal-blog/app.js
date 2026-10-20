/* ============================================================
   SIGNAL — shared behaviour
   Motion signature: Cursor Spotlight + Clip-Path Image Reveal
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var links = document.getElementById("nav-links");
    if (!toggle || !links) return;

    var mq = window.matchMedia("(max-width: 900px)");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      if (open) { links.removeAttribute("hidden"); } else { links.setAttribute("hidden", ""); }
    }

    function syncMode() {
      if (mq.matches) { setOpen(false); } else { links.removeAttribute("hidden"); }
    }

    syncMode();
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    if (mq.addEventListener) mq.addEventListener("change", syncMode);
    else if (mq.addListener) mq.addListener(syncMode);
  }

  /* ---------- 2. Sticky nav shadow ---------- */
  function initStuckNav() {
    var bar = document.querySelector(".nav-bar");
    if (!bar) return;
    var sentinel = document.querySelector(".masthead-brand");
    if (!("IntersectionObserver" in window) || !sentinel) return;
    new IntersectionObserver(function (entries) {
      bar.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }

  /* ---------- 3. Clip-Path Image Reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-revealed");
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseInt(entry.target.getAttribute("data-reveal-delay") || "0", 10);
        window.setTimeout(function () {
          entry.target.classList.add("is-revealed");
        }, delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------- 4. Cursor Spotlight (rAF-throttled) ---------- */
  function initSpotlight() {
    var zones = document.querySelectorAll("[data-spotlight]");
    if (!zones.length || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    zones.forEach(function (zone) {
      var layer = zone.querySelector(".spotlight");
      if (!layer) return;

      var pending = false;
      var x = 0, y = 0;

      function paint() {
        pending = false;
        zone.style.setProperty("--spot-x", x + "px");
        zone.style.setProperty("--spot-y", y + "px");
      }

      zone.addEventListener("pointermove", function (e) {
        var rect = zone.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        layer.classList.add("is-on");
        if (!pending) {
          pending = true;
          window.requestAnimationFrame(paint);
        }
      }, { passive: true });

      zone.addEventListener("pointerleave", function () {
        layer.classList.remove("is-on");
      });

      zone.addEventListener("pointerenter", function () {
        layer.classList.add("is-on");
        if (!pending) { pending = true; window.requestAnimationFrame(paint); }
      });
    });
  }

  /* ---------- 5. Reading progress + TOC (article page) ---------- */
  function initArticle() {
    var bar = document.getElementById("reading-progress");
    var prose = document.querySelector(".prose");
    if (!prose) return;

    var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc-list a"));
    var heads = tocLinks
      .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
      .filter(Boolean);

    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = prose.getBoundingClientRect();

      if (bar) {
        var total = rect.height - window.innerHeight;
        var done = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        var pct = total > 0 ? done / total : 0;
        bar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
      }

      if (heads.length) {
        var line = window.innerHeight * 0.34;
        var current = null;
        for (var i = 0; i < heads.length; i++) {
          if (heads[i].getBoundingClientRect().top <= line) current = heads[i].id;
        }
        tocLinks.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + current;
          a.classList.toggle("is-active", on);
          if (on) { a.setAttribute("aria-current", "location"); }
          else { a.removeAttribute("aria-current"); }
        });
      }
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- 6. Copy-link button ---------- */
  function initCopyLink() {
    var btn = document.querySelector("[data-copy-link]");
    if (!btn) return;
    var original = btn.getAttribute("data-copy-label") || btn.textContent.trim();
    btn.addEventListener("click", function () {
      var url = window.location.href;
      var done = function () {
        btn.textContent = "Link copied";
        window.setTimeout(function () { btn.textContent = original; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { btn.textContent = "Press ⌘C to copy"; });
      } else {
        btn.textContent = "Press ⌘C to copy";
        window.setTimeout(function () { btn.textContent = original; }, 2200);
      }
    });
  }

  /* ---------- 7. Newsletter / form validation ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  function setError(input, message) {
    var id = input.id;
    var box = document.querySelector('[data-error-for="' + id + '"]');
    if (!box) return;
    box.textContent = message;
    box.classList.add("is-shown");
    input.setAttribute("aria-invalid", "true");
  }

  function clearError(input) {
    var box = document.querySelector('[data-error-for="' + input.id + '"]');
    if (box) { box.textContent = ""; box.classList.remove("is-shown"); }
    input.removeAttribute("aria-invalid");
  }

  function validateForm(form) {
    var problems = [];
    var ok = true;

    form.querySelectorAll("[data-required]").forEach(function (input) {
      var value = (input.value || "").trim();
      if (!value) {
        setError(input, input.getAttribute("data-msg-blank") || "This field is required.");
        ok = false;
        if (!problems.length) problems.push(input);
        return;
      }
      clearError(input);
    });

    form.querySelectorAll('[type="email"]').forEach(function (input) {
      var value = (input.value || "").trim();
      if (value && !EMAIL.test(value)) {
        setError(input, "Enter a complete email address, like you@work.com.");
        ok = false;
        if (!problems.length) problems.push(input);
        return;
      }
      if (value) clearError(input);
    });

    form.querySelectorAll("fieldset[data-required-group]").forEach(function (set) {
      var checked = set.querySelectorAll("input:checked").length;
      var box = document.querySelector('[data-error-for="' + set.id + '"]');
      if (!checked) {
        if (box) { box.textContent = set.getAttribute("data-msg-blank") || "Pick at least one."; box.classList.add("is-shown"); }
        ok = false;
        return;
      }
      if (box) { box.textContent = ""; box.classList.remove("is-shown"); }
    });

    form.querySelectorAll('input[type="checkbox"][data-required]').forEach(function (box) {
      if (!box.checked) {
        ok = false;
        setError(box, box.getAttribute("data-msg-blank") || "Please confirm to continue.");
        if (!problems.length) problems.push(box);
        return;
      }
      clearError(box);
    });

    if (problems.length) problems[0].focus();
    return ok;
  }

  function initForms() {
    document.querySelectorAll("form[data-validate]").forEach(function (form) {
      var status = document.getElementById(form.getAttribute("data-status") || "");

      form.querySelectorAll("[data-required], [type='email']").forEach(function (input) {
        input.addEventListener("input", function () {
          if (input.getAttribute("aria-invalid") === "true") validateOne(input, form);
        });
        input.addEventListener("blur", function () { validateOne(input, form); });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateForm(form)) {
          if (status) {
            status.className = "form-status is-shown";
            status.setAttribute("role", "alert");
            while (status.firstChild) status.removeChild(status.firstChild);
            var eh = document.createElement("h3");
            eh.textContent = "Check the highlighted fields";
            var ep = document.createElement("p");
            ep.textContent = "Signal needs a valid email address before we can add you to the wire.";
            status.appendChild(eh);
            status.appendChild(ep);
          }
          return;
        }

        var name = "";
        var first = form.querySelector('[id$="firstname"], [name="firstname"]');
        if (first) name = (first.value || "").trim().split(/\s+/)[0];

        var cadence = form.querySelector('input[type="radio"]:checked');
        var cadenceLabel = cadence
          ? (cadence.closest("label") ? cadence.closest("label").querySelector(".ct").textContent.trim() : cadence.value)
          : "Daily";

        if (status) {
          status.className = "form-status ok is-shown";
          status.setAttribute("role", "status");
          while (status.firstChild) status.removeChild(status.firstChild);

          var h = document.createElement("h3");
          h.textContent = "You're on the list" + (name ? ", " + name : "");
          status.appendChild(h);

          var p1 = document.createElement("p");
          var strong = document.createElement("strong");
          strong.textContent = cadenceLabel;
          p1.appendChild(strong);
          p1.appendChild(document.createTextNode(
            " edition confirmed. Look for the first issue in your inbox within the next hour — it lands at " +
            "6:14 a.m. Pacific, the same minute the tape opens."
          ));
          status.appendChild(p1);

          var p2 = document.createElement("p");
          p2.className = "dateline";
          p2.textContent = "A receipt is on its way to " + emailOf(form) + ".";
          status.appendChild(p2);

          form.reset();
          form.querySelectorAll(".error-msg").forEach(function (b) { b.classList.remove("is-shown"); b.textContent = ""; });
          form.querySelectorAll('[aria-invalid]').forEach(function (i) { i.removeAttribute("aria-invalid"); });
        }
      });
    });
  }

  function validateOne(input, form) {
    var value = (input.value || "").trim();
    if (input.hasAttribute("data-required") && !value) {
      setError(input, input.getAttribute("data-msg-blank") || "This field is required.");
      return false;
    }
    if (input.type === "email" && value && !EMAIL.test(value)) {
      setError(input, "Enter a complete email address, like you@work.com.");
      return false;
    }
    if (input.type === "checkbox" && input.hasAttribute("data-required") && !input.checked) {
      setError(input, input.getAttribute("data-msg-blank") || "Please confirm to continue.");
      return false;
    }
    clearError(input);
    return true;
  }

  function emailOf(form) {
    var e = form.querySelector('[type="email"]');
    return e && e.value ? e.value.trim() : "your inbox";
  }

  /* ---------- 8. Topic filter (topics.html) ---------- */
  function initTopicFilter() {
    var bar = document.querySelector("[data-filter-bar]");
    var list = document.querySelector("[data-topic-list]");
    if (!bar || !list) return;

    var buttons = bar.querySelectorAll("[data-filter]");
    var countEl = document.querySelector("[data-filter-count]");

    function apply(group) {
      var visible = 0;
      list.querySelectorAll(".topic-letter").forEach(function (letter) {
        var shown = 0;
        letter.querySelectorAll(".topic-row").forEach(function (row) {
          var show = group === "all" || row.getAttribute("data-group") === group;
          row.hidden = !show;
          if (show) { shown++; visible++; }
        });
        letter.hidden = shown === 0;
      });
      if (countEl) {
        countEl.textContent = visible + " beat" + (visible === 1 ? "" : "s") +
          (group === "all" ? " in the index" : " shown");
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        apply(btn.getAttribute("data-filter"));
      });
    });

    var pressed = bar.querySelector('[aria-pressed="true"]');
    apply(pressed ? pressed.getAttribute("data-filter") : "all");
  }

  /* ---------- 9. Dateline + year ---------- */
  function initDates() {
    var now = new Date();
    var fmt = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.querySelectorAll("[data-today]").forEach(function (el) { el.textContent = fmt; });
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(now.getFullYear()); });
  }

  /* ---------- boot ---------- */
  function boot() {
    initNav();
    initStuckNav();
    initReveal();
    initSpotlight();
    initArticle();
    initCopyLink();
    initForms();
    initTopicFilter();
    initDates();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
