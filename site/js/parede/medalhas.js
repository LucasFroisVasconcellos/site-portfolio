// Medalhas em 3D (RF-31). O Three.js só é baixado quando o visitante abre as medalhas.
// Sem luz calculada (RNF-06): o brilho do metal vem pintado na textura.

import { el, botao } from '../dom.js';

const METAIS = {
  ouro: ['#FFF3B0', '#E9B949', '#A8761A'],
  prata: ['#FFFFFF', '#C9CED6', '#7D8590'],
  bronze: ['#F8D2B0', '#C27C3A', '#7A4519'],
};

function quebrarTexto(ctx, texto, largura) {
  const palavras = String(texto).split(/\s+/);
  const linhas = [];
  let linha = '';
  for (const p of palavras) {
    const teste = linha ? `${linha} ${p}` : p;
    if (ctx.measureText(teste).width > largura && linha) { linhas.push(linha); linha = p; } else linha = teste;
  }
  if (linha) linhas.push(linha);
  return linhas.slice(0, 4);
}

// Desenha a face da medalha num canvas (marcação até chegarem as fotos reais).
export function desenharFace(medalha, lado, i18n, tamanho = 512) {
  const c = document.createElement('canvas');
  c.width = tamanho; c.height = tamanho;
  const ctx = c.getContext('2d');
  const [claro, medio, escuro] = METAIS[medalha.metal] ?? METAIS.ouro;
  const r = tamanho / 2;
  const g = ctx.createRadialGradient(r * 0.7, r * 0.6, r * 0.1, r, r, r);
  g.addColorStop(0, claro); g.addColorStop(0.55, medio); g.addColorStop(1, escuro);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, tamanho, tamanho);
  ctx.strokeStyle = escuro; ctx.lineWidth = tamanho * 0.025;
  ctx.beginPath(); ctx.arc(r, r, r * 0.84, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.arc(r, r, r * 0.78, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = escuro;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (lado === 'frente') {
    const texto = i18n.campo(medalha.colocacao).toUpperCase().slice(0, 12);
    let fonte = tamanho * 0.17;
    ctx.font = `800 ${fonte}px system-ui, sans-serif`;
    while (ctx.measureText(texto).width > tamanho * 0.58 && fonte > 12) {
      fonte -= 2;
      ctx.font = `800 ${fonte}px system-ui, sans-serif`;
    }
    ctx.fillText(texto, r, r * 0.92);
    ctx.font = `700 ${tamanho * 0.08}px system-ui, sans-serif`;
    ctx.fillText(medalha.ano ? String(medalha.ano) : '★ ★ ★', r, r * 1.32);
  } else {
    ctx.font = `700 ${tamanho * 0.075}px system-ui, sans-serif`;
    const linhas = quebrarTexto(ctx, i18n.campo(medalha.competicao), tamanho * 0.6);
    linhas.forEach((l, i) => ctx.fillText(l, r, r + (i - (linhas.length - 1) / 2) * tamanho * 0.1));
  }
  return c;
}

function fitaCanvas(cor) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = cor; ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(52, 0, 24, 256);
  const sombra = ctx.createLinearGradient(0, 0, 128, 0);
  sombra.addColorStop(0, 'rgba(0,0,0,.25)'); sombra.addColorStop(0.5, 'rgba(0,0,0,0)'); sombra.addColorStop(1, 'rgba(0,0,0,.25)');
  ctx.fillStyle = sombra; ctx.fillRect(0, 0, 128, 256);
  return c;
}

export function temWebGL2() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    const ok = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export function criarPainelMedalhas({ i18n, conteudo, medicao }) {
  const medalhas = conteudo.medalhas;
  let atual = 0;
  let cena = null; // { THREE, renderer, scene, camera, grupo, ... }
  let fechado = false;

  const palco = el('div', { classe: 'medalha-palco' });
  const dica = el('p', { classe: 'medalha-dica' });
  const info = el('dl', { classe: 'medalha-info' });
  const seletor = el('div', { classe: 'medalha-seletor', attrs: { role: 'group' } });
  const nota = el('p', { classe: 'medalha-nota' });
  const painel = el('div', { classe: 'medalha-painel' },
    el('div', { classe: 'medalha-visual' }, palco, dica),
    el('div', { classe: 'medalha-lado' }, info, seletor, nota));

  function desenharInfo() {
    const m = medalhas[atual];
    info.textContent = '';
    info.append(
      el('dt', { texto: i18n.t('medalha.competicao') }), el('dd', { texto: i18n.campo(m.competicao) }),
      el('dt', { texto: i18n.t('medalha.colocacao') }), el('dd', { texto: i18n.campo(m.colocacao) }),
      el('dt', { texto: i18n.t('medalha.ano') }), el('dd', { texto: m.ano ? String(m.ano) : '—' }));
    seletor.setAttribute('aria-label', i18n.t('medalha.escolher'));
    seletor.textContent = '';
    medalhas.forEach((x, i) => {
      seletor.append(el('button', {
        classe: `medalha-opcao metal-${x.metal}`, attrs: { type: 'button', 'aria-pressed': String(i === atual), 'aria-label': `${i18n.campo(x.colocacao)} · ${i18n.campo(x.competicao)}` },
        estilo: { '--fita': x.fita },
        on: { click: () => escolher(i) },
      }, el('span', { classe: 'medalha-bolinha', attrs: { 'aria-hidden': 'true' } })));
    });
    dica.textContent = cena?.sem3d ? i18n.t('medalha.sem3d') : i18n.t('medalha.arraste');
    nota.textContent = i18n.t('medalha.marcacao');
  }

  function aplicarTexturas() {
    if (!cena || cena.sem3d) return;
    const { THREE } = cena;
    const m = medalhas[atual];
    for (const t of cena.texturas) t.dispose();
    const frente = new THREE.CanvasTexture(desenharFace(m, 'frente', i18n));
    const verso = new THREE.CanvasTexture(desenharFace(m, 'verso', i18n));
    const fita = new THREE.CanvasTexture(fitaCanvas(m.fita));
    for (const t of [frente, verso, fita]) t.colorSpace = THREE.SRGBColorSpace;
    cena.texturas = [frente, verso, fita];
    cena.matFrente.map = frente; cena.matFrente.needsUpdate = true;
    cena.matVerso.map = verso; cena.matVerso.needsUpdate = true;
    cena.matFita.map = fita; cena.matFita.needsUpdate = true;
    const [, medio, escuro] = METAIS[m.metal] ?? METAIS.ouro;
    cena.matLado.color.set(escuro).lerp(new THREE.Color(medio), 0.4);
    desenhar();
  }

  function desenhar() {
    if (!cena || cena.sem3d || fechado) return;
    cena.renderer.render(cena.scene, cena.camera);
  }

  function ajustarTamanho() {
    if (!cena) return;
    const w = Math.max(1, palco.clientWidth); const h = Math.max(1, palco.clientHeight);
    if (cena.sem3d) {
      const lado = Math.min(w, h);
      cena.canvas2d.style.width = `${lado}px`; cena.canvas2d.style.height = `${lado}px`;
      return;
    }
    cena.renderer.setSize(w, h, false);
    cena.camera.aspect = w / h;
    cena.camera.updateProjectionMatrix();
    desenhar();
  }

  function modo2D() {
    const m = medalhas[atual];
    const c = desenharFace(m, 'frente', i18n);
    c.className = 'medalha-2d';
    palco.textContent = '';
    palco.append(c);
    cena = { sem3d: true, canvas2d: c };
    ajustarTamanho();
    desenharInfo();
  }

  async function montar3D() {
    if (!temWebGL2()) { medicao.evento('sem-3d'); modo2D(); return; }
    let THREE;
    try {
      THREE = await import('../../vendor/three/three.module.js');
    } catch {
      modo2D();
      return;
    }
    if (fechado) return;
    const canvas = el('canvas', { classe: 'medalha-canvas', attrs: { 'aria-hidden': 'true' } });
    palco.textContent = '';
    palco.append(canvas);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      modo2D();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // Seção 6.5.
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0.55, 5.6);
    camera.lookAt(0, 0.55, 0);
    const grupo = new THREE.Group();
    const matLado = new THREE.MeshBasicMaterial({ color: '#b08a2e' });
    const matFrente = new THREE.MeshBasicMaterial();
    const matVerso = new THREE.MeshBasicMaterial();
    const matFita = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.14, 72), [matLado, matFrente, matVerso]);
    disco.rotation.x = Math.PI / 2;
    // A tampa de cima do cilindro vira a frente; o giro de 90° deixa o texto em pé.
    disco.rotation.y = Math.PI / 2;
    const fita = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.7), matFita);
    fita.position.set(0, 1.75, -0.02);
    const argola = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 12, 32), matLado);
    argola.position.set(0, 1.02, 0);
    grupo.add(disco, fita, argola);
    grupo.rotation.y = 0.45;
    scene.add(grupo);
    cena = { THREE, renderer, scene, camera, grupo, matLado, matFrente, matVerso, matFita, texturas: [], canvas, sem3d: false };
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); modo2D(); });
    aplicarTexturas();
    ajustarTamanho();
    desenharInfo();
  }

  // Girar com o dedo ou o mouse; só desenha quando algo muda (RNF-08).
  let arraste = null;
  palco.addEventListener('pointerdown', (e) => {
    if (!cena || cena.sem3d) return;
    arraste = { x: e.clientX, y: e.clientY, ry: cena.grupo.rotation.y, rx: cena.grupo.rotation.x, id: e.pointerId };
    palco.setPointerCapture(e.pointerId);
  });
  palco.addEventListener('pointermove', (e) => {
    if (!arraste || e.pointerId !== arraste.id) return;
    cena.grupo.rotation.y = arraste.ry + (e.clientX - arraste.x) * 0.012;
    cena.grupo.rotation.x = Math.max(-0.5, Math.min(0.5, arraste.rx + (e.clientY - arraste.y) * 0.006));
    desenhar();
  });
  const soltar = () => { arraste = null; };
  palco.addEventListener('pointerup', soltar);
  palco.addEventListener('pointercancel', soltar);
  palco.addEventListener('keydown', (e) => {
    if (!cena || cena.sem3d) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      cena.grupo.rotation.y += e.key === 'ArrowLeft' ? -0.3 : 0.3;
      desenhar();
    }
  });
  palco.tabIndex = 0;

  function escolher(i) {
    atual = i;
    if (cena?.sem3d) modo2D(); else { aplicarTexturas(); if (cena) cena.grupo.rotation.set(0, 0.45, 0); desenhar(); }
    desenharInfo();
  }

  const aoRedimensionar = () => ajustarTamanho();

  return {
    el: painel,
    async abrir() {
      fechado = false;
      desenharInfo();
      window.addEventListener('resize', aoRedimensionar);
      await montar3D();
      requestAnimationFrame(() => ajustarTamanho());
    },
    fechar() {
      fechado = true;
      window.removeEventListener('resize', aoRedimensionar);
      if (cena && !cena.sem3d) {
        for (const t of cena.texturas) t.dispose();
        cena.scene.traverse((o) => { o.geometry?.dispose?.(); });
        cena.renderer.dispose();
      }
      cena = null;
    },
    traduzir() { desenharInfo(); if (cena?.sem3d) modo2D(); else aplicarTexturas(); },
  };
}
