/* ============================================================
   SIGNAL — shared behaviour
   Signature motion: Decode Text (hero keyword) + Parallax Layers
   Structural motion: Card Deck (stacked cards fan out on scroll)
   ============================================================ */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function (e) { reduced = e.matches; });
  }

  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

  /* ---------- Header: mobile menu + stuck shadow ---------- */
  function initHeader() {
    var masthead = document.querySelector(".masthead");
    if (!masthead) return;

    var toggle = masthead.querySelector(".menu-toggle");
    var list = masthead.querySelector(".nav-list");

    if (toggle && list) {
      toggle.addEventListener("click", function () {
        var open = masthead.classList.toggle("nav--open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && masthead.classList.contains("nav--open")) {
          masthead.classList.remove("nav--open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });

      list.addEventListener("click", function (e) {
        if (e.target.closest("a") && masthead.classList.contains("nav--open")) {
          masthead.classList.remove("nav--open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth >= 900 && masthead.classList.contains("nav--open")) {
          masthead.classList.remove("nav--open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    var sentinel = document.querySelector(".dateline");
    if (sentinel && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          masthead.classList.toggle("is-stuck", !entry.isIntersecting && entry.boundingClientRect.top < 0);
        });
      }, { threshold: 0 }).observe(sentinel);
    }
  }

  /* ---------- Signature motion 1: Decode Text ---------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>#*+=_%$&@~▚▞▓█".split("");

  function scrambleOnce(el, text) {
    if (reduced) { el.textContent = text; return; }
    var frame = 0;
    var resolveStep = 2.4;
    el.setAttribute("aria-label", text);

    function tick() {
      var revealed = Math.floor(frame / resolveStep);
      var out = "";
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (i < revealed || ch === " ") {
          out += ch;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      el.textContent = out;
      frame++;
      if (revealed <= text.length) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = text;
        el.classList.add("is-resolved");
      }
    }
    requestAnimationFrame(tick);
  }

  function initDecode() {
    var nodes = document.querySelectorAll("[data-decode]");
    if (!nodes.length) return;
    nodes.forEach(function (node) {
      var text = node.getAttribute("data-decode");
      node.textContent = text;
      if (!reduced) {
        node.textContent = text.replace(/\S/g, "•");
        window.setTimeout(function () { scrambleOnce(node, text); }, 420);
      }
    });
  }

  /* ---------- Signature motion 2: Parallax Layers ---------- */
  function initParallax() {
    var layers = [];
    document.querySelectorAll("[data-speed]").forEach(function (el) {
      layers.push({
        el: el,
        speed: parseFloat(el.getAttribute("data-speed")) || 0,
        limit: parseFloat(el.getAttribute("data-limit")) || 220
      });
    });
    if (!layers.length) return;

    var ticking = false;

    function apply() {
      ticking = false;
      if (reduced) return;
      var vh = window.innerHeight;
      var mid = vh / 2;
      var reads = layers.map(function (layer) {
        var r = layer.el.getBoundingClientRect();
        return { layer: layer, delta: (r.top + r.height / 2) - mid };
      });
      reads.forEach(function (item) {
        var y = clamp(item.delta * -item.layer.speed, -item.layer.limit, item.layer.limit);
        item.layer.el.style.transform = "translate3d(0," + y.toFixed(2) + "px,0)";
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
  }

  /* ---------- Structural motion: Card Deck fan-out ---------- */
  function initDecks() {
    var decks = document.querySelectorAll("[data-deck]");
    if (!decks.length) return;

    decks.forEach(function (deck) {
      var viewport = deck.querySelector(".deck__viewport");
      var cards = Array.prototype.slice.call(deck.querySelectorAll(".deck__card"));
      var bar = deck.querySelector(".deck__progress span");
      if (!viewport || !cards.length) return;

      var n = cards.length;
      var mid = (n - 1) / 2;
      var states = [];

      function layout() {
        var w = viewport.clientWidth;
        var cw = cards[0].offsetWidth;
        var ch = cards[0].offsetHeight;
        var wide = window.innerWidth >= 940;
        var available = w - 60;
        var spread = Math.min(cw * 0.86, n > 1 ? (available - cw) / (n - 1) : 0);
        var verticalSpread = ch + 24;

        if (!wide) {
          viewport.style.height = Math.max(ch + mid * 2 * verticalSpread + 96, 520) + "px";
        } else {
          viewport.style.height = "";
        }

        cards.forEach(function (card, i) {
          var o = i - mid;
          var stacked = {
            x: o * 16,
            y: (n - 1 - i) * 20 - 24,
            r: o * 3.4,
            s: 0.9
          };
          var fanned = wide
            ? { x: o * spread, y: o % 2 === 0 ? -12 : 12, r: o * 2.1, s: 1 }
            : { x: o * 9, y: o * verticalSpread, r: o * 1.1, s: 0.99 };
          states[i] = { el: card, stacked: stacked, fanned: fanned };
          card.style.zIndex = String(10 + i);
        });
      }

      var progress = -1;

      function draw(p) {
        if (p === progress) return;
        progress = p;
        states.forEach(function (st) {
          var x = st.stacked.x + (st.fanned.x - st.stacked.x) * p;
          var y = st.stacked.y + (st.fanned.y - st.stacked.y) * p;
          var r = st.stacked.r + (st.fanned.r - st.stacked.r) * p;
          var s = st.stacked.s + (st.fanned.s - st.stacked.s) * p;
          st.el.style.transform =
            "translate(-50%,-50%) translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0)" +
            " rotate(" + r.toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
        });
        if (bar) bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      }

      function measure() {
        var rect = viewport.getBoundingClientRect();
        var vh = window.innerHeight;
        var start = vh * 0.9;
        var span = rect.height + vh * 0.45;
        var p = clamp((start - rect.top) / span, 0, 1);
        if (reduced) p = 1;
        draw(p);
      }

      layout();
      measure();

      var resizeT;
      window.addEventListener("resize", function () {
        window.clearTimeout(resizeT);
        resizeT = window.setTimeout(function () {
          progress = -1;
          layout();
          measure();
        }, 140);
      });

      if (reduced) {
        draw(1);
        return;
      }

      var rafPending = false;
      window.addEventListener("scroll", function () {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          var rect = viewport.getBoundingClientRect();
          if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
          measure();
        });
      }, { passive: true });
    });
  }

  /* ---------- Article: reading progress, TOC, copy link ---------- */
  function initArticle() {
    var body = document.querySelector(".article-body");
    var bar = document.querySelector(".progress-bar span");

    if (bar) {
      var tick = false;
      var update = function () {
        tick = false;
        if (!body) return;
        var rect = body.getBoundingClientRect();
        var total = rect.height - window.innerHeight * 0.6;
        var done = clamp((-rect.top + window.innerHeight * 0.3) / (total || 1), 0, 1);
        bar.style.transform = "scaleX(" + done.toFixed(4) + ")";
      };
      window.addEventListener("scroll", function () {
        if (!tick) { tick = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }

    if (body) {
      var tocList = document.querySelector(".toc ol");
      var heads = body.querySelectorAll("h2[id], h3[id]");
      if (tocList && heads.length) {
        heads.forEach(function (h) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + h.id;
          a.textContent = h.textContent;
          li.appendChild(a);
          tocList.appendChild(li);
          if (h.tagName === "H3") {
            a.style.paddingLeft = "1rem";
            a.style.fontSize = "0.64rem";
          }
        });

        var links = tocList.querySelectorAll("a");
        var byId = {};
        links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

        if ("IntersectionObserver" in window && heads.length) {
          var current = null;
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              var link = byId[entry.target.id];
              if (!link || link === current) return;
              if (current) current.classList.remove("is-current");
              link.classList.add("is-current");
              current = link;
            });
          }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
          heads.forEach(function (h) { io.observe(h); });
          if (links[0]) { links[0].classList.add("is-current"); current = links[0]; }
        }
      }

      var copy = document.querySelector("[data-copy-link]");
      if (copy) {
        var label = copy.querySelector(".copy-label");
        copy.addEventListener("click", function () {
          var url = window.location.href;
          var done = function (ok) {
            if (label) label.textContent = ok ? "Link copied" : "Copy failed";
            window.setTimeout(function () {
              if (label) label.textContent = "Copy link";
            }, 2400);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
          } else {
            done(false);
          }
        });
      }
    }
  }

  /* ---------- Topics: beat filter + search ---------- */
  function initTopics() {
    var grid = document.querySelector("[data-topic-grid]");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".topic-card"));
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var search = document.querySelector("[data-topic-search]");
    var readout = document.querySelector("[data-topic-readout]");
    var active = "all";

    function apply() {
      var q = search && search.value ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (card) {
        var beat = card.getAttribute("data-beat") || "all";
        var text = (card.textContent || "").toLowerCase();
        var beatOk = active === "all" || beat === active;
        var queryOk = !q || text.indexOf(q) !== -1;
        var visible = beatOk && queryOk;
        card.hidden = !visible;
        if (visible) shown++;
      });
      if (readout) {
        readout.textContent = shown === 1 ? "1 desk showing" : shown + " desks showing";
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        active = chip.getAttribute("data-filter");
        apply();
      });
    });

    if (search) {
      var t;
      search.addEventListener("input", function () {
        window.clearTimeout(t);
        t = window.setTimeout(apply, 130);
      });
    }

    document.addEventListener("click", function (e) {
      var jump = e.target.closest("[data-jump]");
      if (!jump) return;
      var letter = jump.getAttribute("data-jump");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      var all = document.querySelector('[data-filter="all"]');
      if (all) all.setAttribute("aria-pressed", "true");
      active = "all";
      if (search) search.value = "";
      cards.forEach(function (card) {
        card.hidden = (card.getAttribute("data-letter") || "") !== letter;
      });
      var shownCount = cards.filter(function (c) { return !c.hidden; }).length;
      if (readout) {
        readout.textContent = shownCount ? letter + " — " + shownCount + " desks" : "No desks under " + letter;
      }
      if (!shownCount) {
        cards.forEach(function (card) { card.hidden = false; });
        if (readout) readout.textContent = cards.length + " desks showing";
      }
      if (grid.scrollIntoView) grid.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });

    apply();
  }

  /* ---------- Forms: validation + success state ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function setError(field, message) {
    var box = field.querySelector(".field__error");
    var input = field.querySelector("input, textarea, select");
    field.classList.add("has-error");
    if (box) box.textContent = message;
    if (input) input.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    var input = field.querySelector("input, textarea, select");
    field.classList.remove("has-error");
    if (input) input.removeAttribute("aria-invalid");
  }

  function initForms() {
    var forms = document.querySelectorAll("form[data-validate]");
    if (!forms.length) return;

    forms.forEach(function (form) {
      var status = form.querySelector(".form-status");
      var fields = Array.prototype.slice.call(form.querySelectorAll(".field"));

      fields.forEach(function (field) {
        var input = field.querySelector("input, textarea, select");
        if (!input) return;
        input.addEventListener("blur", function () {
          if (field.classList.contains("has-error")) validateField(field);
        });
        input.addEventListener("input", function () {
          if (field.classList.contains("has-error")) validateField(field);
        });
      });

      function validateField(field) {
        var input = field.querySelector("input, textarea, select");
        if (!input) return true;
        var value = (input.value || "").trim();
        var required = field.hasAttribute("data-required");
        var kind = field.getAttribute("data-kind") || (input.type === "email" ? "email" : "text");

        if (!value && required) {
          setError(field, field.getAttribute("data-msg-required") || "This field is required.");
          return false;
        }
        if (!value) { clearError(field); return true; }
        if (kind === "email" && !EMAIL_RE.test(value)) {
          setError(field, field.getAttribute("data-msg-format") || "Enter a valid address, name@domain.com.");
          return false;
        }
        if (kind === "name" && value.length < 2) {
          setError(field, "Please give us a name to write you.");
          return false;
        }
        if (kind === "message" && value.length < 12) {
          setError(field, "Tell us a little more — at least 12 characters.");
          return false;
        }
        clearError(field);
        return true;
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstBad = null;
        var ok = true;

        fields.forEach(function (field) {
          var valid = validateField(field);
          if (!valid && !firstBad) firstBad = field;
          ok = ok && valid;
        });

        if (form.hasAttribute("data-need-terms")) {
          var terms = form.querySelector('input[name="terms"]');
          var termsField = form.querySelector("[data-terms-field]");
          if (terms && !terms.checked && termsField) {
            ok = false;
            setError(termsField, "Tick the box so we know you want these emails.");
            if (!firstBad) firstBad = termsField;
          } else if (termsField) {
            clearError(termsField);
          }
        }

        if (form.hasAttribute("data-need-topics")) {
          var picked = form.querySelectorAll('input[name="beats"]:checked').length;
          var topicField = form.querySelector("[data-topics-field]");
          if (!picked && topicField) {
            ok = false;
            setError(topicField, "Choose at least one desk to follow.");
            if (!firstBad) firstBad = topicField;
          } else if (topicField) {
            clearError(topicField);
          }
        }

        if (!ok) {
          if (status) status.classList.remove("is-visible");
          var focusTarget = firstBad && (firstBad.querySelector("input, textarea, select") || firstBad);
          if (focusTarget && focusTarget.focus) {
            focusTarget.setAttribute("tabindex", "-1");
            focusTarget.focus();
          }
          return;
        }

        var name = form.querySelector('input[name="firstName"]');
        var mail = form.querySelector('input[type="email"]');
        var who = name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : "friend";
        var addr = mail && mail.value.trim() ? mail.value.trim() : "your inbox";

        if (status) {
          var heading = status.querySelector("h3");
          var line = status.querySelector("p");
          if (heading) heading.textContent = "You're on the list, " + who + ".";
          if (line) line.textContent = "A confirmation wire just went out to " + addr +
            ". The next edition lands Thursday at 06:00 ET — reply to it any time and a human on the desk reads it.";
          status.classList.add("is-visible");
          status.setAttribute("tabindex", "-1");
          status.focus();
        }

        form.reset();
        form.querySelectorAll(".choice__opt.is-selected").forEach(function (el) {
          el.classList.remove("is-selected");
        });
        var firstChoice = form.querySelector(".choice__opt");
        if (firstChoice) firstChoice.classList.add("is-selected");
      });
    });
  }

  /* ---------- Radio plan cards ---------- */
  function initChoices() {
    var groups = document.querySelectorAll("[data-choice-group]");
    groups.forEach(function (group) {
      var opts = Array.prototype.slice.call(group.querySelectorAll(".choice__opt"));
      function sync() {
        opts.forEach(function (opt) {
          var input = opt.querySelector("input");
          opt.classList.toggle("is-selected", !!(input && input.checked));
        });
      }
      opts.forEach(function (opt) {
        var input = opt.querySelector("input");
        if (!input) return;
        input.addEventListener("change", sync);
        opt.addEventListener("click", function () {
          window.setTimeout(sync, 0);
        });
      });
      sync();
    });
  }

  /* ---------- Count-up figures (about page) ---------- */
  function initStats() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        if (reduced) { el.textContent = target.toLocaleString("en-US") + suffix; return; }
        var t0 = performance.now();
        var dur = 1100;
        function step(now) {
          var p = clamp((now - t0) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Math.round(target * eased);
          el.textContent = val.toLocaleString("en-US") + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });

    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Dateline year ---------- */
  function initYear() {
    var slots = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    slots.forEach(function (s) { s.textContent = y; });
  }

  function boot() {
    initHeader();
    initDecode();
    initParallax();
    initDecks();
    initArticle();
    initTopics();
    initForms();
    initChoices();
    initStats();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
