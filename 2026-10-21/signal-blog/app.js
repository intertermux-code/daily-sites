/* ==========================================================================
   Signal — shared behaviour
   Signature motions: Spring Accordion, Word-Stagger Headline
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var doc = document;

  /* ---------------------------------------------------------------- nav --- */
  function initNav() {
    var nav = doc.querySelector("[data-nav]");
    if (!nav) return;
    var toggle = nav.querySelector("[data-nav-toggle]");
    var list = nav.querySelector("[data-nav-list]");
    if (!toggle || !list) return;

    function setOpen(open) {
      nav.setAttribute("data-open", String(open));
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close sections menu" : "Open sections menu");
      if (!open) return;
      var first = list.querySelector("a");
      if (first) first.focus({ preventScroll: false });
    }

    toggle.setAttribute("aria-expanded", nav.getAttribute("data-open") || "false");

    toggle.addEventListener("click", function () {
      setOpen(nav.getAttribute("data-open") !== "true");
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (nav.getAttribute("data-open") !== "true") return;
      setOpen(false);
      toggle.focus();
    });

    var mq = window.matchMedia("(min-width: 861px)");
    function syncWide(e) { if (e.matches) nav.setAttribute("data-open", "false"); }
    syncWide(mq);
    if (mq.addEventListener) mq.addEventListener("change", syncWide);
    else if (mq.addListener) mq.addListener(syncWide);
  }

  /* ------------------------------------------------- word-stagger headline -- */
  function initStagger() {
    var targets = doc.querySelectorAll("[data-stagger]");
    targets.forEach(function (el) {
      if (reduced.matches) {
        el.classList.add("is-ready");
        return;
      }
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach(function (word, i) {
        var span = doc.createElement("span");
        span.className = "stag";
        span.textContent = word;
        span.style.setProperty("--d", i * 60 + "ms");
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(doc.createTextNode(" "));
      });
      // Two frames so the transition has a starting state to leave.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add("is-ready"); });
      });
    });
  }

  /* ------------------------------------------- spring accordion (signature) - */
  function initAccordion() {
    doc.querySelectorAll("[data-accordion]").forEach(function (root) {
      var items = Array.prototype.slice.call(root.querySelectorAll(".acc__item"));
      if (!items.length) return;
      var exclusive = root.hasAttribute("data-accordion-exclusive");

      function buttonFor(item) { return item.querySelector("[data-acc-button]"); }

      function close(item) {
        item.classList.remove("is-open");
        buttonFor(item).setAttribute("aria-expanded", "false");
      }
      function open(item) {
        item.classList.add("is-open");
        buttonFor(item).setAttribute("aria-expanded", "true");
      }

      items.forEach(function (item, i) {
        var button = buttonFor(item);
        if (!button) return;
        if (item.classList.contains("is-open")) {
          button.setAttribute("aria-expanded", "true");
        } else {
          button.setAttribute("aria-expanded", "false");
        }
        button.addEventListener("click", function () {
          var isOpen = item.classList.contains("is-open");
          if (exclusive) items.forEach(function (other) { if (other !== item) close(other); });
          if (isOpen) close(item); else open(item);
        });

        button.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowDown") next = items[(i + 1) % items.length];
          else if (e.key === "ArrowUp") next = items[(i - 1 + items.length) % items.length];
          else if (e.key === "Home") next = items[0];
          else if (e.key === "End") next = items[items.length - 1];
          if (!next) return;
          e.preventDefault();
          buttonFor(next).focus();
        });
      });
    });
  }

  /* ------------------------------------------------- reading progress bar --- */
  function initProgress() {
    var bar = doc.querySelector("[data-progress]");
    if (!bar) return;
    var article = doc.querySelector("[data-progress-scope]") || doc.body;
    var ticking = false;

    function paint() {
      ticking = false;
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) { bar.style.transform = "scaleX(0)"; return; }
      var done = Math.min(Math.max(-rect.top / total, 0), 1);
      bar.style.transform = "scaleX(" + done.toFixed(4) + ")";
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    paint();
  }

  function renderStatus(box, tone, heading, lines) {
    if (!box) return;
    box.setAttribute("data-tone", tone);
    box.textContent = "";
    var h = doc.createElement("h3");
    h.textContent = heading;
    box.appendChild(h);
    lines.forEach(function (line) {
      if (typeof line === "string") {
        var p = doc.createElement("p");
        p.textContent = line;
        box.appendChild(p);
        return;
      }
      var el = doc.createElement(line.tag || "ul");
      line.items.forEach(function (entry) {
        var li = doc.createElement("li");
        if (typeof entry === "string") { li.textContent = entry; el.appendChild(li); return; }
        var b = doc.createElement("b");
        b.textContent = entry.label;
        li.appendChild(b);
        li.appendChild(doc.createTextNode(": " + entry.message));
        el.appendChild(li);
      });
      box.appendChild(el);
    });
    box.classList.add("is-visible");
    box.setAttribute("tabindex", "-1");
    box.focus();
  }

  /* ------------------------------------------------ subscribe form logic ---- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  function setError(field, message) {
    var wrap = field.closest(".field") || field.closest(".choice-group");
    if (!wrap) return;
    var box = wrap.querySelector(".field__error");
    wrap.classList.add("field--invalid");
    field.setAttribute("aria-invalid", "true");
    if (box && message) {
      box.textContent = message;
      if (!box.id) box.id = "err-" + (field.name || field.id);
      field.setAttribute("aria-describedby", box.id);
    }
  }

  function clearError(field) {
    var wrap = field.closest(".field") || field.closest(".choice-group");
    if (!wrap) return;
    wrap.classList.remove("field--invalid");
    field.removeAttribute("aria-invalid");
  }

  function setGroupError(group, message) {
    var box = group.querySelector(".field__error");
    if (message) {
      group.classList.add("field--invalid");
      if (box) { box.textContent = message; box.style.display = "block"; }
      return;
    }
    group.classList.remove("field--invalid");
    if (box) box.style.display = "";
  }

  function initForms() {
    var form = doc.querySelector("[data-signup-form]");
    if (form) {
      var status = form.querySelector("[data-form-status]");

      var validators = [
        {
          field: form.elements["fullname"],
          label: "Name",
          test: function (v) { return v.trim().length >= 2; },
          message: "Please enter the name you would like us to greet you with."
        },
        {
          field: form.elements["email"],
          label: "Email address",
          test: function (v) { return EMAIL_RE.test(v.trim()); },
          message: "That does not look like a valid address. Check for a typo — for example name@example.com."
        },
        {
          field: form.elements["timezone"],
          label: "Region",
          test: function (v) { return v !== ""; },
          message: "Choose a region so we can send the briefing at a civil hour."
        }
      ];

      validators.forEach(function (rule) {
        var f = rule.field;
        if (!f) return;
        f.addEventListener("input", function () { clearError(f); });
        f.addEventListener("change", function () { clearError(f); });
        f.addEventListener("blur", function () {
          if (f.value === "") return;
          if (!rule.test(f.value)) setError(f, rule.message); else clearError(f);
        });
      });

      var topicsGroup = form.querySelector("[data-topic-group]");
      var cadenceGroup = form.querySelector("[data-cadence-group]");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var problems = [];

        validators.forEach(function (rule) {
          if (!rule.field) return;
          if (!rule.test(rule.field.value)) {
            setError(rule.field, rule.message);
            problems.push({ label: rule.label, message: rule.message });
          } else {
            clearError(rule.field);
          }
        });

        function checkGroup(group, label, message, selector) {
          if (!group) return;
          var chosen = group.querySelectorAll(selector).length;
          var fail = chosen ? null : message;
          setGroupError(group, fail);
          if (fail) problems.push({ label: label, message: fail });
        }

        checkGroup(topicsGroup, "Desks", "Choose at least one desk so we know what to send you.", "input[name=\"topics\"]:checked");
        checkGroup(cadenceGroup, "Cadence", "Pick how often you want to hear from us.", "input[name=\"cadence\"]:checked");
        checkGroup(form.elements["consent"] ? form.elements["consent"].closest(".choice-group") : null,
          "Permission", "You need to confirm you want to receive the newsletter.", "input[name=\"consent\"]:checked");

        if (problems.length) {
          renderStatus(status, "error",
            "Almost there — " + problems.length + (problems.length === 1 ? " thing" : " things") + " to fix",
            [{ tag: "ul", items: problems }]);
          var firstBad = form.querySelector(".field--invalid .field__control, .field--invalid input");
          if (firstBad) firstBad.focus();
          return;
        }

        var name = (form.elements["fullname"].value || "").trim().split(/\s+/)[0] || "friend";
        var cadenceChoice = form.querySelector("input[name=\"cadence\"]:checked");
        var cadenceLabel = cadenceChoice ? cadenceChoice.value : "weekly";
        var tzChoice = form.elements["timezone"];
        var tzLabel = tzChoice && tzChoice.selectedIndex > 0 ? tzChoice.options[tzChoice.selectedIndex].text : "your region";
        var topicNames = Array.prototype.map.call(
          topicsGroup ? topicsGroup.querySelectorAll("input[name=\"topics\"]:checked") : [],
          function (i) {
            var b = i.parentNode.querySelector("b");
            return b ? b.textContent : i.value;
          }
        );

        renderStatus(status, "success", "You are on the list, " + name + ".", [
          "Your first " + cadenceLabel + " issue arrives Thursday, timed for " + tzLabel + ".",
          "We will lead with: " + topicNames.join(", ") + ". Reply to any issue and a real editor reads it — the desk is small and we answer.",
          "If nothing lands within an hour, check promotions and spam, then add news@signalmag.example to your contacts."
        ]);
        form.setAttribute("data-submitted", "true");
        Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
        var submitBtn = form.querySelector("[type=submit]");
        if (submitBtn) submitBtn.disabled = false;
      });
    }

    // Footer mini-form: single email field, inline confirmation.
    doc.querySelectorAll("[data-mini-form]").forEach(function (mini) {
      var input = mini.querySelector("input[type=email]");
      var note = mini.querySelector("[data-mini-note]");
      if (!input) return;
      mini.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!EMAIL_RE.test(input.value.trim())) {
          if (note) { note.textContent = "Enter a valid address, e.g. name@example.com"; note.style.color = "#f0a9a2"; }
          input.setAttribute("aria-invalid", "true");
          input.focus();
          return;
        }
        input.removeAttribute("aria-invalid");
        input.value = "";
        input.disabled = true;
        if (note) { note.textContent = "Subscribed. The Thursday briefing is on its way."; note.style.color = "#fff"; }
        var btn = mini.querySelector("button");
        if (btn) btn.disabled = true;
      });
    });

    // Contact / tips form on about page: light validation, success panel.
    var tips = doc.querySelector("[data-tips-form]");
    if (tips) {
      var tipsStatus = tips.querySelector("[data-form-status]");
      tips.addEventListener("submit", function (e) {
        e.preventDefault();
        var message = tips.elements["story"];
        var email = tips.elements["email"];
        var bad = [];
        if (!message || message.value.trim().length < 20) {
          if (message) setError(message, "Tell us a little more — at least 20 characters.");
          bad.push("Message");
        } else if (message) { clearError(message); }
        if (!email || !EMAIL_RE.test(email.value.trim())) {
          if (email) setError(email, "We need a way back to you. Check the address.");
          bad.push("Email");
        } else if (email) { clearError(email); }

        if (bad.length) {
          renderStatus(tipsStatus, "error",
            "We need " + bad.join(" and ").toLowerCase() + " before we can route your tip.", []);
          return;
        }
        renderStatus(tipsStatus, "success", "Tip received.", [
          "Something crossed the desk. An editor reads every submission within one business day.",
          "If you need stronger cover, use the secure channels listed below instead."
        ]);
        tips.reset();
      });
    }
  }

  /* ---------------------------------------------------- filterable topics --- */
  function initTopicFilter() {
    var search = doc.querySelector("[data-topic-search]");
    var list = doc.querySelector("[data-topic-list]");
    var counter = doc.querySelector("[data-topic-count]");
    if (!search || !list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll("[data-topic-item]"));
    var empty = list.querySelector("[data-topic-empty]");

    function apply() {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (item) {
        var hay = item.getAttribute("data-topic-item").toLowerCase();
        var hit = !q || hay.indexOf(q) !== -1;
        item.hidden = !hit;
        if (hit) shown++;
      });
      if (counter) counter.textContent = shown;
      if (empty) empty.hidden = shown !== 0;
    }
    search.addEventListener("input", apply);
    apply();
  }

  /* -------------------------------------------------------- dateline year --- */
  function initYear() {
    var now = new Date().getFullYear();
    doc.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = now; });
  }

  function boot() {
    initNav();
    initStagger();
    initAccordion();
    initProgress();
    initForms();
    initTopicFilter();
    initYear();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
