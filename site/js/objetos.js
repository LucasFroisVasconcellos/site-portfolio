// Objetos da parede do PC feitos em código (SVG), no lugar do desenho: post-its, monitor,
// notebook e gabinete. Em SVG o modo escuro do navegador não muda as cores. Coordenadas em unidades da parede (1024 × 572), copiadas da ilustração.
// Ficam numa camada abaixo das telas em HTML; o clique é dos botões de quarto.js.

const NS = 'http://www.w3.org/2000/svg';
const TINTA = '#1A1A1A';

function svg(tag, attrs = {}, filhos = []) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  for (const f of filhos) e.append(f);
  return e;
}

// Post-its no tamanho e na posição do desenho original. O texto inteiro fica escrito neles
// (pequeno na parede); ao clicar, a câmera aproxima até dar para ler.
export const POSTITS = Object.freeze([
  { n: 1, x: 453.5, y: 274.5, giro: -4, cor: '#FFF06A', cola: '#EBDA4C' },
  { n: 2, x: 473, y: 282.5, giro: 3, cor: '#FF9DC9', cola: '#EE86B5' },
  { n: 3, x: 494.5, y: 271.5, giro: -3, cor: '#B5EE7C', cola: '#9FDB62' },
  { n: 4, x: 518.5, y: 280, giro: 4, cor: '#95D8F7', cola: '#7CC5E8' },
]);
const LADO = 14.5;
const FONTE = '"Caveat", "Segoe Print", "Bradley Hand", cursive';

function postit(p, sufixo = '') {
  const { x, y } = p;
  const papel = `papel-${p.n}${sufixo}`;
  const meio = `${x + LADO / 2} ${y + LADO / 2}`;
  const grad = svg('linearGradient', { id: papel, x1: 0, y1: 0, x2: 0, y2: 1 }, [
    svg('stop', { offset: '0', 'stop-color': p.cola }), svg('stop', { offset: '0.13', 'stop-color': p.cola }),
    svg('stop', { offset: '0.17', 'stop-color': p.cor }), svg('stop', { offset: '1', 'stop-color': p.cor }),
  ]);
  const texto = svg('g', { class: 'postit-texto', 'data-postit': p.n, fill: '#23262B', 'font-family': FONTE, 'font-weight': 600 });
  return svg('g', { transform: `rotate(${p.giro} ${meio})` }, [
    grad,
    // Sombra de papel: colado em cima, descolando embaixo.
    svg('rect', { x: x + 0.25, y: y + 0.6, width: LADO, height: LADO, fill: '#000', opacity: 0.16, filter: `url(#sombra-postit${sufixo})` }),
    svg('path', { d: `M ${x} ${y} H ${x + LADO} V ${y + LADO - 2.2} L ${x + LADO - 2.2} ${y + LADO} H ${x} Z`, fill: `url(#${papel})` }),
    // Canto levantado.
    svg('path', { d: `M ${x + LADO} ${y + LADO - 2.2} L ${x + LADO - 2.2} ${y + LADO} L ${x + LADO - 1.7} ${y + LADO - 1.7} Z`, fill: '#FFFFFF', opacity: 0.55 }),
    svg('path', { d: `M ${x + LADO} ${y + LADO - 2.2} L ${x + LADO - 2.2} ${y + LADO}`, stroke: '#000', 'stroke-opacity': 0.18, 'stroke-width': 0.2 }),
    texto,
  ]);
}

function filtroSombra(sufixo) {
  return svg('filter', { id: `sombra-postit${sufixo}`, x: '-20%', y: '-20%', width: '140%', height: '160%' }, [svg('feGaussianBlur', { stdDeviation: 0.55 })]);
}

// Retângulo da parede da frente que contém os quatro post-its (com folga para o giro).
export const POSTITS_REGIAO = Object.freeze({ x: 450, y: 268, w: 87, h: 32 });

// Os mesmos post-its num SVG só deles (usado na vista lateral, que o põe em perspectiva).
// sufixo deixa os ids dos gradientes únicos na página.
export function criarPostitsSvg(sufixo, R = POSTITS_REGIAO) {
  return svg('svg', {
    class: 'postits-copia', viewBox: `${R.x} ${R.y} ${R.w} ${R.h}`, width: R.w, height: R.h,
    'aria-hidden': 'true', focusable: 'false',
  }, [svg('defs', {}, [filtroSombra(sufixo)]), ...POSTITS.map((p) => postit(p, sufixo))]);
}

// Quebra o texto em linhas que cabem na largura (medida real da fonte, num canvas).
let medidor = null;
function larguraTexto(t, tamanho) {
  medidor ??= document.createElement('canvas').getContext('2d');
  medidor.font = `600 100px ${FONTE}`;
  return (medidor.measureText(t).width / 100) * tamanho;
}
function quebrar(texto, tamanho, largura) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(/\s+/)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (atual && larguraTexto(tentativa, tamanho) > largura) { linhas.push(atual); atual = palavra; } else atual = tentativa;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// Escreve título e texto em cada post-it, no idioma atual. Diminui a letra até caber.
export async function escreverPostits(camada, i18n) {
  if (!camada) return;
  try { await document.fonts?.load(`600 10px ${FONTE}`); } catch { /* segue com a fonte reserva */ }
  const margem = 1.1;
  const largura = LADO - margem * 2;
  for (const p of POSTITS) {
    const g = camada.querySelector(`.postit-texto[data-postit="${p.n}"]`);
    if (!g) continue;
    const titulo = i18n.t(`postit.${p.n}.titulo`);
    const corpo = i18n.t(`postit.${p.n}.texto`);
    let fT = 1.7; let fC = 1.25; let lt; let lc;
    for (;;) {
      lt = quebrar(titulo, fT, largura);
      lc = quebrar(corpo, fC, largura);
      const altura = lt.length * fT * 0.95 + 0.5 + lc.length * fC * 1.05;
      if (altura <= LADO - 3.2 || fC <= 0.6) break;
      fT *= 0.94; fC *= 0.94;
    }
    g.textContent = '';
    let yy = p.y + 2.6 + fT * 0.8;
    for (const l of lt) { g.append(svg('text', { x: p.x + margem, y: yy, 'font-size': fT.toFixed(3) }, [l])); yy += fT * 0.95; }
    yy += 0.5 + fC * 0.1;
    for (const l of lc) { g.append(svg('text', { x: p.x + margem, y: yy, 'font-size': fC.toFixed(3) }, [l])); yy += fC * 1.05; }
  }
}

const ret = (x, y, w, h, fill, extra = {}) => svg('rect', { x, y, width: w, height: h, fill, ...extra });
const poli = (pontos, fill, extra = {}) => svg('polygon', { points: pontos, fill, stroke: TINTA, 'stroke-width': 1.1, 'stroke-linejoin': 'round', ...extra });

function monitor() {
  return svg('g', { class: 'obj-monitor' }, [
    ret(450, 311.3, 98, 59.4, '#222', { rx: 0.8, stroke: TINTA, 'stroke-width': 1.2 }),
    // A tela em HTML encaixa exatamente aqui (telaQuad do monitor em itens.js).
    ret(454, 314, 91, 54, '#0F1E30'),
    ...[531, 535, 539].map((x) => ret(x, 367.6, 2, 1.2, '#666')),
    ret(543, 367.6, 2, 1.2, '#C33'),
    ret(493.2, 370.7, 11.6, 12, '#2A2A2A', { stroke: TINTA, 'stroke-width': 1 }),
    ret(480, 381.6, 40, 3, '#2A2A2A', { rx: 1, stroke: TINTA, 'stroke-width': 0.9 }),
  ]);
}

function notebook() {
  return svg('g', { class: 'obj-notebook' }, [
    // Tampa reta: a tela em HTML encaixa exatamente na parte escura (telaQuad do notebook).
    ret(379.8, 348.3, 54.4, 37.4, '#C8CBD0', { rx: 1.4, stroke: TINTA, 'stroke-width': 1.1 }),
    ret(382.5, 351, 49, 31.5, '#0F1E30'),
    // Base presa na dobradiça (mesma largura da tampa atrás) e um pouco mais larga na frente,
    // simétrica, como um notebook visto de frente sobre a mesa.
    poli('373.3,393.6 440.7,393.6 440.3,395.8 373.7,395.8', '#9EA2A8', { 'stroke-width': 1 }),
    poli('379.8,385.7 434.2,385.7 440.7,393.6 373.3,393.6', '#C8CBD0', { 'stroke-width': 1.1 }),
    poli('384.2,387.2 429.8,387.2 432.6,390.6 381.4,390.6', '#A9ADB3', { stroke: 'none' }),
    ret(400.5, 391.4, 13, 1.6, '#B5B9BF', { rx: 0.5 }),
  ]);
}

function ventoinha(cx, cy) {
  const pas = [0, 72, 144, 216, 288].map((a) => svg('path', {
    d: `M ${cx} ${cy} C ${cx} ${cy - 5}, ${cx + 3} ${cy - 8}, ${cx + 6} ${cy - 7.2} C ${cx + 4.5} ${cy - 4}, ${cx + 2.5} ${cy - 1.6}, ${cx} ${cy} Z`,
    fill: '#F0565B', transform: `rotate(${a} ${cx} ${cy})`,
  }));
  // Giro com a animação do próprio SVG: não depende de CSS nem das opções de animação do sistema.
  const giro = svg('g', { class: 'ventoinha' }, [...pas, svg('animateTransform', {
    attributeName: 'transform', type: 'rotate', from: `0 ${cx} ${cy}`, to: `360 ${cx} ${cy}`, dur: '1.1s', repeatCount: 'indefinite',
  })]);
  return svg('g', {}, [
    svg('circle', { cx, cy, r: 9.6, fill: '#5A1A1D', stroke: '#E0393E', 'stroke-width': 1.6 }),
    giro,
    svg('circle', { cx, cy, r: 2.4, fill: '#2A0D0E', stroke: '#E0393E', 'stroke-width': 0.8 }),
  ]);
}

function gabinete() {
  return svg('g', { class: 'obj-gabinete' }, [
    poli('376.3,417.3 386.3,412 421.3,412 411.3,417.3', '#7A7D82', { 'fill-opacity': 0.85, 'stroke-width': 1 }),
    poli('411.3,417.3 421.3,412 421.3,500.5 411.3,506.3', '#4A4C50', { 'fill-opacity': 0.85, 'stroke-width': 1 }),
    ret(376.3, 417.3, 35, 89, '#5E6166', { 'fill-opacity': 0.7, stroke: TINTA, 'stroke-width': 1.1 }),
    ret(379, 420, 29.6, 83.6, 'none', { stroke: '#2C2E31', 'stroke-width': 0.8 }),
    svg('g', { class: 'ventoinhas' }, [ventoinha(393.5, 443), ventoinha(393.5, 466), ventoinha(393.5, 488.5)]),
  ]);
}

// Ventoinhas vistas de lado, atrás do vidro do gabinete (parede do guarda-roupa).
// Centros e tamanhos medidos pelos pixels vermelhos da ilustração direita-nitido-v2: cada
// ventoinha é a da frente achatada na perspectiva (elipse 5 × 11,2) e cortada pela moldura.
const RAIO_VENTOINHA = 10.4; // anel de 9,6 + metade da borda
export const VENTOINHAS_LADO = [
  { cx: 207.2, cy: 438.2 }, { cx: 207.2, cy: 464.6 }, { cx: 207.2, cy: 490.2 },
];
const ELIPSE_LADO = { rx: 5, ry: 11.2 };
export const VIDRO_LADO = { x: 205.4, y: 392, w: 20, h: 118 };

function ventoinhaLado({ cx, cy }) {
  const sx = ELIPSE_LADO.rx / RAIO_VENTOINHA;
  const sy = ELIPSE_LADO.ry / RAIO_VENTOINHA;
  return svg('g', { transform: `translate(${cx} ${cy}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})` }, [ventoinha(0, 0)]);
}

function gabineteLado() {
  return svg('g', { class: 'obj-gabinete-lado', 'clip-path': 'url(#vidro-lado)' }, [
    svg('g', { class: 'ventoinhas' }, VENTOINHAS_LADO.map(ventoinhaLado)),
  ]);
}

// Paredes que têm objetos em código. Devolve a camada pronta ou null.
export function criarObjetos(paredeId) {
  if (paredeId === 'direita') {
    const defs = svg('defs', {}, [
      svg('clipPath', { id: 'vidro-lado' }, [ret(VIDRO_LADO.x, VIDRO_LADO.y, VIDRO_LADO.w, VIDRO_LADO.h, '#000')]),
    ]);
    return svg('svg', { class: 'objetos objetos-lado pc-ligado', viewBox: '0 0 1024 572', 'aria-hidden': 'true', focusable: 'false' }, [defs, gabineteLado()]);
  }
  if (paredeId !== 'frente') return null;
  const defs = svg('defs', {}, [filtroSombra('')]);
  const camada = svg('svg', { class: 'objetos pc-ligado', viewBox: '0 0 1024 572', 'aria-hidden': 'true', focusable: 'false' }, [
    defs, ...POSTITS.map((p) => postit(p)), monitor(), notebook(), gabinete(),
  ]);
  return camada;
}
