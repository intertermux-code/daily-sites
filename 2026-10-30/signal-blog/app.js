/* =============================================================
   SIGNAL — shared behaviour
   Signature motion: Word-Stagger Headline + Parallax Layers
   Every module is guarded by element-existence checks.
   ============================================================= */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return motionQuery.matches; }

  /* ---------- 1. Word-Stagger Headline ---------- */
  function initWordStagger() {
    var lines = document.querySelectorAll('.split-line');
    if (!lines.length) return;
    Array.prototype.forEach.call(lines, function (line) {
      var words = (line.textContent || '').trim().split(/\s+/);
      if (!words.length) return;
      line.textContent = '';
      words.forEach(function (word, i) {
        if (i > 0) line.appendChild(document.createTextNode(' '));
        var span = document.createElement('span');
        span.className = 'w';
        span.textContent = word;
        span.style.setProperty('--d', (reduced() ? 0 : i * 60) + 'ms');
        line.appendChild(span);
      });
    });
  }

  /* ---------- 2. Parallax Layers ---------- */
  function initParallax() {
    var roots = document.querySelectorAll('[data-parallax-root]');
    if (!roots.length) return;

    var layers = [];
    Array.prototype.forEach.call(roots, function (root) {
      Array.prototype.forEach.call(root.querySelectorAll('.layer[data-speed]'), function (el) {
        var speed = parseFloat(el.getAttribute('data-speed'));
        if (isNaN(speed)) return;
        layers.push({ el: el, speed: speed, root: root });
        el.style.transform = 'translate3d(0,0,0)';
      });
    });
    if (!layers.length) return;

    var ticking = false;
    var lastY = -1;

    function apply() {
      ticking = false;
      if (reduced()) {
        layers.forEach(function (l) { l.el.style.transform = 'translate3d(0,0,0)'; });
        return;
      }
      var vh = window.innerHeight || 800;
      layers.forEach(function (l) {
        var box = l.root.getBoundingClientRect();
        // distance the root has travelled relative to the viewport, clamped
        var shift = Math.max(-vh, Math.min(vh, vh - box.top)) - vh * 0.5;
        var y = -(shift * l.speed * 0.32);
        l.el.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
      });
    }

    function request() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (y === lastY || ticking) return;
      lastY = y;
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    motionQuery.addEventListener
      ? motionQuery.addEventListener('change', apply)
      : motionQuery.addListener(apply);
    apply();
  }

  /* ---------- 3. Navigation ---------- */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var list = document.getElementById('nav-list');
    if (!toggle || !list) return;

    function close() {
      if (!document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        close();
      }
    });

    Array.prototype.forEach.call(list.querySelectorAll('a'), function (a) {
      a.addEventListener('focus', function () {
        if (window.innerWidth > 900) return;
        if (!document.body.classList.contains('nav-open')) {
          document.body.classList.add('nav-open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* ---------- 4. Running head ---------- */
  function initRunningHead() {
    var head = document.getElementById('running-head');
    var siteHeader = document.getElementById('site-header');
    if (!head || !siteHeader) return;

    var ticking = false;
    function update() {
      ticking = false;
      var threshold = siteHeader.offsetHeight * 0.7;
      var y = window.pageYOffset || 0;
      head.classList.toggle('is-visible', y > threshold);
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- 5. Expandable ledger rows ---------- */
  function initLedger() {
    var rows = document.querySelectorAll('[data-ledger-row]');
    if (!rows.length) return;

    Array.prototype.forEach.call(rows, function (row) {
      var button = row.querySelector('.row-toggle');
      var panel = row.querySelector('.ledger-panel');
      var label = row.querySelector('.sr-only');
      if (!button || !panel) return;

      function setState(open) {
        row.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.inert = !open;
        if (label) {
          var title = row.querySelector('.row-title, .topic-name');
          var name = title ? title.textContent.trim() : 'this entry';
          label.textContent = (open ? 'Hide details for ' : 'Show details for ') + name;
        }
      }

      setState(row.classList.contains('is-open'));

      button.addEventListener('click', function () {
        setState(!row.classList.contains('is-open'));
      });

      // deep link support: #panel-011 opens the owning row
      if (panel.id && location.hash === '#' + panel.id) {
        setState(true);
        row.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      }
    });
  }

  /* ---------- 6. Reading progress + citation tools ---------- */
  function initArticleTools() {
    var article = document.getElementById('the-article');
    if (!article) return;

    var bar = document.createElement('div');
    bar.className = 'progress-rule';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var box = article.getBoundingClientRect();
      var total = box.height - window.innerHeight;
      var seen = Math.min(Math.max(-box.top, 0), Math.max(total, 1));
      var ratio = total > 0 ? seen / total : 1;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    var copy = document.getElementById('copy-link');
    if (copy) {
      copy.addEventListener('click', function () {
        var url = window.location.href;
        var done = function () {
          copy.classList.add('is-copied');
          copy.textContent = 'Link copied';
          window.setTimeout(function () {
            copy.classList.remove('is-copied');
            copy.textContent = 'Copy link';
          }, 2400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, done);
        } else {
          done();
        }
      });
    }

    var printBtn = document.getElementById('print-story');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
  }

  /* ---------- 7. Topics filter ---------- */
  function initTopicFilter() {
    var input = document.getElementById('topic-filter');
    var list = document.getElementById('all-topics');
    if (!input || !list) return;

    var rows = Array.prototype.slice.call(list.querySelectorAll('[data-topic-row]'));
    var count = document.getElementById('filter-count');
    var empty = document.getElementById('no-results');

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) {
        var hay = (row.getAttribute('data-search') || row.textContent).toLowerCase();
        var hit = !q || hay.indexOf(q) !== -1;
        row.hidden = !hit;
        if (hit) shown++;
      });
      if (count) count.textContent = String(shown);
      if (empty) empty.hidden = shown !== 0;
    }

    input.addEventListener('input', apply);

    if (location.hash.length > 1) {
      var target = document.getElementById(location.hash.slice(1));
      var row = target && target.closest ? target.closest('[data-topic-row]') : null;
      if (row) {
        var toggle = row.querySelector('.row-toggle');
        if (toggle && !row.classList.contains('is-open')) toggle.click();
      }
    }
  }

  /* ---------- 8. Subscribe form validation ---------- */
  function initSubscribeForm() {
    var form = document.getElementById('signup-form');
    if (!form) return;

    var status = document.getElementById('form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var rules = [
      {
        id: 'subscriber-name',
        test: function (v) { return v.trim().length >= 2; },
        message: 'Please give the name the letter should open with.'
      },
      {
        id: 'subscriber-email',
        test: function (v) { return emailRe.test(v.trim()); },
        message: 'That address is incomplete — check for a missing @ or domain.'
      }
    ];

    function setError(field, message) {
      var wrap = field.closest('.field');
      var slot = wrap ? wrap.querySelector('.field-error') : null;
      if (message) {
        field.setAttribute('aria-invalid', 'true');
        if (slot) slot.textContent = message;
      } else {
        field.removeAttribute('aria-invalid');
        if (slot) slot.textContent = '';
      }
    }

    rules.forEach(function (rule) {
      var field = document.getElementById(rule.id);
      if (!field) return;
      field.addEventListener('blur', function () {
        if (!field.value.trim()) return;
        setError(field, rule.test(field.value) ? '' : rule.message);
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true' && rule.test(field.value)) setError(field, '');
      });
    });

    var topicGroup = form.querySelectorAll('[name="topics"]');
    var topicError = document.getElementById('topics-error');
    function checkTopics(mark) {
      var any = Array.prototype.some.call(topicGroup, function (c) { return c.checked; });
      if (topicError) {
        topicError.textContent = mark && !any ? 'Choose at least one desk to follow.' : '';
      }
      Array.prototype.forEach.call(topicGroup, function (c) {
        c.setAttribute('aria-invalid', mark && !any ? 'true' : 'false');
      });
      return any;
    }
    if (topicGroup.length) {
      Array.prototype.forEach.call(topicGroup, function (c) {
        c.addEventListener('change', function () { checkTopics(true); });
      });
    }

    var consent = document.getElementById('consent');
    var consentError = document.getElementById('consent-error');
    function checkConsent(mark) {
      var ok = !consent || consent.checked;
      if (consentError && mark) consentError.textContent = ok ? '' : 'We need your consent before we can send anything.';
      if (consent) consent.setAttribute('aria-invalid', mark && !ok ? 'true' : 'false');
      return ok;
    }
    if (consent) consent.addEventListener('change', function () { checkConsent(true); });

    // choice styling
    Array.prototype.forEach.call(form.querySelectorAll('.choice input'), function (input) {
      input.addEventListener('change', function () {
        var same = form.querySelectorAll('[name="' + input.name + '"]');
        Array.prototype.forEach.call(same, function (sibling) {
          var box = sibling.closest('.choice');
          if (box) box.classList.toggle('is-chosen', sibling.checked);
        });
      });
    });

    if (status) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var problems = [];
        var firstBad = null;

        rules.forEach(function (rule) {
          var field = document.getElementById(rule.id);
          if (!field) return;
          var ok = rule.test(field.value);
          setError(field, ok ? '' : rule.message);
          if (!ok && !firstBad) firstBad = field;
          if (!ok) problems.push(rule.message);
        });

        if (!checkTopics(true)) {
          if (!firstBad) firstBad = topicGroup[0];
          problems.push('Choose at least one desk to follow.');
        }
        if (!checkConsent(true)) {
          if (!firstBad) firstBad = consent;
          problems.push('Confirm consent to be added to the list.');
        }

        var trap = form.querySelector('[name="company"]');
        if (trap && trap.value) return; // silently drop bot submissions

        status.className = 'form-status is-visible ' + (problems.length ? 'has-errors' : 'is-ok');

        var heading = status.querySelector('h3');
        var body = status.querySelector('p');
        var listEl = status.querySelector('ul');

        if (problems.length) {
          if (heading) heading.textContent = 'The form is not ready yet';
          if (body) body.textContent = 'Nothing has been sent. Please correct the following:';
          if (listEl) {
            listEl.replaceChildren();
            problems.forEach(function (p) {
              var li = document.createElement('li');
              li.textContent = p;
              listEl.appendChild(li);
            });
          }
          if (firstBad && firstBad.focus) firstBad.focus();
        } else {
          var cadenceEl = form.querySelector('[name="cadence"]:checked');
          var cadence = cadenceEl ? cadenceEl.closest('.choice').querySelector('span').textContent.trim() : 'the weekly ledger';
          var chosen = [];
          Array.prototype.forEach.call(topicGroup, function (c) {
            if (c.checked) chosen.push(c.closest('.choice').querySelector('span').textContent.trim());
          });
          var name = (document.getElementById('subscriber-name') || {}).value || '';
          var email = (document.getElementById('subscriber-email') || {}).value || '';
          if (heading) heading.textContent = 'You are on the list, ' + name.trim().split(/\s+/)[0] + '.';
          if (body) {
            body.textContent = 'A confirmation is on its way to ' + email.trim() + '. ' +
              'You chose ' + cadence.toLowerCase() + ', covering ' +
              chosen.join(', ').replace(/,([^,]*)$/, ' and$1') + '. ' +
              'The next issue leaves the desk on Friday at five.';
          }
          if (listEl) listEl.replaceChildren();
          var submit = form.querySelector('[type="submit"]');
          if (submit) submit.disabled = true;
        }
        status.setAttribute('role', problems.length ? 'alert' : 'status');
        status.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------- 9. CTA quick form ---------- */
  function initCtaForm() {
    var form = document.querySelector('.cta-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return; // let the subscribe page validate there
      e.preventDefault();
      window.location.href = 'subscribe.html?email=' + encodeURIComponent(input.value.trim());
    });
  }

  /* ---------- 10. Prefill from query string ---------- */
  function initPrefill() {
    var params = new URLSearchParams(window.location.search);
    var email = params.get('email');
    var field = document.getElementById('subscriber-email');
    if (field && email && !field.value) {
      field.value = email;
      field.focus();
    }
    var topic = params.get('topic');
    if (topic) {
      var box = document.querySelector('[data-topic="' + topic.replace(/[^\w-]/g, '') + '"]');
      if (box && box.querySelector) {
        var input = box.querySelector('input');
        if (input) { input.checked = true; input.dispatchEvent(new Event('change')); }
      }
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    initWordStagger();
    initParallax();
    initNav();
    initRunningHead();
    initLedger();
    initArticleTools();
    initTopicFilter();
    initSubscribeForm();
    initCtaForm();
    initPrefill();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
