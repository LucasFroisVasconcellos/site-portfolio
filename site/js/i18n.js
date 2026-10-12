// Idiomas (ARQ-002, seção 3.7). Todo texto da interface vem de conteudo/pt.json e en.json.

export const IDIOMAS = Object.freeze(['pt', 'en']);

// Regra 1 e 2: escolha salva; senão, português para navegador em português, inglês no resto.
export function idiomaInicial(salvo, linguasNavegador = []) {
  if (IDIOMAS.includes(salvo)) return salvo;
  const primeira = Array.isArray(linguasNavegador) ? linguasNavegador[0] : linguasNavegador;
  return typeof primeira === 'string' && primeira.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export function formatar(modelo, vars = {}) {
  return String(modelo).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function criarI18n(dicionarios, idioma = 'pt') {
  let atual = IDIOMAS.includes(idioma) ? idioma : 'pt';
  const ouvintes = new Set();
  return {
    get idioma() { return atual; },
    t(chave, vars) {
      const txt = dicionarios[atual]?.[chave] ?? dicionarios.pt?.[chave] ?? chave;
      return vars ? formatar(txt, vars) : txt;
    },
    // Campos bilíngues dos arquivos de conteúdo: { pt: '...', en: '...' }.
    campo(obj) {
      if (obj && typeof obj === 'object') return obj[atual] ?? obj.pt ?? '';
      return typeof obj === 'string' ? obj : '';
    },
    trocar(novo) {
      if (!IDIOMAS.includes(novo) || novo === atual) return false;
      atual = novo;
      for (const fn of ouvintes) fn(atual);
      return true;
    },
    aoTrocar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
  };
}

// Aplica textos aos elementos marcados com data-i18n / data-i18n-aria / data-i18n-title.
export function aplicarTextos(raiz, i18n) {
  for (const el of raiz.querySelectorAll('[data-i18n]')) el.textContent = i18n.t(el.dataset.i18n);
  for (const el of raiz.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', i18n.t(el.dataset.i18nAria));
  for (const el of raiz.querySelectorAll('[data-i18n-title]')) el.title = i18n.t(el.dataset.i18nTitle);
}

// "há X" a partir de uma data ISO.
export function tempoRelativo(iso, agora, i18n) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const seg = Math.max(0, Math.round((agora - t) / 1000));
  if (seg < 60) return i18n.t('tempo.agora');
  const min = Math.round(seg / 60);
  if (min < 60) return i18n.t('tempo.min', { n: min });
  const h = Math.round(min / 60);
  if (h < 24) return i18n.t('tempo.h', { n: h });
  const dias = Math.round(h / 24);
  return dias === 1 ? i18n.t('tempo.dia') : i18n.t('tempo.dias', { n: dias });
}
