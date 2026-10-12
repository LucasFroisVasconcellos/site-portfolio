// Ponto de entrada: carrega, monta o quarto e liga as regras (modos, passeio, blecaute, PC).

import { CONFIG } from './config.js';
import { ITENS, itemPorId, paredeVizinha, indiceParede, PAREDE_INICIAL } from './itens.js';
import { criarArmazenamento } from './armazenamento.js';
import { criarI18n, idiomaInicial, aplicarTextos, IDIOMAS } from './i18n.js';
import { criarMedicao } from './medicao.js';
import { criarQuarto } from './quarto.js';
import { criarPasseio } from './passeio.js';
import { criarBlecaute } from './blecaute.js';
import { criarEnergia } from './pc/energia.js';
import { criarSistema, RESOLUCAO } from './pc/sistema.js';
import { registrarApps } from './pc/apps.js';
import { criarClienteGitHub } from './github/cliente.js';
import { criarNotebook, TELA_NOTEBOOK } from './notebook/notebook.js';
import { desenharPostits, criarQuadro, TELA_QUADRO } from './parede/parede.js';
import { criarPainelMedalhas } from './parede/medalhas.js';
import { instalarGestos, limitarZoom, limitarDeslocamento } from './gestos.js';
import { el } from './dom.js';

const $ = (id) => document.getElementById(id);
const L = CONFIG.limites;
const reduzirMovimento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const armazenamento = criarArmazenamento();
const validarIdioma = (d) => (IDIOMAS.includes(d) ? d : null);

const ARQUIVOS = {
  pt: 'conteudo/pt.json', en: 'conteudo/en.json', projetos: 'conteudo/projetos.json',
  fotos: 'conteudo/fotos.json', medalhas: 'conteudo/medalhas.json',
  instagram: 'conteudo/instagram.json', linkedin: 'conteudo/linkedin.json',
};

async function carregarJSON(url, signal) {
  const r = await fetch(url, { signal, credentials: 'same-origin' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

function progresso(fracao) {
  const pct = Math.round(Math.min(1, Math.max(0, fracao)) * 100);
  $('barra-preenchida').style.width = `${pct}%`;
  $('porcentagem').textContent = `${pct}%`;
  $('barra-progresso').setAttribute('aria-valuenow', String(pct));
}

function mostrarErroCarregamento(medicao) {
  document.querySelector('.carregamento-caixa').hidden = true;
  $('erro-carregamento').hidden = false;
  $('btn-tentar').focus();
  medicao?.evento('erro-carregamento');
}

async function iniciar() {
  // Idioma da tela de carregamento antes de tudo (regra 3.7).
  const idioma = idiomaInicial(armazenamento.ler('idioma', validarIdioma), navigator.languages ?? [navigator.language]);
  document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
  $('btn-tentar').addEventListener('click', () => window.location.reload());

  // RF-07: termina no quarto pronto ou em erro em até 20 s.
  const ctrl = new AbortController();
  let estourou = false;
  const limite = setTimeout(() => { estourou = true; ctrl.abort(); }, L.carregamentoMs);
  const total = Object.keys(ARQUIVOS).length + 4;
  let feitos = 0;
  const passo = () => { feitos += 1; progresso(feitos / total); };

  let conteudo;
  try {
    const entradas = await Promise.all(Object.entries(ARQUIVOS).map(async ([k, url]) => {
      const v = await carregarJSON(url, ctrl.signal);
      passo();
      return [k, v];
    }));
    conteudo = Object.fromEntries(entradas);
  } catch {
    clearTimeout(limite);
    mostrarErroCarregamento(null);
    return;
  }

  const i18n = criarI18n({ pt: conteudo.pt, en: conteudo.en }, idioma);
  $('carregamento-texto').textContent = i18n.t('carregando.texto');
  aplicarTextos(document, i18n);
  const medicao = criarMedicao({ idioma: () => i18n.idioma });

  const quarto = criarQuarto({
    raiz: $('paredes'), i18n, reduzirMovimento, tempos: L,
    aoClicarItem: (item) => app.clicarItem(item),
  });
  quarto.montar();
  aplicarTextos($('paredes'), i18n);

  try {
    await Promise.race([
      quarto.carregarImagens((f) => progresso((Object.keys(ARQUIVOS).length + f * 4) / total)),
      new Promise((_, rej) => {
        if (estourou) rej(new Error('tempo'));
        ctrl.signal.addEventListener('abort', () => rej(new Error('tempo')));
      }),
    ]);
  } catch {
    clearTimeout(limite);
    mostrarErroCarregamento(medicao);
    return;
  }
  clearTimeout(limite);

  const app = montarApp({ conteudo, i18n, medicao, quarto });
  app.comecar();
}

function montarApp({ conteudo, i18n, medicao, quarto }) {
  const body = document.body;
  let modo = 'carregando';
  let passeioAcabou = false;
  let itemEmFoco = null;
  let continuarEmPe = false;
  let emBlecaute = false;
  let avisoLigue = false;

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
  const sistema = criarSistema({
    i18n, energia,
    escala: () => quarto.escalaTela('pc'),
    aoLigarPeloMonitor: () => apertarEnergia(),
    aoEvento: (n) => medicao.evento(n),
  });
  registrarApps(sistema, { i18n, energia, cliente, conteudo: { projetos: conteudo.projetos.projetos, fotos: conteudo.fotos.fotos }, medicao });
  const compacta = () => window.innerWidth < 900;
  sistema.definirCompacta(compacta());
  sistema.iniciar();
  quarto.encaixarTela(itemPorId('monitor'), { w: sistema.resolucao.w, h: sistema.resolucao.h, conteudo: sistema.el });

  aoMudarEnergia = ({ estado, motivo }) => {
    sistema.mostrarEstado(estado);
    quarto.ventoinhas(estado === 'ligado' || estado === 'iniciando');
    if (estado === 'desligado') cliente.cancelarTudo();
    if (estado === 'iniciando') { medicao.evento('pc-ligar'); esconderLigue(); }
    if (estado === 'desligando' || (estado === 'desligado' && motivo === 'blecaute')) medicao.evento(motivo === 'blecaute' ? 'blecaute' : 'pc-desligar');
  };

  function apertarEnergia() {
    energia.botao();
  }

  // ---------- Notebook ----------
  const notebook = criarNotebook({ i18n, conteudo: { instagram: conteudo.instagram, linkedin: conteudo.linkedin }, medicao });
  notebook.iniciar();
  quarto.encaixarTela(itemPorId('notebook'), { ...TELA_NOTEBOOK, conteudo: notebook.el, acimaPenumbra: true });
  notebook.ligarRelogio(true);

  // ---------- Parede de trás ----------
  const quadro = criarQuadro({ i18n, conteudo: { fotos: conteudo.fotos.fotos } });
  quarto.encaixarTela(itemPorId('quadro'), { ...TELA_QUADRO, conteudo: quadro.el });
  quadro.traduzir();
  const medalhas = criarPainelMedalhas({ i18n, conteudo: { medalhas: conteudo.medalhas.medalhas }, medicao });

  // ---------- Controles ----------
  const controles = $('controles');
  const btnVoltar = $('btn-voltar');
  const btnPular = $('btn-pular');
  const setas = $('setas');
  const conteudoFoco = $('conteudo-foco');
  const textoPasseio = $('texto-passeio');
  const menu = $('menu-irpara');
  const btnMenu = $('btn-irpara');

  function definirModo(novo) {
    modo = novo;
    body.classList.toggle('modo-quarto', novo === 'quarto');
    body.classList.toggle('modo-foco', novo === 'foco');
    body.classList.toggle('modo-passeio', novo === 'passeio');
    btnVoltar.hidden = novo !== 'foco';
    btnPular.hidden = novo !== 'passeio';
    setas.hidden = novo === 'foco';
    for (const b of setas.querySelectorAll('button')) b.disabled = novo !== 'quarto';
    $('btn-irpara').disabled = novo === 'passeio';
    $('btn-ajuda').disabled = novo === 'passeio';
    if (novo !== 'quarto') fecharMenu();
    reavaliarBlecaute();
    atualizarSetaLigue();
  }

  function atualizarNomeParede() {
    $('nome-parede').textContent = i18n.t(`parede.${quarto.parede}`);
  }

  async function girar(direcao) {
    if (modo !== 'quarto' || quarto.girando) return;
    const destino = paredeVizinha(quarto.parede, direcao);
    const p = quarto.irParaParede(destino, direcao);
    atualizarNomeParede();
    reavaliarBlecaute();
    atualizarSetaLigue();
    await p;
    atualizarSetaLigue();
  }
  $('seta-esq').addEventListener('click', () => girar(-1));
  $('seta-dir').addEventListener('click', () => girar(1));

  // ---------- Foco ----------
  function precisaGirar() {
    return !continuarEmPe
      && window.matchMedia('(orientation: portrait)').matches
      && window.matchMedia('(pointer: coarse)').matches;
  }

  function atualizarAvisoGire() {
    const tela = itemEmFoco && (itemEmFoco.id === 'monitor' || itemEmFoco.id === 'notebook');
    $('aviso-gire').hidden = !(modo === 'foco' && tela && precisaGirar());
  }

  async function focar(item) {
    if (modo !== 'quarto') return;
    if (item.tipo === 'energia') { apertarEnergia(); return; }
    itemEmFoco = item;
    definirModo('foco');
    body.classList.toggle('foco-tela', Boolean(item.tela));
    conteudoFoco.textContent = '';
    conteudoFoco.hidden = false;
    medicao.evento(item.evento);
    const movimento = quarto.focar(item);
    if (item.id === 'postits') conteudoFoco.append(desenharPostits(i18n));
    if (item.id === 'quadro') { quadro.abrir(); conteudoFoco.append(quadro.legenda); }
    if (item.id === 'medalhas') { conteudoFoco.append(medalhas.el); medalhas.abrir(); }
    atualizarAvisoGire();
    await movimento;
    if (itemEmFoco !== item) return;
    const alvoTeclado = item.tela ? document.querySelector(`.tela-slot[data-tela="${item.tela}"] button, .tela-slot[data-tela="${item.tela}"] textarea`) : conteudoFoco.querySelector('[tabindex], button');
    (alvoTeclado ?? btnVoltar).focus({ preventScroll: true });
  }

  async function voltar() {
    if (modo !== 'foco') return;
    const item = itemEmFoco;
    itemEmFoco = null;
    if (item?.id === 'medalhas') medalhas.fechar();
    conteudoFoco.textContent = '';
    conteudoFoco.hidden = true;
    body.classList.remove('foco-tela');
    $('aviso-gire').hidden = true;
    definirModo('quarto');
    await quarto.paredeInteira();
    if (item) quarto.botao(item.id)?.focus({ preventScroll: true });
    atualizarSetaLigue();
  }
  btnVoltar.addEventListener('click', voltar);
  $('btn-continuar-pe').addEventListener('click', () => { continuarEmPe = true; atualizarAvisoGire(); });

  // ---------- Menu "Ir para" (RF-06) ----------
  function montarMenu() {
    for (const b of menu.querySelectorAll('button')) b.remove();
    for (const item of ITENS) {
      const rotulo = item.tipo === 'energia'
        ? i18n.t(energia.estado === 'ligado' ? 'energia.desligar' : 'energia.ligar')
        : i18n.t(`item.${item.id}`);
      menu.append(el('button', {
        texto: rotulo, attrs: { type: 'button', role: 'menuitem' },
        on: { click: () => irParaItem(item) },
      }));
    }
  }
  function abrirMenu() {
    montarMenu();
    menu.hidden = false;
    btnMenu.setAttribute('aria-expanded', 'true');
    menu.querySelector('button')?.focus();
  }
  function fecharMenu(devolverFoco = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    btnMenu.setAttribute('aria-expanded', 'false');
    if (devolverFoco) btnMenu.focus();
  }
  btnMenu.addEventListener('click', (e) => { e.stopPropagation(); if (menu.hidden) abrirMenu(); else fecharMenu(); });
  menu.addEventListener('keydown', (e) => {
    const itens = [...menu.querySelectorAll('button')];
    const i = itens.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); itens[(i + 1) % itens.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); itens[(i - 1 + itens.length) % itens.length].focus(); }
    if (e.key === 'Escape') { e.stopPropagation(); fecharMenu(true); }
    if (e.key === 'Tab' && ((e.shiftKey && i === 0) || (!e.shiftKey && i === itens.length - 1))) fecharMenu();
  });
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && e.target !== btnMenu && !btnMenu.contains(e.target)) fecharMenu(); });

  async function irParaItem(item) {
    fecharMenu();
    if (modo === 'passeio') return;
    if (modo === 'foco') await voltar();
    if (quarto.parede !== item.parede) {
      const d = (indiceParede(item.parede) - indiceParede(quarto.parede) + 4) % 4 === 3 ? -1 : 1;
      const p = quarto.irParaParede(item.parede, d);
      atualizarNomeParede();
      await p;
    }
    if (item.tipo === 'energia') { apertarEnergia(); quarto.botao('energia')?.focus(); reavaliarBlecaute(); return; }
    await focar(item);
  }

  // ---------- Passeio (RF-09 a RF-11) ----------
  const passeio = criarPasseio({
    cena: {
      inicial: () => { if (quarto.parede !== PAREDE_INICIAL) quarto.irParaParede(PAREDE_INICIAL, 1); else quarto.paredeInteira(); atualizarNomeParede(); },
      espiar: (item) => quarto.espiar(item),
      parede: (id) => { quarto.irParaParede(id, 1); atualizarNomeParede(); },
      volta: () => { quarto.irParaParede(PAREDE_INICIAL, 1); atualizarNomeParede(); },
      texto: (k) => {
        textoPasseio.hidden = !k;
        if (k) { textoPasseio.textContent = i18n.t(k); textoPasseio.style.animation = 'none'; void textoPasseio.offsetWidth; textoPasseio.style.animation = ''; }
      },
      realce: (q) => setas.classList.toggle('realce', q === 'setas'),
    },
    aoTerminar: (pulado) => {
      armazenamento.gravar('passeio', true);
      medicao.evento(pulado ? 'passeio-pulado' : 'passeio-fim');
      passeioAcabou = true;
      // RF-10: ao pular, a câmera volta à posição inicial em até 600 ms.
      if (quarto.parede !== PAREDE_INICIAL) quarto.irParaParede(PAREDE_INICIAL, 1);
      else quarto.paredeInteira();
      atualizarNomeParede();
      definirModo('quarto');
    },
  });
  btnPular.addEventListener('click', () => passeio.pular());

  function rodarPasseio() {
    if (modo === 'foco') { voltarImediato(); }
    passeioAcabou = false;
    definirModo('passeio');
    passeio.iniciar();
    btnPular.focus({ preventScroll: true });
  }
  function voltarImediato() {
    itemEmFoco = null;
    medalhas.fechar();
    conteudoFoco.textContent = '';
    conteudoFoco.hidden = true;
    body.classList.remove('foco-tela');
  }
  $('btn-ajuda').addEventListener('click', () => { if (modo !== 'passeio') rodarPasseio(); });

  // ---------- Blecaute (seção 3.3) ----------
  const blecaute = criarBlecaute({ t1: L.blecauteT1Ms, t2: L.blecauteT2Ms });
  let timerBlecaute = null;
  const agora = () => performance.now();

  function condicoesBlecaute() {
    return modo === 'quarto' && passeioAcabou && quarto.parede === 'frente' && document.visibilityState === 'visible';
  }
  function agendarBlecaute() {
    clearTimeout(timerBlecaute);
    const hora = blecaute.proximoDisparo();
    if (hora === null) return;
    timerBlecaute = setTimeout(() => {
      if (blecaute.verificar(agora())) executarBlecaute(); else agendarBlecaute();
    }, Math.max(0, hora - agora()) + 5);
  }
  function reavaliarBlecaute() {
    blecaute.condicoes(condicoesBlecaute(), agora());
    agendarBlecaute();
  }
  function entrada(tipo) {
    blecaute.entrada(tipo, agora());
  }
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') entrada('movimento'); }, { passive: true });
  window.addEventListener('pointerdown', () => entrada('acao'), { passive: true, capture: true });
  window.addEventListener('keydown', () => entrada('acao'), { capture: true });
  window.addEventListener('wheel', () => entrada('acao'), { passive: true });
  document.addEventListener('visibilitychange', () => {
    reavaliarBlecaute();
    const visivel = document.visibilityState === 'visible';
    if (visivel) { sistema.retomar(); notebook.ligarRelogio(true); } else { sistema.pausar(); notebook.ligarRelogio(false); }
  });

  function executarBlecaute() {
    clearTimeout(timerBlecaute);
    emBlecaute = true;
    energia.blecaute(L.blecauteDuracaoMs); // PC direto para Desligado; botão travado por 3 s.
    quadro.apagar(true);
    quarto.luz(0.9, 700);
    setTimeout(() => { quarto.luz(0, 1000); quadro.apagar(false); }, 2000);
    setTimeout(() => {
      emBlecaute = false;
      if (energia.estado === 'desligado') mostrarLigue();
    }, L.blecauteDuracaoMs);
  }

  // ---------- Aviso "Ligue o PC" (RF-13) ----------
  function mostrarLigue() {
    avisoLigue = true;
    $('aviso-ligue').hidden = false;
    atualizarSetaLigue();
  }
  function esconderLigue() {
    avisoLigue = false;
    $('aviso-ligue').hidden = true;
    $('seta-ligue').hidden = true;
  }
  function atualizarSetaLigue() {
    const seta = $('seta-ligue');
    if (!avisoLigue || modo !== 'quarto' || quarto.parede !== 'frente' || quarto.girando) { seta.hidden = true; return; }
    const pos = quarto.posicaoNaTela(itemPorId('energia'));
    if (!pos) { seta.hidden = true; return; }
    seta.style.left = `${pos.x}px`;
    seta.style.top = `${pos.y - 6}px`;
    seta.hidden = false;
  }

  // ---------- Teclado (RNF-13) ----------
  window.addEventListener('keydown', (e) => {
    const digitando = e.target instanceof HTMLElement && (e.target.matches('input, textarea, [contenteditable]'));
    if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); alternarFps(); return; }
    if (e.key === 'Escape') {
      if (!menu.hidden) { fecharMenu(true); return; }
      if (!$('aviso-gire').hidden) { continuarEmPe = true; atualizarAvisoGire(); return; }
      if (modo === 'foco') { e.preventDefault(); voltar(); }
      return;
    }
    if (digitando) return;
    if (modo === 'quarto' && menu.hidden && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      girar(e.key === 'ArrowRight' ? 1 : -1);
    }
  });

  // ---------- Gestos ----------
  instalarGestos($('palco'), {
    podeDeslizar: () => modo === 'quarto',
    aoDeslizar: (d) => girar(d),
    podePincar: () => modo === 'foco' && Boolean(itemEmFoco?.tela),
    aoPincar: (fase, g) => {
      if (fase === 'inicio') return quarto.extra;
      const z = limitarZoom(g.base.z * g.fator);
      // O ponto da tela sob os dedos no início continua sob os dedos.
      const ex = g.mx - z * (g.m0x - g.base.ex) / g.base.z;
      const ey = g.my - z * (g.m0y - g.base.ey) / g.base.z;
      const lim = limitarDeslocamento(z, ex, ey, window.innerWidth, window.innerHeight);
      quarto.definirExtra({ z, ...lim });
      return null;
    },
    aoToqueDuplo: () => { if (modo === 'foco') quarto.definirExtra({ z: 1, ex: 0, ey: 0 }); },
  });

  // ---------- Idioma (RF-32) ----------
  function marcarIdioma() {
    for (const b of document.querySelectorAll('[data-idioma]')) b.setAttribute('aria-pressed', String(b.dataset.idioma === i18n.idioma));
    document.documentElement.lang = i18n.idioma === 'pt' ? 'pt-BR' : 'en';
    document.title = i18n.t('site.titulo');
  }
  for (const b of document.querySelectorAll('[data-idioma]')) {
    b.addEventListener('click', () => {
      if (!i18n.trocar(b.dataset.idioma)) return;
      armazenamento.gravar('idioma', i18n.idioma);
      medicao.evento(`idioma-${i18n.idioma}`);
    });
  }
  i18n.aoTrocar(() => {
    aplicarTextos(document, i18n);
    marcarIdioma();
    atualizarNomeParede();
    sistema.traduzir();
    notebook.traduzir();
    quadro.traduzir();
    medalhas.traduzir();
    if (!menu.hidden) montarMenu();
    if (itemEmFoco?.id === 'postits') { conteudoFoco.textContent = ''; conteudoFoco.append(desenharPostits(i18n)); }
    if (!textoPasseio.hidden && passeio.rodando) { /* o próximo passo já vem no idioma novo */ }
  });

  // ---------- Tamanho da tela ----------
  let pedidoQuadro = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(pedidoQuadro);
    pedidoQuadro = requestAnimationFrame(() => {
      if (sistema.definirCompacta(compacta())) quarto.redimensionarTela('pc', sistema.resolucao.w, sistema.resolucao.h);
      quarto.enquadrar(false);
      atualizarSetaLigue();
      atualizarAvisoGire();
    });
  });

  // ---------- Contador de quadros (RNF-01/02, modo de teste: Ctrl+Shift+F) ----------
  let fpsLigado = false;
  function alternarFps() {
    fpsLigado = !fpsLigado;
    const caixa = $('fps');
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
  }

  // ---------- Início ----------
  function comecar() {
    marcarIdioma();
    atualizarNomeParede();
    quarto.enquadrar(false);
    controles.hidden = false;
    const carregamento = $('carregamento');
    carregamento.classList.add('saindo');
    setTimeout(() => { carregamento.hidden = true; }, 450);
    medicao.visita();
    // RF-09 e regras 2 e 3 do passeio.
    if (armazenamento.ler('passeio', (d) => (d === true ? true : null))) {
      passeioAcabou = true;
      definirModo('quarto');
      textoPasseio.textContent = i18n.t('passeio.bemvindo');
      textoPasseio.hidden = false;
      setTimeout(() => { if (modo !== 'passeio') textoPasseio.hidden = true; }, 3000);
      $('palco').focus({ preventScroll: true });
    } else {
      rodarPasseio();
    }
  }

  return {
    comecar,
    clicarItem: (item) => {
      if (emBlecaute && item.tipo === 'energia') return; // Regra 3: botão não responde.
      focar(item);
    },
  };
}

iniciar().catch(() => {
  document.querySelector('.carregamento-caixa').hidden = true;
  $('erro-carregamento').hidden = false;
});
