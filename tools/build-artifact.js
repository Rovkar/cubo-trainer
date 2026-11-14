// Genera dist/index.html listo para publicar como Artifact (sin doctype/html/head/body).
// Uso: node tools/build-artifact.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const headM = src.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
const bodyM = src.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
if (!headM || !bodyM) throw new Error('index.html no tiene head/body');

const head = headM[1];
const title = (head.match(/<title[^>]*>[\s\S]*?<\/title>/i) || ['<title>Cubo Trainer</title>'])[0];
const keep = [];
(head.match(/<link\b[^>]*>/gi) || []).filter((t) => /rel=["']?stylesheet/i.test(t)).forEach((t) => keep.push(t));
(head.match(/<style\b[\s\S]*?<\/style>/gi) || []).forEach((t) => keep.push(t));
(head.match(/<meta\b[^>]*>/gi) || []).filter((t) => !/charset|name=["']?viewport/i.test(t)).forEach((t) => keep.push(t));

let body = bodyM[2].trim();
const attrs = bodyM[1].trim();
if (attrs) body = '<div ' + attrs + '>\n' + body + '\n</div>';

const out = [title].concat(keep, [body]).join('\n') + '\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), out);

const files = [];
(out.match(/(?:href|src)=["']([^"']+)["']/gi) || []).forEach((m) => {
  const u = m.replace(/^[^"']+["']|["']$/g, '');
  if (!/^(https?:|data:|#|\/\/)/i.test(u)) files.push(u);
});
console.log('dist/index.html generado. Archivos locales a publicar junto a la página:');
files.forEach((f) => console.log('  ' + f + (fs.existsSync(path.join(root, f)) ? '' : '   <-- NO EXISTE')));
