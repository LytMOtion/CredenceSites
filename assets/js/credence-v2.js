// Credence v2 — interactions
(function(){
  var rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var head = document.querySelector('.head');
  var hero = document.querySelector('.hero');
  function onScroll(){
    // header turns solid after the hero
    var trigger = hero ? hero.offsetHeight - 90 : 80;
    if(head) head.classList.toggle('solid', scrollY > trigger);
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  var burger = document.querySelector('.burger'), nav = document.querySelector('.nav');
  if(burger && nav){
    burger.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true':'false');
      // ensure header is legible while menu open
      if(open) head.classList.add('solid');
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ nav.classList.remove('open'); burger.setAttribute('aria-expanded','false'); onScroll(); });
    });
  }

  if('IntersectionObserver' in window && !rm){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:.1, rootMargin:'0px 0px -60px 0px'});
    document.querySelectorAll('.reveal').forEach(function(e){ io.observe(e); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(e){ e.classList.add('in'); });
  }
})();
