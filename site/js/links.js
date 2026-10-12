// Único lugar que abre endereço externo (ARQ-002, seção 7.8; invariante 3).

import { CONFIG } from './config.js';

function analisar(url) {
  if (typeof url !== 'string' || url.length > 4000) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    return u;
  } catch {
    return null;
  }
}

function ehGithubDoDono(u) {
  if (u.hostname !== 'github.com') return false;
  const dono = `/${CONFIG.github.usuario}`.toLowerCase();
  const caminho = u.pathname.toLowerCase();
  return caminho === dono || caminho === `${dono}/` || caminho.startsWith(`${dono}/`);
}

function ehWhatsApp(u) {
  if (u.hostname !== 'wa.me' || u.pathname !== `/${CONFIG.whatsapp}` || u.hash) return false;
  const chaves = [...u.searchParams.keys()];
  return chaves.length === 0 || (chaves.length === 1 && chaves[0] === 'text');
}

function ehExato(u, alvo) {
  const a = new URL(alvo);
  return u.hostname === a.hostname && (u.pathname === a.pathname || `${u.pathname}/` === a.pathname) && !u.search && !u.hash;
}

// Devolve o destino ('github', 'whatsapp', ...) ou null se o endereço não está na lista.
export function destinoPermitido(url) {
  const u = analisar(url);
  if (!u) return null;
  if (ehGithubDoDono(u)) return 'github';
  if (ehWhatsApp(u)) return 'whatsapp';
  if (ehExato(u, CONFIG.instagram)) return 'instagram';
  if (ehExato(u, CONFIG.linkedin)) return 'linkedin';
  if (CONFIG.dominiosProjetos.includes(u.hostname) && u.hostname !== 'github.com') return 'projeto';
  return null;
}

export function linkPermitido(url) {
  return destinoPermitido(url) !== null;
}

// Abre em nova aba, sem dar à página aberta acesso a esta (A5).
export function abrirExterno(url, janela = globalThis.window) {
  if (!linkPermitido(url) || !janela) return false;
  janela.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

// Cria um <a> seguro; se o endereço não for permitido, devolve um <span> com o texto.
export function criarLink(doc, url, texto, classe = '') {
  if (!linkPermitido(url)) {
    const s = doc.createElement('span');
    s.textContent = texto;
    return s;
  }
  const a = doc.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = texto;
  if (classe) a.className = classe;
  return a;
}
