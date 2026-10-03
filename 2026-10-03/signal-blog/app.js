(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- SCROLL PROGRESS ---------- */
  const progressBar = document.getElementById("progressBar");
  if (progressBar && !reduceMotion) {
    let ticking = false;
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();
  }

  /* ---------- DECODE TEXT (typewriter cipher) ---------- */
  const decodeEls = document.querySelectorAll(".decode-word");
  if (decodeEls.length && !reduceMotion) {
    const glyphPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&$*+=/<>";
    const randomGlyph = () => glyphPool[Math.floor(Math.random() * glyphPool.length)];

    decodeEls.forEach((el) => {
      const target = (el.dataset.target || el.textContent).trim();
      const originalText = el.textContent;
      let frame = 0;
      const totalFrames = 22;
      const interval = setInterval(() => {
        const revealed = Math.floor((frame / totalFrames) * target.length);
        let out = "";
        for (let i = 0; i < target.length; i++) {
          if (i < revealed) {
            out += target[i];
          } else if (target[i] === " ") {
            out += " ";
          } else {
            out += randomGlyph();
          }
        }
        el.textContent = out;
        frame++;
        if (frame > totalFrames) {
          clearInterval(interval);
          el.textContent = target;
        }
      }, 55);
    });
  }

  /* ---------- NEWS CYCLE TICKER (subtle dashboard feel) ---------- */
  const newsCycle = document.getElementById("newsCycle");
  if (newsCycle && !reduceMotion) {
    let seconds = 3 * 3600 + 42 * 60 + 17;
    const pad = (n) => String(n).padStart(2, "0");
    setInterval(() => {
      seconds++;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      newsCycle.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }, 1000);
  }

  /* ---------- LIVE READERS TICKER (article page) ---------- */
  const liveReaders = document.getElementById("liveReaders");
  if (liveReaders && !reduceMotion) {
    let count = 2104;
    setInterval(() => {
      count += Math.floor(Math.random() * 5) - 2;
      if (count < 2000) count = 2000;
      liveReaders.textContent = count.toLocaleString("en-US");
    }, 2800);
  }

  /* ---------- SUBSCRIBE FORM VALIDATION ---------- */
  const form = document.getElementById("subscribeForm");
  if (form) {
    const nameInput = form.querySelector("#fullName");
    const emailInput = form.querySelector("#email");
    const termsInput = form.querySelector("#terms");
    const statusEl = form.querySelector("#formStatus");
    const successEl = document.getElementById("formSuccess");

    const setError = (field, message) => {
      const errEl = form.querySelector(`[data-error-for="${field.id}"]`);
      if (errEl) errEl.textContent = message;
      if (message) {
        field.classList.add("is-invalid");
        field.setAttribute("aria-invalid", "true");
      } else {
        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
      }
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const validateField = (field) => {
      if (field === nameInput) {
        const v = field.value.trim();
        if (!v) return setError(field, "Please enter your name.");
        if (v.length < 2) return setError(field, "Name must be at least 2 characters.");
        setError(field, "");
      } else if (field === emailInput) {
        const v = field.value.trim();
        if (!v) return setError(field, "Please enter your email address.");
        if (!emailRegex.test(v)) return setError(field, "Please enter a valid email address.");
        setError(field, "");
      } else if (field === termsInput) {
        if (!field.checked) return setError(field, "Please confirm you understand our funding model.");
        setError(field, "");
      }
    };

    [nameInput, emailInput].forEach((f) => {
      if (f) f.addEventListener("blur", () => validateField(f));
    });
    if (termsInput) termsInput.addEventListener("change", () => validateField(termsInput));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      validateField(nameInput);
      validateField(emailInput);
      validateField(termsInput);

      const hasErrors = form.querySelectorAll(".is-invalid").length > 0;
      if (hasErrors) {
        if (statusEl) statusEl.textContent = "● Check fields";
        const firstInvalid = form.querySelector(".is-invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Success state
      if (statusEl) statusEl.textContent = "✓ Confirmed";
      form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
      if (successEl) successEl.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------- KEYBOARD: close details with Esc (native behavior mostly) ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const open = document.activeElement?.closest("details[open]");
      if (open) open.removeAttribute("open");
    }
  });
})();
```