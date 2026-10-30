/* =========================================================
   LumiDent — shared behaviour
   Signature motion: clip-path image reveal + blur-fade ascend
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) root.classList.add("no-motion");

  /* ---------- 1. Scroll reveals ---------- */
  function initReveals() {
    var media = document.querySelectorAll(".reveal-media");
    var blocks = document.querySelectorAll(".ascend");

    // Assign a stagger index to each .ascend among its siblings.
    blocks.forEach(function (el) {
      if (el.style.getPropertyValue("--i")) return;
      var parent = el.parentElement;
      if (!parent) return;
      var sibs = parent.querySelectorAll(":scope > .ascend");
      var i = Array.prototype.indexOf.call(sibs, el);
      el.style.setProperty("--i", i < 0 ? 0 : i);
    });

    if (reduce.matches || !("IntersectionObserver" in window)) {
      media.forEach(function (el) { el.classList.add("in"); });
      blocks.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.14 });

    var seen = new Set();
    function watch(el) {
      if (seen.has(el)) return;
      seen.add(el);
      io.observe(el);
    }

    media.forEach(watch);
    blocks.forEach(watch);

    // Rows and panels created after load (expanded ledger entries, booking slots)
    // must be picked up too.
    var mo = new MutationObserver(function (records) {
      records.forEach(function (rec) {
        rec.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(".reveal-media, .ascend")) watch(node);
          if (node.querySelectorAll) {
            node.querySelectorAll(".reveal-media, .ascend").forEach(watch);
          }
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- 2. Ledger entries (expandable rows) ---------- */
  function initLedger() {
    var entries = document.querySelectorAll("[data-entry]");
    entries.forEach(function (entry) {
      var head = entry.querySelector(".entry__head");
      if (!head) return;
      var panelId = entry.querySelector(".entry__panel");
      if (panelId && panelId.id) head.setAttribute("aria-controls", panelId.id);
      head.setAttribute("aria-expanded", entry.dataset.open === "true" ? "true" : "false");

      head.addEventListener("click", function () {
        var open = entry.dataset.open === "true";
        var group = entry.dataset.group;
        if (!open && group) {
          entries.forEach(function (other) {
            if (other !== entry && other.dataset.group === group && other.dataset.open === "true") {
              other.dataset.open = "false";
              var h = other.querySelector(".entry__head");
              if (h) h.setAttribute("aria-expanded", "false");
            }
          });
        }
        entry.dataset.open = open ? "false" : "true";
        head.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });

    // Deep link: open the row whose panel id is in the URL hash.
    function openFromHash() {
      var id = window.location.hash.slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target || !target.classList.contains("entry__panel")) return;
      var entry = target.closest("[data-entry]");
      if (!entry || entry.dataset.open === "true") return;
      entry.dataset.open = "true";
      var h = entry.querySelector(".entry__head");
      if (h) h.setAttribute("aria-expanded", "true");
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  /* ---------- 3. Mobile drawer ---------- */
  function initDrawer() {
    var burger = document.querySelector("[data-burger]");
    var drawer = document.querySelector("[data-drawer]");
    if (!burger || !drawer) return;

    function setOpen(open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      drawer.classList.toggle("is-open", open);
      document.body.classList.toggle("no-scroll", open);
      if (open) {
        var first = drawer.querySelector("a, button");
        if (first) first.focus({ preventScroll: true });
      } else {
        burger.focus({ preventScroll: true });
      }
    }

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080 && drawer.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ---------- 4. Sticky masthead shadow ---------- */
  function initMasthead() {
    var mast = document.querySelector(".masthead");
    if (!mast) return;
    var onScroll = function () {
      mast.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 5. Before / after comparator ---------- */
  function initComparators() {
    var sliders = document.querySelectorAll(".ba");
    if (!sliders.length) return;
    sliders.forEach(function (ba) {
      var range = ba.querySelector(".ba__range");
      if (!range) return;
      var apply = function () {
        ba.style.setProperty("--pos", range.value + "%");
        var line = ba.querySelector(".ba__read");
        if (line) line.textContent = "Reveal " + range.value + "%";
      };
      range.addEventListener("input", apply);
      apply();
    });
  }

  /* ---------- 6. Booking: time slots + validation ---------- */
  var SCHEDULE = {
    0: null,                                        // Sunday — closed
    1: ["09:00", "10:00", "11:00", "13:00", "15:00"],// Monday — urgent clinic only, afternoon
    2: ["08:30", "09:30", "10:30", "11:30", "14:00", "15:00", "16:00"],
    3: ["08:30", "09:30", "11:00", "13:30", "14:30", "16:30"],
    4: ["08:30", "10:00", "11:00", "13:00", "15:00", "16:00"],
    5: ["08:30", "09:30", "10:30", "12:00", "14:00"],
    6: ["09:00", "10:00", "11:00", "12:00"]          // Saturday — hygiene only
  };
  var OFF_DAYS = { 2: ["10:30"], 4: ["11:00"] };      // booked-out slots for demo realism

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function isoToday() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function fmtLong(iso) {
    var parts = iso.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function renderSlots(dateISO, host) {
    if (!host) return;
    var parts = dateISO.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    host.innerHTML = "";
    var list = SCHEDULE[d.getDay()];

    if (dateISO < isoToday()) {
      host.innerHTML = '<p class="field__hint">Choose a future date to load available times.</p>';
      return;
    }
    if (!list) {
      host.innerHTML = '<p class="field__hint">The practice is closed on Sundays. Same-day emergencies: <a href="tel:+15035550142">call (503) 555-0142</a>.</p>';
      return;
    }
    var off = OFF_DAYS[d.getDay()] || [];
    var grid = document.createElement("div");
    grid.className = "slots";
    grid.setAttribute("role", "radiogroup");
    grid.setAttribute("aria-label", "Available appointment times");

    list.forEach(function (t, i) {
      var taken = off.indexOf(t) > -1;
      var wrap = document.createElement("div");
      wrap.className = "slot" + (taken ? " slot--off" : "");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "time";
      input.value = t;
      input.id = "slot-" + i;
      input.disabled = taken;
      var label = document.createElement("label");
      label.htmlFor = input.id;
      label.textContent = t;
      wrap.appendChild(input);
      wrap.appendChild(label);
      grid.appendChild(wrap);
    });
    host.appendChild(grid);

    // Keep the hidden field in sync for the receipt.
    var hidden = document.querySelector("[data-time-hidden]");
    grid.addEventListener("change", function (e) {
      if (hidden && e.target.name === "time") hidden.value = e.target.value;
    });
  }

  function setError(field, message) {
    var input = field.querySelector(".control, select, textarea, [data-slot-host]");
    var err = field.querySelector(".err");
    if (err) {
      err.querySelector("span").textContent = message;
      err.classList.toggle("is-shown", !!message);
    }
    if (input && input.setAttribute) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
    return !message;
  }

  function fieldOf(el) {
    return el && el.closest ? el.closest("[data-field]") : null;
  }

  function initBooking() {
    var form = document.querySelector("[data-booking-form]");
    if (!form) return;

    var dateInput = form.querySelector("[data-date]");
    var slotHost = form.querySelector("[data-slot-host]");
    var summary = form.querySelector("[data-summary]");
    var banner = form.querySelector("[data-form-banner]");
    var confirm = document.querySelector("[data-confirm]");

    if (dateInput) {
      dateInput.min = isoToday();
      dateInput.max = (function () {
        var d = new Date();
        d.setDate(d.getDate() + 120);
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      })();
      dateInput.value = (function () {
        var d = new Date();
        // Snap to the next open weekday.
        do { d.setDate(d.getDate() + 1); } while (!SCHEDULE[d.getDay()] || d.getDay() === 1);
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      })();
      renderSlots(dateInput.value, slotHost);
      dateInput.addEventListener("change", function () {
        renderSlots(dateInput.value || isoToday(), slotHost);
        validateField("time");
        updateSummary();
      });
    }

    var RULES = {
      name: function (v) {
        if (!v.trim()) return "Please enter your full name.";
        if (v.trim().length < 2) return "Please enter your full name.";
        return "";
      },
      email: function (v) {
        if (!v.trim()) return "Please enter an email address so we can confirm.";
        return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) ? "" : "Please enter a valid email address.";
      },
      phone: function (v) {
        var digits = v.replace(/\D/g, "");
        if (!digits) return "Please enter a contact number.";
        return digits.length >= 10 ? "" : "Please enter a 10-digit phone number.";
      },
      service: function (v) { return v ? "" : "Select the treatment you need."; },
      date: function (v) {
        if (!v) return "Choose a preferred date.";
        if (v < isoToday()) return "Please choose today or a later date.";
        return "";
      },
      time: function () {
        return form.querySelector('input[name="time"]:checked') ? "" : "Pick an available time slot.";
      },
      notes: function (v) {
        return v.length > 600 ? "Please keep this under 600 characters." : "";
      },
      consent: function () {
        var box = form.querySelector('[name="consent"]');
        return box && box.checked ? "" : "We need your consent to contact you about this request.";
      }
    };

    function validateField(key) {
      var el = form.elements[key];
      if (!el || !RULES[key]) return true;
      var value = el.value || "";
      var msg = RULES[key](value);
      var field = fieldOf(el) || form.querySelector('[data-field="' + key + '"]');
      if (!field) return !msg;
      return setError(field, msg);
    }

    Object.keys(RULES).forEach(function (key) {
      var el = form.elements[key];
      if (!el) return;
      // A named group of inputs resolves to a RadioNodeList (no tagName);
      // a <select> has .length too, but it is a real element.
      var isList = el.tagName === undefined;
      var target = isList ? el[0] : el;
      if (!target) return;
      target.addEventListener("blur", function () { validateField(key); });
      if (!isList) target.addEventListener("change", function () { validateField(key); });
      if (isList) {
        Array.prototype.forEach.call(el, function (input) {
          input.addEventListener("change", function () { validateField(key); });
        });
      }
    });

    /* Live summary */
    function updateSummary() {
      if (!summary) return;
      var map = {
        "Service": form.elements.service.value
          ? form.elements.service.options[form.elements.service.selectedIndex].text
          : "Not selected",
        "Date": dateInput && dateInput.value ? fmtLong(dateInput.value) : "Not selected",
        "Time": form.querySelector('input[name="time"]:checked')
          ? form.querySelector('input[name="time"]:checked').value : "Not selected",
        "Clinic": form.querySelector('input[name="branch"]:checked')
          ? form.querySelector('input[name="branch"]:checked').value : "Pearl Street (flagship)"
      };
      Object.keys(map).forEach(function (k) {
        var cell = summary.querySelector('[data-sum="' + k + '"]');
        if (cell) cell.textContent = map[k];
      });
    }
    form.addEventListener("input", updateSummary);
    form.addEventListener("change", function (e) {
      var key = e.target && e.target.name;
      if (key && RULES[key]) validateField(key);
      if (banner && banner.hidden === false) validateAll(true);
      updateSummary();
    });
    updateSummary();

    function validateAll(quiet) {
      var keys = ["name", "email", "phone", "service", "date", "time", "notes", "consent"];
      var bad = 0;
      keys.forEach(function (key) { if (!validateField(key)) bad++; });
      if (quiet && banner && bad === 0) banner.hidden = true;
      return bad;
    }

    /* Submit */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var keys = ["name", "email", "phone", "service", "date", "time", "notes", "consent"];
      var problems = [];
      keys.forEach(function (key) {
        if (!validateField(key)) {
          var el = form.elements[key];
          var field = fieldOf(el) || form.querySelector('[data-field="' + key + '"]');
          var lab = field ? (field.querySelector("label") || field.querySelector(".field__label")) : null;
          problems.push({
            key: key,
            text: (field && field.dataset.label) || (lab ? lab.textContent : key),
            msg: RULES[key](el && el.value ? el.value : "") || "This needs attention."
          });
        }
      });

      if (problems.length) {
        if (banner) {
          var list = problems.map(function (p) {
            var t = p.text.replace(/\s*\(.*?\)\s*/g, "").replace(/\*/g, "").trim();
            return '<li><a href="#i-' + p.key + '">' + t + " — " + p.msg + "</a></li>";
          }).join("");
          banner.innerHTML = "<strong>" + problems.length + " field" +
            (problems.length > 1 ? "s need" : " needs") + " attention</strong><ul>" + list + "</ul>";
          banner.hidden = false;
          banner.setAttribute("tabindex", "-1");
          banner.focus();
        }
        return;
      }

      if (banner) banner.hidden = true;

      var entryNo = "LD-" + new Date().getFullYear() + "-" +
        String(Math.floor(1000 + Math.random() * 8999));
      var checkedTime = form.querySelector('input[name="time"]:checked');
      var checkedBranch = form.querySelector('input[name="branch"]:checked');

      var set = function (sel, val) {
        var node = confirm && confirm.querySelector(sel);
        if (node) node.textContent = val;
      };
      set("[data-out='no']", entryNo);
      set("[data-out='name']", form.elements.name.value.trim());
      set("[data-out='service']", form.elements.service.options[form.elements.service.selectedIndex].text);
      set("[data-out='date']", fmtLong(dateInput.value));
      set("[data-out='time']", checkedTime ? checkedTime.value : "—");
      set("[data-out='branch']", checkedBranch ? checkedBranch.value : "Pearl Street (flagship)");
      set("[data-out='contact']", form.elements.email.value.trim() + " · " + form.elements.phone.value.trim());
      set("[data-out='patient']", form.elements.newpatient.value === "new" ? "New patient — first visit" : "Returning patient");
      set("[data-out='notes']", form.elements.notes.value.trim() || "None supplied");

      if (confirm) {
        form.hidden = true;
        confirm.hidden = false;
        var h = confirm.querySelector("h2");
        if (h) h.focus({ preventScroll: false });
        window.scrollTo({ top: confirm.offsetTop - 120, behavior: reduce.matches ? "auto" : "smooth" });
      }
    });

    form.addEventListener("reset", function () {
      if (banner) banner.hidden = true;
      form.querySelectorAll(".err.is-shown").forEach(function (el) { el.classList.remove("is-shown"); });
      form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute("aria-invalid"); });
      if (dateInput) renderSlots(dateInput.value || isoToday(), slotHost);
      setTimeout(updateSummary, 0);
    });

    var again = document.querySelector("[data-booking-again]");
    if (again && confirm) {
      again.addEventListener("click", function () {
        confirm.hidden = true;
        form.hidden = false;
        form.reset();
        updateSummary();
        var first = form.querySelector(".control");
        if (first) first.focus();
      });
    }
  }

  /* ---------- 7. Today marker on opening hours ---------- */
  function initHours() {
    var rows = document.querySelectorAll("[data-hours] tr[data-day]");
    if (!rows.length) return;
    var idx = new Date().getDay();
    rows.forEach(function (tr) {
      if (Number(tr.dataset.day) === idx) tr.classList.add("today");
    });
  }

  /* ---------- 8. Footer year ---------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initReveals();
    initLedger();
    initDrawer();
    initMasthead();
    initComparators();
    initBooking();
    initHours();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
