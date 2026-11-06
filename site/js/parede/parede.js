// Parede de trás: quadro digital com fotos por ano (RF-30). A moldura é desenhada em objetos.js.

import { el, botao } from '../dom.js';

// Mesma proporção da tela do quadro no desenho da parede (52 × 38).
export const TELA_QUADRO = Object.freeze({ w: 960, h: 702 });
export const INTERVALO_QUADRO = 6000; // troca de foto, em ms

// Quadro digital: passa as fotos sozinho, como um de verdade, mesmo visto de longe na parede.
// Pausa com a aba oculta, com "reduzir movimento" ligado, pelo botão de pausa e no blecaute.
export function criarQuadro({ i18n, conteudo, janela = globalThis.window }) {
  const fotos = conteudo.fotos;
  let indice = fotos.length - 1; // Começa no ano mais recente.
  let carregado = false;
  let pausadoPeloUsuario = false;
  let apagado = false;
  let relogio = null;
  // Duas camadas de imagem para a troca suave (uma some enquanto a outra aparece).
  const camadas = [0, 1].map(() => el('img', { classe: 'quadro-img', attrs: { alt: '', width: 1200, height: 800, draggable: 'false' } }));
  let visivel = 0;
  const vazio = el('div', { classe: 'quadro-vazio' },
    el('span', { classe: 'quadro-vazio-titulo', dados: { i18n: 'quadro.titulo' } }),
    fotos.length ? null : el('span', { classe: 'quadro-vazio-texto', dados: { i18n: 'quadro.emBreve' } }));
  const varias = fotos.length > 1;
  const btnAnt = botao('‹', () => mover(-1), 'quadro-seta quadro-ant');
  const btnProx = botao('›', () => mover(1), 'quadro-seta quadro-prox');
  const btnPausa = botao('', () => { pausadoPeloUsuario = !pausadoPeloUsuario; agendar(); desenharPausa(); }, 'quadro-pausa');
  const ano = el('span', { classe: 'quadro-ano', attrs: { translate: 'no' } });
  // Sem fotos publicadas, o quadro mostra só o título: nada de imagem de marcação.
  const raiz = el('div', { classe: 'quadro' }, ...camadas, vazio, ano,
    varias ? btnAnt : null, varias ? btnProx : null, varias ? btnPausa : null);
  raiz.style.width = `${TELA_QUADRO.w}px`;
  raiz.style.height = `${TELA_QUADRO.h}px`;
  const legenda = el('div', { classe: 'quadro-legenda', attrs: { 'aria-live': 'polite' } });
  let aoMudar = () => {};

  const reduzMovimento = () => Boolean(janela?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const podePassar = () => varias && carregado && !pausadoPeloUsuario && !apagado && !reduzMovimento() && !janela?.document?.hidden;

  function agendar() {
    clearTimeout(relogio);
    relogio = podePassar() ? setTimeout(() => mover(1), INTERVALO_QUADRO) : null;
  }

  function desenharPausa() {
    const chave = pausadoPeloUsuario ? 'quadro.continuar' : 'quadro.pausar';
    btnPausa.textContent = pausadoPeloUsuario ? '▶' : '❚❚';
    btnPausa.setAttribute('aria-label', i18n.t(chave));
    btnPausa.setAttribute('aria-pressed', String(pausadoPeloUsuario));
  }

  function desenhar() {
    const f = fotos[indice];
    legenda.hidden = !f;
    if (!f) { aoMudar(); return; }
    if (carregado) {
      // A nova foto entra na camada escondida e as duas trocam de lugar (transição no CSS).
      const nova = camadas[1 - visivel];
      nova.src = f.arquivo;
      nova.alt = i18n.campo(f.legenda);
      camadas[visivel].classList.remove('visivel');
      nova.classList.add('visivel');
      camadas[visivel].alt = '';
      visivel = 1 - visivel;
      vazio.hidden = true;
    }
    ano.textContent = String(f.ano);
    legenda.textContent = '';
    legenda.append(...[ // append nativo escreveria "null" quando a foto não tem crédito
      el('strong', { texto: String(f.ano), attrs: { translate: 'no' } }),
      el('span', { texto: i18n.campo(f.legenda) }),
      f.credito ? el('span', { classe: 'quadro-credito', texto: i18n.t('quadro.credito', { nome: f.credito }) }) : null,
      el('span', { classe: 'quadro-contagem', texto: i18n.t('quadro.contagem', { i: indice + 1, n: fotos.length }) }),
    ].filter(Boolean));
    btnAnt.setAttribute('aria-label', i18n.t('quadro.anterior'));
    btnProx.setAttribute('aria-label', i18n.t('quadro.proxima'));
    desenharPausa();
    aoMudar();
  }

  // Passar a foto (pela pessoa ou pelo relógio) recomeça a contagem do zero.
  function mover(d) {
    if (!fotos.length) return;
    indice = (indice + d + fotos.length) % fotos.length;
    desenhar();
    agendar();
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
  janela?.document?.addEventListener('visibilitychange', agendar);
  janela?.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', agendar);

  // RNF-05: as fotos só carregam quando a parede do quadro aparece (ou o quadro abre).
  function carregar() {
    if (carregado) return;
    carregado = true;
    desenhar();
    agendar();
  }

  return {
    el: raiz,
    legenda,
    carregar,
    abrir() { carregar(); },
    mover,
    get passando() { return relogio !== null; },
    apagar(sim) { apagado = sim; raiz.classList.toggle('apagado', sim); agendar(); },
    traduzir() {
      for (const n of raiz.querySelectorAll('[data-i18n]')) n.textContent = i18n.t(n.dataset.i18n);
      desenhar();
    },
    aoMudar(fn) { aoMudar = fn; },
  };
}
