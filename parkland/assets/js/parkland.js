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

  /* ---- Course Tour hole selector ---- */
  var tour = document.getElementById('tour');
  if(tour && window.PARKLAND_HOLES){
    var holes = window.PARKLAND_HOLES;
    var current = 7; // feature Hole 7 — The Dell
    var fig = tour.querySelector('[data-hole-fig]');
    var img = fig ? fig.querySelector('img') : null;
    var numEl = tour.querySelector('[data-hole-num]');
    var titleEl2 = tour.querySelector('[data-hole-title]');
    var parEl = tour.querySelector('[data-hole-par]');
    var champEl = tour.querySelector('[data-hole-champ]');
    var memEl = tour.querySelector('[data-hole-member]');
    var fwdEl = tour.querySelector('[data-hole-forward]');
    var hcpEl = tour.querySelector('[data-hole-hcp]');
    var stratEl = tour.querySelector('[data-hole-strat]');
    var navWrap = tour.querySelector('.holenav');
    var switches = tour.querySelectorAll('.nineswitch button');
    var prevBtn = tour.querySelector('[data-hole-prev]');
    var nextBtn = tour.querySelector('[data-hole-next]');
    var mapSvg = tour.querySelector('.tour__map svg');

    function holeByNum(n){ for(var i=0;i<holes.length;i++){ if(holes[i].num===n) return holes[i]; } return holes[0]; }

    function render(n){
      current = n;
      var h = holeByNum(n);
      if(numEl) numEl.textContent = 'Hole ' + h.num;
      if(titleEl2) titleEl2.textContent = h.title;
      if(parEl) parEl.textContent = 'Par ' + h.par;
      if(champEl) champEl.textContent = h.champ;
      if(memEl) memEl.textContent = h.member;
      if(fwdEl) fwdEl.textContent = h.forward;
      if(hcpEl) hcpEl.textContent = h.hcp;
      if(stratEl) stratEl.textContent = h.strategy;
      if(img){ img.src = 'assets/images/' + h.image; img.alt = 'Hole ' + h.num + ' — ' + h.title + '. Demonstration image of a fictional course.'; }
      // active hole button
      if(navWrap){ navWrap.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-current', (+b.dataset.hole===n)?'true':'false'); }); }
      // active nine switch
      var nine = h.nine;
      switches.forEach(function(s){ s.setAttribute('aria-selected', (s.dataset.nine===nine)?'true':'false'); });
      buildNav(nine);
      // map marker
      if(mapSvg){ mapSvg.querySelectorAll('[data-map-hole]').forEach(function(m){ m.classList.toggle('is-active', +m.getAttribute('data-map-hole')===n); }); }
    }
    function buildNav(nine){
      if(!navWrap) return;
      navWrap.innerHTML='';
      holes.filter(function(h){return h.nine===nine;}).forEach(function(h){
        var b=document.createElement('button');
        b.type='button'; b.textContent=h.num; b.dataset.hole=h.num;
        b.setAttribute('aria-label','Hole '+h.num);
        b.setAttribute('aria-current', h.num===current?'true':'false');
        b.addEventListener('click', function(){ render(h.num); });
        navWrap.appendChild(b);
      });
    }
    switches.forEach(function(s){
      s.addEventListener('click', function(){
        var nine=s.dataset.nine;
        var first = holes.filter(function(h){return h.nine===nine;})[0];
        render(first.num);
      });
    });
    if(prevBtn) prevBtn.addEventListener('click', function(){ render(current>1?current-1:18); });
    if(nextBtn) nextBtn.addEventListener('click', function(){ render(current<18?current+1:1); });
    if(mapSvg){ mapSvg.querySelectorAll('[data-map-hole]').forEach(function(m){ m.addEventListener('click', function(){ render(+m.getAttribute('data-map-hole')); }); }); }

    render(current);
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
})();
