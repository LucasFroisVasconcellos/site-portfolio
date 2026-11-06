// Liga o roteiro do passeio inicial (passeio.js) ao quarto e aos botões (RF-09 a RF-11).

import { PAREDE_INICIAL } from '../itens.js';
import { criarPasseio } from '../passeio.js';

export function instalarPasseio(ctx) {
  const { $, i18n, medicao, quarto, armazenamento, estado } = ctx;
  const btnPular = $('btn-pular');
  const setas = $('setas');
  const textoPasseio = $('texto-passeio');

  const passeio = criarPasseio({
    cena: {
      inicial: () => { if (quarto.parede !== PAREDE_INICIAL) quarto.irParaParede(PAREDE_INICIAL, 1); else quarto.paredeInteira(); ctx.atualizarNomeParede(); },
      espiar: (item) => quarto.espiar(item),
      parede: (id) => { quarto.irParaParede(id, 1); ctx.atualizarNomeParede(); },
      volta: () => { quarto.irParaParede(PAREDE_INICIAL, 1); ctx.atualizarNomeParede(); },
      texto: (k) => {
        textoPasseio.hidden = !k;
        if (k) { textoPasseio.textContent = i18n.t(k); textoPasseio.style.animation = 'none'; void textoPasseio.offsetWidth; textoPasseio.style.animation = ''; }
      },
      realce: (q) => setas.classList.toggle('realce', q === 'setas'),
    },
    aoTerminar: (pulado) => {
      armazenamento.gravar('passeio', true);
      medicao.evento(pulado ? 'passeio-pulado' : 'passeio-fim');
      estado.passeioAcabou = true;
      // RF-10: ao pular, a câmera volta à posição inicial em até 600 ms.
      if (quarto.parede !== PAREDE_INICIAL) quarto.irParaParede(PAREDE_INICIAL, 1);
      else quarto.paredeInteira();
      ctx.atualizarNomeParede();
      ctx.definirModo('quarto');
    },
  });
  btnPular.addEventListener('click', () => passeio.pular());

  function rodarPasseio() {
    if (estado.modo === 'foco') ctx.voltarImediato();
    estado.passeioAcabou = false;
    ctx.definirModo('passeio');
    passeio.iniciar();
    btnPular.focus({ preventScroll: true });
  }
  $('btn-ajuda').addEventListener('click', () => { if (estado.modo !== 'passeio') rodarPasseio(); });

  Object.assign(ctx, { rodarPasseio });
}
