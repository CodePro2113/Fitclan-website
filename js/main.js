/* ============================================
   FITFAM — FLASHY PREMIUM INTERACTIONS v2
   App-matched: teal / coral / gold palette
   ============================================ */

(function () {
  'use strict';

  /* ============================================
     SMOOTH SCROLL — LENIS
  ============================================ */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  let lenis = null;
  try {
    lenis = new Lenis({ lerp: 0.062, smoothWheel: true });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);
  } catch(e) {
    lenis = { on: () => {}, scrollTo: t => t?.scrollIntoView({ behavior: 'smooth' }), raf: () => {} };
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80, duration: 1.4 }); }
    });
  });

  /* ============================================
     SCROLL PROGRESS BAR
  ============================================ */
  const progressBar = document.createElement('div');
  Object.assign(progressBar.style, {
    position: 'fixed', top: '0', left: '0', height: '2px', width: '0%',
    background: 'linear-gradient(90deg, hsl(159,93%,50%), hsl(170,90%,55%), hsl(159,93%,50%))',
    backgroundSize: '200% 100%',
    zIndex: '2000', pointerEvents: 'none',
    boxShadow: '0 0 10px hsl(159,93%,50%), 0 0 20px hsl(159,93%,50%,0.5)',
    animation: 'progressShimmer 2s linear infinite',
  });
  const styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes progressShimmer { 0%{background-position:0% 0} 100%{background-position:200% 0} }';
  document.head.appendChild(styleEl);
  document.body.appendChild(progressBar);
  if (lenis?.on) {
    lenis.on('scroll', ({ progress }) => { progressBar.style.width = (progress * 100) + '%'; });
  } else {
    window.addEventListener('scroll', () => {
      progressBar.style.width = ((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100) + '%';
    });
  }

  /* ============================================
     CUSTOM CURSOR
  ============================================ */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  let mx = 0, my = 0, fx = 0, fy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; gsap.set(cursor, { x: mx, y: my }); });
  gsap.ticker.add(() => { fx += (mx - fx) * 0.12; fy += (my - fy) * 0.12; gsap.set(follower, { x: fx, y: fy }); });
  document.querySelectorAll('a, button, [data-card], [data-magnetic]').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor?.classList.add('hover'); follower?.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { cursor?.classList.remove('hover'); follower?.classList.remove('hover'); });
  });

  /* ============================================
     THREE.JS PARTICLE FIELD — teal/coral/gold
  ============================================ */
  (function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    camera.position.z = 80;

    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    // App palette particles
    const palette = [
      new THREE.Color().setHSL(159/360, 0.93, 0.50), // teal
      new THREE.Color().setHSL(159/360, 0.93, 0.65), // teal light
      new THREE.Color().setHSL(170/360, 0.90, 0.45), // teal dark
      new THREE.Color().setHSL(0/360,   1.00, 0.71), // coral
      new THREE.Color().setHSL(45/360,  1.00, 0.60), // gold
      new THREE.Color().setHSL(217/360, 0.91, 0.60), // blue
    ];
    for (let i = 0; i < count; i++) {
      const r = 55 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = (Math.random() - .5) * 90;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
      sizes[i] = Math.random() * 2.8 + 0.3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({ size: 1.4, vertexColors: true, transparent: true, opacity: .7, sizeAttenuation: true, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let mouseX = 0, mouseY = 0, scrollY = 0;
    document.addEventListener('mousemove', e => { mouseX = (e.clientX / window.innerWidth - .5) * 2; mouseY = (e.clientY / window.innerHeight - .5) * 2; });
    if (lenis?.on) lenis.on('scroll', ({ scroll }) => { scrollY = scroll; });
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    (function animate(t) {
      requestAnimationFrame(animate);
      const time = t * .001;
      points.rotation.y = time * .035 + mouseX * .07;
      points.rotation.x = time * .018 - mouseY * .04;
      points.position.y = -scrollY * .025;
      mat.opacity = Math.max(0, .7 - scrollY * .0008);
      renderer.render(scene, camera);
    })(0);

    window.addEventListener('resize', () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    });
  })();

  /* ============================================
     MAGNETIC BUTTONS
  ============================================ */
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width  / 2) * 0.38;
      const dy = (e.clientY - rect.top  - rect.height / 2) * 0.38;
      gsap.to(el, { x: dx, y: dy, duration: .4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, 0.4)' }));
  });

  /* BTN glow follow */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });

  /* ============================================
     CARD 3D TILT + ELECTRIC BORDER
  ============================================ */
  document.querySelectorAll('.feature-card, .testi-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      card.style.setProperty('--mx', (x*100)+'%');
      card.style.setProperty('--my', (y*100)+'%');
      gsap.to(card, { rotationX: (y-.5)*-14, rotationY: (x-.5)*14, transformPerspective: 900, duration: .35, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => gsap.to(card, { rotationX: 0, rotationY: 0, duration: .7, ease: 'elastic.out(1,0.4)' }));
  });

  /* ============================================
     CLICK SHOCKWAVE
  ============================================ */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', e => {
      const wave = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      Object.assign(wave.style, {
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: size+'px', height: size+'px',
        left: (e.clientX - rect.left - size/2) + 'px',
        top:  (e.clientY - rect.top  - size/2) + 'px',
        background: 'rgba(255,255,255,0.35)',
        transform: 'scale(0)', zIndex: '10',
      });
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(wave);
      gsap.to(wave, { scale: 1, opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => wave.remove() });
    });
  });

  /* ============================================
     NAV
  ============================================ */
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -80',
    onEnter:     () => nav.classList.add('scrolled'),
    onLeaveBack: () => nav.classList.remove('scrolled'),
  });

  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  let menuOpen = false;
  burger?.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('open', menuOpen);
    const spans = burger.querySelectorAll('span');
    if (menuOpen) {
      gsap.to(spans[0], { rotate: 45, y: 7, duration: .3 });
      gsap.to(spans[1], { opacity: 0, duration: .3 });
      gsap.to(spans[2], { rotate: -45, y: -7, duration: .3 });
    } else {
      gsap.to(spans, { rotate: 0, y: 0, opacity: 1, duration: .3 });
    }
  });
  document.querySelectorAll('.mobile-link').forEach(l => {
    l.addEventListener('click', () => {
      menuOpen = false;
      mobileMenu.classList.remove('open');
      if (burger) gsap.to(burger.querySelectorAll('span'), { rotate: 0, y: 0, opacity: 1, duration: .3 });
    });
  });

  /* ============================================
     HERO ENTRANCE — GLITCH + WARP
  ============================================ */
  function initHeroAnim() {
    const tl = gsap.timeline({ delay: .15 });

    // Page-load warp flash
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position: 'fixed', inset: '0', zIndex: '9997', pointerEvents: 'none',
      background: 'linear-gradient(135deg, hsl(159,93%,50%,0.15), transparent)',
    });
    document.body.appendChild(flash);
    gsap.to(flash, { opacity: 0, duration: .5, onComplete: () => flash.remove() });

    // Badge pop
    tl.fromTo('.hero-badge',
      { opacity: 0, scale: .7, y: -10 },
      { opacity: 1, scale: 1, y: 0, duration: .6, ease: 'back.out(2)' });

    // Title — letter-by-letter with glitch burst on each line
    document.querySelectorAll('.hero-title .line').forEach((line, lineIdx) => {
      const isGradient = line.classList.contains('gradient-text');
      const text = line.textContent.trim();
      line.innerHTML = '';
      const wrapper = document.createElement('span');
      wrapper.style.cssText = 'display:block';

      text.split('').forEach((char, j) => {
        const span = document.createElement('span');
        span.style.cssText = 'display:inline-block; opacity:0; transform:translateY(50px) rotate(8deg) scale(0.7)';
        if (isGradient) span.style.cssText += '; background:inherit; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;';
        span.textContent = char === ' ' ? ' ' : char;
        wrapper.appendChild(span);

        tl.to(span,
          { opacity: 1, y: 0, rotate: 0, scale: 1, duration: .35, ease: 'back.out(2)' },
          0.25 + lineIdx * 0.18 + j * 0.022);

        // Random glitch flash on some chars
        if (Math.random() > .7) {
          tl.to(span,
            { color: 'hsl(159,93%,50%)', duration: .08, yoyo: true, repeat: 1, ease: 'none' },
            0.25 + lineIdx * 0.18 + j * 0.022 + .35);
        }
      });
      line.appendChild(wrapper);

      // Teal sweep line after each word
      const sweep = document.createElement('div');
      Object.assign(sweep.style, {
        position: 'absolute', top: '0', left: '-10%', width: '30%', height: '100%',
        background: 'linear-gradient(90deg, transparent, hsl(159,93%,50%,0.15), transparent)',
        pointerEvents: 'none', zIndex: '5',
      });
      line.style.position = 'relative';
      line.appendChild(sweep);
      tl.fromTo(sweep, { x: '-30%' }, { x: '140%', duration: .5, ease: 'power2.inOut' }, 0.25 + lineIdx * 0.18 + text.length * 0.022);
    });

    // Sub + actions + stats
    tl.fromTo('.hero-sub',    { opacity: 0, y: 30, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .8, ease: 'power3.out' }, .95)
      .fromTo('.hero-actions',{ opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, 1.15)
      .fromTo('.hero-stats',  { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, 1.35);

    // Phone slide in with bounce
    tl.fromTo('.hero-phone-wrap',
      { opacity: 0, x: 80, rotationY: -25 },
      { opacity: 1, x: 0, rotationY: 0, duration: 1.1, ease: 'power3.out' }, .55);

    // Hero stat counters
    tl.add(() => {
      document.querySelectorAll('.hero-stats .stat-num[data-count]').forEach(el => {
        animateCount(el, 0, parseInt(el.dataset.count), 2000, true);
      });
    }, 1.4);
  }
  window.addEventListener('load', initHeroAnim);

  /* ============================================
     TYPEWRITER SUBTITLE (fires after hero anim)
  ============================================ */
  // Subtitle gets blurred-in by GSAP above, then optional typewriter on section sub-titles
  function typewriter(el, delay = 0) {
    if (!el) return;
    const text = el.textContent;
    el.textContent = '';
    el.style.opacity = '1';
    let i = 0;
    setTimeout(() => {
      const t = setInterval(() => {
        el.textContent += text[i++];
        if (i >= text.length) clearInterval(t);
      }, 22);
    }, delay);
  }

  /* ============================================
     INTERSECTION OBSERVER REVEALS
  ============================================ */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      setTimeout(() => el.classList.add('visible'), parseFloat(el.dataset.delay || 0));
      revealObs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('[data-reveal],[data-reveal-right]').forEach(el => revealObs.observe(el));

  // Cards with stagger
  const cardObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = entry.target.parentElement.querySelectorAll('[data-card]');
      siblings.forEach((card, i) => { setTimeout(() => card.classList.add('visible'), i * 90); cardObs.unobserve(card); });
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-card]').forEach(el => cardObs.observe(el));

  // Timeline steps
  const stepObs = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); stepObs.unobserve(entry.target); } });
  }, { threshold: 0.18 });
  document.querySelectorAll('[data-step]').forEach((el, i) => { el.style.transitionDelay = (i*.14)+'s'; stepObs.observe(el); });

  // Notification cards stagger
  const notifObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('[data-notif]').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 200);
      });
      notifObs.disconnect();
    });
  }, { threshold: 0.25 });
  const notifPhone = document.querySelector('.notif-phone');
  if (notifPhone) notifObs.observe(notifPhone);

  /* ============================================
     ANIMATED COUNTERS — with flash effect
  ============================================ */
  function animateCount(el, from, to, duration, flash = false) {
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
      if (p < 1) { requestAnimationFrame(step); }
      else {
        el.textContent = to.toLocaleString();
        if (flash) {
          el.style.transition = 'color .15s, text-shadow .15s';
          el.style.color = 'hsl(159,93%,50%)';
          el.style.textShadow = '0 0 20px hsl(159,93%,50%)';
          setTimeout(() => { el.style.color = ''; el.style.textShadow = ''; }, 300);
        }
      }
    }
    requestAnimationFrame(step);
  }

  // Stats section counters
  const statsObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('[data-count]').forEach(el => animateCount(el, 0, parseInt(el.dataset.count), 2200, true));
      statsObs.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) statsObs.observe(statsSection);

  /* ============================================
     GSAP SCROLL ANIMATIONS
  ============================================ */

  // Section headers — warp-in (title handled by word-split observer)
  gsap.utils.toArray('.section-header').forEach(header => {
    const tag = header.querySelector('.section-tag');
    const sub = header.querySelector('.section-sub');
    if (tag) gsap.fromTo(tag, { opacity:0, scale:.7 }, { opacity:1, scale:1, duration:.6, ease:'back.out(2)', scrollTrigger:{ trigger:header, start:'top 80%', toggleActions:'play none none none' } });
    if (sub) gsap.fromTo(sub, { opacity:0, y:20, filter:'blur(4px)' }, { opacity:1, y:0, filter:'blur(0px)', duration:.8, delay:.35, ease:'power3.out', scrollTrigger:{ trigger:header, start:'top 80%', toggleActions:'play none none none' } });
  });

  // Features hero parallax
  gsap.to('.features .section-header', {
    scrollTrigger: { trigger: '.features', start: 'top bottom', end: 'center center', scrub: 1 },
    y: -40,
  });

  // Stats scale pop
  ScrollTrigger.create({
    trigger: '.stats-section', start: 'top 75%',
    onEnter: () => {
      gsap.utils.toArray('.stat-block').forEach((b, i) => {
        gsap.fromTo(b,
          { scale: .7, opacity: 0, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: .7, delay: i * .1, ease: 'back.out(1.8)' });
      });
    },
  });

  // Timeline line draw
  gsap.fromTo('.timeline-line',
    { scaleY: 0, transformOrigin: 'top' },
    { scaleY: 1, duration: 2, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.timeline', start: 'top 70%', toggleActions: 'play none none none' } });

  // CTA title explosive entrance
  ScrollTrigger.create({
    trigger: '.download-cta', start: 'top 70%',
    onEnter: () => {
      const t = document.querySelector('.cta-title');
      if (!t || t.dataset.done) return;
      t.dataset.done = '1';
      gsap.fromTo(t,
        { opacity: 0, scale: .7, filter: 'blur(20px)' },
        { opacity: 1, scale: 1,  filter: 'blur(0px)', duration: 1, ease: 'power4.out' });
      gsap.fromTo('.cta-badge',  { opacity:0, y:-20 }, { opacity:1, y:0, duration:.6, delay:.2, ease:'back.out(2)' });
      gsap.fromTo('.cta-sub',    { opacity:0, y:20  }, { opacity:1, y:0, duration:.7, delay:.4, ease:'power3.out' });
      gsap.fromTo('.cta-actions',{ opacity:0, scale:.8 }, { opacity:1, scale:1, duration:.7, delay:.6, ease:'back.out(1.5)' });
      gsap.fromTo('.cta-note',   { opacity:0 }, { opacity:1, duration:.5, delay:.8 });
    },
  });

  // Floating badges parallax
  gsap.utils.toArray('.float-badge').forEach((b, i) => {
    gsap.to(b, { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }, y: -50 - i * 25 });
  });

  // Phone tilt on mouse
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - .5) * 12;
    const y = (e.clientY / window.innerHeight - .5) * -9;
    gsap.to('.phone-frame', { rotationY: x, rotationX: y, transformPerspective: 1000, duration: .9, ease: 'power2.out' });
  });

  // Ambient orbs mouse parallax
  document.addEventListener('mousemove', e => {
    const x = e.clientX / window.innerWidth  - .5;
    const y = e.clientY / window.innerHeight - .5;
    gsap.to('.orb-1', { x: x*50,  y: y*35,  duration:2.5, ease:'power1.out' });
    gsap.to('.orb-2', { x: -x*35, y: -y*25, duration:3,   ease:'power1.out' });
    gsap.to('.orb-3', { x: x*25,  y: y*50,  duration:3.5, ease:'power1.out' });
  });

  // Section tag neon pulse
  document.querySelectorAll('.section-tag').forEach(tag => {
    gsap.to(tag, { boxShadow: '0 0 20px hsl(159,93%,50%,0.3)', repeat: -1, yoyo: true, duration: 2, ease: 'sine.inOut' });
  });

  // Hero stat counter teal glow ring on scroll
  ScrollTrigger.create({
    trigger: '.hero-stats', start: 'top 80%',
    onEnter: () => {
      document.querySelectorAll('.hero-stat-divider').forEach(d => {
        gsap.fromTo(d,
          { scaleY: 0, background: 'var(--teal)' },
          { scaleY: 1, duration: .5, ease: 'power2.out', background: 'var(--border)' });
      });
    },
  });

  // Streak dots fire in sequence
  ScrollTrigger.create({
    trigger: '.streak-visual', start: 'top 80%',
    onEnter: () => document.querySelectorAll('.streak-dot').forEach((d, i) =>
      setTimeout(() => gsap.from(d, { scale: 0, duration: .4, ease: 'back.out(2.5)' }), i * 70)),
  });

  // Territory hexagons pop in
  ScrollTrigger.create({
    trigger: '.conquest-visual', start: 'top 80%',
    onEnter: () => document.querySelectorAll('.territory').forEach((t, i) =>
      gsap.from(t, { scale: 0, opacity: 0, duration: .6, delay: i * .1, ease: 'back.out(2)' })),
  });

  // Testimonial featured card electric border
  const featured = document.querySelector('.testi-featured');
  if (featured) {
    gsap.to(featured, {
      scrollTrigger: { trigger: featured, start: 'top 75%', toggleActions: 'play none none none' },
      animation: 'electricBorder 3s linear infinite',
      onStart: () => { featured.style.animation = 'electricBorder 3s linear infinite'; },
    });
  }

  // Notif section text typewriter
  ScrollTrigger.create({
    trigger: '.notif-text', start: 'top 70%', once: true,
    onEnter: () => {
      const sub = document.querySelector('.notif-text p');
      if (sub) typewriter(sub, 300);
    },
  });

  /* ============================================
     CTA PARTICLE CANVAS — teal/coral
  ============================================ */
  (function () {
    const container = document.getElementById('ctaParticles');
    if (!container) return;
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { position:'absolute', inset:'0', width:'100%', height:'100%', pointerEvents:'none' });
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    function resize() { W = canvas.width = container.offsetWidth; H = canvas.height = container.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      'hsl(159,93%,50%)', 'hsl(170,90%,55%)', 'hsl(159,93%,70%)',
      'hsl(0,100%,71%)', 'hsl(45,100%,60%)', 'hsl(217,91%,60%)',
    ];
    for (let i = 0; i < 80; i++) {
      particles.push({ x: Math.random()*2000, y: Math.random()*600, vx:(Math.random()-.5)*.5, vy:-Math.random()*.7-.3, r:Math.random()*2.5+.5, color:colors[Math.floor(Math.random()*colors.length)], alpha:Math.random()*.6+.15, life:Math.random() });
    }
    (function draw() {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life += .003;
        if (p.y < -10 || p.life > 1) { p.x = Math.random()*W; p.y = H+10; p.life = 0; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha * Math.sin(p.life * Math.PI); ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    })();
  })();

  /* ============================================
     APP SHOWCASE — PHONE REVEALS + TILT + RINGS
  ============================================ */

  // Reveal phones on scroll
  const scPhoneObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('sc-visible');
      scPhoneObs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.sc-phone-item').forEach(el => scPhoneObs.observe(el));

  // 3D tilt on showcase device hover
  document.querySelectorAll('.sc-device').forEach(device => {
    device.style.transformStyle = 'preserve-3d';
    device.addEventListener('mousemove', e => {
      const rect = device.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      gsap.to(device, { rotationX: y * -12, rotationY: x * 12, transformPerspective: 900, duration: .35, ease: 'power2.out' });
    });
    device.addEventListener('mouseleave', () => {
      gsap.to(device, { rotationX: 0, rotationY: 0, duration: .8, ease: 'elastic.out(1,0.4)' });
    });
  });

  // Animate concentric rings when showcase enters viewport
  const ringObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.ms-ring-progress').forEach((circle, i) => {
        const targetOffset = parseFloat(circle.getAttribute('stroke-dashoffset'));
        const totalLength  = parseFloat(circle.getAttribute('stroke-dasharray'));
        circle.style.strokeDashoffset = totalLength;
        setTimeout(() => {
          circle.style.transition = `stroke-dashoffset ${1.2 + i * 0.18}s cubic-bezier(.34,1.2,.64,1)`;
          circle.style.strokeDashoffset = targetOffset;
        }, 250 + i * 130);
      });
      ringObs.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.ms-rings-svg').forEach(svg => ringObs.observe(svg));

  // Animate progress bars inside screens on entry
  const scBarObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.ms-mission-bar, .ms-rank-bar, .ms-stat-bar, .ms-goal-bar, .ms-missions-prog').forEach((bar, i) => {
        const tw = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
          bar.style.transition = `width ${0.75 + i * 0.04}s cubic-bezier(.34,1,.64,1)`;
          bar.style.width = tw;
        }, 400 + i * 60);
      });
      scBarObs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.sc-screen').forEach(screen => scBarObs.observe(screen));

  // Subtle parallax depth on the 3 phones while scrolling
  gsap.to('.sc-phone-center .sc-device', {
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
    y: -28,
  });
  gsap.to('.sc-phone-item:first-child', {
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: 22,
  });
  gsap.to('.sc-phone-item:last-child', {
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: 22,
  });

  /* ============================================
     FOOTER LOGO GLITCH
  ============================================ */
  const footerLogoText = document.querySelector('.footer-logo .logo-text');
  if (footerLogoText) {
    footerLogoText.addEventListener('mouseenter', () => {
      const orig = footerLogoText.textContent;
      const chars = 'FITFAM0123@#$%';
      let i = 0;
      const iv = setInterval(() => {
        footerLogoText.textContent = orig.split('').map((c, j) => j < i ? c : chars[Math.floor(Math.random()*chars.length)]).join('');
        i++;
        if (i > orig.length) { footerLogoText.textContent = orig; clearInterval(iv); }
      }, 35);
    });
  }

  /* ============================================
     ELECTRIC SPARK ON SECTION ENTRY
  ============================================ */
  function spawnSpark(x, y) {
    const spark = document.createElement('div');
    Object.assign(spark.style, {
      position: 'fixed', left: x+'px', top: y+'px', pointerEvents: 'none', zIndex: '9990',
      width: '4px', height: '4px', borderRadius: '50%',
      background: 'hsl(159,93%,50%)', boxShadow: '0 0 8px hsl(159,93%,50%)',
    });
    document.body.appendChild(spark);
    const angle = Math.random() * Math.PI * 2;
    const dist  = 30 + Math.random() * 50;
    gsap.to(spark, {
      x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
      scale: 0, opacity: 0, duration: .5 + Math.random()*.3,
      ease: 'power2.out', onComplete: () => spark.remove(),
    });
  }

  // Spark burst when section tags come into view
  document.querySelectorAll('.section-tag').forEach(tag => {
    const tagObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const rect = e.target.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        for (let i = 0; i < 8; i++) setTimeout(() => spawnSpark(cx + (Math.random()-0.5)*rect.width, cy), i * 40);
        tagObs.unobserve(e.target);
      });
    }, { threshold: 1 });
    tagObs.observe(tag);
  });

  /* ============================================
     PAGE LOAD OVERLAY
  ============================================ */
  const overlay = document.createElement('div');
  Object.assign(overlay.style, { position:'fixed', inset:'0', background:' hsl(240,3%,7%)', zIndex:'9999', pointerEvents:'none' });
  document.body.appendChild(overlay);
  gsap.to(overlay, { opacity:0, duration:.7, delay:.1, ease:'power2.inOut', onComplete:()=>overlay.remove() });

  /* ============================================
     MARQUEE / INFINITE TICKER — trust bar
  ============================================ */
  (function setupMarquee() {
    document.querySelectorAll('.marquee-track, .ticker-track').forEach(track => {
      // Clone children to create seamless loop
      const items = Array.from(track.children);
      items.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    });
  })();

  /* ============================================
     WORD SPLIT REVEALS — section titles & hero
  ============================================ */
  function splitWords(selector, staggerDelay = 0.06) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.split) return; // already processed
      el.dataset.split = '1';
      // Walk child nodes; preserve <br> and element nodes (gradient-text spans etc.)
      const childNodes = Array.from(el.childNodes);
      el.innerHTML = '';
      let wordIndex = 0;

      childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Split plain text into words
          const parts = node.textContent.split(/(\s+)/);
          parts.forEach(part => {
            if (/^\s+$/.test(part)) {
              el.appendChild(document.createTextNode(part));
            } else if (part) {
              const wrap = document.createElement('span');
              wrap.className = 'split-word-wrap';
              wrap.style.cssText = 'overflow:hidden; display:inline-block; vertical-align:bottom;';
              const span = document.createElement('span');
              span.className = 'split-word';
              span.textContent = part;
              span.style.transitionDelay = (wordIndex++ * staggerDelay) + 's';
              wrap.appendChild(span);
              el.appendChild(wrap);
            }
          });
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
          el.appendChild(node.cloneNode());
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Wrap the whole element (e.g. gradient-text span) as one word unit
          const wrap = document.createElement('span');
          wrap.className = 'split-word-wrap';
          wrap.style.cssText = 'overflow:hidden; display:inline-block; vertical-align:bottom;';
          const span = document.createElement('span');
          span.className = 'split-word';
          span.style.transitionDelay = (wordIndex++ * staggerDelay) + 's';
          span.appendChild(node.cloneNode(true));
          wrap.appendChild(span);
          el.appendChild(wrap);
        }
      });
    });
  }

  // Apply to section titles (not hero — hero has its own char animation)
  splitWords('.section-title');

  // Trigger word splits via IntersectionObserver
  const wordObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.split-word').forEach(w => w.classList.add('in'));
      wordObs.unobserve(entry.target);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.section-title').forEach(el => wordObs.observe(el));

  /* ============================================
     SECTION DIVIDERS — glow line reveal
  ============================================ */
  const dividerObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      dividerObs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.section-divider').forEach(el => dividerObs.observe(el));

  /* ============================================
     TESTIMONIAL CARDS — alternate directions
  ============================================ */
  (function setupTestiCards() {
    const cards = document.querySelectorAll('.testi-card');
    const dirs = ['data-testi-left', 'data-testi-up', 'data-testi-right', 'data-testi-up', 'data-testi-left', 'data-testi-right'];
    cards.forEach((card, i) => {
      card.setAttribute(dirs[i % dirs.length], '');
    });

    const testiObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const siblings = entry.target.closest('.testi-grid')?.querySelectorAll('.testi-card') ?? [entry.target];
        siblings.forEach((card, i) => {
          setTimeout(() => card.classList.add('visible'), i * 120);
          testiObs.unobserve(card);
        });
      });
    }, { threshold: 0.1 });
    cards.forEach(c => testiObs.observe(c));
  })();

  /* ============================================
     FEATURE CARDS — skew-in stagger
  ============================================ */
  (function setupFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, i) => {
      if (i % 3 === 0) card.setAttribute('data-card-left', '');
      else if (i % 3 === 1) card.setAttribute('data-card-up', '');
      else card.setAttribute('data-card-right', '');
    });

    const fObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const grid = entry.target.closest('.features-grid');
        if (!grid) return;
        const allCards = grid.querySelectorAll('.feature-card');
        allCards.forEach((c, i) => {
          setTimeout(() => c.classList.add('visible'), i * 110);
          fObs.unobserve(c);
        });
      });
    }, { threshold: 0.08 });
    cards.forEach(c => fObs.observe(c));
  })();

  /* ============================================
     SKEW-CARD VARIANTS — observer
  ============================================ */
  const skewObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      skewObs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-card-left],[data-card-right],[data-card-up]').forEach(el => skewObs.observe(el));

  /* ============================================
     GSAP PREMIUM SCROLL ANIMATIONS
  ============================================ */

  // Stats section — fly in from four corners
  ScrollTrigger.create({
    trigger: '.stats-section', start: 'top 70%', once: true,
    onEnter: () => {
      const blocks = gsap.utils.toArray('.stat-block');
      const origins = [[-80,-30],[80,-30],[-80,30],[80,30]];
      blocks.forEach((b, i) => {
        const [ox, oy] = origins[i % origins.length];
        gsap.fromTo(b,
          { x: ox, y: oy, opacity: 0, scale: .6, rotation: i%2===0 ? -8 : 8 },
          { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0, duration: .9, delay: i * .1, ease: 'back.out(1.6)' });
      });
    },
  });

  // Features section — whole section parallax shift
  gsap.to('.features-grid', {
    scrollTrigger: { trigger: '.features', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
    y: -60,
  });

  // How it works section — steps fly in with spring bounce
  ScrollTrigger.create({
    trigger: '.how', start: 'top 70%', once: true,
    onEnter: () => {
      gsap.utils.toArray('.timeline-step').forEach((step, i) => {
        gsap.fromTo(step,
          { x: -60, opacity: 0, scale: .92 },
          { x: 0, opacity: 1, scale: 1, duration: .85, delay: .15 + i * .18, ease: 'back.out(1.4)' });
      });
    },
  });

  // Testimonials section — featured card spotlight enter
  ScrollTrigger.create({
    trigger: '.testimonials', start: 'top 65%', once: true,
    onEnter: () => {
      const featured = document.querySelector('.testi-featured');
      if (featured) {
        gsap.fromTo(featured,
          { scale: .88, opacity: 0, filter: 'blur(12px)' },
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power4.out' });
      }
    },
  });

  // Notification section — staggered list items
  gsap.utils.toArray('.notif-list li').forEach((li, i) => {
    gsap.fromTo(li,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: .6, delay: i * .1, ease: 'power3.out',
        scrollTrigger: { trigger: li, start: 'top 85%', toggleActions: 'play none none none' } });
  });

  // Download CTA — background glow expand
  ScrollTrigger.create({
    trigger: '.download-cta', start: 'top 80%', once: true,
    onEnter: () => {
      const bg = document.querySelector('.cta-bg');
      if (bg) gsap.fromTo(bg, { scale: .3, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: 'power4.out' });
    },
  });

  // Section tags — pop in with bounce
  gsap.utils.toArray('.section-tag').forEach(tag => {
    gsap.fromTo(tag,
      { scale: 0, opacity: 0, rotation: -10 },
      { scale: 1, opacity: 1, rotation: 0, duration: .7, ease: 'back.out(2.5)',
        scrollTrigger: { trigger: tag, start: 'top 85%', toggleActions: 'play none none none' } });
  });

  // Timeline — connector line draw with color shift
  gsap.fromTo('.timeline-line',
    { scaleY: 0, opacity: 0 },
    { scaleY: 1, opacity: 1, duration: 2.5, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.timeline', start: 'top 65%', toggleActions: 'play none none none' } });

  // Stats section background glow pulse on entry
  ScrollTrigger.create({
    trigger: '.stats-section', start: 'top 60%', once: true,
    onEnter: () => {
      const bg = document.querySelector('.stats-bg');
      if (bg) gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });
    },
  });

  // Horizontal parallax on section sub text
  gsap.utils.toArray('.section-sub').forEach(sub => {
    gsap.fromTo(sub,
      { opacity: 0, y: 25, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: sub, start: 'top 85%', toggleActions: 'play none none none' } });
  });

  // Feature card icon bounce on section enter
  ScrollTrigger.create({
    trigger: '.features-grid', start: 'top 70%', once: true,
    onEnter: () => {
      gsap.utils.toArray('.card-icon').forEach((icon, i) => {
        gsap.fromTo(icon,
          { scale: 0, rotation: -20 },
          { scale: 1, rotation: 0, duration: .6, delay: .3 + i * .12, ease: 'back.out(2.5)' });
      });
    },
  });

  // Ambient orbs — deeper parallax layers with depth
  gsap.to('.orb-1', {
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2 },
    y: 200, x: 80, scale: 1.3,
  });
  gsap.to('.orb-2', {
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2.5 },
    y: -150, x: -60, scale: 0.8,
  });

  // Showcase section — depth parallax on individual phones
  gsap.to('.sc-phone-item:nth-child(1) .sc-device', {
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: 50, rotationZ: -2,
  });
  gsap.to('.sc-phone-item:nth-child(3) .sc-device', {
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1 },
    y: 50, rotationZ: 2,
  });

  // Section entry teal sweep flash
  (function sectionSweeps() {
    const sections = document.querySelectorAll('.features, .stats-section, .how, .testimonials, .notif-section, .download-cta');
    sections.forEach(section => {
      section.style.position = 'relative';
      section.style.overflow = 'hidden';
      const sweep = document.createElement('div');
      sweep.className = 'section-sweep';
      section.appendChild(sweep);

      ScrollTrigger.create({
        trigger: section, start: 'top 70%', once: true,
        onEnter: () => {
          setTimeout(() => sweep.classList.add('fire'), 50);
          setTimeout(() => sweep.classList.remove('fire'), 900);
        },
      });
    });
  })();

  /* ============================================
     SPOTLIGHT PARALLAX on mouse
  ============================================ */
  (function spotlightSetup() {
    const spotSections = document.querySelectorAll('.features, .testimonials');
    spotSections.forEach(section => {
      if (window.matchMedia('(hover: none)').matches) return;
      const spot = document.createElement('div');
      spot.className = 'spotlight';
      Object.assign(spot.style, { position: 'absolute', pointerEvents: 'none', opacity: '0', transition: 'opacity .5s', zIndex: '0' });
      section.style.position = 'relative';
      section.appendChild(spot);

      section.addEventListener('mousemove', e => {
        const rect = section.getBoundingClientRect();
        spot.style.opacity = '1';
        spot.style.left = (e.clientX - rect.left - 300) + 'px';
        spot.style.top  = (e.clientY - rect.top  - 300) + 'px';
      });
      section.addEventListener('mouseleave', () => { spot.style.opacity = '0'; });
    });
  })();

  /* ============================================
     NAV LINKS — stagger reveal on load
  ============================================ */
  gsap.fromTo('.nav-link',
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, stagger: .07, duration: .5, ease: 'power3.out', delay: .3 });
  gsap.fromTo('.nav-cta',
    { opacity: 0, scale: .85 },
    { opacity: 1, scale: 1, duration: .6, ease: 'back.out(2)', delay: .55 });

  /* ============================================
     FOOTER — reveal rows
  ============================================ */
  ScrollTrigger.create({
    trigger: '.footer', start: 'top 85%', once: true,
    onEnter: () => {
      gsap.fromTo('.footer-top > *',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: .12, duration: .7, ease: 'power3.out' });
      gsap.fromTo('.social-btn',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: .07, duration: .5, delay: .3, ease: 'back.out(2)' });
    },
  });

})();
