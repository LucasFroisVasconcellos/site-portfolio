// Atalhos de teclado (RNF-13) e gestos de toque: deslizar troca de parede, pinça amplia as telas.

import { instalarGestos, limitarZoom, limitarDeslocamento } from '../gestos.js';

export function instalarTecladoEGestos(ctx) {
  const { $, quarto, estado } = ctx;

  window.addEventListener('keydown', (e) => {
    const digitando = e.target instanceof HTMLElement && (e.target.matches('input, textarea, [contenteditable]'));
    if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); ctx.alternarFps(); return; }
    if (e.key === 'Escape') {
      if (ctx.menuAberto()) { ctx.fecharMenu(true); return; }
      if (!$('aviso-gire').hidden) { estado.continuarEmPe = true; ctx.atualizarAvisoGire(); return; }
      if (estado.modo === 'foco') { e.preventDefault(); ctx.voltar(); }
      return;
    }
    if (digitando) return;
    if (estado.modo === 'quarto' && !ctx.menuAberto() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      ctx.girar(e.key === 'ArrowRight' ? 1 : -1);
    }
  });

  instalarGestos($('palco'), {
    podeDeslizar: () => estado.modo === 'quarto',
    aoDeslizar: (d) => ctx.girar(d),
    podePincar: () => estado.modo === 'foco' && Boolean(estado.itemEmFoco?.tela),
    aoPincar: (fase, g) => {
      if (fase === 'inicio') return quarto.extra;
      const z = limitarZoom(g.base.z * g.fator);
      // O ponto da tela sob os dedos no início continua sob os dedos.
      const ex = g.mx - z * (g.m0x - g.base.ex) / g.base.z;
      const ey = g.my - z * (g.m0y - g.base.ey) / g.base.z;
      const lim = limitarDeslocamento(z, ex, ey, window.innerWidth, window.innerHeight);
      quarto.definirExtra({ z, ...lim });
      return null;
    },
    aoToqueDuplo: () => { if (estado.modo === 'foco') quarto.definirExtra({ z: 1, ex: 0, ey: 0 }); },
  });
}
