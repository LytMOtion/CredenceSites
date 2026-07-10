/* CANYON HOUSE — Course System 03 (The Desert) shared behavior.
   Progressive enhancement: all content works without JS. */
(function(){
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- image fallback: missing final JPG -> local placeholder SVG (no layout shift) --- */
  document.querySelectorAll('img[data-ph]').forEach(function(img){
    var swap=function(){ if(img.dataset.phDone) return; img.dataset.phDone='1'; img.src=img.dataset.ph; };
    img.addEventListener('error', swap);
    if(img.complete && img.naturalWidth===0) swap();
  });

  /* --- cinematic hero video: autoplay muted inline, hold final frame (no loop);
         static poster for reduced-motion. --- */
  document.querySelectorAll('video[data-hero]').forEach(function(v){
    if(reduce){ v.removeAttribute('autoplay'); try{v.pause();}catch(e){} return; }
    var play=function(){ var p=v.play&&v.play(); if(p&&p.catch) p.catch(function(){}); };
    if(v.readyState>=2) play(); else v.addEventListener('loadeddata', play, {once:true});
    v.addEventListener('ended', function(){ v.pause(); }); /* hold final frame */
  });

  /* --- sticky header state --- */
  var mast=document.querySelector('.masthead');
  if(mast){
    var onScroll=function(){ mast.classList.toggle('is-stuck', scrollY>8); };
    addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }

  /* --- mobile nav --- */
  var toggle=document.querySelector('.nav-toggle'), nav=document.getElementById('nav');
  if(toggle&&nav){
    var setNav=function(o){ nav.setAttribute('data-open', String(o)); toggle.setAttribute('aria-expanded', String(o));
      var l=toggle.querySelector('[data-label]'); if(l) l.textContent=o?'Close':'Menu';
      document.body.style.overflow = o&&innerWidth<=1040 ? 'hidden' : ''; };
    toggle.addEventListener('click', function(){ setNav(nav.getAttribute('data-open')!=='true'); });
    nav.addEventListener('click', function(e){ if(e.target.closest('a')&&innerWidth<=1040) setNav(false); });
    addEventListener('keydown', function(e){ if(e.key==='Escape'&&nav.getAttribute('data-open')==='true'){ setNav(false); toggle.focus(); } });
  }

  /* --- Experience dropdown (hover/click, keyboard) --- */
  document.querySelectorAll('.navdd').forEach(function(dd){
    var btn=dd.querySelector('.navdd__btn');
    if(!btn) return;
    var set=function(o){ dd.setAttribute('data-open', String(o)); btn.setAttribute('aria-expanded', String(o)); };
    btn.addEventListener('click', function(e){ e.stopPropagation(); set(dd.getAttribute('data-open')!=='true'); });
    dd.addEventListener('mouseenter', function(){ if(innerWidth>1040) set(true); });
    dd.addEventListener('mouseleave', function(){ if(innerWidth>1040) set(false); });
    document.addEventListener('click', function(e){ if(!dd.contains(e.target)) set(false); });
    addEventListener('keydown', function(e){ if(e.key==='Escape'){ set(false); } });
  });

  /* --- Book menu --- */
  var bookWrap=document.querySelector('.nav__book');
  if(bookWrap){
    var bBtn=bookWrap.querySelector('.nav__book-btn'), bMenu=bookWrap.querySelector('.book-menu');
    if(bBtn&&bMenu){
      var setBook=function(o){ bMenu.setAttribute('data-open', String(o)); bBtn.setAttribute('aria-expanded', String(o)); };
      bBtn.addEventListener('click', function(e){ e.stopPropagation(); setBook(bMenu.getAttribute('data-open')!=='true'); });
      document.addEventListener('click', function(e){ if(!bookWrap.contains(e.target)) setBook(false); });
      addEventListener('keydown', function(e){ if(e.key==='Escape'){ setBook(false); } });
    }
  }

  /* --- reveal --- */
  var revs=document.querySelectorAll('.reveal, .imgscale');
  if(reduce||!('IntersectionObserver' in window)){ revs.forEach(function(el){el.classList.add('in');}); }
  else{
    var io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} }); },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    revs.forEach(function(el){ io.observe(el); });
  }

  /* --- Reusable demo modal (native <dialog>) --- */
  document.querySelectorAll('[data-modal]').forEach(function(btn){
    var dlg=document.getElementById(btn.getAttribute('data-modal'));
    if(!dlg) return;
    btn.addEventListener('click', function(e){ e.preventDefault();
      document.querySelectorAll('.book-menu,.navdd').forEach(function(m){ m.setAttribute('data-open','false'); });
      if(dlg.showModal){ dlg.showModal(); } else { dlg.setAttribute('open',''); } });
  });
  document.querySelectorAll('[data-modal-close]').forEach(function(b){
    b.addEventListener('click', function(){ var d=b.closest('dialog'); if(!d) return; if(d.close) d.close(); else d.removeAttribute('open'); });
  });

  /* --- Course tour engine + interactive routing map --- */
  var holeBtns=document.querySelectorAll('.hbtn[data-hole]');
  var panels=document.querySelectorAll('[data-hole-panel]');
  if(holeBtns.length){
    var holesEl=document.querySelector('.holes');
    var live=document.getElementById('hole-live');
    var routemap=document.querySelector('.routemap');
    var mapMarkers=document.querySelectorAll('.rm-marker[data-hole]');
    var mapHoles=document.querySelectorAll('.rm-hole[data-hole]');
    function panelOf(n){ return document.querySelector('[data-hole-panel="'+n+'"]'); }
    function setNine(nine){ if(holesEl) holesEl.setAttribute('data-nine', nine);
      if(routemap) routemap.setAttribute('data-nine', nine);
      document.querySelectorAll('.tour__nine').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-nine')===nine)); }); }
    function paintMap(n){
      mapMarkers.forEach(function(m){ var on=m.getAttribute('data-hole')===String(n); m.classList.toggle('is-active',on); m.setAttribute('aria-current', on?'true':'false'); });
      mapHoles.forEach(function(h){ var on=h.getAttribute('data-hole')===String(n); h.classList.toggle('is-active',on); h.classList.toggle('is-dim',!on); });
    }
    function show(n, push, announce){
      var panel=panelOf(n); if(!panel) return;
      panels.forEach(function(p){ p.hidden=(p!==panel); });
      holeBtns.forEach(function(b){ var on=b.getAttribute('data-hole')===String(n); b.classList.toggle('is-active',on); b.setAttribute('aria-current', on?'true':'false'); });
      panel.querySelectorAll('.reveal,.imgscale').forEach(function(el){ el.classList.add('in'); });
      setNine(+n<=9?'front':'back');
      paintMap(n);
      if(push){ if(location.hash!=='#hole-'+n) history.pushState(null,'','#hole-'+n); }
      if(announce!==false && live) live.textContent='Showing hole '+n;
      if(!reduce){ var im=panel.querySelector('.holepanel .fig img'); if(im){ im.style.transition='none'; im.style.opacity='.35'; requestAnimationFrame(function(){ im.style.transition='opacity .45s ease'; im.style.opacity='1'; }); } }
    }
    holeBtns.forEach(function(b){ b.addEventListener('click', function(){ show(b.getAttribute('data-hole'), true); }); });
    document.querySelectorAll('[data-goto]').forEach(function(b){ b.addEventListener('click', function(){ show(b.getAttribute('data-goto'), true); var v=document.querySelector('.tour__view'); if(v&&innerWidth<=940){ v.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); } }); });
    document.querySelectorAll('.tour__nine').forEach(function(b){ b.addEventListener('click', function(){ setNine(b.getAttribute('data-nine')); }); });
    document.querySelectorAll('[data-allholes]').forEach(function(b){ b.addEventListener('click', function(){ if(holesEl){ holesEl.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); var a=holesEl.querySelector('.hbtn.is-active')||holesEl.querySelector('.hbtn:not([hidden])'); if(a) a.focus(); } }); });
    /* map markers: click + keyboard */
    mapMarkers.forEach(function(m){
      m.setAttribute('tabindex','0'); m.setAttribute('role','button');
      var n=m.getAttribute('data-hole');
      m.setAttribute('aria-label','Hole '+n);
      m.addEventListener('click', function(){ show(n, true); });
      m.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); show(n, true); var v=document.querySelector('.tour__view'); if(v&&innerWidth<=940) v.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); } });
    });
    function fromHash(){ var m=(location.hash.match(/hole-(\d+)/)||[])[1]; if(m&&panelOf(m)){ show(m,false,false); } }
    var m0=(location.hash.match(/hole-(\d+)/)||[])[1];
    var initial=(m0&&panelOf(m0))?m0:'1';
    show(initial,false,false);
    addEventListener('hashchange', fromHash);
    addEventListener('popstate', fromHash);
  }
})();
