/* RCCG JHSV — shared site behaviors.
   Restraint per the style guide motion section. */

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Mobile nav toggle ----
  var topbar = document.querySelector('.topbar');
  var menuBtn = document.querySelector('.topbar .menu-btn');
  if (menuBtn && topbar) {
    menuBtn.addEventListener('click', function () {
      topbar.classList.toggle('menu-open');
      menuBtn.setAttribute(
        'aria-expanded',
        topbar.classList.contains('menu-open') ? 'true' : 'false'
      );
    });
    topbar.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        topbar.classList.remove('menu-open');
      });
    });
  }

  // ---- Spotlight border cards: track cursor across the grid ----
  document.querySelectorAll('.spot-grid').forEach(function (grid) {
    grid.addEventListener('mousemove', function (e) {
      grid.querySelectorAll('.spot-card').forEach(function (card) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  });

  // ---- Magnetic buttons ----
  if (!reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var strength = 0.25;
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = (e.clientX - cx) * strength;
        var dy = (e.clientY - cy) * strength;
        btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  // ---- Scroll reveal ----
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- Sticky stack: activate the card + matching visual state on enter ----
  var stack = document.querySelector('[data-stack]');
  if (stack) {
    var cards = stack.querySelectorAll('.stack-card');
    var states = stack.querySelectorAll('.stack-state');

    function activate(num) {
      cards.forEach(function (c) {
        c.classList.toggle('active', c.dataset.feature === num);
      });
      states.forEach(function (s) {
        s.classList.toggle('active', s.dataset.state === num);
      });
    }

    if ('IntersectionObserver' in window) {
      var stackIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activate(entry.target.dataset.feature);
          }
        });
      }, { threshold: 0.6 });
      cards.forEach(function (c) { stackIO.observe(c); });
    } else {
      cards.forEach(function (c) { c.classList.add('active'); });
      states.forEach(function (s) { s.classList.add('active'); });
    }
  }

  // ---- Newsletter / form stub: prevent default submit on draft pages ----
  document.querySelectorAll('form[data-stub]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('[data-stub-msg]');
      if (note) {
        note.textContent = 'Thanks — this form is a draft. We\'ll wire it up next.';
        note.style.display = 'block';
      }
    });
  });
})();
