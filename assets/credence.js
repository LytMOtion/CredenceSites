// Credence — shared UI behaviour ("The Routing")
(function(){
  var rm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  // Sticky header
  var h = document.querySelector('.head');
  if(h){ addEventListener('scroll', function(){ h.classList.toggle('s', scrollY>40); }, {passive:true}); }

  // Mobile nav
  var bg = document.querySelector('.burger'), nv = document.querySelector('.nav');
  if(bg && nv){
    bg.addEventListener('click', function(){
      var open = nv.classList.toggle('open');
      bg.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nv.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ nv.classList.remove('open'); bg.setAttribute('aria-expanded','false'); });
    });
  }

  // Reveals (fade + mask)
  var revealSel = '.reveal, .reveal-mask';
  if('IntersectionObserver' in window && !rm){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:.08, rootMargin:'0px 0px -50px 0px'});
    document.querySelectorAll(revealSel).forEach(function(e){ io.observe(e); });
  } else {
    document.querySelectorAll(revealSel).forEach(function(e){ e.classList.add('in'); });
  }

  // Routing rail — tee-to-green progress
  var rail = document.querySelector('.route');
  var fill = rail && rail.querySelector('.fill');
  var car  = rail && rail.querySelector('.car');
  var ticks = rail && rail.querySelector('.ticks');
  var top  = document.querySelector('.route-top');

  // place ticks at each section's scroll position (built once)
  function buildTicks(){
    if(!ticks) return;
    ticks.innerHTML='';
    var docH = document.documentElement.scrollHeight - innerHeight;
    if(docH<=0) return;
    document.querySelectorAll('section[id]').forEach(function(s){
      var p = Math.max(0, Math.min(1, s.offsetTop / docH));
      var i = document.createElement('i');
      i.style.top = (p*100)+'%';
      ticks.appendChild(i);
    });
  }
  buildTicks();
  addEventListener('resize', buildTicks, {passive:true});

  var ticking=false;
  function onScroll(){
    var docH = document.documentElement.scrollHeight - innerHeight;
    var p = docH>0 ? Math.max(0, Math.min(1, scrollY/docH)) : 0;
    if(fill) fill.style.transform = 'scaleY('+p+')';
    if(car && !rm) car.style.top = (p*100)+'%';
    if(top) top.style.width = (p*100)+'%';
    ticking=false;
  }
  if(rail || top){
    addEventListener('scroll', function(){ if(!ticking){ requestAnimationFrame(onScroll); ticking=true; } }, {passive:true});
    onScroll();
  }

  // Restrained hero parallax (v1 pages)
  var bgimg = document.querySelector('.hero-bg img');
  if(bgimg && !rm){
    var t=false;
    addEventListener('scroll', function(){
      if(!t){ requestAnimationFrame(function(){ bgimg.style.transform='scale(1.14) translate3d(0,'+Math.min(scrollY*0.14,70)+'px,0)'; t=false; }); t=true; }
    }, {passive:true});
  }
})();
