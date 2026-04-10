/* ============================================================
   VELVET VIBRANCE — script.js  v2
   "Blood runs velvet gold"
   ============================================================ */

/* ── A. Lenis Smooth Scroll ─────────────────────────────────── */
(function initLenis() {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
  script.onload = function () {
    const lenis = new Lenis({
      duration: 1.3,
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

    // Hook anchor links
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
      #define TWO_PI 6.2831853072
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
        color = vec3(color.r * 1.9 + color.g * 0.3, color.g * 0.35, color.b * 0.08);
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

  // Scroll effect
  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Hamburger toggle
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

    // Close on Escape
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
    const pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
})();

/* ── F. Scroll Reveals ───────────────────────────────────────── */
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

/* ── G. Hero Parallax ────────────────────────────────────────── */
(function initHeroParallax() {
  const heroBg = document.getElementById('hero-bg');
  if (!heroBg) return;

  window.addEventListener('scroll', function () {
    const y = window.scrollY;
    heroBg.style.transform = 'scale(1.05) translateY(' + (y * 0.25) + 'px)';
  }, { passive: true });
})();

/* ── H. Gallery Lightbox (Image + Video) ────────────────────── */
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

/* ── I. 3D Card Hover ────────────────────────────────────────── */
window.initCard3D = function () {
  const grid = document.getElementById('events-grid');
  if (!grid) return;

  grid.addEventListener('mousemove', function (e) {
    const card = e.target.closest('.event-card');
    if (!card) return;
    const rect  = card.getBoundingClientRect();
    const x     = (e.clientX - rect.left) / rect.width;
    const y     = (e.clientY - rect.top)  / rect.height;
    const rotX  = (y - 0.5) * -10;
    const rotY  = (x - 0.5) *  10;
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
  });

  grid.addEventListener('mouseleave', function () {
    grid.querySelectorAll('.event-card').forEach(function (card) {
      card.style.transform = '';
    });
  });

  grid.addEventListener('mouseout', function (e) {
    const card = e.target.closest('.event-card');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.transform = '';
    }
  });
};

/* ── J. Video Gallery Hover Autoplay ────────────────────────── */
(function initVideoHover() {
  document.querySelectorAll('.rg-item.rg-video video').forEach(function (video) {
    const item = video.closest('.rg-item');
    item.addEventListener('mouseenter', function () { video.play(); });
    item.addEventListener('mouseleave', function () { video.pause(); video.currentTime = 0; });
  });
})();

/* ── K. Join Form ────────────────────────────────────────────── */
(function initJoinForm() {
  const form = document.getElementById('join-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = form.querySelector('.join-input');
    const btn   = form.querySelector('.join-btn');
    if (!input || !input.value.trim()) return;

    const topSpan = btn.querySelector('.btn-text-top');
    const botSpan = btn.querySelector('.btn-text-bot');
    if (topSpan) topSpan.textContent = "YOU'RE IN";
    if (botSpan) botSpan.textContent = "YOU'RE IN";
    input.value = '';
    input.placeholder = "YOU'RE IN THE FREQUENCY";

    setTimeout(function () {
      if (topSpan) topSpan.textContent = 'JOIN';
      if (botSpan) botSpan.textContent = 'JOIN';
      input.placeholder = 'Your email address';
    }, 4000);
  });
})();
