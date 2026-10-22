/* Chapter & Verse — shared behaviour
   Signature motion: scroll progress bar + animated counters.
   Page features: mobile nav, genre filter, spine detail drawer, club signup. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- mobile navigation ---------------- */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- scroll progress (signature motion) ---------------- */

  var bar = document.querySelector(".scroll-progress__bar");

  if (bar) {
    var pending = false;

    var paint = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      pending = false;
    };

    var onScroll = function () {
      if (!pending) {
        pending = true;
        window.requestAnimationFrame(paint);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    paint();
  }

  /* ---------------- animated counters (signature motion) ---------------- */

  var counters = document.querySelectorAll("[data-count]");

  if (counters.length) {
    var easeOutExpo = function (t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    var format = function (node, value) {
      var decimals = Number(node.getAttribute("data-decimals") || 0);
      var prefix = node.getAttribute("data-prefix") || "";
      var suffix = node.getAttribute("data-suffix") || "";
      var text = value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      node.textContent = prefix + text + suffix;
    };

    var run = function (node) {
      var target = Number(node.getAttribute("data-count"));
      var duration = 1200;

      if (reduceMotion) {
        format(node, target);
        return;
      }

      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var progress = Math.min((now - start) / duration, 1);
        format(node, target * easeOutExpo(progress));
        if (progress < 1) window.requestAnimationFrame(step);
        else format(node, target);
      };
      window.requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var seen = new WeakSet();
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !seen.has(entry.target)) {
              seen.add(entry.target);
              run(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.35, rootMargin: "0px 0px -5% 0px" }
      );

      counters.forEach(function (node) {
        format(node, 0);
        counterObserver.observe(node);
      });
    } else {
      counters.forEach(function (node) {
        format(node, Number(node.getAttribute("data-count")));
      });
    }
  }

  /* ---------------- books page: genre filter + spine detail ---------------- */

  var BOOKS = {
    "middlemarch": {
      title: "Middlemarch",
      author: "George Eliot",
      genre: "Fiction",
      press: "Penguin Classics, 2003",
      format: "Paperback · 928 pp.",
      price: "$16.00",
      shelf: "Fiction E-L-I · Bay 3, Victorian rail",
      note: "Read it twice and you will disagree with yourself about Dorothea both times. A whole town in five volumes of prose; our staff poll names it the best thing on the ground floor."
    },
    "pride": {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      genre: "Fiction",
      press: "Oxford World's Classics, 2008",
      format: "Paperback · 448 pp.",
      price: "$13.50",
      shelf: "Fiction A-U-S · Bay 1, always restocked",
      note: "Our best-selling spine for sixteen years running. The Oxford edition has the fullest notes; the 1946 Modern Library in the case is yours for considerably more."
    },
    "janeyre": {
      title: "Jane Eyre",
      author: "Charlotte Brontë",
      genre: "Fiction",
      press: "Norton Critical Edition, 2001",
      format: "Paperback · 608 pp.",
      price: "$18.00",
      shelf: "Fiction B-R-O · Bay 1, Gothic corner",
      note: "Bring a torch for the red room and an appetite for the first chapter. Norton's essays on the madwoman debate are worth the extra two pounds of book."
    },
    "wuthering": {
      title: "Wuthering Heights",
      author: "Emily Brontë",
      genre: "Fiction",
      press: "Penguin Classics, 1995",
      format: "Paperback · 454 pp.",
      price: "$15.00",
      shelf: "Fiction B-R-O · Bay 1, Gothic corner",
      note: "Nobody in this shop has ever finished it in one sitting without going outside afterwards. Onyx cloth cover, cream endsheets, and Jellicoe's introduction."
    },
    "mobydick": {
      title: "Moby-Dick",
      author: "Herman Melville",
      genre: "Fiction",
      press: "Northwestern–Newberry, 2014",
      format: "Clothbound · 742 pp.",
      price: "$34.00",
      shelf: "American · Bay 5, scholarly shelf",
      note: "The scholarly text with the marginal Concordance. Our copy on the reading table has survived four winters of open-fire-side handling and one very determined cat."
    },
    "beloved": {
      title: "Beloved",
      author: "Toni Morrison",
      genre: "Fiction",
      press: "Knopf reprint, 2004",
      format: "Paperback · 324 pp.",
      price: "$15.50",
      shelf: "American · Bay 5, above the bench",
      note: "Shelved where everyone can reach it, not where it can be missed. Read the afterword Morrison wrote for the 1987 anniversary — it reorganises the whole novel."
    },
    "name-rose": {
      title: "The Name of the Rose",
      author: "Umberto Eco",
      genre: "Mystery",
      press: "Harvest, 1994",
      format: "Paperback · 536 pp.",
      price: "$17.00",
      shelf: "Mystery · Bay 7, abbey rail",
      note: "A detective story about semiotics that also works as a very good cold-weather mystery. We sell the most copies in October, and we think that is correct."
    },
    "gaudy": {
      title: "Gaudy Night",
      author: "Dorothy L. Sayers",
      genre: "Mystery",
      press: "New York Review Books, 2011",
      format: "Paperback · 400 pp.",
      price: "$16.50",
      shelf: "Mystery · Bay 7, scholarly crime",
      note: "The one where the mystery is a woman's work and a marriage, at a college that has been poisoned against its own scholars. Harriet and Peter argue better than anyone."
    },
    "secret-history": {
      title: "The Secret History",
      author: "Donna Tartt",
      genre: "Mystery",
      press: "Everyman's Library, 2017",
      format: "Clothbound · 559 pp.",
      price: "$26.00",
      shelf: "Mystery · Bay 7, cloth rail",
      note: "Everyone in this town has read it; half of them read it while it was happening upstairs. Great house edition, sewn binding, and a ribbon that actually holds."
    },
    "lefthand": {
      title: "The Left Hand of Darkness",
      author: "Ursula K. Le Guin",
      genre: "Science Fiction",
      press: "Science Fiction Book Club cloth, 1969",
      format: "Clothbound · 304 pp.",
      price: "$22.00",
      shelf: "Science Fiction · Bay 9, ice shelf",
      note: "Our oldest working copy on the genre wall, with the original Gethen map. Le Guin's foreword on the anthropologist's voice is a small masterclass by itself."
    },
    "dune": {
      title: "Dune",
      author: "Frank Herbert",
      genre: "Science Fiction",
      press: "Chilton Book Co., first trade issue",
      format: "Clothbound · 432 pp.",
      price: "$240.00",
      shelf: "Rare Room · Case 2, rear rail",
      note: "House ads intact, spine unbled, a quarter-inch square off the front board. Priced honestly; the later Harvest paperback lives on the genre wall for eleven dollars."
    },
    "frankenstein": {
      title: "Frankenstein",
      author: "Mary Shelley",
      genre: "Science Fiction",
      press: "Broadview, 2002",
      format: "Paperback · 310 pp.",
      price: "$14.50",
      shelf: "Science Fiction · Bay 9, origin shelf",
      note: "The 1818 text, which is meaner and better than the version most people remember. Poole's introduction on the Swiss summer is the reason we stock this edition."
    },
    "piranesi": {
      title: "Piranesi",
      author: "Susanna Clarke",
      genre: "Fantasy",
      press: "Bloomsbury, 2020",
      format: "Paperback · 245 pp.",
      price: "$15.00",
      shelf: "Fantasy · Bay 11, house of tides",
      note: "We hand this to anyone who says they do not read fantasy anymore. It is short, exact, and kind, and the tide tables in the margins hold up on a second pass."
    },
    "hobbit": {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      genre: "Fantasy",
      press: "George Allen & Unwin, 1951 reprint",
      format: "Clothbound · 320 pp.",
      price: "$95.00",
      shelf: "Rare Room · Case 1, children's rail",
      note: "The edition with the colour plates you remember from being nine. Sound hinges, one namesake on the flyleaf, and a price we will revisit if the market does."
    },
    "wild-iris": {
      title: "The Wild Iris",
      author: "Louise Glück",
      genre: "Poetry",
      press: "Carcaner Press, 2017",
      format: "Paperback · 84 pp.",
      price: "$13.00",
      shelf: "Poetry · Bay 2, thin spines",
      note: "Voices of God, of the garden, of the flower. We keep it beside the door with the other books you can read in one walk home and then never put down."
    },
    "leaves": {
      title: "Leaves of Grass",
      author: "Walt Whitman",
      genre: "Poetry",
      press: "Penguin Classics, 2004",
      format: "Paperback · 624 pp.",
      price: "$18.50",
      shelf: "Poetry · Bay 2, the long shelf",
      note: "The 1891–92 final text. Read 'Crossing Brooklyn Ferry' out loud somewhere the staff can hear you; it has happened twice this year and both times the shop went quiet."
    },
    "just-kids": {
      title: "Just Kids",
      author: "Patti Smith",
      genre: "Memoir",
      press: "Harper, 2010",
      format: "Paperback · 304 pp.",
      price: "$16.00",
      shelf: "Memoir · Bay 13, artists' quarter",
      note: "The best argument for being poor and wrong in the right city ever written. Photographs of Mapplethorpe's early work, and a chapter on a dog we all quote."
    },
    "room-ones-own": {
      title: "A Room of One's Own",
      author: "Virginia Woolf",
      genre: "Memoir",
      press: "Hogarth Press facsimile, 1992",
      format: "Paperback · 160 pp.",
      price: "$21.00",
      shelf: "Memoir · Bay 13, essay rail",
      note: "The facsimile of the 1929 Hogarth printing, including Woolf's own running heads. We sell one a fortnight and always to somebody who is about to start something."
    }
  };

  var shelf = document.getElementById("shelf");
  var filterGroup = document.getElementById("genre-filters");

  if (shelf && filterGroup) {
    var spines = Array.prototype.slice.call(shelf.querySelectorAll(".spine-book"));
    var chips = Array.prototype.slice.call(filterGroup.querySelectorAll(".chip"));
    var countOut = document.getElementById("shelf-count");
    var detail = document.getElementById("book-detail");
    var detailBody = document.getElementById("book-detail-body");
    var activeSpine = null;

    var say = function (message) {
      if (countOut) countOut.textContent = message;
    };

    var filterBy = function (genre) {
      var shown = 0;
      spines.forEach(function (btn) {
        var match = genre === "all" || btn.getAttribute("data-genre") === genre;
        btn.classList.toggle("is-hidden", !match);
        btn.setAttribute("tabindex", match ? "0" : "-1");
        if (match) shown += 1;
      });

      if (activeSpine && activeSpine.classList.contains("is-hidden")) closeDetail();
      say(
        shown === spines.length
          ? "All " + shown + " spines on this rail."
          : "Showing " + shown + " of " + spines.length + " spines."
      );
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === chip));
        });
        filterBy(chip.getAttribute("data-genre"));
      });
    });

    var closeDetail = function () {
      if (!detail) return;
      detail.hidden = true;
      if (activeSpine) {
        activeSpine.setAttribute("aria-expanded", "false");
        activeSpine = null;
      }
    };

    var openDetail = function (btn) {
      var book = BOOKS[btn.getAttribute("data-book")];
      if (!book || !detail || !detailBody) return;

      if (activeSpine === btn) {
        closeDetail();
        return;
      }
      if (activeSpine) activeSpine.setAttribute("aria-expanded", "false");

      activeSpine = btn;
      btn.setAttribute("aria-expanded", "true");

      var bookColor = "spine-" + (btn.getAttribute("data-color") || "burgundy");

      detailBody.innerHTML =
        '<div class="book-detail__card ' + bookColor + '">' +
        "<h3>" + book.title + "</h3>" +
        "<p>" + book.author + "</p>" +
        "</div>" +
        '<div><p class="eyebrow">' +
        book.genre +
        " · Shelved in the open shop</p><dl>" +
        "<dt>Author</dt><dd>" +
        book.author +
        "</dd><dt>Edition</dt><dd>" +
        book.press +
        "</dd><dt>Format</dt><dd>" +
        book.format +
        "</dd><dt>Price</dt><dd>" +
        book.price +
        "</dd><dt>Shelf mark</dt><dd>" +
        book.shelf +
        "</dd></dl>" +
        "<h4>From the staff card</h4><p>" +
        book.note +
        "</p>" +
        '<p class="hand">Ask at the desk and we will put it aside for you until closing.</p></div>';

      detail.hidden = false;
      detail.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    };

    spines.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDetail(btn);
      });
    });

    var clear = document.getElementById("clear-detail");
    if (clear) {
      clear.addEventListener("click", function () {
        closeDetail();
      });
    }

    filterBy("all");
  }

  /* ---------------- book club signup ---------------- */

  var clubForm = document.getElementById("club-form");

  if (clubForm) {
    var firstName = function (value) {
      return (value || "").trim().split(/\s+/)[0] || "friend";
    };
    var status = document.getElementById("form-status");
    var summary = document.getElementById("error-summary");
    var summaryList = document.getElementById("error-list");

    var rules = {
      "full-name": {
        label: "Your name",
        test: function (v) {
          return v.trim().length >= 2;
        },
        message: "Tell us the name we should write on the shelf card."
      },
      email: {
        label: "Email address",
        test: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
        },
        message: "Enter an email address we can send the reading list to."
      },
      club: {
        label: "Reading circle",
        test: function (v) {
          return v !== "";
        },
        message: "Choose the circle you would like to join, or 'Any circle'."
      },
      window: {
        label: "Meeting window",
        test: function () {
          return Boolean(clubForm.querySelector('input[name="window"]:checked'));
        },
        message: "Pick at least one window you can meet in."
      },
      consent: {
        label: "Shop news consent",
        test: function () {
          var box = clubForm.querySelector('#consent');
          return box && box.checked;
        },
        message: "Please confirm you are happy for us to email you about the circle."
      }
    };

    var fieldOf = function (input) {
      return input.closest(".field") || input.closest("fieldset");
    };

    var setError = function (key, show) {
      var input = clubForm.querySelector('[name="' + key + '"]');
      if (!input) return;
      var field = fieldOf(input);
      if (!field) return;
      field.classList.toggle("is-invalid", show);
      var msg = field.querySelector(".field__error");
      if (msg) msg.setAttribute("role", show ? "alert" : "presentation");
      input.setAttribute("aria-invalid", show ? "true" : "false");
    };

    var validate = function (key) {
      var rule = rules[key];
      if (!rule) return true;
      var input = clubForm.querySelector('[name="' + key + '"]');
      var ok = rule.test(input ? input.value : "");
      setError(key, !ok);
      return ok;
    };

    Object.keys(rules).forEach(function (key) {
      var inputs = clubForm.querySelectorAll('[name="' + key + '"]');
      Array.prototype.forEach.call(inputs, function (input) {
        input.addEventListener("blur", function () {
          if (input.type === "radio" || input.type === "checkbox") {
            validate(key);
          } else if (input.value !== "") {
            validate(key);
          }
        });
        input.addEventListener("input", function () {
          var field = fieldOf(input);
          if (field && field.classList.contains("is-invalid")) validate(key);
        });
        input.addEventListener("change", function () {
          if (input.type === "radio" || input.type === "checkbox" || input.tagName === "SELECT") {
            validate(key);
          }
        });
      });
    });

    clubForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var keys = Object.keys(rules);
      var bad = keys.filter(function (key) {
        return !validate(key);
      });

      if (bad.length) {
        if (summary && summaryList) {
          summaryList.innerHTML = bad
            .map(function (key) {
              return (
                '<li><a href="#' +
                key +
                '">' +
                rules[key].label +
                " — " +
                rules[key].message +
                "</a></li>"
              );
            })
            .join("");
          summary.hidden = false;
          summary.focus();
        }
        var first = clubForm.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea");
        if (first) first.focus();
        if (status) status.hidden = true;
        return;
      }

      if (summary) summary.hidden = true;

      var name = firstName(clubForm.querySelector('[name="full-name"]').value);
      var club = clubForm.querySelector('[name="club"]');
      var clubName = club.options[club.selectedIndex].text;
      var guests = Number(clubForm.querySelector('[name="guests"]').value || 0);

      if (status) {
        status.textContent = "";
        var heading = document.createElement("h3");
        heading.textContent = "Seat held, " + name + ".";
        var line = document.createElement("p");
        line.append(
          "You are on the list for ",
          Object.assign(document.createElement("strong"), { textContent: clubName }),
          guests > 0 ? " plus " + guests + " guest" + (guests > 1 ? "s" : "") : "",
          ". Nora emails within two working days with the first month's chapter list and the code for the back door. Bring a mug if you like ours less than yours."
        );
        status.append(heading, line);
        status.hidden = false;
        status.focus();
      }

      clubForm.reset();
      Object.keys(rules).forEach(function (key) {
        setError(key, false);
      });
    });
  }

  /* ---------------- footer newsletter ---------------- */

  var newsletter = document.getElementById("newsletter-form");

  if (newsletter) {
    var note = document.getElementById("newsletter-note");
    newsletter.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = newsletter.querySelector('input[type="email"]');
      if (!input || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
        if (note) {
          note.textContent = "That address looks incomplete — check it and try again.";
          note.hidden = false;
        }
        if (input) input.focus();
        return;
      }
      if (note) {
        note.textContent = "Thank you. The next shelf list goes out on the first Thursday.";
        note.hidden = false;
      }
      newsletter.reset();
    });
  }

  /* ---------------- year stamp ---------------- */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
