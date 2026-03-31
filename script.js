/* ============================================================
   VELVET VIBRANCE — script.js
   "Blood runs velvet gold"
   ============================================================ */

/* ── A. Shader Animation (Three.js) ────────────────────────── */
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

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.002;
        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i = 0; i < 5; i++){
            color[j] += lineWidth * float(i*i) / abs(
              fract(t - 0.01*float(j) + float(i)*0.01)*5.0
              - length(uv)
              + mod(uv.x+uv.y, 0.2)
            );
          }
        }
        // Tint toward velvet red/gold — boost red channel, reduce blue
        color = vec3(color.r * 1.8 + color.g * 0.3, color.g * 0.4, color.b * 0.1);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        resolution: { value: new THREE.Vector2(container.offsetWidth, container.offsetHeight) },
        time:       { value: 0.0 }
      },
      vertexShader,
      fragmentShader
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh     = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animId;
    const startTime = performance.now();

    function animate() {
      animId = requestAnimationFrame(animate);
      material.uniforms.time.value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
    }

    animate();

    // Pause shader when entry screen is hidden (performance)
    window._stopShader = function () {
      cancelAnimationFrame(animId);
    };

    // Resize
    window.addEventListener('resize', function () {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      renderer.setSize(w, h);
      material.uniforms.resolution.value.set(w, h);
    });
  };

  document.head.appendChild(script);
})();

/* ── B. Entry Screen ─────────────────────────────────────────── */
(function initEntry() {
  const entry = document.getElementById('entry-screen');
  const enterBtn = document.getElementById('enter-btn');

  if (!entry || !enterBtn) return;

  // Lock scroll while entry is showing
  document.body.classList.add('entry-open');

  function dismiss() {
    entry.classList.add('hidden');
    document.body.classList.remove('entry-open');
    // Stop the shader after fade to save GPU
    setTimeout(function () {
      if (typeof window._stopShader === 'function') window._stopShader();
    }, 900);
  }

  enterBtn.addEventListener('click', dismiss);

  // Also allow pressing Space or Enter
  document.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !entry.classList.contains('hidden')) {
      dismiss();
    }
  });
})();

/* ── C. Smooth Scroll ────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      // Close mobile nav if open
      const mobileNav = document.querySelector('.mobile-nav');
      if (mobileNav) mobileNav.classList.remove('open');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ── D. Nav Scroll Effect ───────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  function onScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Hamburger menu
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }
})();

/* ── E. Scroll Reveal ────────────────────────────────────────── */
(function initReveal() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  if (!revealEls.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(function (el) { observer.observe(el); });
})();

/* ── F. Gallery Lightbox ─────────────────────────────────────── */
(function initLightbox() {
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  if (!lightbox || !lightboxImg) return;

  document.querySelectorAll('.gallery-item').forEach(function (item) {
    item.addEventListener('click', function () {
      const src = this.querySelector('img').src;
      lightboxImg.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();

/* ── G. Join Form ────────────────────────────────────────────── */
(function initJoinForm() {
  const form = document.getElementById('join-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = form.querySelector('.join-input');
    const btn   = form.querySelector('.join-btn');
    if (!input || !input.value.trim()) return;

    btn.textContent = 'JOINED';
    btn.style.background = '#2a7a2a';
    btn.style.borderColor = '#2a7a2a';
    btn.style.color = '#fff';
    input.value = '';
    input.placeholder = 'YOU\'RE IN THE FREQUENCY';

    setTimeout(function () {
      btn.textContent = 'JOIN';
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      input.placeholder = 'YOUR EMAIL ADDRESS';
    }, 4000);
  });
})();

/* collective-card stagger removed — collective is now a photo gallery */
