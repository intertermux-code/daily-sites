/* ============================================================
   Chapter & Verse — shared behaviour
   All features are guarded by element checks, so one file
   serves every page.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Scroll progress bar (all pages) ───────────────── */
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ── 2. Primary navigation ────────────────────────────── */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function open() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
      toggle.querySelector('.nav-toggle-label').textContent = 'Close';
    }
    function close() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      toggle.querySelector('.nav-toggle-label').textContent = 'Menu';
    }
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) close();
      else open();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && nav.classList.contains('is-open')) close();
    });
  }

  /* ── 3. Horizontal diorama tracks ─────────────────────── */
  function initDioramas() {
    var dioramas = document.querySelectorAll('[data-diorama]');
    if (!dioramas.length) return;

    Array.prototype.forEach.call(dioramas, function (root) {
      var track = root.querySelector('.diorama-track');
      if (!track) return;

      var panels = track.querySelectorAll('.exhibit');
      var prev = root.querySelector('[data-dir="-1"]');
      var next = root.querySelector('[data-dir="1"]');
      var indexEl = root.querySelector('[data-diorama-index]');
      var totalEl = root.querySelector('[data-diorama-total]');
      var thumb = root.querySelector('[data-diorama-thumb]');
      var current = 0;

      if (totalEl) totalEl.textContent = String(panels.length);

      function step() {
        var first = panels[0];
        if (!first) return track.clientWidth * 0.8;
        var gap = parseFloat(window.getComputedStyle(track).columnGap || '24') || 24;
        return first.getBoundingClientRect().width + gap;
      }

      function scrollByPanel(dir) {
        track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
      }

      function measure() {
        var max = track.scrollWidth - track.clientWidth;
        var pos = track.scrollLeft;
        var ratio = max > 0 ? Math.min(1, Math.max(0, pos / max)) : 0;
        current = Math.round(ratio * (panels.length - 1));
        if (indexEl) indexEl.textContent = String(current + 1);
        if (prev) prev.disabled = pos <= 2;
        if (next) next.disabled = pos >= max - 2;
        if (thumb && thumb.parentNode) {
          var railWidth = thumb.parentNode.clientWidth;
          var visible = Math.min(1, track.clientWidth / track.scrollWidth);
          var w = Math.max(0.1, visible);
          thumb.style.width = (w * 100).toFixed(2) + '%';
          thumb.style.transform = 'translateX(' + (ratio * Math.max(0, railWidth - railWidth * w)).toFixed(1) + 'px)';
        }
      }

      if (prev) prev.addEventListener('click', function () { scrollByPanel(-1); });
      if (next) next.addEventListener('click', function () { scrollByPanel(1); });

      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); scrollByPanel(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByPanel(-1); }
        if (e.key === 'Home') { e.preventDefault(); track.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }
        if (e.key === 'End') { e.preventDefault(); track.scrollTo({ left: track.scrollWidth, behavior: reduceMotion ? 'auto' : 'smooth' }); }
      });

      var raf = false;
      track.addEventListener('scroll', function () {
        if (raf) return;
        raf = true;
        window.requestAnimationFrame(function () { raf = false; measure(); });
      }, { passive: true });

      window.addEventListener('resize', measure);
      measure();

      /* pointer drag for a walking-past feel */
      if (reduceMotion) return;
      var dragging = false, startX = 0, startLeft = 0;
      track.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        dragging = true; startX = e.clientX; startLeft = track.scrollLeft;
      });
      window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        track.scrollLeft = startLeft - (e.clientX - startX);
      });
      window.addEventListener('pointerup', function () { dragging = false; });
    });
  }

  /* ── 4. Book shelf: genre filter + reading note ───────── */
  function initShelf() {
    var shelf = document.getElementById('shelf');
    var bar = document.getElementById('genre-filter');
    if (!shelf) return;

    var spines = Array.prototype.slice.call(shelf.querySelectorAll('.spine'));
    var countEl = document.getElementById('shelf-count');
    var noteEls = {
      title: document.getElementById('note-title'),
      author: document.getElementById('note-author'),
      genre: document.getElementById('note-genre'),
      year: document.getElementById('note-year'),
      press: document.getElementById('note-press'),
      price: document.getElementById('note-price'),
      body: document.getElementById('note-body'),
      label: document.getElementById('note-plate-label')
    };

    function showNote(spine) {
      if (!noteEls.title) return;
      spines.forEach(function (s) { s.setAttribute('aria-pressed', String(s === spine)); });
      noteEls.title.textContent = spine.getAttribute('data-title');
      noteEls.author.textContent = spine.getAttribute('data-author');
      noteEls.genre.textContent = spine.getAttribute('data-genre-label');
      noteEls.year.textContent = spine.getAttribute('data-year');
      noteEls.press.textContent = spine.getAttribute('data-press');
      noteEls.price.textContent = spine.getAttribute('data-price');
      noteEls.body.textContent = spine.getAttribute('data-note');
      if (noteEls.label) noteEls.label.textContent = 'Shelf note · ' + spine.getAttribute('data-shelf');
    }

    function apply(genre, animate) {
      var shown = 0;
      spines.forEach(function (spine) {
        var match = genre === 'all' || spine.getAttribute('data-genre') === genre;
        if (match) shown++;
        if (animate && !reduceMotion) {
          spine.classList.add('is-fading');
          window.setTimeout(function () {
            spine.classList.toggle('is-out', !match);
            spine.classList.remove('is-fading');
          }, 170);
        } else {
          spine.classList.toggle('is-out', !match);
        }
      });
      if (countEl) {
        countEl.textContent = 'Showing ' + shown + ' of ' + spines.length + ' spines';
      }
      if (bar) {
        Array.prototype.forEach.call(bar.querySelectorAll('.filter-btn'), function (btn) {
          btn.setAttribute('aria-pressed', String(btn.getAttribute('data-genre') === genre));
        });
      }
      var firstVisible = spines.filter(function (s) {
        return genre === 'all' || s.getAttribute('data-genre') === genre;
      })[0];
      if (firstVisible) showNote(firstVisible);
      try {
        var url = new URL(window.location.href);
        if (genre === 'all') url.searchParams.delete('genre');
        else url.searchParams.set('genre', genre);
        window.history.replaceState({}, '', url);
      } catch (err) { /* older browsers: no deep link */ }
    }

    shelf.addEventListener('click', function (e) {
      var spine = e.target.closest('.spine');
      if (spine) showNote(spine);
    });

    if (bar) {
      bar.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (btn) apply(btn.getAttribute('data-genre'), true);
      });
    }

    var initial = 'all';
    try {
      var wanted = new URLSearchParams(window.location.search).get('genre');
      if (wanted && spines.some(function (s) { return s.getAttribute('data-genre') === wanted; })) initial = wanted;
    } catch (err) { /* no query support */ }

    if (initial !== 'all' || bar) apply(initial, false);
    else {
      var active = spines.filter(function (s) { return s.getAttribute('aria-pressed') === 'true'; })[0];
      showNote(active || spines[0]);
      if (countEl) countEl.textContent = 'Showing ' + spines.length + ' of ' + spines.length + ' spines';
    }
  }

  /* ── 5. Events filter ─────────────────────────────────── */
  function initEvents() {
    var list = document.getElementById('event-list');
    var bar = document.getElementById('event-filter');
    if (!list || !bar) return;

    var rows = Array.prototype.slice.call(list.querySelectorAll('.event'));
    var countEl = document.getElementById('event-count');

    function apply(filter) {
      var shown = 0;
      rows.forEach(function (row) {
        var kind = row.getAttribute('data-kind');
        var match = filter === 'all' ||
          (filter === 'free' && row.getAttribute('data-price') === 'free') ||
          (filter === 'paid' && row.getAttribute('data-price') === 'paid') ||
          (filter === 'past' && kind === 'past') ||
          (filter === 'upcoming' && kind === 'upcoming');
        row.hidden = !match;
        if (match) shown++;
      });
      Array.prototype.forEach.call(bar.querySelectorAll('.filter-btn'), function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-filter') === filter));
      });
      if (countEl) countEl.textContent = shown + ' ' + (shown === 1 ? 'night' : 'nights') + ' listed';
    }

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (btn) apply(btn.getAttribute('data-filter'));
    });
    apply('upcoming');
  }

  /* ── 6. Forms (footer leaf, club signup, contact) ─────── */
  function initForms() {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    function succeed(form, message) {
      var status = form.querySelector('.form-status');
      form.querySelectorAll('input, textarea, select').forEach(function (field) {
        if (field.type === 'checkbox' || field.type === 'radio') field.checked = false;
        else field.value = '';
      });
      if (status) {
        status.textContent = message;
        status.setAttribute('data-state', 'ok');
      }
    }

    function fail(form, message) {
      var status = form.querySelector('.form-status');
      if (status) {
        status.textContent = message;
        status.setAttribute('data-state', 'bad');
      }
    }

    function markInvalid(form) {
      form.querySelectorAll('[required]').forEach(function (field) {
        if (field.type === 'checkbox') {
          if (!field.checked) field.classList.add('field-error');
        } else if (!field.value.trim() || (field.type === 'email' && !emailRe.test(field.value.trim()))) {
          field.setAttribute('aria-invalid', 'true');
        } else {
          field.removeAttribute('aria-invalid');
        }
      });
    }

    var forms = document.querySelectorAll('form[data-form]');
    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var kind = form.getAttribute('data-form');
        var email = form.querySelector('input[type="email"]');
        if (!email || !emailRe.test(email.value.trim())) {
          markInvalid(form);
          if (email) email.focus();
          fail(form, 'Please enter a working email address.');
          return;
        }
        if (kind === 'club' || kind === 'contact') {
          var name = form.querySelector('input[name="name"]');
          if (!name || name.value.trim().length < 2) {
            markInvalid(form);
            if (name) name.focus();
            fail(form, 'Tell us what to call you.');
            return;
          }
          var consent = form.querySelector('input[type="checkbox"][required]');
          if (consent && !consent.checked) {
            consent.classList.add('field-error');
            consent.focus();
            fail(form, 'We need the box ticked to hold a seat for you.');
            return;
          }
          if (kind === 'club') {
            var club = form.querySelector('input[name="club"]:checked');
            if (!club) {
              fail(form, 'Choose which club you would like to join.');
              var firstClub = form.querySelector('input[name="club"]');
              if (firstClub) firstClub.focus();
              return;
            }
            succeed(form, 'Seat held — ' + club.value + '. Check your inbox for a confirmation from Imogen.');
            return;
          }
          succeed(form, 'Message saved. We answer every note within two working days.');
          return;
        }
        succeed(form, 'You are on the list — first Friday, every month.');
      });

      form.addEventListener('input', function () {
        var status = form.querySelector('.form-status');
        if (status && status.getAttribute('data-state') === 'bad') {
          status.textContent = '';
          status.removeAttribute('data-state');
        }
        form.querySelectorAll('[aria-invalid]').forEach(function (f) {
          if (f.value.trim() && (f.type !== 'email' || emailRe.test(f.value.trim()))) f.removeAttribute('aria-invalid');
        });
      });
    });
  }

  /* ── 7. Footer year ───────────────────────────────────── */
  function initYear() {
    var els = document.querySelectorAll('[data-year]');
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(els, function (el) { el.textContent = y; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initNav();
    initDioramas();
    initShelf();
    initEvents();
    initForms();
    initYear();
  });
})();
