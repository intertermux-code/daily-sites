/* ═══════════════════════════════════════════════════════════════
   LumiDent — shared behaviour
   Signature motion: Decode Text (hero keyword) + Magnetic Elements
   Everything else is guarded by element-existence checks so one
   file can serve every page.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ── 1. Decode Text ───────────────────────────────────────────
     The hero keyword scrambles through glyphs and resolves, once,
     on load. Width is reserved by a hidden ghost so nothing jumps. */
  var GLYPHS = "abcdefghijklmnopqrstuvwxyz#%&@*+=/<>_";

  function scramble(el) {
    var target = el.getAttribute("data-decode") || el.textContent.trim();
    var live = el.querySelector(".decode-live");
    if (!live) return;
    if (reduceMotion) { live.textContent = target; return; }

    var chars = target.split("");
    var framesPerChar = 3;
    var tail = 10;
    var frame = 0;
    var total = chars.length * framesPerChar + tail;
    live.classList.add("is-scrambling");

    function tick() {
      frame += 1;
      var settled = Math.floor(frame / framesPerChar);
      var out = "";
      for (var i = 0; i < chars.length; i++) {
        if (i < settled || chars[i] === " ") out += chars[i];
        else out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      live.textContent = out;
      if (frame < total) {
        requestAnimationFrame(tick);
      } else {
        live.textContent = target;
        live.classList.remove("is-scrambling");
      }
    }
    requestAnimationFrame(tick);
  }

  function initDecode() {
    var nodes = document.querySelectorAll("[data-decode]");
    if (!nodes.length) return;
    // Let the display font settle before scrambling so metrics match.
    var start = function () {
      nodes.forEach(function (el, i) {
        window.setTimeout(function () { scramble(el); }, 220 + i * 260);
      });
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
    } else {
      window.setTimeout(start, 260);
    }
  }

  /* ── 2. Magnetic Elements ─────────────────────────────────────
     Primary buttons lean toward the cursor inside a 120px radius,
     interpolated with rAF; they spring back on leave. */
  function initMagnetism() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".magnetic"));
    if (!items.length || reduceMotion || !finePointer) return;

    var RADIUS = 120;
    var states = items.map(function (el) {
      return { el: el, x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1, ready: false };
    });
    var raf = null;

    function loop() {
      var moving = false;
      for (var i = 0; i < states.length; i++) {
        var st = states[i];
        var dx = st.tx - st.x;
        var dy = st.ty - st.y;
        var ds = st.ts - st.s;
        if (Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08 || Math.abs(ds) > 0.0008) moving = true;
        st.x += dx * 0.16;
        st.y += dy * 0.16;
        st.s += ds * 0.16;
        st.el.style.setProperty("--mx", st.x.toFixed(2) + "px");
        st.el.style.setProperty("--my", st.y.toFixed(2) + "px");
        st.el.style.setProperty("--ms", st.s.toFixed(4));
      }
      raf = moving ? requestAnimationFrame(loop) : null;
    }

    function wake() {
      if (raf === null) raf = requestAnimationFrame(loop);
    }

    function onMove(e) {
      var px = e.clientX;
      var py = e.clientY;
      for (var i = 0; i < states.length; i++) {
        var st = states[i];
        var r = st.el.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var hw = Math.max(r.width / 2, r.height / 2);
        var dist = Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2));
        var reach = RADIUS + hw;

        if (dist < reach) {
          var pull = 1 - dist / reach;            // 0 at edge, 1 at centre
          st.tx = clamp((px - cx) * 0.32, -18, 18);
          st.ty = clamp((py - cy) * 0.44, -14, 14);
          st.ts = 1 + 0.04 * pull;
          st.ready = true;
        } else if (st.ready) {
          st.tx = 0; st.ty = 0; st.ts = 1; st.ready = false;
        }
      }
      wake();
    }

    function onLeave() {
      states.forEach(function (st) { st.tx = 0; st.ty = 0; st.ts = 1; });
      wake();
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
  }

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

  /* ── 3. Header state + mobile navigation ────────────────────── */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (header) {
      var queued = false;
      var onScroll = function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          header.classList.toggle("is-stuck", window.scrollY > 10);
          queued = false;
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    var lastFocus = null;

    function openNav() {
      lastFocus = document.activeElement;
      document.body.classList.add("nav-open", "no-scroll");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      var first = nav.querySelector("a");
      if (first) first.focus();
    }

    function closeNav(refocus) {
      document.body.classList.remove("nav-open", "no-scroll");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      if (refocus !== false) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) closeNav();
      else openNav();
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });

    document.addEventListener("keydown", function (e) {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.key === "Escape") { closeNav(); return; }
      if (e.key !== "Tab") return;
      var focusables = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll("a")));
      var idx = focusables.indexOf(document.activeElement);
      if (idx === -1) return;
      var next = e.shiftKey ? idx - 1 : idx + 1;
      if (next < 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
      else if (next >= focusables.length) { e.preventDefault(); focusables[0].focus(); }
    });

    var mq = window.matchMedia("(min-width: 1080px)");
    var onBreak = function (e) { if (e.matches) closeNav(false); };
    if (mq.addEventListener) mq.addEventListener("change", onBreak);
    else if (mq.addListener) mq.addListener(onBreak);
  }

  /* ── 4. Scroll reveals (translate + settle, no other motion) ── */
  function initReveals() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentNode ? el.parentNode.querySelectorAll("[data-reveal]") : [el];
        var position = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = Math.min(position, 5) * 70 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ── 5. Before / after comparison sliders ───────────────────── */
  function initComparators() {
    var sliders = document.querySelectorAll(".ba-slider");
    if (!sliders.length) return;
    sliders.forEach(function (slider) {
      var range = slider.querySelector(".ba-range");
      if (!range) return;
      function paint(v) { slider.style.setProperty("--split", v + "%"); }
      paint(range.value);
      range.addEventListener("input", function () { paint(range.value); });
      range.addEventListener("change", function () { paint(range.value); });
    });
  }

  /* ── 6. Validation helpers ──────────────────────────────────── */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function fieldOf(input) {
    return input.closest(".field") || input.closest(".choice") || input.closest("fieldset");
  }

  function setError(input, message) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    var box = wrap.querySelector(".field-error");
    if (message) {
      wrap.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
      if (box) { box.textContent = message; box.hidden = false; }
    } else {
      wrap.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
      if (box) { box.textContent = ""; box.hidden = true; }
    }
  }

  function validate(input) {
    var value = (input.value || "").trim();
    var label = input.getAttribute("data-label") || (input.name ? input.name : "This field");

    if (input.type === "email") {
      if (!value) return label + " is needed so we can send your confirmation.";
      if (!EMAIL.test(value)) return "Enter an email address like name@example.co.uk.";
      return "";
    }
    if (input.type === "tel") {
      var digits = value.replace(/[^0-9]/g, "");
      if (!value) return label + " lets us reach you if a dentist runs late.";
      if (digits.length < 10) return "Enter a phone number with at least 10 digits, e.g. 0117 496 0284.";
      return "";
    }
    if (input.type === "date") {
      if (!value) return "Choose the day you would like to come in.";
      var chosen = new Date(value + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(chosen.getTime())) return "Enter a date in the format shown (YYYY-MM-DD).";
      if (chosen < today) return "That date has passed. Pick today or a later weekday.";
      if (chosen.getDay() === 0) return "We are closed on Sundays — try Monday to Saturday.";
      return "";
    }
    if (input.hasAttribute("data-require-group")) {
      var group = input.closest("fieldset");
      var picked = group && group.querySelector("input:checked");
      return picked ? "" : (input.getAttribute("data-label") || "Pick one");
    }
    if (input.type === "checkbox" && input.hasAttribute("required")) {
      return input.checked ? "" : (input.getAttribute("data-message") || "Tick this box to continue.");
    }
    if (input.type === "radio") {
      var group = input.form ? input.form.querySelectorAll('input[name="' + input.name + '"]') : [input];
      var any = false;
      Array.prototype.forEach.call(group, function (g) { if (g.checked) any = true; });
      if (any) return "";
      return "Please choose " + (input.getAttribute("data-label") || "an option") + " from the list.";
    }
    if (input.tagName === "SELECT") {
      if (!value) return "Select " + label.toLowerCase() + " from the list.";
      return "";
    }
    if (input.hasAttribute("required")) {
      if (!value) return label + " is required.";
      if (value.length < 2) return label + " looks too short — please check it.";
    }
    return "";
  }

  function wireForm(form, onSubmit) {
    var controls = Array.prototype.slice.call(
      form.querySelectorAll("input:not([type=hidden]), select, textarea")
    );

    controls.forEach(function (input) {
      var evt = (input.type === "checkbox" || input.type === "radio" || input.tagName === "SELECT" || input.type === "date") ? "change" : "blur";
      input.addEventListener(evt, function () {
        if (input.type === "radio") {
          var group = form.querySelectorAll('input[name="' + input.name + '"]');
          var msg = validate(input);
          Array.prototype.forEach.call(group, function (g) { setError(g, msg); });
        } else {
          setError(input, validate(input));
        }
      });
      if (evt === "blur") {
        input.addEventListener("input", function () {
          var wrap = fieldOf(input);
          if (wrap && wrap.classList.contains("has-error")) setError(input, validate(input));
        });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      var problems = [];

      controls.forEach(function (c) { c.removeAttribute("data-counted"); });

      controls.forEach(function (input) {
        if (input.type === "radio") {
          if (input.getAttribute("data-counted")) return;
          var all = form.querySelectorAll('input[name="' + input.name + '"]');
          Array.prototype.forEach.call(all, function (g) { g.setAttribute("data-counted", "1"); });
          var msg = validate(input);
          Array.prototype.forEach.call(all, function (g) { setError(g, msg); });
          if (msg) {
            if (!firstBad) firstBad = all[0];
            problems.push({
              name: input.getAttribute("data-label") || input.name,
              msg: msg,
              id: all[0].id
            });
          }
          return;
        }
        var message = validate(input);
        setError(input, message);
        if (message && !firstBad) firstBad = input;
        if (message) problems.push({ name: input.getAttribute("data-label") || input.name, msg: message, id: input.id });
      });

      var summary = form.querySelector(".error-summary");
      if (problems.length) {
        if (summary) {
          var heading = summary.querySelector("h3");
          if (heading) {
            heading.textContent = problems.length === 1
              ? "One detail needs your attention before we can book this in"
              : problems.length + " details need your attention before we can book this in";
          }
          var list = summary.querySelector("ul");
          list.innerHTML = "";
          problems.forEach(function (p) {
            var li = document.createElement("li");
            if (p.id) {
              var a = document.createElement("a");
              a.href = "#" + p.id;
              a.textContent = p.name;
              a.addEventListener("click", function (ev) {
                ev.preventDefault();
                var target = form.querySelector('[id="' + p.id + '"]');
                if (target) target.focus();
              });
              li.appendChild(a);
              var span = document.createElement("span");
              span.textContent = " — " + p.msg;
              li.appendChild(span);
            } else {
              li.textContent = p.name + " — " + p.msg;
            }
            list.appendChild(li);
          });
          summary.classList.add("is-visible");
          summary.setAttribute("tabindex", "-1");
          summary.focus();
        }
        if (firstBad && !summary) firstBad.focus();
        else if (firstBad) {
          var rect = firstBad.getBoundingClientRect();
          if (rect.top < 70 || rect.bottom > window.innerHeight) {
            window.scrollTo({ top: window.scrollY + rect.top - 140, behavior: reduceMotion ? "auto" : "smooth" });
          }
        }
        return;
      }

      if (summary) summary.classList.remove("is-visible");
      onSubmit(form, controls);
    });
  }

  /* ── 7. Booking form ────────────────────────────────────────── */
  function initBooking() {
    var form = document.getElementById("booking-form");
    if (!form) return;

    var dateInput = form.querySelector('input[name="date"]');
    if (dateInput) {
      var now = new Date();
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      dateInput.min = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
      var max = new Date(now.getTime() + 300 * 864e5);
      dateInput.max = max.getFullYear() + "-" + pad(max.getMonth() + 1) + "-" + pad(max.getDate());
    }

    /* Live summary in the aside panel */
    var aside = document.querySelector("[data-summary]");
    if (aside) {
      var map = { service: "service", dentist: "dentist", date: "date", time: "time", name: "name" };
      var sync = function () {
        Object.keys(map).forEach(function (key) {
          var slot = aside.querySelector('[data-summary="' + key + '"]');
          if (!slot) return;
          var value = "—";
          if (key === "time") {
            var picked = form.querySelector('input[name="time"]:checked');
            if (picked) value = picked.getAttribute("data-label-plain") || picked.value;
          } else {
            var el = form.querySelector('[name="' + key + '"]');
            if (el && el.value) {
              value = el.tagName === "SELECT"
                ? el.options[el.selectedIndex].textContent
                : el.value;
              if (key === "date") value = prettyDate(value);
            }
          }
          slot.textContent = value;
        });
      };
      form.addEventListener("change", sync);
      form.addEventListener("input", sync);
      sync();
    }

    wireForm(form, function (filled) {
      var data = readForm(filled);
      var panel = document.getElementById("booking-confirmation");
      var shell = document.getElementById("booking-form-shell");

      if (panel) {
        var ref = reference();
        setText(panel, "[data-out=ref]", ref);
        setText(panel, "[data-out=name]", data.name);
        setText(panel, "[data-out=service]", data.service);
        setText(panel, "[data-out=dentist]", data.dentist || "First available clinician");
        setText(panel, "[data-out=date]", data.date);
        setText(panel, "[data-out=time]", data.time);
        setText(panel, "[data-out=duration]", data.duration);
        setText(panel, "[data-out=contact]", data.email + " · " + data.phone);
        var flags = [];
        if (data.first) flags.push("New patient — arrive 10 minutes early for medical history");
        if (data.anxious) flags.push("Anxious patient — a longer chair and sedation chat are booked in");
        if (data.sms) flags.push("SMS reminders switched on");
        var flagBox = panel.querySelector("[data-out=flags]");
        if (flagBox) {
          flagBox.innerHTML = "";
          (flags.length ? flags : ["Standard appointment"]).forEach(function (line) {
            var li = document.createElement("li");
            li.textContent = line;
            flagBox.appendChild(li);
          });
        }
        if (shell) shell.hidden = true;
        panel.hidden = false;
        var h2 = panel.querySelector("h2");
        if (h2) h2.focus();
        window.scrollTo({ top: Math.max(0, panel.getBoundingClientRect().top + window.scrollY - 120), behavior: reduceMotion ? "auto" : "smooth" });

        var again = panel.querySelector("[data-reset]");
        if (again && !again.hasAttribute("data-wired")) {
          again.setAttribute("data-wired", "1");
          again.addEventListener("click", function () {
            filled.reset();
            form.querySelectorAll(".has-error").forEach(function (w) { w.classList.remove("has-error"); });
            panel.hidden = true;
            if (shell) shell.hidden = false;
            form.dispatchEvent(new Event("input", { bubbles: true }));
            form.dispatchEvent(new Event("change", { bubbles: true }));
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
            var firstField = form.querySelector("input, select");
            if (firstField) firstField.focus();
          });
        }
      }
    });
  }

  function readForm(form) {
    var one = function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : "";
    };
    var timeEl = form.querySelector('input[name="time"]:checked');
    var serviceEl = form.querySelector('select[name="service"]');
    var dentistEl = form.querySelector('select[name="dentist"]');
    var durationMap = {
      assessment: "50 minutes",
      hygiene: "55 minutes",
      implants: "60 minutes",
      ortho: "45 minutes",
      cosmetic: "40 minutes",
      children: "20 minutes",
      emergency: "30 minutes"
    };
    var key = serviceEl ? serviceEl.value : "";
    return {
      name: one("name"),
      email: one("email"),
      phone: one("phone"),
      service: serviceEl && serviceEl.selectedIndex > 0 ? serviceEl.options[serviceEl.selectedIndex].textContent : "",
      dentist: dentistEl && dentistEl.selectedIndex > 0 ? dentistEl.options[dentistEl.selectedIndex].textContent : "",
      date: prettyDate(one("date")),
      time: timeEl ? (timeEl.getAttribute("data-label-plain") || timeEl.value) : "",
      duration: durationMap[key] || "45 minutes",
      first: isChecked(form, "first_visit"),
      anxious: isChecked(form, "anxious"),
      sms: isChecked(form, "sms")
    };
  }

  function isChecked(form, name) {
    var el = form.querySelector('input[name="' + name + '"]');
    return !!(el && el.checked);
  }

  function prettyDate(value) {
    if (!value) return "";
    var d = new Date(value + "T00:00:00");
    if (isNaN(d.getTime())) return value;
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return days[d.getDay()] + " " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function setText(scope, selector, value) {
    var el = scope.querySelector(selector);
    if (el) el.textContent = value;
  }

  function reference() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var out = "LD-";
    for (var i = 0; i < 5; i++) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    return out;
  }

  /* ── 8. Contact form ────────────────────────────────────────── */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    wireForm(form, function (inputs) {
      var panel = document.getElementById("contact-sent");
      var shell = document.getElementById("contact-form-shell");
      var name = form.querySelector('[name="name"]');
      if (panel && name) {
        var who = panel.querySelector("[data-out=name]");
        if (who) who.textContent = name.value.trim().split(" ")[0];
        var topic = panel.querySelector("[data-out=reason]");
        var reason = form.querySelector("select[name=reason]");
        if (topic && reason && reason.selectedIndex > 0) topic.textContent = reason.options[reason.selectedIndex].textContent;
        if (shell) shell.hidden = true;
        panel.hidden = false;
        var h = panel.querySelector("h2");
        if (h) h.focus();
        window.scrollTo({ top: Math.max(0, panel.getBoundingClientRect().top + window.scrollY - 130), behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  }

  /* ── 9. Newsletter / callback strip ─────────────────────────── */
  function initCallback() {
    var box = document.getElementById("callback-box");
    if (!box) return;
    var form = box.querySelector("form");
    var note = box.querySelector("[data-callback-result]");
    wireForm(form, function () {
      var phone = form.querySelector('[name="phone"]');
      note.textContent = "Thank you — a coordinator will ring " + phone.value.trim() + " within 15 minutes (8am–8pm, Mon–Sat).";
      note.hidden = false;
      form.reset();
    });
  }

  /* ── 10. Tooth arch diagram (smile gallery) ─────────────────── */
  function initArch() {
    var arch = document.querySelector("[data-arch]");
    if (!arch) return;
    var teeth = arch.querySelectorAll("li");
    var caption = arch.querySelector(".arch-caption");
    function note(li) {
      teeth.forEach(function (t) { t.classList.remove("is-marked"); });
      li.classList.add("is-marked");
      if (caption && li.getAttribute("data-note")) caption.textContent = li.getAttribute("data-note");
    }
    arch.addEventListener("pointerover", function (e) {
      var li = e.target.closest("li");
      if (li) note(li);
    });
    arch.addEventListener("pointerleave", function () {
      teeth.forEach(function (t) { t.classList.remove("is-marked"); });
      if (caption) caption.textContent = "Hover or focus a tooth to read its note";
    });
  }

  /* ── Boot ───────────────────────────────────────────────────── */
  function boot() {
    initHeader();
    initDecode();
    initMagnetism();
    initReveals();
    initComparators();
    initBooking();
    initContactForm();
    initCallback();
    initArch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
