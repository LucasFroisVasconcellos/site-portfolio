// Contador de quadros por segundo (RNF-01/02), só para teste: Ctrl+Shift+F liga e desliga.

export function criarContadorFps(caixa) {
  let fpsLigado = false;
  return function alternarFps() {
    fpsLigado = !fpsLigado;
    caixa.hidden = !fpsLigado;
    if (!fpsLigado) return;
    let quadros = 0; let inicio = performance.now(); let minimo = Infinity; const medias = [];
    const laco = (t) => {
      if (!fpsLigado) return;
      quadros += 1;
      if (t - inicio >= 1000) {
        const fps = (quadros * 1000) / (t - inicio);
        medias.push(fps); if (medias.length > 30) medias.shift();
        minimo = Math.min(...medias);
        const media = medias.reduce((a, b) => a + b, 0) / medias.length;
        caixa.textContent = `${fps.toFixed(0)} fps · média 30 s ${media.toFixed(1)} · mín ${minimo.toFixed(0)}`;
        quadros = 0; inicio = t;
      }
      requestAnimationFrame(laco);
    };
    requestAnimationFrame(laco);
  };
}
