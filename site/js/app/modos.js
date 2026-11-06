// Modos do quarto (quarto, foco, passeio), troca de parede e foco nos itens (RF-03 a RF-05).

import { paredeVizinha } from '../itens.js';
import { desenharPostit } from '../parede/parede.js';

export function instalarModos(ctx) {
  const { $, body, i18n, medicao, quarto, estado } = ctx;
  const btnVoltar = $('btn-voltar');
  const btnPular = $('btn-pular');
  const setas = $('setas');
  const conteudoFoco = $('conteudo-foco');

  function definirModo(novo) {
    estado.modo = novo;
    body.classList.toggle('modo-quarto', novo === 'quarto');
    body.classList.toggle('modo-foco', novo === 'foco');
    body.classList.toggle('modo-passeio', novo === 'passeio');
    btnVoltar.hidden = novo !== 'foco';
    btnPular.hidden = novo !== 'passeio';
    setas.hidden = novo === 'foco';
    for (const b of setas.querySelectorAll('button')) b.disabled = novo !== 'quarto';
    $('btn-irpara').disabled = novo === 'passeio';
    $('btn-ajuda').disabled = novo === 'passeio';
    if (novo !== 'quarto') ctx.fecharMenu(); else quarto.repulsar();
    ctx.reavaliarBlecaute();
    ctx.atualizarSetaLigue();
  }

  function atualizarNomeParede() {
    $('nome-parede').textContent = i18n.t(`parede.${quarto.parede}`);
  }

  async function girar(direcao) {
    if (estado.modo !== 'quarto' || quarto.girando) return;
    const destino = paredeVizinha(quarto.parede, direcao);
    const p = quarto.irParaParede(destino, direcao);
    atualizarNomeParede();
    ctx.reavaliarBlecaute();
    ctx.atualizarSetaLigue();
    await p;
    ctx.atualizarSetaLigue();
  }
  $('seta-esq').addEventListener('click', () => girar(-1));
  $('seta-dir').addEventListener('click', () => girar(1));

  // ---------- Foco ----------
  function precisaGirar() {
    return !estado.continuarEmPe
      && window.matchMedia('(orientation: portrait)').matches
      && window.matchMedia('(pointer: coarse)').matches;
  }

  function atualizarAvisoGire() {
    const item = estado.itemEmFoco;
    const tela = item && (item.id === 'monitor' || item.id === 'notebook');
    $('aviso-gire').hidden = !(estado.modo === 'foco' && tela && precisaGirar());
  }

  async function focar(item) {
    if (estado.modo !== 'quarto') return;
    if (item.tipo === 'energia') { ctx.apertarEnergia(); return; }
    estado.itemEmFoco = item;
    definirModo('foco');
    body.classList.toggle('foco-tela', Boolean(item.tela));
    conteudoFoco.textContent = '';
    conteudoFoco.hidden = false;
    medicao.evento(item.evento);
    const movimento = quarto.focar(item);
    if (item.postit) conteudoFoco.append(desenharPostit(i18n, item.postit));
    if (item.id === 'quadro') { ctx.quadro.abrir(); conteudoFoco.append(ctx.quadro.legenda); }
    if (item.id === 'medalhas') { conteudoFoco.append(ctx.medalhas.el); ctx.medalhas.abrir(); }
    atualizarAvisoGire();
    await movimento;
    if (estado.itemEmFoco !== item) return;
    const alvoTeclado = item.tela ? document.querySelector(`.tela-slot[data-tela="${item.tela}"] button, .tela-slot[data-tela="${item.tela}"] textarea`) : conteudoFoco.querySelector('[tabindex], button');
    (alvoTeclado ?? btnVoltar).focus({ preventScroll: true });
  }

  async function voltar() {
    if (estado.modo !== 'foco') return;
    const item = estado.itemEmFoco;
    estado.itemEmFoco = null;
    if (item?.id === 'medalhas') ctx.medalhas.fechar();
    conteudoFoco.textContent = '';
    conteudoFoco.hidden = true;
    body.classList.remove('foco-tela');
    $('aviso-gire').hidden = true;
    definirModo('quarto');
    await quarto.paredeInteira();
    if (item) quarto.botao(item.id)?.focus({ preventScroll: true });
    ctx.atualizarSetaLigue();
  }
  btnVoltar.addEventListener('click', voltar);
  $('btn-continuar-pe').addEventListener('click', () => { estado.continuarEmPe = true; atualizarAvisoGire(); });

  // Sai do foco sem animação (usado quando o passeio começa).
  function voltarImediato() {
    estado.itemEmFoco = null;
    ctx.medalhas.fechar();
    conteudoFoco.textContent = '';
    conteudoFoco.hidden = true;
    body.classList.remove('foco-tela');
  }

  // Postits mostrados no foco precisam ser redesenhados ao trocar o idioma.
  function redesenharPostits() {
    const n = estado.itemEmFoco?.postit;
    if (!n) return;
    conteudoFoco.textContent = '';
    conteudoFoco.append(desenharPostit(i18n, n));
  }

  Object.assign(ctx, { definirModo, atualizarNomeParede, girar, atualizarAvisoGire, focar, voltar, voltarImediato, redesenharPostits });
}
