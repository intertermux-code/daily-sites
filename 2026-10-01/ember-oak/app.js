/* ==========================================================================
   Ember & Oak — Shared JS
   ========================================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile nav toggle ---------- */
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      mainNav.classList.toggle("is-open", !expanded);
    });

    mainNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", "false");
        mainNav.classList.remove("is-open");
      });
    });
  }

  /* ---------- Hero word-stagger animation ---------- */
  const heroStagger = document.querySelector(".hero-stagger");
  if (heroStagger && !prefersReducedMotion) {
    const original = heroStagger.innerHTML.trim();
    // Split on spaces, preserving <em> wrapping per-word
    // We'll parse out HTML-safe text. For simplicity, split by spaces on textContent
    // but keep inner <em> tags by detecting them first.
    const hasEm = original.indexOf("<em>") !== -1;
    if (hasEm) {
      // Split: text before em, em content, text after em
      const parts = original.split(/(<em>[\s\S]*?<\/em>)/);
      let index = 0;
      const spans = [];
      parts.forEach((part) => {
        if (part.startsWith("<em>")) {
          const inner = part.replace(/^<em>|<\/em>$/g, "");
          inner.split(/\s+/).filter(Boolean).forEach((w) => {
            spans.push(`<em class="hero-word" style="--i:${index}">${w}</em>`);
            index++;
          });
        } else {
          part.split(/\s+/).filter(Boolean).forEach((w) => {
            spans.push(`<span class="hero-word" style="--i:${index}">${w}</span>`);
            index++;
          });
        }
      });
      heroStagger.innerHTML = spans.join(" ");
    } else {
      const words = original.split(/\s+/).filter(Boolean);
      heroStagger.innerHTML = words
        .map((w, i) => `<span class="hero-word" style="--i:${i}">${w}</span>`)
        .join(" ");
    }
  }

  /* ---------- Animated Counters ---------- */
  const counters = document.querySelectorAll("[data-counter]");
  if (counters.length && !prefersReducedMotion) {
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const fmt = new Intl.NumberFormat("en-US");

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.counter, 10);
      if (isNaN(target)) return;
      const suffix = el.dataset.suffix || "";
      const duration = 1200;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const value = Math.round(target * easeOutExpo(t));
        el.firstChild
          ? (el.firstChild.nodeValue = fmt.format(value))
          : (el.textContent = fmt.format(value));
        if (t < 1) requestAnimationFrame(tick);
        else {
          // Reconstruct with suffix
          el.textContent = "";
          el.appendChild(document.createTextNode(fmt.format(target)));
          if (suffix) {
            const span = document.createElement("span");
            span.className = "suffix";
            span.textContent = suffix;
            el.appendChild(span);
          }
        }
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    counters.forEach((c) => observer.observe(c));
  }

  /* ---------- Menu Tabs ---------- */
  const menuTabs = document.querySelectorAll(".menu-tab");
  if (menuTabs.length) {
    menuTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        document.querySelectorAll(".menu-tab").forEach((t) => {
          t.classList.toggle("is-active", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        document.querySelectorAll(".menu-section").forEach((s) => {
          s.classList.toggle("is-active", s.id === target);
        });
      });
    });
  }

  /* ---------- Gallery Lightbox ---------- */
  const galleryTiles = document.querySelectorAll(".gallery-tile");
  if (galleryTiles.length) {
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Image viewer");
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close image viewer">×</button>
        <img src="" alt="" class="lightbox-img">
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    const closeBtn = lightbox.querySelector(".lightbox-close");
    const img = lightbox.querySelector(".lightbox-img");
    const caption = lightbox.querySelector(".lightbox-caption");
    let lastFocused = null;

    const openLightbox = (src, alt, cap) => {
      lastFocused = document.activeElement;
      img.src = src;
      img.alt = alt;
      caption.textContent = cap || alt;
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      setTimeout(() => closeBtn.focus(), 100);
    };

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    };

    galleryTiles.forEach((tile) => {
      const imgEl = tile.querySelector("img");
      if (!imgEl) return;
      const src = imgEl.dataset.full || imgEl.src;
      const alt = imgEl.alt;
      const cap = imgEl.dataset.caption || alt;

      tile.addEventListener("click", () => openLightbox(src, alt, cap));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(src, alt, cap);
        }
      });
    });

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  /* ---------- Reservation Form ---------- */
  const form = document.querySelector("#reservation-form");
  if (form) {
    const formParent = form.parentElement;
    const showError = (field, msg) => {
      const err = field.parentElement.querySelector(".form-error");
      if (err) err.textContent = msg;
      field.setAttribute("aria-invalid", msg ? "true" : "false");
    };

    const validateField = (field) => {
      const name = field.name;
      let msg = "";
      if (field.required && !field.value.trim()) {
        msg = "This field is required";
      } else if (name === "phone") {
        const digits = field.value.replace(/\D/g, "");
        if (digits.length < 7) msg = "Please enter a valid phone number";
      } else if (name === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          msg = "Please enter a valid email";
        }
      } else if (name === "date") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const chosen = new Date(field.value);
        if (chosen < today) msg = "Please choose a future date";
      }
      showError(field, msg);
      return !msg;
    };

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll("input, select, textarea").forEach((field) => {
        if (!validateField(field)) valid = false;
      });

      if (!valid) return;

      const name = form.querySelector("[name='name']").value;
      const date = form.querySelector("[name='date']").value;
      const time = form.querySelector("[name='time']").value;
      const party = form.querySelector("[name='party']").value;
      const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long", month: "long", day: "numeric" }
      );

      const confirmation = document.createElement("div");
      confirmation.className = "confirmation-state";
      confirmation.innerHTML = `
        <div class="confirmation-icon" aria-hidden="true">✓</div>
        <h3>Your Table Is Reserved</h3>
        <p>Thank you, ${name.split(" ")[0]}. We've set aside a table for ${party} on ${formattedDate} at ${time}. A confirmation will arrive in your inbox shortly.</p>
        <div class="mono" style="margin-top:24px;color:var(--gold)">REF · EOK-${Math.floor(Math.random() * 900000 + 100000)}</div>
      `;

      form.style.opacity = "0";
      form.style.transform = "translateY(-10px)";
      form.style.transition = "opacity 0.4s var(--ease), transform 0.4s var(--ease)";

      setTimeout(() => {
        formParent.replaceChild(confirmation, form);
        confirmation.style.opacity = "0";
        confirmation.style.transform = "translateY(10px)";
        requestAnimationFrame(() => {
          confirmation.style.transition = "opacity 0.5s var(--ease), transform 0.5s var(--ease)";
          confirmation.style.opacity = "1";
          confirmation.style.transform = "translateY(0)";
        });
      }, 400);
    });

    // Set min date to today
    const dateInput = form.querySelector("[name='date']");
    if (dateInput) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      dateInput.min = `${yyyy}-${mm}-${dd}`;
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
  }
})();