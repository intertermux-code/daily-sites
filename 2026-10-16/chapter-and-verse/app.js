/* ============================================================
   Chapter & Verse — shared behaviour
   Sections: nav, accordion ledger, shelf spines, genre filter,
             calendar, forms. Every block is guarded by an
             element-existence check.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */
  var masthead = document.querySelector(".masthead");
  var navToggle = document.querySelector(".nav__toggle");

  if (masthead && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      masthead.classList.toggle("is-nav-open", !open);
    });

    masthead.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        navToggle.setAttribute("aria-expanded", "false");
        masthead.classList.remove("is-nav-open");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && masthead.classList.contains("is-nav-open")) {
        navToggle.setAttribute("aria-expanded", "false");
        masthead.classList.remove("is-nav-open");
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 940) {
        navToggle.setAttribute("aria-expanded", "false");
        masthead.classList.remove("is-nav-open");
      }
    });
  }

  /* ---------- Spring accordion: ledger rows ----------
     One panel open at a time inside each [data-accordion] group. */
  var groups = document.querySelectorAll("[data-accordion]");

  groups.forEach(function (group) {
    var rows = Array.prototype.slice.call(group.querySelectorAll(".row"));

    function closeAll(except) {
      rows.forEach(function (row) {
        if (row === except) return;
        var head = row.querySelector(".row__head");
        var panel = row.querySelector(".row__panel");
        if (head) head.setAttribute("aria-expanded", "false");
        if (panel) panel.classList.remove("is-open");
        row.classList.remove("is-open");
      });
    }

    rows.forEach(function (row) {
      var head = row.querySelector(".row__head");
      var panel = row.querySelector(".row__panel");
      if (!head || !panel) return;
      head.setAttribute("aria-expanded", head.getAttribute("aria-expanded") || "false");

      head.addEventListener("click", function () {
        var willOpen = head.getAttribute("aria-expanded") !== "true";
        closeAll(row);
        head.setAttribute("aria-expanded", String(willOpen));
        panel.classList.toggle("is-open", willOpen);
        row.classList.toggle("is-open", willOpen);
      });
    });

    if (group.dataset.accordionOpenFirst === "true" && rows[0]) {
      var firstHead = rows[0].querySelector(".row__head");
      var firstPanel = rows[0].querySelector(".row__panel");
      if (firstHead && firstPanel) {
        firstHead.setAttribute("aria-expanded", "true");
        firstPanel.classList.add("is-open");
        rows[0].classList.add("is-open");
      }
    }
  });

  /* Open a ledger row from elsewhere on the page (calendar, shelf) */
  function openRow(id, opts) {
    var panel = document.getElementById(id);
    if (!panel) return null;
    var row = panel.closest(".row") || panel.closest("[data-row]");
    var head = row ? row.querySelector(".row__head") : null;
    var group = row ? row.parentElement.closest("[data-accordion]") : null;
    if (group) {
      group.querySelectorAll(".row").forEach(function (other) {
        if (other === row) return;
        var h = other.querySelector(".row__head");
        var p = other.querySelector(".row__panel");
        if (h) h.setAttribute("aria-expanded", "false");
        if (p) p.classList.remove("is-open");
        other.classList.remove("is-open");
      });
    }
    if (row && panel) {
      if (head) head.setAttribute("aria-expanded", "true");
      panel.classList.add("is-open");
      row.classList.add("is-open");
    }
    if (!opts || opts.scroll !== false) {
      var target = head || panel;
      var top = target.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (opts && opts.focus && head) head.focus({ preventScroll: true });
    return panel;
  }

  /* ---------- Books: genre filter over shelf + ledger ---------- */
  var filters = document.getElementById("book-filters");

  if (filters) {
    var chips = Array.prototype.slice.call(filters.querySelectorAll(".chip"));
    var statusEl = document.getElementById("filter-status");
    var matched = document.querySelectorAll("[data-genre]");
    var shelves = document.querySelectorAll(".shelf-group");

    function apply(genre) {
      var shown = 0;
      var byShelf = {};

      Array.prototype.forEach.call(matched, function (el) {
        var ok = genre === "all" || el.dataset.genre === genre;
        el.classList.toggle("is-hidden", !ok);
        if (ok) {
          if (el.classList.contains("row")) shown += 1;
          var g = el.closest("[data-shelf]");
          if (g) {
            var key = g.dataset.shelf;
            byShelf[key] = (byShelf[key] || 0) + 1;
          }
        } else if (el.classList.contains("is-open")) {
          var h = el.querySelector(".row__head");
          if (h) h.setAttribute("aria-expanded", "false");
          el.classList.remove("is-open");
          var p = el.querySelector(".row__panel");
          if (p) {
            p.classList.remove("is-open");
          }
        }
      });

      shelves.forEach(function (shelf) {
        var key = shelf.getAttribute("data-shelf");
        var count = byShelf[key] || shelf.querySelectorAll("[data-genre]:not(.is-hidden)").length;
        shelf.classList.toggle("is-hidden", count === 0);
      });

      if (statusEl) {
        statusEl.textContent =
          genre === "all"
            ? shown + " volumes on the shelf"
            : shown + " volume" + (shown === 1 ? "" : "s") + " filed under " + genre;
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        apply(chip.dataset.filter);
      });
    });

    apply("all");
  }

  /* ---------- Books: spine buttons open their ledger entry ---------- */
  document.querySelectorAll(".spine").forEach(function (spine) {
    spine.addEventListener("click", function () {
      var id = spine.dataset.target;
      var panel = document.getElementById(id);
      if (!panel) return;
      var already = spine.getAttribute("aria-pressed") === "true";
      document.querySelectorAll(".spine").forEach(function (s) {
        s.setAttribute("aria-pressed", "false");
      });
      if (already) return;
      spine.setAttribute("aria-pressed", "true");
      openRow(id, { focus: false });
    });
  });

  /* ---------- Events: calendar day buttons jump to the entry ---------- */
  var cal = document.getElementById("calendar");

  if (cal) {
    cal.querySelectorAll(".cal__day[data-target]").forEach(function (day) {
      day.addEventListener("click", function () {
        openRow(day.dataset.target, { focus: true });
      });
    });
  }

  /* ---------- Forms ---------- */
  var validators = {
    required: function (value) {
      return value.trim().length > 0 || "Please complete this field.";
    },
    email: function (value) {
      if (!value.trim()) return "We need an email address to confirm your place.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) || "That address looks incomplete — check for a typo.";
    },
    phone: function (value) {
      if (!value.trim()) return "";
      return /^[+()\-\s\d.]{7,20}$/.test(value.trim()) || "Use digits, spaces, dashes or brackets only.";
    },
    minChars: function (value) {
      if (!value.trim()) return "Tell us a little so we can pair you with the right group.";
      return value.trim().length >= 12 || "Please write at least a dozen words.";
    },
    choiceGroup: function (value, field) {
      if (field.dataset.group) {
        var any = field.querySelectorAll("input:checked").length > 0;
        return any || field.dataset.groupMsg || "Choose one option to continue.";
      }
      return true;
    },
    checkbox: function (value, field) {
      var input = field.querySelector("input[type=checkbox]");
      return (input && input.checked) || field.dataset.checkMsg || "Please confirm to continue.";
    }
  };

  function validateField(field) {
    var rules = (field.dataset.validate || "").split(/\s+/).filter(Boolean);
    var input = field.querySelector("input, select, textarea");
    if (!input || rules.length === 0) return true;

    var message = "";
    for (var i = 0; i < rules.length; i++) {
      var fn = validators[rules[i]];
      if (!fn) continue;
      var result = fn(input.value || "", field);
      if (result !== true && result !== "" && result !== undefined) {
        message = result;
        break;
      }
    }

    var errorEl = field.querySelector(".field__error");
    field.setAttribute("data-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field[data-validate]"));
    var notice = form.parentElement.querySelector("[data-form-notice]") ||
      document.getElementById(form.dataset.form + "-notice");
    var summary = form.querySelector("[data-error-summary]");

    fields.forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("blur", function () { validateField(field); });
      input.addEventListener("change", function () {
        if (field.getAttribute("data-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = fields.filter(function (f) { return !validateField(f); });

      if (bad.length) {
        if (summary) {
          summary.innerHTML =
            "<h3 class='h3'>Nothing has been sent yet</h3><p class='small'>" +
            bad.length + " field" + (bad.length === 1 ? "" : "s") +
            " need" + (bad.length === 1 ? "s" : "") + " your attention. Corrections are marked in red below.</p>";
          summary.classList.add("is-shown", "notice--error");
          summary.setAttribute("role", "alert");
        }
        var firstInput = bad[0].querySelector("input, select, textarea");
        if (firstInput) firstInput.focus({ preventScroll: false });
        return;
      }

      if (summary) {
        summary.classList.remove("is-shown", "notice--error");
        summary.innerHTML = "";
        summary.removeAttribute("role");
      }

      var clubField = form.querySelector('input[name="club"]:checked');
      var nameField = form.querySelector('input[name="name"]');
      var who = nameField && nameField.value.trim() ? nameField.value.trim().split(/\s+/)[0] : "friend";
      var club = clubField ? clubField.getAttribute("data-club") : "this";

      if (notice) {
        notice.innerHTML =
          "<h3 class='h3'>Your place is held, " + escapeHtml(who) + "</h3>" +
          "<p>We have entered you in the ledger for <em>" + escapeHtml(club) +
          "</em>. A confirmation from the shop desk arrives within one working day — watch for a letter from <span class='muted'>desk@chapter-and-verse.example</span>." +
          " Nothing has been charged, and you may write back to cancel at any time.</p>";
        notice.classList.add("is-shown");
        notice.setAttribute("role", "status");
        notice.setAttribute("tabindex", "-1");
        notice.focus({ preventScroll: true });
      }

      form.reset();
      fields.forEach(function (f) {
        f.setAttribute("data-invalid", "false");
        var err = f.querySelector(".field__error");
        if (err) err.textContent = "";
      });
    });
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Counting: live seat tally as a circle is chosen ---------- */
  var seatCount = document.getElementById("seat-count");
  if (seatCount) {
    var seatsByClub = {
      gothic: 2,
      poetry: 6,
      middlemarch: 2,
      newcomers: 9,
      philosophy: 0,
      advise: 14
    };

    document.querySelectorAll('input[name="club"]').forEach(function (input) {
      input.addEventListener("change", function () {
        var n = seatsByClub[input.value];
        if (typeof n !== "number") return;
        seatCount.innerHTML =
          n > 0
            ? "<strong>" + n + "</strong> " + (n === 1 ? "chair" : "chairs") + " left for the Michaelmas term"
            : "Waitlist only — that circle is full, and we write when a chair frees";
      });
    });
  }

  /* ---------- Footer: today's opening line + year ---------- */
  var hours = {
    0: { label: "Sunday", open: "11:00", close: "16:00" },
    1: { label: "Monday", open: "Closed", close: "" },
    2: { label: "Tuesday", open: "10:00", close: "18:00" },
    3: { label: "Wednesday", open: "10:00", close: "18:00" },
    4: { label: "Thursday", open: "10:00", close: "21:00" },
    5: { label: "Friday", open: "10:00", close: "18:00" },
    6: { label: "Saturday", open: "09:30", close: "18:00" }
  };

  var todayOut = document.querySelectorAll("[data-today-open]");
  var now = new Date();
  var day = hours[now.getDay()];

  document.querySelectorAll("[data-hours-row]").forEach(function (tr) {
    if (tr.getAttribute("data-hours-row") === String(now.getDay())) {
      tr.setAttribute("data-today", "true");
    } else {
      tr.removeAttribute("data-today");
    }
  });

  if (todayOut.length) {
    var text = day.close
      ? day.label + "s, " + day.open + " – " + day.close
      : day.label + "s — closed, the kindling is stacked for Tuesday";
    todayOut.forEach(function (el) { el.textContent = text; });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(now.getFullYear());

  var todayCells = document.querySelectorAll(".cal__day[data-date]");
  if (todayCells.length) {
    var iso = now.toISOString().slice(0, 10);
    todayCells.forEach(function (cell) {
      if (cell.dataset.date === iso) cell.classList.add("is-today");
      if (cell.dataset.date < iso) cell.classList.add("is-past");
    });
  }

  /* ---------- Deep links: #book-… or #ev-… opens that entry ---------- */
  if (window.location.hash.length > 1) {
    var id = decodeURIComponent(window.location.hash.slice(1));
    var panel = document.getElementById(id);
    if (panel && panel.classList.contains("row__panel")) {
      window.setTimeout(function () { openRow(id, { focus: false }); }, 60);
    }
  }
})();
