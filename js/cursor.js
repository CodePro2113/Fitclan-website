/* ============================================
   FITCLAN — SHARED CURSOR (no GSAP required)
   Loaded by all pages that include cursor divs
============================================ */
(function () {
  var cursor   = document.getElementById('cursor');
  var follower = document.getElementById('cursor-follower');
  if (!cursor || !follower) return;

  var mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  /* Smooth follower via rAF */
  (function loop() {
    fx += (mx - fx) * 0.12;
    fy += (my - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(loop);
  })();

  /* Hover colour change on interactive elements */
  function bindHover(root) {
    root.querySelectorAll('a, button, [data-magnetic]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('hover');
        follower.classList.add('hover');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('hover');
        follower.classList.remove('hover');
      });
    });
  }
  bindHover(document);
})();
