// Servidor local de desenvolvimento: serve site/ aplicando os cabeçalhos do _headers,
// para testar a CSP do jeito que vai ao ar. Uso: npm start  (porta 5173 ou PORTA=xxxx)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const PORTA = Number(process.env.PORTA || 5173);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

async function lerCabecalhos() {
  const texto = await readFile(join(RAIZ, '_headers'), 'utf8');
  const regras = [];
  let atual = null;
  for (const linha of texto.split(/\r?\n/)) {
    if (!linha.trim() || linha.trim().startsWith('#')) continue;
    if (!/^\s/.test(linha)) { atual = { padrao: linha.trim(), cab: {} }; regras.push(atual); continue; }
    const i = linha.indexOf(':');
    if (atual && i > 0) atual.cab[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  }
  return regras;
}

function casa(padrao, caminho) {
  if (padrao.endsWith('*')) return caminho.startsWith(padrao.slice(0, -1));
  return caminho === padrao;
}

const regras = await lerCabecalhos();
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let caminho = decodeURIComponent(url.pathname);
    if (caminho.endsWith('/')) caminho += 'index.html';
    const arquivo = normalize(join(RAIZ, caminho));
    if (!arquivo.startsWith(RAIZ) || caminho.includes('_headers')) { res.writeHead(403).end(); return; }
    const info = await stat(arquivo).catch(() => null);
    if (!info?.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return; }
    const cab = { 'Content-Type': TIPOS[extname(arquivo)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' };
    for (const r of regras) if (casa(r.padrao, url.pathname)) Object.assign(cab, r.cab);
    delete cab['Strict-Transport-Security']; // Só faz sentido em https.
    res.writeHead(200, cab).end(await readFile(arquivo));
  } catch {
    res.writeHead(500).end();
  }
}).listen(PORTA, '127.0.0.1', () => console.log(`Site em http://localhost:${PORTA}`));
