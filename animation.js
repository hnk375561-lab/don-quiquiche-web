/* Capa de movimiento GSAP + ScrollTrigger (mejora progresiva: sin JS o con "reducir movimiento" el sitio queda completo). */
(()=>{const g=window.gsap,ST=window.ScrollTrigger;if(!g||!ST||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
try{g.registerPlugin(ST);const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const split=el=>{const walk=n=>[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t))f.append(t);else{const s=document.createElement('span');s.className='w';s.textContent=t;f.append(s)}});c.replaceWith(f)}else if(c.nodeType===1&&c.tagName!=='BR')walk(c)});walk(el)};
const sc=(t,o={})=>({trigger:t,start:'top 85%',...o});
g.timeline({defaults:{ease:'power4.out'}})
.from('.hero h1 .ln>span',{yPercent:115,duration:1.3,stagger:.14})
.from('.hero-media',{clipPath:'inset(100% 0 0 0)',duration:1.5,ease:'expo.inOut'},0)
.from('.hero-media img',{scale:1.4,duration:2},0)
.from('.kicker,.hero-copy,.hero-actions,.open-chip,.stamp',{y:26,opacity:0,duration:.9,stagger:.09},.55);
const hs={trigger:'.hero',start:'top top',end:'bottom top',scrub:true};
g.to('.hero-media img',{yPercent:9,ease:'none',scrollTrigger:hs});
g.to('.hero h1 .ln:first-child',{xPercent:-10,ease:'none',scrollTrigger:hs});
g.to('.hero h1 .ln:last-child',{xPercent:8,ease:'none',scrollTrigger:hs});
g.to('.stamp',{y:-90,rotation:40,ease:'none',scrollTrigger:hs});
$$('.split').forEach(el=>{split(el);g.fromTo($$('.w',el),{opacity:.15},{opacity:1,stagger:.12,ease:'none',scrollTrigger:{trigger:el,start:'top 80%',end:'bottom 50%',scrub:true}})});
$$('.par').forEach(f=>{g.fromTo(f,{clipPath:'inset(14% 10% 14% 10%)'},{clipPath:'inset(0% 0% 0% 0%)',ease:'none',scrollTrigger:{trigger:f,start:'top 95%',end:'top 40%',scrub:true}});g.fromTo($('img',f),{yPercent:-7},{yPercent:0,ease:'none',scrollTrigger:{trigger:f,start:'top bottom',end:'bottom top',scrub:true}})});
g.from('.mesa .display,.mesa .lead',{y:50,opacity:0,duration:1,stagger:.12,ease:'power3.out',scrollTrigger:sc('.mesa')});
g.from('.category-list li',{xPercent:-25,opacity:0,duration:1,stagger:.18,ease:'power3.out',scrollTrigger:sc('.category-list')});
g.fromTo('.pena-bg img',{yPercent:-12},{yPercent:0,ease:'none',scrollTrigger:{trigger:'.pena',start:'top bottom',end:'bottom top',scrub:true}});
g.from('.pena-copy>*',{y:40,opacity:0,duration:.9,stagger:.1,ease:'power3.out',scrollTrigger:sc('.pena-copy',{start:'top 80%'})});
g.from('#gallery figure',{x:90,opacity:0,duration:1,stagger:.12,ease:'power3.out',scrollTrigger:sc('#gallery')});
g.from('.visit .display,.hours-card dl div',{y:40,opacity:0,duration:.9,stagger:.1,ease:'power3.out',scrollTrigger:sc('.visit')});
g.from('.giant',{yPercent:30,opacity:0,duration:1.2,ease:'power4.out',scrollTrigger:sc('.arrival')});
g.from('.wordmark',{yPercent:40,opacity:0,duration:1.2,ease:'power4.out',scrollTrigger:sc('.wordmark',{start:'top 100%'})});
if(matchMedia('(hover:hover) and (pointer:fine)').matches)$$('.hero .btn,.mesa .btn,.arrival .btn').forEach(b=>{const x=g.quickTo(b,'x',{duration:.5,ease:'power3'}),y=g.quickTo(b,'y',{duration:.5,ease:'power3'});b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.25);y((e.clientY-r.top-r.height/2)*.35)});b.addEventListener('pointerleave',()=>{x(0);y(0)})});
addEventListener('load',()=>ST.refresh());
}catch(e){console.warn('GSAP: se mantiene el contenido estático',e)}})();
