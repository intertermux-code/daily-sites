/* =========================================================
   SIGNAL — shared behaviour
   Guarded per page; every module checks for its own elements.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Mobile section nav ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var list = document.getElementById('site-nav-list');
    if (!toggle || !list) return;

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      list.classList.toggle('is-open', !open);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false');
        list.classList.remove('is-open');
        toggle.focus();
      }
    });

    // Desktop widths always show the list; reset state on resize crossing the breakpoint.
    var mq = window.matchMedia('(min-width: 721px)');
    function sync() {
      if (mq.matches) {
        toggle.setAttribute('aria-expanded', 'false');
        list.classList.remove('is-open');
      }
    }
    if (mq.addEventListener) mq.addEventListener('change', sync);
  }

  /* ---------- 2. Ledger rows: expand a summary ---------- */
  function initLedger(scope) {
    var rows = (scope || document).querySelectorAll('[data-ledger-row], [data-registry-row]');
    if (!rows.length) return;

    rows.forEach(function (row) {
      var button = row.querySelector('.ledger__toggle, .registry__toggle');
      var id = button && button.getAttribute('aria-controls');
      var panel = id ? document.getElementById(id) : null;
      if (!button || !panel) return;

      button.addEventListener('click', function () {
        var open = button.getAttribute('aria-expanded') === 'true';

        if (open) {
          button.setAttribute('aria-expanded', 'false');
          panel.classList.remove('is-open');
          var hide = function () { panel.hidden = true; };
          if (reduced) { hide(); } else { window.setTimeout(hide, 180); }
          return;
        }

        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        // next frame so the transition has a starting state
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () { panel.classList.add('is-open'); });
        });
        revealImages(panel);
      });
    });
  }

  /* ---------- 3. Animated counters (easeOutExpo, 1.2s) ---------- */
  var DURATION = 1200;
  var fmt = new Intl.NumberFormat('en-US');

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduced) { el.textContent = fmt.format(target); return; }

    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / DURATION, 1);
      var value = Math.round(easeOutExpo(p) * target);
      el.textContent = prefix + fmt.format(value) + suffix;
      if (p < 1) window.requestAnimationFrame(frame);
    }
    el.textContent = prefix + fmt.format(0) + suffix;
    window.requestAnimationFrame(frame);
  }

  function initCounters() {
    var counters = document.querySelectorAll('.count[data-count]');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = fmt.format(parseInt(el.getAttribute('data-count'), 10)); });
      return;
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        runCounter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.45, rootMargin: '0px 0px -8% 0px' });

    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Clip-path image reveal ---------- */
  var revealIO = null;

  function initReveal() {
    var targets = document.querySelectorAll('.clip-reveal');
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealIO.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el) { revealIO.observe(el); });
  }

  // Reveals for content that only exists after a row is expanded.
  function revealImages(scope) {
    var items = scope.querySelectorAll('.clip-reveal');
    items.forEach(function (el) {
      if (el.classList.contains('is-revealed')) return;
      if (reduced || !revealIO) { el.classList.add('is-revealed'); return; }
      revealIO.observe(el);
    });
  }

  /* ---------- 5. Reading progress (article page) ---------- */
  function initProgress() {
    var bar = document.querySelector('.progress__bar');
    var article = document.getElementById('article-body');
    if (!bar || !article) return;

    var ticking = false;
    function update() {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      var ratio = total > 0 ? scrolled / total : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- 6. Topic registry filter (topics.html) ---------- */
  function initFilter() {
    var input = document.getElementById('topic-filter');
    var rows = document.querySelectorAll('[data-keywords]');
    var readout = document.getElementById('filter-count');
    if (!input || !rows.length) return;

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) {
        var hay = (row.getAttribute('data-keywords') + ' ' + row.textContent).toLowerCase();
        var match = q === '' || hay.indexOf(q) !== -1;
        row.hidden = !match;
        if (match) shown++;
      });
      if (readout) {
        readout.textContent = q === ''
          ? rows.length + ' topics in the index'
          : shown + (shown === 1 ? ' topic matches' : ' topics match') + ' “' + input.value.trim() + '”';
      }
      if (shown === 0 && q !== '' && readout) {
        readout.textContent += ' — no entry yet; try Security or Open Source';
      }
    }

    input.addEventListener('input', apply);
    apply();
  }

  /* ---------- 7. Newsletter validation (subscribe.html) ---------- */
  function initForm() {
    var form = document.getElementById('signup-form');
    if (!form) return;

    var status = document.getElementById('form-status');
    var success = document.getElementById('signup-success');
    var submittedName = document.getElementById('success-name');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var rules = {
      'f-name': function (v) {
        if (!v.trim()) return 'Tell us who to greet — first name is required.';
        if (v.trim().length < 2) return 'That looks too short to be a name.';
        return '';
      },
      'f-email': function (v) {
        if (!v.trim()) return 'We need an email address to send the dispatch.';
        if (!emailRe.test(v.trim())) return 'That address is missing an “@” or a domain. Check the spelling.';
        return '';
      },
      'f-cadence': function () { return ''; },
      'f-topics': function () {
        var any = form.querySelectorAll('input[name="topics"]:checked').length;
        return any ? '' : 'Choose at least one desk so we can skip the rest.';
      },
      'f-notes': function (v) {
        return v.length > 400 ? 'Keep this under 400 characters (' + v.length + ' so far).' : '';
      }
    };

    function fieldOf(input) {
      return input.closest('.field') || input.closest('fieldset.group');
    }

    function validate(el, showError) {
      var rule = rules[el.id];
      if (!rule) return true;
      var message = rule(el.value !== undefined ? el.value : '');
      var wrap = fieldOf(el);
      if (wrap) {
        var out = wrap.querySelector('.field__error');
        if (showError && message) {
          wrap.classList.add('is-invalid');
          if (out) out.textContent = message;
        } else if (!message) {
          wrap.classList.remove('is-invalid');
          if (out) out.textContent = '';
        }
      }
      el.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    }

    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () { validate(el, true); });
      el.addEventListener('change', function () { validate(el, true); });
      if (el.type === 'checkbox' || el.type === 'radio') return;
      el.addEventListener('input', function () {
        if (fieldOf(el) && fieldOf(el).classList.contains('is-invalid')) validate(el, true);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      var messages = [];

      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (!validate(el, true) && !firstBad) firstBad = el;
        var wrap = fieldOf(el);
        if (wrap && wrap.classList.contains('is-invalid')) {
          var out = wrap.querySelector('.field__error');
          if (out && out.textContent) messages.push(out.textContent);
        }
      });

      if (firstBad) {
        if (status) {
          status.textContent = messages.length === 1
            ? messages[0]
            : messages.length + ' fields need attention. The first one is highlighted.';
          status.className = 'form-status is-error';
        }
        firstBad.focus();
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.textContent = 'Adding you to the ledger…';
      }
      if (status) {
        status.textContent = 'Confirming address…';
        status.className = 'form-status';
      }

      window.setTimeout(function () {
        form.hidden = true;
        if (submittedName) {
          var nameEl = document.getElementById('f-name');
          submittedName.textContent = nameEl && nameEl.value.trim() ? nameEl.value.trim() : 'there';
        }
        if (success) {
          success.hidden = false;
          var focusTarget = success.querySelector('h2');
          if (focusTarget) {
            focusTarget.setAttribute('tabindex', '-1');
            focusTarget.focus();
          }
        }
        if (button) {
          button.disabled = false;
          button.textContent = 'Subscribe';
        }
      }, reduced ? 0 : 900);
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initNav();
    initLedger();
    initReveal();
    initCounters();
    initProgress();
    initFilter();
    initForm();

    var dateline = document.querySelector('[data-today]');
    if (dateline) {
      dateline.textContent = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
