/* ============================================================================
   FITCLAN — PREMIUM SCROLLYTELLING MODULE
   Scroll-linked storytelling built on GSAP ScrollTrigger.
   Loaded AFTER main.js (which boots Lenis + registers ScrollTrigger and wires
   lenis.on('scroll', ScrollTrigger.update)). This module only consumes the
   global gsap / ScrollTrigger — it never re-inits Lenis.

   Design goals:
     - Real scroll-linked motion (scrubbed timelines, pins, parallax, masks).
     - transform/opacity only — no layout-thrashing properties animated.
     - Full prefers-reduced-motion support (renders final state, no pins/scrub).
     - Reusable "hooks" (factory helpers) so each section reads declaratively.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqDesktop = window.matchMedia('(min-width: 880px)');
  // Heavy pinned/scrubbed sections render as readable static states under reduced
  // motion OR on small screens (pinning short mobile layouts is janky).
  const STATIC = REDUCE || !mqDesktop.matches;

  /* ==========================================================================
     REUSABLE ANIMATION HOOKS
     Small factory helpers. Each returns the created tween/timeline/trigger so
     callers can compose. All are no-ops (final-state setters) under REDUCE.
     ========================================================================== */

  /** Parallax: translateY an element across its trigger's scroll span. */
  function useParallax(el, opts = {}) {
    if (!el || REDUCE) return null;
    const { from = 0, to = -80, trigger = el, start = 'top bottom', end = 'bottom top', scrub = true } = opts;
    return gsap.fromTo(el, { yPercent: 0, y: from }, {
      y: to, ease: 'none',
      scrollTrigger: { trigger, start, end, scrub: scrub === true ? 1 : scrub },
    });
  }

  /** Scale-on-scroll with optional clip-path mask reveal. */
  function useScaleReveal(el, opts = {}) {
    if (!el) return null;
    const { fromScale = 0.82, toScale = 1, trigger = el, start = 'top 85%', end = 'top 35%' } = opts;
    if (REDUCE) { gsap.set(el, { scale: toScale, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }); return null; }
    return gsap.fromTo(el,
      { scale: fromScale, opacity: 0.4, clipPath: 'inset(8% 8% 8% 8% round 28px)' },
      { scale: toScale, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
        scrollTrigger: { trigger, start, end, scrub: 1 } });
  }

  /** Pin a section and drive a scrubbed timeline. Returns { tl, st }. */
  function usePinnedScrub(trigger, opts = {}) {
    const { endVh = 150, anticipatePin = 1 } = opts;
    const tl = gsap.timeline({
      scrollTrigger: REDUCE ? undefined : {
        trigger,
        start: 'top top',
        end: () => '+=' + window.innerHeight * (endVh / 100),
        pin: true,
        scrub: 1,
        anticipatePin,
        invalidateOnRefresh: true,
      },
    });
    return { tl, reduce: REDUCE };
  }

  /** One-shot entrance for a pinned section's copy. Fires as the section
   *  approaches (BEFORE the pin engages) so the headline is already visible the
   *  moment the pin starts — never animate pinned copy with a scrubbed from(). */
  function useCopyIntro(sel, opts = {}) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return;
    const { x = 0, y = 36, trigger = el.closest('.scrolly') || el } = opts;
    if (REDUCE) { gsap.set(el, { autoAlpha: 1, x: 0, y: 0 }); return; }
    gsap.fromTo(el, { autoAlpha: 0, x, y }, {
      autoAlpha: 1, x: 0, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger, start: 'top 72%', toggleActions: 'play none none none' },
    });
  }

  /** Staggered "rise + fade" entrance for a set of children (one-shot). */
  function useRiseIn(els, opts = {}) {
    const list = gsap.utils.toArray(els);
    if (!list.length) return;
    const { trigger = list[0], y = 40, stagger = 0.09, start = 'top 82%' } = opts;
    if (REDUCE) { gsap.set(list, { opacity: 1, y: 0 }); return; }
    gsap.fromTo(list, { opacity: 0, y }, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger,
      scrollTrigger: { trigger, start, toggleActions: 'play none none none' },
    });
  }

  /* ==========================================================================
     SECTION 2 — PINNED WORLD CONQUEST
     Tiles get "claimed" by three clans one-by-one as you scroll through the pin.
     A live counter tracks claimed territory. Headline layers parallax.
     ========================================================================== */
  function initWorldConquest() {
    const section = document.querySelector('[data-scrolly="conquest"]');
    if (!section) return;

    // Generate the tile grid (8 cols × 5 rows) if not already present.
    const grid = section.querySelector('.wc-grid');
    if (grid && !grid.children.length) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 40; i++) {
        const t = document.createElement('div');
        t.className = 'wc-tile';
        frag.appendChild(t);
      }
      grid.appendChild(frag);
    }

    const tiles = gsap.utils.toArray(section.querySelectorAll('.wc-tile'));
    const counter = section.querySelector('.wc-counter-num');
    const total = tiles.length;

    if (STATIC) {
      tiles.forEach((t, i) => t.classList.add('claimed', 'clan-' + ['a', 'b', 'c'][i % 3]));
      if (counter) counter.textContent = total;
      return;
    }

    // Copy enters before the pin engages (stays visible through the pin).
    useCopyIntro('.wc-copy', { y: 40 });

    const { tl } = usePinnedScrub(section, { endVh: 190 });

    // Claim tiles in a pseudo-random but deterministic order, three clans.
    const order = tiles
      .map((t, i) => ({ t, i, sort: ((i * 73 + 11) % total) }))
      .sort((a, b) => a.sort - b.sort);

    order.forEach((o, idx) => {
      const clan = ['a', 'b', 'c'][idx % 3];
      const at = 0.5 + (idx / total) * 4.5; // spread across the scrub timeline
      tl.to(o.t, {
        duration: 0.4,
        onStart: () => o.t.classList.add('claimed', 'clan-' + clan),
        onReverseComplete: () => o.t.classList.remove('claimed', 'clan-a', 'clan-b', 'clan-c'),
      }, at);
      tl.fromTo(o.t, { scale: 0.6 }, { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }, at);
      // Live counter
      tl.add(() => { if (counter) counter.textContent = Math.min(total, idx + 1); }, at);
    });

    // Foreground glow sweep as a closing beat
    tl.from('.wc-foreground-glow', { autoAlpha: 0, duration: 1 }, 3.5);
  }

  /* ==========================================================================
     SECTION 3 — FAMILY vs FAMILY (horizontal scroll)
     The matchup track translates horizontally while the section is pinned.
     ========================================================================== */
  function initFamilyBattles() {
    const section = document.querySelector('[data-scrolly="battles"]');
    if (!section) return;
    const track = section.querySelector('.fb-track');
    if (!track) return;
    const cards = gsap.utils.toArray(track.querySelectorAll('.fb-card'));

    if (STATIC) {
      track.style.flexWrap = 'wrap';
      track.style.justifyContent = 'center';
      return;
    }

    // Distance to travel = track overflow beyond viewport.
    const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);

    // Horizontal slide while pinned. Capture the tween so per-card triggers can
    // ride it via containerAnimation.
    const slide = gsap.to(track, {
      x: () => -getDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + getDistance(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Each card gently scales to full as it crosses the viewport center.
    cards.forEach((card) => {
      gsap.fromTo(card, { scale: 0.93, autoAlpha: 0.7 }, {
        scale: 1, autoAlpha: 1, ease: 'none',
        scrollTrigger: {
          trigger: card,
          containerAnimation: slide,
          // scrub:1 (buttery catch-up) instead of scrub:true (harsh 1:1) so the
          // per-card scale eases in smoothly as it crosses the viewport.
          start: 'left 80%', end: 'center 55%', scrub: 1,
        },
      });
    });
  }

  /* ==========================================================================
     SECTION 4 — BEAT YOUR PAST SELF (dual runners, different speeds)
     "Today you" (teal) outpaces the "shadow" (past you). Foreground track lines
     and background skyline move at different rates for depth.
     ========================================================================== */
  function initBeatPastSelf() {
    const section = document.querySelector('[data-scrolly="beatpast"]');
    if (!section) return;
    const now = section.querySelector('.bp-runner-now');
    const past = section.querySelector('.bp-runner-past');
    const trackLines = section.querySelector('.bp-track-lines');
    const skyline = section.querySelector('.bp-skyline');
    const gapLabel = section.querySelector('.bp-gap-num');

    if (STATIC) {
      gsap.set(now, { x: () => window.innerWidth * 0.5 });
      gsap.set(past, { x: () => window.innerWidth * 0.22 });
      if (gapLabel) gapLabel.textContent = '+1,840';
      return;
    }

    useCopyIntro('.bp-copy', { y: 36 });

    const { tl } = usePinnedScrub(section, { endVh: 170 });

    // Background skyline drifts slowest, track lines fastest (parallax depth).
    tl.fromTo(skyline, { xPercent: 0 }, { xPercent: -12, ease: 'none' }, 0);
    tl.fromTo(trackLines, { backgroundPositionX: '0px' }, { backgroundPositionX: '-1400px', ease: 'none' }, 0);

    // Runners traverse the viewport — "now" (teal) outpaces "past" (ghost), so a
    // real gap opens up. x is in px (function-based, recomputed on refresh) so
    // the travel scales with screen width instead of the tiny figure width.
    tl.fromTo(past, { x: 0 }, { x: () => window.innerWidth * 0.40, ease: 'none' }, 0);
    tl.fromTo(now, { x: 0 }, { x: () => window.innerWidth * 0.72, ease: 'none' }, 0);

    // Growing lead counter tracks the widening gap.
    const setGap = (p) => { if (gapLabel) gapLabel.textContent = '+' + Math.round(p * 1840).toLocaleString(); };
    tl.to({ p: 0 }, { p: 1, ease: 'none', onUpdate: function () { setGap(this.targets()[0].p); } }, 0);

    // Finish flag brightens as the runners close in.
    tl.fromTo('.bp-finish', { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.5 }, 0.7);
  }

  /* ==========================================================================
     SECTION 5 — MISSIONS (stacked cards reveal one-by-one)
     A deck of mission cards "deals" apart as you scroll through the pin.
     ========================================================================== */
  function initMissionsStack() {
    const section = document.querySelector('[data-scrolly="missions"]');
    if (!section) return;
    const cards = gsap.utils.toArray(section.querySelectorAll('.mr-card'));
    if (!cards.length) return;

    if (STATIC) {
      cards.forEach((c) => { c.style.position = 'relative'; gsap.set(c, { rotate: 0, x: 0, y: 0, opacity: 1, clearProps: 'zIndex' }); });
      section.querySelector('.mr-stack')?.classList.add('mr-stack-static');
      return;
    }

    useCopyIntro('.mr-copy', { x: -40, y: 0 });

    const n = cards.length;
    // Cards are 88px tall; SLOT 104 leaves a clean 16px gap between dealt cards
    // (zero clipping, meta line fully visible). 4 cards → 3*104 + 88 = 400px span,
    // centered inside the 420px .mr-stack box.
    const SLOT = 104; // px between dealt-card centers in the final fanned stack
    const finalY = (i) => (i - (n - 1) / 2) * SLOT; // centered vertical stack

    // Stack order: first card on top of the pile, so deal from the back forward.
    // z-index so a freshly dealt card sits above the ones still in the pile.
    cards.forEach((card, i) => gsap.set(card, { zIndex: i }));

    const { tl } = usePinnedScrub(section, { endVh: 60 + n * 50 });

    // Each card lifts from the centered pile into its own slot and stays there,
    // so the full stack is visible by the end (cards reveal one-by-one).
    cards.forEach((card, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const at = 0.4 + i * 0.9;
      tl.fromTo(card,
        { y: 0, scale: 0.9 - i * 0.015, rotate: dir * 3, autoAlpha: i === 0 ? 1 : 0 },
        { y: finalY(i), scale: 1, rotate: 0, autoAlpha: 1, duration: 0.85, ease: 'power3.out' },
        at);
      if (card.classList.contains('mr-card-done')) {
        tl.fromTo(card.querySelector('.mr-check'), { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, at + 0.5);
      }
    });
  }

  /* ==========================================================================
     SECTION 6 — FINAL CTA app mockup zoom / reveal
     The phone scales up + un-masks as the CTA enters; glow blooms behind it.
     ========================================================================== */
  function initCtaReveal() {
    const phone = document.querySelector('.cr-phone');
    if (!phone) return;
    useScaleReveal(phone, { fromScale: 0.7, trigger: '.cr-stage', start: 'top 90%', end: 'top 30%' });

    const glow = document.querySelector('.cr-bloom');
    if (glow && !REDUCE) {
      gsap.fromTo(glow, { autoAlpha: 0, scale: 0.6 }, {
        autoAlpha: 1, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.cr-stage', start: 'top 90%', end: 'top 40%', scrub: 1 },
      });
    }
    // Floating proof chips rise in around the phone.
    useRiseIn('.cr-chip', { trigger: '.cr-stage', start: 'top 70%', y: 30, stagger: 0.12 });
  }

  /* ==========================================================================
     SECTION 1 — HERO moving background map (parallax depth)
     A faint dot-map drifts up slower than the hero content (depth), plus a slow
     ambient pan. Pings pulse over it. Layered behind existing hero content.
     ========================================================================== */
  function initHeroMap() {
    const map = document.querySelector('.hm-map');
    if (!map) return;
    useParallax(map, { from: 0, to: -120, trigger: '.hero', start: 'top top', end: 'bottom top' });
    // The ambient slow pan is pure CSS animation (hm-drift); pings are CSS too.
  }

  /* ==========================================================================
     SECTION REVEAL — generic rise-ins for the new sections' headers
     ========================================================================== */
  function initGenericReveals() {
    document.querySelectorAll('[data-rise]').forEach((group) => {
      useRiseIn(group.querySelectorAll('[data-rise-item]'), { trigger: group, y: 36, stagger: 0.1 });
    });
  }

  /* ==========================================================================
     GLOBAL CONTINUOUS PARALLAX
     The static sections (features, stats, showcase, timeline, testimonials…) used
     to fade in once and then sit dead-still while you scrolled past — which made
     the page feel "half alive" next to the pinned/scrubbed sections. This gives
     EVERY major block a gentle, continuous scroll-linked drift at varying depths.

     Safety: we parallax WRAPPER/CONTAINER elements only — never the same nodes
     that carry the existing [data-reveal]/[data-card] fade-ins. Parent drift and
     child reveal are different elements, so their transforms compose cleanly
     instead of fighting. Movement is small (depth via differing rates, not large
     travel) so nothing opens visible gaps.
     ========================================================================== */
  function initGlobalParallax() {
    if (REDUCE) return; // honour reduced motion — no continuous drift

    const drift = (el, dist, opts = {}) => {
      if (!el) return;
      const { start = 'top bottom', end = 'bottom top' } = opts;
      gsap.fromTo(el, { y: dist / 2 }, {
        y: -dist / 2, ease: 'none',
        scrollTrigger: { trigger: el, start, end, scrub: 1, invalidateOnRefresh: true },
      });
    };

    // [selector, travel px] — bigger travel = "closer" layer (faster drift).
    const layers = [
      ['.hero-content', 70],
      ['.ticker-strip', 30],
      ['.features-grid', 60],
      ['.stats-grid', 46],
      ['.showcase-phones-wrap', 70],
      ['.timeline', 56],
      ['.notif-layout', 48],
      ['.testi-grid', 60],
    ];
    layers.forEach(([sel, dist]) => drift(document.querySelector(sel), dist));

    // All section headers drift too — except the features header, which already
    // has a dedicated parallax in main.js (avoid double-animating the same node).
    gsap.utils.toArray('.section-header').forEach((h) => {
      if (h.closest('.features')) return;
      drift(h, 38);
    });

    // The big stat numbers float a touch more than their section for depth.
    gsap.utils.toArray('.stat-block .big-num, .stat-block .big-label').forEach((el, i) => {
      drift(el, 22 + (i % 2) * 14);
    });
  }

  /* ==========================================================================
     BOOT
     ========================================================================== */
  function boot() {
    initHeroMap();
    initWorldConquest();
    initFamilyBattles();
    initBeatPastSelf();
    initMissionsStack();
    initCtaReveal();
    initGenericReveals();
    initGlobalParallax();

    // Recalculate once everything (fonts/images) has settled.
    ScrollTrigger.refresh();
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  // Keep pins/scrubs correct across breakpoint + orientation changes.
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
})();
