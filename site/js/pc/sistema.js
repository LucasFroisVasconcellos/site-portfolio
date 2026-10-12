// Sistema virtual do monitor (ARQ-002, seções 3.4, 3.5, 7.1 e 7.2): tela de cada estado,
// área de trabalho, janelas e barra de tarefas. Os aplicativos ficam em pc/apps.js.

import { el, icone, botao } from '../dom.js';

export const RESOLUCAO = Object.freeze({
  normal: { w: 1200, h: 720, barra: 44, titulo: 36 },
  compacta: { w: 800, h: 480, barra: 48, titulo: 48 },
});
const VISIVEL_MINIMO = 48; // Regra 3: 48 px da barra de título sempre dentro da tela.

export function limitarPosicao(x, y, w, h, tela) {
  const xMin = VISIVEL_MINIMO - w;
  const xMax = tela.w - VISIVEL_MINIMO;
  const yMax = tela.h - tela.barra - tela.titulo;
  return {
    x: Math.round(Math.min(xMax, Math.max(xMin, x))),
    y: Math.round(Math.min(Math.max(0, yMax), Math.max(0, y))),
  };
}

export function criarSistema({ i18n, energia, escala, aoLigarPeloMonitor, aoEvento }) {
  let res = RESOLUCAO.normal;
  let compacta = false;
  const janelas = new Map(); // id → janela
  let z = 10;
  let apps = new Map(); // id → { titulo(), icone, montar(corpo, ctx), tamanho, aoFechar? }
  let relogioTimer = null;
  let menuAberto = false;

  const raiz = el('div', { classe: 'pc', attrs: { role: 'application', 'aria-roledescription': 'PC virtual' } });
  const telaDesligado = el('div', { classe: 'pc-tela pc-desligado' });
  const botaoLigarTela = el('button', {
    classe: 'pc-botao-ligar', attrs: { type: 'button', 'data-i18n-aria': 'energia.ligar' },
    on: { click: () => aoLigarPeloMonitor() },
  }, icone('energia', 'pc-icone-energia'));
  telaDesligado.append(botaoLigarTela);
  const telaBoot = el('div', { classe: 'pc-tela pc-boot' },
    icone('logo-os', 'pc-logo'),
    el('p', { classe: 'pc-nome-os', texto: i18n.t('pc.nome'), attrs: { translate: 'no' } }),
    el('div', { classe: 'pc-girando', attrs: { 'aria-hidden': 'true' } }),
    el('p', { classe: 'pc-boot-texto', dados: { i18n: 'pc.iniciando' } }));
  const telaDesligando = el('div', { classe: 'pc-tela pc-desligando' },
    el('div', { classe: 'pc-girando', attrs: { 'aria-hidden': 'true' } }),
    el('p', { dados: { i18n: 'pc.desligando' } }));

  const areaIcones = el('div', { classe: 'pc-icones', attrs: { role: 'list' } });
  const areaJanelas = el('div', { classe: 'pc-janelas' });
  const menu = el('div', { classe: 'pc-menu', attrs: { role: 'menu', hidden: true } });
  const btnMenu = el('button', {
    classe: 'pc-btn-menu', attrs: { type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
    on: { click: (e) => { e.stopPropagation(); alternarMenu(); } },
  }, icone('logo-os', 'pc-btn-menu-logo'), el('span', { dados: { i18n: 'pc.menu' } }));
  const tarefas = el('div', { classe: 'pc-tarefas' });
  const relogio = el('time', { classe: 'pc-relogio' });
  const btnDesligar = el('button', {
    classe: 'pc-btn-desligar', attrs: { type: 'button', 'data-i18n-aria': 'pc.desligarMenu', 'data-i18n-title': 'pc.desligarMenu' },
    on: { click: () => energia.desligarPeloMenu() },
  }, icone('energia', 'pc-icone-energia-p'));
  const barra = el('div', { classe: 'pc-barra', attrs: { role: 'toolbar', 'data-i18n-aria': 'pc.barra' } }, btnMenu, tarefas, relogio, btnDesligar);
  const desktop = el('div', { classe: 'pc-tela pc-desktop', attrs: { 'data-i18n-aria': 'pc.areaTrabalho' } }, areaIcones, areaJanelas, menu, barra);
  desktop.addEventListener('pointerdown', (e) => { if (menuAberto && !menu.contains(e.target) && !btnMenu.contains(e.target)) fecharMenu(); });

  raiz.append(telaDesligado, telaBoot, telaDesligando, desktop);

  function aplicarResolucao() {
    raiz.style.width = `${res.w}px`;
    raiz.style.height = `${res.h}px`;
    raiz.classList.toggle('compacta', compacta);
    raiz.style.setProperty('--barra', `${res.barra}px`);
    raiz.style.setProperty('--titulo', `${res.titulo}px`);
    for (const j of janelas.values()) {
      if (compacta) j.max = true;
      encaixar(j);
    }
  }

  function atualizarRelogio() {
    // Hora do aparelho do visitante (RF-17).
    const d = new Date();
    relogio.textContent = d.toLocaleTimeString(i18n.idioma === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    relogio.dateTime = d.toISOString();
  }

  function ligarRelogio(ligar) {
    clearInterval(relogioTimer);
    relogioTimer = null;
    if (ligar) { atualizarRelogio(); relogioTimer = setInterval(atualizarRelogio, 15000); }
  }

  function montarIcones() {
    areaIcones.textContent = '';
    for (const [id, app] of apps) {
      if (app.semIcone) continue;
      areaIcones.append(el('button', {
        classe: 'pc-icone-app', attrs: { type: 'button', role: 'listitem' }, dados: { app: id },
        on: { click: () => abrir(id) },
      }, icone(app.icone), el('span', { texto: app.titulo() })));
    }
  }

  function montarMenu() {
    menu.textContent = '';
    for (const [id, app] of apps) {
      if (app.semIcone) continue;
      menu.append(el('button', {
        classe: 'pc-menu-item', attrs: { type: 'button', role: 'menuitem' },
        on: { click: () => { fecharMenu(); abrir(id); } },
      }, icone(app.icone, 'pc-menu-icone'), el('span', { texto: app.titulo() })));
    }
    menu.append(el('hr'), el('button', {
      classe: 'pc-menu-item', attrs: { type: 'button', role: 'menuitem' },
      on: { click: () => { fecharMenu(); energia.desligarPeloMenu(); } },
    }, icone('energia', 'pc-menu-icone pc-menu-icone-energia'), el('span', { texto: i18n.t('pc.desligarMenu') })));
  }

  function alternarMenu() { if (menuAberto) fecharMenu(); else { menuAberto = true; menu.hidden = false; btnMenu.setAttribute('aria-expanded', 'true'); } }
  function fecharMenu() { menuAberto = false; menu.hidden = true; btnMenu.setAttribute('aria-expanded', 'false'); }

  function trazerParaFrente(j) {
    z += 1;
    j.el.style.zIndex = String(z);
    for (const o of janelas.values()) o.el.classList.toggle('ativa', o === j);
    atualizarTarefas();
  }

  function encaixar(j) {
    if (j.max) {
      Object.assign(j.el.style, { left: '0px', top: '0px', width: `${res.w}px`, height: `${res.h - res.barra}px` });
    } else {
      j.w = Math.min(j.w, res.w); j.h = Math.min(j.h, res.h - res.barra);
      const p = limitarPosicao(j.x, j.y, j.w, j.h, res);
      j.x = p.x; j.y = p.y;
      Object.assign(j.el.style, { left: `${j.x}px`, top: `${j.y}px`, width: `${j.w}px`, height: `${j.h}px` });
    }
    j.el.classList.toggle('maximizada', j.max);
    j.btnMax.setAttribute('aria-label', i18n.t(j.max ? 'pc.restaurar' : 'pc.maximizar'));
    j.btnMax.title = j.btnMax.getAttribute('aria-label');
    j.btnMax.classList.toggle('restaurar', j.max);
  }

  function atualizarTarefas() {
    tarefas.textContent = '';
    for (const j of janelas.values()) {
      tarefas.append(el('button', {
        classe: `pc-tarefa${j.min ? ' minimizada' : ''}${j.el.classList.contains('ativa') && !j.min ? ' ativa' : ''}`,
        attrs: { type: 'button', 'aria-pressed': String(!j.min) },
        on: {
          click: () => {
            if (j.min) { j.min = false; j.el.hidden = false; trazerParaFrente(j); } else if (j.el.classList.contains('ativa')) { minimizar(j); } else trazerParaFrente(j);
          },
        },
      }, icone(j.app.icone, 'pc-tarefa-icone'), el('span', { texto: j.app.titulo(j.param) })));
    }
  }

  function minimizar(j) {
    j.min = true;
    j.el.hidden = true;
    j.el.classList.remove('ativa');
    atualizarTarefas();
  }

  function fechar(id) {
    const j = janelas.get(id);
    if (!j) return;
    j.geracao += 1;
    j.app.aoFechar?.(j);
    j.el.remove();
    janelas.delete(id);
    atualizarTarefas();
  }

  function arrastar(j, titulo) {
    let inicio = null;
    titulo.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || j.max) return;
      e.preventDefault();
      trazerParaFrente(j);
      inicio = { px: e.clientX, py: e.clientY, x: j.x, y: j.y, k: escala() || 1, id: e.pointerId };
      titulo.setPointerCapture(e.pointerId);
    });
    titulo.addEventListener('pointermove', (e) => {
      if (!inicio || e.pointerId !== inicio.id) return;
      const p = limitarPosicao(inicio.x + (e.clientX - inicio.px) / inicio.k, inicio.y + (e.clientY - inicio.py) / inicio.k, j.w, j.h, res);
      j.x = p.x; j.y = p.y;
      j.el.style.left = `${j.x}px`;
      j.el.style.top = `${j.y}px`;
    });
    const soltar = (e) => { if (inicio && e.pointerId === inicio.id) inicio = null; };
    titulo.addEventListener('pointerup', soltar);
    titulo.addEventListener('pointercancel', soltar);
    titulo.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) { j.max = !j.max; encaixar(j); } });
  }

  // Regra 1: cada aplicativo abre uma única janela; abrir de novo traz para a frente.
  function abrir(id, param = null) {
    const chave = param ? `${id}:${param}` : id;
    const app = apps.get(id);
    if (!app || energia.estado !== 'ligado') return null;
    const existente = janelas.get(chave);
    if (existente) {
      existente.min = false;
      existente.el.hidden = false;
      trazerParaFrente(existente);
      return existente;
    }
    const tam = app.tamanho ?? { w: 640, h: 440 };
    const n = janelas.size;
    const j = {
      id: chave, app, param, geracao: 0,
      x: 60 + n * 36, y: 24 + n * 28, w: tam.w, h: tam.h, min: false, max: compacta,
    };
    const tituloTexto = el('span', { classe: 'pc-janela-titulo-texto', texto: app.titulo(param) });
    j.btnMin = botao('', () => minimizar(j), 'pc-jbtn pc-jbtn-min', { 'aria-label': i18n.t('pc.minimizar'), title: i18n.t('pc.minimizar') });
    j.btnMax = botao('', () => { j.max = !j.max; encaixar(j); }, 'pc-jbtn pc-jbtn-max');
    j.btnFechar = botao('', () => fechar(chave), 'pc-jbtn pc-jbtn-fechar', { 'aria-label': i18n.t('pc.fechar'), title: i18n.t('pc.fechar') });
    const titulo = el('div', { classe: 'pc-janela-titulo' }, icone(app.icone, 'pc-janela-icone'), tituloTexto, el('div', { classe: 'pc-janela-botoes' }, j.btnMin, j.btnMax, j.btnFechar));
    const corpo = el('div', { classe: 'pc-janela-corpo' });
    j.el = el('section', { classe: 'pc-janela', attrs: { role: 'dialog', 'aria-label': app.titulo(param) } }, titulo, corpo);
    j.el.addEventListener('pointerdown', () => trazerParaFrente(j));
    j.corpo = corpo;
    j.tituloTexto = tituloTexto;
    arrastar(j, titulo);
    areaJanelas.append(j.el);
    janelas.set(chave, j);
    encaixar(j);
    trazerParaFrente(j);
    const ctx = {
      geracao: () => j.geracao,
      aberta: () => janelas.get(chave) === j,
      abrir,
      fechar: () => fechar(chave),
    };
    j.ctx = ctx;
    app.montar(corpo, ctx, param);
    if (app.evento) aoEvento(app.evento);
    return j;
  }

  function fecharTodas() {
    for (const id of [...janelas.keys()]) fechar(id);
  }

  function mostrarEstado(estado) {
    raiz.dataset.estado = estado;
    telaDesligado.hidden = estado !== 'desligado';
    telaBoot.hidden = estado !== 'iniciando';
    telaDesligando.hidden = estado !== 'desligando';
    desktop.hidden = estado !== 'ligado';
    if (estado === 'desligado') { fecharTodas(); fecharMenu(); }
    if (estado === 'desligando') fecharMenu();
    ligarRelogio(estado === 'ligado');
  }

  function traduzir() {
    for (const n of raiz.querySelectorAll('[data-i18n]')) n.textContent = i18n.t(n.dataset.i18n);
    for (const n of raiz.querySelectorAll('[data-i18n-aria]')) n.setAttribute('aria-label', i18n.t(n.dataset.i18nAria));
    for (const n of raiz.querySelectorAll('[data-i18n-title]')) n.title = i18n.t(n.dataset.i18nTitle);
    montarIcones();
    montarMenu();
    atualizarRelogio();
    for (const j of janelas.values()) {
      j.tituloTexto.textContent = j.app.titulo(j.param);
      j.el.setAttribute('aria-label', j.app.titulo(j.param));
      j.btnMin.setAttribute('aria-label', i18n.t('pc.minimizar'));
      j.btnFechar.setAttribute('aria-label', i18n.t('pc.fechar'));
      encaixar(j);
      // Trocar o idioma não fecha janelas (seção 3.7): só redesenha o conteúdo.
      j.geracao += 1; // Respostas pedidas pelo desenho anterior são descartadas.
      j.corpo.textContent = '';
      j.app.montar(j.corpo, j.ctx, j.param);
    }
    atualizarTarefas();
  }

  return {
    el: raiz,
    get resolucao() { return res; },
    get janelasAbertas() { return [...janelas.keys()]; },
    registrar(id, app) { apps.set(id, app); },
    iniciar() { montarIcones(); montarMenu(); aplicarResolucao(); mostrarEstado(energia.estado); traduzir(); },
    definirCompacta(sim) {
      if (sim === compacta) return false;
      compacta = sim;
      res = sim ? RESOLUCAO.compacta : RESOLUCAO.normal;
      aplicarResolucao();
      return true;
    },
    mostrarEstado,
    abrir,
    fechar,
    traduzir,
    pausar() { ligarRelogio(false); },
    retomar() { ligarRelogio(energia.estado === 'ligado'); },
  };
}
