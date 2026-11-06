// Liga a regra do blecaute (blecaute.js) ao quarto: entradas do visitante, luzes, PC
// e o aviso "Ligue o PC" com a seta (seção 3.3 e RF-13).

import { itemPorId } from '../itens.js';
import { criarBlecaute } from '../blecaute.js';

export function instalarBlecaute(ctx) {
  const { $, L, quarto, estado } = ctx;
  const blecaute = criarBlecaute({ t1: L.blecauteT1Ms, t2: L.blecauteT2Ms });
  let timerBlecaute = null;
  const agora = () => performance.now();

  function condicoesBlecaute() {
    return estado.modo === 'quarto' && estado.passeioAcabou && quarto.parede === 'frente' && document.visibilityState === 'visible';
  }
  function agendarBlecaute() {
    clearTimeout(timerBlecaute);
    const hora = blecaute.proximoDisparo();
    if (hora === null) return;
    timerBlecaute = setTimeout(() => {
      if (blecaute.verificar(agora())) executarBlecaute(); else agendarBlecaute();
    }, Math.max(0, hora - agora()) + 5);
  }
  function reavaliarBlecaute() {
    blecaute.condicoes(condicoesBlecaute(), agora());
    agendarBlecaute();
  }
  function entrada(tipo) {
    blecaute.entrada(tipo, agora());
  }
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') entrada('movimento'); }, { passive: true });
  window.addEventListener('pointerdown', () => entrada('acao'), { passive: true, capture: true });
  window.addEventListener('keydown', () => entrada('acao'), { capture: true });
  window.addEventListener('wheel', () => entrada('acao'), { passive: true });
  document.addEventListener('visibilitychange', () => reavaliarBlecaute());

  function executarBlecaute() {
    clearTimeout(timerBlecaute);
    estado.emBlecaute = true;
    ctx.energia.blecaute(L.blecauteDuracaoMs); // PC direto para Desligado; botão travado por 3 s.
    ctx.quadro.apagar(true);
    quarto.luz(0.9, 700);
    setTimeout(() => { quarto.luz(0, 1000); ctx.quadro.apagar(false); }, 2000);
    setTimeout(() => {
      estado.emBlecaute = false;
      if (ctx.energia.estado === 'desligado') mostrarLigue();
    }, L.blecauteDuracaoMs);
  }

  // ---------- Aviso "Ligue o PC" (RF-13) ----------
  function mostrarLigue() {
    estado.avisoLigue = true;
    $('aviso-ligue').hidden = false;
    atualizarSetaLigue();
  }
  function esconderLigue() {
    estado.avisoLigue = false;
    $('aviso-ligue').hidden = true;
    $('seta-ligue').hidden = true;
  }
  function atualizarSetaLigue() {
    const seta = $('seta-ligue');
    if (!estado.avisoLigue || estado.modo !== 'quarto' || quarto.parede !== 'frente' || quarto.girando) { seta.hidden = true; return; }
    const pos = quarto.posicaoNaTela(itemPorId('energia'));
    if (!pos) { seta.hidden = true; return; }
    seta.style.left = `${pos.x}px`;
    seta.style.top = `${pos.y - 6}px`;
    seta.hidden = false;
  }

  Object.assign(ctx, { reavaliarBlecaute, esconderLigue, atualizarSetaLigue });
}
