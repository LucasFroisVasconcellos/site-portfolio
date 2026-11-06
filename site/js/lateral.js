// Mesa vista de lado (paredes do guarda-roupa e da janela): espelho ao vivo das telas da frente
// e post-its.
// Tudo em perspectiva pela mesma homografia das telas da frente: um retângulo em HTML levado
// aos quatro cantos medidos em cada desenho lateral.

import { matrizTela, matrix3dCSS } from './geometria.js';
import { criarPostitsSvg, POSTITS_REGIAO } from './objetos.js';

// Tela do monitor na frente (telaQuad do item monitor): base para levar os post-its às laterais.
const MONITOR_FRENTE = { x: 454, y: 314, w: 91, h: 54 };

// As duas paredes onde a mesa aparece de lado. Cantos das telas (sup. esq., sup. dir., inf. dir.,
// inf. esq.) medidos nos desenhos direita-nitido-v2 e esquerda-nitido-v1.
// recuo: a tela do monitor é paralela à parede da mesa; nas laterais a câmera olha para uma
// parede perpendicular a ela, então "para trás, até a parede da mesa" é um deslocamento só na
// horizontal da imagem, sem mudar o tamanho. Guarda-roupa: a parede da mesa está à esquerda
// (recuo negativo). Janela: está à direita, e o monitor aparece 13% maior (46 × 1,13 ≈ 52).
export const VISTAS_LATERAIS = Object.freeze({
  direita: {
    monitor: [[164.6, 294.6], [199.4, 293.4], [199.4, 345.8], [164.6, 352.4]],
    notebook: [[127.3, 342], [139, 338.8], [149.4, 371], [136.2, 374.4]],
    recuo: -46,
  },
  esquerda: {
    monitor: [[933.2, 327.6], [989, 330.6], [989, 397.4], [933.2, 385.2]],
    notebook: [[882.7, 359.7], [925.4, 363.2], [919.2, 395.5], [877.3, 390.8]],
    recuo: 52,
  },
});
export const QUAD_MONITOR_LADO = VISTAS_LATERAIS.direita.monitor;
export const QUAD_NOTEBOOK_LADO = VISTAS_LATERAIS.direita.notebook;

// Ponto da parede da frente → ponto da vista lateral: perspectiva do monitor + recuo até a parede.
const conversores = Object.fromEntries(Object.entries(VISTAS_LATERAIS).map(([id, v]) =>
  [id, matrizTela(MONITOR_FRENTE.w, MONITOR_FRENTE.h, v.monitor).aplicar]));
export function pontoNaLateral(x, y, vista = 'direita') {
  const [X, Y] = conversores[vista](x - MONITOR_FRENTE.x, y - MONITOR_FRENTE.y);
  return [X + VISTAS_LATERAIS[vista].recuo, Y];
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
  const vista = VISTAS_LATERAIS[paredeId];
  if (!vista) return null;
  const ponto = (x, y) => pontoNaLateral(x, y, paredeId);
  const camada = caixa('telas-laterais');
  camada.setAttribute('aria-hidden', 'true');
  camada.inert = true;

  // Post-its: o mesmo desenho da frente (com o texto), levado ao plano da lateral.
  const R = POSTITS_REGIAO;
  const postits = caixa('lado-postits');
  const svgPostits = criarPostitsSvg(`-${paredeId}`, R);
  postits.append(svgPostits);
  encaixar(postits, R.w, R.h, [ponto(R.x, R.y), ponto(R.x + R.w, R.y), ponto(R.x + R.w, R.y + R.h), ponto(R.x, R.y + R.h)]);

  const espelhos = {
    pc: { el: caixa('lado-tela lado-pc'), quad: vista.monitor },
    notebook: { el: caixa('lado-tela lado-nb'), quad: vista.notebook },
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
