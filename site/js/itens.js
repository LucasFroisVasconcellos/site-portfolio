// Posição e tamanho de todas as áreas clicáveis (RNF-21: um único arquivo).
// Unidade: pixels da ilustração da parede (1024 × 572). x/y = canto superior esquerdo.

export const LARGURA_PAREDE = 1024;
export const ALTURA_PAREDE = 572;

// Ordem das paredes ao girar para a direita (seção 3.1).
export const PAREDES = Object.freeze([
  {
    id: 'frente',
    imagem: { leve: 'img/paredes/frente-leve-v3.webp', nitido: 'img/paredes/frente-nitido-v3.webp' },
    // Região que precisa caber na tela no enquadramento da parede inteira (seção 3.8).
    essencial: { x: 300, y: 250, w: 340, h: 270 },
  },
  {
    id: 'direita',
    imagem: { leve: 'img/paredes/direita-leve-v2.webp', nitido: 'img/paredes/direita-nitido-v2.webp' },
    essencial: { x: 470, y: 120, w: 420, h: 380 },
  },
  {
    id: 'tras',
    provisoria: true,
    imagem: { nitido: 'img/paredes/tras-provisoria.svg' },
    essencial: { x: 255, y: 170, w: 535, h: 180 },
  },
  {
    id: 'esquerda',
    provisoria: true,
    imagem: { nitido: 'img/paredes/esquerda-provisoria.svg' },
    essencial: { x: 360, y: 160, w: 260, h: 220 },
  },
]);

export const PAREDE_INICIAL = 'frente';

// tipo: o que acontece ao clicar. foco: área enquadrada no modo Foco.
// postit: número do post-it (desenhado em objetos.js, com o texto escrito nele; o clique aproxima a câmera).
// tela: quadrilátero da tela na ilustração (sup. esq., sup. dir., inf. dir., inf. esq.).
export const ITENS = Object.freeze([
  {
    id: 'postit-1', parede: 'frente', tipo: 'foco', evento: 'abrir-postit', postit: 1,
    area: { x: 452, y: 273, w: 17.5, h: 17.5 },
    foco: { x: 451, y: 272, w: 19.5, h: 19.5 },
  },
  {
    id: 'postit-2', parede: 'frente', tipo: 'foco', evento: 'abrir-postit', postit: 2,
    area: { x: 471.5, y: 281, w: 17.5, h: 17.5 },
    foco: { x: 470.5, y: 280, w: 19.5, h: 19.5 },
  },
  {
    id: 'postit-3', parede: 'frente', tipo: 'foco', evento: 'abrir-postit', postit: 3,
    area: { x: 493, y: 270, w: 17.5, h: 17.5 },
    foco: { x: 492, y: 269, w: 19.5, h: 19.5 },
  },
  {
    id: 'postit-4', parede: 'frente', tipo: 'foco', evento: 'abrir-postit', postit: 4,
    area: { x: 517, y: 278.5, w: 17.5, h: 17.5 },
    foco: { x: 516, y: 277.5, w: 19.5, h: 19.5 },
  },
  {
    id: 'monitor', parede: 'frente', tipo: 'foco', evento: 'abrir-pc', tela: 'pc',
    area: { x: 449, y: 309, w: 101, h: 64 },
    telaQuad: [[454, 314], [545, 314], [545, 368], [454, 368]],
    foco: { x: 454, y: 314, w: 91, h: 54 },
  },
  {
    id: 'notebook', parede: 'frente', tipo: 'foco', evento: 'abrir-notebook', tela: 'notebook',
    area: { x: 374, y: 344, w: 74, h: 50 },
    telaQuad: [[382.5, 351], [431.5, 351], [431.5, 382.5], [382.5, 382.5]],
    foco: { x: 381, y: 351, w: 52, h: 32 },
  },
  {
    id: 'energia', parede: 'frente', tipo: 'energia',
    area: { x: 368, y: 408, w: 58, h: 96 },
  },
  {
    id: 'quadro', parede: 'tras', tipo: 'foco', evento: 'abrir-quadro', tela: 'quadro',
    area: { x: 266, y: 176, w: 254, h: 164 },
    telaQuad: [[272, 182], [514, 182], [514, 334], [272, 334]],
    foco: { x: 272, y: 182, w: 242, h: 152 },
  },
  {
    id: 'medalhas', parede: 'tras', tipo: 'foco', evento: 'abrir-medalha',
    area: { x: 578, y: 194, w: 204, h: 102 },
    foco: { x: 560, y: 180, w: 240, h: 130 },
  },
]);


export function itemPorId(id) {
  return ITENS.find((i) => i.id === id) ?? null;
}

export function itensDaParede(paredeId) {
  return ITENS.filter((i) => i.parede === paredeId);
}

export function indiceParede(id) {
  return PAREDES.findIndex((p) => p.id === id);
}

export function paredeVizinha(id, direcao) {
  const i = indiceParede(id);
  if (i < 0) return PAREDE_INICIAL;
  const n = PAREDES.length;
  return PAREDES[(i + (direcao > 0 ? 1 : -1) + n) % n].id;
}
