/* ==========================================================================
   SIGNAL — shared behaviour
   Signature motion: Scroll Progress (primary) + Spring Accordion (secondary)
   Every module is guarded by an element-existence check.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. Scroll progress ---------------------------------------- */
  function initScrollProgress() {
    var bar = document.querySelector("[data-scroll-progress]");
    if (!bar) return;

    var frame = 0;
    var last = -1;

    function measure() {
      frame = 0;
      var doc = document.documentElement;
      var visible = doc.scrollHeight - window.innerHeight;
      var top = window.pageYOffset || doc.scrollTop || 0;
      var ratio = visible > 0 ? Math.min(1, Math.max(0, top / visible)) : 0;
      if (ratio === last) return;
      last = ratio;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      bar.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    }

    function request() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    measure();
  }

  /* ---------- 2. Mobile navigation -------------------------------------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.setAttribute("data-open", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      setOpen(false);
      toggle.focus();
    });

    // Close the drawer once focus or navigation leaves the header.
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) setOpen(false);
    }, { passive: true });
  }

  /* ---------- 3. Spring accordion --------------------------------------- */
  function initAccordion() {
    var groups = document.querySelectorAll("[data-accordion]");
    if (!groups.length) return;

    groups.forEach(function (group) {
      var exclusive = group.getAttribute("data-accordion") !== "multi";
      var triggers = Array.prototype.slice.call(
        group.querySelectorAll(".accordion__trigger")
      );

      function closeAll(except) {
        triggers.forEach(function (trigger) {
          if (exclusive && trigger !== except) apply(trigger, false);
        });
      }

      function apply(trigger, open) {
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        if (!panel) return;
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        panel.setAttribute("data-open", open ? "true" : "false");
      }

      triggers.forEach(function (trigger, index) {
        apply(trigger, trigger.getAttribute("aria-expanded") === "true");

        trigger.addEventListener("click", function () {
          var willOpen = trigger.getAttribute("aria-expanded") !== "true";
          closeAll(trigger);
          apply(trigger, willOpen);
        });

        trigger.addEventListener("keydown", function (event) {
          var next = null;
          if (event.key === "ArrowDown") next = triggers[(index + 1) % triggers.length];
          else if (event.key === "ArrowUp") next = triggers[(index - 1 + triggers.length) % triggers.length];
          else if (event.key === "Home") next = triggers[0];
          else if (event.key === "End") next = triggers[triggers.length - 1];
          if (!next) return;
          event.preventDefault();
          next.focus();
        });
      });
    });
  }

  /* ---------- 4. Validation helpers ------------------------------------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  function setError(field, message) {
    var target = field.input || field.node;
    if (!target) return;
    if (field.error) {
      field.error.textContent = message;
      field.error.setAttribute("data-show", message ? "true" : "false");
    }
    if (message) target.setAttribute("aria-invalid", "true");
    else target.removeAttribute("aria-invalid");
  }

  function checkField(field) {
    var value = "";
    if (field.type === "group") {
      value = field.node ? field.node.querySelectorAll("input:checked").length : 0;
    } else if (field.input && field.input.type === "checkbox") {
      if (!field.input.checked) return field.message || "Tick this box before you continue.";
      return "";
    } else if (field.input) {
      value = field.input.value.trim();
    }

    switch (field.rule) {
      case "email":
        if (!value) return "Enter the email address we should send the edition to.";
        if (!EMAIL.test(value)) return "That does not look like an email address. Check for a missing @ or domain.";
        return "";
      case "required":
        if (!value) return field.message || "This field is required.";
        return "";
      case "min":
        if (String(value).length < field.min) return field.message || "Please give us at least " + field.min + " characters.";
        return "";
      case "count":
        if (value < field.min) return field.message || "Choose at least " + field.min + " beat to follow.";
        return "";
      default:
        return "";
    }
  }

  /* ---------- 5. Newsletter form ---------------------------------------- */
  function initSubscribeForm() {
    var form = document.getElementById("subscribe-form");
    if (!form) return;

    var summary = document.getElementById("form-error-summary");
    var summaryList = document.getElementById("form-error-list");
    var success = document.getElementById("form-success");
    var successName = document.getElementById("success-name");
    var successMail = document.getElementById("success-mail");

    var fields = [
      {
        key: "email",
        input: form.elements["email"],
        error: document.getElementById("email-error"),
        rule: "email",
        label: "Email address",
        message: "Enter the email address we should send the edition to."
      },
      {
        key: "name",
        input: form.elements["name"],
        error: document.getElementById("name-error"),
        rule: "min",
        min: 2,
        label: "Name",
        message: "Tell us what to call you — at least two characters."
      },
      {
        key: "beats",
        type: "group",
        node: form.querySelector("[data-beat-group]"),
        error: document.getElementById("beats-error"),
        rule: "count",
        min: 1,
        label: "Beats",
        message: "Choose at least one beat to follow."
      },
      {
        key: "cadence",
        input: form.elements["cadence"],
        error: document.getElementById("cadence-error"),
        rule: "required",
        label: "Delivery",
        message: "Pick how often you want the edition."
      },
      {
        key: "consent",
        input: form.elements["consent"],
        error: document.getElementById("consent-error"),
        rule: "checked",
        label: "Consent",
        message: "We need your consent before we can put you on the list."
      }
    ].filter(function (field) {
      return field.input || field.node;
    });

    function validateField(field) {
      var message = checkField(field);
      setError(field, message);
      return message;
    }

    function clearList(list) {
      while (list.firstChild) list.removeChild(list.firstChild);
    }

    function showSummary(messages) {
      if (!summary || !summaryList) return;
      clearList(summaryList);
      messages.forEach(function (item) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + item.field.key;
        a.textContent = item.text;
        li.appendChild(a);
        summaryList.appendChild(li);
      });
      summary.setAttribute("data-show", messages.length ? "true" : "false");
    }

    fields.forEach(function (field) {
      if (field.type === "group") {
        if (!field.node) return;
        field.node.addEventListener("change", function () {
          validateField(field);
        });
        return;
      }
      var input = field.input;
      if (input.type === "checkbox") {
        input.addEventListener("change", function () {
          validateField(field);
        });
        return;
      }
      input.addEventListener("blur", function () {
        input.dataset.touched = "true";
        validateField(field);
      });
      input.addEventListener("input", function () {
        if (input.dataset.touched === "true") validateField(field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var failures = [];

      fields.forEach(function (field) {
        if (field.input) field.input.dataset.touched = "true";
        var message = checkField(field);
        setError(field, message);
        if (message) failures.push({ field: field, text: message });
      });

      showSummary(failures);

      if (failures.length) {
        if (summary) {
          summary.setAttribute("tabindex", "-1");
          summary.focus();
        }
        if (failures[0].field.input) failures[0].field.input.focus();
        return;
      }

      if (summary) summary.setAttribute("data-show", "false");

      if (successName) {
        var full = (form.elements["name"] && form.elements["name"].value.trim()) || "there";
        successName.textContent = full.split(/\s+/)[0];
      }
      if (successMail) {
        successMail.textContent = form.elements["email"] ? form.elements["email"].value.trim() : "";
      }
      if (success) {
        success.setAttribute("data-show", "true");
        success.setAttribute("tabindex", "-1");
        success.focus();
        success.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
      }
      form.setAttribute("hidden", "");
    });
  }

  /* ---------- 6. Quick sign-up band ------------------------------------- */
  function initBandForm() {
    var form = document.getElementById("band-form");
    if (!form) return;

    var input = form.elements["band-email"];
    var error = document.getElementById("band-email-error");
    if (!input || !error) return;

    var field = { input: input, error: error, rule: "email" };

    input.addEventListener("blur", function () {
      setError(field, checkField(field));
    });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") setError(field, checkField(field));
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = checkField(field);
      setError(field, message);
      if (message) {
        input.focus();
        return;
      }
      var note = document.getElementById("band-note");
      if (note) {
        note.textContent = "Check your inbox — the next edition lands Thursday, 6 a.m.";
        note.setAttribute("data-show", "true");
      }
      form.reset();
    });
  }

  /* ---------- 7. Letterbox: current year in colophon -------------------- */
  function initColophon() {
    var nodes = document.querySelectorAll("[data-year]");
    if (!nodes.length) return;
    var year = String(new Date().getFullYear());
    nodes.forEach(function (node) { node.textContent = year; });
  }

  /* ---------- 8. Inline error paragraphs as live regions ---------------- */
  function initLiveErrors() {
    var nodes = document.querySelectorAll(".error");
    nodes.forEach(function (node) {
      if (!node.getAttribute("aria-live")) node.setAttribute("aria-live", "polite");
    });
  }

  function boot() {
    initScrollProgress();
    initNav();
    initAccordion();
    initLiveErrors();
    initSubscribeForm();
    initBandForm();
    initColophon();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
