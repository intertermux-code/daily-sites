/* Signal — shared behaviour. Every block is guarded by element checks so the
   same file runs on all five pages. */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasIO = "IntersectionObserver" in window;

  /* ---------- Mobile index menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var navBar = document.querySelector(".nav-bar");

  if (menuBtn && navBar) {
    var navList = document.getElementById("primary-nav");

    var setMenu = function (open) {
      menuBtn.setAttribute("aria-expanded", String(open));
      navBar.classList.toggle("open", open);
    };

    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });

    if (navList) {
      navList.addEventListener("click", function (e) {
        if (e.target.closest("a")) setMenu(false);
      });

      navList.addEventListener("focusout", function () {
        window.setTimeout(function () {
          if (!navBar.contains(document.activeElement)) setMenu(false);
        }, 0);
      });
    }

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) setMenu(false);
    });
  }

  /* ---------- Signature motion 1 · Cursor Spotlight ---------- */
  var pointers = document.querySelectorAll("[data-spotlight]");

  if (pointers.length && !reduce.matches && window.matchMedia("(hover: hover)").matches) {
    pointers.forEach(function (el) {
      var rafId = null;
      var next = null;

      var paint = function () {
        rafId = null;
        if (!next) return;
        var rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((next.x - rect.left) / rect.width) * 100 + "%");
        el.style.setProperty("--my", ((next.y - rect.top) / rect.height) * 100 + "%");
        el.setAttribute("data-active", "true");
      };

      var host = el.parentElement || el;

      host.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        next = { x: e.clientX, y: e.clientY };
        if (rafId === null) rafId = requestAnimationFrame(paint);
      });

      host.addEventListener("pointerleave", function () {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        next = null;
        el.setAttribute("data-active", "false");
      });
    });
  }

  /* ---------- Signature motion 2 · Blur-Fade Ascend (80ms sibling stagger) ---------- */
  var revealables = document.querySelectorAll("[data-reveal]");

  if (revealables.length) {
    if (!hasIO || reduce.matches) {
      revealables.forEach(function (el) { el.classList.add("in"); });
    } else {
      var stagger = function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var parent = el.parentElement;
          var group = parent ? parent.children : [el];
          var i = Array.prototype.indexOf.call(group, el);
          el.style.setProperty("--d", (i > 0 ? i * 80 : 0) + "ms");
          el.classList.add("in");
          obs.unobserve(el);
        });
      };

      var io = new IntersectionObserver(stagger, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Meter bars ---------- */
  var meters = document.querySelectorAll(".meter");
  if (meters.length && hasIO && !reduce.matches) {
    var mio = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var bar = entry.target;
        bar.style.setProperty("--d", (Array.prototype.indexOf.call(bar.parentElement.children, bar) % 6) * 80 + "ms");
        bar.classList.add("in");
        obs.unobserve(bar);
      });
    }, { threshold: 0.4 });
    meters.forEach(function (m) { mio.observe(m); });
  } else {
    meters.forEach(function (m) { m.classList.add("in"); });
  }

  /* ---------- Article: reading progress + contents highlight ---------- */
  var progress = document.querySelector(".progress i");
  var prose = document.querySelector(".prose");

  if (progress && prose) {
    var ticking = false;
    var headings = [].slice.call(prose.querySelectorAll("h2[id]"));
    var tocLinks = document.querySelectorAll('.toc a[href^="#"]');

    var update = function () {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";

      if (!headings.length || !tocLinks.length) return;
      var mark = window.innerHeight * 0.28;
      var active = headings[0];
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top <= mark) active = headings[i];
      }
      [].forEach.call(tocLinks, function (a) {
        var on = active && a.getAttribute("href") === "#" + active.id;
        if (on) { a.setAttribute("aria-current", "true"); } else { a.removeAttribute("aria-current"); }
      });
    };

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Topics: filter chips ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var cards = document.querySelectorAll(".topic-card[data-groups]");

  if (chips.length && cards.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var want = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });

        cards.forEach(function (card) {
          var groups = (card.getAttribute("data-groups") || "").split(" ");
          var show = want === "all" || groups.indexOf(want) > -1;
          card.classList.toggle("is-hidden", !show);
        });

        var status = document.getElementById("filter-status");
        if (status) {
          var visible = [].filter.call(cards, function (c) { return !c.classList.contains("is-hidden"); }).length;
          status.textContent = "Showing " + visible + " of " + cards.length + " topic modules" +
            (want === "all" ? "." : " in “" + chip.textContent.replace(/\d+$/, "").trim() + "”.");
        }
      });
    });
  }

  /* ---------- Subscribe: validation + success state ---------- */
  var form = document.getElementById("subscribe-form");

  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var status = document.getElementById("form-status");

    var markField = function (input, ok, msg) {
      var field = input.closest(".field");
      if (!field) return ok;
      field.classList.toggle("invalid", !ok);
      var err = field.querySelector(".error-msg");
      if (err && msg) err.textContent = msg;
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    };

    var validateEmail = function (input) {
      var value = input.value.trim();
      if (!value) return markField(input, false, "Enter the address you want the briefing sent to.");
      if (!emailRe.test(value)) return markField(input, false, "That address looks incomplete — check for a domain and a dot.");
      return markField(input, true, "");
    };

    var validateName = function (input) {
      var value = input.value.trim();
      if (value.length < 2) return markField(input, false, "Tell us what to call you — at least two characters.");
      return markField(input, true, "");
    };

    var validateCadence = function () {
      var checked = form.querySelector('input[name="cadence"]:checked');
      var wrap = document.getElementById("cadence-field");
      if (wrap) wrap.classList.toggle("invalid", !checked);
      var note = document.getElementById("cadence-error");
      if (note) note.style.display = checked ? "none" : "block";
      return Boolean(checked);
    };

    var validateConsent = function (input) {
      var wrap = document.getElementById("consent-field");
      if (wrap) wrap.classList.toggle("invalid", !input.checked);
      var note = document.getElementById("consent-error");
      if (note) note.style.display = input.checked ? "none" : "block";
      return input.checked;
    };

    var email = form.querySelector('#email');
    var name = form.querySelector('#name');
    var consent = form.querySelector('#consent');

    if (email) {
      email.addEventListener("blur", function () { validateEmail(email); });
      email.addEventListener("input", function () {
        if (email.closest(".field").classList.contains("invalid")) validateEmail(email);
      });
    }
    if (name) {
      name.addEventListener("blur", function () { validateName(name); });
      name.addEventListener("input", function () {
        if (name.closest(".field").classList.contains("invalid")) validateName(name);
      });
    }
    if (consent) {
      consent.addEventListener("change", function () { validateConsent(consent); });
    }
    form.querySelectorAll('input[name="cadence"]').forEach(function (r) {
      r.addEventListener("change", validateCadence);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var checks = [];
      if (name) checks.push({ ok: validateName(name), el: name });
      if (email) checks.push({ ok: validateEmail(email), el: email });
      checks.push({ ok: validateCadence(), el: form.querySelector('input[name="cadence"]') });
      if (consent) checks.push({ ok: validateConsent(consent), el: consent });

      var bad = checks.filter(function (c) { return !c.ok; });
      if (bad.length) {
        if (status) {
          status.hidden = false;
          status.textContent = "";
          var alert = document.createElement("p");
          alert.setAttribute("role", "alert");
          alert.className = "error-msg";
          alert.style.display = "block";
          alert.textContent = bad.length + (bad.length === 1 ? " field needs" : " fields need") +
            " your attention before we can send the briefing.";
          status.appendChild(alert);
        }
        bad[0].el.focus();
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Signing you up…"; }

      window.setTimeout(function () {
        var addr = email ? email.value.trim() : "your inbox";
        form.hidden = true;
        if (status) {
          status.hidden = false;
          status.textContent = "";
          var box = document.createElement("div");
          box.className = "success-box";
          box.setAttribute("tabindex", "-1");

          var h = document.createElement("h3");
          h.textContent = "Issue No. 215 is on its way to " + addr + ".";

          var p = document.createElement("p");
          p.textContent = "Confirm the double opt-in link in the mail we just sent — it expires in 48 hours. " +
            "Thursdays, 06:00 CET, from the desk that runs the latency probes.";

          box.appendChild(h);
          box.appendChild(p);
          status.appendChild(box);
          box.focus();
        }
      }, 620);
    });
  }

  /* ---------- Current year in footers that ask for it ---------- */
  var year = document.querySelectorAll("[data-year]");
  year.forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
