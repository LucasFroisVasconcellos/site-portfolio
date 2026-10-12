// Parede: post-its (RF-29) e quadro digital com fotos por ano (RF-30).

import { el, botao } from '../dom.js';

const CORES_POSTIT = ['#FEF08A', '#F9A8D4', '#86EFAC', '#93C5FD'];

export function desenharPostits(i18n) {
  const lista = el('div', { classe: 'postits-foco', attrs: { role: 'list' } });
  for (let i = 1; i <= 4; i++) {
    lista.append(el('article', { classe: 'postit', attrs: { role: 'listitem', tabindex: '0' }, estilo: { background: CORES_POSTIT[i - 1], '--giro': `${[-2.5, 1.8, -1.2, 2.2][i - 1]}deg` } },
      el('h2', { texto: i18n.t(`postit.${i}.titulo`) }),
      el('p', { texto: i18n.t(`postit.${i}.texto`) })));
  }
  return el('div', { classe: 'postits-camada' }, lista, el('p', { classe: 'postits-nota', texto: i18n.t('postit.rascunho') }));
}

export const TELA_QUADRO = Object.freeze({ w: 960, h: 600 });

export function criarQuadro({ i18n, conteudo }) {
  const fotos = conteudo.fotos;
  let indice = fotos.length - 1; // Começa no ano mais recente.
  let carregado = false;
  const img = el('img', { classe: 'quadro-img', attrs: { alt: '', width: 1200, height: 800, draggable: 'false' } });
  const vazio = el('div', { classe: 'quadro-vazio' }, el('span', { dados: { i18n: 'quadro.titulo' } }));
  const btnAnt = botao('‹', () => mover(-1), 'quadro-seta quadro-ant');
  const btnProx = botao('›', () => mover(1), 'quadro-seta quadro-prox');
  const ano = el('span', { classe: 'quadro-ano', attrs: { translate: 'no' } });
  const raiz = el('div', { classe: 'quadro' }, img, vazio, ano, btnAnt, btnProx);
  raiz.style.width = `${TELA_QUADRO.w}px`;
  raiz.style.height = `${TELA_QUADRO.h}px`;
  const legenda = el('div', { classe: 'quadro-legenda', attrs: { 'aria-live': 'polite' } });
  let aoMudar = () => {};

  function desenhar() {
    const f = fotos[indice];
    if (!f) return;
    if (carregado) {
      img.src = f.arquivo; // RNF-05: a foto só carrega quando o item abre.
      img.alt = i18n.campo(f.legenda);
      vazio.hidden = true;
    }
    ano.textContent = String(f.ano);
    legenda.textContent = '';
    legenda.append(
      el('strong', { texto: String(f.ano), attrs: { translate: 'no' } }),
      el('span', { texto: i18n.campo(f.legenda) }),
      el('span', { classe: 'quadro-credito', texto: i18n.t('quadro.credito', { nome: f.credito }) }),
      el('span', { classe: 'quadro-contagem', texto: i18n.t('quadro.contagem', { i: indice + 1, n: fotos.length }) }));
    btnAnt.setAttribute('aria-label', i18n.t('quadro.anterior'));
    btnProx.setAttribute('aria-label', i18n.t('quadro.proxima'));
    aoMudar();
  }

  function mover(d) {
    if (!fotos.length) return;
    indice = (indice + d + fotos.length) % fotos.length;
    desenhar();
  }

  // Arrastar o dedo ou o mouse passa as fotos.
  let toque = null;
  raiz.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) toque = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  raiz.addEventListener('pointerup', (e) => {
    if (!toque || toque.id !== e.pointerId) return;
    const dx = e.clientX - toque.x; const dy = e.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) mover(dx < 0 ? 1 : -1);
  });
  raiz.addEventListener('pointercancel', () => { toque = null; });

  return {
    el: raiz,
    legenda,
    abrir() { carregado = true; desenhar(); },
    mover,
    apagar(sim) { raiz.classList.toggle('apagado', sim); },
    traduzir() {
      for (const n of raiz.querySelectorAll('[data-i18n]')) n.textContent = i18n.t(n.dataset.i18n);
      desenhar();
    },
    aoMudar(fn) { aoMudar = fn; },
  };
}
