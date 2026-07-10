/* OCEAN BLUFF NATIONAL — shared behavior (progressive enhancement).
   All content is present in HTML without JS; JS only enhances. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Mobile nav toggle (accessible) --- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.querySelector('[data-label]').textContent = open ? 'Menu' : 'Close';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 860) {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('[data-label]').textContent = 'Menu';
      }
    });
  }

  /* --- "More" nav disclosure (desktop dropdown; mobile shows inline via CSS) --- */
  var more = document.querySelector('.nav__more');
  if (more) {
    var moreBtn = more.querySelector('.nav__more-btn');
    var moreMenu = more.querySelector('.nav__more-menu');
    var isDesktop = function () { return window.matchMedia('(min-width:861px)').matches; };
    var setMore = function (open) {
      more.setAttribute('data-open', String(open));
      moreBtn.setAttribute('aria-expanded', String(open));
      if (open) { moreMenu.removeAttribute('hidden'); }
      else { moreMenu.setAttribute('hidden', ''); }
    };
    moreBtn.addEventListener('click', function (e) {
      if (!isDesktop()) return;                 // mobile: menu is always visible (CSS)
      e.stopPropagation();
      setMore(more.getAttribute('data-open') !== 'true');
    });
    document.addEventListener('click', function (e) {
      if (isDesktop() && more.getAttribute('data-open') === 'true' && !more.contains(e.target)) setMore(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && more.getAttribute('data-open') === 'true') { setMore(false); moreBtn.focus(); }
    });
    moreMenu.addEventListener('click', function (e) {
      if (e.target.closest('a') && isDesktop()) setMore(false);
    });
  }

  /* --- Swell reveal (and the climax arrival-settle) --- */
  var reveals = document.querySelectorAll('.reveal, .swell');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* --- Course-tour: hole jump with decode-gated swap (no white flash),
     neighbour + idle preloading, and a race guard so only the newest tap wins. --- */
  var holeButtons = document.querySelectorAll('[data-hole]');
  var holePanels = document.querySelectorAll('[data-hole-panel]');
  var seq = 0;                                  // request token
  function panelOf(n) { return document.querySelector('[data-hole-panel="' + n + '"]'); }
  function imgOf(panel) { return panel ? panel.querySelector('img') : null; }

  // Resolve only when the image is actually ready to paint (fetch + decode).
  // Forces a hidden/lazy image to load; a safety timeout guarantees we never hang.
  function ready(img) {
    return new Promise(function (res) {
      if (!img) return res();
      var finish = function () { if (img.decode) { img.decode().then(res, res); } else { res(); } };
      // Already-loaded image: resolve immediately. Do NOT call decode() here — decode()
      // never settles for a complete image inside a hidden (display:none) panel, which
      // would stall the hole swap (deep-links / taps to preloaded holes). No flash risk.
      if (img.complete && img.naturalWidth > 0) return res();
      var safety = setTimeout(res, 2500);
      var done = function () {
        clearTimeout(safety);
        img.removeEventListener('load', done); img.removeEventListener('error', done);
        finish();
      };
      img.addEventListener('load', done); img.addEventListener('error', done);
      img.loading = 'eager';                    // kick a lazy/hidden image into loading
      if (img.decode) img.decode().then(function () { clearTimeout(safety); done(); }, function () {});
    });
  }
  function setActive(n) {                        // sole visual driver + a11y
    holeButtons.forEach(function (b) {
      var on = b.getAttribute('data-hole') === String(n);
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }
  function preload(n) { var p = panelOf(n); if (p) ready(imgOf(p)); }

  function showHole(n, push, announce) {
    var panel = panelOf(n); if (!panel) return;
    var my = ++seq;
    // instant feedback: the tapped control looks active immediately (visual only)
    holeButtons.forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-hole') === String(n)); });
    ready(imgOf(panel)).then(function () {
      if (my !== seq) return;                    // superseded by a newer tap — abort
      holePanels.forEach(function (p) { p.hidden = (p !== panel); });
      setActive(n);                              // aria-current now matches DISPLAYED hole
      panel.querySelectorAll('.reveal,.swell').forEach(function (el) { el.classList.add('in'); }); // ensure shown panel is visible
      if (push) history.replaceState(null, '', '#hole-' + n);
      if (announce !== false) { var live = document.getElementById('hole-live'); if (live) live.textContent = 'Showing hole ' + n; }
      if (!reduce) {                             // subtle fade of the already-decoded image (never white)
        var im = imgOf(panel);
        if (im) { im.style.transition = 'none'; im.style.opacity = '.55';
          requestAnimationFrame(function () { im.style.transition = 'opacity 220ms ease'; im.style.opacity = '1'; }); }
      }
      preload(+n + 1); preload(+n - 1);          // warm neighbours for the next tap
    });
  }

  if (holeButtons.length) {
    holeButtons.forEach(function (b) {
      b.addEventListener('click', function () { showHole(b.getAttribute('data-hole'), true); });
    });
    var m = (location.hash.match(/hole-(\d+)/) || [])[1];
    var visible = document.querySelector('[data-hole-panel]:not([hidden])');
    var visN = visible ? visible.getAttribute('data-hole-panel') : '13';
    var initial = (m && panelOf(m)) ? m : visN;
    setActive(initial);
    // ensure the initially-visible hole panel is shown even if it loads below the reveal trigger
    var ip0 = panelOf(initial);
    if (ip0) ip0.querySelectorAll('.reveal,.swell').forEach(function (el) { el.classList.add('in'); });
    if (initial !== visN) { showHole(initial, false, false); }   // deep-link to a different hole
    else { preload(initial); preload(+initial + 1); preload(+initial - 1); }
    // progressively warm the rest of the 18 during idle time (no upfront bandwidth spike)
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 500); };
    idle(function () { for (var h = 1; h <= 18; h++) preload(h); });
  }

  /* --- Dependency-safe outbound links (booking paths, menu, scorecard) ---
     Each control carries data-dest="key"; its URL lives in OCEANBLUFF.destinations.
     Resolved -> becomes a real link. Unresolved (null) -> stays a focusable,
     announced control that does NOT navigate and NEVER jumps to top. No fake
     navigation, no fabricated URL; going live is a config edit only. */
  var DEST = (window.OCEANBLUFF && window.OCEANBLUFF.destinations) || {};
  document.querySelectorAll('[data-dest]').forEach(function (el) {
    var url = DEST[el.getAttribute('data-dest')];
    if (url) {
      el.setAttribute('href', url);
      el.removeAttribute('aria-disabled');
      el.removeAttribute('role');
      el.removeAttribute('tabindex');
      el.classList.remove('is-pending');
      el.removeAttribute('title');
      if (/^https?:/i.test(url)) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
    } else {
      el.classList.add('is-pending');
      el.setAttribute('aria-disabled', 'true');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'link');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.setAttribute('title', 'This destination is not available in the demonstration.');
      var stop = function (e) { e.preventDefault(); };
      el.addEventListener('click', stop);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); });
    }
  });

  /* --- Course tour: Previous / Next hole + "All holes" ---
     These reuse the same showHole engine (hash + deep-link stay intact). We use a
     separate [data-goto] attribute so these controls are NOT treated as hole
     selectors (no false aria-current/active state on Prev/Next). */
  if (holeButtons.length) {
    document.querySelectorAll('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { showHole(b.getAttribute('data-goto'), true); });
    });
    var holesNav = document.querySelector('.holes');
    document.querySelectorAll('[data-allholes]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!holesNav) return;
        holesNav.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        var cur = holesNav.querySelector('.hbtn.is-active') || holesNav.querySelector('.hbtn');
        if (cur) cur.focus();
      });
    });
  }

  /* --- Demonstration modals (event / tournament / lesson / shop inquiries) ---
     A control with [data-demo="modalId"] opens the matching <dialog>. The native
     dialog provides the focus trap, Escape-to-close, and focus return to the
     invoker. Nothing is submitted: no inquiry, appointment, order, or payment. */
  document.querySelectorAll('[data-demo]').forEach(function (btn) {
    var dlg = document.getElementById(btn.getAttribute('data-demo'));
    if (!dlg) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (dlg.showModal) { dlg.showModal(); }
      else { dlg.setAttribute('open', ''); }        // very old browsers: inline fallback
    });
  });
  document.querySelectorAll('[data-demo-close]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.closest('dialog'); if (!d) return;
      if (d.close) { d.close(); } else { d.removeAttribute('open'); }
    });
  });
})();
