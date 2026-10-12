// Casos BL-01 a BL-12 (ARQ-002, seção 10.2), com relógio simulado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarBlecaute } from '../site/js/blecaute.js';
import { criarEnergia } from '../site/js/pc/energia.js';

// Simula o laço da página: verifica a cada 100 ms e devolve o instante do disparo.
function simular({ ate, condicoes = () => true, eventos = [] }) {
  const b = criarBlecaute({ t1: 10000, t2: 20000 });
  const fila = [...eventos].sort((a, c) => a.t - c.t);
  let disparos = [];
  let ultimaCond = null;
  for (let t = 0; t <= ate; t += 100) {
    const ok = condicoes(t);
    if (ok !== ultimaCond) { b.condicoes(ok, t); ultimaCond = ok; }
    while (fila.length && fila[0].t <= t) {
      const e = fila.shift();
      b.entrada(e.tipo, e.t);
    }
    if (b.verificar(t)) disparos.push(t);
  }
  return disparos;
}

test('BL-01: nenhuma entrada → blecaute aos 10,0 s', () => {
  assert.deepEqual(simular({ ate: 30000 }), [10000]);
});

test('BL-02: só mouse a cada 2 s → nada aos 10 s, blecaute aos 20,0 s', () => {
  const eventos = [];
  for (let t = 2000; t <= 40000; t += 2000) eventos.push({ t, tipo: 'movimento' });
  assert.deepEqual(simular({ ate: 40000, eventos }), [20000]);
});

test('BL-03: um clique aos 8 s → blecaute aos 18,0 s', () => {
  assert.deepEqual(simular({ ate: 40000, eventos: [{ t: 8000, tipo: 'acao' }] }), [18000]);
});

test('BL-04: mouse contínuo e um clique aos 15 s → blecaute aos 35,0 s', () => {
  const eventos = [{ t: 15000, tipo: 'acao' }];
  for (let t = 0; t <= 60000; t += 100) eventos.push({ t, tipo: 'movimento' });
  assert.deepEqual(simular({ ate: 60000, eventos }), [35000]);
});

test('BL-05: aba oculta dos 5 s aos 60 s → blecaute aos 70,0 s', () => {
  assert.deepEqual(simular({ ate: 90000, condicoes: (t) => t < 5000 || t >= 60000 }), [70000]);
});

test('BL-06: passeio até os 14 s, sem entrada → blecaute aos 24,0 s', () => {
  assert.deepEqual(simular({ ate: 60000, condicoes: (t) => t >= 14000 }), [24000]);
});

test('BL-07: foco no monitor até os 60 s → blecaute aos 70,0 s', () => {
  assert.deepEqual(simular({ ate: 90000, condicoes: (t) => t >= 60000 }), [70000]);
});

test('BL-08: parede de trás por 60 s → nenhum blecaute; ao voltar, conta do zero', () => {
  assert.deepEqual(simular({ ate: 60000, condicoes: () => false }), []);
  assert.deepEqual(simular({ ate: 90000, condicoes: (t) => t >= 60000 }), [70000]);
});

test('BL-09: depois do blecaute, mais 200 s sem entrada → nenhum segundo blecaute', () => {
  assert.deepEqual(simular({ ate: 210000 }), [10000]);
});

test('BL-10: página recarregada → pode ocorrer de novo (instância nova)', () => {
  assert.deepEqual(simular({ ate: 15000 }), [10000]);
  assert.deepEqual(simular({ ate: 15000 }), [10000]);
});

test('BL-11: PC desligado à mão, 10 s sem entrada → blecaute ocorre', () => {
  let t = 0;
  const energia = criarEnergia({ agora: () => t, agendar: () => 1, cancelar: () => {} });
  energia.botao(); // desligando
  const b = criarBlecaute();
  b.condicoes(true, 0);
  t = 10000;
  assert.equal(b.verificar(t), true);
  energia.blecaute(3000);
  assert.equal(energia.estado, 'desligado');
});

test('BL-12: botão 1 s após o início é ignorado; aos 3,1 s liga', () => {
  let t = 10000;
  const timers = [];
  const energia = criarEnergia({
    agora: () => t,
    agendar: (fn, ms) => { timers.push({ fn, em: t + ms }); return timers.length; },
    cancelar: () => {},
  });
  energia.blecaute(3000);
  t = 11000;
  assert.equal(energia.botao(), false);
  assert.equal(energia.estado, 'desligado');
  t = 13100;
  assert.equal(energia.botao(), true);
  assert.equal(energia.estado, 'iniciando');
});

test('Invariante 5: 100.000 sequências aleatórias nunca disparam duas vezes', () => {
  let semente = 42;
  const rnd = () => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; };
  for (let s = 0; s < 100000; s++) {
    const b = criarBlecaute();
    let t = 0;
    let disparos = 0;
    for (let i = 0; i < 50; i++) {
      t += Math.floor(rnd() * 8000);
      const r = rnd();
      if (r < 0.2) b.condicoes(rnd() < 0.7, t);
      else if (r < 0.5) b.entrada('movimento', t);
      else if (r < 0.7) b.entrada('acao', t);
      if (b.verificar(t)) disparos += 1;
      const prox = b.proximoDisparo();
      if (prox !== null) assert.ok(prox <= t + 20000);
    }
    assert.ok(disparos <= 1);
  }
});
