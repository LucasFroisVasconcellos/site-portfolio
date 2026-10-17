// Conferência do que vai ao ar (pasta site/): segredos, metadados das imagens, peso,
// código perigoso e CSP. Casos SG-01, SG-06, RNF-04, RNF-05 e RNF-22. Uso: npm run verificar
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const arquivos = [];
(function andar(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) andar(p); else arquivos.push(p); } }(SITE));
const rel = (p) => relative(SITE, p).replaceAll('\\', '/');
const resultados = [];
const registrar = (id, ok, detalhe) => resultados.push({ id, resultado: ok ? 'PASS' : 'FAIL', detalhe });

// SG-01: nenhum padrão de chave, token ou senha.
const PADROES = [
  /gh[pousr]_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /AKIA[0-9A-Z]{16}/, /AIza[0-9A-Za-z_-]{30,}/,
  /sk-[A-Za-z0-9]{20,}/, /xox[baprs]-[A-Za-z0-9-]{10,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(senha|password|passwd|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"\s]{6,}['"]/i,
];
const textos = arquivos.filter((p) => ['.js', '.html', '.css', '.json', '.svg', '.txt', ''].includes(extname(p)) && !rel(p).startsWith('vendor/'));
const achados = [];
for (const p of textos) {
  const s = readFileSync(p, 'utf8');
  for (const r of PADROES) if (r.test(s)) achados.push(`${rel(p)} ~ ${r}`);
}
registrar('SG-01', achados.length === 0, achados.join('; ') || 'nenhum padrão de segredo');

// SG-06 / RNF-22: imagens sem EXIF, XMP, GPS ou data.
function metadadosWebp(buf) {
  const marcas = [];
  for (let i = 12; i + 8 <= buf.length;) {
    const tipo = buf.toString('ascii', i, i + 4);
    const tam = buf.readUInt32LE(i + 4);
    if (['EXIF', 'XMP ', 'ICCP'].includes(tipo)) marcas.push(tipo.trim());
    i += 8 + tam + (tam % 2);
  }
  return marcas;
}
const comMeta = [];
for (const p of arquivos) {
  const ext = extname(p);
  const buf = readFileSync(p);
  if (ext === '.webp') { const m = metadadosWebp(buf); if (m.length) comMeta.push(`${rel(p)}: ${m.join(',')}`); }
  if (ext === '.jpg' || ext === '.jpeg') { if (buf.includes(Buffer.from('Exif\0\0'))) comMeta.push(`${rel(p)}: EXIF`); }
  if (ext === '.png') { for (const c of ['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']) if (buf.includes(Buffer.from(c))) comMeta.push(`${rel(p)}: ${c}`); }
  if (ext === '.svg') { const s = buf.toString('utf8'); if (/<metadata|inkscape:|sodipodi:|<script/i.test(s)) comMeta.push(`${rel(p)}: metadata/script`); }
}
registrar('SG-06', comMeta.length === 0, comMeta.join('; ') || 'nenhuma imagem com metadados');

// RNF-04: JS e CSS do primeiro carregamento até 300 kB comprimidos (Three.js fica fora: só carrega nas medalhas).
const primeiro = arquivos.filter((p) => ['.js', '.css'].includes(extname(p)) && !rel(p).startsWith('vendor/') && !rel(p).endsWith('sem-suporte.js'));
const gz = primeiro.reduce((t, p) => t + gzipSync(readFileSync(p)).length, 0);
registrar('RNF-04 (código)', gz <= 300 * 1024, `${(gz / 1024).toFixed(1)} kB gzip em ${primeiro.length} arquivos`);
const leves = arquivos.filter((p) => /img\/paredes\/.*(-leve\.webp|\.svg)$/.test(rel(p)));
const pesoLeves = leves.reduce((t, p) => t + statSync(p).size, 0);
registrar('RNF-04 (imagens leves)', pesoLeves <= 1.2 * 1024 * 1024, `${(pesoLeves / 1024).toFixed(1)} kB`);
const three = arquivos.filter((p) => rel(p).startsWith('vendor/three-r186/') && extname(p) === '.js').reduce((t, p) => t + gzipSync(readFileSync(p)).length, 0);
registrar('Three.js (sob demanda)', true, `${(three / 1024).toFixed(1)} kB gzip, baixado só ao abrir as medalhas`);

// RNF-05: site inteiro até 8 MB.
const total = arquivos.reduce((t, p) => t + statSync(p).size, 0);
registrar('RNF-05', total <= 8 * 1024 * 1024, `${(total / 1024 / 1024).toFixed(2)} MB no total`);

// Invariante 2 e CSP: sem innerHTML/eval no código do site, sem style= ou script embutido no HTML.
const perigos = [];
for (const p of arquivos.filter((x) => extname(x) === '.js' && !rel(x).startsWith('vendor/'))) {
  const s = readFileSync(p, 'utf8');
  for (const r of [/\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML/, /\beval\(/, /new Function\(/, /document\.write/, /location\.(search|hash)/]) if (r.test(s)) perigos.push(`${rel(p)} ~ ${r}`);
}
const paginas = arquivos.filter((p) => extname(p) === '.html');
for (const pg of paginas) {
  const h = readFileSync(pg, 'utf8');
  if (/\sstyle\s*=/.test(h)) perigos.push(`${rel(pg)}: atributo style (bloqueado pela CSP)`);
  // Só dados estruturados (application/ld+json) podem ficar embutidos: não são executados.
  if (/<script(?![^>]*\ssrc=)(?![^>]*type="application\/ld\+json")[^>]*>/.test(h)) perigos.push(`${rel(pg)}: script embutido`);
  if (/\son[a-z]+\s*=/.test(h)) perigos.push(`${rel(pg)}: manipulador on* embutido`);
  for (const m of h.matchAll(/<a\s[^>]*href="https?:[^"]+"[^>]*>/g)) if (!/rel="noopener noreferrer"/.test(m[0])) perigos.push(`${rel(pg)}: link sem noopener: ${m[0]}`);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { perigos.push(`${rel(pg)}: dados estruturados com JSON inválido`); }
  }
}
registrar('Invariante 2 / CSP', perigos.length === 0, perigos.join('; ') || 'sem innerHTML, eval, estilo ou script embutido');

// SEO: robots, sitemap, 404 e endereço canônico em toda página indexável.
const seo = [];
for (const f of ['robots.txt', 'sitemap.xml', '404.html']) if (!arquivos.some((p) => rel(p) === f)) seo.push(`falta ${f}`);
const mapa = arquivos.some((p) => rel(p) === 'sitemap.xml') ? readFileSync(join(SITE, 'sitemap.xml'), 'utf8') : '';
for (const loc of mapa.matchAll(/<loc>https:\/\/[^/]+\/([^<]*)<\/loc>/g)) {
  const arq = loc[1] === '' ? 'index.html' : `${loc[1]}index.html`;
  if (!arquivos.some((p) => rel(p) === arq)) seo.push(`sitemap aponta para página inexistente: ${loc[1]}`);
  else if (!readFileSync(join(SITE, arq), 'utf8').includes('rel="canonical"')) seo.push(`${arq} sem canonical`);
}
registrar('SEO básico', seo.length === 0, seo.join('; ') || 'robots.txt, sitemap.xml, 404.html e canonical em todas as páginas do sitemap');

// _headers com todos os cabeçalhos da seção 8.5.
const cab = readFileSync(join(SITE, '_headers'), 'utf8');
const faltando = ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', "frame-ancestors 'none'"].filter((c) => !cab.includes(c));
registrar('RNF-18 (arquivo)', faltando.length === 0, faltando.length ? `faltando: ${faltando.join(', ')}` : '_headers completo (falta conferir no endereço publicado)');

for (const r of resultados) console.log(`${r.resultado.padEnd(5)} ${r.id.padEnd(24)} ${r.detalhe}`);
process.exit(resultados.some((r) => r.resultado !== 'PASS') ? 1 : 0);
