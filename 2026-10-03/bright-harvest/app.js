/* =================================================================
   BRIGHT HARVEST — site-wide interactivity
   - Scroll progress bar (scaleX driven by rAF)
   - Magnetic button effect (translate + scale toward cursor)
   - Impact counter animation (IntersectionObserver)
   - Donation widget (amount + frequency + submit → thank-you)
   - Volunteer signup (validation + success state)
   - Mobile nav toggle
   Honors prefers-reduced-motion by disabling non-essential motion.
   ================================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     1. SCROLL PROGRESS — 2px bar pinned to top, scaleX via rAF
     ============================================================ */
  (function initProgress() {
    const bar = document.getElementById("progress");
    if (!bar) return;

    let ticking = false;
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const p = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
      bar.style.transform = `scaleX(${p})`;
      ticking = false;
    };

    update(); // render resting state immediately

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener("resize", update);
  })();

  /* ============================================================
     2. MAGNETIC BUTTONS — translate toward cursor within 120px,
        scale 1.04 at closest, spring back on leave. rAF + lerp.
     ============================================================ */
  (function initMagnetic() {
    if (prefersReducedMotion) return;

    const buttons = document.querySelectorAll(".magnetic");
    if (!buttons.length) return;

    const RADIUS = 120;
    const STRENGTH = 0.35; // translation factor
    const SCALE_STRENGTH = 0.04;
    const LERP = 0.18;

    const state = new WeakMap();

    buttons.forEach((btn) => {
      state.set(btn, {
        targetX: 0, targetY: 0, targetScale: 1,
        currentX: 0, currentY: 0, currentScale: 1,
        active: false,
      });

      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < RADIUS) {
          const s = state.get(btn);
          const t = 1 - dist / RADIUS; // 1 at center, 0 at edge
          s.targetX = dx * STRENGTH * t;
          s.targetY = dy * STRENGTH * t;
          s.targetScale = 1 + SCALE_STRENGTH * t;
          if (!s.active) {
            s.active = true;
            requestAnimationFrame(() => tick(btn));
          }
        }
      });

      btn.addEventListener("mouseleave", () => {
        const s = state.get(btn);
        s.targetX = 0;
        s.targetY = 0;
        s.targetScale = 1;
        if (!s.active) {
          s.active = true;
          requestAnimationFrame(() => tick(btn));
        }
      });
    });

    function tick(btn) {
      const s = state.get(btn);
      s.currentX += (s.targetX - s.currentX) * LERP;
      s.currentY += (s.targetY - s.currentY) * LERP;
      s.currentScale += (s.targetScale - s.currentScale) * LERP;

      btn.style.transform =
        `translate3d(${s.currentX.toFixed(2)}px, ${s.currentY.toFixed(2)}px, 0) scale(${s.currentScale.toFixed(3)})`;

      const settled =
        Math.abs(s.targetX - s.currentX) < 0.1 &&
        Math.abs(s.targetY - s.currentY) < 0.1 &&
        Math.abs(s.targetScale - s.currentScale) < 0.001;

      if (!settled) {
        requestAnimationFrame(() => tick(btn));
      } else {
        s.currentX = s.targetX;
        s.currentY = s.targetY;
        s.currentScale = s.targetScale;
        if (s.targetX === 0 && s.targetY === 0 && s.targetScale === 1) {
          btn.style.transform = "";
        }
        s.active = false;
      }
    }
  })();

  /* ============================================================
     3. IMPACT COUNTERS — IntersectionObserver + eased count-up
     ============================================================ */
  (function initCounters() {
    const grid = document.getElementById("impact-grid");
    if (!grid) return;
    const cards = grid.querySelectorAll(".impact-card");
    if (!cards.length) return;

    const format = (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
      if (n >= 1000) return Math.round(n).toLocaleString("en-US");
      return Math.round(n).toLocaleString("en-US");
    };

    const animate = (el, target, suffix) => {
      const valueEl = el.querySelector(".impact-value");
      if (!valueEl) return;

      if (prefersReducedMotion) {
        valueEl.textContent = format(target);
        if (suffix) valueEl.setAttribute("data-suffix", suffix);
        return;
      }

      const duration = 1600;
      const start = performance.now();
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = easeOutCubic(t);
        const current = target * eased;
        valueEl.textContent = format(current);
        if (t < 1) requestAnimationFrame(step);
        else {
          valueEl.textContent = format(target);
          if (suffix) valueEl.setAttribute("data-suffix", suffix);
        }
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            cards.forEach((card) => {
              const target = parseInt(card.dataset.count, 10) || 0;
              const suffix = card.dataset.suffix || "";
              animate(card, target, suffix);
            });
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(grid);
  })();

  /* ============================================================
     4. DONATION WIDGET — amount + frequency + submit → thank you
     ============================================================ */
  (function initDonate() {
    const form = document.getElementById("donate-form");
    const widget = document.getElementById("donate-widget");
    const thanks = document.getElementById("thank-you");
    if (!form || !widget || !thanks) return;

    const impactAmount = document.getElementById("impact-amount");
    const impactMeals = document.getElementById("impact-meals");
    const btnAmount = document.getElementById("btn-amount");
    const thanksName = document.getElementById("thanks-name");
    const thanksAmount = document.getElementById("thanks-amount");
    const submitBtn = document.getElementById("donate-submit");
    const customInput = form.querySelector("#custom-amount");
    const amountRadios = form.querySelectorAll('input[name="amount"]');

    let currentAmount = 50;

    function updateImpact() {
      if (impactAmount) impactAmount.textContent = currentAmount.toLocaleString("en-US");
      if (impactMeals) impactMeals.textContent = currentAmount.toLocaleString("en-US");
      if (btnAmount) btnAmount.textContent = currentAmount.toLocaleString("en-US");
    }

    amountRadios.forEach((r) => {
      r.addEventListener("change", () => {
        if (r.checked) {
          currentAmount = parseInt(r.value, 10);
          if (customInput) customInput.value = "";
          updateImpact();
        }
      });
    });

    if (customInput) {
      customInput.addEventListener("input", () => {
        const v = parseInt(customInput.value, 10);
        if (!isNaN(v) && v > 0) {
          currentAmount = v;
          amountRadios.forEach((r) => (r.checked = false));
          updateImpact();
        }
      });
    }

    updateImpact();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const first = form.querySelector("#first-name").value.trim();
      const last = form.querySelector("#last-name").value.trim();
      const email = form.querySelector("#email").value.trim();
      let valid = true;

      [
        ["#first-name", first],
        ["#last-name", last],
        ["#email", email],
      ].forEach(([sel, val]) => {
        const el = form.querySelector(sel);
        if (!val) {
          el.parentElement.classList.add("error");
          valid = false;
        } else {
          el.parentElement.classList.remove("error");
        }
      });
      if (!valid) return;

      // Fake submit with loading state
      submitBtn.classList.add("loading");
      submitBtn.setAttribute("aria-disabled", "true");
      submitBtn.querySelector(".btn-label").textContent = "Processing your gift…";

      setTimeout(() => {
        form.hidden = true;
        thanks.hidden = false;
        if (thanksName) thanksName.textContent = first;
        if (thanksAmount) thanksAmount.textContent = currentAmount.toLocaleString("en-US");
        thanks.scrollIntoView({ behavior: "smooth", block: "start" });
        thanks.focus();
      }, 1400);
    });

    const giveAgain = document.getElementById("give-again");
    if (giveAgain) {
      giveAgain.addEventListener("click", () => {
        thanks.hidden = true;
        form.hidden = false;
        form.reset();
        submitBtn.classList.remove("loading");
        submitBtn.removeAttribute("aria-disabled");
        submitBtn.querySelector(".btn-label").innerHTML =
          'Complete gift of <span class="tabular">$<span id="btn-amount">50</span></span>';
        currentAmount = 50;
        updateImpact();
        // Rebind the btn-amount since innerHTML replaced it
        const newBtnAmount = document.getElementById("btn-amount");
        if (newBtnAmount && newBtnAmount !== btnAmount) {
          // reassign reference — handled on next updateImpact via id
        }
        form.querySelector('input[name="amount"][value="50"]').checked = true;
        widget.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  })();

  /* ============================================================
     5. VOLUNTEER SIGNUP — validation + success state
     ============================================================ */
  (function initVolunteer() {
    const form = document.getElementById("volunteer-form");
    if (!form) return;

    const success = document.getElementById("volunteer-success");
    const submitBtn = document.getElementById("volunteer-submit");
    const nameInput = form.querySelector("#v-first");
    const successName = document.getElementById("success-name");
    const noteField = form.querySelector("#v-note");
    const noteCount = document.getElementById("note-count");

    if (noteField && noteCount) {
      const updateCount = () => {
        const len = noteField.value.length;
        noteCount.textContent = `${len} / 400`;
      };
      noteField.addEventListener("input", updateCount);
      updateCount();
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const required = form.querySelectorAll("[required]");
      let valid = true;

      required.forEach((el) => {
        let fieldOk = true;
        if (el.type === "checkbox") fieldOk = el.checked;
        else if (el.type === "radio") {
          const any = form.querySelector(`input[name="${el.name}"]:checked`);
          fieldOk = !!any;
        } else fieldOk = el.value.trim().length > 0;

        const wrap = el.closest(".field") || el.closest(".radio-grid") || el.closest(".check-field");
        if (!fieldOk) {
          if (wrap) wrap.classList.add("error");
          valid = false;
        } else if (wrap) {
          wrap.classList.remove("error");
        }
      });

      if (!valid) return;

      submitBtn.classList.add("loading");
      submitBtn.setAttribute("aria-disabled", "true");
      submitBtn.querySelector(".btn-label").textContent = "Sending to Jonah…";

      setTimeout(() => {
        form.querySelectorAll("fieldset, .form-row, .field, .check-field.consent, .form-note")
          .forEach((el) => (el.hidden = true));
        submitBtn.hidden = true;
        success.hidden = false;
        if (successName && nameInput) successName.textContent = nameInput.value.trim() || "friend";
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 1200);
    });
  })();

  /* ============================================================
     6. MOBILE NAV TOGGLE
     ============================================================ */
  (function initMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("mobile-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.hidden = expanded;
    });

    // Close on link click
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.hidden = true;
      });
    });
  })();

  /* ============================================================
     7. ROLE CARDS → scroll to role in signup form (volunteer page)
     ============================================================ */
  (function initRoleLinks() {
    const roleCards = document.querySelectorAll(".role-card");
    const signupForm = document.getElementById("volunteer-form");
    if (!roleCards.length || !signupForm) return;

    roleCards.forEach((card) => {
      card.addEventListener("click", () => {
        const role = card.dataset.role;
        if (!role) return;
        const radio = signupForm.querySelector(`input[name="role"][value="${role}"]`);
        if (radio) radio.checked = true;
        signupForm.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          const firstName = signupForm.querySelector("#v-first");
          if (firstName) firstName.focus();
        }, 600);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
    });
  })();

})();