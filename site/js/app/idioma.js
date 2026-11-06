// Troca de idioma (RF-32): botões PT/EN, título da página e textos de todas as telas.

import { aplicarTextos } from '../i18n.js';

export function instalarIdioma(ctx) {
  const { i18n, medicao, armazenamento } = ctx;

  function marcarIdioma() {
    for (const b of document.querySelectorAll('[data-idioma]')) b.setAttribute('aria-pressed', String(b.dataset.idioma === i18n.idioma));
    document.documentElement.lang = i18n.idioma === 'pt' ? 'pt-BR' : 'en';
    document.title = i18n.t('site.titulo');
  }
  for (const b of document.querySelectorAll('[data-idioma]')) {
    b.addEventListener('click', () => {
      if (!i18n.trocar(b.dataset.idioma)) return;
      armazenamento.gravar('idioma', i18n.idioma);
      medicao.evento(`idioma-${i18n.idioma}`);
    });
  }
  // O texto do passeio não precisa de nada aqui: o próximo passo já vem no idioma novo.
  i18n.aoTrocar(() => {
    aplicarTextos(document, i18n);
    marcarIdioma();
    ctx.atualizarNomeParede();
    ctx.sistema.traduzir();
    ctx.notebook.traduzir();
    ctx.quadro.traduzir();
    ctx.medalhas.traduzir();
    if (ctx.menuAberto()) ctx.montarMenu();
    ctx.quarto.escreverPostits(i18n);
  });

  Object.assign(ctx, { marcarIdioma });
}
