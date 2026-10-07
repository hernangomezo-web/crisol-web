/* Crisol Santiago — v2 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');
  var progreso = document.getElementById('progreso');
  var waFloat = document.getElementById('wa-float');
  var hero = document.getElementById('top');

  /* ── Scroll: barra de progreso, cabecera que se oculta al bajar, parallax ── */
  var parallax = reduceMotion ? null : document.querySelector('[data-parallax]');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progreso.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    var menuAbierto = document.body.classList.contains('menu-open');
    header.classList.toggle('is-scrolled', y > 20);
    header.classList.toggle('is-over-hero', !menuAbierto && y < hero.offsetHeight - header.offsetHeight);
    header.classList.toggle('is-hidden', !menuAbierto && y > lastY && y > 400);
    lastY = y;

    if (parallax) {
      var r = parallax.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight));
        parallax.style.transform = 'translate3d(0,' + (p * 4).toFixed(2) + '%,0)';
      }
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ── Menú móvil ── */
  var ham = document.getElementById('ham');
  var drawer = document.getElementById('drawer');

  function setMenu(abrir) {
    ham.setAttribute('aria-expanded', String(abrir));
    ham.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    drawer.classList.toggle('is-open', abrir);
    document.body.classList.toggle('menu-open', abrir);
    if (abrir) header.classList.remove('is-hidden');
    onScroll();
  }
  ham.addEventListener('click', function () {
    setMenu(ham.getAttribute('aria-expanded') !== 'true');
  });
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setMenu(false); ham.focus(); }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ── Apariciones al hacer scroll ── */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Contadores (el HTML ya trae la cifra final; aquí solo se anima) ── */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = +el.dataset.count;
        var t0 = performance.now();
        var dur = 1800;
        (function frame(t) {
          var k = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - k, 4))).toLocaleString('es-ES');
          if (k < 1) requestAnimationFrame(frame);
        })(t0);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; co.observe(el); });
  }

  /* ── Enlace activo del menú según la sección visible ── */
  var navLinks = document.querySelectorAll('.nav-links a');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id));
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) so.observe(s);
    });
  }

  /* ── Botón flotante de WhatsApp: aparece tras el hero y se esconde junto al banner ── */
  if ('IntersectionObserver' in window) {
    var waBanner = document.getElementById('contacto');
    var heroVisible = true;
    var bannerVisible = false;
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        else bannerVisible = e.isIntersecting;
      });
      waFloat.classList.toggle('is-hidden', heroVisible || bannerVisible);
    }, { threshold: 0.15 });
    fo.observe(hero);
    fo.observe(waBanner);
  } else {
    waFloat.classList.remove('is-hidden');
  }

  /* ── Carrusel de testimonios (se activa solo con 2 o más opiniones) ── */
  (function () {
    var card = document.querySelector('.t-card');
    if (!card) return;
    var slides = card.querySelectorAll('.t-slide');
    if (slides.length < 2) return;
    var ctrl = card.querySelector('.t-ctrl');
    var dotsBox = card.querySelector('.t-dots');
    var actual = 0;
    var timer = null;
    var dots = [];

    slides.forEach(function (sl, i) {
      sl.setAttribute('aria-roledescription', 'opinión');
      sl.setAttribute('aria-label', (i + 1) + ' de ' + slides.length);
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Ver opinión ' + (i + 1));
      d.addEventListener('click', function () { ir(i); reiniciar(); });
      dotsBox.appendChild(d);
      dots.push(d);
    });
    ctrl.hidden = false;

    function ir(n) {
      var siguiente = (n + slides.length) % slides.length;
      if (siguiente === actual) return;
      slides[actual].classList.remove('is-active');
      slides[actual].classList.add('is-prev');
      var anterior = slides[actual];
      setTimeout(function () { anterior.classList.remove('is-prev'); }, 900);
      actual = siguiente;
      slides[actual].classList.add('is-active');
      dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === actual)); });
    }
    function parar() { clearInterval(timer); timer = null; }
    function reiniciar() {
      parar();
      if (!reduceMotion) timer = setInterval(function () { ir(actual + 1); }, 4000);
    }

    dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === 0)); });
    card.querySelectorAll('.t-btn').forEach(function (b) {
      b.addEventListener('click', function () { ir(actual + Number(b.dataset.dir)); reiniciar(); });
    });
    card.addEventListener('mouseenter', parar);
    card.addEventListener('mouseleave', reiniciar);
    card.addEventListener('focusin', parar);
    card.addEventListener('focusout', reiniciar);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { ir(actual - 1); reiniciar(); }
      if (e.key === 'ArrowRight') { ir(actual + 1); reiniciar(); }
    });
    /* Deslizar con el dedo */
    var x0 = null;
    card.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { ir(actual + (dx < 0 ? 1 : -1)); reiniciar(); }
      x0 = null;
    });
    reiniciar();
  })();

  /* ── Meta Pixel: evento Contact en cualquier enlace de WhatsApp ──
     Delegado en document para que funcione aunque el script cargue antes que el DOM. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="wa.me"]');
    if (!a || typeof window.fbq !== 'function') return;
    var col = a.dataset.coleccion;
    window.fbq('track', 'Contact', col ? { content_name: col } : undefined);
  });
})();
