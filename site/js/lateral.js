// Mesa vista de lado (parede do guarda-roupa): espelho ao vivo das telas da frente e post-its.
// Tudo em perspectiva pela mesma homografia das telas da frente: um retângulo em HTML levado
// aos quatro cantos medidos no desenho lateral (direita-nitido-v2).

import { matrizTela, matrix3dCSS } from './geometria.js';
import { criarPostitsSvg, POSTITS_REGIAO } from './objetos.js';

// Cantos (sup. esq., sup. dir., inf. dir., inf. esq.) das telas no desenho lateral.
export const QUAD_MONITOR_LADO = [[164.6, 294.6], [199.4, 293.4], [199.4, 345.8], [164.6, 352.4]];
export const QUAD_NOTEBOOK_LADO = [[127.3, 342], [139, 338.8], [149.4, 371], [136.2, 374.4]];

// Tela do monitor na frente (telaQuad do item monitor): base para levar os post-its à lateral.
const MONITOR_FRENTE = { x: 454, y: 314, w: 91, h: 54 };

// Ponto da parede da frente → ponto da lateral, pela perspectiva do monitor (os post-its estão
// no mesmo plano, logo acima dele).
const { aplicar: frenteParaLado } = matrizTela(MONITOR_FRENTE.w, MONITOR_FRENTE.h, QUAD_MONITOR_LADO);
export function pontoNaLateral(x, y) {
  return frenteParaLado(x - MONITOR_FRENTE.x, y - MONITOR_FRENTE.y);
}

function caixa(classe) {
  const e = document.createElement('div');
  e.className = classe;
  return e;
}

function encaixar(e, w, h, quad) {
  e.style.width = `${w}px`;
  e.style.height = `${h}px`;
  e.style.transform = matrix3dCSS(matrizTela(w, h, quad).matriz);
}

export function criarTelasLaterais(paredeId) {
  if (paredeId !== 'direita') return null;
  const camada = caixa('telas-laterais');
  camada.setAttribute('aria-hidden', 'true');
  camada.inert = true;

  // Post-its: o mesmo desenho da frente (com o texto), levado ao plano da lateral.
  const R = POSTITS_REGIAO;
  const postits = caixa('lado-postits');
  const svgPostits = criarPostitsSvg('-lado', R);
  postits.append(svgPostits);
  encaixar(postits, R.w, R.h, [
    pontoNaLateral(R.x, R.y), pontoNaLateral(R.x + R.w, R.y),
    pontoNaLateral(R.x + R.w, R.y + R.h), pontoNaLateral(R.x, R.y + R.h),
  ]);

  const espelhos = {
    pc: { el: caixa('lado-tela lado-pc'), quad: QUAD_MONITOR_LADO },
    notebook: { el: caixa('lado-tela lado-nb'), quad: QUAD_NOTEBOOK_LADO },
  };
  camada.append(postits, espelhos.pc.el, espelhos.notebook.el);
  return { camada, espelhos, svgPostits };
}

// Copia a tela da frente para o espelho: mesmo conteúdo, mesmas janelas, mesma rolagem.
// A cópia é inerte e escondida dos leitores de tela (a tela de verdade é a da frente).
export function espelhar(espelho, fonte, w, h) {
  const copia = fonte.cloneNode(true);
  for (const e of [copia, ...copia.querySelectorAll('[id]')]) e.removeAttribute('id');
  for (const img of copia.querySelectorAll('img[loading]')) img.removeAttribute('loading');
  espelho.el.replaceChildren(copia);
  encaixar(espelho.el, w, h, espelho.quad);
  // Rolagem e texto digitado não vêm no clone: copia elemento a elemento.
  const de = fonte.querySelectorAll('*');
  const para = copia.querySelectorAll('*');
  for (let i = 0; i < de.length && i < para.length; i++) {
    if (de[i].scrollTop || de[i].scrollLeft) { para[i].scrollTop = de[i].scrollTop; para[i].scrollLeft = de[i].scrollLeft; }
    if (de[i].tagName === 'TEXTAREA' || de[i].tagName === 'INPUT') para[i].value = de[i].value;
  }
}
