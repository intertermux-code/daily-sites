/* ==========================================================================
   Chapter & Verse — shared behaviour
   Motion: scroll progress (primary) + hero parallax layers (secondary).
   Structure: Card Deck fan-out. All guarded by element-existence checks.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var navList = document.getElementById("primary-nav");

  if (toggle && navList) {
    var closeNav = function () {
      navList.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", function () {
      var open = navList.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navList.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });

    navList.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 991) closeNav();
    });
  }

  /* ---------- 2. Scroll progress bar + parallax (single rAF handler) ---------- */
  var bar = document.querySelector(".scroll-progress");
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));

  if (bar || layers.length) {
    var ticking = false;
    var viewportHeight = window.innerHeight;
    var docEl = document.documentElement;

    var render = function () {
      var y = window.pageYOffset || docEl.scrollTop || 0;

      if (bar) {
        var max = docEl.scrollHeight - viewportHeight;
        var pct = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
        bar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
      }

      if (layers.length && !reduceMotion) {
        for (var i = 0; i < layers.length; i++) {
          var el = layers[i];
          var host = el.closest(".hero") || el.parentNode || docEl;
          var box = typeof host.getBoundingClientRect === "function" ? host.getBoundingClientRect() : null;
          var offset = 0;
          if (box) {
            var progress = (viewportHeight - box.top) / (viewportHeight + box.height);
            offset = (progress - 0.5) * 120 * parseFloat(el.getAttribute("data-speed") || "0");
          }
          el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
        }
      }
      ticking = false;
    };

    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(render);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      viewportHeight = window.innerHeight;
      onScroll();
    });
    render();
  }

  /* ---------- 3. Card Deck fan-out ---------- */
  var decks = document.querySelectorAll(".deck");

  if (decks.length) {
    Array.prototype.forEach.call(decks, function (deck) {
      var cards = deck.querySelectorAll(".deck-card");
      deck.style.setProperty("--n", cards.length);
      Array.prototype.forEach.call(cards, function (card, i) {
        card.style.setProperty("--i", i);
      });
    });

    if ("IntersectionObserver" in window && !reduceMotion) {
      var deckObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-fanned");
            deckObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      Array.prototype.forEach.call(decks, function (deck) {
        deckObserver.observe(deck);
      });
    } else {
      Array.prototype.forEach.call(decks, function (deck) {
        deck.classList.add("is-fanned");
      });
    }
  }

  /* ---------- 4. Section rules draw in as they are met ---------- */
  var ruled = document.querySelectorAll(".section--ruled, .deck-head");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var ruleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-set");
          ruleObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(ruled, function (el) { ruleObserver.observe(el); });
  } else {
    Array.prototype.forEach.call(ruled, function (el) { el.classList.add("is-set"); });
  }

  /* ---------- 5. books.html — genre filter ---------- */
  var filterBar = document.querySelector(".filter-bar");
  var shelf = document.querySelector(".shelf");

  if (filterBar && shelf) {
    var buttons = filterBar.querySelectorAll(".filter-btn");
    var books = shelf.querySelectorAll(".book");
    var countOut = document.getElementById("shelf-count");

    var applyFilter = function (genre, button) {
      var shown = 0;

      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute("aria-pressed", b === button ? "true" : "false");
      });

      Array.prototype.forEach.call(books, function (book) {
        var match = genre === "all" || book.dataset.genre === genre;
        book.hidden = !match;
        if (match) shown++;
      });

      if (countOut) {
        countOut.textContent = shown === 1
          ? "Showing 1 of " + books.length + " titles — " + genre.toLowerCase() + " shelf"
          : "Showing " + shown + " of " + books.length + " titles — " + (genre === "all" ? "the whole shelf" : genre.toLowerCase() + " shelf");
      }
    };

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      applyFilter(btn.dataset.genre || "all", btn);
    });

    applyFilter("all", filterBar.querySelector('.filter-btn[data-genre="all"]') || buttons[0]);
  }

  /* ---------- 6. book-club.html — signup validation ---------- */
  var form = document.getElementById("club-form");

  if (form) {
    var success = document.getElementById("form-success");
    var status = document.getElementById("form-status");
    var summary = document.getElementById("error-summary");
    var summaryList = summary ? summary.querySelector("ul") : null;

    var showError = function (field, message) {
      var input = form.querySelector('[name="' + field + '"]');
      if (!input) return;
      var error = document.getElementById(input.id + "-error");
      input.setAttribute("aria-invalid", "true");
      if (error) {
        error.textContent = message;
        error.classList.add("is-active");
      }
    };

    var clearError = function (field) {
      var input = form.querySelector('[name="' + field + '"]');
      if (!input) return;
      var error = document.getElementById(input.id + "-error");
      input.removeAttribute("aria-invalid");
      if (error) {
        error.textContent = "";
        error.classList.remove("is-active");
      }
    };

    var validators = {
      name: function (v) { return v.trim().length >= 2 ? "" : "Please tell us the name on the membership card."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter an email address we can reach you at."; },
      phone: function (v) {
        if (!v.trim()) return "";
        return /^[0-9+().\-\s]{7,20}$/.test(v.trim()) ? "" : "Use digits, spaces, dashes or parentheses only.";
      },
      shelf: function (v) { return v ? "" : "Choose the shelf you drift towards first."; },
      meeting: function () {
        return form.querySelector('input[name="meeting"]:checked') ? "" : "Pick at least one evening you can come to.";
      },
      title: function (v) {
        return v.trim().length >= 2 ? "" : "Tell us what you are reading — anything counts, even a reread.";
      },
      consent: function () {
        return form.querySelector('[name="consent"]').checked ? "" : "We need your permission before we can write to you.";
      }
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = [];

      Object.keys(validators).forEach(function (field) {
        var input = form.querySelector('[name="' + field + '"]');
        if (!input) return;
        var message = validators[field](input.value || "");
        if (message) {
          showError(field, message);
          problems.push({ field: field, label: input.closest(".field, .fieldset") ? (input.closest(".field, .fieldset").querySelector("label, legend") || {}).textContent || field : field, message: message, id: input.id });
        } else {
          clearError(field);
        }
      });

      if (problems.length) {
        if (success) success.hidden = true;
        if (summary && summaryList) {
          while (summaryList.firstChild) summaryList.removeChild(summaryList.firstChild);
          problems.forEach(function (p) {
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.href = "#" + p.id;
            a.textContent = String(p.label || p.field).replace(":", "").trim() + " — " + p.message;
            li.appendChild(a);
            summaryList.appendChild(li);
          });
          summary.hidden = false;
          summary.focus();
        }
        return;
      }

      if (summary) summary.hidden = true;

      if (success) {
        var nameInput = form.querySelector('[name="name"]');
        var emailInput = form.querySelector('[name="email"]');
        var shelfInput = form.querySelector('[name="shelf"]');
        var titleInput = form.querySelector('[name="title"]');
        var first = nameInput.value.trim().split(/\s+/)[0];
        var shelfText = shelfInput && shelfInput.selectedIndex > -1
          ? shelfInput.options[shelfInput.selectedIndex].text
          : "nearest";
        var shelfName = shelfText.split("—").pop().trim().toLowerCase() || "nearest";
        var seat = document.getElementById("summary-seat");
        if (seat) {
          seat.textContent = "Thank you, " + first + ". We have you down for the " + shelfName
            + " table, and a confirmation is on its way to " + emailInput.value.trim() + ".";
        }
        var read = document.getElementById("summary-read");
        if (read) read.textContent = "Your current read — “" + titleInput.value.trim() + "” — goes on the next round-table list.";
        var mail = document.getElementById("summary-mail");
        if (mail) mail.textContent = "We will answer within two working days from the Marlowe Street desk.";
        success.hidden = false;
        if (status) status.textContent = "Membership request received.";
        var heading = success.querySelector("h3");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
        form.reset();
      }
    });

    form.addEventListener("input", function (e) {
      var name = e.target.name;
      if (name && validators[name]) clearError(name);
      if (name === "meeting") clearError("meeting");
    });
  }

  /* ---------- 7. Footer year ---------- */
  var yearOut = document.querySelectorAll("[data-year]");
  Array.prototype.forEach.call(yearOut, function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
