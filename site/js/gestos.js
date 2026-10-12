// Gestos de toque: deslizar troca de parede (RF-02) e pinça nas telas (RF-24).
// No computador, arrastar com o mouse não muda a vista.

export function limitarZoom(z) {
  return Math.min(3, Math.max(1, z));
}

// Extra de câmera no espaço da tela: P' = z·P + (ex, ey). Mantém a tela coberta.
export function limitarDeslocamento(z, ex, ey, vw, vh) {
  return {
    ex: Math.min(0, Math.max((1 - z) * vw, ex)),
    ey: Math.min(0, Math.max((1 - z) * vh, ey)),
  };
}

export function instalarGestos(alvo, { podeDeslizar, aoDeslizar, podePincar, aoPincar, aoToqueDuplo }) {
  const toques = new Map();
  let pinca = null;
  let deslize = null;
  let ultimoToque = { t: 0, x: 0, y: 0 };

  function medir() {
    const [a, b] = [...toques.values()];
    return { d: Math.hypot(b.x - a.x, b.y - a.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  }

  alvo.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.size === 1) {
      deslize = podeDeslizar() ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } : null;
    } else if (toques.size === 2 && podePincar()) {
      deslize = null;
      pinca = { inicio: medir(), base: aoPincar('inicio') };
    }
  }, { capture: true });

  alvo.addEventListener('pointermove', (e) => {
    if (!toques.has(e.pointerId)) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinca && toques.size === 2) {
      const m = medir();
      aoPincar('mover', { fator: m.d / pinca.inicio.d, mx: m.mx, my: m.my, m0x: pinca.inicio.mx, m0y: pinca.inicio.my, base: pinca.base });
      e.preventDefault();
    }
  }, { capture: true, passive: false });

  function terminar(e) {
    if (!toques.has(e.pointerId)) return;
    toques.delete(e.pointerId);
    if (pinca && toques.size < 2) { pinca = null; return; }
    if (deslize && deslize.id === e.pointerId && e.type === 'pointerup') {
      const dx = e.clientX - deslize.x; const dy = e.clientY - deslize.y;
      const rapido = performance.now() - deslize.t < 800;
      if (rapido && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && podeDeslizar()) {
        aoDeslizar(dx < 0 ? 1 : -1); // Dedo para a esquerda = seta da direita.
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        const agora = performance.now();
        if (agora - ultimoToque.t < 320 && Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 40) {
          aoToqueDuplo();
          ultimoToque = { t: 0, x: 0, y: 0 };
        } else ultimoToque = { t: agora, x: e.clientX, y: e.clientY };
      }
    }
    deslize = null;
  }
  alvo.addEventListener('pointerup', terminar, { capture: true });
  alvo.addEventListener('pointercancel', terminar, { capture: true });
}
