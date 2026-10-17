// O quarto na tela: paredes, câmera (troca de parede, foco, espiada), itens clicáveis,
// telas em HTML encaixadas e penumbra. Não decide regras: só obedece ao main.js.

import {
  PAREDES, ITENS, LARGURA_PAREDE, ALTURA_PAREDE, PAREDE_INICIAL, VENTOINHAS,
  itensDaParede, indiceParede,
} from './itens.js';
import {
  enquadrarParede, enquadrarFoco, enquadrarEspiada, transformCSS,
  matrizTela, matrix3dCSS, caixaDoQuad,
} from './geometria.js';

const ALVO_MINIMO = 44; // RNF-12: área de toque na tela, em px.

export function criarQuarto({ raiz, i18n, aoClicarItem, reduzirMovimento, tempos }) {
  const paredes = new Map(); // id → { giro, el, img, botoes: Map, telas: Map, escuro }
  let atual = PAREDE_INICIAL;
  let camera = null; // { s, tx, ty }
  let alvoCamera = { tipo: 'parede' }; // 'parede' | { tipo:'foco', item } | { tipo:'espiada', item }
  let girando = null;
  let ventoinhas = null;
  const telasConfig = new Map(); // tela → { item, w, h, slot, acimaPenumbra }
  let extra = { z: 1, ex: 0, ey: 0 }; // Pinça no foco (RF-24), no espaço da tela.

  function tamanhoTela() {
    return { vw: raiz.clientWidth || window.innerWidth, vh: raiz.clientHeight || window.innerHeight };
  }

  function margensFoco(vw, vh, area) {
    // Com tela larga sobra espaço nas laterais para os botões; senão reserva o topo.
    const proporcaoArea = area.w / area.h;
    const larga = vw / vh > proporcaoArea * 1.18;
    // Tela larga: os botões ficam em colunas nas laterais (base.css), fora da tela do item.
    return larga ? { topo: 0, base: 0, lados: 118 } : { topo: 60, base: 0, lados: 0 };
  }

  function calcularCamera(alvo = alvoCamera, paredeId = atual) {
    const { vw, vh } = tamanhoTela();
    const parede = PAREDES[indiceParede(paredeId)];
    const base = enquadrarParede({ vw, vh, w: LARGURA_PAREDE, h: ALTURA_PAREDE, essencial: parede.essencial });
    if (alvo.tipo === 'foco') {
      const area = alvo.item.foco ?? alvo.item.area;
      const m = margensFoco(vw, vh, area);
      return enquadrarFoco({ vw, vh, area, preenchimento: alvo.item.tela ? 0.96 : 0.9, ...m });
    }
    if (alvo.tipo === 'espiada') return enquadrarEspiada(base, alvo.item.area, vw, vh, 1.7);
    return base;
  }

  function aplicarCamera(p, base, animar) {
    const el = p.el;
    const cam = { s: base.s * extra.z, tx: base.tx * extra.z + extra.ex, ty: base.ty * extra.z + extra.ey };
    const ms = animar && !reduzirMovimento() ? tempos.focoMs : 0;
    el.style.setProperty('--foco-ms', `${ms}ms`);
    el.style.setProperty('--s', String(cam.s));
    if (ms > 0) {
      el.classList.add('animando');
      clearTimeout(p.fimAnimacao);
      p.fimAnimacao = setTimeout(() => el.classList.remove('animando'), ms + 50);
    } else {
      el.classList.remove('animando');
    }
    el.style.transform = transformCSS(cam);
    ajustarAlvos(p, cam.s);
  }

  // Cada item tem área de toque de no mínimo 44 × 44 px na tela.
  function ajustarAlvos(p, s) {
    for (const [, b] of p.botoes) {
      const { w, h } = b.item.area;
      const minimo = ALVO_MINIMO / s;
      const aw = Math.max(w, minimo); const ah = Math.max(h, minimo);
      Object.assign(b.alvo.style, {
        left: `${(w - aw) / 2}px`, top: `${(h - ah) / 2}px`, width: `${aw}px`, height: `${ah}px`,
      });
    }
  }

  function posicionarTela(cfg, modoFoco) {
    const { item, w, h, slot } = cfg;
    slot.style.width = `${w}px`;
    slot.style.height = `${h}px`;
    if (modoFoco) {
      // No foco a tela fica sem perspectiva: só escala, para o texto sair nítido.
      const c = caixaDoQuad(item.telaQuad);
      slot.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.w / w}, ${c.h / h})`;
    } else {
      slot.style.transform = matrix3dCSS(matrizTela(w, h, item.telaQuad).matriz);
    }
  }

  function montar() {
    raiz.textContent = '';
    for (const def of PAREDES) {
      const giro = document.createElement('div');
      giro.className = 'giro';
      giro.dataset.parede = def.id;
      const el = document.createElement('div');
      el.className = 'parede';
      const img = document.createElement('img');
      img.className = 'parede-img';
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      img.width = LARGURA_PAREDE;
      img.height = ALTURA_PAREDE;
      el.append(img);
      if (def.provisoria) {
        const aviso = document.createElement('p');
        aviso.className = 'aviso-provisoria';
        aviso.dataset.i18n = 'parede.provisoria';
        el.append(aviso);
      }
      const escuro = document.createElement('div');
      escuro.className = 'escuro';
      el.append(escuro);
      const botoes = new Map();
      for (const item of itensDaParede(def.id)) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'item';
        b.dataset.item = item.id;
        b.dataset.i18nAria = item.tipo === 'energia' ? 'item.energia' : `item.${item.id}`;
        Object.assign(b.style, {
          left: `${item.area.x}px`, top: `${item.area.y}px`, width: `${item.area.w}px`, height: `${item.area.h}px`,
        });
        const alvo = document.createElement('span');
        alvo.className = 'alvo';
        const contorno = document.createElement('span');
        contorno.className = 'contorno';
        b.append(alvo, contorno);
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          aoClicarItem(item);
        });
        el.append(b);
        botoes.set(item.id, { el: b, alvo, item });
      }
      if (VENTOINHAS.parede === def.id) {
        ventoinhas = document.createElement('div');
        ventoinhas.className = 'ventoinhas-off ligado';
        Object.assign(ventoinhas.style, {
          left: `${VENTOINHAS.x}px`, top: `${VENTOINHAS.y}px`, width: `${VENTOINHAS.w}px`, height: `${VENTOINHAS.h}px`,
        });
        el.append(ventoinhas);
      }
      giro.append(el);
      raiz.append(giro);
      paredes.set(def.id, { def, giro, el, img, botoes, escuro, fimAnimacao: 0 });
    }
    mostrarSo(atual);
  }

  function mostrarSo(id) {
    for (const [pid, p] of paredes) {
      const visivel = pid === id;
      if (visivel) {
        delete p.giro.dataset.oculta;
        p.giro.inert = false;
        p.giro.classList.remove('pulsar');
        void p.giro.offsetWidth; // Reinicia o pulso a cada chegada.
        p.giro.classList.add('pulsar');
      } else {
        p.giro.dataset.oculta = '';
        p.giro.inert = true;
        p.giro.classList.remove('pulsar');
      }
    }
  }

  // Carrega as imagens: leve primeiro, nítida depois (seção 6.3).
  function carregarImagens(aoProgresso) {
    const lista = [...paredes.values()];
    let prontas = 0;
    return Promise.all(lista.map((p) => new Promise((resolve, reject) => {
      const primeira = p.def.imagem.leve ?? p.def.imagem.nitido;
      p.img.onload = () => {
        p.img.onload = null;
        prontas += 1;
        aoProgresso(prontas / lista.length);
        resolve();
        if (p.def.imagem.leve) {
          const nitida = new Image();
          nitida.decoding = 'async';
          nitida.onload = () => { p.img.src = nitida.src; };
          nitida.src = p.def.imagem.nitido;
        }
      };
      p.img.onerror = () => reject(new Error(`imagem ${p.def.id}`));
      p.img.src = primeira;
    })));
  }

  // Encaixa um elemento HTML numa tela da ilustração (monitor, notebook, quadro).
  function encaixarTela(item, { w, h, conteudo, acimaPenumbra = false }) {
    const p = paredes.get(item.parede);
    let cfg = telasConfig.get(item.tela);
    if (!cfg) {
      const slot = document.createElement('div');
      slot.className = 'tela-slot anima-tela';
      if (acimaPenumbra) slot.classList.add('acima-penumbra');
      slot.dataset.tela = item.tela;
      slot.inert = true;
      p.el.append(slot); // A ordem de camadas vem do z-index (quarto.css).
      cfg = { item, slot, w, h };
      telasConfig.set(item.tela, cfg);
    }
    cfg.w = w; cfg.h = h;
    cfg.slot.textContent = '';
    cfg.slot.append(conteudo);
    posicionarTela(cfg, false);
    return cfg.slot;
  }

  function redimensionarTela(tela, w, h) {
    const cfg = telasConfig.get(tela);
    if (!cfg) return;
    cfg.w = w; cfg.h = h;
    posicionarTela(cfg, alvoCamera.tipo === 'foco' && alvoCamera.item.tela === tela);
  }

  function escalaTela(tela) {
    const cfg = telasConfig.get(tela);
    if (!cfg) return 1;
    const r = cfg.slot.getBoundingClientRect();
    return r.width / cfg.w || 1;
  }

  function enquadrar(animar = false) {
    const p = paredes.get(atual);
    camera = calcularCamera();
    aplicarCamera(p, camera, animar);
  }

  function girar(direcao, destinoId) {
    if (girando) return girando;
    const de = paredes.get(atual);
    const para = paredes.get(destinoId);
    if (!para || destinoId === atual) return Promise.resolve();
    alvoCamera = { tipo: 'parede' };
    for (const [, cfg] of telasConfig) posicionarTela(cfg, false);
    atual = destinoId;
    camera = calcularCamera();
    aplicarCamera(para, camera, false);
    const ms = reduzirMovimento() ? 0 : tempos.trocaParedeMs;
    if (ms === 0 || !para.giro.animate) {
      mostrarSo(atual);
      return Promise.resolve();
    }
    delete para.giro.dataset.oculta;
    para.giro.inert = false;
    de.giro.inert = true;
    const d = direcao > 0 ? 1 : -1;
    const opts = { duration: ms, easing: 'cubic-bezier(.4, 0, .2, 1)' };
    const sai = de.giro.animate([
      { transform: 'translateX(0) rotateY(0deg)', opacity: 1 },
      { transform: `translateX(${-d * 55}%) rotateY(${d * 38}deg)`, opacity: 0.2 },
    ], opts);
    const entra = para.giro.animate([
      { transform: `translateX(${d * 55}%) rotateY(${-d * 38}deg)`, opacity: 0.2 },
      { transform: 'translateX(0) rotateY(0deg)', opacity: 1 },
    ], opts);
    girando = Promise.all([sai.finished, entra.finished]).catch(() => {}).then(() => {
      sai.cancel(); entra.cancel();
      mostrarSo(atual);
      girando = null;
    });
    return girando;
  }

  function moverCamera(alvo, animar = true) {
    alvoCamera = alvo;
    extra = { z: 1, ex: 0, ey: 0 };
    const p = paredes.get(atual);
    for (const [tela, cfg] of telasConfig) {
      const emFoco = alvo.tipo === 'foco' && alvo.item.tela === tela;
      posicionarTela(cfg, emFoco);
      cfg.slot.inert = !emFoco;
      cfg.slot.classList.toggle('interativa', emFoco);
    }
    for (const [, b] of p.botoes) b.el.classList.toggle('espiado', alvo.tipo === 'espiada' && alvo.item.id === b.item.id);
    camera = calcularCamera();
    aplicarCamera(p, camera, animar);
    const ms = animar && !reduzirMovimento() ? tempos.focoMs : 0;
    return new Promise((r) => setTimeout(r, ms));
  }

  // Penumbra do blecaute: nível 0 (claro) a 0.9 (escuro), em ms.
  function luz(nivel, ms) {
    for (const [, p] of paredes) {
      const anim = p.escuro.animate?.(
        [{ opacity: getComputedStyle(p.escuro).opacity }, { opacity: nivel }],
        { duration: reduzirMovimento() ? 0 : ms, fill: 'forwards', easing: 'ease-in-out' },
      );
      if (!anim) p.escuro.style.opacity = String(nivel);
    }
  }

  function posicaoNaTela(item) {
    // Centro superior do item em px da janela (para a seta "Ligue o PC").
    const p = paredes.get(item.parede);
    if (item.parede !== atual || !camera) return null;
    const r = p.el.getBoundingClientRect();
    const s = r.width / LARGURA_PAREDE;
    return { x: r.left + (item.area.x + item.area.w / 2) * s, y: r.top + item.area.y * s };
  }

  return {
    montar,
    carregarImagens,
    encaixarTela,
    redimensionarTela,
    escalaTela,
    enquadrar,
    get parede() { return atual; },
    get alvo() { return alvoCamera; },
    get girando() { return Boolean(girando); },
    irParaParede(id, direcao = 1) { extra = { z: 1, ex: 0, ey: 0 }; return girar(direcao, id); },
    get extra() { return { ...extra }; },
    definirExtra(novo) {
      extra = { ...novo };
      aplicarCamera(paredes.get(atual), camera ?? calcularCamera(), false);
    },
    focar(item) { return moverCamera({ tipo: 'foco', item }); },
    espiar(item) { return moverCamera({ tipo: 'espiada', item }); },
    paredeInteira(animar = true) { return moverCamera({ tipo: 'parede' }, animar); },
    luz,
    ventoinhas(ligadas) { ventoinhas?.classList.toggle('ligado', ligadas); },
    repulsar() { mostrarSo(atual); },
    posicaoNaTela,
    botao(itemId) {
      for (const [, p] of paredes) { const b = p.botoes.get(itemId); if (b) return b.el; }
      return null;
    },
    itens: ITENS,
  };
}
