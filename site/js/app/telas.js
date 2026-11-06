// As três telas do quarto: PC (FroisOS), notebook e parede de trás (quadro e medalhas).
// Também ajusta o tamanho das telas quando a janela muda e pausa os relógios com a aba oculta.

import { CONFIG } from '../config.js';
import { itemPorId } from '../itens.js';
import { criarEnergia } from '../pc/energia.js';
import { criarSistema } from '../pc/sistema.js';
import { registrarApps } from '../pc/apps.js';
import { criarClienteGitHub } from '../github/cliente.js';
import { criarNotebook, TELA_NOTEBOOK, TELA_NOTEBOOK_MINIMA } from '../notebook/notebook.js';
import { criarQuadro, TELA_QUADRO } from '../parede/parede.js';
import { criarPainelMedalhas } from '../parede/medalhas.js';
import { carregarJSON } from './carregamento.js';

export function instalarTelas(ctx) {
  const { L, i18n, medicao, quarto, armazenamento, conteudo } = ctx;

  // ---------- Post-its (texto escrito neles) ----------
  quarto.escreverPostits(i18n);

  // ---------- PC ----------
  let aoMudarEnergia = () => {};
  const energia = criarEnergia({
    tempoIniciando: L.pcIniciandoMs, tempoDesligando: L.pcDesligandoMs,
    aoMudar: (e) => aoMudarEnergia(e),
  });
  const cliente = criarClienteGitHub({
    usuario: CONFIG.github.usuario, api: CONFIG.github.api, armazenamento,
    tempoLimite: L.githubTempoLimiteMs, validade: L.githubValidadeMs, intervaloBotao: L.githubIntervaloBotaoMs,
    carregarInstantaneo: async () => {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 8000);
      try { return await carregarJSON('github-instantaneo.json', c.signal); } finally { clearTimeout(t); }
    },
  });
  const apertarEnergia = () => energia.botao();
  const sistema = criarSistema({
    i18n, energia,
    escala: () => quarto.escalaTela('pc'),
    aoLigarPeloMonitor: () => apertarEnergia(),
    aoEvento: (n) => medicao.evento(n),
  });
  registrarApps(sistema, { i18n, energia, cliente, conteudo: { projetos: conteudo.projetos.projetos, fotos: conteudo.fotos.fotos }, medicao });
  const compacta = () => (window.innerWidth < 520 ? 'minima' : window.innerWidth < 900);
  const telaNotebook = () => (window.innerWidth < 520 ? TELA_NOTEBOOK_MINIMA : TELA_NOTEBOOK);
  sistema.definirCompacta(compacta());
  sistema.iniciar();
  quarto.encaixarTela(itemPorId('monitor'), { w: sistema.resolucao.w, h: sistema.resolucao.h, conteudo: sistema.el });

  aoMudarEnergia = ({ estado, motivo }) => {
    sistema.mostrarEstado(estado);
    quarto.ventoinhas(estado === 'ligado' || estado === 'iniciando');
    if (estado === 'desligado') cliente.cancelarTudo();
    if (estado === 'iniciando') { medicao.evento('pc-ligar'); ctx.esconderLigue(); }
    if (estado === 'desligando' || (estado === 'desligado' && motivo === 'blecaute')) medicao.evento(motivo === 'blecaute' ? 'blecaute' : 'pc-desligar');
  };

  // ---------- Notebook ----------
  const notebook = criarNotebook({ i18n, conteudo: { instagram: conteudo.instagram, linkedin: conteudo.linkedin }, medicao });
  notebook.iniciar();
  notebook.definirTamanho(telaNotebook());
  quarto.encaixarTela(itemPorId('notebook'), { ...telaNotebook(), conteudo: notebook.el, acimaPenumbra: true });
  notebook.ligarRelogio(true);

  // ---------- Parede de trás ----------
  const quadro = criarQuadro({ i18n, conteudo: { fotos: conteudo.fotos.fotos } });
  quarto.encaixarTela(itemPorId('quadro'), { ...TELA_QUADRO, conteudo: quadro.el });
  quadro.traduzir();
  const medalhas = criarPainelMedalhas({ i18n, conteudo: { medalhas: conteudo.medalhas.medalhas }, medicao });

  // ---------- Aba oculta: PC e relógios param (RNF-08) ----------
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { sistema.retomar(); notebook.ligarRelogio(true); } else { sistema.pausar(); notebook.ligarRelogio(false); }
  });

  // ---------- Tamanho da tela ----------
  let pedidoQuadro = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(pedidoQuadro);
    pedidoQuadro = requestAnimationFrame(() => {
      if (sistema.definirCompacta(compacta())) quarto.redimensionarTela('pc', sistema.resolucao.w, sistema.resolucao.h);
      const tn = telaNotebook();
      notebook.definirTamanho(tn);
      quarto.redimensionarTela('notebook', tn.w, tn.h);
      quarto.enquadrar(false);
      ctx.atualizarSetaLigue();
      ctx.atualizarAvisoGire();
    });
  });

  Object.assign(ctx, { energia, cliente, sistema, notebook, quadro, medalhas, apertarEnergia });
}
