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

/* ── B. Three.js Shader (Entry Screen) ─────────────────────── */
(function initShader() {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  script.onload = function () {
    const container = document.getElementById('shader-bg');
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;
    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lw = 0.002;
        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i = 0; i < 5; i++){
            color[j] += lw * float(i*i) / abs(
              fract(t - 0.01*float(j) + float(i)*0.01)*5.0
              - length(uv)
              + mod(uv.x+uv.y, 0.2)
            );
          }
        }
        color = vec3(color.r * 2.0 + color.g * 0.35, color.g * 0.3, color.b * 0.06);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        resolution: { value: new THREE.Vector2(container.offsetWidth, container.offsetHeight) },
        time:       { value: 0.0 }
      },
      vertexShader, fragmentShader
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let animId;
    const startTime = performance.now();
    function animate() {
      animId = requestAnimationFrame(animate);
      material.uniforms.time.value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
    }
    animate();

    window._stopShader = function () { cancelAnimationFrame(animId); };

    window.addEventListener('resize', function () {
      const w = container.offsetWidth, h = container.offsetHeight;
      renderer.setSize(w, h);
      material.uniforms.resolution.value.set(w, h);
    });
  };
  document.head.appendChild(script);
})();

/* ── C. Entry Screen ─────────────────────────────────────────── */
(function initEntry() {
  const entry    = document.getElementById('entry-screen');
  const enterBtn = document.getElementById('enter-btn');
  if (!entry || !enterBtn) return;

  document.body.classList.add('entry-open');

  function dismiss() {
    entry.classList.add('hidden');
    document.body.classList.remove('entry-open');
    setTimeout(function () {
      if (typeof window._stopShader === 'function') window._stopShader();
    }, 1000);
  }

  enterBtn.addEventListener('click', dismiss);
  document.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !entry.classList.contains('hidden')) {
      e.preventDefault();
      dismiss();
    }
  });
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
  }, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });

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
