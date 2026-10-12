// Passeio inicial (ARQ-002, seção 3.2): 7 passos, 14 segundos, sempre pulável.

import { itemPorId } from './itens.js';

export const PASSOS = Object.freeze([
  { acao: 'inicial', texto: 'passeio.bemvindo', ms: 2000 },
  { acao: 'parada', texto: 'passeio.setas', ms: 2000, realce: 'setas' },
  { acao: 'espiar', item: 'postits', texto: 'passeio.brilho', ms: 2000 },
  { acao: 'espiar', item: 'monitor', texto: 'passeio.pc', ms: 2000 },
  { acao: 'espiar', item: 'notebook', texto: 'passeio.notebook', ms: 2000 },
  { acao: 'parede', parede: 'tras', texto: 'passeio.tras', ms: 3000 },
  { acao: 'volta', texto: null, ms: 1000 },
]);

export const DURACAO_TOTAL = PASSOS.reduce((t, p) => t + p.ms, 0);

// cena: { inicial(), espiar(item), parede(id), volta(), texto(chave|null), realce(qual|null) }
export function criarPasseio({ cena, agendar = setTimeout, cancelar = clearTimeout, aoTerminar }) {
  let geracao = 0;
  let temporizador = null;
  let rodando = false;

  function encerrar(pulado) {
    if (!rodando) return;
    rodando = false;
    geracao += 1;
    if (temporizador !== null) { cancelar(temporizador); temporizador = null; }
    cena.texto(null);
    cena.realce(null);
    aoTerminar(pulado);
  }

  function passo(i, minha) {
    if (minha !== geracao || !rodando) return;
    if (i >= PASSOS.length) { encerrar(false); return; }
    const p = PASSOS[i];
    cena.texto(p.texto);
    cena.realce(p.realce ?? null);
    if (p.acao === 'inicial') cena.inicial();
    else if (p.acao === 'espiar') cena.espiar(itemPorId(p.item));
    else if (p.acao === 'parede') cena.parede(p.parede);
    else if (p.acao === 'volta') cena.volta();
    temporizador = agendar(() => { temporizador = null; passo(i + 1, minha); }, p.ms);
  }

  return {
    get rodando() { return rodando; },
    iniciar() {
      if (rodando) encerrar(true);
      rodando = true;
      geracao += 1;
      passo(0, geracao);
    },
    pular() { encerrar(true); },
  };
}
