/* ==========================================================================
   FORGE — shared behaviour
   Primary motion: scroll progress bar. Secondary: hero cursor spotlight.
   Everything else is functional (nav, filters, calculator, validation).
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------- */
  /* 1. Scroll progress (scaleX on a fixed 2px bar)                          */
  /* ---------------------------------------------------------------------- */
  var bar = document.getElementById('progress-bar');
  if (bar) {
    var rafId = 0;
    var setProgress = function () {
      rafId = 0;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(Math.max(window.pageYOffset / max, 0), 1) : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      doc.style.setProperty('--scroll-progress', ratio.toFixed(4));
    };
    var request = function () {
      if (!rafId) rafId = window.requestAnimationFrame(setProgress);
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    setProgress();
  }

  /* ---------------------------------------------------------------------- */
  /* 2. Hero cursor spotlight (rAF-throttled pointermove -> CSS vars)        */
  /* ---------------------------------------------------------------------- */
  var hero = document.querySelector('.hero');
  if (hero && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pending = false;
    var point = { x: 0, y: 0 };
    var paint = function () {
      pending = false;
      var rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var px = ((point.x - rect.left) / rect.width) * 100;
      var py = ((point.y - rect.top) / rect.height) * 100;
      hero.style.setProperty('--mx', px.toFixed(2) + '%');
      hero.style.setProperty('--my', py.toFixed(2) + '%');
    };
    hero.addEventListener('pointermove', function (e) {
      hero.classList.add('is-live');
      point.x = e.clientX;
      point.y = e.clientY;
      if (!pending) {
        pending = true;
        window.requestAnimationFrame(paint);
      }
    });
    hero.addEventListener('pointerleave', function () {
      hero.classList.remove('is-live');
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 3. Mobile navigation                                                    */
  /* ---------------------------------------------------------------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var navList = document.getElementById('site-nav');
  if (menuBtn && navList) {
    var setOpen = function (open) {
      navList.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menuBtn.textContent = open ? 'CLOSE' : 'MENU';
    };
    menuBtn.addEventListener('click', function () {
      setOpen(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navList.classList.contains('is-open')) {
        setOpen(false);
        menuBtn.focus();
      }
    });
    navList.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 4. Section index rail — marks the section you are reading               */
  /* ---------------------------------------------------------------------- */
  var railLinks = Array.prototype.slice.call(document.querySelectorAll('.rail-nav a'));
  if (railLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    railLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) map[id] = link;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          railLinks.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      spy.observe(document.getElementById(id));
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 5. Weekly schedule filter (schedule.html)                               */
  /* ---------------------------------------------------------------------- */
  var sched = document.getElementById('schedule');
  if (sched) {
    var dayBtns = Array.prototype.slice.call(document.querySelectorAll('[data-day-filter]'));
    var typeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-type-filter]'));
    var rows = Array.prototype.slice.call(sched.querySelectorAll('tbody tr[data-day]'));
    var emptyRow = sched.querySelector('.empty-row');
    var readout = document.getElementById('class-count');
    var state = { day: 'all', type: 'all' };

    var apply = function () {
      var shown = 0;
      rows.forEach(function (row) {
        var okDay = state.day === 'all' || row.getAttribute('data-day') === state.day;
        var okType = state.type === 'all' || row.getAttribute('data-type') === state.type;
        var visible = okDay && okType;
        row.hidden = !visible;
        if (visible) shown += 1;
      });
      if (emptyRow) emptyRow.hidden = shown > 0;
      if (readout) {
        var label = state.day === 'all' ? 'the full week' : state.day.toUpperCase();
        var tlabel = state.type === 'all' ? '' : ' · ' + state.type.toUpperCase();
        readout.textContent = shown + ' class' + (shown === 1 ? '' : 'es') + ' in ' + label + tlabel;
      }
    };

    var wire = function (buttons, key) {
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          state[key] = btn.getAttribute(key === 'day' ? 'data-day-filter' : 'data-type-filter');
          buttons.forEach(function (other) {
            other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
          });
          apply();
        });
      });
    };
    wire(dayBtns, 'day');
    wire(typeBtns, 'type');
    apply();
  }

  /* ---------------------------------------------------------------------- */
  /* 6. BMI readout widget (membership.html)                                 */
  /* ---------------------------------------------------------------------- */
  var bmiForm = document.getElementById('bmi-form');
  if (bmiForm) {
    var hIn = bmiForm.querySelector('#bmi-height');
    var wIn = bmiForm.querySelector('#bmi-weight');
    var outNum = document.getElementById('bmi-value');
    var outBand = document.getElementById('bmi-band-name');
    var outNote = document.getElementById('bmi-note');
    var pin = document.getElementById('bmi-pin');
    var unitsSel = document.getElementById('bmi-units');
    var BANNDS = [
      { max: 18.5, name: 'Under-fuelled', note: 'Below the range we want for heavy training. Build mass before max-effort work.' },
      { max: 25, name: 'Standard range', note: 'Healthy reference band. Strength gains come from progressive overload, not the scale.' },
      { max: 30, name: 'Above standard', note: 'Common with a strength history — dense muscle moves the number too.' },
      { max: 99, name: 'Well above standard', note: 'Talk to a coach first. We start with low-impact engine work, then load.' }
    ];

    var classify = function (value) {
      for (var i = 0; i < BANNDS.length; i++) {
        if (value < BANNDS[i].max) return BANNDS[i];
      }
      return BANNDS[BANNDS.length - 1];
    };

    var render = function () {
      var cm = parseFloat(hIn.value);
      var kg = parseFloat(wIn.value);
      if (unitsSel.value === 'imperial') { cm = cm * 2.54; kg = kg * 0.453592; }
      if (!isFinite(cm) || !isFinite(kg) || cm < 120 || cm > 230 || kg < 30 || kg > 300) {
        outNum.textContent = '--.-';
        outNum.classList.add('idle');
        outBand.textContent = 'Awaiting valid height and weight';
        outNote.textContent = 'Enter a height between 120–230 cm and a weight between 30–300 kg (or the imperial equivalents).';
        pin.style.left = '0%';
        return;
      }
      var metres = cm / 100;
      var value = kg / (metres * metres);
      var band = classify(value);
      outNum.textContent = value.toFixed(1);
      outNum.classList.remove('idle');
      outBand.textContent = band.name;
      outNote.textContent = band.note + ' BMI is a population screen, not a diagnosis — it ignores muscle mass, bone density and training age.';
      var pct = Math.min(Math.max((value - 15) / (35 - 15), 0), 1) * 100;
      pin.style.left = pct.toFixed(1) + '%';
    };

    [hIn, wIn, unitsSel].forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  }

  /* ---------------------------------------------------------------------- */
  /* 7. Form validation (trial signup, guest-pass enquiry)                   */
  /* ---------------------------------------------------------------------- */
  var validators = {
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
    },
    phone: function (v) {
      return v.replace(/[^0-9]/g, '').length >= 7;
    }
  };

  var validateForm = function (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll('[data-rule]'));
    var firstBad = null;
    fields.forEach(function (input) {
      var field = input.closest('.field');
      var err = form.querySelector('[data-err-for="' + input.id + '"]');
      var rule = input.getAttribute('data-rule');
      var message = '';
      var value = input.value;

      if (rule === 'consent') {
        if (!input.checked) message = 'Tick this to continue.';
      } else if (!value.trim()) {
        message = 'This field is required.';
      } else if (rule === 'email' && !validators.email(value)) {
        message = 'Enter a valid email address, e.g. you@example.com';
      } else if (rule === 'phone' && !validators.phone(value)) {
        message = 'Enter a phone number with at least 7 digits.';
      } else if (rule === 'name' && value.trim().length < 2) {
        message = 'Enter your full name.';
      } else if (rule === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        message = 'Pick a date in the calendar.';
      }

      if (field) field.classList.toggle('is-bad', !!message);
      if (err) err.textContent = message;
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (message && !firstBad) firstBad = input;
    });
    return firstBad;
  };

  Array.prototype.slice.call(document.querySelectorAll('form[data-validate]')).forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validateForm(form);
      var done = document.querySelector(form.getAttribute('data-result'));
      if (bad) {
        if (done) done.hidden = true;
        bad.focus();
        return;
      }
      if (done) {
        var who = form.querySelector('[data-rule="name"]');
        var name = who && who.value.trim() ? who.value.trim().split(' ')[0] : 'athlete';
        var slot = form.querySelector('select[name="goal"]');
        var goal = slot && slot.value ? slot.options[slot.selectedIndex].text.toLowerCase() : 'training';
        done.querySelector('[data-out-name]').textContent = name;
        if (done.querySelector('[data-out-goal]')) {
          done.querySelector('[data-out-goal]').textContent = goal;
        }
        done.hidden = false;
        done.focus();
      }
      form.reset();
      Array.prototype.slice.call(form.querySelectorAll('.field')).forEach(function (f) {
        f.classList.remove('is-bad');
      });
      Array.prototype.slice.call(form.querySelectorAll('.err')).forEach(function (el) {
        el.textContent = '';
      });
    });

  });

  /* ---------------------------------------------------------------------- */
  /* 8. Footer year                                                          */
  /* ---------------------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
