// Armazenamento, idioma, medição, geometria, conteúdo e itens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarArmazenamento } from '../site/js/armazenamento.js';
import { idiomaInicial, criarI18n, tempoRelativo, formatar } from '../site/js/i18n.js';
import { criarMedicao, eventoValido } from '../site/js/medicao.js';
import { enquadrarParede, enquadrarFoco, matrizTela } from '../site/js/geometria.js';
import { ITENS, PAREDES, LARGURA_PAREDE, ALTURA_PAREDE, paredeVizinha } from '../site/js/itens.js';
import { linkPermitido } from '../site/js/links.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(RAIZ, 'site');
const json = (p) => JSON.parse(readFileSync(join(SITE, p), 'utf8'));

test('RNF-17: armazenamento bloqueado não quebra nada', () => {
  const bloqueado = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  const a = criarArmazenamento(bloqueado);
  assert.equal(a.ler('idioma'), null);
  assert.equal(a.gravar('idioma', 'pt'), false);
  const b = criarArmazenamento(null);
  assert.equal(b.ler('x'), null);
  assert.equal(b.gravar('x', 1), false);
});

test('Armazenamento: versão e validação em toda leitura', () => {
  const m = new Map();
  const store = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  const a = criarArmazenamento(store);
  a.gravar('idioma', 'en');
  assert.equal(a.ler('idioma', (d) => (['pt', 'en'].includes(d) ? d : null)), 'en');
  a.gravar('idioma', 'xx');
  assert.equal(a.ler('idioma', (d) => (['pt', 'en'].includes(d) ? d : null)), null);
  assert.equal(m.size, 0);
  m.set('site-portfolio:passeio', '{"v":0,"d":true}');
  assert.equal(a.ler('passeio'), null);
});

test('Idioma: escolha salva vale; senão português só para navegador em português', () => {
  assert.equal(idiomaInicial('en', ['pt-BR']), 'en');
  assert.equal(idiomaInicial(null, ['pt-BR', 'en']), 'pt');
  assert.equal(idiomaInicial(null, ['pt-PT']), 'pt');
  assert.equal(idiomaInicial(null, ['es-ES', 'pt-BR']), 'en');
  assert.equal(idiomaInicial('fr', []), 'en');
  assert.equal(idiomaInicial(undefined, undefined), 'en');
});

test('Toda chave de texto existe em PT e em EN (seção 6.6)', () => {
  const pt = json('conteudo/pt.json');
  const en = json('conteudo/en.json');
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
  for (const [k, v] of Object.entries({ ...pt, ...en })) assert.ok(typeof v === 'string' && v.trim(), k);
  // Variáveis {x} iguais nas duas línguas.
  for (const k of Object.keys(pt)) {
    const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    assert.equal(vars(pt[k]), vars(en[k]), k);
  }
});

test('Toda chave usada no código existe nos dicionários', () => {
  const pt = json('conteudo/pt.json');
  const arquivos = [];
  const andar = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) andar(p); else if (/\.(js|html)$/.test(f)) arquivos.push(p); } };
  andar(join(SITE, 'js')); arquivos.push(join(SITE, 'index.html'));
  const faltando = new Set();
  for (const f of arquivos) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?:\bt\(|data-i18n(?:-aria|-title)?=)['"]([a-z0-9]+(?:\.[A-Za-z0-9]+)+)['"]/g)) {
      if (!(m[1] in pt)) faltando.add(`${m[1]} (${f.slice(SITE.length)})`);
    }
  }
  assert.deepEqual([...faltando], []);
});

test('Campos bilíngues dos arquivos de conteúdo têm PT e EN; links estão na lista', () => {
  const conferir = (obj, caminho) => {
    if (Array.isArray(obj)) return obj.forEach((x, i) => conferir(x, `${caminho}[${i}]`));
    if (obj && typeof obj === 'object') {
      const chaves = Object.keys(obj);
      if (chaves.includes('pt') || chaves.includes('en')) {
        assert.ok(typeof obj.pt === 'string' && obj.pt && typeof obj.en === 'string' && obj.en, caminho);
        return;
      }
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'link' && v !== null) assert.ok(linkPermitido(v), `${caminho}.link`);
        conferir(v, `${caminho}.${k}`);
      }
    }
  };
  for (const f of ['projetos', 'fotos', 'medalhas', 'instagram', 'linkedin']) conferir(json(`conteudo/${f}.json`), f);
  for (const f of json('conteudo/fotos.json').fotos) assert.ok(existsSync(join(SITE, f.arquivo)), f.arquivo);
  for (const f of json('conteudo/instagram.json').fotos) assert.ok(existsSync(join(SITE, f.arquivo)), f.arquivo);
  for (const p of json('conteudo/projetos.json').projetos) assert.ok(existsSync(join(SITE, p.imagem)), p.imagem);
});

test('i18n: troca sem recarregar e formata variáveis', () => {
  const i = criarI18n({ pt: { a: 'Olá {n}' }, en: { a: 'Hi {n}' } }, 'pt');
  let avisado = null;
  i.aoTrocar((x) => { avisado = x; });
  assert.equal(i.t('a', { n: 1 }), 'Olá 1');
  assert.equal(i.trocar('en'), true);
  assert.equal(avisado, 'en');
  assert.equal(i.t('a', { n: 2 }), 'Hi 2');
  assert.equal(i.trocar('xx'), false);
  assert.equal(i.campo({ pt: 'p', en: 'e' }), 'e');
  assert.equal(formatar('{a}{b}', { a: 1 }), '1{b}');
  const tr = criarI18n({ pt: { 'tempo.agora': 'agora', 'tempo.min': 'há {n} min', 'tempo.h': 'há {n} h', 'tempo.dia': 'há 1 dia', 'tempo.dias': 'há {n} dias' } });
  const agora = Date.UTC(2026, 9, 12);
  assert.equal(tempoRelativo(new Date(agora - 3 * 864e5).toISOString(), agora, tr), 'há 3 dias');
  assert.equal(tempoRelativo('lixo', agora, tr), '');
});

test('RNF-34/A12: medição só em produção, só nomes da lista, nada digitado', () => {
  const enviados = [];
  const buscar = (url, o) => { enviados.push(JSON.parse(o.body)); return Promise.resolve(); };
  const desligada = criarMedicao({ config: { idSite: '', endereco: 'x', hostsProducao: [] }, host: 'localhost', buscar });
  assert.equal(desligada.evento('abrir-pc'), false);
  const prev = criarMedicao({ config: { idSite: 'id', endereco: 'x', hostsProducao: ['lucas.dev'] }, host: 'abc.pages.dev', buscar });
  assert.equal(prev.evento('abrir-pc'), false);
  const prod = criarMedicao({ config: { idSite: 'id', endereco: 'x', hostsProducao: ['lucas.dev'] }, host: 'lucas.dev', buscar });
  assert.equal(prod.evento('abrir-pc'), true);
  assert.equal(prod.evento('Olá, quero um site'), false);
  assert.equal(eventoValido('sair-whatsapp'), true);
  assert.deepEqual(Object.keys(enviados[0].payload).sort(), ['hostname', 'language', 'name', 'url', 'website']);
  assert.equal(enviados[0].payload.url, '/');
});

test('Geometria: a região essencial sempre cabe na tela (RF-01), em pé e deitado', () => {
  const telas = [[1920, 1080], [1366, 768], [869, 412], [412, 869], [320, 568], [568, 320], [2560, 1440], [768, 1024], [1024, 768]];
  for (const parede of PAREDES) {
    for (const [vw, vh] of telas) {
      const { s, tx, ty } = enquadrarParede({ vw, vh, w: LARGURA_PAREDE, h: ALTURA_PAREDE, essencial: parede.essencial });
      const e = parede.essencial;
      const x0 = tx + e.x * s; const y0 = ty + e.y * s;
      assert.ok(x0 >= -0.5 && y0 >= -0.5 && x0 + e.w * s <= vw + 0.5 && y0 + e.h * s <= vh + 0.5, `${parede.id} ${vw}x${vh}`);
      // E todo item clicável da parede está dentro da essencial.
      for (const it of ITENS.filter((i) => i.parede === parede.id)) {
        assert.ok(it.area.x >= e.x && it.area.y >= e.y && it.area.x + it.area.w <= e.x + e.w && it.area.y + it.area.h <= e.y + e.h, it.id);
      }
    }
  }
});

test('Geometria: foco centraliza e preenche', () => {
  const f = enquadrarFoco({ vw: 1000, vh: 500, area: { x: 100, y: 100, w: 100, h: 50 }, preenchimento: 1 });
  assert.equal(f.s, 10);
  assert.equal(f.tx + 150 * f.s, 500);
  assert.equal(f.ty + 125 * f.s, 250);
});

test('Homografia leva os cantos da tela aos cantos do quadrilátero', () => {
  for (const it of ITENS.filter((i) => i.telaQuad)) {
    const { aplicar } = matrizTela(800, 500, it.telaQuad);
    const cantos = [[0, 0], [800, 0], [800, 500], [0, 500]];
    cantos.forEach(([x, y], k) => {
      const [X, Y] = aplicar(x, y);
      assert.ok(Math.abs(X - it.telaQuad[k][0]) < 1e-6 && Math.abs(Y - it.telaQuad[k][1]) < 1e-6, it.id);
    });
  }
});

test('Itens dentro da parede e paredes em ciclo', () => {
  for (const it of ITENS) {
    assert.ok(PAREDES.some((p) => p.id === it.parede));
    assert.ok(it.area.x >= 0 && it.area.y >= 0 && it.area.x + it.area.w <= LARGURA_PAREDE && it.area.y + it.area.h <= ALTURA_PAREDE);
  }
  assert.equal(paredeVizinha('frente', 1), 'direita');
  assert.equal(paredeVizinha('frente', -1), 'esquerda');
  assert.equal(paredeVizinha('esquerda', 1), 'frente');
});

test('RNF-19: Three.js vendorizado confere com o hash registrado', () => {
  const linhas = readFileSync(join(SITE, 'vendor/three/VERSAO.txt'), 'utf8').split('\n').filter((l) => /^[0-9a-f]{64} /.test(l));
  assert.equal(linhas.length, 2);
  for (const l of linhas) {
    const [hash, arq] = l.split(/\s+/);
    const real = createHash('sha256').update(readFileSync(join(SITE, 'vendor/three', arq))).digest('hex');
    assert.equal(real, hash, arq);
  }
});
