// Validação de tudo o que vem da API do GitHub (ARQ-002, seção 7.3).
// Texto de fora é não confiável: aqui ele só é conferido e cortado; a tela o escreve
// sempre com textContent, nunca como HTML (invariante 2).

import { CONFIG } from '../config.js';

export const MAX_REPOS = 30;
export const MAX_COMMITS_POR_REPO = 5;
export const MAX_REPOS_COM_COMMITS = 3;
export const MAX_COMMITS = 15;

function cortar(texto, max) {
  const pontos = Array.from(texto);
  return pontos.length > max ? pontos.slice(0, max).join('') : texto;
}

function textoLimpo(t) {
  // Remove controles invisíveis; mantém o resto como texto.
  return t.replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, ' ');
}

function inteiroNaoNegativo(n) {
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

function dataIso(d) {
  if (typeof d !== 'string' || d.length > 40) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(d)) return null;
  const t = Date.parse(d);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export function urlDoDono(u) {
  if (typeof u !== 'string' || u.length > 500) return null;
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port) return null;
    const dono = `/${CONFIG.github.usuario}`.toLowerCase();
    const p = url.pathname.toLowerCase();
    if (p !== dono && !p.startsWith(`${dono}/`)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function validarPerfil(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  if (typeof p.login !== 'string' || !/^[A-Za-z0-9-]{1,39}$/.test(p.login)) return null;
  const nome = typeof p.name === 'string' ? cortar(textoLimpo(p.name), 100) : '';
  const bio = typeof p.bio === 'string' ? cortar(textoLimpo(p.bio), 200) : '';
  const repos = inteiroNaoNegativo(p.public_repos ?? 0);
  const seguidores = inteiroNaoNegativo(p.followers ?? 0);
  if (repos === null || seguidores === null) return null;
  return { login: p.login, nome, bio, repos, seguidores };
}

export function validarRepo(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  if (r.fork === true || r.private === true) return null; // Regra 5.
  if (typeof r.name !== 'string' || r.name.length < 1 || r.name.length > 100) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(r.name)) return null;
  let descricao = '';
  if (typeof r.description === 'string') descricao = cortar(textoLimpo(r.description), 200);
  else if (r.description !== null && r.description !== undefined) return null;
  let linguagem = '';
  if (typeof r.language === 'string') {
    if (r.language.length > 30) return null;
    linguagem = textoLimpo(r.language);
  } else if (r.language !== null && r.language !== undefined) return null;
  const estrelas = inteiroNaoNegativo(r.stargazers_count ?? 0);
  if (estrelas === null) return null;
  const atualizado = dataIso(r.pushed_at);
  if (!atualizado) return null;
  return { nome: r.name, descricao, linguagem, estrelas, atualizado, url: urlDoDono(r.html_url) };
}

export function validarCommit(c, repo) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const msg = c.commit && typeof c.commit === 'object' ? c.commit.message : null;
  if (typeof msg !== 'string') return null;
  const primeira = cortar(textoLimpo(msg.split(/\r?\n/)[0] ?? '').trim(), 120);
  if (!primeira) return null;
  const autor = c.commit.author && typeof c.commit.author === 'object' ? c.commit.author : {};
  const data = dataIso(autor.date) ?? dataIso(c.commit.committer?.date);
  if (!data) return null;
  if (typeof c.sha !== 'string' || !/^[0-9a-f]{7,64}$/.test(c.sha)) return null;
  return { repo, mensagem: primeira, data, sha: c.sha.slice(0, 7), url: urlDoDono(c.html_url) };
}

export function validarListaRepos(lista) {
  if (!Array.isArray(lista)) return null;
  const saida = [];
  for (const r of lista.slice(0, 500)) {
    const v = validarRepo(r);
    if (v) saida.push(v);
    if (saida.length >= MAX_REPOS) break;
  }
  saida.sort((a, b) => b.atualizado.localeCompare(a.atualizado));
  return saida;
}

export function validarListaCommits(lista, repo) {
  if (!Array.isArray(lista)) return null;
  const saida = [];
  for (const c of lista.slice(0, 100)) {
    const v = validarCommit(c, repo);
    if (v) saida.push(v);
    if (saida.length >= MAX_COMMITS_POR_REPO) break;
  }
  return saida;
}

// Confere um pacote completo (cache do aparelho ou instantâneo). Tudo de novo: A8.
export function validarPacote(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const hora = dataIso(p.hora);
  if (!hora) return null;
  const perfil = p.perfil === null ? null : validarPerfil(p.perfil ? {
    login: p.perfil.login, name: p.perfil.nome, bio: p.perfil.bio,
    public_repos: p.perfil.repos, followers: p.perfil.seguidores,
  } : null);
  if (!Array.isArray(p.repos) || !Array.isArray(p.commits)) return null;
  const repos = [];
  for (const r of p.repos.slice(0, MAX_REPOS)) {
    const v = validarRepo({
      name: r?.nome, description: r?.descricao || null, language: r?.linguagem || null,
      stargazers_count: r?.estrelas, pushed_at: r?.atualizado, html_url: r?.url,
    });
    if (v) repos.push(v);
  }
  const commits = [];
  for (const c of p.commits.slice(0, MAX_COMMITS)) {
    if (!c || typeof c.repo !== 'string' || !repos.some((r) => r.nome === c.repo)) continue;
    const v = validarCommit({
      sha: typeof c.sha === 'string' ? c.sha.padEnd(7, '0') : null,
      commit: { message: c.mensagem, author: { date: c.data } },
      html_url: c.url,
    }, c.repo);
    if (v) commits.push(v);
  }
  return { hora, perfil, repos, commits };
}
