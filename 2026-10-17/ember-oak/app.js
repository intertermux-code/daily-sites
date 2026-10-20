/* ==========================================================================
   Ember & Oak — shared behaviour
   Signature motion: cursor spotlight + 3D card tilt. Vanilla, rAF-driven,
   disabled under prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var onMobile = function () { return window.innerWidth <= 720; };

  /* ------------------------------------------------------------------
     Header state + back to top
     ------------------------------------------------------------------ */
  var header = document.querySelector(".site-header");
  var toTop = document.querySelector(".to-top");
  var ticking = false;

  function onScrollFrame() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (toTop) toTop.classList.toggle("is-on", y > 700);
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  onScrollFrame();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
      var skip = document.getElementById("main");
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close the main menu" : "Open the main menu");
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     MOTION 1 — Cursor spotlight.
     A radial ember glow tracks the pointer. One rAF loop for the page.
     ------------------------------------------------------------------ */
  var spots = Array.prototype.slice.call(document.querySelectorAll("[data-spotlight]"));

  if (spots.length && !reduce.matches && fine.matches) {
    var target = null;
    var px = 0;
    var py = 0;
    var queued = false;

    var paint = function () {
      queued = false;
      if (!target) return;
      var r = target.getBoundingClientRect();
      var x = ((px - r.left) / r.width) * 100;
      var y = ((py - r.top) / r.height) * 100;
      target.style.setProperty("--mx", x.toFixed(2) + "%");
      target.style.setProperty("--my", y.toFixed(2) + "%");
    };

    window.addEventListener(
      "pointermove",
      function (e) {
        px = e.clientX;
        py = e.clientY;
        var el = e.target && e.target.closest ? e.target.closest("[data-spotlight]") : null;
        if (!el) {
          var over = spots.filter(function (s) {
            var r = s.getBoundingClientRect();
            return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          })[0];
          el = over || null;
        }
        if (el === target && !queued) {
          queued = true;
          window.requestAnimationFrame(paint);
        } else if (el) {
          if (target) target.classList.remove("is-live");
          target = el;
          target.classList.add("is-live");
          if (!queued) {
            queued = true;
            window.requestAnimationFrame(paint);
          }
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      function (e) {
        var el = e.target.closest("[data-spotlight]");
        if (el) {
          target = el;
          el.classList.add("is-live");
        }
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && target) {
        target.classList.remove("is-live");
        target = null;
      }
    });
  }

  /* ------------------------------------------------------------------
     MOTION 2 — 3D card tilt with a following glare.
     rotateX/rotateY capped at 8deg, lerped on a single rAF loop.
     ------------------------------------------------------------------ */
  var MAX = 8;
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tilt]"));

  if (cards.length) {
    var live = [];
    var raf = null;

    var step = function () {
      var i, c;
      for (i = live.length - 1; i >= 0; i--) {
        c = live[i];
        c.cx += (c.tx - c.cx) * 0.14;
        c.cy += (c.ty - c.cy) * 0.14;
        c.gx += (c.tgx - c.gx) * 0.2;
        c.gy += (c.tgy - c.gy) * 0.2;

        var done =
          Math.abs(c.tx - c.cx) < 0.05 &&
          Math.abs(c.ty - c.cy) < 0.05 &&
          Math.abs(c.tgx - c.gx) < 0.2 &&
          Math.abs(c.tgy - c.gy) < 0.2;

        if (done && c.out) {
          c.el.style.setProperty("--rx", "0deg");
          c.el.style.setProperty("--ry", "0deg");
          c.el.classList.remove("is-tilting");
          live.splice(i, 1);
          continue;
        }

        c.el.style.setProperty("--rx", c.cy.toFixed(2) + "deg");
        c.el.style.setProperty("--ry", c.cx.toFixed(2) + "deg");
        c.el.style.setProperty("--gx", c.gx.toFixed(1) + "%");
        c.el.style.setProperty("--gy", c.gy.toFixed(1) + "%");
      }
      raf = live.length ? window.requestAnimationFrame(step) : null;
    };

    var kick = function () {
      if (!raf) raf = window.requestAnimationFrame(step);
    };

    var attach = function (el) {
      var state = {
        el: el,
        tx: 0, ty: 0,
        cx: 0, cy: 0,
        tgx: 50, tgy: 50,
        gx: 50, gy: 50,
        out: false
      };

      el.addEventListener("pointerenter", function (e) {
        if (reduce.matches || !fine.matches || onMobile()) return;
        state.out = false;
        el.classList.add("is-tilting");
        if (live.indexOf(state) === -1) live.push(state);
        kick();
      });

      el.addEventListener("pointermove", function (e) {
        if (reduce.matches || !fine.matches || onMobile()) return;
        var r = el.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width;
        var ny = (e.clientY - r.top) / r.height;
        state.tx = (nx - 0.5) * 2 * MAX;
        state.ty = (0.5 - ny) * 2 * MAX;
        state.tgx = nx * 100;
        state.tgy = ny * 100;
        if (live.indexOf(state) === -1) live.push(state);
        kick();
      });

      el.addEventListener("pointerleave", function () {
        state.out = true;
        state.tx = 0;
        state.ty = 0;
        kick();
      });
    };

    cards.forEach(attach);
  }

  /* ------------------------------------------------------------------
     Menu tabs
     ------------------------------------------------------------------ */
  var tablist = document.querySelector("[role='tablist'][data-tabs]");

  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role='tab']"));
    var panels = tabs.map(function (t) {
      return document.getElementById(t.getAttribute("aria-controls"));
    });

    var select = function (i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        var k = e.key;
        if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); select((i + 1) % tabs.length, true); }
        else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
        else if (k === "Home") { e.preventDefault(); select(0, true); }
        else if (k === "End") { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });

    select(0, false);
  }

  /* ------------------------------------------------------------------
     Gallery lightbox
     ------------------------------------------------------------------ */
  var grid = document.querySelector("[data-gallery]");

  if (grid) {
    var triggers = Array.prototype.slice.call(grid.querySelectorAll("[data-full]"));
    var box = document.getElementById("lightbox");

    if (box && triggers.length) {
      var img = box.querySelector("img");
      var capTitle = box.querySelector("[data-lb-title]");
      var capCount = box.querySelector("[data-lb-count]");
      var closeBtn = box.querySelector("[data-lb-close]");
      var prevBtn = box.querySelector("[data-lb-prev]");
      var nextBtn = box.querySelector("[data-lb-next]");
      var index = 0;
      var opener = null;

      var render = function () {
        var t = triggers[index];
        img.src = t.getAttribute("data-full");
        img.alt = t.getAttribute("data-alt") || "";
        capTitle.textContent = t.getAttribute("data-caption") || "";
        capCount.textContent = "Frame " + (index + 1) + " / " + triggers.length;
        document.title = "Ember & Oak — Gallery, frame " + (index + 1) + " of " + triggers.length;
      };

      var open = function (i, from) {
        index = i;
        opener = from;
        render();
        box.hidden = false;
        document.body.classList.add("is-locked");
        closeBtn.focus();
      };

      var close = function () {
        box.hidden = true;
        document.body.classList.remove("is-locked");
        if (opener) opener.focus();
      };

      var move = function (d) {
        index = (index + d + triggers.length) % triggers.length;
        render();
      };

      triggers.forEach(function (t, i) {
        t.addEventListener("click", function () { open(i, t); });
      });

      closeBtn.addEventListener("click", close);
      prevBtn.addEventListener("click", function () { move(-1); });
      nextBtn.addEventListener("click", function () { move(1); });

      box.addEventListener("click", function (e) {
        if (e.target === box || e.target.hasAttribute("data-lb-close")) close();
      });

      document.addEventListener("keydown", function (e) {
        if (box.hidden) return;
        if (e.key === "Escape") { e.preventDefault(); close(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
        else if (e.key === "Tab") {
          var f = [closeBtn, prevBtn, nextBtn];
          var first = f[0];
          var last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     Reservations form — inline validation + confirmation state
     ------------------------------------------------------------------ */
  var form = document.getElementById("booking-form");

  if (form) {
    var confirmCard = document.getElementById("booking-confirm");
    var status = document.querySelector("[data-form-status]");
    var today = new Date();
    var iso = function (d) {
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + m + "-" + day;
    };
    var startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var dateField = form.querySelector('[name="date"]');
    var maxDate = new Date(startOfToday.getTime() + 90 * 864e5);
    if (dateField) {
      dateField.min = iso(today);
      dateField.max = iso(maxDate);
    }

    var rules = {
      name: function (v) {
        if (!v.trim()) return "Please tell us who the table is for.";
        if (v.trim().length < 2) return "Enter a name of at least two characters.";
        return "";
      },
      phone: function (v) {
        if (!v.trim()) return "We need a number to reach you on the night.";
        var digits = v.replace(/\D/g, "");
        if (digits.length < 10) return "That looks too short — include the area code.";
        if (digits.length > 15) return "That looks too long for a phone number.";
        return "";
      },
      email: function (v) {
        if (!v.trim()) return "An email address is required for the confirmation.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())) return "Check the address — it needs an @ and a domain.";
        return "";
      },
      date: function (v) {
        if (!v) return "Choose the evening you would like to join us.";
        var d = new Date(v + "T12:00:00");
        if (isNaN(d.getTime())) return "That date could not be read.";
        var day = d.getDay();
        if (day === 1 || day === 2) return "We are closed on Mondays and Tuesdays. Try Wednesday onward.";
        if (d < startOfToday) return "Please pick today or a future date.";
        if (d > maxDate) return "We take bookings up to 90 days ahead.";
        return "";
      },
      time: function (v) {
        if (!v) return "Select a seating time.";
        return "";
      },
      party: function (v, fd) {
        var checked = fd.querySelector('[name="party"]:checked');
        if (!checked) return "How many guests are dining?";
        return "";
      },
      notes: function () { return ""; }
    };

    var fieldOf = function (input) { return input.closest(".field"); };

    var validateOne = function (input, fd) {
      var rule = rules[input.name];
      if (!rule) return true;
      var msg = rule(input.value, fd || form);
      var field = fieldOf(input);
      if (!field) return !msg;
      var errEl = field.querySelector(".err");
      if (msg) {
        field.classList.add("is-invalid");
        field.classList.remove("is-valid");
        input.setAttribute("aria-invalid", "true");
        if (errEl) { errEl.textContent = msg; input.setAttribute("aria-describedby", errEl.id); }
        return false;
      }
      field.classList.remove("is-invalid");
      field.classList.add("is-valid");
      input.removeAttribute("aria-invalid");
      if (errEl) errEl.textContent = "";
      return true;
    };

    Array.prototype.forEach.call(form.querySelectorAll("input, select, textarea"), function (input) {
      var ev = input.type === "radio" || input.tagName === "SELECT" || input.type === "date" ? "change" : "blur";
      input.addEventListener(ev, function () { validateOne(input); });
      input.addEventListener("input", function () {
        var field = fieldOf(input);
        if (field && field.classList.contains("is-invalid")) validateOne(input);
      });
    });

    var prettyDate = function (v) {
      var d = new Date(v + "T12:00:00");
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
      var bad = [];
      inputs.forEach(function (i) {
        if (i.type === "radio") {
          if (bad.length) return;
          var group = form.querySelectorAll('[name="' + i.name + '"]');
          if (!validateOne(group[0], form)) bad.push(group[0]);
        } else if (!validateOne(i, form)) {
          bad.push(i);
        }
      });

      if (bad.length) {
        if (status) {
          status.textContent = bad.length === 1
            ? "One detail still needs your attention."
            : bad.length + " details still need your attention.";
          status.classList.add("is-error");
        }
        bad[0].focus();
        return;
      }

      if (status) {
        status.textContent = "Sending your request…";
        status.classList.remove("is-error");
      }

      var fd = new FormData(form);
      var name = String(fd.get("name") || "").trim();
      var ref =
        "EO-" +
        String(fd.get("date")).replace(/-/g, "").slice(4) +
        "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();

      window.setTimeout(function () {
        var slot = form.querySelector('[name="time"]');
        var partyEl = form.querySelector('[name="party"]:checked');
        var fills = {
          "data-out-name": name.split(" ")[0],
          "data-out-ref": ref,
          "data-out-date": prettyDate(String(fd.get("date"))),
          "data-out-time": slot ? slot.options[slot.selectedIndex].text : "",
          "data-out-party": partyEl ? partyEl.parentNode.querySelector("label").textContent.trim() : "",
          "data-out-phone": String(fd.get("phone") || ""),
          "data-out-email": String(fd.get("email") || ""),
          "data-out-notes": String(fd.get("notes") || "").trim() || "None — we will take care of the details."
        };
        Object.keys(fills).forEach(function (k) {
          var el = document.querySelector("[" + k + "]");
          if (el) el.textContent = fills[k];
        });

        form.hidden = true;
        if (confirmCard) {
          confirmCard.hidden = false;
          confirmCard.setAttribute("tabindex", "-1");
          confirmCard.focus();
        }
      }, reduce.matches ? 0 : 620);
    });

    var again = document.querySelector("[data-book-again]");
    if (again) {
      again.addEventListener("click", function () {
        if (confirmCard) confirmCard.hidden = true;
        form.hidden = false;
        form.reset();
        Array.prototype.forEach.call(form.querySelectorAll(".field"), function (f) {
          f.classList.remove("is-valid", "is-invalid");
        });
        if (status) {
          status.textContent = "Fields marked with an asterisk are required.";
          status.classList.remove("is-error");
        }
        var first = form.querySelector('[name="name"]');
        if (first) first.focus();
      });
    }

    if (status) status.textContent = "Fields marked with an asterisk are required.";
  }

  /* ------------------------------------------------------------------
     Footer newsletter (no network — local confirmation only)
     ------------------------------------------------------------------ */
  var news = document.querySelector("[data-newsletter]");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = news.querySelector('input[type="email"]');
      var msg = document.querySelector("[data-news-msg]");
      var ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim());
      if (!msg) return;
      msg.className = "newsletter__msg " + (ok ? "ok" : "bad");
      msg.textContent = ok
        ? "You are on the list — the fire letter arrives on the first Sunday."
        : "Please enter a complete email address.";
      if (ok) { input.value = ""; }
      else { input.focus(); }
    });
  }

  /* ------------------------------------------------------------------
     Today's row in the hours table
     ------------------------------------------------------------------ */
  var table = document.querySelector("[data-hours]");
  if (table) {
    var names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    var d = names[new Date().getDay()];
    var row = table.querySelector("[data-day='" + d + "']");
    if (row) {
      row.classList.add("is-today");
      var badge = document.querySelector("[data-open-now]");
      if (badge) {
        var shut = row.getAttribute("data-open") === "closed";
        badge.textContent = shut ? "Closed today — we open Wednesday at 5:00 pm" : "Open today until " + row.getAttribute("data-open");
        badge.style.color = shut ? "var(--ash)" : "var(--ember)";
      }
    }
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
