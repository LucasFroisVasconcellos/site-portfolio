// Casos GH-01 a GH-14 (seção 10.4) e valores aleatórios no validador (seção 10.7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarClienteGitHub } from '../site/js/github/cliente.js';
import { validarRepo, validarCommit, validarPerfil, validarListaRepos, validarPacote, urlDoDono } from '../site/js/github/validar.js';
import { criarArmazenamento } from '../site/js/armazenamento.js';

const U = 'LucasFroisVasconcellos';

function memoria() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _m: m,
  };
}

function repo(nome, dias, extra = {}) {
  return {
    name: nome, fork: false, private: false, description: `desc ${nome}`, language: 'JavaScript',
    stargazers_count: 1, pushed_at: new Date(Date.UTC(2026, 9, 12) - dias * 864e5).toISOString().replace('.000', ''),
    html_url: `https://github.com/${U}/${nome}`, ...extra,
  };
}

function commit(i, repoNome) {
  return {
    sha: `abcdef${String(i).padStart(2, '0')}1234`.slice(0, 40).replace(/[^0-9a-f]/g, 'a'),
    html_url: `https://github.com/${U}/${repoNome}/commit/abc${i}`,
    commit: { message: `Commit ${i}\n\ncorpo longo`, author: { date: `2026-10-1${i % 10}T10:00:00Z` } },
  };
}

function resposta(status, corpo, cabecalhos = {}) {
  return {
    status, ok: status >= 200 && status < 300,
    headers: { get: (k) => cabecalhos[k.toLowerCase()] ?? null },
    text: async () => (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)),
  };
}

function apiOk(chamadas) {
  return async (url, opcoes) => {
    chamadas.push(url);
    if (opcoes?.signal?.aborted) throw new Error('abort');
    if (url.endsWith(`/users/${U}`)) return resposta(200, { login: U, name: 'Lucas', bio: 'bio', public_repos: 4, followers: 2 });
    if (url.includes('/repos?')) return resposta(200, [repo('a', 1), repo('fork', 0, { fork: true }), repo('b', 2), repo('c', 3), repo('d', 4)]);
    const m = url.match(/\/repos\/[^/]+\/([^/]+)\/commits/);
    if (m) return resposta(200, [1, 2, 3, 4, 5, 6].map((i) => commit(i, m[1])));
    return resposta(404, {});
  };
}

function cliente({ buscar, agora = () => Date.UTC(2026, 9, 12, 12), store = memoria(), instantaneo = null, timers } = {}) {
  return criarClienteGitHub({
    usuario: U, buscar, agora,
    armazenamento: criarArmazenamento(store),
    carregarInstantaneo: async () => instantaneo,
    agendar: timers?.agendar ?? ((fn, ms) => setTimeout(fn, ms)),
    cancelar: timers?.cancelar ?? ((id) => clearTimeout(id)),
  });
}

const INST = {
  hora: '2026-10-01T00:00:00.000Z', perfil: null,
  repos: [{ nome: 'x', descricao: '', linguagem: '', estrelas: 0, atualizado: '2026-09-01T00:00:00Z', url: `https://github.com/${U}/x` }],
  commits: [],
};

test('GH-01: tudo certo → repositórios por atividade, sem forks; 5 commits de até 3 repositórios', async () => {
  const chamadas = [];
  const c = cliente({ buscar: apiOk(chamadas) });
  const r = await c.abrir();
  assert.equal(r.origem, 'api');
  assert.equal(chamadas.length, 5);
  assert.deepEqual(r.dados.repos.map((x) => x.nome), ['a', 'b', 'c', 'd']);
  assert.equal(r.dados.commits.length, 15);
  assert.deepEqual([...new Set(r.dados.commits.map((x) => x.repo))].sort(), ['a', 'b', 'c']);
  assert.ok(r.dados.commits.every((x) => !x.mensagem.includes('\n')));
});

test('GH-02: 403 com limite zerado → reserva com hora e nenhuma chamada antes do reinício', async () => {
  let t = Date.UTC(2026, 9, 12, 12);
  const chamadas = [];
  const reset = Math.floor(t / 1000) + 1800;
  const buscar = async (url) => { chamadas.push(url); return resposta(403, {}, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) }); };
  const c = cliente({ buscar, agora: () => t, instantaneo: INST });
  const r = await c.abrir();
  assert.equal(r.origem, 'instantaneo');
  assert.equal(r.erro, 'limite');
  const antes = chamadas.length;
  t += 60 * 1000 * 10;
  const r2 = await c.abrir();
  assert.equal(chamadas.length, antes);
  assert.equal(r2.origem, 'instantaneo');
  t = reset * 1000 + 1;
  await c.abrir();
  assert.ok(chamadas.length > antes);
});

test('GH-03: 429 → igual ao GH-02', async () => {
  const t = Date.UTC(2026, 9, 12, 12);
  const chamadas = [];
  const buscar = async (url) => { chamadas.push(url); return resposta(429, {}, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(t / 1000) + 600) }); };
  const c = cliente({ buscar, agora: () => t, instantaneo: INST });
  const r = await c.abrir();
  assert.equal(r.erro, 'limite');
  const n = chamadas.length;
  await c.abrir();
  assert.equal(chamadas.length, n);
});

test('GH-04: erro 500 ou rede fora → reserva; tentar de novo continua possível', async () => {
  const c1 = cliente({ buscar: async () => resposta(500, 'x'), instantaneo: INST });
  assert.equal((await c1.abrir()).origem, 'instantaneo');
  const c2 = cliente({ buscar: async () => { throw new TypeError('rede'); }, instantaneo: INST });
  const r = await c2.abrir();
  assert.equal(r.origem, 'instantaneo');
  assert.equal(r.erro, 'rede');
});

test('GH-05: sem resposta por 8 s → chamada cancelada; reserva', async () => {
  const pend = [];
  const timers = { agendar: (fn, ms) => { pend.push({ fn, ms }); return pend.length; }, cancelar: () => {} };
  const buscar = (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abort'))));
  const c = cliente({ buscar, instantaneo: INST, timers });
  const p = c.abrir();
  await new Promise((r) => setImmediate(r));
  assert.ok(pend.every((x) => x.ms === 8000));
  pend.forEach((x) => x.fn());
  const r = await p;
  assert.equal(r.origem, 'instantaneo');
});

test('GH-06: resposta que não é JSON → descartada; reserva', async () => {
  const c = cliente({ buscar: async () => resposta(200, '<html>oops'), instantaneo: INST });
  const r = await c.abrir();
  assert.equal(r.origem, 'instantaneo');
  assert.equal(r.erro, 'formato');
});

test('GH-07: descrição com HTML vira texto puro (nenhum elemento é criado pelo validador)', () => {
  const v = validarRepo(repo('x', 1, { description: '<img src=x onerror=alert(1)>' }));
  assert.equal(v.descricao, '<img src=x onerror=alert(1)>');
  assert.equal(typeof v.descricao, 'string');
});

test('GH-08: endereço em outro domínio → o link não é criado', () => {
  assert.equal(validarRepo(repo('x', 1, { html_url: 'https://evil.com/LucasFroisVasconcellos/x' })).url, null);
  assert.equal(validarRepo(repo('x', 1, { html_url: 'javascript:alert(1)' })).url, null);
  assert.equal(validarRepo(repo('x', 1, { html_url: 'https://github.com/outro/x' })).url, null);
  assert.equal(urlDoDono('https://github.com/LucasFroisVasconcellosX'), null);
});

test('GH-09: descrição de 10.000 caracteres e 500 repositórios → corte em 200 e 30 na tela', () => {
  const lista = Array.from({ length: 500 }, (_, i) => repo(`r${i}`, i % 50, { description: 'x'.repeat(10000) }));
  const v = validarListaRepos(lista);
  assert.equal(v.length, 30);
  assert.ok(v.every((r) => r.descricao.length === 200));
});

test('GH-10: cache de 5 min → nenhuma chamada; cache de 11 min → uma atualização', async () => {
  let t = Date.UTC(2026, 9, 12, 12);
  const chamadas = [];
  const store = memoria();
  const c = cliente({ buscar: apiOk(chamadas), agora: () => t, store });
  await c.abrir();
  assert.equal(chamadas.length, 5);
  t += 5 * 60 * 1000;
  const c2 = cliente({ buscar: apiOk(chamadas), agora: () => t, store });
  assert.equal((await c2.abrir()).origem, 'cache');
  assert.equal(chamadas.length, 5);
  t += 6 * 60 * 1000;
  const c3 = cliente({ buscar: apiOk(chamadas), agora: () => t, store });
  assert.equal((await c3.abrir()).origem, 'api');
  assert.equal(chamadas.length, 10);
});

test('GH-11: cache do aparelho corrompido → descartado sem erro; segue para a próxima reserva', async () => {
  for (const lixo of ['{', '{"v":1,"d":{"hora":"x"}}', '{"v":99,"d":{}}', '[]', 'null',
    JSON.stringify({ v: 1, d: { hora: '2026-10-12T00:00:00Z', perfil: null, repos: [{ nome: '<b>', atualizado: 'x' }], commits: 'x' } })]) {
    const store = memoria();
    store.setItem('site-portfolio:github', lixo);
    const c = cliente({ buscar: async () => resposta(500, ''), store, instantaneo: INST });
    const r = await c.abrir();
    assert.equal(r.origem, 'instantaneo', lixo);
    assert.equal(store.getItem('site-portfolio:github'), null);
  }
});

test('GH-12: "Atualizar" duas vezes em 1 s → uma única rodada de 5 chamadas', async () => {
  let t = Date.UTC(2026, 9, 12, 12);
  const chamadas = [];
  const c = cliente({ buscar: apiOk(chamadas), agora: () => t });
  const [a, b] = await Promise.all([c.atualizar(), c.atualizar()]);
  t += 1000;
  const d = await c.atualizar();
  assert.equal(chamadas.length, 5);
  assert.equal(a, b);
  assert.equal(d.ignorado, true);
  t += 60 * 1000;
  await c.atualizar();
  assert.equal(chamadas.length, 10);
});

test('GH-13: sem rede e sem cache → instantâneo com a data; sem instantâneo → nenhum', async () => {
  const sem = async () => { throw new TypeError('rede'); };
  const r1 = await cliente({ buscar: sem, instantaneo: INST }).abrir();
  assert.equal(r1.origem, 'instantaneo');
  assert.equal(r1.dados.hora, '2026-10-01T00:00:00.000Z');
  const r2 = await cliente({ buscar: sem, instantaneo: null }).abrir();
  assert.equal(r2.origem, 'nenhum');
  assert.equal(r2.dados, null);
  const r3 = await cliente({ buscar: sem, instantaneo: { hora: 'lixo' } }).abrir();
  assert.equal(r3.origem, 'nenhum');
});

test('GH-14/PC-06: cancelarTudo aborta consultas em andamento', async () => {
  let abortadas = 0;
  const buscar = (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => { abortadas += 1; rej(new Error('abort')); }));
  const c = cliente({ buscar, instantaneo: null, timers: { agendar: () => 0, cancelar: () => {} } });
  const p = c.abrir();
  await new Promise((r) => setImmediate(r));
  c.cancelarTudo();
  const r = await p;
  assert.ok(abortadas >= 1);
  assert.equal(r.origem, 'nenhum');
});

test('Validador: commit pega só a primeira linha, corta em 120 e recusa sha inválido', () => {
  const v = validarCommit({ sha: 'a'.repeat(40), commit: { message: `${'m'.repeat(300)}\nresto`, author: { date: '2026-10-10T10:00:00Z' } } }, 'r');
  assert.equal(v.mensagem.length, 120);
  assert.equal(validarCommit({ sha: 'zzz', commit: { message: 'x', author: { date: '2026-10-10T10:00:00Z' } } }, 'r'), null);
});

test('Validador: perfil com tipos trocados é recusado', () => {
  assert.equal(validarPerfil({ login: '<script>' }), null);
  assert.equal(validarPerfil({ login: U, public_repos: -1 }), null);
  assert.ok(validarPerfil({ login: U, public_repos: 3, followers: 0 }));
});

test('Auditoria: 100.000 respostas aleatórias no validador nunca lançam exceção nem passam dos limites', () => {
  let semente = 1234;
  const rnd = () => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; };
  const valores = [null, undefined, true, 0, -1, 1.5, 1e300, NaN, '', 'x', '<img src=x onerror=alert(1)>', 'a'.repeat(5000),
    '2026-10-10T10:00:00Z', '2026-13-45T99:99:99Z', 'https://github.com/LucasFroisVasconcellos/x', 'https://evil.com', 'javascript:alert(1)',
    [], {}, [1, 2], { toString: 1 }, '\u0000\u2028', '😀'.repeat(300)];
  const pick = () => valores[Math.floor(rnd() * valores.length)];
  const campos = ['name', 'fork', 'private', 'description', 'language', 'stargazers_count', 'pushed_at', 'html_url', 'sha', 'commit', 'login', 'public_repos', 'followers'];
  for (let i = 0; i < 100000; i++) {
    const obj = {};
    for (const c of campos) if (rnd() < 0.7) obj[c] = pick();
    if (rnd() < 0.3) obj.commit = { message: pick(), author: { date: pick() } };
    const r = validarRepo(obj);
    if (r) {
      assert.ok(r.nome.length <= 100 && r.descricao.length <= 200 && r.linguagem.length <= 30);
      assert.ok(Number.isSafeInteger(r.estrelas) && r.estrelas >= 0);
      assert.ok(r.url === null || r.url.startsWith('https://github.com/LucasFroisVasconcellos'));
    }
    const c = validarCommit(obj, 'r');
    if (c) assert.ok(Array.from(c.mensagem).length <= 120 && !/[\n\r]/.test(c.mensagem));
    validarPerfil(obj);
    validarPacote({ hora: pick(), perfil: rnd() < 0.5 ? null : obj, repos: rnd() < 0.5 ? [obj] : pick(), commits: [obj] });
  }
});
