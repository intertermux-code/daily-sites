/* ==========================================================================
   LumiDent Dental Studio — shared behaviour
   Signature motion: word-stagger headline + cursor spotlight (rAF-throttled,
   both disabled under prefers-reduced-motion).
   Supporting motion: animated counters + marquee ticker (CSS keyframes).
   Everything is guarded by element-existence checks so one file serves
   every page.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var numberFmt = function (decimals) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  /* ---------------------------------------------------------------- 1. Nav */
  function initNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav-toggle");
    if (!nav || !toggle) return;

    var list = nav.querySelector(".nav__list");

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    list.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !nav.classList.contains("is-open")) return;
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (event.target.closest(".nav")) return;
      setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 950) setOpen(false);
    });
  }

  /* ------------------------------------------------------- 2. Sticky header */
  function initStickyHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------- 3. Animated counters (motion) */
  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (!isFinite(target)) return;
    var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var fmt = numberFmt(decimals);

    if (reduceMotion) {
      el.textContent = prefix + fmt.format(target) + suffix;
      return;
    }

    var duration = 1200;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var value = target * easeOutExpo(progress);
      el.textContent = prefix + fmt.format(value) + suffix;
      if (progress < 1) window.requestAnimationFrame(frame);
    }

    el.textContent = prefix + fmt.format(0) + suffix;
    window.requestAnimationFrame(frame);
  }

  function initCounters() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(runCounter);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -6% 0px" }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  /* ---------------------------------------------- 4. Before / after sliders */
  function initSliders() {
    var stages = document.querySelectorAll(".ba");
    if (!stages.length) return;

    stages.forEach(function (stage) {
      var range = stage.querySelector(".ba__range");
      var readout = stage.querySelector(".ba__percent");
      if (!range) return;

      function paint() {
        var value = Number(range.value);
        stage.style.setProperty("--pos", value + "%");
        if (readout) readout.textContent = value + "%";
      }

      range.addEventListener("input", paint);
      paint();
    });
  }

  /* ----------------------------------------------------- 5. Gallery filter */
  function initFilter() {
    var bar = document.getElementById("gallery-filters");
    if (!bar) return;

    var buttons = Array.prototype.slice.call(bar.querySelectorAll("button[data-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filtered]"));
    var status = document.getElementById("gallery-status");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var wanted = button.getAttribute("data-filter");
        var shown = 0;

        buttons.forEach(function (other) {
          other.setAttribute("aria-pressed", other === button ? "true" : "false");
        });

        cards.forEach(function (card) {
          var match = wanted === "all" || card.getAttribute("data-tag") === wanted;
          card.hidden = !match;
          if (match) shown += 1;
        });

        if (status) {
          status.textContent =
            wanted === "all"
              ? "Showing all " + shown + " cases."
              : shown === 1
                ? "Showing one " + wanted.toLowerCase() + " case."
                : "Showing " + shown + " " + wanted.toLowerCase() + " cases.";
        }
      });
    });
  }

  /* ---------------------------------------------------- 6. Form validation */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function fieldOf(input) {
    return input.closest(".field") || input.closest("fieldset");
  }

  function showError(input, message) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    var error = wrap.querySelector(".field__error");
    input.setAttribute("aria-invalid", "true");
    if (error) {
      error.textContent = message;
      error.classList.add("is-shown");
      if (input.id && error.id) {
        var described = (input.getAttribute("aria-describedby") || "")
          .split(" ")
          .filter(Boolean);
        if (described.indexOf(error.id) === -1) described.push(error.id);
        input.setAttribute("aria-describedby", described.join(" "));
      }
    }
  }

  function clearError(input) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    var error = wrap.querySelector(".field__error");
    input.removeAttribute("aria-invalid");
    if (error) {
      error.classList.remove("is-shown");
      error.textContent = "";
    }
  }

  function summarise(summary, results) {
    if (!summary) return;
    var list = summary.querySelector("ul");
    summary.hidden = results.length === 0;
    if (!list) return;
    list.textContent = "";
    results.forEach(function (item) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + item.id;
      a.textContent = item.message;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------- 7. Booking form */
  var SCHEDULE = {
    0: null,
    1: ["07:30", "18:00"],
    2: ["07:30", "18:00"],
    3: ["07:30", "18:00"],
    4: ["07:30", "18:00"],
    5: ["07:30", "15:30"],
    6: ["08:00", "14:00"]
  };

  function toMinutes(text) {
    var parts = text.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function fromMinutes(total) {
    var h = Math.floor(total / 60);
    var m = total % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function prettyTime(text) {
    var parts = text.split(":");
    var h = parseInt(parts[0], 10);
    var suffix = h >= 12 ? "pm" : "am";
    var hour = h % 12 === 0 ? 12 : h % 12;
    return hour + ":" + parts[1] + " " + suffix;
  }

  function isoToday() {
    var now = new Date();
    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")
    );
  }

  function buildSlots(dateInput, slotList) {
    if (!dateInput || !slotList) return;
    var value = dateInput.value;
    slotList.textContent = "";

    if (!value) {
      var empty = document.createElement("li");
      empty.className = "field__hint";
      empty.textContent = "Choose a date and we will show the appointments still open.";
      slotList.appendChild(empty);
      return;
    }

    var date = new Date(value + "T12:00:00");
    var window_ = SCHEDULE[date.getDay()];

    if (!window_) {
      var closed = document.createElement("li");
      closed.className = "field__hint";
      closed.textContent =
        "We are closed to routine appointments on Sundays, but our 24-hour emergency line stays open: (503) 555-0142.";
      slotList.appendChild(closed);
      return;
    }

    var now = new Date();
    var isToday = value === isoToday();
    var minutes = toMinutes(window_[0]);
    var last = toMinutes(window_[1]);
    var index = 0;

    for (; minutes <= last; minutes += 30) {
      var open = !(isToday && minutes <= now.getHours() * 60 + now.getMinutes() + 60);
      var id = "slot-" + index;
      var li = document.createElement("li");
      li.className = "slot";

      var input = document.createElement("input");
      input.type = "radio";
      input.name = "time";
      input.id = id;
      input.value = fromMinutes(minutes);
      input.disabled = !open;

      var label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = prettyTime(fromMinutes(minutes));

      li.appendChild(input);
      li.appendChild(label);
      slotList.appendChild(li);
      index += 1;
    }
  }

  function icsFor(data) {
    var stamp = data.date.replace(/-/g, "") + "T" + data.time.replace(":", "") + "00";
    var endMinutes = toMinutes(data.time) + 60;
    var end = data.date.replace(/-/g, "") + "T" + fromMinutes(endMinutes).replace(":", "") + "00";
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LumiDent Dental Studio//Appointment//EN",
      "BEGIN:VEVENT",
      "UID:" + data.ref + "@lumident.example",
      "DTSTAMP:" + stamp,
      "DTSTART:" + stamp,
      "DTEND:" + end,
      "SUMMARY:" + data.service + " at LumiDent Dental Studio",
      "DESCRIPTION:Reference " + data.ref + ". Please arrive 10 minutes early.",
      "LOCATION:418 Riverbend Walk\\, Portland\\, OR 97209",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  }

  function initBooking() {
    var form = document.getElementById("booking-form");
    if (!form) return;

    var dateInput = form.querySelector("#booking-date");
    var slotList = document.getElementById("slot-list");
    var summary = document.getElementById("booking-errors");
    var panel = document.getElementById("booking-panel");
    var confirm = document.getElementById("booking-confirm");
    var calendarIcs = "";
    var slotHint = document.getElementById("slot-help");

    if (dateInput) {
      dateInput.min = isoToday();
      var horizon = new Date();
      horizon.setDate(horizon.getDate() + 150);
      dateInput.max = horizon.toISOString().slice(0, 10);
    }

    buildSlots(dateInput, slotList);

    if (dateInput) {
      dateInput.addEventListener("change", function () {
        clearError(dateInput);
        buildSlots(dateInput, slotList);
        var first = slotList && slotList.querySelector("input:not([disabled])");
        if (first && slotHint) slotHint.textContent = "Times shown are Pacific (PT).";
      });
    }

    /* Pre-fill from ?service=…&dentist=… links used across the site */
    var params = new URLSearchParams(window.location.search);
    ["service", "dentist"].forEach(function (key) {
      var wanted = params.get(key);
      var select = form.querySelector("select[name=\"" + key + "\"]");
      if (!wanted || !select) return;
      var option = Array.prototype.find.call(select.options, function (item) {
        return item.value === wanted;
      });
      if (option) select.value = wanted;
    });

    function validate() {
      var results = [];
      var checks = [];

      function required(input, message) {
        checks.push({ input: input, message: message });
      }

      var service = form.querySelector("#booking-service");
      var name = form.querySelector("#booking-name");
      var email = form.querySelector("#booking-email");
      var phone = form.querySelector("#booking-phone");
      var consent = form.querySelector("#booking-consent");
      var time = form.querySelector("input[name=\"time\"]:not([disabled])");
      var chosen = form.querySelector("input[name=\"time\"]:checked");

      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), clearError);

      if (service && !service.value) {
        required(service, "Choose the treatment you would like to book.");
      }
      if (name && name.value.trim().length < 2) {
        required(name, "Enter your full name so we can check you in.");
      }
      if (email && !EMAIL.test(email.value.trim())) {
        required(email, "Enter a valid email address, for example you@example.com.");
      }
      if (phone && phone.value.replace(/\D/g, "").length < 10) {
        required(phone, "Enter a 10-digit phone number so we can confirm by text.");
      }
      if (dateInput && !dateInput.value) {
        required(dateInput, "Pick a preferred date.");
      } else if (dateInput) {
        var picked = new Date(dateInput.value + "T12:00:00");
        if (dateInput.value < isoToday()) {
          required(dateInput, "That date has passed — please choose today or later.");
        } else if (picked.getDay() === 0) {
          required(dateInput, "We are closed to routine appointments on Sundays.");
        }
      }
      if (time && !chosen) {
        showError(time, "Select an available appointment time, or pick another date.");
        results.push({ id: time.id, message: "Select an available appointment time." });
      }
      if (consent && !consent.checked) {
        required(consent, "Please confirm we may contact you about this appointment.");
      }

      results = results.concat(
        checks.map(function (item) {
          showError(item.input, item.message);
          return {
            id: item.input.id,
            message: item.message,
            input: item.input
          };
        })
      );

      summarise(summary, results);
      return results;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var problems = validate();

      if (problems.length) {
        if (summary && !summary.hidden) {
          summary.setAttribute("tabindex", "-1");
          summary.focus();
        }
        return;
      }
      var data = {
        service: form.querySelector("#booking-service"),
        dentist: form.querySelector("#booking-dentist"),
        name: form.querySelector("#booking-name"),
        email: form.querySelector("#booking-email"),
        phone: form.querySelector("#booking-phone"),
        date: dateInput,
        notes: form.querySelector("#booking-notes")
      };

      var serviceSelect = data.service;
      var dentistSelect = data.dentist;
      var chosenSlot = form.querySelector("input[name=\"time\"]:checked");
      var ref =
        "LD-" +
        new Date().getFullYear() +
        "-" +
        String(Math.floor(1000 + Math.random() * 8999));

      var payload = {
        service: serviceSelect.options[serviceSelect.selectedIndex].text,
        dentist: dentistSelect
          ? dentistSelect.options[dentistSelect.selectedIndex].text
          : "First available clinician",
        name: data.name.value.trim(),
        email: data.email.value.trim(),
        phone: data.phone.value.trim(),
        date: data.date.value,
        time: chosenSlot.value,
        notes: data.notes && data.notes.value.trim() ? data.notes.value.trim() : "—",
        ref: ref
      };

      var prettyDate = new Date(payload.date + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      function fill(id, text) {
        var node = document.getElementById(id);
        if (node) node.textContent = text;
      }

      fill("confirm-name", payload.name.split(" ")[0]);
      fill("confirm-service", payload.service);
      fill("confirm-dentist", payload.dentist);
      fill("confirm-when", prettyDate + " · " + prettyTime(payload.time) + " (PT)");
      fill("confirm-contact", payload.email + " · " + payload.phone);
      fill("confirm-notes", payload.notes);
      fill("confirm-ref", payload.ref);

      var calendar = document.getElementById("confirm-ics");
      if (calendar) {
        calendarIcs = icsFor(payload);
        calendar.dataset.filename = "lumident-" + payload.ref.toLowerCase() + ".ics";
        calendar.disabled = false;
        if (!calendar.dataset.wired) {
          calendar.dataset.wired = "1";
          calendar.addEventListener("click", function () {
            if (!calendarIcs) return;
            var blob = new Blob([calendarIcs], { type: "text/calendar;charset=utf-8" });
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = calendar.dataset.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
          });
        }
      }

      if (panel) panel.hidden = true;
      if (confirm) {
        confirm.hidden = false;
        var heading = confirm.querySelector("h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
        confirm.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      }

      var again = document.getElementById("booking-another");
      if (again) {
        again.addEventListener("click", function () {
          confirm.hidden = true;
          if (panel) panel.hidden = false;
          form.reset();
          buildSlots(dateInput, slotList);
          if (dateInput) dateInput.focus();
        });
      }
    });

    /* Validate on blur, clear as the patient fixes the field */
    form.addEventListener("blur", function (event) {
      var input = event.target;
      if (!input.matches("input, select, textarea")) return;
      if (input.name === "time") return;
      if (input.required || input.value) validate();
    });

    form.addEventListener("input", function (event) {
      var input = event.target;
      if (input.matches("input[type=\"radio\"]")) {
        clearError(input);
      }
      if (input.getAttribute("aria-invalid") === "true") clearError(input);
    });
  }

  /* ------------------------------------------------------ 8. Contact form */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var summary = document.getElementById("contact-errors");
    var success = document.getElementById("contact-success");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var results = [];
      var name = form.querySelector("#contact-name");
      var email = form.querySelector("#contact-email");
      var topic = form.querySelector("#contact-topic");
      var message = form.querySelector("#contact-message");
      var consent = form.querySelector("#contact-consent");

      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), clearError);

      [
        {
          input: name,
          ok: name.value.trim().length >= 2,
          message: "Tell us your name so we know who to reply to."
        },
        {
          input: email,
          ok: EMAIL.test(email.value.trim()),
          message: "Enter a valid email address so we can reply."
        },
        {
          input: topic,
          ok: Boolean(topic.value),
          message: "Choose a topic so your message reaches the right team."
        },
        {
          input: message,
          ok: message.value.trim().length >= 15,
          message: "Add a little more detail (at least 15 characters)."
        },
        {
          input: consent,
          ok: consent.checked,
          message: "Please confirm we may email you a reply."
        }
      ].forEach(function (rule) {
        if (rule.ok) return;
        showError(rule.input, rule.message);
        results.push({ id: rule.input.id, message: rule.message });
      });

      summarise(summary, results);

      if (results.length) {
        if (success) success.hidden = true;
        if (summary) {
          summary.setAttribute("tabindex", "-1");
          summary.focus();
        }
        return;
      }

      var first = name.value.trim().split(" ")[0];
      if (success) {
        var target = success.querySelector("[data-reply-name]");
        if (target) target.textContent = first;
        success.hidden = false;
        success.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
        var heading = success.querySelector("h3");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
      }
      form.reset();
    });

    form.addEventListener("input", function (event) {
      if (event.target.getAttribute("aria-invalid") === "true") clearError(event.target);
    });
  }

  /* ---------------------------------------------------- 9. Footer newsletter */
  function initNewsletter() {
    var forms = document.querySelectorAll(".news-form");
    if (!forms.length) return;

    Array.prototype.forEach.call(forms, function (form) {
      var input = form.querySelector("input[type=\"email\"]");
      var status = form.querySelector(".form-status");
      if (!input || !status) return;

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = input.value.trim();

        if (!EMAIL.test(value)) {
          status.hidden = false;
          status.dataset.state = "err";
          status.textContent = "That email does not look right — check it and try again.";
          input.setAttribute("aria-invalid", "true");
          input.focus();
          return;
        }

        status.hidden = false;
        status.dataset.state = "ok";
        status.textContent = "You are on the list. Smile notes arrive on the first Tuesday of each month.";
        form.reset();
        input.removeAttribute("aria-invalid");
      });

      input.addEventListener("input", function () {
        input.removeAttribute("aria-invalid");
        status.hidden = true;
        status.textContent = "";
      });
    });
  }

  /* ------------------------------------------- 10. Hours + footer niceties */
  function initHoursHighlight() {
    var rows = document.querySelectorAll("[data-day]");
    if (!rows.length) return;
    var names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    var today = names[new Date().getDay()];
    Array.prototype.forEach.call(rows, function (row) {
      if (row.getAttribute("data-day") === today) row.classList.add("is-today");
    });
  }

  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = year;
    });
  }

  /* ------------------------- 10a. Word-stagger headline (signature motion) */
  function wrapWords(root, bucket) {
    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(root.childNodes, function (child) {
      if (child.nodeType === 3) {
        child.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          var word = document.createElement("span");
          word.className = "w";
          word.textContent = part;
          bucket.push(word);
          frag.appendChild(word);
        });
        return;
      }
      if (child.nodeType === 1) {
        var clone = child.cloneNode(false);
        clone.appendChild(wrapWords(child, bucket));
        frag.appendChild(clone);
      }
    });
    return frag;
  }

  function initWordStagger() {
    var headline = document.querySelector(".hero h1, .page-hero h1");
    if (!headline || reduceMotion) return;

    var words = [];
    var rebuilt = wrapWords(headline, words);
    if (words.length < 2) return;

    headline.textContent = "";
    headline.appendChild(rebuilt);
    words.forEach(function (word, i) {
      word.style.setProperty("--wi", String(i));
    });
    headline.classList.add("is-staggered");
    requestAnimationFrame(function () {
      headline.classList.add("is-in");
    });
  }

  /* --------------------------- 10b. Cursor spotlight (signature motion) */
  function initSpotlight() {
    if (reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var panels = document.querySelectorAll(".hero, .page-hero");
    if (!panels.length) return;

    var frame = null;
    var target = null;

    function paint() {
      frame = null;
      if (!target) return;
      var box = target.el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      target.el.style.setProperty("--spot-x", (((target.x - box.left) / box.width) * 100).toFixed(2) + "%");
      target.el.style.setProperty("--spot-y", (((target.y - box.top) / box.height) * 100).toFixed(2) + "%");
    }

    Array.prototype.forEach.call(panels, function (el) {
      el.addEventListener("pointerenter", function () {
        el.classList.add("spot-on");
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("spot-on");
      });
      el.addEventListener("pointermove", function (event) {
        if (event.pointerType === "touch") return;
        target = { el: el, x: event.clientX, y: event.clientY };
        if (!frame) frame = requestAnimationFrame(paint);
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------- 11. Boot */
  function boot() {
    initNav();
    initStickyHeader();
    initCounters();
    initSliders();
    initFilter();
    initBooking();
    initContactForm();
    initNewsletter();
    initHoursHighlight();
    initWordStagger();
    initSpotlight();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
