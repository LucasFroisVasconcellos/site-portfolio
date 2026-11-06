// Objetos da parede do PC feitos em código (SVG), no lugar do desenho: monitor, notebook e
// gabinete. Coordenadas em unidades da parede (1024 × 572), copiadas da ilustração.
// Ficam numa camada abaixo das telas em HTML; o clique é dos botões de quarto.js.

const NS = 'http://www.w3.org/2000/svg';
const TINTA = '#1A1A1A';

function svg(tag, attrs = {}, filhos = []) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  for (const f of filhos) e.append(f);
  return e;
}

const ret = (x, y, w, h, fill, extra = {}) => svg('rect', { x, y, width: w, height: h, fill, ...extra });
const poli = (pontos, fill, extra = {}) => svg('polygon', { points: pontos, fill, stroke: TINTA, 'stroke-width': 1.1, 'stroke-linejoin': 'round', ...extra });

function monitor() {
  return svg('g', { class: 'obj-monitor' }, [
    ret(450, 311.3, 98, 59.4, '#222', { rx: 0.8, stroke: TINTA, 'stroke-width': 1.2 }),
    ret(452.4, 313.6, 93.2, 52.6, '#0F1E30'),
    ...[531, 535, 539].map((x) => ret(x, 367.6, 2, 1.2, '#666')),
    ret(543, 367.6, 2, 1.2, '#C33'),
    ret(493.2, 370.7, 11.6, 12, '#2A2A2A', { stroke: TINTA, 'stroke-width': 1 }),
    ret(480, 381.6, 40, 3, '#2A2A2A', { rx: 1, stroke: TINTA, 'stroke-width': 0.9 }),
  ]);
}

function notebook() {
  return svg('g', { class: 'obj-notebook' }, [
    poli('380.7,348 431.3,347.3 434,384 383,386.3', '#C8CBD0'),
    svg('polygon', { points: '383.2,350.4 429,349.8 431.3,381.8 385.4,383.8', fill: '#0F1E30' }),
    poli('381.3,385.7 436.3,384.7 449.7,389.7 386.3,393', '#B9BCC2'),
    svg('line', { x1: 390, y1: 389.3, x2: 440, y2: 388, stroke: '#8C9096', 'stroke-width': 0.8 }),
  ]);
}

function ventoinha(cx, cy) {
  const pas = [0, 72, 144, 216, 288].map((a) => svg('path', {
    d: `M ${cx} ${cy} C ${cx} ${cy - 5}, ${cx + 3} ${cy - 8}, ${cx + 6} ${cy - 7.2} C ${cx + 4.5} ${cy - 4}, ${cx + 2.5} ${cy - 1.6}, ${cx} ${cy} Z`,
    fill: '#F0565B', transform: `rotate(${a} ${cx} ${cy})`,
  }));
  const giro = svg('g', { class: 'ventoinha' }, pas);
  giro.style.transformOrigin = `${cx}px ${cy}px`;
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

// Paredes que têm objetos em código. Devolve a camada pronta ou null.
export function criarObjetos(paredeId) {
  if (paredeId !== 'frente') return null;
  const camada = svg('svg', { class: 'objetos pc-ligado', viewBox: '0 0 1024 572', 'aria-hidden': 'true', focusable: 'false' }, [
    monitor(), notebook(), gabinete(),
  ]);
  return camada;
}
