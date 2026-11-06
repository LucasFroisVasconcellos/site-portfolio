// Telas do monitor e do notebook vistas de lado (parede do guarda-roupa).
// Mostram o mesmo que a frente, em perspectiva: cada tela é um retângulo em HTML levado aos
// quatro cantos medidos no desenho lateral pela mesma homografia das telas da frente.
// O monitor segue o estado do PC da frente (data-estado na camada, posto por quarto.estadoPc).

import { matrizTela, matrix3dCSS } from './geometria.js';

// Cantos (sup. esq., sup. dir., inf. dir., inf. esq.) medidos na ilustração direita-nitido-v2.
export const QUAD_MONITOR_LADO = [[164.6, 294.6], [199.4, 293.4], [199.4, 345.8], [164.6, 352.4]];
export const QUAD_NOTEBOOK_LADO = [[127.3, 342], [139, 338.8], [149.4, 371], [136.2, 374.4]];

// Tamanho do retângulo em HTML antes da perspectiva (mesma proporção das telas da frente).
const W = 320;
const H = 200;

function no(tag, classe, filhos = []) {
  const e = document.createElement(tag);
  e.className = classe;
  e.append(...filhos);
  return e;
}

function encaixar(e, quad) {
  e.style.width = `${W}px`;
  e.style.height = `${H}px`;
  e.style.transform = matrix3dCSS(matrizTela(W, H, quad).matriz);
}

function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function criarTelasLaterais(paredeId) {
  if (paredeId !== 'direita') return null;
  const camada = no('div', 'telas-laterais');
  camada.dataset.estado = 'ligado';
  camada.setAttribute('aria-hidden', 'true');

  // Monitor: papel de parede do FroisOS e a barra de tarefas de papel.
  const fundo = document.createElement('img');
  fundo.src = 'img/fundos/frois-os-v1.webp';
  fundo.alt = '';
  fundo.decoding = 'async';
  fundo.draggable = false;
  const monitor = no('div', 'lado-tela lado-pc', [no('div', 'lado-pc-boot'), fundo, no('div', 'lado-pc-barra', [no('span', 'lado-pc-menu')])]);
  encaixar(monitor, QUAD_MONITOR_LADO);

  // Notebook: tela inicial com relógio e os três apps.
  const relogio = no('p', 'lado-nb-hora');
  relogio.textContent = horaAgora();
  const apps = no('div', 'lado-nb-apps', ['wa', 'ig', 'li'].map((a) => no('span', `lado-nb-app lado-nb-${a}`)));
  const notebook = no('div', 'lado-tela lado-nb', [relogio, apps, no('div', 'lado-nb-doca')]);
  encaixar(notebook, QUAD_NOTEBOOK_LADO);
  setInterval(() => { relogio.textContent = horaAgora(); }, 30000);

  camada.append(monitor, notebook);
  return camada;
}
