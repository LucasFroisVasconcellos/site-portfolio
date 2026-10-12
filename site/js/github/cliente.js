// Cliente da API pública do GitHub (ARQ-002, seção 7.3). Sem chave de acesso.
// Ordem de reserva: API nova → cache do aparelho → instantâneo do build → nada.

import {
  validarPerfil, validarListaRepos, validarListaCommits, validarPacote,
  MAX_REPOS_COM_COMMITS, MAX_COMMITS,
} from './validar.js';

const CHAVE_CACHE = 'github';

export function criarClienteGitHub({
  usuario,
  api = 'https://api.github.com',
  buscar = (...a) => globalThis.fetch(...a),
  agora = () => Date.now(),
  agendar = (fn, ms) => setTimeout(fn, ms),
  cancelar = (id) => clearTimeout(id),
  armazenamento = null,
  carregarInstantaneo = async () => null,
  tempoLimite = 8000,
  validade = 10 * 60 * 1000,
  intervaloBotao = 60 * 1000,
} = {}) {
  if (!/^[A-Za-z0-9-]{1,39}$/.test(usuario ?? '')) throw new Error('usuário inválido');

  let suspensoAte = 0;
  let ultimaRodada = -Infinity;
  let rodadaEmCurso = null;
  let controladores = new Set();
  let chamadasFeitas = 0;

  function lerCache() {
    return armazenamento ? armazenamento.ler(CHAVE_CACHE, validarPacote) : null;
  }

  async function chamar(caminho) {
    if (agora() < suspensoAte) throw Object.assign(new Error('limite'), { tipo: 'limite' });
    const ctrl = new AbortController();
    controladores.add(ctrl);
    const timer = agendar(() => ctrl.abort(), tempoLimite); // Regra 3: 8 s por chamada.
    chamadasFeitas += 1;
    try {
      const resp = await buscar(`${api}${caminho}`, {
        signal: ctrl.signal,
        headers: { Accept: 'application/vnd.github+json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (resp.status === 403 || resp.status === 429) {
        const restante = resp.headers?.get?.('x-ratelimit-remaining');
        const reinicio = Number(resp.headers?.get?.('x-ratelimit-reset'));
        if (restante === '0' && Number.isFinite(reinicio) && reinicio > 0) {
          suspensoAte = Math.min(reinicio * 1000, agora() + 2 * 60 * 60 * 1000);
        } else if (resp.status === 429) {
          const espera = Number(resp.headers?.get?.('retry-after'));
          suspensoAte = agora() + (Number.isFinite(espera) && espera > 0 ? Math.min(espera, 3600) : 60) * 1000;
        }
        throw Object.assign(new Error('limite'), { tipo: 'limite' });
      }
      if (!resp.ok) throw Object.assign(new Error(`http ${resp.status}`), { tipo: 'http' });
      const texto = await resp.text();
      if (texto.length > 2_000_000) throw Object.assign(new Error('grande'), { tipo: 'formato' });
      try {
        return JSON.parse(texto);
      } catch {
        throw Object.assign(new Error('json'), { tipo: 'formato' });
      }
    } finally {
      cancelar(timer);
      controladores.delete(ctrl);
    }
  }

  async function rodadaCompleta() {
    // 5 chamadas: perfil, repositórios e commits dos 3 mais recentes.
    const u = encodeURIComponent(usuario);
    const [perfilBruto, reposBrutos] = await Promise.all([
      chamar(`/users/${u}`),
      chamar(`/users/${u}/repos?type=owner&sort=pushed&per_page=30`),
    ]);
    const perfil = validarPerfil(perfilBruto);
    const repos = validarListaRepos(reposBrutos);
    if (!repos) throw Object.assign(new Error('formato'), { tipo: 'formato' });
    const alvos = repos.slice(0, MAX_REPOS_COM_COMMITS);
    const listas = await Promise.all(alvos.map(async (r) => {
      try {
        const bruto = await chamar(`/repos/${u}/${encodeURIComponent(r.nome)}/commits?per_page=5`);
        return validarListaCommits(bruto, r.nome) ?? [];
      } catch (e) {
        if (e?.tipo === 'limite') throw e;
        return []; // Falha de um repositório não derruba os outros.
      }
    }));
    const commits = listas.flat().sort((a, b) => b.data.localeCompare(a.data)).slice(0, MAX_COMMITS);
    return { hora: new Date(agora()).toISOString(), perfil, repos, commits };
  }

  async function reserva(erro) {
    const cache = lerCache();
    if (cache) return { dados: cache, origem: 'cache', erro };
    let inst = null;
    try { inst = validarPacote(await carregarInstantaneo()); } catch { inst = null; }
    if (inst) return { dados: inst, origem: 'instantaneo', erro };
    return { dados: null, origem: 'nenhum', erro };
  }

  async function atualizarAgora() {
    ultimaRodada = agora();
    try {
      const dados = await rodadaCompleta();
      armazenamento?.gravar(CHAVE_CACHE, dados);
      return { dados, origem: 'api', erro: null };
    } catch (e) {
      return reserva(e?.tipo ?? 'rede');
    }
  }

  function rodada() {
    if (!rodadaEmCurso) {
      rodadaEmCurso = atualizarAgora().finally(() => { rodadaEmCurso = null; });
    }
    return rodadaEmCurso;
  }

  return {
    get chamadasFeitas() { return chamadasFeitas; },
    get suspensoAte() { return suspensoAte; },

    // Regra 1: dado com menos de 10 minutos é usado sem nenhuma chamada.
    async abrir() {
      const cache = lerCache();
      if (cache && agora() - Date.parse(cache.hora) < validade) {
        return { dados: cache, origem: 'cache', erro: null };
      }
      return rodada();
    },

    // Regra 2: o botão responde uma vez a cada 60 s.
    async atualizar() {
      if (rodadaEmCurso) return rodadaEmCurso;
      if (agora() - ultimaRodada < intervaloBotao) return { ignorado: true };
      return rodada(); // Durante a suspensão, chamar() recusa sem tocar na rede (regra 4).
    },

    podeAtualizarEm() {
      return Math.max(0, ultimaRodada + intervaloBotao - agora());
    },

    // PC desligou ou janela fechou: cancela o que estiver em andamento.
    cancelarTudo() {
      for (const c of controladores) c.abort();
      controladores = new Set();
    },
  };
}
