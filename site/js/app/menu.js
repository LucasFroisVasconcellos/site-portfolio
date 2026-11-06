// Menu "Ir para" (RF-06): lista todos os itens e leva até eles pelo teclado ou toque.

import { ITENS, indiceParede } from '../itens.js';
import { el } from '../dom.js';

export function instalarMenu(ctx) {
  const { $, i18n, quarto, estado } = ctx;
  const menu = $('menu-irpara');
  const btnMenu = $('btn-irpara');

  function montarMenu() {
    for (const b of menu.querySelectorAll('button')) b.remove();
    for (const item of ITENS) {
      const rotulo = item.tipo === 'energia'
        ? i18n.t(ctx.energia.estado === 'ligado' ? 'energia.desligar' : 'energia.ligar')
        : i18n.t(`item.${item.id}`);
      menu.insertBefore(el('button', {
        texto: rotulo, attrs: { type: 'button', role: 'menuitem' },
        on: { click: () => irParaItem(item) },
      }), menu.querySelector('.menu-paginas'));
    }
  }
  function abrirMenu() {
    montarMenu();
    menu.hidden = false;
    btnMenu.setAttribute('aria-expanded', 'true');
    menu.querySelector('button')?.focus();
  }
  function fecharMenu(devolverFoco = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    btnMenu.setAttribute('aria-expanded', 'false');
    if (devolverFoco) btnMenu.focus();
  }
  const menuAberto = () => !menu.hidden;

  btnMenu.addEventListener('click', (e) => { e.stopPropagation(); if (menu.hidden) abrirMenu(); else fecharMenu(); });
  menu.addEventListener('keydown', (e) => {
    const itens = [...menu.querySelectorAll('button, a')];
    const i = itens.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); itens[(i + 1) % itens.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); itens[(i - 1 + itens.length) % itens.length].focus(); }
    if (e.key === 'Escape') { e.stopPropagation(); fecharMenu(true); }
    if (e.key === 'Tab' && ((e.shiftKey && i === 0) || (!e.shiftKey && i === itens.length - 1))) fecharMenu();
  });
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && e.target !== btnMenu && !btnMenu.contains(e.target)) fecharMenu(); });

  async function irParaItem(item) {
    fecharMenu();
    if (estado.modo === 'passeio') return;
    if (estado.modo === 'foco') await ctx.voltar();
    if (quarto.parede !== item.parede) {
      const d = (indiceParede(item.parede) - indiceParede(quarto.parede) + 4) % 4 === 3 ? -1 : 1;
      const p = quarto.irParaParede(item.parede, d);
      ctx.atualizarNomeParede();
      await p;
    }
    if (item.tipo === 'energia') { ctx.apertarEnergia(); quarto.botao('energia')?.focus(); ctx.reavaliarBlecaute(); return; }
    await ctx.focar(item);
  }

  Object.assign(ctx, { montarMenu, fecharMenu, menuAberto });
}
