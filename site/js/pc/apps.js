// Aplicativos do PC virtual: GitHub (seção 7.3), Projetos e Leia-me (seção 7.4).

import { el, icone, botao } from '../dom.js';
import { abrirExterno, criarLink, linkPermitido } from '../links.js';
import { tempoRelativo } from '../i18n.js';
import { CONFIG } from '../config.js';

export function registrarApps(sistema, { i18n, energia, cliente, conteudo, medicao }) {
  const t = (k, v) => i18n.t(k, v);

  sistema.registrar('github', {
    titulo: () => t('app.github'),
    icone: 'github',
    evento: 'app-github',
    tamanho: { w: 780, h: 520 },
    aoFechar: () => cliente.cancelarTudo(),
    montar(corpo, ctx) {
      const caixa = el('div', { classe: 'gh' });
      corpo.append(caixa);
      const desenhar = (r) => desenharGitHub(caixa, r, ctx);
      caixa.append(el('p', { classe: 'gh-carregando', texto: t('gh.carregando'), attrs: { role: 'status' } }));
      pedir(() => cliente.abrir(), ctx, desenhar);
    },
  });

  // Invariante 7: uma resposta atrasada nunca altera a tela de um estado mais novo.
  function pedir(fn, ctx, desenhar) {
    const g = ctx.geracao();
    const e = energia.geracao;
    fn().then((r) => {
      if (ctx.geracao() !== g || !ctx.aberta() || energia.geracao !== e || energia.estado !== 'ligado') return;
      desenhar(r);
    }).catch(() => {});
  }

  function desenharGitHub(caixa, r, ctx) {
    caixa.textContent = '';
    const agora = Date.now();
    const dados = r.dados;
    const p = dados?.perfil;
    const cabecalho = el('header', { classe: 'gh-cabecalho' },
      icone('github', 'gh-avatar'),
      el('div', { classe: 'gh-quem' },
        el('strong', { texto: p?.nome || CONFIG.github.usuario, attrs: { translate: 'no' } }),
        el('span', { classe: 'gh-login', texto: `@${p?.login || CONFIG.github.usuario}`, attrs: { translate: 'no' } }),
        p?.bio ? el('span', { classe: 'gh-bio', texto: p.bio }) : null,
        p ? el('span', { classe: 'gh-contagem', texto: `${t('gh.reposPublicos', { n: p.repos })} · ${t('gh.seguidores', { n: p.seguidores })}` }) : null),
      el('div', { classe: 'gh-acoes' },
        botao(t('gh.abrir'), () => { if (abrirExterno(CONFIG.github.perfil)) medicao.evento('sair-github'); }, 'pc-botao pc-botao-principal'),
        botaoAtualizar(caixa, ctx)));
    caixa.append(cabecalho, el('p', { classe: 'gh-simulacao', texto: t('gh.simulacao') }));

    if (!dados) {
      caixa.append(el('div', { classe: 'gh-vazio' },
        el('p', { texto: t('gh.vazio') }),
        botaoAtualizar(caixa, ctx, 'gh.tentar'),
        botao(t('gh.abrir'), () => { if (abrirExterno(CONFIG.github.perfil)) medicao.evento('sair-github'); }, 'pc-botao pc-botao-principal')));
      return;
    }

    const origem = t(`gh.origem.${r.origem === 'api' ? 'api' : r.origem}`);
    caixa.append(el('p', { classe: 'gh-status', attrs: { role: 'status' } },
      el('span', { texto: `${t('gh.atualizado', { quando: tempoRelativo(dados.hora, agora, i18n) })} · ${origem}` }),
      r.erro ? el('span', { classe: 'gh-aviso', texto: ` ${t(r.erro === 'limite' ? 'gh.limite' : 'gh.falha')}` }) : null));

    const listaRepos = el('ul', { classe: 'gh-lista' });
    for (const repo of dados.repos) {
      const nome = repo.url ? criarLink(document, repo.url, repo.nome, 'gh-repo-nome') : el('span', { classe: 'gh-repo-nome', texto: repo.nome });
      nome.setAttribute('translate', 'no');
      if (repo.url) nome.addEventListener('click', () => medicao.evento('sair-github'));
      listaRepos.append(el('li', { classe: 'gh-repo' },
        nome,
        el('p', { classe: 'gh-desc', texto: repo.descricao || t('gh.semDescricao') }),
        el('p', { classe: 'gh-meta' },
          repo.linguagem ? el('span', { classe: 'gh-ling', texto: repo.linguagem, attrs: { translate: 'no' } }) : null,
          el('span', { texto: t('gh.estrelas', { n: repo.estrelas }) }),
          el('span', { texto: tempoRelativo(repo.atualizado, agora, i18n) }))));
    }
    const listaCommits = el('ul', { classe: 'gh-lista' });
    if (!dados.commits.length) listaCommits.append(el('li', { classe: 'gh-nada', texto: t('gh.semCommits') }));
    for (const c of dados.commits) {
      const msg = c.url ? criarLink(document, c.url, c.mensagem, 'gh-commit-msg') : el('span', { classe: 'gh-commit-msg', texto: c.mensagem });
      if (c.url) msg.addEventListener('click', () => medicao.evento('sair-github'));
      listaCommits.append(el('li', { classe: 'gh-commit' },
        msg,
        el('p', { classe: 'gh-meta' },
          el('span', { classe: 'gh-repo-tag', texto: c.repo, attrs: { translate: 'no' } }),
          el('code', { texto: c.sha, attrs: { translate: 'no' } }),
          el('span', { texto: tempoRelativo(c.data, agora, i18n) }))));
    }
    caixa.append(el('div', { classe: 'gh-colunas' },
      el('section', { classe: 'gh-col' }, el('h3', { texto: t('gh.repos') }), listaRepos),
      el('section', { classe: 'gh-col' }, el('h3', { texto: t('gh.commits') }), listaCommits)));
  }

  function botaoAtualizar(caixa, ctx, rotulo = 'gh.atualizar') {
    const b = botao(t(rotulo), () => {
      const espera = cliente.podeAtualizarEm();
      if (espera > 0) {
        b.textContent = t('gh.aguarde', { s: Math.ceil(espera / 1000) });
        setTimeout(() => { if (b.isConnected) b.textContent = t(rotulo); }, 1800);
        return;
      }
      b.disabled = true;
      b.textContent = t('gh.carregando');
      pedir(() => cliente.atualizar(), ctx, (r) => {
        if (r.ignorado) { b.disabled = false; b.textContent = t(rotulo); return; }
        desenharGitHub(caixa, r, ctx);
      });
    }, 'pc-botao');
    return b;
  }

  sistema.registrar('projetos', {
    titulo: () => t('app.projetos'),
    icone: 'pasta',
    evento: 'app-projetos',
    tamanho: { w: 620, h: 420 },
    montar(corpo) {
      const grade = el('div', { classe: 'pc-pasta', attrs: { role: 'list' } });
      for (const p of conteudo.projetos) {
        grade.append(el('button', {
          classe: 'pc-icone-app pc-icone-arquivo', attrs: { type: 'button', role: 'listitem' },
          on: { click: () => sistema.abrir('projeto', p.id) },
        }, icone('projeto'), el('span', { texto: i18n.campo(p.nome) })));
      }
      corpo.append(grade);
    },
  });

  sistema.registrar('projeto', {
    semIcone: true,
    titulo: (id) => i18n.campo(conteudo.projetos.find((p) => p.id === id)?.nome) || t('app.projetos'),
    icone: 'projeto',
    tamanho: { w: 600, h: 480 },
    montar(corpo, ctx, id) {
      const p = conteudo.projetos.find((x) => x.id === id);
      if (!p) return;
      const acoes = p.link && linkPermitido(p.link)
        ? botao(t('projetos.abrir'), () => { if (abrirExterno(p.link)) medicao.evento(p.link.startsWith('https://github.com/') ? 'sair-github' : 'sair-projeto'); }, 'pc-botao pc-botao-principal')
        : el('p', { classe: 'pc-nota', texto: t('projetos.semLink') });
      corpo.append(el('article', { classe: 'pc-projeto' },
        el('img', { classe: 'pc-projeto-img', attrs: { src: p.imagem, alt: '', loading: 'lazy', width: 960, height: 540 } }),
        el('h2', { texto: i18n.campo(p.nome) }),
        el('p', { texto: i18n.campo(p.descricao) }),
        el('h3', { texto: t('projetos.tecnologias') }),
        el('ul', { classe: 'pc-chips' }, p.tecnologias.map((x) => el('li', { texto: x, attrs: { translate: 'no' } }))),
        acoes));
    },
  });

  sistema.registrar('leiame', {
    titulo: () => t('app.leiame'),
    icone: 'leiame',
    evento: 'app-leiame',
    tamanho: { w: 640, h: 500 },
    montar(corpo) {
      const creditos = [...new Set(conteudo.fotos.map((f) => f.credito).filter((c) => c && c !== 'a definir'))];
      corpo.append(el('article', { classe: 'pc-leiame' },
        el('h2', { texto: t('leiame.como.titulo') }), el('p', { texto: t('leiame.como.texto') }),
        el('h2', { texto: t('leiame.creditos.titulo') }),
        creditos.length ? el('ul', {}, creditos.map((c) => el('li', { texto: c }))) : el('p', { texto: t('leiame.creditos.vazio') }),
        el('h2', { texto: t('leiame.privacidade.titulo') }), el('p', { texto: t('leiame.privacidade.texto') }),
        el('h2', { texto: t('leiame.marcas.titulo') }), el('p', { texto: t('leiame.marcas.texto') }),
        el('p', { classe: 'pc-nota', texto: `v${CONFIG.versao}`, attrs: { translate: 'no' } })));
    },
  });
}
