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
})();


/* ── Entry Dots — Three.js wave, scroll-to-enter ─────────── */
(function initEntryDots() {
  if (typeof THREE === 'undefined') return;
  var container = document.getElementById('entry-screen');
  if (!container) return;

  var SEPARATION = 150, AMOUNTX = 40, AMOUNTY = 60;
  var CAM_START_Z = 1220, CAM_START_Y = 355;
  var CAM_END_Z   = 180,  CAM_END_Y   = 160;
  var ZOOM_DURATION = 950; /* ms */

  var scene  = new THREE.Scene();
  var W = window.innerWidth, H = window.innerHeight;

  var camera = new THREE.PerspectiveCamera(60, W / H, 1, 10000);
  camera.position.set(0, CAM_START_Y, CAM_START_Z);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  /* First child = behind title and any remaining overlay */
  var canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  container.insertBefore(canvas, container.firstChild);

  /* Build particle grid — red dots */
  var positions = [], colors = [];
  for (var ix = 0; ix < AMOUNTX; ix++) {
    for (var iy = 0; iy < AMOUNTY; iy++) {
      positions.push(
        ix * SEPARATION - (AMOUNTX * SEPARATION) / 2,
        0,
        iy * SEPARATION - (AMOUNTY * SEPARATION) / 2
      );
      /* Red: 220/255, 30/255, 30/255 */
      colors.push(0.863, 0.118, 0.118);
    }
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

  var material = new THREE.PointsMaterial({
    size: 6,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  scene.add(new THREE.Points(geometry, material));

  var count = 0, animId;
  var zooming = false, zoomStartTime = 0;

  function animateDots() {
    animId = requestAnimationFrame(animateDots);

    /* Slow wave */
    var pos = geometry.attributes.position.array;
    var i = 0;
    for (var xi = 0; xi < AMOUNTX; xi++) {
      for (var yi = 0; yi < AMOUNTY; yi++) {
        pos[i * 3 + 1] =
          Math.sin((xi + count) * 0.3) * 50 +
          Math.sin((yi + count) * 0.5) * 50;
        i++;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    /* Camera zoom on scroll trigger */
    if (zooming) {
      var t = Math.min((Date.now() - zoomStartTime) / ZOOM_DURATION, 1);
      /* Ease-in cubic — accelerates into the dots */
      var e = t * t * t;
      camera.position.z = CAM_START_Z + (CAM_END_Z - CAM_START_Z) * e;
      camera.position.y = CAM_START_Y + (CAM_END_Y - CAM_START_Y) * e;
    }

    renderer.render(scene, camera);
    count += 0.028; /* slow roll */
  }

  function onResizeDots() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResizeDots);

  /* ── Scroll-to-enter ─────────────────────────────────────── */
  var triggered = false;

  function triggerZoom() {
    if (triggered) return;
    triggered = true;

    /* Detach all input listeners */
    window.removeEventListener('wheel',      onWheel,      false);
    window.removeEventListener('touchstart', onTouchStart, false);
    window.removeEventListener('touchmove',  onTouchMove,  false);

    /* Fade out scroll hint */
    var hint = document.getElementById('entry-scroll-hint');
    if (hint) hint.style.opacity = '0';

    /* Kick off Three.js zoom */
    zooming       = true;
    zoomStartTime = Date.now();

    /* Entry screen sweep starts 320ms in — dots are already rushing forward */
    setTimeout(function () {
      if (window._vvDismissEntry) window._vvDismissEntry();
    }, 320);

    /* Three.js teardown after sweep fully off-screen */
    setTimeout(function () {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResizeDots);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    }, 1700);
  }

  /* Desktop — wheel down only; block page scroll while entry is open */
  function onWheel(e) {
    e.preventDefault();
    if (e.deltaY > 0) triggerZoom();
  }

  /* Mobile — swipe up (finger moves upward = scroll down) */
  var touchStartY = 0;
  function onTouchStart(e) { touchStartY = e.touches[0].clientY; }
  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches[0].clientY < touchStartY - 20) triggerZoom();
  }

  window.addEventListener('wheel',      onWheel,      { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true  });
  window.addEventListener('touchmove',  onTouchMove,  { passive: false });

  animateDots();
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
