/* ==========================================================================
   Verdant — shared behaviour
   Vanilla JS, no dependencies. Every block is guarded by element checks so
   the same file can sit on every page.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------------------------------------------------------------------- *
   * Catalogue
   * ---------------------------------------------------------------------- */
  var PX = "https://images.pexels.com/photos/";

  function img(id) {
    return PX + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=900";
  }

  var PRODUCTS = [
    {
      id: "cleansing-gel",
      name: "Leaf & Stem Cleansing Gel",
      cat: "cleanse",
      step: "Step 01 — Cleanse",
      price: 38,
      size: "150 ml",
      img: img("15879365"),
      alt: "White pump bottle of cleansing gel with a green label, resting beside a white rose on a pale textured surface."
    },
    {
      id: "enzyme-polish",
      name: "Enzyme Reset Polish",
      cat: "cleanse",
      step: "Step 02 — Reset",
      price: 34,
      size: "60 g",
      img: img("18350885"),
      alt: "Low white jar with a black lid balanced on a block of veined green marble against a dark backdrop."
    },
    {
      id: "niacinamide-serum",
      name: "Clarifying Niacinamide Serum",
      cat: "treat",
      step: "Step 03 — Treat",
      price: 64,
      size: "30 ml",
      img: img("31251033"),
      alt: "Small amber glass dropper bottle standing on a white surface with a soft shadow to one side."
    },
    {
      id: "fern-elixir",
      name: "Fern Recovery Elixir",
      cat: "treat",
      step: "Step 03 — Treat",
      price: 72,
      size: "30 ml",
      img: img("1502209"),
      alt: "Dark glass dropper bottle laid across bright green fern fronds on a pale surface."
    },
    {
      id: "calm-repair-oil",
      name: "Calm Repair Oil",
      cat: "treat",
      step: "Step 03 — Treat",
      price: 68,
      size: "30 ml",
      img: img("7796984"),
      alt: "Amber dropper bottle standing on a cork coaster with sprigs of dried white flowers beside it."
    },
    {
      id: "morning-dew-moisturiser",
      name: "Morning Dew Moisturiser",
      cat: "hydrate",
      step: "Step 04 — Hydrate",
      price: 58,
      size: "50 ml",
      img: img("18350286"),
      alt: "Matte white cream jar with a pale lid sitting on the corner of a white marble plinth."
    },
    {
      id: "night-bloom-oil",
      name: "Night Bloom Facial Oil",
      cat: "hydrate",
      step: "Step 05 — Seal",
      price: 82,
      size: "30 ml",
      img: img("7797439"),
      alt: "Amber glass dropper bottle on a warm beige surface with pale dried botanicals fanned behind it."
    },
    {
      id: "leaf-light-fluid",
      name: "Leaf Light Face Fluid",
      cat: "hydrate",
      step: "Step 04 — Hydrate",
      price: 46,
      size: "100 ml",
      img: img("7796456"),
      alt: "Clear bottle of pale green fluid standing on a round mirror, casting a leaf-shaped shadow."
    },
    {
      id: "sun-veil",
      name: "Sun Veil Fluid SPF 30",
      cat: "protect",
      step: "Step 06 — Protect",
      price: 44,
      size: "50 ml",
      img: img("7796315"),
      alt: "Slim bottle with a green dropper cap laid on a mirror with the shadow of a long leaf across it."
    },
    {
      id: "hand-balm",
      name: "Botanist Hand Balm",
      cat: "body",
      step: "Everyday — Hands",
      price: 32,
      size: "75 ml",
      img: img("7796813"),
      alt: "Black pump bottle surrounded by dried seed heads on a sandy beige background."
    },
    {
      id: "body-oil",
      name: "Aromatic Body Oil",
      cat: "body",
      step: "Everyday — Body",
      price: 54,
      size: "100 ml",
      img: img("7797443"),
      alt: "Amber bottle with a dropper resting on a grey stone disc beside dried flowers on a warm beige ground."
    }
  ];

  var BY_ID = {};
  PRODUCTS.forEach(function (p) {
    BY_ID[p.id] = p;
  });

  /* ---------------------------------------------------------------------- *
   * Money
   * ---------------------------------------------------------------------- */
  var FREE_SHIP_FROM = 60;
  var SHIP_FLAT = 6;

  function money(n) {
    return "$" + n.toFixed(2).replace(/\.00$/, "");
  }

  function money2(n) {
    return "$" + n.toFixed(2);
  }

  /* ---------------------------------------------------------------------- *
   * Cart state
   * ---------------------------------------------------------------------- */
  var KEY = "verdant.cart.v1";

  function readCart() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (line) {
        return line && BY_ID[line.id] && line.qty > 0;
      });
    } catch (err) {
      return [];
    }
  }

  function writeCart(lines) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch (err) {
      /* storage unavailable — cart stays in memory for this visit */
    }
  }

  var cart = readCart();

  function findLine(id) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) return cart[i];
    }
    return null;
  }

  function addToCart(id, qty) {
    if (!BY_ID[id]) return;
    var line = findLine(id);
    if (line) {
      line.qty += qty || 1;
    } else {
      cart.push({ id: id, qty: qty || 1 });
    }
    writeCart(cart);
    renderCart();
  }

  function setQty(id, qty) {
    var line = findLine(id);
    if (!line) return;
    if (qty <= 0) {
      cart = cart.filter(function (l) {
        return l.id !== id;
      });
    } else {
      line.qty = Math.min(qty, 20);
    }
    writeCart(cart);
    renderCart();
  }

  function cartCount() {
    return cart.reduce(function (n, l) {
      return n + l.qty;
    }, 0);
  }

  function cartSubtotal() {
    return cart.reduce(function (n, l) {
      return n + BY_ID[l.id].price * l.qty;
    }, 0);
  }

  /* ---------------------------------------------------------------------- *
   * Cart drawer
   * ---------------------------------------------------------------------- */
  var drawer = $("#cartDrawer");
  var scrim = $("#cartScrim");
  var linesHost = $("#cartLines");
  var footHost = $("#cartFoot");
  var openers = $$("[data-cart-open]");
  var lastFocus = null;

  function isOpen() {
    return drawer && drawer.classList.contains("is-open");
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("is-open");
    drawer.removeAttribute("aria-hidden");
    if (scrim) scrim.classList.add("is-open");
    document.body.classList.add("is-locked");
    var target = $("#cartClose") || $("button", drawer);
    if (target) target.focus();
  }

  function closeDrawer() {
    if (!drawer || !isOpen()) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) scrim.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function renderCart() {
    var n = cartCount();

    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
    });
    $$("[data-cart-open]").forEach(function (el) {
      el.setAttribute(
        "aria-label",
        "Open cart, " + n + (n === 1 ? " item" : " items")
      );
    });

    if (!linesHost || !footHost) return;

    if (!cart.length) {
      linesHost.innerHTML =
        '<div class="cart-empty"><h3>Your cart is empty</h3>' +
        "<p>Every formula ships with a 30-day skin promise. Start with the " +
        "three-step method and add what your skin asks for.</p>" +
        '<a class="btn btn--sage" href="shop.html">Browse the shop</a></div>';
      footHost.hidden = true;
      return;
    }

    linesHost.innerHTML = cart
      .map(function (line) {
        var p = BY_ID[line.id];
        return (
          '<article class="cart-line">' +
          '<div class="cart-line__media"><img src="' +
          p.img +
          '" width="450" height="600" alt="" loading="lazy"></div>' +
          "<div>" +
          '<h3 class="cart-line__name">' +
          p.name +
          "</h3>" +
          '<p class="cart-line__meta">' +
          p.size +
          " · " +
          money(p.price) +
          " each</p>" +
          '<div class="cart-line__bottom">' +
          '<div class="qty" role="group" aria-label="Quantity for ' +
          p.name +
          '">' +
          '<button type="button" data-dec="' +
          p.id +
          '" aria-label="Decrease quantity of ' +
          p.name +
          '">−</button>' +
          "<output>" +
          line.qty +
          "</output>" +
          '<button type="button" data-inc="' +
          p.id +
          '" aria-label="Increase quantity of ' +
          p.name +
          '">+</button>' +
          "</div>" +
          '<span class="price">' +
          money2(p.price * line.qty) +
          "</span>" +
          "</div>" +
          '<button type="button" class="line-remove" data-remove="' +
          p.id +
          '">Remove</button>' +
          "</div></article>"
        );
      })
      .join("");

    var sub = cartSubtotal();
    var ship = sub >= FREE_SHIP_FROM ? 0 : SHIP_FLAT;
    var note =
      sub >= FREE_SHIP_FROM
        ? "Carbon-neutral delivery is included."
        : "Add " +
          money2(FREE_SHIP_FROM - sub) +
          " for free carbon-neutral delivery.";

    footHost.hidden = false;
    footHost.innerHTML =
      '<p class="ship-note">' + note + "</p>" +
      '<dl class="totals">' +
      "<div><dt>Subtotal</dt><dd>" + money2(sub) + "</dd></div>" +
      "<div><dt>Delivery</dt><dd>" +
      (ship === 0 ? "Included" : money2(ship)) +
      "</dd></div>" +
      '<div class="totals__grand"><dt>Total</dt><dd>' +
      money2(sub + ship) +
      "</dd></div>" +
      "</dl>" +
      '<button type="button" class="btn btn--sage btn--block" data-checkout>Checkout securely</button>';
  }

  if (drawer) {
    openers.forEach(function (btn) {
      btn.addEventListener("click", openDrawer);
    });
    if (scrim) scrim.addEventListener("click", closeDrawer);
    $$("[data-cart-close]", drawer).forEach(function (btn) {
      btn.addEventListener("click", closeDrawer);
    });

    drawer.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !t.dataset) return;
      var incId = t.dataset.inc;
      var decId = t.dataset.dec;
      if (incId) {
        var incLine = findLine(incId);
        if (incLine) setQty(incId, incLine.qty + 1);
      }
      if (decId) {
        var decLine = findLine(decId);
        if (decLine) setQty(decId, decLine.qty - 1);
      }
      if (t.dataset.remove) {
        var gone = BY_ID[t.dataset.remove];
        setQty(t.dataset.remove, 0);
        showToast((gone ? gone.name : "Item") + " removed from cart");
      }
      if (t.dataset.checkout !== undefined) {
        showToast("Demo store — checkout is not wired to a payment provider.");
      }
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && isOpen()) closeDrawer();
      if (ev.key === "Tab" && isOpen()) {
        var focusables = $$(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
          drawer
        );
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------------------------------------------------------------------- *
   * Toast
   * ---------------------------------------------------------------------- */
  var toastEl = $("#toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    var text = $("[data-toast-text]", toastEl);
    if (text) text.textContent = message;
    toastEl.classList.add("is-shown");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-shown");
    }, 3600);
  }

  if (toastEl) {
    var toastClose = $("[data-toast-close]", toastEl);
    if (toastClose) {
      toastClose.addEventListener("click", function () {
        toastEl.classList.remove("is-shown");
      });
    }
  }

  /* ---------------------------------------------------------------------- *
   * Quick-add buttons (shop grid, bestsellers, quiz results)
   * ---------------------------------------------------------------------- */
  $$("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.dataset.add;
      addToCart(id, 1);
      var p = BY_ID[id];
      showToast((p ? p.name : "Product") + " added to cart");
      btn.classList.add("is-added");
      var original = btn.textContent;
      btn.textContent = "Added";
      window.setTimeout(function () {
        btn.classList.remove("is-added");
        btn.textContent = original;
      }, 1400);
    });
  });

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var btn = t.closest("[data-add-many]");
    if (!btn) return;
    var ids = (btn.getAttribute("data-add-many") || "")
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (id) {
        return Boolean(BY_ID[id]);
      });
    if (!ids.length) return;
    ids.forEach(function (id) {
      addToCart(id, 1);
    });
    showToast(ids.length + " products added to cart");
    openDrawer();
  });

  /* ---------------------------------------------------------------------- *
   * Shop filtering
   * ---------------------------------------------------------------------- */
  var filterBar = $("#shopFilters");
  var shopGrid = $("#shopGrid");

  if (filterBar && shopGrid) {
    var cards = $$(".product", shopGrid);
    var countEl = $("#shopCount");

    function applyFilter(value) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = value === "all" || card.dataset.cat === value;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (countEl) {
        countEl.textContent =
          shown === cards.length
            ? "Showing all " + shown + " formulas"
            : "Showing " + shown + " of " + cards.length + " formulas";
      }
    }

    filterBar.addEventListener("click", function (ev) {
      var chip = ev.target.closest ? ev.target.closest("[data-filter]") : null;
      if (!chip) return;
      $$("[data-filter]", filterBar).forEach(function (c) {
        c.setAttribute("aria-pressed", String(c === chip));
      });
      applyFilter(chip.dataset.filter);
    });

    applyFilter("all");
  }

  /* ---------------------------------------------------------------------- *
   * Routine quiz
   * ---------------------------------------------------------------------- */
  var quiz = $("#routineQuiz");

  if (quiz) {
    var steps = $$(".quiz__step", quiz);
    var dots = $$(".quiz__dot", quiz);
    var stepLabel = $("#quizStepLabel");
    var resultHost = $("#quizResult");
    var current = 0;

    function answers() {
      var out = {};
      $$("input[type=radio]", quiz).forEach(function (input) {
        if (input.checked) out[input.name] = input.value;
      });
      return out;
    }

    function showStep(index) {
      current = index;
      steps.forEach(function (step, i) {
        step.hidden = i !== index;
      });
      dots.forEach(function (dot, i) {
        dot.dataset.state = i < index ? "done" : i === index ? "current" : "upcoming";
      });
      if (stepLabel) {
        stepLabel.textContent = "Question " + (index + 1) + " of " + steps.length;
      }
      if (index >= steps.length && stepLabel) {
        stepLabel.textContent = "Your routine";
      }
    }

    function recommend(a) {
      var treatment = {
        dullness: "niacinamide-serum",
        congestion: "niacinamide-serum",
        redness: "calm-repair-oil",
        lines: "fern-elixir"
      }[a.concern];

      var second = {
        dry: "night-bloom-oil",
        oily: "leaf-light-fluid",
        combination: "leaf-light-fluid",
        sensitive: "calm-repair-oil"
      }[a.skin];

      var list = ["cleansing-gel", treatment, "morning-dew-moisturiser"];

      if (a.concern === "dullness") {
        list.splice(2, 0, "enzyme-polish");
      }
      if (second) list.push(second);
      list.push("sun-veil", "hand-balm", "body-oil");

      var seen = {};
      var unique = list.filter(function (id) {
        if (!id || !BY_ID[id] || seen[id]) return false;
        seen[id] = true;
        return true;
      });

      var size = { short: 3, medium: 5, full: 7 }[a.length] || 4;
      return unique.slice(0, Math.min(size, unique.length));
    }

    function describe(a) {
      var skinWord = {
        dry: "thirsty and tight",
        oily: "quick to shine by midday",
        combination: "calm in some places, restless in others",
        sensitive: "easily flushed"
      }[a.skin];
      var concernWord = {
        dullness: "a tired, uneven surface",
        congestion: "blocked pores around the nose and chin",
        redness: "visible redness and a compromised barrier",
        lines: "fine lines that have started to settle"
      }[a.concern];
      return (
        "You told us your skin feels " +
        skinWord +
        ", that you are working on " +
        concernWord +
        ", and that you want a routine you can keep."
      );
    }

    function renderResult() {
      var a = answers();
      var ids = recommend(a);

      if (!ids.length) {
        resultHost.hidden = true;
        return;
      }

      var total = ids.reduce(function (n, id) {
        return n + BY_ID[id].price;
      }, 0);

      resultHost.innerHTML =
        '<h2 class="quiz__q">Your ' +
        ids.length +
        "-step Verdant routine</h2>" +
        '<p class="result__summary">' +
        describe(a) +
        "</p>" +
        '<ul class="ticks" style="margin-bottom:2rem">' +
        ids
          .map(function (id) {
            var p = BY_ID[id];
            return (
              "<li><strong style=\"font-family:var(--font-display);font-weight:600\">" +
              p.name +
              "</strong> — " +
              p.size +
              ", " +
              money(p.price) +
              "</li>"
            );
          })
          .join("") +
        "</ul>" +
        '<p class="result__summary">Full routine value: <strong>' +
        money2(total) +
        "</strong>. Use it morning and night for six weeks before you judge it — that is one full cell cycle.</p>" +
        '<div class="quiz__nav">' +
        '<button type="button" class="btn btn--sage" data-add-many="' +
        ids.join(",") +
        '">Add all ' +
        ids.length +
        " steps to cart</button>" +
        '<a class="btn btn--ghost" href="shop.html">Adjust in the shop</a>' +
        '<button type="button" class="btn btn--ghost" data-quiz-restart>Start over</button>' +
        "</div>";

      resultHost.hidden = false;
      resultHost.setAttribute("tabindex", "-1");
      resultHost.focus();
      showStep(steps.length);
    }

    quiz.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t.closest) return;

      var next = t.closest("[data-quiz-next]");
      var back = t.closest("[data-quiz-back]");
      var restart = t.closest("[data-quiz-restart]");

      if (restart) {
        $$("input[type=radio]", quiz).forEach(function (i) {
          i.checked = false;
        });
        if (resultHost) resultHost.hidden = true;
        showStep(0);
        var firstInput = $("input[type=radio]", steps[0]);
        if (firstInput) firstInput.focus();
        return;
      }

      if (back && current > 0) {
        showStep(current - 1);
        return;
      }

      if (next) {
        var step = steps[current];
        var chosen = $("input[type=radio]:checked", step);
        var errorEl = $(".quiz__error", step);
        if (!chosen) {
          if (errorEl) errorEl.textContent = "Choose one option to continue.";
          var firstRadio = $("input[type=radio]", step);
          if (firstRadio) firstRadio.focus();
          return;
        }
        if (errorEl) errorEl.textContent = "";
        if (current < steps.length - 1) {
          showStep(current + 1);
          var heading = $(".quiz__q", steps[current]);
          if (heading) {
            heading.setAttribute("tabindex", "-1");
            heading.focus();
          }
        } else {
          renderResult();
        }
      }
    });

    showStep(0);
  }

  /* ---------------------------------------------------------------------- *
   * Contact form validation
   * ---------------------------------------------------------------------- */
  var contactForm = $("#contactForm");

  if (contactForm) {
    var validators = {
      name: function (v) {
        return v.trim().length >= 2 ? "" : "Please tell us your name.";
      },
      email: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
          ? ""
          : "Enter an email address we can reply to.";
      },
      topic: function (v) {
        return v ? "" : "Pick the option that fits best.";
      },
      message: function (v) {
        return v.trim().length >= 20
          ? ""
          : "A little more detail helps — 20 characters minimum.";
      }
    };

    function fieldOf(input) {
      return input.closest(".field");
    }

    function validateInput(input) {
      var rule = validators[input.name];
      if (!rule) return true;
      var msg = rule(input.value);
      var wrap = fieldOf(input);
      if (wrap) {
        wrap.classList.toggle("is-invalid", Boolean(msg));
        var errEl = $(".field__error", wrap);
        if (errEl) errEl.textContent = msg;
        if (msg) {
          input.setAttribute("aria-invalid", "true");
        } else {
          input.removeAttribute("aria-invalid");
        }
      }
      return !msg;
    }

    var inputs = $$("input[name], select[name], textarea[name]", contactForm).filter(
      function (el) {
        return el.type !== "checkbox";
      }
    );

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        validateInput(input);
      });
      input.addEventListener("input", function () {
        var wrap = fieldOf(input);
        if (wrap && wrap.classList.contains("is-invalid")) validateInput(input);
      });
    });

    contactForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      var firstBad = null;
      inputs.forEach(function (input) {
        if (!validateInput(input)) {
          ok = false;
          if (!firstBad) firstBad = input;
        }
      });

      var summary = $("#formErrorSummary");
      var success = $("#formSuccess");

      if (!ok) {
        if (summary) {
          summary.hidden = false;
          summary.textContent =
            "Some fields need attention. We have marked them below.";
        }
        if (success) success.hidden = true;
        if (firstBad) firstBad.focus();
        return;
      }

      if (summary) summary.hidden = true;
      if (success) {
        success.hidden = false;
        var nameInput = $("input[name=name]", contactForm);
        var nameEl = $("#formSuccessName");
        if (nameEl && nameInput) {
          nameEl.textContent = nameInput.value.trim().split(" ")[0];
        }
        success.scrollIntoView({ block: "center", behavior: "smooth" });
        var heading = $("h3", success);
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
      }
      contactForm.reset();
      $$(".field", contactForm).forEach(function (f) {
        f.classList.remove("is-invalid");
      });
    });
  }

  /* ---------------------------------------------------------------------- *
   * Newsletter sign-up
   * ---------------------------------------------------------------------- */
  $$("[data-signup]").forEach(function (form) {
    var scope = form.parentElement || form;
    var email = $("input[type=email]", form);
    var error = $(".signup__error", scope);
    var ok = $(".signup__ok", scope);

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email.value || "").trim());
      if (!valid) {
        if (error) error.classList.add("is-shown");
        if (ok) ok.classList.remove("is-shown");
        email.focus();
        return;
      }
      if (error) error.classList.remove("is-shown");
      if (ok) {
        ok.textContent = "Thank you — check your inbox to confirm.";
        ok.classList.add("is-shown");
      }
      form.reset();
    });
  });

  /* ---------------------------------------------------------------------- *
   * FAQ accordion
   * ---------------------------------------------------------------------- */
  $$(".faq__button").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  });

  /* ---------------------------------------------------------------------- *
   * Mobile navigation
   * ---------------------------------------------------------------------- */
  var navToggle = $("#navToggle");
  var navPanel = $("#navPanel");

  if (navToggle && navPanel) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navPanel.dataset.open = String(!open);
    });
    navPanel.addEventListener("click", function (ev) {
      var link = ev.target.closest ? ev.target.closest("a") : null;
      if (!link) return;
      navToggle.setAttribute("aria-expanded", "false");
      navPanel.dataset.open = "false";
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      navToggle.setAttribute("aria-expanded", "false");
      navPanel.dataset.open = "false";
      navToggle.focus();
    });
  }

  /* ---------------------------------------------------------------------- *
   * Signature motion 01 — scroll progress
   * ---------------------------------------------------------------------- */
  var bar = $("#scrollProgressBar");

  if (bar) {
    var queued = false;

    function paintProgress() {
      queued = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pos = window.pageYOffset || doc.scrollTop || 0;
      var ratio = max > 0 ? Math.min(1, Math.max(0, pos / max)) : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }

    function requestPaint() {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(paintProgress);
      }
    }

    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint, { passive: true });
    paintProgress();
  }

  /* ---------------------------------------------------------------------- *
   * Signature motion 02 — clip-path image reveal
   * ---------------------------------------------------------------------- */
  var revealTargets = $$(".reveal");

  if (revealTargets.length) {
    var reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      revealTargets.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );
      revealTargets.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ---------------------------------------------------------------------- *
   * Footer year
   * ---------------------------------------------------------------------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------------- */
  renderCart();
})();
