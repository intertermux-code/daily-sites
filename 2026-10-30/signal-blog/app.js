/* ============================================================
   SIGNAL — shared behaviour
   All features are guarded by element-existence checks so one
   file can serve every page.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     1. Mobile navigation
     ---------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-nav-menu]");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("data-open", open ? "true" : "false");
    }

    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    var mq = window.matchMedia("(min-width: 720px)");
    var onChange = function (ev) { if (ev.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ----------------------------------------------------------
     2. Word-Stagger Headline  (primary motion)
     Each word rises 0.6em -> 0 with a 60ms stagger and a
     2deg -> 0 rotation settle.
     ---------------------------------------------------------- */
  function splitWords(el) {
    var words = (el.textContent || "").trim().split(/\s+/);
    el.textContent = "";
    el.classList.add("split");
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "w";
      span.style.setProperty("--i", i);
      span.textContent = word;
      el.appendChild(span);
      el.appendChild(document.createTextNode(" "));
    });
    return el;
  }

  /* Keeps <em> emphasis by splitting each element separately. */
  function initStagger() {
    var targets = Array.prototype.slice.call(document.querySelectorAll("[data-stagger]"));
    if (!targets.length) return;

    if (reduceMotion) {
      targets.forEach(function (el) { el.classList.add("split", "is-in"); });
      return;
    }

    targets.forEach(function (el) {
      var kids = Array.prototype.slice.call(el.childNodes).filter(function (n) {
        return n.nodeType === 1 && /^(EM|SPAN|I|B)$/.test(n.tagName) && !n.classList.contains("w");
      });
      if (kids.length && !el.querySelector(".w")) {
        /* Rebuild preserving inline emphasis elements as extra stagger units. */
        var parts = [];
        Array.prototype.forEach.call(el.childNodes, function (n) {
          if (n.nodeType === 3) {
            (n.textContent || "").trim().split(/\s+/).forEach(function (w) { if (w) parts.push({ text: w, el: null }); });
          } else if (n.nodeType === 1) {
            parts.push({ text: (n.textContent || "").trim(), el: n.cloneNode(true) });
          }
        });
        el.textContent = "";
        el.classList.add("split");
        parts.forEach(function (p, i) {
          var span = document.createElement("span");
          span.className = "w";
          span.style.setProperty("--i", i);
          if (p.el) { p.el.textContent = p.text; span.appendChild(p.el); }
          else { span.textContent = p.text; }
          el.appendChild(span);
          el.appendChild(document.createTextNode(" "));
        });
      } else {
        splitWords(el);
      }
    });

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     3. Decode Text (secondary motion)
     Cycles random glyphs, then resolves left to right, once.
     ---------------------------------------------------------- */
  var GLYPHS = "01<>{}[]/\\|=+*#$%&_~^ABCDEFXZ#@%&01";

  function initDecode() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-decode]"));
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      var finalText = node.getAttribute("data-decode") || node.textContent;
      node.setAttribute("aria-label", finalText);

      if (reduceMotion) {
        node.textContent = finalText;
        return;
      }

      node.textContent = "";
      var chars = finalText.split("");
      var spans = chars.map(function (c) {
        var s = document.createElement("span");
        s.textContent = c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        node.appendChild(s);
        return s;
      });
      node.classList.add("is-decoding");

      var resolved = 0;
      var tick = 0;
      var perChar = 3;      /* frames each glyph scrambles before locking */
      var frameMs = 34;

      function step() {
        tick += 1;
        for (var i = resolved; i < chars.length; i += 1) {
          if (i === resolved) {
            if (tick % perChar === 0) {
              spans[i].textContent = chars[i] === " " ? " " : chars[i];
              resolved += 1;
            } else if (chars[i] !== " ") {
              spans[i].textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
          }
        }
        if (resolved < chars.length) {
          window.setTimeout(step, frameMs);
        } else {
          node.classList.remove("is-decoding");
          node.textContent = finalText;
        }
      }

      window.setTimeout(step, 520);
    });
  }

  /* ----------------------------------------------------------
     4. Scroll reveal tied to the stagger rhythm
     ---------------------------------------------------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    if (reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    items.forEach(function (el, i) {
      if (!el.style.getPropertyValue("--i")) el.style.setProperty("--i", Math.min(i, 6));
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     5. Reading progress (article page)
     ---------------------------------------------------------- */
  function initProgress() {
    var bar = document.querySelector("[data-progress-bar]");
    if (!bar) return;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(Math.max(doc.scrollTop || window.scrollY || 0, 0) / max, 1) : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     6. Newsletter form validation (subscribe page)
     ---------------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function setError(field, message) {
    var input = field.querySelector("input, textarea, select");
    var box = field.querySelector(".field__error");
    if (!box) return;
    if (message) {
      box.textContent = message;
      box.setAttribute("data-show", "true");
      if (input) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", box.id); }
    } else {
      box.textContent = "";
      box.removeAttribute("data-show");
      if (input) { input.removeAttribute("aria-invalid"); }
    }
  }

  function validateField(field) {
    var input = field.querySelector("input, textarea, select");
    if (!input) return true;
    var value = (input.value || "").trim();

    if (input.hasAttribute("data-validate-required") && !value) {
      setError(field, "Please add " + (input.getAttribute("data-field-name") || "this") + " so we know where to send the issue.");
      return false;
    }
    if (input.type === "email" && value && !EMAIL_RE.test(value)) {
      setError(field, "That address looks incomplete. Try a form like you@domain.com.");
      return false;
    }
    if (input.hasAttribute("data-validate-name") && value && value.length < 2) {
      setError(field, "Please use at least two characters.");
      return false;
    }
    setError(field, "");
    return true;
  }

  function initSubscribeForm() {
    var form = document.querySelector("[data-subscribe-form]");
    if (!form) return;
    var status = form.querySelector("[data-form-status]");
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field"));

    fields.forEach(function (field) {
      var input = field.querySelector("input, textarea, select");
      if (!input) return;
      input.addEventListener("blur", function () {
        if (input.value.trim() || input.getAttribute("aria-invalid") === "true") validateField(field);
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var results = fields.map(validateField);
      var firstBad = results.indexOf(false);

      if (firstBad !== -1) {
        var bad = fields[firstBad].querySelector("input, textarea, select");
        if (status) {
          status.hidden = false;
          status.setAttribute("data-tone", "error");
          status.innerHTML = "<strong>One field needs you</strong>Check the highlighted field below, then send it again.";
        }
        if (bad) bad.focus();
        return;
      }

      var email = form.querySelector('input[type="email"]');
      var who = form.querySelector('[data-validate-name]');
      var name = who && who.value.trim() ? who.value.trim().split(/\s+/)[0] : "reader";

      if (status) {
        status.hidden = false;
        status.setAttribute("data-tone", "success");
        status.innerHTML = "<strong>You are on the list, " + escapeText(name) +
          "</strong>A confirmation is on its way to " + escapeText(email ? email.value.trim() : "your inbox") +
          ". Issue 214 lands Thursday at 06:00 UTC — the first one is on us.";
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      form.setAttribute("data-done", "true");
      var submit = form.querySelector('[type="submit"]');
      if (submit) { submit.disabled = true; submit.textContent = "Subscription recorded"; }
      form.querySelectorAll("input, textarea, select").forEach(function (el) { el.setAttribute("readonly", ""); });
    });
  }

  function escapeText(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ----------------------------------------------------------
     7. Contact / tip form (contact-style fields on other pages)
     ---------------------------------------------------------- */
  function initLightForm() {
    var form = document.querySelector("[data-light-form]");
    if (!form) return;
    var status = form.querySelector("[data-form-status]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!status) return;
      status.hidden = false;
      status.setAttribute("data-tone", "success");
      status.focus();
    });
  }

  /* ----------------------------------------------------------
     8. Topic filter (topics page)
     ---------------------------------------------------------- */
  function initTopicFilter() {
    var input = document.querySelector("[data-topic-filter]");
    if (!input) return;
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-topic-row]"));
    var empty = document.querySelector("[data-topic-empty]");
    var countEl = document.querySelector("[data-topic-count]");

    function apply() {
      var q = input.value.trim().toLowerCase();
      var visible = 0;
      rows.forEach(function (row) {
        var hay = (row.getAttribute("data-topic-row") + " " + row.textContent).toLowerCase();
        var hit = !q || hay.indexOf(q) !== -1;
        row.hidden = !hit;
        if (hit) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
      if (countEl) countEl.textContent = visible + (visible === 1 ? " topic" : " topics");
    }

    input.addEventListener("input", apply);
    apply();
  }

  /* ----------------------------------------------------------
     9. Live clock in the masthead ticker
     ---------------------------------------------------------- */
  function initClock() {
    var el = document.querySelector("[data-clock]");
    if (!el) return;
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function tick() {
      var d = new Date();
      el.textContent = "UTC " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
    }
    tick();
    window.setInterval(tick, 30000);
  }

  /* ----------------------------------------------------------
     10. Footer year
     ---------------------------------------------------------- */
  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (n) { n.textContent = y; });
  }

  function boot() {
    initNav();
    initStagger();
    initDecode();
    initReveal();
    initProgress();
    initSubscribeForm();
    initLightForm();
    initTopicFilter();
    initClock();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
