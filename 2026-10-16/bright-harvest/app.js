/* ============================================================
   Bright Harvest — shared behaviour
   Signature motion: Decode Text + Magnetic Elements
   Everything page-specific is guarded by element existence.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ────────────────────────────────────────────────────────────
     1. Mobile navigation
     ──────────────────────────────────────────────────────────── */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("#primary-nav");
    if (!toggle || !nav) return;

    function open() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      var sr = toggle.querySelector(".sr-only");
      if (sr) sr.textContent = "Close the main menu";
    }
    function close(refocus) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      var sr = toggle.querySelector(".sr-only");
      if (sr) sr.textContent = "Open the main menu";
      if (refocus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) close(false); else open();
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) close(true);
    });

    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      close(false);
    });

    // Desktop layout owns the menu; never leave it flagged open.
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (e) {
      if (e.matches) close(false);
    });
  }

  /* ────────────────────────────────────────────────────────────
     2. Header shadow once scrolled
     ──────────────────────────────────────────────────────────── */
  function initHeader() {
    var header = $("[data-site-header]");
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ────────────────────────────────────────────────────────────
     3. DECODE TEXT — glyphs scramble, then resolve. Runs once.
     ──────────────────────────────────────────────────────────── */
  var GLYPHS = "abcdefghijklmnopqrstuvwxyz#%&@*+=/\\<>~";

  function initDecode() {
    var targets = $$("[data-decode]");
    if (!targets.length) return;

    targets.forEach(function (el) {
      var word = (el.getAttribute("data-decode") || el.textContent || "").trim();
      if (!word) return;

      // Keep a hidden, always-correct copy for assistive tech.
      el.textContent = "";
      var sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = word;
      el.appendChild(sr);

      var chars = word.split("");
      var cells = chars.map(function (ch) {
        var span = document.createElement("span");
        span.className = "dc";
        span.setAttribute("aria-hidden", "true");
        span.textContent = ch;
        el.appendChild(span);
        return span;
      });

      // Lock each slot to its final width so scrambling never reflows the line.
      cells.forEach(function (span) {
        var w = span.getBoundingClientRect().width;
        if (w) { span.style.width = w + "px"; }
      });

      if (reduced.matches) return;

      var start = null;
      var perChar = 62;   // ms of scrambling per character
      var stagger = 78;   // ms between characters resolving
      var settle = perChar + stagger * (chars.length - 1) + 60;

      function frame(ts) {
        if (start === null) start = ts;
        var t = ts - start;
        cells.forEach(function (span, i) {
          var ch = chars[i];
          if (ch === " ") return;
          var resolveAt = perChar + i * stagger;
          if (t >= resolveAt) {
            span.textContent = ch;
            span.classList.remove("dc--busy");
          } else {
            span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            span.classList.add("dc--busy");
          }
        });
        if (t < settle) window.requestAnimationFrame(frame);
      }

      // Small beat before the terminal starts typing.
      window.setTimeout(function () { window.requestAnimationFrame(frame); }, 260);
    });
  }

  /* ────────────────────────────────────────────────────────────
     4. MAGNETIC ELEMENTS — primary buttons lean toward the cursor
     ──────────────────────────────────────────────────────────── */
  function initMagnetic() {
    var items = $$(".btn--magnetic");
    if (!items.length || reduced.matches || !finePointer.matches) return;

    var RADIUS = 120;
    var MAX_PULL = 11;
    var pointers = items.map(function (el) {
      return { el: el, x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1, rect: null, live: false };
    });
    var mouse = { x: -9999, y: -9999 };
    var running = false;

    function measure() {
      pointers.forEach(function (p) { p.rect = null; });
    }

    function tick() {
      var busy = false;
      pointers.forEach(function (p) {
        if (!p.rect) {
          p.rect = p.el.getBoundingClientRect();
          p.cx = p.rect.left + p.rect.width / 2;
          p.cy = p.rect.top + p.rect.height / 2;
        }
        var dx = mouse.x - p.cx;
        var dy = mouse.y - p.cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var reach = Math.max(p.rect.width / 2, RADIUS * 0.72);
        var field = reach + RADIUS;

        if (dist < field) {
          var pull = 1 - Math.max(0, dist - Math.max(p.rect.width / 2, 30)) / RADIUS;
          pull = Math.min(1, Math.max(0, pull));
          p.tx = Math.max(-MAX_PULL, Math.min(MAX_PULL, dx * 0.28 * pull));
          p.ty = Math.max(-MAX_PULL, Math.min(MAX_PULL, dy * 0.32 * pull));
          p.ts = 1 + 0.04 * pull;
        } else {
          p.tx = 0; p.ty = 0; p.ts = 1;
        }

        p.x += (p.tx - p.x) * 0.16;
        p.y += (p.ty - p.y) * 0.16;
        p.s += (p.ts - p.s) * 0.16;

        var settled = Math.abs(p.tx - p.x) < 0.05 && Math.abs(p.ty - p.y) < 0.05 && Math.abs(p.ts - p.s) < 0.001;
        if (settled) {
          if (p.live) { p.el.style.transform = ""; p.live = false; }
        } else {
          p.el.style.transform = "translate3d(" + p.x.toFixed(2) + "px," + p.y.toFixed(2) + "px,0) scale(" + p.s.toFixed(4) + ")";
          p.live = true;
          busy = true;
        }
      });

      if (busy || mouse.x > -9000) {
        window.requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }

    function wake() {
      if (!running) { running = true; window.requestAnimationFrame(tick); }
    }

    document.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      wake();
    }, { passive: true });

    document.addEventListener("pointerdown", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });
    document.addEventListener("pointerleave", function () {
      mouse.x = -9999; mouse.y = -9999; wake();
    });
    wake();
  }

  /* ────────────────────────────────────────────────────────────
     5. Impact counters
     ──────────────────────────────────────────────────────────── */
  function formatValue(node, value) {
    var compact = node.getAttribute("data-format") === "compact";
    var suffix = node.getAttribute("data-suffix") || "";
    var out;
    if (compact && value >= 1000000) {
      out = (value / 1000000).toFixed(value >= 10000000 ? 1 : 2).replace(/\.?0+$/, "") + "M";
    } else if (compact && value >= 1000) {
      var k = Math.round(value / 100) / 10;
      out = k.toFixed(1).replace(/\.0$/, "") + "K";
    } else {
      out = Math.round(value).toLocaleString("en-US");
    }
    return out + suffix;
  }

  function initCounters() {
    var nodes = $$(".counter");
    if (!nodes.length) return;

    function run(node) {
      var to = parseFloat(node.getAttribute("data-count-to")) || 0;
      if (reduced.matches) { node.textContent = formatValue(node, to); return; }
      var duration = 1700;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = formatValue(node, to * eased);
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) { nodes.forEach(run); return; }
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ────────────────────────────────────────────────────────────
     6. Allocation bars (donate page)
     ──────────────────────────────────────────────────────────── */
  function initBars() {
    var fills = $$("[data-bar-fill]");
    if (!fills.length) return;
    function show(el) {
      el.style.width = el.getAttribute("data-bar-fill") + "%";
    }
    if (!("IntersectionObserver" in window) || reduced.matches) { fills.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    fills.forEach(function (el) { el.style.width = "0%"; io.observe(el); });
  }

  /* ────────────────────────────────────────────────────────────
     7. Form helpers
     ──────────────────────────────────────────────────────────── */
  function renderSummary(node, heading, list) {
    if (!node) return;
    node.hidden = false;
    node.textContent = "";
    var p = document.createElement("p");
    p.textContent = heading;
    var ul = document.createElement("ul");
    list.forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });
    node.appendChild(p);
    node.appendChild(ul);
  }
  function markField(input, message, state) {
    var msg = document.getElementById(input.getAttribute("aria-describedby") || "");
    if (msg) {
      msg.textContent = message || "";
      msg.setAttribute("data-state", state || "");
    }
    input.setAttribute("aria-invalid", state === "error" ? "true" : "false");
  }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); }
  function digits(v) { return (v || "").replace(/\D/g, ""); }

  /* Footer newsletter — present on every page */
  function initSignup() {
    $$("[data-signup]").forEach(function (form) {
      var input = form.querySelector('input[type="email"]');
      var msg = form.querySelector(".field-msg");
      if (!input || !msg) return;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!emailOk(input.value)) {
          markField(input, "Enter a complete email address, like you@example.com.", "error");
          input.focus();
          return;
        }
        markField(input, "", "");
        form.innerHTML = '<p class="field-msg" data-state="ok" role="status">You are on the list — the next Harvest Letter arrives on the first Tuesday of the month.</p>';
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true" && emailOk(input.value)) markField(input, "", "");
      });
    });
  }

  /* ────────────────────────────────────────────────────────────
     8. Donation widget (donate.html)
     ──────────────────────────────────────────────────────────── */
  var MEALS_PER_DOLLAR = 3;
  var DESIGNATIONS = {
    boxes: "Family Harvest Boxes",
    produce: "Fresh Produce Fund",
    transport: "Rescue & Transport",
    where: "Where it is needed most"
  };

  function initDonation() {
    var form = document.getElementById("donation-form");
    if (!form) return;

    var amountButtons = $$("[data-amount]", form);
    var custom = form.querySelector("#custom-amount");
    var impact = form.querySelector("#impact-live");
    var freqInputs = $$('input[name="frequency"]', form);
    var desigInputs = $$('input[name="designation"]', form);
    var live = form.querySelector("#donation-live");
    var thanks = document.getElementById("donation-thanks");
    var summary = form.querySelector("#donation-summary");

    var state = { amount: 75, frequency: "month", designation: "where" };

    function currentFreq() {
      var checked = freqInputs.filter(function (i) { return i.checked; })[0];
      return checked ? checked.value : "month";
    }
    function perYear() {
      return state.frequency === "once" ? 1 : state.frequency === "month" ? 12 : 52;
    }
    function mealsThisGift() {
      return Math.round(state.amount * MEALS_PER_DOLLAR);
    }

    function renderImpact() {
      if (!impact) return;
      var name = DESIGNATIONS[state.designation] || "";
      var meals = mealsThisGift();
      var cadence = state.frequency === "once" ? "one time" : "every " + (state.frequency === "month" ? "month" : "week");
      var lines;
      if (state.designation === "boxes") {
        lines = meals + " meals, " + cadence + " — about " + Math.max(1, Math.round(meals / 21)) + " week of harvest boxes for a family of five.";
      } else if (state.designation === "produce") {
        lines = Math.round(state.amount * 2.4) + " lbs of rescued produce, " + cadence + ", routed straight to the Mobile Market.";
      } else if (state.designation === "transport") {
        lines = (state.amount * perYear() / 4.6).toFixed(0) + " refrigerated rescue miles funded this year.";
      } else {
        lines = meals + " meals " + cadence + ", wherever the county is shortest that week.";
      }
      impact.textContent = "";
      var bold = document.createElement("b");
      bold.textContent = "$" + state.amount.toLocaleString("en-US");
      impact.appendChild(bold);
      impact.appendChild(document.createTextNode(" " + lines));
      var giveLabel = form.querySelector("[data-give-amount]");
      if (giveLabel) giveLabel.textContent = "$" + state.amount.toLocaleString("en-US");
      if (live) live.textContent = "$" + state.amount + " " + name + " " + cadence;
    }

    function setAmount(value, fromCustom) {
      state.amount = Math.max(1, Math.min(100000, Math.round(value) || 0));
      amountButtons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(!fromCustom && Number(b.getAttribute("data-amount")) === state.amount));
      });
      if (!fromCustom && custom) custom.value = "";
      renderImpact();
    }

    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () { setAmount(Number(btn.getAttribute("data-amount")), false); });
    });

    if (custom) {
      custom.addEventListener("input", function () {
        var v = parseInt(digits(custom.value), 10);
        if (!v) { amountButtons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); return; }
        setAmount(v, true);
      });
    }

    freqInputs.forEach(function (i) {
      i.addEventListener("change", function () { state.frequency = currentFreq(); renderImpact(); });
    });
    desigInputs.forEach(function (i) {
      i.addEventListener("change", function () {
        if (i.checked) { state.designation = i.value; renderImpact(); }
      });
    });

    // card number grouping
    var card = form.querySelector("#card-number");
    if (card) {
      card.addEventListener("input", function () {
        var d = digits(card.value).slice(0, 16);
        card.value = d.replace(/(.{4})/g, "$1 ").trim();
      });
    }
    var expiry = form.querySelector("#card-expiry");
    if (expiry) {
      expiry.addEventListener("input", function () {
        var d = digits(expiry.value).slice(0, 4);
        expiry.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = [];
      var bad = [];

      var name = form.querySelector("#donor-name");
      var email = form.querySelector("#donor-email");

      if (!name.value.trim() || name.value.trim().length < 2) {
        markField(name, "Please enter the name for your receipt.", "error");
        errors.push("Your name is missing.");
      } else { markField(name, "", ""); }

      if (!emailOk(email.value)) {
        markField(email, "Enter a complete email so we can send the receipt.", "error");
        errors.push("A valid email address is needed.");
      } else { markField(email, "", ""); }

      if (!state.amount || state.amount < 5) {
        errors.push("Choose an amount of $5 or more.");
        if (custom) bad.push(custom);
      }

      if (digits(card.value).length !== 16) {
        markField(card, "Enter all 16 digits of the card number.", "error");
        errors.push("The card number looks incomplete.");
      } else { markField(card, "", ""); }

      if (digits(expiry.value).length !== 4) {
        markField(expiry, "Use a MM/YY date.", "error");
        errors.push("The expiry date looks incomplete.");
      } else { markField(expiry, "", ""); }

      if (errors.length) {
        renderSummary(summary, "Something needs fixing:", errors);
        var firstBad = form.querySelector('[aria-invalid="true"]') || bad[0];
        if (firstBad) firstBad.focus();
        return;
      }

      if (summary) summary.hidden = true;

      // Fake success: swap the widget for a stamped thank-you state.
      var total = state.amount;
      var cadence = state.frequency === "once" ? "one-time gift" : (state.frequency === "month" ? "monthly gift" : "weekly gift");
      var dest = DESIGNATIONS[state.designation];
      var receiptNo = "BH-" + String(Math.floor(100000 + Math.random() * 899999));

      var thanksTitle = thanks.querySelector("[data-thanks-title]");
      if (thanksTitle) thanksTitle.textContent = "Thank you, " + name.value.trim().split(" ")[0] + ".";
      $$("[data-receipt]", thanks).forEach(function (node) {
        var key = node.getAttribute("data-receipt");
        if (key === "amount") node.textContent = "$" + total.toLocaleString("en-US") + " " + cadence;
        if (key === "meals") node.textContent = (total * MEALS_PER_DOLLAR).toLocaleString("en-US") + " meals";
        if (key === "annual") node.textContent = "$" + (total * perYear()).toLocaleString("en-US") + " of food this year";
        if (key === "designation") node.textContent = dest;
        if (key === "email") node.textContent = email.value.trim();
        if (key === "reference") node.textContent = receiptNo;
      });

      form.hidden = true;
      if (thanks) {
        thanks.hidden = false;
        var focusTarget = thanks.querySelector("[data-thanks-title]");
        if (focusTarget) {
          focusTarget.setAttribute("tabindex", "-1");
          focusTarget.focus();
        }
        thanks.scrollIntoView({ block: "center", behavior: reduced.matches ? "auto" : "smooth" });
      }
    });

    var reset = thanks ? thanks.querySelector("[data-again]") : null;
    if (reset) {
      reset.addEventListener("click", function () {
        thanks.hidden = true;
        form.hidden = false;
        form.reset();
        state = { amount: 75, frequency: "month", designation: "where" };
        setAmount(75, false);
        var first = form.querySelector('input[name="frequency"]');
        if (first) first.focus();
      });
    }

    state.frequency = currentFreq();
    var checkedDesig = desigInputs.filter(function (i) { return i.checked; })[0];
    if (checkedDesig) state.designation = checkedDesig.value;
    setAmount(75, false);
  }

  /* ────────────────────────────────────────────────────────────
     9. Volunteer signup (volunteer.html)
     ──────────────────────────────────────────────────────────── */
  function initVolunteer() {
    var form = document.getElementById("volunteer-form");
    if (!form) return;

    var summary = form.querySelector("#volunteer-summary");
    var done = document.getElementById("volunteer-done");

    function fail(list, inputs) {
      renderSummary(summary, "We need a little more before we can schedule you:", list);
      if (inputs && inputs[0]) inputs[0].focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = [];
      var bad = [];

      var name = form.querySelector("#v-name");
      var email = form.querySelector("#v-email");
      var phone = form.querySelector("#v-phone");
      var site = form.querySelector("#v-site");
      var role = form.querySelector("#v-role");
      var consent = form.querySelector("#v-consent");
      var days = $$('input[name="days"]:checked', form);

      if (name.value.trim().length < 2) { markField(name, "Please tell us your full name.", "error"); errors.push("Your name is missing."); bad.push(name); }
      else { markField(name, "", ""); }

      if (!emailOk(email.value)) { markField(email, "Enter a complete email address.", "error"); errors.push("A valid email is needed."); bad.push(email); }
      else { markField(email, "", ""); }

      if (phone.value.trim() && digits(phone.value).length < 10) {
        markField(phone, "Phone numbers need 10 digits — or leave it blank.", "error");
        errors.push("The phone number looks too short."); bad.push(phone);
      } else { markField(phone, "", ""); }

      if (!site.value) { markField(site, "Pick the site you can reach most easily.", "error"); errors.push("No site selected."); bad.push(site); }
      else { markField(site, "", ""); }

      if (!role.value) { markField(role, "Choose the work that suits you best.", "error"); errors.push("No role selected."); bad.push(role); }
      else { markField(role, "", ""); }

      if (!days.length) {
        var dayGroup = form.querySelector("#v-days-msg");
        if (dayGroup) { dayGroup.textContent = "Tick at least one day you could cover."; dayGroup.setAttribute("data-state", "error"); }
        errors.push("No availability ticked.");
        bad.push(days[0] || form.querySelector('input[name="days"]'));
      } else {
        var dg = form.querySelector("#v-days-msg");
        if (dg) { dg.textContent = ""; dg.setAttribute("data-state", ""); }
      }

      if (!consent.checked) {
        markField(consent, "Please agree to the volunteer code of conduct.", "error");
        errors.push("The code of conduct is not ticked."); bad.push(consent);
      } else { markField(consent, "", ""); }

      if (errors.length) { fail(errors, bad); return; }
      if (summary) summary.hidden = true;

      var names = days.map(function (d) { return d.parentNode.textContent.trim(); }).join(", ");
      $$("[data-v-out]", done).forEach(function (node) {
        var key = node.getAttribute("data-v-out");
        if (key === "name") node.textContent = name.value.trim();
        if (key === "site") node.textContent = site.options[site.selectedIndex].text;
        if (key === "role") node.textContent = role.options[role.selectedIndex].text;
        if (key === "days") node.textContent = names;
      });

      form.hidden = true;
      done.hidden = false;
      var title = done.querySelector("[data-done-title]");
      if (title) { title.setAttribute("tabindex", "-1"); title.focus(); }
      done.scrollIntoView({ block: "center", behavior: reduced.matches ? "auto" : "smooth" });
    });

    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener("input", function () {
        if (el.getAttribute("aria-invalid") === "true") markField(el, "", "");
      });
    });
  }

  /* ────────────────────────────────────────────────────────────
     10. Story filters (stories.html)
     ──────────────────────────────────────────────────────────── */
  function initFilters() {
    var group = $("[data-filters]");
    if (!group) return;
    var chips = $$("[data-filter]", group);
    var cards = $$("[data-story]");
    var count = $("[data-story-count]");

    function apply(value) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = value === "all" || card.getAttribute("data-story") === value;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      chips.forEach(function (chip) {
        chip.setAttribute("aria-pressed", String(chip.getAttribute("data-filter") === value));
      });
      if (count) {
        count.textContent = shown === cards.length
          ? "Showing all " + shown + " stories."
          : "Showing " + shown + " of " + cards.length + " stories.";
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { apply(chip.getAttribute("data-filter")); });
    });
    apply("all");
  }

  /* ────────────────────────────────────────────────────────────
     11. Marquee: stop for people who cannot use it
     ──────────────────────────────────────────────────────────── */
  function initMarquee() {
    var marquee = $("[data-marquee]");
    if (!marquee) return;
    if (reduced.matches) marquee.classList.add("is-paused");
  }

  /* ────────────────────────────────────────────────────────────
     boot
     ──────────────────────────────────────────────────────────── */
  function boot() {
    initNav();
    initHeader();
    initDecode();
    initMagnetic();
    initCounters();
    initBars();
    initSignup();
    initDonation();
    initVolunteer();
    initFilters();
    initMarquee();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
