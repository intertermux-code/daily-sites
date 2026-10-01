/* ================================================================
   PULSEBOARD — app.js
   Vanilla JS · ES6 · No deps
   ================================================================ */

(function () {
  "use strict";

  const reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* MOBILE NAV                                                         */
  /* ------------------------------------------------------------------ */
  (function mobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.getElementById("mobile-nav");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      if (isOpen) menu.setAttribute("hidden", "");
      else menu.removeAttribute("hidden");
    });

    // close on escape / link click
    menu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        toggle.setAttribute("aria-expanded", "false");
        menu.setAttribute("hidden", "");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        menu.setAttribute("hidden", "");
      }
    });
  })();

  /* ------------------------------------------------------------------ */
  /* SCROLL REVEAL — basic opacity/translate entrance                    */
  /* ------------------------------------------------------------------ */
  (function revealSystem() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (reducedMotion) {
      els.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => io.observe(el));
  })();

  /* ------------------------------------------------------------------ */
  /* CLIP-PATH IMAGE REVEAL — secondary motion                          */
  /* ------------------------------------------------------------------ */
  (function imageReveal() {
    const figures = document.querySelectorAll("[data-reveal-image]");
    if (!figures.length) return;

    if (reducedMotion) {
      figures.forEach((f) => f.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -60px 0px" }
    );

    figures.forEach((f) => io.observe(f));
  })();

  /* ------------------------------------------------------------------ */
  /* MAGNETIC BUTTONS — rAF lerp within 120px radius                    */
  /* ------------------------------------------------------------------ */
  (function magnetic() {
    if (reducedMotion) return;

    const items = Array.from(document.querySelectorAll("[data-magnetic]"));
    if (!items.length) return;

    const RADIUS = 120;
    const STRENGTH = 0.35; // translate fraction
    const LERP = 0.18;

    const state = new Map();
    items.forEach((el) => {
      state.set(el, { tx: 0, ty: 0, vx: 0, vy: 0, targetX: 0, targetY: 0, scale: 1, targetScale: 1 });
    });

    let mouseX = -9999, mouseY = -9999;
    let rafId = null;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const onLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const tick = () => {
      items.forEach((el) => {
        const s = state.get(el);
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < RADIUS) {
          const falloff = 1 - dist / RADIUS; // 1 at center, 0 at edge
          s.targetX = dx * STRENGTH * falloff;
          s.targetY = dy * STRENGTH * falloff;
          s.targetScale = 1 + 0.04 * falloff;
        } else {
          s.targetX = 0;
          s.targetY = 0;
          s.targetScale = 1;
        }

        s.tx += (s.targetX - s.tx) * LERP;
        s.ty += (s.targetY - s.ty) * LERP;
        s.scale += (s.targetScale - s.scale) * LERP;

        // small enough to snap
        if (
          Math.abs(s.tx) < 0.1 &&
          Math.abs(s.ty) < 0.1 &&
          Math.abs(s.targetX) === 0 &&
          Math.abs(s.targetY) === 0
        ) {
          s.tx = 0; s.ty = 0;
        }

        el.style.transform = `translate3d(${s.tx.toFixed(2)}px, ${s.ty.toFixed(2)}px, 0) scale(${s.scale.toFixed(3)})`;
      });
      rafId = requestAnimationFrame(tick);
    };

    // only run the loop when the page is visible / hovered
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    document.addEventListener("mouseenter", start);
    document.addEventListener("mouseleave", () => {
      // let it spring back, then stop
      setTimeout(stop, 800);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    start();
  })();

  /* ------------------------------------------------------------------ */
  /* ANIMATED COUNTERS (metrics band on index)                           */
  /* ------------------------------------------------------------------ */
  (function counters() {
    const els = document.querySelectorAll("[data-counter]");
    if (!els.length) return;

    const format = (v, decimals) => {
      if (decimals === 0) return Math.round(v).toLocaleString();
      return v.toFixed(decimals);
    };

    const animate = (el) => {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || "";
      const decimals = parseInt(el.dataset.decimals, 10) || 0;
      const duration = reducedMotion ? 0 : 1600;
      const start = performance.now();

      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = reducedMotion ? 1 : 1 - Math.pow(1 - p, 3); // easeOutCubic
        const val = target * eased;
        el.textContent = format(val, decimals) + suffix;
        if (p < 1 && !reducedMotion) requestAnimationFrame(step);
        else el.textContent = format(target, decimals) + suffix;
      };
      requestAnimationFrame(step);
    };

    if (reducedMotion) {
      els.forEach((el) => {
        const t = parseFloat(el.dataset.counter);
        const d = parseInt(el.dataset.decimals, 10) || 0;
        el.textContent = (d === 0 ? Math.round(t).toLocaleString() : t.toFixed(d)) + (el.dataset.suffix || "");
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    els.forEach((el) => io.observe(el));
  })();

  /* ------------------------------------------------------------------ */
  /* PRICING BILLING TOGGLE                                             */
  /* ------------------------------------------------------------------ */
  (function pricing() {
    const opts = document.querySelectorAll("[data-billing]");
    if (!opts.length) return;

    const update = (mode) => {
      const prices = document.querySelectorAll("[data-plan] .price-value[data-monthly]");
      const billings = document.querySelectorAll("[data-plan] .price-billed");

      prices.forEach((p) => {
        const v = mode === "annual" ? p.dataset.annual : p.dataset.monthly;
        p.style.opacity = "0";
        setTimeout(() => {
          p.textContent = Number(v).toLocaleString();
          p.style.opacity = "1";
        }, 150);
      });
      billings.forEach((b) => {
        const text = mode === "annual" ? b.dataset.billedAnnual : b.dataset.billedMonthly;
        b.textContent = text;
      });

      opts.forEach((o) => {
        const isCurrent = o.dataset.billing === mode;
        o.classList.toggle("is-active", isCurrent);
        o.setAttribute("aria-checked", String(isCurrent));
      });
    };

    opts.forEach((o) => {
      o.addEventListener("click", () => update(o.dataset.billing));
      o.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          update(o.dataset.billing);
        }
      });
    });

    // initialize from active
    const initial = document.querySelector("[data-billing].is-active");
    if (initial) update(initial.dataset.billing);
  })();

  /* ------------------------------------------------------------------ */
  /* CHIP TOGGLES (contact form reasons)                                */
  /* ------------------------------------------------------------------ */
  (function chipToggles() {
    const opts = document.querySelectorAll(".chip-toggle-opt");
    opts.forEach((o) => {
      o.addEventListener("click", () => {
        const pressed = o.getAttribute("aria-pressed") === "true";
        o.setAttribute("aria-pressed", String(!pressed));
      });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* CONTACT FORM                                                       */
  /* ------------------------------------------------------------------ */
  (function contactForm() {
    const form = document.getElementById("demo-form");
    if (!form) return;

    const status = form.querySelector(".form-status");
    const successBand = document.getElementById("form-success");
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // basic validation
      if (!form.checkValidity()) {
        status.className = "form-status is-error";
        status.textContent = "Please fill in the required fields — we need a name, email, and company to reply.";
        // focus first invalid
        const first = form.querySelector(":invalid");
        if (first) first.focus();
        return;
      }

      // simulate submission
      submitBtn.classList.add("is-loading");
      submitBtn.disabled = true;
      status.className = "form-status";
      status.textContent = "";

      setTimeout(() => {
        submitBtn.classList.remove("is-loading");
        submitBtn.disabled = false;

        // success: scroll to success band
        if (successBand) {
          successBand.removeAttribute("hidden");
          form.setAttribute("hidden", "");
          successBand.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        } else {
          status.className = "form-status is-success";
          status.textContent = "Thanks — a founder will write back within one business day.";
          form.reset();
        }
      }, 900);
    });
  })();

  /* ------------------------------------------------------------------ */
  /* FOOTER NEWSLETTER                                                  */
  /* ------------------------------------------------------------------ */
  (function newsletter() {
    const forms = document.querySelectorAll(".footer-form");
    forms.forEach((f) => {
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = f.querySelector("input[type='email']");
        if (!input || !input.checkValidity()) return;
        const btn = f.querySelector("button");
        const original = btn.innerHTML;
        btn.innerHTML = "<span>Tuned in ✓</span>";
        btn.disabled = true;
        input.value = "";
        setTimeout(() => {
          btn.innerHTML = original;
          btn.disabled = false;
        }, 2400);
      });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* HEADER SHRINK ON SCROLL                                            */
  /* ------------------------------------------------------------------ */
  (function header() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 40 && last <= 40) header.style.boxShadow = "0 6px 20px rgba(10,10,12,.06)";
      if (y <= 40 && last > 40) header.style.boxShadow = "";
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

})();