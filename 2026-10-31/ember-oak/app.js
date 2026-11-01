/* =========================================================
   EMBER & OAK — shared behaviour
   Signature motion: Cursor Spotlight + Decode Text
   Structural: Horizontal Diorama rail
   Page modules: menu tabs, gallery lightbox, reservation form,
   newsletter, opening status. All guarded by element checks.
   ========================================================= */
(function () {
  "use strict";

  var reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var finePointer =
    window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  /* ---------- 1. Header state ---------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var lastScroll = -1;
    var setHeader = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (y === lastScroll) return;
      lastScroll = y;
      header.classList.toggle("is-scrolled", y > 40);
    };
    setHeader();
    window.addEventListener("scroll", setHeader, { passive: true });
    window.addEventListener("resize", setHeader);
  }

  /* ---------- 2. Mobile navigation ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("primary-navigation");
  if (navToggle && nav) {
    var openNav = function () {
      document.body.classList.add("nav-open");
      navToggle.setAttribute("aria-expanded", "true");
      var label = navToggle.querySelector(".sr-only");
      if (label) label.textContent = "Close navigation menu";
      var first = nav.querySelector("a");
      if (first) first.focus();
    };
    var closeNav = function (returnFocus) {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      var label = navToggle.querySelector(".sr-only");
      if (label) label.textContent = "Open navigation menu";
      if (returnFocus) navToggle.focus();
    };
    var navIsOpen = function () {
      return document.body.classList.contains("nav-open");
    };

    navToggle.addEventListener("click", function () {
      if (navIsOpen()) closeNav(true);
      else openNav();
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (!navIsOpen()) return;
      if (event.key === "Escape") closeNav(true);
    });

    document.addEventListener("click", function (event) {
      if (!navIsOpen()) return;
      if (event.target.closest("#primary-navigation") || event.target.closest("[data-nav-toggle]")) return;
      closeNav(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && navIsOpen()) closeNav(false);
    });
  }

  /* ---------- 3. Decode Text (hero keyword) ---------- */
  var decode = document.querySelector(".decode");
  if (decode) {
    var finalWord = decode.getAttribute("data-word") || decode.textContent.trim();
    var glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/<>~";
    var caret = document.querySelector(".glyph-caret");

    if (reduce) {
      decode.textContent = finalWord;
      if (caret) caret.style.display = "none";
    } else {
      decode.setAttribute("aria-label", finalWord);
      decode.textContent = "";
      if (caret) caret.classList.add("decode-caret");

      var started = false;
      var startDecode = function () {
        if (started) return;
        started = true;
        var len = finalWord.length;
        var locked = 0;
        var frame = 0;
        var totalFrames = 34;

        var tick = function () {
          frame += 1;
          var out = "";
          for (var i = 0; i < len; i += 1) {
            if (i < locked) out += finalWord.charAt(i);
            else out += glyphs.charAt(Math.floor(Math.random() * glyphs.length));
          }
          decode.textContent = out;

          if (frame % 4 === 0 && locked < len) locked += 1;

          if (frame < totalFrames) {
            window.setTimeout(function () {
              requestAnimationFrame(tick);
            }, 34);
          } else {
            decode.textContent = finalWord;
            decode.setAttribute("aria-label", finalWord);
            if (caret) caret.classList.remove("decode-caret");
          }
        };
        requestAnimationFrame(tick);
      };

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          window.setTimeout(startDecode, 340);
        });
      } else {
        window.setTimeout(startDecode, 500);
      }
    }
  }

  /* ---------- 4. Cursor Spotlight ---------- */
  var spots = document.querySelectorAll("[data-spotlight]");
  if (spots.length && finePointer && !reduce) {
    Array.prototype.forEach.call(spots, function (el) {
      var pending = false;
      var x = 0;
      var y = 0;

      var paint = function () {
        pending = false;
        var rect = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", ((x - rect.left) / rect.width) * 100 + "%");
        el.style.setProperty("--spot-y", ((y - rect.top) / rect.height) * 100 + "%");
      };

      el.addEventListener("pointermove", function (event) {
        if (event.pointerType === "touch") return;
        x = event.clientX;
        y = event.clientY;
        el.classList.add("spot-live");
        if (pending) return;
        pending = true;
        requestAnimationFrame(paint);
      });

      el.addEventListener("pointerleave", function () {
        el.classList.remove("spot-live");
      });

      el.addEventListener("pointerenter", function () {
        el.classList.add("spot-live");
      });
    });
  }

  /* ---------- 5. Horizontal Diorama ---------- */
  var diorama = document.querySelector("[data-diorama]");
  if (diorama) {
    var rail = diorama.querySelector("[data-exhibit-rail]");
    var exhibits = rail ? rail.querySelectorAll(".exhibit") : [];
    var prevBtn = diorama.querySelector("[data-exhibit-prev]");
    var nextBtn = diorama.querySelector("[data-exhibit-next]");
    var counter = diorama.querySelector("[data-exhibit-index]");
    var progress = diorama.querySelector("[data-exhibit-progress]");

    if (rail && exhibits.length) {
      var current = 0;

      if ("IntersectionObserver" in window && !reduce) {
        var liveObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) entry.target.classList.add("is-live");
            });
          },
          { root: rail, threshold: 0.45 }
        );
        Array.prototype.forEach.call(exhibits, function (item) {
          liveObserver.observe(item);
        });
      } else {
        Array.prototype.forEach.call(exhibits, function (item) {
          item.classList.add("is-live");
        });
      }

      var nearest = function () {
        var railBox = rail.getBoundingClientRect();
        var centre = railBox.left + railBox.width / 2;
        var best = 0;
        var bestDist = Infinity;
        Array.prototype.forEach.call(exhibits, function (item, i) {
          var box = item.getBoundingClientRect();
          var dist = Math.abs(box.left + box.width / 2 - centre);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });
        return best;
      };

      var sync = function () {
        current = nearest();
        if (counter) {
          counter.textContent = ("0" + (current + 1)).slice(-2);
        }
        var max = rail.scrollWidth - rail.clientWidth;
        var ratio = max > 0 ? rail.scrollLeft / max : 0;
        if (progress) {
          progress.style.transform = "scaleX(" + Math.min(1, Math.max(0.12, ratio)) + ")";
        }
        if (prevBtn) prevBtn.disabled = rail.scrollLeft <= 4;
        if (nextBtn) nextBtn.disabled = max > 0 && rail.scrollLeft >= max - 4;
      };

      var goTo = function (index) {
        var target = exhibits[Math.min(exhibits.length - 1, Math.max(0, index))];
        if (!target) return;
        rail.scrollTo({
          left: target.offsetLeft - (rail.clientWidth - target.clientWidth) / 2,
          behavior: reduce ? "auto" : "smooth"
        });
      };

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          goTo(nearest() - 1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          goTo(nearest() + 1);
        });
      }

      rail.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(nearest() + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(nearest() - 1);
          }
        },
        false
      );

      var rafPending = false;
      rail.addEventListener(
        "scroll",
        function () {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(function () {
            rafPending = false;
            sync();
          });
        },
        { passive: true }
      );

      window.addEventListener("resize", sync);
      window.setTimeout(sync, 60);
      sync();
    }
  }

  /* ---------- 6. Menu tabs ---------- */
  var tablist = document.querySelector("[data-tabs]");
  if (tablist) {
    var tabs = tablist.querySelectorAll("[role='tab']");
    var panels = document.querySelectorAll("[data-tab-panel]");

    var selectTab = function (tab, focus) {
      Array.prototype.forEach.call(tabs, function (item) {
        var on = item === tab;
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.setAttribute("tabindex", on ? "0" : "-1");
      });
      var target = document.getElementById(tab.getAttribute("aria-controls"));
      Array.prototype.forEach.call(panels, function (panel) {
        var show = panel === target;
        panel.hidden = !show;
        if (show && !reduce) {
          panel.style.animation = "none";
          void panel.offsetWidth;
          panel.style.animation = "";
        }
      });
      if (focus) tab.focus();
    };

    Array.prototype.forEach.call(tabs, function (tab, i) {
      tab.addEventListener("click", function () {
        selectTab(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var dir = 0;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") dir = 1;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") dir = -1;
        else if (event.key === "Home") {
          event.preventDefault();
          selectTab(tabs[0], true);
          return;
        } else if (event.key === "End") {
          event.preventDefault();
          selectTab(tabs[tabs.length - 1], true);
          return;
        }
        if (!dir) return;
        event.preventDefault();
        var next = (i + dir + tabs.length) % tabs.length;
        selectTab(tabs[next], true);
      });
    });

    var preselect = tablist.querySelector("[aria-selected='true']");
    if (preselect) selectTab(preselect, false);
  }

  /* ---------- 7. Gallery lightbox ---------- */
  var grid = document.querySelector("[data-gallery]");
  if (grid) {
    var items = Array.prototype.slice.call(grid.querySelectorAll("[data-lightbox]"));
    var box = document.getElementById("lightbox");
    if (box && items.length) {
      var boxImg = box.querySelector("[data-lightbox-img]");
      var boxCaption = box.querySelector("[data-lightbox-caption]");
      var boxCount = box.querySelector("[data-lightbox-count]");
      var closeBtn = box.querySelector("[data-lightbox-close]");
      var backBtn = box.querySelector("[data-lightbox-prev]");
      var fwdBtn = box.querySelector("[data-lightbox-next]");
      var index = 0;
      var opener = null;

      var render = function () {
        var item = items[index];
        if (!item) return;
        var img = item.querySelector("img");
        var src = item.getAttribute("data-lightbox") || (img ? img.src : "");
        var alt = img ? img.alt : "";
        boxImg.src = src;
        boxImg.alt = alt;
        boxImg.width = img && img.width ? img.width : 1600;
        boxImg.height = img && img.height ? img.height : 1067;
        if (boxCaption) boxCaption.textContent = item.getAttribute("data-caption") || alt;
        if (boxCount) {
          boxCount.textContent = ("0" + (index + 1)).slice(-2) + " / " + ("0" + items.length).slice(-2);
        }
      };

      var open = function (i, trigger) {
        index = i;
        opener = trigger || null;
        render();
        box.removeAttribute("hidden");
        requestAnimationFrame(function () {
          box.classList.add("is-open");
        });
        document.body.classList.add("no-scroll");
        if (closeBtn) closeBtn.focus();
      };

      var close = function () {
        box.classList.remove("is-open");
        document.body.classList.remove("no-scroll");
        window.setTimeout(function () {
          if (!box.classList.contains("is-open")) box.setAttribute("hidden", "");
        }, 400);
        if (opener) opener.focus();
      };

      var step = function (delta) {
        index = (index + delta + items.length) % items.length;
        render();
      };

      items.forEach(function (item, i) {
        var trigger = item.querySelector("button, a") || item;
        trigger.addEventListener("click", function (event) {
          event.preventDefault();
          open(i, trigger);
        });
      });

      if (closeBtn) closeBtn.addEventListener("click", close);
      if (backBtn) backBtn.addEventListener("click", function () { step(-1); });
      if (fwdBtn) fwdBtn.addEventListener("click", function () { step(1); });

      box.addEventListener("click", function (event) {
        if (event.target === box || event.target.hasAttribute("data-lightbox-backdrop")) close();
      });

      document.addEventListener("keydown", function (event) {
        if (!box.classList.contains("is-open")) return;
        if (event.key === "Escape") close();
        else if (event.key === "ArrowRight") step(1);
        else if (event.key === "ArrowLeft") step(-1);
      });
    }
  }

  /* ---------- 8. Reservation form ---------- */
  var booking = document.querySelector("[data-booking-form]");
  if (booking) {
    var confirmation = document.querySelector("[data-booking-confirmation]");
    var today = new Date();

    var iso = function (d) {
      return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    };

    var dateField = booking.querySelector("[name='date']");
    if (dateField) {
      dateField.min = iso(today);
      dateField.max = iso(new Date(today.getTime() + 90 * 864e5));
    }

    var rules = {
      name: function (v) {
        if (!v) return "Please tell us the name for the table.";
        if (v.trim().length < 2) return "That looks too short — please give a full name.";
        return "";
      },
      email: function (v) {
        if (!v) return "We send the confirmation here, so we need it.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return "Check the email — it needs an @ and a domain.";
        return "";
      },
      phone: function (v) {
        if (!v) return "A number lets us call if the fire runs late.";
        if ((v.replace(/\D/g, "").length || 0) < 10) return "That is not a full phone number (10 digits).";
        return "";
      },
      party: function (v) {
        if (!v) return "Choose how many are joining.";
        return "";
      },
      date: function (v) {
        if (!v) return "Pick a date — we open thirty days ahead.";
        var picked = new Date(v + "T12:00:00");
        if (isNaN(picked)) return "That date did not read correctly.";
        if (iso(picked) < iso(today)) return "That date has already passed.";
        if (picked.getDay() === 1) return "We rest on Mondays. Choose Tuesday through Sunday.";
        return "";
      },
      time: function (v) {
        if (!v) return "Choose an arrival window.";
        return "";
      },
      area: function (v) {
        if (!v) return "Pick where you would like to sit.";
        return "";
      }
    };

    var fields = Array.prototype.slice.call(booking.querySelectorAll("[name]")).filter(function (el) {
      return rules[el.name];
    });

    var describe = function (field) {
      var wrap = field.closest(".field");
      return wrap ? wrap.querySelector(".field-error") : null;
    };

    var validateField = function (field) {
      var message = rules[field.name](field.value.trim());
      var wrap = field.closest(".field");
      var error = describe(field);
      if (wrap) {
        wrap.classList.toggle("is-invalid", Boolean(message));
        wrap.classList.toggle("is-valid", !message && field.value.trim() !== "");
      }
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) {
        if (!error.id) error.id = field.name + "-error";
        if (message) {
          error.textContent = message;
          field.setAttribute("aria-describedby", error.id);
        } else {
          error.textContent = "";
          field.removeAttribute("aria-describedby");
        }
      }
      return !message;
    };

    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        if (field.value.trim() !== "") validateField(field);
      });
      field.addEventListener("input", function () {
        var wrap = field.closest(".field");
        if (wrap && wrap.classList.contains("is-invalid")) validateField(field);
      });
      field.addEventListener("change", function () {
        validateField(field);
      });
    });

    var partyLabel = function (v) {
      if (v === "1") return "1 guest";
      if (v === "8") return "7 or 8 guests, long table";
      if (v === "10") return "9 or 10 guests, call us back";
      return v + " guests";
    };

    booking.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = true;
      var firstBad = null;
      fields.forEach(function (field) {
        var good = validateField(field);
        if (!good && !firstBad) firstBad = field;
        if (!good) ok = false;
      });

      if (!ok) {
        if (firstBad) firstBad.focus();
        var summary = booking.querySelector("[data-form-summary-text]");
        if (summary) {
          summary.textContent = "Two or more details need attention. They are marked below.";
          summary.setAttribute("role", "alert");
        }
        return;
      }

      var data = {};
      fields.concat(
        Array.prototype.slice.call(booking.querySelectorAll("[name]")).filter(function (el) {
          return !rules[el.name];
        })
      ).forEach(function (el) {
        if (data[el.name] !== undefined && el.type === "checkbox") return;
        data[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
      });

      var prettyDate = "—";
      if (data.date) {
        var d = new Date(data.date + "T12:00:00");
        prettyDate = d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric"
        });
      }

      var set = function (sel, value) {
        var node = confirmation.querySelector(sel);
        if (node) node.textContent = value;
      };

      set("[data-show='name']", data.name);
      set("[data-show='party']", partyLabel(data.party));
      set("[data-show='date']", prettyDate);
      set("[data-show='time']", data.time);
      set("[data-show='area']", data.area);
      set("[data-show='ref']", "EO-" + (data.date || iso(today)).replace(/-/g, "").slice(4) + "-" +
        String(Math.floor(100 + Math.random() * 800)));

      booking.hidden = true;
      confirmation.classList.add("is-visible");
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
      window.scrollTo({ top: confirmation.getBoundingClientRect().top + window.pageYOffset - 120, behavior: reduce ? "auto" : "smooth" });

      var edit = confirmation.querySelector("[data-edit-booking]");
      if (edit) {
        edit.addEventListener("click", function () {
          confirmation.classList.remove("is-visible");
          booking.hidden = false;
          var first = booking.querySelector("[name='name']");
          if (first) first.focus();
        });
      }
    });
  }

  /* ---------- 9. Newsletter (footer) ---------- */
  var signup = document.querySelector("[data-footer-signup]");
  if (signup) {
    var note = document.querySelector("[data-footer-signup-note]");
    var input = signup.querySelector("input[type='email']");
    signup.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = (input.value || "").trim();
      var valid = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
      signup.classList.toggle("has-error", !valid);
      input.setAttribute("aria-invalid", valid ? "false" : "true");
      if (!valid) {
        if (note) note.textContent = "That address is missing something. Try again.";
        input.focus();
        return;
      }
      if (note) note.textContent = "You are on the list — the next Ash Letter goes out Monday.";
      signup.reset();
    });
  }

  /* ---------- 10. Opening status ---------- */
  var status = document.querySelector("[data-open-status]");
  if (status) {
    var service = { 0: [11, 15, "fire lunch"], 2: [17, 22, "dinner"], 3: [17, 22, "dinner"], 4: [17, 22, "dinner"], 5: [17, 23, "dinner"], 6: [17, 23, "dinner"] };
    var now = new Date();
    var window_ = service[now.getDay()];
    var hour = now.getHours() + now.getMinutes() / 60;
    if (window_ && hour >= window_[0] && hour < window_[1]) {
      status.textContent = "Open now — last orders for the grill at " + window_[1] + ":00.";
    } else if (window_) {
      status.textContent = "Fires down. " + (hour < window_[0] ? "Doors open at " + window_[0] + ":00 today." : "Back tomorrow evening.");
    } else {
      status.textContent = "Closed Mondays while the hearth is rebuilt. Tuesday from 5 p.m.";
    }
  }

  /* ---------- 11. Today row in hours table ---------- */
  var hoursTable = document.querySelector("[data-hours-table]");
  if (hoursTable) {
    var day = new Date().getDay();
    var rows = hoursTable.querySelectorAll("[data-day]");
    Array.prototype.forEach.call(rows, function (row) {
      if (parseInt(row.getAttribute("data-day"), 10) === day) {
        row.classList.add("is-today");
        var marker = document.createElement("span");
        marker.textContent = "Today";
        marker.style.cssText =
          "margin-left:12px;font-size:.6rem;letter-spacing:.24em;text-transform:uppercase;color:#ff8f45";
        row.querySelector("th").appendChild(marker);
      }
    });
  }

  /* ---------- 12. Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
