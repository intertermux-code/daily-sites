/* =========================================================
   LumiDent — shared app.js
   - Mobile menu toggle
   - Cursor Spotlight (hero radial-gradient)
   - Spring Accordion (services page)
   - Before/After slider (gallery)
   - Booking form validation + confirmation state
   - Pre-select doctor from URL query (booking)
   ========================================================= */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- MOBILE MENU ---- */
  const toggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      if (open) {
        mobileNav.setAttribute("hidden", "");
      } else {
        mobileNav.removeAttribute("hidden");
      }
    });
  }

  /* ---- CURSOR SPOTLIGHT (hero) ---- */
  const hero = document.querySelector(".hero");
  if (hero && !reduceMotion) {
    let rafId = null;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    const update = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      hero.style.setProperty("--x", currentX + "%");
      hero.style.setProperty("--y", currentY + "%");
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = requestAnimationFrame(update);
      } else {
        rafId = null;
      }
    };

    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    });

    hero.addEventListener("pointerleave", () => {
      targetX = 50;
      targetY = 50;
      if (!rafId) rafId = requestAnimationFrame(update);
    });
  }

  /* ---- SPRING ACCORDION ---- */
  document.querySelectorAll("[data-accordion]").forEach((acc) => {
    const items = acc.querySelectorAll("[data-item]");
    items.forEach((item) => {
      const trigger = item.querySelector(".accordion__trigger");
      if (!trigger) return;
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        // close all
        items.forEach((i) => {
          i.classList.remove("is-open");
          const t = i.querySelector(".accordion__trigger");
          if (t) t.setAttribute("aria-expanded", "false");
        });
        // open this one if it wasn't open
        if (!isOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
  });

  /* ---- BEFORE/AFTER SLIDER ---- */
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    const before = slider.querySelector(".case__img--before");
    const handle = slider.querySelector(".case__handle");
    if (!before || !handle) return;

    let dragging = false;
    let value = 50;

    const set = (pct) => {
      value = Math.max(0, Math.min(100, pct));
      before.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
      handle.style.left = value + "%";
      handle.setAttribute("aria-valuenow", Math.round(value));
    };

    const fromEvent = (e) => {
      const rect = slider.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return ((clientX - rect.left) / rect.width) * 100;
    };

    const onDown = (e) => {
      dragging = true;
      slider.setPointerCapture && slider.setPointerCapture(e.pointerId);
      set(fromEvent(e));
    };
    const onMove = (e) => {
      if (!dragging) return;
      set(fromEvent(e));
    };
    const onUp = (e) => {
      dragging = false;
      slider.releasePointerCapture && slider.releasePointerCapture(e.pointerId);
    };

    slider.addEventListener("pointerdown", onDown);
    slider.addEventListener("pointermove", onMove);
    slider.addEventListener("pointerup", onUp);
    slider.addEventListener("pointercancel", onUp);
    slider.addEventListener("pointerleave", (e) => { if (dragging) onUp(e); });

    // keyboard
    handle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { set(value - 2); e.preventDefault(); }
      if (e.key === "ArrowRight") { set(value + 2); e.preventDefault(); }
      if (e.key === "Home") { set(0); e.preventDefault(); }
      if (e.key === "End") { set(100); e.preventDefault(); }
    });

    set(50);
  });

  /* ---- BOOKING FORM ---- */
  const form = document.getElementById("booking-form");
  if (form) {
    // Pre-select doctor from URL query
    const params = new URLSearchParams(window.location.search);
    const qDoctor = params.get("doctor");
    if (qDoctor) {
      const sel = form.querySelector("#doctor");
      if (sel && sel.querySelector(`option[value="${qDoctor}"]`)) {
        sel.value = qDoctor;
      }
    }

    // Set min date to tomorrow
    const dateInput = form.querySelector("#date");
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split("T")[0];
      dateInput.value = tomorrow.toISOString().split("T")[0];
    }

    // Validation helpers
    const setError = (name, on) => {
      const step = form.querySelector(`[data-error-for="${name}"]`);
      const field = form.querySelector(`[name="${name}"]`) ||
                    form.querySelector(`#${name}`);
      if (step) step.hidden = !on;
      if (field) {
        const container = field.closest(".booking-step") || field.parentElement;
        if (container) container.classList.toggle("has-error", on);
      }
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;

      // service
      const service = form.querySelector("#service").value;
      if (!service) { setError("service", true); ok = false; } else { setError("service", false); }

      // date
      const date = form.querySelector("#date").value;
      const today = new Date(); today.setHours(0,0,0,0);
      const dDate = date ? new Date(date) : null;
      if (!dDate || dDate <= today) { setError("date", true); ok = false; } else { setError("date", false); }

      // time
      const time = form.querySelector('input[name="time"]:checked');
      if (!time) { setError("time", true); ok = false; } else { setError("time", false); }

      // name
      const name = form.querySelector("#name").value.trim();
      if (name.length < 2) { setError("name", true); ok = false; } else { setError("name", false); }

      // email
      const email = form.querySelector("#email").value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) { setError("email", true); ok = false; } else { setError("email", false); }

      // consent
      const consent = form.querySelector('input[name="consent"]').checked;
      if (!consent) { setError("consent", true); ok = false; } else { setError("consent", false); }

      if (!ok) {
        const firstErr = form.querySelector(".has-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      // Success: show confirmation
      const doctorSel = form.querySelector("#doctor");
      const doctorText = doctorSel && doctorSel.value
        ? doctorSel.options[doctorSel.selectedIndex].text
        : "First available";
      const serviceText = form.querySelector("#service").options[form.querySelector("#service").selectedIndex].text;
      const whenDate = new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

      document.getElementById("conf-service").textContent = serviceText;
      document.getElementById("conf-doctor").textContent = doctorText;
      document.getElementById("conf-when").textContent = `${whenDate} · ${time.value}`;
      document.getElementById("conf-email").textContent = email;
      document.getElementById("conf-ref").textContent = "LM-" + Math.random().toString(36).slice(2, 8).toUpperCase();

      form.style.display = "none";
      document.querySelector(".booking-summary").style.display = "none";
      document.getElementById("booking-confirmation").removeAttribute("hidden");
      document.getElementById("booking-confirmation").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const editBtn = document.getElementById("edit-booking");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        form.style.display = "";
        document.querySelector(".booking-summary").style.display = "";
        document.getElementById("booking-confirmation").setAttribute("hidden", "");
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  /* ---- NEXT SLOT (home hero) ---- */
  const nextSlot = document.getElementById("next-slot");
  if (nextSlot) {
    const now = new Date();
    const h = now.getHours();
    let slot = "tomorrow, 09:00";
    if (h < 19) {
      const nextH = h + 1;
      slot = `today, ${String(nextH).padStart(2, "0")}:30`;
    }
    nextSlot.textContent = slot;
  }
})();