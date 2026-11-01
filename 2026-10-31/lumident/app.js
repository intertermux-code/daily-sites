/* ============================================================
   LumiDent — shared behaviour
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- scroll progress ---------- */

  var bar = document.querySelector(".scroll-progress");
  if (bar) {
    var queued = false;
    var paint = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + ratio + ")";
      queued = false;
    };
    var onScroll = function () {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(paint);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    paint();
  }

  /* ---------- header state ---------- */

  var header = document.querySelector(".site-header");
  if (header) {
    var toggle = header.querySelector(".nav-toggle");
    var nav = header.querySelector(".nav");

    var onHeaderScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    window.addEventListener("scroll", onHeaderScroll, { passive: true });
    onHeaderScroll();

    var closeNav = function () {
      header.classList.remove("is-open");
      document.documentElement.removeAttribute("data-nav-open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      }
    };

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = header.classList.toggle("is-open");
        document.documentElement.toggleAttribute("data-nav-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      });

      nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) closeNav();
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && header.classList.contains("is-open")) {
          closeNav();
          toggle.focus();
        }
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 860) closeNav();
      });
    }
  }

  /* ---------- cursor spotlight ---------- */

  if (!reduceMotion && finePointer) {
    document.querySelectorAll("[data-spotlight]").forEach(function (zone) {
      var pending = false;
      var x = 0;
      var y = 0;

      var apply = function () {
        zone.style.setProperty("--mx", x + "px");
        zone.style.setProperty("--my", y + "px");
        pending = false;
      };

      zone.addEventListener("pointermove", function (event) {
        var rect = zone.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        zone.classList.add("is-live");
        if (!pending) {
          pending = true;
          window.requestAnimationFrame(apply);
        }
      });

      zone.addEventListener("pointerleave", function () {
        zone.classList.remove("is-live");
      });
    });
  }

  /* ---------- ledger rows ---------- */

  document.addEventListener("click", function (event) {
    var head = event.target.closest(".ledger-head");
    if (head) {
      var row = head.closest(".ledger-row");
      if (!row) return;
      var open = row.classList.toggle("is-open");
      head.setAttribute("aria-expanded", String(open));
      return;
    }

    var faq = event.target.closest(".faq-q");
    if (faq) {
      var item = faq.closest(".faq-item");
      var isOpen = item.classList.toggle("is-open");
      faq.setAttribute("aria-expanded", String(isOpen));
    }
  });

  /* ---------- drawn rules on scroll ---------- */

  var rules = document.querySelectorAll("[data-rule]");
  if (rules.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      rules.forEach(function (rule) { rule.classList.add("is-drawn"); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-drawn");
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
      rules.forEach(function (rule) { observer.observe(rule); });
    }
  }

  /* ---------- footer year ---------- */

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  /* ---------- hero "next opening" ---------- */

  var opening = document.getElementById("next-opening");
  if (opening) {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var now = new Date();
    var cursor = new Date(now.getTime());
    var slots = ["8:00 am", "9:40 am", "11:20 am", "1:30 pm", "3:00 pm", "4:20 pm"];
    for (var i = 0; i < 8; i++) {
      var weekday = cursor.getDay();
      if (weekday !== 0 && !(weekday === 6 && cursor.getDate() > 7)) {
        opening.textContent = (cursor.toDateString() === now.toDateString() ? "Today" : days[weekday]) + ", " + slots[i % slots.length];
        break;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  /* ---------- before / after slider ---------- */

  document.querySelectorAll("[data-ba]").forEach(function (widget) {
    var frame = widget.querySelector(".ba-frame");
    var range = widget.querySelector(".ba-range");
    if (!frame || !range) return;

    var set = function (value) {
      frame.style.setProperty("--pos", value + "%");
      var readout = widget.querySelector("[data-ba-readout]");
      if (readout) readout.textContent = Math.round(value) + "% revealed";
    };

    range.addEventListener("input", function () { set(range.value); });
    set(range.value);
  });

  /* ---------- gallery case switcher ---------- */

  var caseTable = document.querySelector("[data-case-switch]");
  if (caseTable) {
    var activeClass = "is-open";
    caseTable.addEventListener("click", function (event) {
      var button = event.target.closest("[data-src]");
      if (!button) return;

      var data = button.dataset;
      document.querySelectorAll(".ba-frame img").forEach(function (img) {
        img.src = data.src;
        img.alt = data.alt;
      });

      var title = document.getElementById("case-title");
      if (title) title.textContent = data.title;
      var meta = document.getElementById("case-meta");
      if (meta) meta.textContent = data.meta;
      var note = document.getElementById("case-note");
      if (note) note.textContent = data.note;

      caseTable.querySelectorAll(".ledger-row").forEach(function (row) {
        var rowButton = row.querySelector(".ledger-head");
        var isActive = row.contains(button) && row.classList.contains(activeClass);
        row.classList.toggle(activeClass, isActive);
        if (rowButton) rowButton.setAttribute("aria-pressed", String(isActive));
      });

      var stage = document.getElementById("case-stage");
      if (stage && window.innerWidth < 1080) {
        stage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });
  }

  /* ---------- booking form ---------- */

  var form = document.querySelector("[data-booking-form]");
  if (!form) return;

  var confirmation = document.querySelector("[data-confirmation]");
  var status = document.querySelector("[data-form-status]");
  var dateInput = form.querySelector("#book-date");
  var emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  var today = new Date();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  if (dateInput) {
    dateInput.min = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
    dateInput.value = dateInput.min;
  }

  var showError = function (control, message) {
    var wrap = control.closest(".field") || control.closest(".slotwrap");
    if (!wrap) return;
    wrap.classList.add("has-error");
    var box = wrap.querySelector(".error");
    if (box) box.textContent = message;
    control.setAttribute("aria-invalid", "true");
  };

  var clearError = function (control) {
    var wrap = control.closest(".field") || control.closest(".slotwrap");
    if (!wrap) return;
    wrap.classList.remove("has-error");
    control.removeAttribute("aria-invalid");
  };

  var valueOf = function (name) {
    var node = form.elements[name];
    return node ? String(node.value || "").trim() : "";
  };

  var validators = {
    "book-service": function (v) { return v ? "" : "Choose the treatment you need."; },
    "book-date": function (v) {
      if (!v) return "Pick a date for your visit.";
      var picked = new Date(v + "T12:00:00");
      if (Number.isNaN(picked.getTime())) return "That date could not be read.";
      if (picked < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return "We cannot book in the past.";
      if (picked.getDay() === 0) return "We are closed on Sundays. Try Monday instead.";
      if (picked.getDay() === 6 && picked.getDate() > 14) return "Saturdays are first and second only this quarter.";
      return "";
    },
    "book-slot": function () {
      var checked = form.querySelector("input[name=\"book-slot\"]:checked");
      return checked ? "" : "Select a time slot.";
    },
    "book-name": function (v) {
      if (!v) return "We need a name for the chair.";
      return v.length >= 2 ? "" : "Please enter your full name.";
    },
    "book-email": function (v) {
      if (!v) return "An email address sends your confirmation.";
      return emailPattern.test(v) ? "" : "That email address looks incomplete.";
    },
    "book-phone": function (v) {
      if (!v) return "We call before we book, so we need a number.";
      var digits = v.replace(/\D/g, "");
      return digits.length >= 10 ? "" : "Enter a phone number with 10 digits.";
    },
    "book-consent": function () {
      return form.elements["book-consent"].checked ? "" : "Please confirm you agree to be contacted.";
    }
  };

  var validateField = function (name) {
    var control = form.elements[name];
    if (!control) return true;
    var check = validators[name];
    if (!check) return true;
    var message = check(valueOf(name));
    var target = name === "book-slot"
      ? form.querySelector("input[name=\"book-slot\"]")
      : control;
    if (!target) return true;
    if (message) {
      showError(target, message);
      return false;
    }
    clearError(target);
    return true;
  };

  var controlsFor = function (name) {
    var control = form.elements[name];
    if (!control) return [];
    if (control.tagName === "SELECT" || control.tagName === "INPUT" || control.tagName === "TEXTAREA") return [control];
    return Array.prototype.slice.call(control);
  };

  Object.keys(validators).forEach(function (name) {
    controlsFor(name).forEach(function (node) {
      var evt = node.type === "checkbox" || node.type === "radio" || node.tagName === "SELECT" ? "change" : "blur";
      node.addEventListener(evt, function () { validateField(name); });
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var names = Object.keys(validators);
    var firstBad = null;
    var ok = true;

    names.forEach(function (name) {
      var valid = validateField(name);
      if (!valid) {
        ok = false;
        if (!firstBad) firstBad = controlsFor(name)[0];
      }
    });

    if (!ok) {
      if (status) {
        status.textContent = "Two or three fields still need attention — they are marked in red above.";
        status.classList.add("is-error");
      }
      if (firstBad && firstBad.focus) firstBad.focus();
      return;
    }

    if (status) {
      status.textContent = "";
      status.classList.remove("is-error");
    }

    var picked = new Date(valueOf("book-date") + "T12:00:00");
    var slotNode = form.querySelector("input[name=\"book-slot\"]:checked");
    var labelFor = function (name) {
      var node = form.elements[name];
      if (!node) return "";
      if (node.tagName === "SELECT") {
        return node.options[node.selectedIndex] ? node.options[node.selectedIndex].textContent.trim() : "";
      }
      return node.value;
    };

    var ref = "LD-" + pad(picked.getDate()) + pad(picked.getMonth() + 1) + "-" +
      String(Math.floor(1000 + Math.random() * 8999));

    var fill = function (key, text) {
      var target = confirmation ? confirmation.querySelector("[data-receipt=\"" + key + "\"]") : null;
      if (target) target.textContent = text;
    };

    fill("reference", ref);
    fill("service", labelFor("book-service"));
    fill("clinician", labelFor("book-clinician") || "First available clinician");
    fill("when", dayNames[picked.getDay()] + " " + picked.getDate() + " " + monthNames[picked.getMonth()] + " · " + (slotNode ? slotNode.value : ""));
    fill("patient", valueOf("book-name"));
    fill("contact", valueOf("book-email") + " · " + valueOf("book-phone"));
    fill("notes", valueOf("book-notes") || "None — we will ask you in the chair.");
    fill("duration", form.elements["book-first"].checked
      ? "60 minutes, comprehensive exam with imaging"
      : "45 minutes, follow-up chair");

    form.hidden = true;
    if (confirmation) {
      confirmation.hidden = false;
      var heading = confirmation.querySelector("[data-confirm-focus]");
      if (heading) {
        heading.focus();
        heading.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    }
  });

  var reset = document.querySelector("[data-booking-reset]");
  if (reset) {
    reset.addEventListener("click", function () {
      form.reset();
      if (dateInput) dateInput.value = dateInput.min;
      form.hidden = false;
      if (confirmation) confirmation.hidden = true;
      form.querySelectorAll(".has-error").forEach(function (node) { node.classList.remove("has-error"); });
      form.querySelectorAll("[aria-invalid]").forEach(function (node) { node.removeAttribute("aria-invalid"); });
      var first = form.querySelector("#book-service");
      if (first) first.focus();
    });
  }
})();
