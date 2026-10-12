// Contas da câmera e das telas em HTML. Funções puras (testadas no Node).

// Enquadramento da parede inteira (seção 3.1): preenche a tela quando dá, mas a região
// "essencial" (onde ficam os itens clicáveis) nunca sai da tela.
export function enquadrarParede({ vw, vh, w, h, essencial, margem = 12, topo = 0, base = 0 }) {
  const uh = Math.max(1, vh - topo - base);
  const cobrir = Math.max(vw / w, vh / h);
  const conter = Math.min(vw / w, vh / h);
  const cabeEssencial = Math.min(
    (vw - 2 * margem) / essencial.w,
    (uh - 2 * margem) / essencial.h,
  );
  let s = Math.min(cobrir, cabeEssencial);
  if (vw < vh) s = Math.max(s, vw / w); // Em pé: no mínimo a largura inteira (seção 6.3).
  s = Math.max(s, Math.min(conter, cabeEssencial));
  const centroX = essencial.x + essencial.w / 2;
  const centroY = essencial.y + essencial.h / 2;
  let tx = vw / 2 - centroX * s;
  let ty = topo + uh / 2 - centroY * s;
  // Sem faixas vazias quando a imagem é maior que a tela; centraliza quando é menor.
  tx = w * s >= vw ? Math.min(0, Math.max(vw - w * s, tx)) : (vw - w * s) / 2;
  ty = h * s >= vh ? Math.min(0, Math.max(vh - h * s, ty)) : (vh - h * s) / 2;
  return { s, tx, ty };
}

// Foco (RF-05): a área do item ocupa a área útil da tela.
export function enquadrarFoco({ vw, vh, area, preenchimento = 0.94, topo = 0, base = 0, lados = 0 }) {
  const uh = Math.max(1, vh - topo - base);
  const uw = Math.max(1, vw - 2 * lados);
  const s = Math.min((uw * preenchimento) / area.w, (uh * preenchimento) / area.h);
  const tx = vw / 2 - (area.x + area.w / 2) * s;
  const ty = topo + uh / 2 - (area.y + area.h / 2) * s;
  return { s, tx, ty };
}

// Aproximação parcial usada no passeio ("aponta para").
export function enquadrarEspiada(base, area, vw, vh, fator = 1.7) {
  const s = base.s * fator;
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  return { s, tx: vw / 2 - cx * s, ty: vh / 2 - cy * s };
}

export function transformCSS({ s, tx, ty }) {
  return `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
}

// Homografia: leva o retângulo (0,0)-(w,h) da tela em HTML ao quadrilátero da ilustração.
export function matrizTela(w, h, quad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2; const dx2 = x3 - x2; const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2; const dy2 = y3 - y2; const dy3 = y0 - y1 + y2 - y3;
  let g = 0; let k = 0;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    k = (dx1 * dy3 - dx3 * dy1) / den;
  }
  // Quadrado unitário → quadrilátero:
  // X = (a u + b v + c) / (g u + k v + 1), Y = (d u + e v + f) / (g u + k v + 1)
  const a = x1 - x0 + g * x1; const b = x3 - x0 + k * x3; const c = x0;
  const d = y1 - y0 + g * y1; const e = y3 - y0 + k * y3; const f = y0;
  // Retângulo w×h → unitário: u = x/w, v = y/h.
  const A = a / w; const B = b / h; const D = d / w; const E = e / h; const G = g / w; const K = k / h;
  // matrix3d em ordem de colunas (CSS): [m11 m12 m13 m14, m21 ..., m31 ..., m41 ...]
  const m = [A, D, 0, G, B, E, 0, K, 0, 0, 1, 0, c, f, 0, 1];
  return { matriz: m, aplicar: (x, y) => {
    const den = G * x + K * y + 1;
    return [(A * x + B * y + c) / den, (D * x + E * y + f) / den];
  } };
}

export function matrix3dCSS(m) {
  return `matrix3d(${m.map((n) => (Math.abs(n) < 1e-12 ? 0 : Number(n.toPrecision(10)))).join(',')})`;
}

// Retângulo que envolve o quadrilátero (usado no foco, com transformação só de escala).
export function caixaDoQuad(quad) {
  const xs = quad.map((p) => p[0]); const ys = quad.map((p) => p[1]);
  const x = Math.min(...xs); const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
