/* ============================================================
   VELVET VIBRANCE — script.js  v3
   "Blood runs velvet gold"
   ============================================================ */

/* ── A. Lenis Smooth Scroll ─────────────────────────────────── */
(function initLenis() {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
  script.onload = function () {
    const lenis = new Lenis({
      duration: 1.35,
      easing: function (t) { return 1 - Math.pow(1 - t, 4); },
      smooth: true,
      smoothTouch: false
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    window._lenis = lenis;

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const id = this.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeNav();
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      });
    });
  };
  document.head.appendChild(script);
})();


/* ── C. Entry Screen — Letter Spring ─────────────────────── */
(function initEntry() {
  var entry   = document.getElementById('entry-screen');
  var titleEl = document.getElementById('entry-title');
  if (!entry) return;

  document.body.classList.add('entry-open');

  /* Letter-by-letter title animation */
  var TEXT        = 'VELVET VIBRANCE';
  var BASE_DELAY  = 0.2;
  var STAGGER     = 0.06;
  var letterIndex = 0;

  TEXT.split('').forEach(function (char) {
    if (char === ' ') {
      var space = document.createElement('span');
      space.className = 'entry-letter-space';
      titleEl.appendChild(space);
    } else {
      var span = document.createElement('span');
      span.className = 'entry-letter';
      span.textContent = char;
      span.style.animationDelay = (BASE_DELAY + letterIndex * STAGGER).toFixed(3) + 's';
      titleEl.appendChild(span);
      letterIndex++;
    }
  });

  /* Dismiss — triggered by initEntryDots when zoom fires */
  window._vvDismissEntry = function () {
    if (entry.classList.contains('sweep-out')) return;
    entry.classList.add('sweep-out');
    document.body.classList.remove('entry-open');
    setTimeout(function () { entry.style.display = 'none'; }, 1200);
  };

  /* Fallback: if Three.js never loaded, auto-dismiss after 3s */
  setTimeout(function () {
    if (typeof THREE !== 'undefined') return;
    if (window._vvDismissEntry) window._vvDismissEntry();
  }, 3000);
})();


/* ── Entry Dots — Two mirrored waves, auto-zoom ─────────────── */
(function initEntryDots() {
  if (typeof THREE === 'undefined') return;
  var container = document.getElementById('entry-screen');
  if (!container) return;

  var SEP    = 115;   /* dot spacing */
  var NX     = 44;    /* columns (wide enough to bleed off-screen) */
  var NZ     = 16;    /* rows (depth) */
  var YOFF   = 285;   /* distance above/below center — text sits in the gap */
  var AMPL   = 45;    /* wave amplitude */
  var Z0     = 1450;  /* camera start Z */
  var Z1     = 680;   /* camera end Z (zoom destination) */
  var ZOOM_D = 1050;  /* zoom duration ms */
  var AUTO_D = 1200;  /* ms after load before zoom kicks off */

  var scene  = new THREE.Scene();
  var W = window.innerWidth, H = window.innerHeight;

  /* Camera looks straight ahead, Y=0 = screen centre (where text sits) */
  var camera = new THREE.PerspectiveCamera(60, W / H, 1, 10000);
  camera.position.set(0, 0, Z0);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  var canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  container.appendChild(canvas);

  /* Build one grid — yBase is its vertical centre; sign mirrors the wave */
  function buildGrid(yBase, sign) {
    var pos = [], col = [];
    for (var ix = 0; ix < NX; ix++) {
      for (var iz = 0; iz < NZ; iz++) {
        pos.push(
          ix * SEP - (NX * SEP) / 2,
          yBase,
          iz * SEP - (NZ * SEP) / 2
        );
        col.push(0.863, 0.118, 0.118); /* red */
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({
      size: 5, vertexColors: true, transparent: true, opacity: 0.62, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(geo, mat));
    return { geo: geo, mat: mat, yBase: yBase, sign: sign };
  }

  /* Upper band waves UP away from text; lower mirrors it DOWN */
  var grids = [
    buildGrid( YOFF,  1),
    buildGrid(-YOFF, -1),
  ];

  var count = 0, animId;
  var zooming = false, zoomT0 = 0;

  function tick() {
    animId = requestAnimationFrame(tick);

    grids.forEach(function (g) {
      var arr = g.geo.attributes.position.array;
      var i = 0;
      for (var ix = 0; ix < NX; ix++) {
        for (var iz = 0; iz < NZ; iz++) {
          var wave = Math.sin((ix + count) * 0.3) * AMPL
                   + Math.sin((iz + count) * 0.5) * AMPL;
          arr[i * 3 + 1] = g.yBase + wave * g.sign;
          i++;
        }
      }
      g.geo.attributes.position.needsUpdate = true;
    });

    if (zooming) {
      var t = Math.min((Date.now() - zoomT0) / ZOOM_D, 1);
      var e = t * t * t; /* ease-in cubic — builds speed */
      camera.position.z = Z0 + (Z1 - Z0) * e;
    }

    renderer.render(scene, camera);
    count += 0.028;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  /* Auto-zoom fires after AUTO_D ms — no user input needed */
  setTimeout(function () {
    zooming = true;
    zoomT0  = Date.now();

    /* Entry screen sweeps 350ms into the zoom — dots already rushing forward */
    setTimeout(function () {
      if (window._vvDismissEntry) window._vvDismissEntry();
    }, 350);

    /* Three.js teardown after sweep fully clears */
    setTimeout(function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      grids.forEach(function (g) { g.geo.dispose(); g.mat.dispose(); });
      renderer.dispose();
    }, 350 + 1350);
  }, AUTO_D);

  tick();
})();


/* ── D. Hamburger / Nav Overlay ─────────────────────────────── */
function closeNav() {
  const overlay   = document.getElementById('nav-overlay');
  const hamburger = document.getElementById('hamburger');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  hamburger && hamburger.classList.remove('open');
  hamburger && hamburger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
}

(function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('nav-overlay');
  if (!nav) return;

  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  if (hamburger && overlay) {
    hamburger.addEventListener('click', function () {
      const isOpen = overlay.classList.contains('open');
      if (isOpen) {
        closeNav();
      } else {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-open');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeNav();
    });
  }
})();

/* ── E. Scroll Progress Bar ──────────────────────────────────── */
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  }, { passive: true });
})();

/* ── F. Scroll Reveals (fade-up, slide-right) ───────────────── */
(function initReveals() {
  const els = document.querySelectorAll('.reveal-up, .reveal-right, .about-quote.reveal-clip, .join-headline.reveal-clip');
  if (!els.length) return;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  els.forEach(function (el) { observer.observe(el); });
})();

/* ── G. Word-Level Stagger Reveal ───────────────────────────── */
function splitWords(el) {
  if (!el || el.dataset.wordSplit) return;
  el.dataset.wordSplit = '1';
  const text = el.innerHTML;
  // Split on spaces, preserve existing HTML tags/spans
  const words = text.split(/(\s+)/);
  el.innerHTML = words.map(function (chunk) {
    if (/^\s+$/.test(chunk)) return chunk;
    return `<span class="word"><span class="word-inner">${chunk}</span></span>`;
  }).join('');
  el.classList.add('word-split');
}

(function initWordReveals() {
  const targets = [
    document.querySelector('.about-quote'),
    document.querySelector('#events .section-title'),
    document.querySelector('#gallery .section-title')
  ].filter(Boolean);

  if (!targets.length) return;

  targets.forEach(function (el) { splitWords(el); });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // Stagger each word-inner
      const wordInners = el.querySelectorAll('.word-inner');
      wordInners.forEach(function (wi, i) {
        wi.style.transitionDelay = (i * 42) + 'ms';
      });
      el.classList.add('words-visible');
      observer.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { observer.observe(el); });
})();

/* ── H. Gallery — Clip-Path Cascade + Grayscale Lift ────────── */
(function initGallery() {
  const gallerySection = document.getElementById('gallery');
  if (!gallerySection) return;

  const items = gallerySection.querySelectorAll('.rg-item');
  if (!items.length) return;

  // Section-level observer: activate colour on enter
  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      gallerySection.classList.toggle('gallery-active', entry.isIntersecting);
    });
  }, { threshold: 0.05 });
  sectionObserver.observe(gallerySection);

  // Item-level observer: clip-path cascade reveal
  const itemObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const item  = entry.target;
      const index = parseInt(item.dataset.revealIndex || '0', 10);
      setTimeout(function () {
        item.classList.add('rg-revealed');
      }, index * 90);
      itemObserver.unobserve(item);
    });
  }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });

  items.forEach(function (item, i) {
    item.dataset.revealIndex = i;
    itemObserver.observe(item);
  });
})();

/* ── I. Section Depth-of-Field Blur ─────────────────────────── */
(function initSectionDOF() {
  const sections = document.querySelectorAll('.section-dof');
  if (!sections.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('dof-blur', !entry.isIntersecting);
    });
  }, { threshold: 0.15 });

  sections.forEach(function (s) { observer.observe(s); });
})();

/* ── J. Layered Hero Parallax ───────────────────────────────── */
(function initHeroParallax() {
  const heroBg       = document.getElementById('hero-bg');
  const heroVignette = document.getElementById('hero-vignette');
  if (!heroBg) return;

  window.addEventListener('scroll', function () {
    const y = window.scrollY;
    heroBg.style.transform       = 'scale(1.05) translateY(' + (y * 0.35) + 'px)';
    if (heroVignette) {
      heroVignette.style.transform = 'translateY(' + (y * 0.12) + 'px)';
    }
  }, { passive: true });
})();

/* ── K. Magnetic Cursor ─────────────────────────────────────── */
(function initMagnetic() {
  // Only on non-touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const STRENGTH = 0.28;

  function attachMagnetic(el, strength) {
    strength = strength || STRENGTH;

    el.addEventListener('mousemove', function (e) {
      const rect   = el.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) * strength;
      const dy     = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'transform 0.2s ease';
    });

    el.addEventListener('mouseleave', function () {
      el.style.transform  = '';
      el.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
  }

  // nav logo
  const navLogo = document.querySelector('.nav-logo');
  if (navLogo) attachMagnetic(navLogo, 0.35);

  // hero cta
  const heroCta = document.querySelector('.hero-cta');
  if (heroCta) attachMagnetic(heroCta, 0.25);

  // gallery items (lighter pull)
  document.querySelectorAll('.rg-item').forEach(function (item) {
    attachMagnetic(item, 0.06);
  });
})();

/* ── L. Gallery Lightbox (Image + Video) ────────────────────── */
(function initLightbox() {
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightbox-img');
  const lightboxVideo = document.getElementById('lightbox-video');
  const lightboxClose = document.getElementById('lightbox-close');
  if (!lightbox) return;

  const gallerySection = document.getElementById('gallery');
  if (gallerySection) {
    gallerySection.querySelectorAll('.rg-item').forEach(function (item) {
      item.addEventListener('click', function () {
        const isVideo = item.classList.contains('rg-video');
        const src = isVideo
          ? item.querySelector('video').src
          : item.querySelector('img').src;

        if (isVideo) {
          lightboxImg.style.display   = 'none';
          lightboxVideo.style.display = 'block';
          lightboxVideo.src = src;
          lightboxVideo.play();
        } else {
          lightboxVideo.pause();
          lightboxVideo.src = '';
          lightboxVideo.style.display = 'none';
          lightboxImg.style.display   = 'block';
          lightboxImg.src = src;
        }

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (window._lenis) window._lenis.stop();
      });
    });
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.src = '';
    lightboxVideo.pause();
    lightboxVideo.src = '';
    lightboxVideo.style.display = 'none';
    lightboxImg.style.display   = 'block';
    if (window._lenis) window._lenis.start();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();

/* ── M. 3D Card Hover ────────────────────────────────────────── */
window.initCard3D = function () {
  const grid = document.getElementById('events-grid');
  if (!grid) return;

  grid.addEventListener('mousemove', function (e) {
    const card = e.target.closest('.event-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / rect.width;
    const y    = (e.clientY - rect.top)  / rect.height;
    const rotX = (y - 0.5) * -10;
    const rotY = (x - 0.5) *  10;
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
  });

  grid.addEventListener('mouseout', function (e) {
    const card = e.target.closest('.event-card');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.transform = '';
    }
  });
};

/* ── N. Event Card Staggered Entrance ───────────────────────── */
window.staggerCards = function () {
  const cards = document.querySelectorAll('.event-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver(function (entries) {
    if (!entries.some(e => e.isIntersecting)) return;
    cards.forEach(function (card, i) {
      setTimeout(function () {
        card.classList.add('card-visible');
      }, i * 120);
    });
    observer.disconnect();
  }, { threshold: 0.05 });

  const grid = document.getElementById('events-grid');
  if (grid) observer.observe(grid);
};

/* ── O. Video Gallery Hover Autoplay ────────────────────────── */
(function initVideoHover() {
  document.querySelectorAll('.rg-item.rg-video video').forEach(function (video) {
    const item = video.closest('.rg-item');
    item.addEventListener('mouseenter', function () { video.play(); });
    item.addEventListener('mouseleave', function () { video.pause(); video.currentTime = 0; });
  });
})();

/* ── P. Join Form ────────────────────────────────────────────── */
(function initJoinForm() {
  const form = document.getElementById('join-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = form.querySelector('.join-input');
    const btn   = form.querySelector('.join-btn');
    if (!input || !input.value.trim()) return;

    btn.textContent = "YOU'RE IN";
    btn.style.color = '#fff';
    input.value = '';
    input.placeholder = "YOU'RE IN THE FREQUENCY";

    setTimeout(function () {
      btn.textContent = 'JOIN';
      btn.style.color = '';
      input.placeholder = 'Your email address';
    }, 4000);
  });
})();
