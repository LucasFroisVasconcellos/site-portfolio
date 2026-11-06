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
    imagem: { leve: 'img/paredes/tras-leve-v1.webp', nitido: 'img/paredes/tras-nitido-v1.webp' },
    essencial: { x: 422, y: 228, w: 382, h: 92 }, // do quadro digital às medalhas
  },
  {
    id: 'esquerda',
    imagem: { leve: 'img/paredes/esquerda-leve-v1.webp', nitido: 'img/paredes/esquerda-nitido-v1.webp' },
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
    area: { x: 372, y: 344, w: 70, h: 53 },
    telaQuad: [[382.5, 351], [431.5, 351], [431.5, 382.5], [382.5, 382.5]],
    foco: { x: 381, y: 351, w: 52, h: 32 },
  },
  {
    id: 'energia', parede: 'frente', tipo: 'energia',
    area: { x: 368, y: 408, w: 58, h: 96 },
  },
  // Atalhos da parede do guarda-roupa: a mesa aparece de lado. Clicar faz o mesmo que na frente
  // (monitor e notebook: vira para a parede do PC e abre; gabinete: liga e desliga ali mesmo).
  // Ficam fora da região essencial: no celular estreito podem ficar fora da tela.
  // Post-its de lado: caixas dos post-its da frente levadas à lateral pela perspectiva do monitor
  // e recuadas até a parede (lateral.js, pontoNaLateral e RECUO_PAREDE).
  {
    id: 'postit-1-lado', parede: 'direita', tipo: 'atalho', atalho: 'postit-1',
    area: { x: 117.9, y: 251.8, w: 7.0, h: 16.8 },
  },
  {
    id: 'postit-2-lado', parede: 'direita', tipo: 'atalho', atalho: 'postit-2',
    area: { x: 125.9, y: 260.8, w: 6.8, h: 16.3 },
  },
  {
    id: 'postit-3-lado', parede: 'direita', tipo: 'atalho', atalho: 'postit-3',
    area: { x: 134.4, y: 250.0, w: 6.5, h: 16.1 },
  },
  {
    id: 'postit-4-lado', parede: 'direita', tipo: 'atalho', atalho: 'postit-4',
    area: { x: 143.5, y: 259.3, w: 6.2, h: 15.6 },
  },
  {
    id: 'monitor-lado', parede: 'direita', tipo: 'atalho', atalho: 'monitor',
    area: { x: 157, y: 290, w: 46, h: 70 },
  },
  {
    id: 'notebook-lado', parede: 'direita', tipo: 'atalho', atalho: 'notebook',
    area: { x: 121, y: 335, w: 32, h: 44 },
  },
  {
    id: 'energia-lado', parede: 'direita', tipo: 'energia', atalho: 'energia',
    area: { x: 201, y: 392, w: 27, h: 120 },
  },
  // Atalhos da parede da janela: a mesa aparece de lado, à direita (mesmo comportamento da
  // vista do guarda-roupa). O post-it 4 fica fora do desenho nesta vista, por isso não tem área.
  { id: 'postit-1-janela', parede: 'esquerda', tipo: 'atalho', atalho: 'postit-1', area: { x: 984.4, y: 284.5, w: 8.8, h: 17.0 } },
  { id: 'postit-2-janela', parede: 'esquerda', tipo: 'atalho', atalho: 'postit-2', area: { x: 995.0, y: 292.7, w: 9.3, h: 17.3 } },
  { id: 'postit-3-janela', parede: 'esquerda', tipo: 'atalho', atalho: 'postit-3', area: { x: 1007.5, y: 279.4, w: 9.9, h: 18.2 } },
  {
    id: 'monitor-janela', parede: 'esquerda', tipo: 'atalho', atalho: 'monitor',
    area: { x: 930, y: 323, w: 67, h: 82 },
  },
  {
    id: 'notebook-janela', parede: 'esquerda', tipo: 'atalho', atalho: 'notebook',
    area: { x: 873, y: 355, w: 56, h: 46 },
  },
  {
    id: 'energia-janela', parede: 'esquerda', tipo: 'energia', atalho: 'energia',
    area: { x: 817, y: 405, w: 28, h: 118 },
  },
  {
    // Quadro digital (objeto em objetos.js): a tela de fotos fica no vão da moldura.
    id: 'quadro', parede: 'tras', tipo: 'foco', evento: 'abrir-quadro', tela: 'quadro',
    area: { x: 428, y: 234.6, w: 72, h: 57.4 },
    telaQuad: [[438, 244.6], [490, 244.6], [490, 282.6], [438, 282.6]],
    foco: { x: 438, y: 244.6, w: 52, h: 38 },
  },
  {
    id: 'medalhas', parede: 'tras', tipo: 'foco', evento: 'abrir-medalha',
    area: { x: 722, y: 235, w: 76, h: 81 },
    foco: { x: 700, y: 226, w: 120, h: 98 },
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
