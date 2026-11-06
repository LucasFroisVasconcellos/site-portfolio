// Tela de carregamento: arquivos de conteúdo, barra de progresso e mensagem de erro (RF-07).

const $ = (id) => document.getElementById(id);

export const ARQUIVOS = {
  pt: 'conteudo/pt.json', en: 'conteudo/en.json', projetos: 'conteudo/projetos.json',
  fotos: 'conteudo/fotos.json', medalhas: 'conteudo/medalhas.json',
  instagram: 'conteudo/instagram.json', linkedin: 'conteudo/linkedin.json',
};

export async function carregarJSON(url, signal) {
  const r = await fetch(url, { signal, credentials: 'same-origin' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export function progresso(fracao) {
  const pct = Math.round(Math.min(1, Math.max(0, fracao)) * 100);
  $('barra-preenchida').style.width = `${pct}%`;
  $('porcentagem').textContent = `${pct}%`;
  $('barra-progresso').setAttribute('aria-valuenow', String(pct));
}

export function mostrarErroCarregamento(medicao) {
  document.querySelector('.carregamento-caixa').hidden = true;
  $('erro-carregamento').hidden = false;
  $('btn-tentar').focus();
  medicao?.evento('erro-carregamento');
}
