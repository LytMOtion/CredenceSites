/* Course System 02 — The Parkland · shared interactions
   Restrained, accessible, progressive-enhancement. No external deps. */
(function(){
  'use strict';
  var rm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- Mobile menu ---- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if(burger && nav){
    function setOpen(open){
      nav.setAttribute('data-open', open ? 'true':'false');
      burger.setAttribute('aria-expanded', open ? 'true':'false');
      document.body.style.overflow = open ? 'hidden':'';
    }
    burger.addEventListener('click', function(){ setOpen(nav.getAttribute('data-open')!=='true'); });
    nav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setOpen(false); }); });
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && nav.getAttribute('data-open')==='true'){ setOpen(false); burger.focus(); }
    });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if(reveals.length){
    if('IntersectionObserver' in window && !rm){
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
      }, {threshold:0, rootMargin:'0px 0px -8% 0px'});
      reveals.forEach(function(e){ io.observe(e); });
    } else {
      reveals.forEach(function(e){ e.classList.add('in'); });
    }
  }

  /* ---- Demonstration modal system ----
     Any [data-demo] trigger opens the shared overlay with its title/body. */
  var overlay = document.getElementById('demoOverlay');
  if(overlay){
    var titleEl = overlay.querySelector('[data-dm-title]');
    var bodyEl = overlay.querySelector('[data-dm-body]');
    var closeBtn = overlay.querySelector('.dm-close');
    var lastFocus = null;

    function focusables(){
      return overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    }
    function openDemo(title, body){
      lastFocus = document.activeElement;
      titleEl.textContent = title || 'Demonstration';
      bodyEl.textContent = body || '';
      overlay.setAttribute('data-open','true');
      document.body.style.overflow='hidden';
      closeBtn.focus();
    }
    function closeDemo(){
      overlay.setAttribute('data-open','false');
      document.body.style.overflow='';
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeDemo(); });
    closeBtn.addEventListener('click', closeDemo);
    document.addEventListener('keydown', function(e){
      if(overlay.getAttribute('data-open')!=='true') return;
      if(e.key==='Escape'){ closeDemo(); }
      if(e.key==='Tab'){
        var f = focusables(); if(!f.length) return;
        var first=f[0], last=f[f.length-1];
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
      }
    });
    document.querySelectorAll('[data-demo]').forEach(function(t){
      t.addEventListener('click', function(e){
        e.preventDefault();
        openDemo(t.getAttribute('data-demo-title'), t.getAttribute('data-demo-body'));
      });
    });
  }

  /* ---- Course Tour: compact 1–18 selector + selected hole (hash-routed) ----
     Interaction modelled on the Coastal course tour: choose a number, the hole
     appears immediately, move with Previous / All Holes / Next. The routing map is a
     secondary, collapsed overview and is not required to select a hole. */
  var tour = document.getElementById('tour');
  if(tour && window.PARKLAND_HOLES){
    var holes = window.PARKLAND_HOLES;
    var byNum = {}; holes.forEach(function(h){ byNum[h.num] = h; });
    var IMG = 'assets/images/';
    var figWrap = tour.querySelector('[data-hole-fig]');
    var layers = figWrap ? figWrap.querySelectorAll('.holedetail__img') : [];
    var reqSeq = 0; // request token: only the latest hole selection is allowed to commit
    var numEl = tour.querySelector('[data-hole-num]'), nineEl = tour.querySelector('[data-hole-nine]'),
        titleEl = tour.querySelector('[data-hole-title]'), parEl = tour.querySelector('[data-hole-par]'),
        champEl = tour.querySelector('[data-hole-champ]'), memEl = tour.querySelector('[data-hole-member]'),
        fwdEl = tour.querySelector('[data-hole-forward]'), hcpEl = tour.querySelector('[data-hole-hcp]'),
        stratEl = tour.querySelector('[data-hole-strat]');
    var prevBtn = tour.querySelector('[data-hole-prev]'), nextBtn = tour.querySelector('[data-hole-next]'),
        prevLab = tour.querySelector('[data-prev-label]'), nextLab = tour.querySelector('[data-next-label]'),
        allBtn = tour.querySelector('[data-allholes]'),
        live = document.getElementById('hole-live'),
        selBtns = tour.querySelectorAll('.hbtn[data-hole]'),
        mapMks = tour.querySelectorAll('[data-map-hole]');
    var current = 0;
    function nineName(n){ return n === 'back' ? 'Back Nine' : 'Front Nine'; }
    function label(h){ return 'Hole ' + h.num + ' · ' + h.title; }

    /* Live height of the fixed interface above the tour content:
       Course System utility bar + Alderwick header ( + the sticky hole selector on mobile ).
       Measured from the rendered DOM, so it stays correct at every phone width. */
    function headerH(){
      var o = 0, el;
      el = document.querySelector('.demo-bar'); if(el) o += el.offsetHeight;
      el = document.querySelector('.mast');     if(el) o += el.offsetHeight;
      return o;
    }
    function stickyOffset(){
      var o = headerH();
      var sel = tour.querySelector('.holesel');
      if(sel && window.innerWidth <= 900) o += sel.offsetHeight; // selector is a sticky top bar on mobile
      return o + 8; // small breathing gap beneath the fixed interface
    }
    /* Bring the full hole photo into view beneath the fixed interface — but only when it
       isn't already reasonably visible (otherwise the content simply updates in place). */
    function revealFig(){
      if(!figWrap) return;
      var run = function(){
        var off = stickyOffset();
        var top = figWrap.getBoundingClientRect().top;
        if(top >= off - 2 && top <= window.innerHeight * 0.55) return; // already well placed
        var y = window.pageYOffset + top - off;
        if(y < 0) y = 0;
        window.scrollTo({ top: y, behavior: rm ? 'auto' : 'smooth' });
      };
      if(window.requestAnimationFrame) requestAnimationFrame(run); else run();
    }

    function applyText(h){
      if(numEl) numEl.textContent = 'Hole ' + h.num;
      if(nineEl) nineEl.textContent = nineName(h.nine);
      if(titleEl) titleEl.textContent = h.title;
      if(parEl) parEl.textContent = 'Par ' + h.par;
      if(champEl) champEl.textContent = h.champ;
      if(memEl) memEl.textContent = h.member;
      if(fwdEl) fwdEl.textContent = h.forward;
      if(hcpEl) hcpEl.textContent = h.hcp;
      if(stratEl) stratEl.textContent = h.strategy;
    }
    function frontLayer(){ for(var i=0;i<layers.length;i++){ if(layers[i].classList.contains('is-front')) return layers[i]; } return layers[0]; }
    function preloadNeighbours(n){ [n-1, n+1].forEach(function(k){ var hh = byNum[k]; if(hh){ var p = new Image(); p.src = IMG + hh.image; } }); }

    /* Crossfade to the new photo only after it has loaded + decoded, so the current image
       stays on screen the whole time — never a white/blank frame. Outdated loads (from a
       faster later tap) are dropped via the request token; the latest selection always wins. */
    function swapImage(h, seq){
      if(!layers || !layers.length){ applyText(h); return; }
      var url = IMG + h.image;
      var front = frontLayer();
      if((front.getAttribute('src') || '').indexOf(h.image) !== -1){ applyText(h); preloadNeighbours(h.num); return; } // same photo — sync text only
      var back = (layers[0] === front) ? layers[1] : layers[0];
      var alt = 'Hole ' + h.num + ', ' + h.title + '. Demonstration image of a fictional course.';
      var commit = function(){
        if(seq !== reqSeq) return;                       // a newer selection won — drop this result
        back.src = url;                                  // already loaded + decoded → paints with no flash
        back.alt = alt; back.removeAttribute('aria-hidden');
        front.alt = ''; front.setAttribute('aria-hidden', 'true');
        var flip = function(){ if(seq !== reqSeq) return; applyText(h); back.classList.add('is-front'); front.classList.remove('is-front'); };
        if(rm) flip(); else requestAnimationFrame(flip);  // text + photo change together
        preloadNeighbours(h.num);
      };
      var pre = new Image();
      pre.onload = function(){ if(pre.decode){ pre.decode().then(commit, commit); } else { commit(); } };
      pre.onerror = function(){ if(seq === reqSeq && window.console && console.warn){ console.warn('[course-tour] hole image failed to load: ' + url); } }; // keep the current photo + its text
      pre.src = url;
    }

    function render(n, push, scroll){
      n = +n; var h = byNum[n]; if(!h) return; current = n;
      var seq = ++reqSeq;
      // immediate feedback: active number, controls, hash, screen-reader announcement, scroll
      selBtns.forEach(function(b){ b.setAttribute('aria-current', (+b.getAttribute('data-hole') === n) ? 'true' : 'false'); });
      mapMks.forEach(function(m){ m.classList.toggle('is-active', +m.getAttribute('data-map-hole') === n); });
      var pv = byNum[n - 1], nx = byNum[n + 1];
      if(prevBtn){ prevBtn.setAttribute('aria-disabled', pv ? 'false' : 'true'); if(prevLab) prevLab.textContent = pv ? label(pv) : ''; }
      if(nextBtn){ nextBtn.setAttribute('aria-disabled', nx ? 'false' : 'true'); if(nextLab) nextLab.textContent = nx ? label(nx) : ''; }
      if(push){ var hash = '#hole-' + n; if(location.hash !== hash) history.pushState({hole:n}, '', hash); }
      if(live) live.textContent = 'Hole ' + h.num + ', ' + h.title + ', ' + nineName(h.nine) + ', par ' + h.par + '.';
      if(scroll) revealFig();
      // photo + hole content: load first, then crossfade and update the text together
      swapImage(h, seq);
    }

    selBtns.forEach(function(b){ b.addEventListener('click', function(){ render(b.getAttribute('data-hole'), true, innerWidth <= 900); }); });
    if(prevBtn) prevBtn.addEventListener('click', function(){ if(prevBtn.getAttribute('aria-disabled') === 'true') return; render(current - 1, true, innerWidth <= 900); });
    if(nextBtn) nextBtn.addEventListener('click', function(){ if(nextBtn.getAttribute('aria-disabled') === 'true') return; render(current + 1, true, innerWidth <= 900); });
    if(allBtn) allBtn.addEventListener('click', function(){
      var sel = tour.querySelector('.holesel');
      if(sel){
        if(window.innerWidth <= 900){
          // position the selector just below the utility bar + header (not behind them)
          var y = window.pageYOffset + sel.getBoundingClientRect().top - (headerH() + 8);
          if(y < 0) y = 0;
          window.scrollTo({ top: y, behavior: rm ? 'auto' : 'smooth' });
        } else {
          try{ sel.scrollIntoView({behavior: rm ? 'auto' : 'smooth', block:'start'}); }catch(e){ sel.scrollIntoView(); }
        }
      }
      var a = tour.querySelector('.hbtn[aria-current="true"]') || selBtns[0]; if(a) a.focus();
    });
    mapMks.forEach(function(m){
      var go = function(){ render(+m.getAttribute('data-map-hole'), true, true); };
      m.addEventListener('click', go);
      m.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    });

    function fromHash(){ var mm = (location.hash.match(/hole-(\d+)/) || [])[1]; if(mm && byNum[+mm]) render(+mm, false, window.innerWidth <= 900); }
    window.addEventListener('popstate', fromHash);
    window.addEventListener('hashchange', fromHash);
    var h0 = (location.hash.match(/hole-(\d+)/) || [])[1];
    render((h0 && byNum[+h0]) ? +h0 : 1, false, false);
  }

  /* ---- Scorecard toggle ---- */
  var scBtn = document.querySelector('[data-scorecard-toggle]');
  var scPanel = document.getElementById('scorecardPanel');
  if(scBtn && scPanel){
    scBtn.addEventListener('click', function(){
      var open = scPanel.hasAttribute('hidden');
      if(open){ scPanel.removeAttribute('hidden'); scBtn.setAttribute('aria-expanded','true'); scPanel.scrollIntoView({behavior: rm?'auto':'smooth', block:'start'}); }
      else { scPanel.setAttribute('hidden',''); scBtn.setAttribute('aria-expanded','false'); }
    });
  }

  /* ---- Optional Course Overview: Escape-to-close + focus return ---- */
  var overview = document.querySelector('details.overview');
  if(overview){
    overview.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overview.open){
        overview.open = false;
        var s = overview.querySelector('summary'); if(s) s.focus();
      }
    });
  }
})();
