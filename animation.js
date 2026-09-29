/* Movimiento: mejora progresiva. Una idea: el horizonte se abre y la ruta avanza. Sin JS o con "reducir movimiento" el sitio queda completo. */
(()=>{const g=window.gsap,ST=window.ScrollTrigger;if(!g||!ST||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
try{g.registerPlugin(ST);const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const split=el=>{const walk=n=>[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t))f.append(t);else{const s=document.createElement('span');s.className='w';s.textContent=t;f.append(s)}});c.replaceWith(f)}else if(c.nodeType===1)walk(c)});walk(el)};
/* Apertura: línea de asfalto -> ventana sobre la parrilla; el titular sube desde el corte */
g.timeline({defaults:{ease:'expo.out'}})
.from('.hero .l1,.hero .l2',{yPercent:105,duration:1.4,stagger:.12})
.fromTo('.hero-window',{clipPath:'inset(48% 0 48% 0)'},{clipPath:'inset(0% 0 0% 0)',duration:1.6,ease:'expo.inOut'},.15)
.from('.hero-img',{scale:1.5,duration:2.2},.15)
.from('.hero-foot>*',{y:24,opacity:0,duration:.9,stagger:.1},.9);
const hs={trigger:'.hero',start:'top top',end:'bottom top',scrub:true};
g.to('.hero .l1',{xPercent:-6,ease:'none',scrollTrigger:hs});g.to('.hero .l2',{xPercent:4,ease:'none',scrollTrigger:hs});g.to('.hero-img',{yPercent:12,ease:'none',scrollTrigger:hs});
/* La ruta: un punto recorre la línea con el scroll */
const dot=$('.route i');if(dot&&matchMedia('(min-width:821px)').matches)g.to(dot,{y:()=>innerHeight-24,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:.3}});
/* Manifiesto: las palabras se encienden al leerlas */
$$('.split').forEach(el=>{split(el);g.fromTo($$('.w',el),{opacity:.18},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:el,start:'top 80%',end:'bottom 45%',scrub:true}})});
/* Mesa: categorías entran como letras de cartel; platos se abren desde el centro */
g.from('.cats li',{yPercent:60,opacity:0,duration:1.1,stagger:.15,ease:'power4.out',scrollTrigger:{trigger:'.cats',start:'top 85%'}});
$$('.ph').forEach((f,i)=>{g.fromTo(f,{clipPath:'inset(18% 12% 18% 12%)'},{clipPath:'inset(0% 0% 0% 0%)',ease:'none',scrollTrigger:{trigger:f,start:'top 95%',end:'top 35%',scrub:true}});g.fromTo($('img',f),{yPercent:i?-9:-6},{yPercent:0,ease:'none',scrollTrigger:{trigger:f,start:'top bottom',end:'bottom top',scrub:true}})});
/* Peña: el reflector recorre el salón mientras se lo mira (en puntero fino sigue al cursor: main.js) */
const spot=$('#spot');if(spot){const o={x:15,y:55};g.to(o,{x:85,y:40,ease:'none',onUpdate:()=>{if(!spot.classList.contains('pointer')){spot.style.setProperty('--x',o.x+'%');spot.style.setProperty('--y',o.y+'%')}},scrollTrigger:{trigger:'.pena',start:'top 80%',end:'bottom 30%',scrub:true}})}
g.from('.pena h2',{yPercent:40,opacity:0,duration:1.2,ease:'power4.out',scrollTrigger:{trigger:'.pena-copy',start:'top 85%'}});
g.from('#gallery figure',{x:120,opacity:0,duration:1,stagger:.1,ease:'power3.out',scrollTrigger:{trigger:'#gallery',start:'top 85%'}});
g.from('.hours div',{opacity:0,y:30,duration:.8,stagger:.1,ease:'power3.out',scrollTrigger:{trigger:'.hours',start:'top 85%'}});
g.from('.giant',{yPercent:25,opacity:0,duration:1.2,ease:'power4.out',scrollTrigger:{trigger:'.giant',start:'top 88%'}});
g.from('.wordmark',{yPercent:50,duration:1.3,ease:'power4.out',scrollTrigger:{trigger:'.wordmark',start:'top 100%'}});
if(matchMedia('(hover:hover) and (pointer:fine)').matches)$$('.hero .btn,.arrival .btn,#llegar .btn').forEach(b=>{const x=g.quickTo(b,'x',{duration:.5,ease:'power3'}),y=g.quickTo(b,'y',{duration:.5,ease:'power3'});b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.25);y((e.clientY-r.top-r.height/2)*.35)});b.addEventListener('pointerleave',()=>{x(0);y(0)})});
addEventListener('load',()=>ST.refresh());
}catch(e){console.warn('GSAP: se mantiene el contenido estático',e)}})();
