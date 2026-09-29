// Verificaciones estáticas sin dependencias. Sale con código 1 si algo falla.
import fs from 'node:fs';
const r = f => fs.readFileSync(f, 'utf8'), html = r('index.html'), js = r('main.js'), err = [];
const no = (c, m) => c && err.push(m);
no(/innerHTML|outerHTML|insertAdjacentHTML/.test(js), 'main.js inyecta HTML');
no(/style="/.test(html), 'index.html tiene estilos inline');
no(/toISOString\(\)\.slice/.test(js), 'fecha UTC en main.js');
no(/id="rep"|reputation/.test(html + js + r('data/site.js')), 'restos de reputación');
no(/<dominio>|tu-dominio|example\.com|ejemplo\.test|lorem/i.test(html + r('robots.txt') + r('README.md')), 'placeholder de dominio/texto');
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
[...html.matchAll(/href="#([^"]+)"/g)].forEach(m => no(!ids.has(m[1]), 'ancla rota #' + m[1]));
[...html.matchAll(/(?:src|href)="((?!https?:|#|tel:|mailto:)[^"]+)"/g)].forEach(m => no(!fs.existsSync(m[1]), 'archivo inexistente: ' + m[1]));
no((html.match(/<h1[\s>]/g) || []).length !== 1, 'debe haber un único H1');
no(![...html.matchAll(/<a[^>]*data-(wa|map|ig|tel|menu)[^>]*>/g)].every(m => /href="[^"]+"/.test(m[0])), 'enlace crítico sin href estático');
if (err.length) { console.error('FALLA:\n- ' + err.join('\n- ')); process.exit(1); }
console.log('check OK');
