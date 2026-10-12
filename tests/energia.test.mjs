// Casos PC-01 a PC-08 (ARQ-002, seção 10.3) e invariante 6.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarEnergia, ESTADOS } from '../site/js/pc/energia.js';

function relogio() {
  let t = 0;
  let id = 0;
  const pendentes = new Map();
  return {
    agora: () => t,
    agendar: (fn, ms) => { id += 1; pendentes.set(id, { fn, em: t + ms }); return id; },
    cancelar: (i) => { pendentes.delete(i); },
    avancar(ms) {
      const fim = t + ms;
      for (;;) {
        let prox = null;
        for (const [i, p] of pendentes) if (p.em <= fim && (!prox || p.em < prox[1].em)) prox = [i, p];
        if (!prox) break;
        pendentes.delete(prox[0]);
        t = prox[1].em;
        prox[1].fn();
      }
      t = fim;
    },
    get ativos() { return pendentes.size; },
  };
}

function nova(r, log = []) {
  return criarEnergia({ agora: r.agora, agendar: r.agendar, cancelar: r.cancelar, aoMudar: (e) => log.push(e) });
}

test('PC-01: página carregada → Ligado, sem tela de inicialização', () => {
  const e = nova(relogio());
  assert.equal(e.estado, 'ligado');
});

test('PC-02: Ligado; botão → Desligando por 1 s; depois Desligado', () => {
  const r = relogio(); const e = nova(r);
  e.botao();
  assert.equal(e.estado, 'desligando');
  r.avancar(999); assert.equal(e.estado, 'desligando');
  r.avancar(1); assert.equal(e.estado, 'desligado');
});

test('PC-03: Desligado; botão → Iniciando por 2,5 s; depois Ligado', () => {
  const r = relogio(); const e = nova(r);
  e.botao(); r.avancar(1000);
  e.botao();
  assert.equal(e.estado, 'iniciando');
  r.avancar(2499); assert.equal(e.estado, 'iniciando');
  r.avancar(1); assert.equal(e.estado, 'ligado');
});

test('PC-04: Iniciando; botão aos 1 s → ignorado; Ligado aos 2,5 s', () => {
  const r = relogio(); const e = nova(r);
  e.botao(); r.avancar(1000); e.botao();
  r.avancar(1000);
  assert.equal(e.botao(), false);
  r.avancar(1500);
  assert.equal(e.estado, 'ligado');
});

test('PC-05: 100 toques em 2 s → estado válido, no máximo um temporizador', () => {
  const r = relogio(); const e = nova(r);
  for (let i = 0; i < 100; i++) {
    e.botao();
    r.avancar(20);
    assert.ok(ESTADOS.includes(e.estado));
    assert.ok(r.ativos <= 1);
  }
});

test('PC-06/PC-07: cada mudança troca a geração (resposta antiga é descartável)', () => {
  const r = relogio(); const log = []; const e = nova(r, log);
  const g0 = e.geracao;
  e.desligarPeloMenu();
  assert.notEqual(e.geracao, g0);
  r.avancar(1000);
  e.botao(); r.avancar(2500);
  const geracoes = log.map((x) => x.geracao);
  assert.deepEqual(geracoes, [...new Set(geracoes)]);
});

test('PC-07: blecaute vai direto a Desligado, sem Desligando', () => {
  const r = relogio(); const log = []; const e = nova(r, log);
  e.blecaute(3000);
  assert.deepEqual(log.map((x) => x.estado), ['desligado']);
  assert.equal(r.ativos, 0);
});

test('PC-08: "Desligar" no menu = PC-02', () => {
  const r = relogio(); const e = nova(r);
  assert.equal(e.desligarPeloMenu(), true);
  assert.equal(e.estado, 'desligando');
  r.avancar(1000);
  assert.equal(e.estado, 'desligado');
  assert.equal(e.desligarPeloMenu(), false);
});

test('Blecaute durante Iniciando cancela o temporizador antigo', () => {
  const r = relogio(); const e = nova(r);
  e.botao(); r.avancar(1000); e.botao(); // iniciando
  e.blecaute(3000);
  r.avancar(5000);
  assert.equal(e.estado, 'desligado');
});

test('Invariante 6: 100.000 sequências aleatórias de 50 eventos', () => {
  let semente = 7;
  const rnd = () => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; };
  for (let s = 0; s < 100000; s++) {
    const r = relogio(); const e = nova(r);
    for (let i = 0; i < 50; i++) {
      const x = rnd();
      if (x < 0.45) e.botao();
      else if (x < 0.6) e.desligarPeloMenu();
      else if (x < 0.65) e.blecaute(3000);
      r.avancar(Math.floor(rnd() * 3000));
      assert.ok(ESTADOS.includes(e.estado));
      assert.ok(r.ativos <= 1);
      if (e.estado === 'ligado' || e.estado === 'desligado') assert.equal(r.ativos, 0);
    }
  }
});
