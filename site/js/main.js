// Ponto de entrada: carrega textos e imagens, monta o quarto e liga os módulos de site/js/app/.
//
// Os módulos conversam por um objeto `ctx` compartilhado: cada instalarX(ctx) acrescenta nele
// as funções que os outros chamam (por exemplo ctx.fecharMenu), e o estado do quarto fica em
// ctx.estado. Assim nenhum módulo de app/ importa outro e o grafo não ganha ciclos.

import { CONFIG } from './config.js';
import { criarArmazenamento } from './armazenamento.js';
import { criarI18n, idiomaInicial, aplicarTextos, IDIOMAS } from './i18n.js';
import { criarMedicao } from './medicao.js';
import { criarQuarto } from './quarto.js';
import { ITENS } from './itens.js';
import { ARQUIVOS, carregarJSON, progresso, mostrarErroCarregamento } from './app/carregamento.js';
import { instalarTelas } from './app/telas.js';
import { instalarModos } from './app/modos.js';
import { instalarMenu } from './app/menu.js';
import { instalarPasseio } from './app/passeio-app.js';
import { instalarBlecaute } from './app/blecaute-app.js';
import { instalarTecladoEGestos } from './app/teclado-gestos.js';
import { instalarIdioma } from './app/idioma.js';
import { criarContadorFps } from './app/fps.js';

const $ = (id) => document.getElementById(id);
const L = CONFIG.limites;
const reduzirMovimento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const armazenamento = criarArmazenamento();
const validarIdioma = (d) => (IDIOMAS.includes(d) ? d : null);

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

  // As imagens das paredes começam a baixar junto com os textos, não depois (auditoria de 17/10/2026).
  let app = null;
  const quarto = criarQuarto({
    raiz: $('paredes'), i18n: null, reduzirMovimento, tempos: L,
    aoClicarItem: (item) => app?.clicarItem(item),
  });
  quarto.montar();
  const tempoEsgotado = new Promise((_, rej) => {
    if (estourou) rej(new Error('tempo'));
    ctrl.signal.addEventListener('abort', () => rej(new Error('tempo')));
  });
  tempoEsgotado.catch(() => {});
  const imagens = quarto.carregarImagens(() => passo());
  imagens.catch(() => {});

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

  try {
    await Promise.race([imagens, tempoEsgotado]);
  } catch {
    clearTimeout(limite);
    mostrarErroCarregamento(medicao);
    return;
  }
  clearTimeout(limite);

  app = montarApp({ conteudo, i18n, medicao, quarto });
  app.comecar();
}

function montarApp({ conteudo, i18n, medicao, quarto }) {
  const ctx = {
    estado: {
      modo: 'carregando', passeioAcabou: false, itemEmFoco: null,
      continuarEmPe: false, emBlecaute: false, avisoLigue: false,
    },
    $, L, body: document.body, armazenamento, conteudo, i18n, medicao, quarto,
  };
  // A ordem importa só para quem usa algo na hora da instalação: as telas vêm primeiro.
  instalarTelas(ctx);
  instalarModos(ctx);
  instalarMenu(ctx);
  instalarPasseio(ctx);
  instalarBlecaute(ctx);
  ctx.alternarFps = criarContadorFps($('fps'));
  instalarTecladoEGestos(ctx);
  instalarIdioma(ctx);

  return {
    comecar: () => comecar(ctx),
    clicarItem: (item) => {
      if (ctx.estado.emBlecaute && item.tipo === 'energia') return; // Regra 3: botão não responde.
      // Atalho da lateral: monitor e notebook viram para a parede do PC e abrem (como no "Ir para").
      if (item.tipo === 'atalho') { ctx.irParaItem(ITENS.find((i) => i.id === item.atalho)); return; }
      ctx.focar(item);
    },
  };
}

function comecar(ctx) {
  const { estado, i18n, medicao, quarto } = ctx;
  ctx.marcarIdioma();
  ctx.atualizarNomeParede();
  quarto.enquadrar(false);
  $('controles').hidden = false;
  const carregamento = $('carregamento');
  carregamento.classList.add('saindo');
  setTimeout(() => { carregamento.hidden = true; }, 450);
  medicao.visita();
  // RF-09 e regras 2 e 3 do passeio.
  if (armazenamento.ler('passeio', (d) => (d === true ? true : null))) {
    estado.passeioAcabou = true;
    ctx.definirModo('quarto');
    const textoPasseio = $('texto-passeio');
    textoPasseio.textContent = i18n.t('passeio.bemvindo');
    textoPasseio.hidden = false;
    setTimeout(() => { if (estado.modo !== 'passeio') textoPasseio.hidden = true; }, 3000);
    $('palco').focus({ preventScroll: true });
  } else {
    ctx.rodarPasseio();
  }
}

iniciar().catch(() => {
  document.querySelector('.carregamento-caixa').hidden = true;
  $('erro-carregamento').hidden = false;
});
