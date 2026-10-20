/* Chapter & Verse — shared behaviour
   Signature motion: 3D Card Tilt (mousemove, lerped) + Spring Accordion (0fr -> 1fr)
   Everything is guarded by element-existence checks.
*/
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */
  var toggle = document.querySelector(".nav__toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) closeNav();
    });
  }

  /* ---------------------------------------------------------
     Signature motion 1 — 3D Card Tilt
     rotateX/rotateY up to 8 degrees, lerped in rAF,
     glare highlight tracks the pointer, flat reset on leave.
     --------------------------------------------------------- */
  var MAX_TILT = 8;

  function makeTilt(card) {
    var glare = card.querySelector(".glare");
    var target = { rx: 0, ry: 0, gx: 50, gy: 50 };
    var current = { rx: 0, ry: 0 };
    var frame = null;
    var active = false;
    var inView = true;

    function apply() {
      current.rx += (target.rx - current.rx) * 0.14;
      current.ry += (target.ry - current.ry) * 0.14;

      if (!active && Math.abs(current.rx) < 0.05 && Math.abs(current.ry) < 0.05) {
        current.rx = 0;
        current.ry = 0;
        card.style.transform = "";
        card.classList.remove("is-tilting");
        frame = null;
        return;
      }

      card.style.transform =
        "perspective(900px) rotateX(" + current.rx.toFixed(2) + "deg) rotateY(" +
        current.ry.toFixed(2) + "deg) translateZ(0)";

      if (Math.abs(target.rx - current.rx) < 0.02 && Math.abs(target.ry - current.ry) < 0.02) {
        frame = null;
        if (!active) card.classList.remove("is-tilting");
        return;
      }
      frame = requestAnimationFrame(apply);
    }

    function start() {
      if (frame === null) frame = requestAnimationFrame(apply);
    }

    card.addEventListener("pointerenter", function (e) {
      if (reduced || e.pointerType === "touch" || !inView) return;
      active = true;
      card.classList.add("is-tilting");
      start();
    });

    card.addEventListener("pointermove", function (e) {
      if (!active) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      target.ry = (px - 0.5) * 2 * MAX_TILT;
      target.rx = (0.5 - py) * 2 * MAX_TILT;
      if (glare) {
        glare.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        glare.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      }
      start();
    });

    function reset() {
      active = false;
      target.rx = 0;
      target.ry = 0;
      card.classList.remove("is-tilting");
      start();
    }

    card.addEventListener("pointerleave", reset);
    card.addEventListener("blur", reset, true);
    window.addEventListener("scroll", function () { if (active) reset(); }, { passive: true });

    /* Only tilt cards that are near the viewport. */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          inView = en.isIntersecting;
          if (!inView && active) reset();
        });
      }, { rootMargin: "120px" });
      io.observe(card);
    }
  }

  var tiltCards = document.querySelectorAll("[data-tilt]");
  for (var i = 0; i < tiltCards.length; i++) makeTilt(tiltCards[i]);

  /* ---------------------------------------------------------
     Signature motion 2 — Spring Accordion
     grid-template-rows 0fr -> 1fr, chevron rotates 180deg,
     one panel open at a time.
     --------------------------------------------------------- */
  var accordions = document.querySelectorAll("[data-accordion]");

  for (var a = 0; a < accordions.length; a++) {
    (function (group) {
      var items = group.querySelectorAll(".accordion__item");

      function collapseAll(except) {
        for (var k = 0; k < items.length; k++) {
          if (items[k] === except) continue;
          items[k].classList.remove("is-open");
          var b = items[k].querySelector(".accordion__head");
          if (b) b.setAttribute("aria-expanded", "false");
        }
      }

      group.addEventListener("click", function (e) {
        var head = e.target.closest(".accordion__head");
        if (!head || !group.contains(head)) return;
        var item = head.closest(".accordion__item");
        var open = item.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) collapseAll(item);
      });
    })(accordions[a]);
  }

  /* ---------------------------------------------------------
     books.html — genre filter over the CSS spine shelf
     --------------------------------------------------------- */
  var filterBar = document.getElementById("genre-filters");
  var shelf = document.getElementById("shelf");

  if (filterBar && shelf) {
    var spines = shelf.querySelectorAll(".spine");
    var cases = shelf.querySelectorAll(".shelf__case");
    var count = document.getElementById("shelf-count");
    var filterButtons = filterBar.querySelectorAll(".filter");

    function applyFilter(genre) {
      var shown = 0;
      for (var s = 0; s < spines.length; s++) {
        var sp = spines[s];
        var match = genre === "all" || sp.getAttribute("data-genre") === genre;
        sp.setAttribute("data-hidden", match ? "false" : "true");
        if (match) shown++;
      }
      for (var c = 0; c < cases.length; c++) {
        var caseMatch = genre === "all" || cases[c].getAttribute("data-genre") === genre;
        cases[c].setAttribute("data-hidden", caseMatch ? "false" : "true");
      }
      for (var f = 0; f < filterButtons.length; f++) {
        filterButtons[f].setAttribute("aria-pressed",
          filterButtons[f].getAttribute("data-genre") === genre ? "true" : "false");
      }
      if (count) {
        count.textContent = shown + (shown === 1 ? " volume" : " volumes") +
          (genre === "all" ? " on the shelves" : " in " + labelFor(genre));
      }
    }

    function labelFor(genre) {
      for (var f = 0; f < filterButtons.length; f++) {
        if (filterButtons[f].getAttribute("data-genre") === genre) {
          return filterButtons[f].textContent.trim();
        }
      }
      return genre;
    }

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      applyFilter(btn.getAttribute("data-genre"));
    });

    applyFilter("all");
  }

  /* ---------------------------------------------------------
     books.html — selected spine detail stage
     --------------------------------------------------------- */
  var stage = document.getElementById("spine-stage");

  if (stage) {
    var sTitle = stage.querySelector("[data-stage='title']");
    var sAuthor = stage.querySelector("[data-stage='author']");
    var sBlurb = stage.querySelector("[data-stage='blurb']");
    var sMeta = stage.querySelectorAll("[data-stage-meta]");
    var allSpines = document.querySelectorAll(".spine");

    for (var p = 0; p < allSpines.length; p++) {
      allSpines[p].addEventListener("click", function () {
        for (var q = 0; q < allSpines.length; q++) allSpines[q].classList.remove("is-selected");
        this.classList.add("is-selected");
        if (sTitle) sTitle.textContent = this.getAttribute("data-title");
        if (sAuthor) sAuthor.textContent = this.getAttribute("data-author");
        if (sBlurb) sBlurb.textContent = this.getAttribute("data-blurb");
        if (sMeta.length >= 3) {
          sMeta[0].textContent = this.getAttribute("data-genre-label");
          sMeta[1].textContent = this.getAttribute("data-year");
          sMeta[2].textContent = this.getAttribute("data-price");
        }
      });
    }

    if (allSpines.length) allSpines[0].click();
  }

  /* ---------------------------------------------------------
     Form validation (book club signup + newsletter strips)
     --------------------------------------------------------- */
  function validateField(field) {
    var inputs = field.querySelectorAll("input, select, textarea");
    if (!inputs.length) return true;

    var wrap = field.closest(".field") || field;
    var msg = wrap.querySelector(".error");
    var input = inputs[0];
    var value;

    if (input.type === "radio") {
      var checked = field.querySelector('input[name="' + input.name + '"]:checked');
      value = checked ? checked.value : "";
    } else if (input.type === "checkbox") {
      value = input.checked ? "yes" : "";
    } else {
      value = input.value.trim();
    }

    var required = !!field.querySelector("[data-required]");
    var problem = "";

    if (required && !value) {
      problem = input.getAttribute("data-empty") || "This field is required.";
    } else if (value && input.type === "email") {
      var ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
      if (!ok) problem = "Enter a valid email address, for example reader@example.com.";
    } else if (value && input.hasAttribute("data-words")) {
      var need = parseInt(input.getAttribute("data-words"), 10);
      if (value.split(/\s+/).filter(Boolean).length < need) {
        problem = input.getAttribute("data-words-msg") || ("Please write at least " + need + " words.");
      }
    }

    wrap.setAttribute("data-invalid", problem ? "true" : "false");
    if (input.setCustomValidity) input.setCustomValidity(problem);
    if (msg) msg.textContent = problem;
    return !problem;
  }

  var forms = document.querySelectorAll("[data-validate]");

  for (var g = 0; g < forms.length; g++) {
    (function (form) {
      var fields = form.querySelectorAll("[data-field]");
      var status = form.querySelector(".form__status");

      for (var m = 0; m < fields.length; m++) {
        (function (field) {
          var input = field.querySelector("input, select, textarea");
          if (!input) return;
          input.addEventListener("blur", function () { validateField(field); });
          input.addEventListener("input", function () {
            if ((field.closest(".field") || field).getAttribute("data-invalid") === "true") {
              validateField(field);
            }
          });
        })(fields[m]);
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstBad = null;
        for (var n = 0; n < fields.length; n++) {
          if (!validateField(fields[n]) && !firstBad) firstBad = fields[n];
        }
        if (firstBad) {
          var focusable = firstBad.querySelector("input, select, textarea");
          if (status) {
            status.setAttribute("data-tone", "err");
            status.textContent = "Check the highlighted fields and try again.";
          }
          if (focusable) focusable.focus();
          return;
        }

        var name = form.querySelector("[data-name='fullname']");
        var who = name && name.value.trim() ? name.value.trim().split(/\s+/)[0] : "there";
        if (status) {
          status.setAttribute("data-tone", "ok");
          status.textContent = "Thank you, " + who + ". We have saved your details and will write within two working days.";
        }
        form.reset();
        var stillInvalid = form.querySelectorAll("[data-invalid='true']");
        for (var r = 0; r < stillInvalid.length; r++) {
          stillInvalid[r].removeAttribute("data-invalid");
        }
      });
    })(forms[g]);
  }

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  var years = document.querySelectorAll("[data-year-now]");
  for (var y = 0; y < years.length; y++) {
    years[y].textContent = new Date().getFullYear();
  }
})();
