// Medição de visitas e cliques (ARQ-002, seção 6.7). Sem cookies, sem script de terceiros.
// Cada evento leva só o nome: nada digitado pelo visitante sai por aqui (A12).

import { CONFIG } from './config.js';

export const EVENTOS = Object.freeze(new Set([
  'passeio-fim', 'passeio-pulado',
  'abrir-postit', 'abrir-pc', 'abrir-notebook', 'abrir-quadro', 'abrir-medalha',
  'app-github', 'app-projetos', 'app-leiame',
  'app-whatsapp', 'app-instagram', 'app-linkedin',
  'pc-ligar', 'pc-desligar', 'blecaute',
  'sair-github', 'sair-instagram', 'sair-linkedin', 'sair-whatsapp', 'sair-projeto',
  'idioma-pt', 'idioma-en',
  'sem-3d', 'erro-carregamento',
]));

export function eventoValido(nome) {
  return typeof nome === 'string' && EVENTOS.has(nome);
}

export function criarMedicao({
  config = CONFIG.umami,
  host = globalThis.location?.hostname ?? '',
  buscar = (...a) => globalThis.fetch?.(...a),
  idioma = () => 'pt',
} = {}) {
  const ligada = Boolean(config.idSite) && config.hostsProducao.includes(host);

  function enviar(payload) {
    if (!ligada) return false;
    try {
      const p = buscar(config.endereco, {
        method: 'POST',
        keepalive: true,
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'event', payload }),
      });
      p?.catch?.(() => {});
    } catch { /* a medição nunca derruba o site */ }
    return true;
  }

  const base = () => ({ website: config.idSite, hostname: host, url: '/', language: idioma() });

  return {
    get ligada() { return ligada; },
    visita() { return enviar(base()); },
    evento(nome) {
      if (!eventoValido(nome)) return false;
      return enviar({ ...base(), name: nome });
    },
  };
}
