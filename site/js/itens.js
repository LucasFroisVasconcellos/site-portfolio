// Posição e tamanho de todas as áreas clicáveis (RNF-21: um único arquivo).
// Unidade: pixels da ilustração da parede (1024 × 572). x/y = canto superior esquerdo.

export const LARGURA_PAREDE = 1024;
export const ALTURA_PAREDE = 572;

// Ordem das paredes ao girar para a direita (seção 3.1).
export const PAREDES = Object.freeze([
  {
    id: 'frente',
    imagem: { leve: 'img/paredes/frente-leve.webp', nitido: 'img/paredes/frente-nitido.webp' },
    // Região que precisa caber na tela no enquadramento da parede inteira (seção 3.8).
    essencial: { x: 300, y: 250, w: 340, h: 270 },
  },
  {
    id: 'direita',
    imagem: { leve: 'img/paredes/direita-leve.webp', nitido: 'img/paredes/direita-nitido.webp' },
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
// tela: quadrilátero da tela na ilustração (sup. esq., sup. dir., inf. dir., inf. esq.).
export const ITENS = Object.freeze([
  {
    id: 'postits', parede: 'frente', tipo: 'foco', evento: 'abrir-postit',
    area: { x: 446, y: 265, w: 96, h: 40 },
    foco: { x: 430, y: 255, w: 130, h: 60 },
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
    telaQuad: [[381.5, 352], [429, 351.5], [432, 381.5], [384.5, 382]],
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

// Partes do gabinete que apagam com o PC desligado (as ventoinhas vermelhas).
export const VENTOINHAS = Object.freeze({ parede: 'frente', x: 383, y: 433, w: 23, h: 66 });

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
