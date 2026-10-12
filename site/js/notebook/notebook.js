// Notebook na mesa (substitui o celular virtual do ARQ-002, seções 3.6, 7.5 a 7.7).
// Sempre ligado (tem bateria), abre na tela inicial, três aplicativos emulados.

import { el, icone, botao } from '../dom.js';
import { abrirExterno } from '../links.js';
import { linkWhatsApp, podeEnviar, limparMensagem, LIMITE_MENSAGEM } from '../whatsapp.js';
import { CONFIG } from '../config.js';

export const TELA_NOTEBOOK = Object.freeze({ w: 800, h: 500 });

export function criarNotebook({ i18n, conteudo, medicao }) {
  const t = (k, v) => i18n.t(k, v);
  let appAtual = 'inicio';
  let rascunho = ''; // Regra 3: só na memória da página.
  let relogioTimer = null;

  const raiz = el('div', { classe: 'nb', attrs: { role: 'application', 'data-i18n-aria': 'nb.tela' } });
  raiz.style.width = `${TELA_NOTEBOOK.w}px`;
  raiz.style.height = `${TELA_NOTEBOOK.h}px`;
  const area = el('div', { classe: 'nb-area' });
  const relogioBarra = el('span', { classe: 'nb-hora' });
  const btnInicio = el('button', {
    classe: 'nb-inicio', attrs: { type: 'button' },
    on: { click: () => abrirApp('inicio') },
  }, el('span', { classe: 'nb-inicio-icone', attrs: { 'aria-hidden': 'true' } }), el('span', { classe: 'nb-inicio-texto' }));
  const doca = el('div', { classe: 'nb-doca' }, btnInicio, relogioBarra);
  raiz.append(area, doca);

  function horaAgora() {
    return new Date().toLocaleTimeString(i18n.idioma === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function atualizarRelogio() {
    relogioBarra.textContent = horaAgora();
    const grande = raiz.querySelector('.nb-relogio-grande');
    if (grande) grande.textContent = horaAgora();
  }

  function selo() {
    return el('span', { classe: 'nb-selo', texto: t('nb.simulacao') });
  }

  function telaInicio() {
    const bruta = new Date().toLocaleDateString(i18n.idioma === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    const data = bruta.charAt(0).toUpperCase() + bruta.slice(1);
    const apps = [
      ['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn'],
    ].map(([id, nome]) => el('button', {
      classe: 'nb-app', attrs: { type: 'button' }, dados: { app: id },
      on: { click: () => abrirApp(id) },
    }, icone(id, 'nb-app-icone'), el('span', { texto: nome, attrs: { translate: 'no' } })));
    return el('div', { classe: 'nb-tela nb-inicio-tela' },
      el('div', { classe: 'nb-relogio' },
        el('p', { classe: 'nb-relogio-grande', texto: horaAgora() }),
        el('p', { classe: 'nb-data', texto: data })),
      el('div', { classe: 'nb-apps' }, apps));
  }

  function cabecalhoApp(classe, titulo, botaoReal) {
    return el('header', { classe: `nb-cab ${classe}` }, titulo, selo(), botaoReal);
  }

  function telaWhatsApp() {
    const campo = el('textarea', {
      classe: 'wa-campo',
      attrs: { rows: 2, maxlength: LIMITE_MENSAGEM, placeholder: t('wa.placeholder'), 'aria-label': t('wa.placeholder'), autocomplete: 'off', spellcheck: 'true' },
    });
    campo.value = rascunho;
    const contador = el('span', { classe: 'wa-contador', attrs: { 'aria-live': 'polite' } });
    const enviar = el('button', { classe: 'wa-enviar', texto: t('wa.enviar'), attrs: { type: 'button' } });
    const confirmar = el('div', { classe: 'wa-confirmar', attrs: { role: 'alertdialog', 'aria-modal': 'true', hidden: true } });
    const atualizar = () => {
      const limpo = limparMensagem(campo.value);
      if (limpo !== campo.value) campo.value = limpo;
      rascunho = campo.value;
      contador.textContent = t('wa.contador', { n: campo.value.length });
      enviar.disabled = !podeEnviar(campo.value);
    };
    campo.addEventListener('input', atualizar);
    campo.addEventListener('keydown', (e) => e.stopPropagation()); // Setas não giram o quarto.
    enviar.addEventListener('click', () => {
      if (!podeEnviar(campo.value)) return;
      confirmar.textContent = '';
      const abrir = botao(t('wa.abrir'), () => {
        const link = linkWhatsApp(CONFIG.whatsapp, campo.value);
        confirmar.hidden = true;
        if (link && abrirExterno(link)) medicao.evento('sair-whatsapp');
      }, 'wa-btn wa-btn-principal');
      const cancelar = botao(t('wa.cancelar'), () => { confirmar.hidden = true; campo.focus(); }, 'wa-btn');
      confirmar.append(el('div', { classe: 'wa-confirmar-caixa' },
        el('p', { texto: t('wa.confirmar') }),
        el('blockquote', { classe: 'wa-previa', texto: campo.value }),
        el('div', { classe: 'wa-confirmar-botoes' }, cancelar, abrir)));
      confirmar.hidden = false;
      abrir.focus();
    });
    const tela = el('div', { classe: 'nb-tela wa' },
      cabecalhoApp('wa-cab',
        el('div', { classe: 'wa-contato' },
          el('span', { classe: 'wa-avatar', texto: 'LF', attrs: { 'aria-hidden': 'true' } }),
          el('div', {}, el('strong', { texto: t('wa.nome'), attrs: { translate: 'no' } }), el('span', { classe: 'wa-status', texto: t('wa.status') }))),
        null),
      el('div', { classe: 'wa-conversa' },
        el('p', { classe: 'wa-aviso', texto: t('wa.simulacao') }),
        el('div', { classe: 'wa-balao' }, el('p', { texto: t('wa.boasvindas') }))),
      el('div', { classe: 'wa-rodape' }, campo, el('div', { classe: 'wa-lado' }, contador, enviar)),
      confirmar);
    atualizar();
    return tela;
  }

  function telaInstagram() {
    const ig = conteudo.instagram;
    const ampliada = el('div', { classe: 'ig-ampliada', attrs: { hidden: true, role: 'dialog', 'aria-modal': 'true' } });
    const grade = el('div', { classe: 'ig-grade' });
    ig.fotos.forEach((f) => {
      grade.append(el('button', {
        classe: 'ig-foto', attrs: { type: 'button', 'aria-label': i18n.campo(f.legenda) },
        on: {
          click: () => {
            ampliada.textContent = '';
            const fechar = botao('×', () => { ampliada.hidden = true; }, 'ig-fechar', { 'aria-label': t('ig.fechar') });
            ampliada.append(el('figure', {},
              el('img', { attrs: { src: f.arquivo, alt: i18n.campo(f.legenda), width: 600, height: 600 } }),
              el('figcaption', { texto: i18n.campo(f.legenda) })), fechar);
            ampliada.hidden = false;
            fechar.focus();
          },
        },
      }, el('img', { attrs: { src: f.arquivo, alt: '', loading: 'lazy', width: 600, height: 600 } })));
    });
    return el('div', { classe: 'nb-tela ig' },
      cabecalhoApp('ig-cab', el('strong', { texto: ig.usuario, attrs: { translate: 'no' } }),
        botao(t('ig.abrir'), () => { if (abrirExterno(CONFIG.instagram)) medicao.evento('sair-instagram'); }, 'nb-botao-real')),
      el('div', { classe: 'ig-rolagem' },
        el('div', { classe: 'ig-perfil' },
          el('img', { classe: 'ig-avatar', attrs: { src: ig.avatar, alt: '', width: 320, height: 320 } }),
          el('div', {},
            el('p', { classe: 'ig-nome', texto: ig.nome, attrs: { translate: 'no' } }),
            el('p', { classe: 'ig-bio', texto: i18n.campo(ig.bio) }),
            el('p', { classe: 'ig-num', texto: `${ig.fotos.length} ${t('ig.posts')}` }))),
        el('p', { classe: 'nb-aviso', texto: t('ig.simulacao') }),
        grade),
      ampliada);
  }

  function telaLinkedIn() {
    const li = conteudo.linkedin;
    return el('div', { classe: 'nb-tela li' },
      cabecalhoApp('li-cab', el('strong', { texto: 'LinkedIn', attrs: { translate: 'no' } }),
        botao(t('li.abrir'), () => { if (abrirExterno(CONFIG.linkedin)) medicao.evento('sair-linkedin'); }, 'nb-botao-real')),
      el('div', { classe: 'li-rolagem' },
        el('div', { classe: 'li-capa' }),
        el('div', { classe: 'li-topo' },
          el('span', { classe: 'li-avatar', texto: 'LF', attrs: { 'aria-hidden': 'true' } }),
          el('h2', { texto: li.nome, attrs: { translate: 'no' } }),
          el('p', { classe: 'li-titulo', texto: i18n.campo(li.titulo) })),
        el('p', { classe: 'nb-aviso', texto: t('li.simulacao') }),
        el('section', { classe: 'li-sec' }, el('h3', { texto: t('li.sobre') }), el('p', { texto: i18n.campo(li.sobre) })),
        el('section', { classe: 'li-sec' }, el('h3', { texto: t('li.formacao') }), el('ul', {}, li.formacao.map((f) => el('li', { texto: i18n.campo(f) })))),
        el('section', { classe: 'li-sec' }, el('h3', { texto: t('li.competencias') }),
          el('ul', { classe: 'li-skills' }, li.competencias.map((c) => el('li', { texto: c, attrs: { translate: 'no' } }))))));
  }

  const TELAS = { inicio: telaInicio, whatsapp: telaWhatsApp, instagram: telaInstagram, linkedin: telaLinkedIn };

  function abrirApp(id, medir = true) {
    if (!TELAS[id]) return;
    appAtual = id;
    area.textContent = '';
    area.append(TELAS[id]());
    raiz.dataset.app = id;
    btnInicio.hidden = id === 'inicio';
    if (medir && id !== 'inicio') medicao.evento(`app-${id}`);
  }

  function traduzir() {
    raiz.setAttribute('aria-label', t('nb.tela'));
    btnInicio.querySelector('.nb-inicio-texto').textContent = t('nb.inicio');
    btnInicio.setAttribute('aria-label', t('nb.inicio'));
    abrirApp(appAtual, false);
    atualizarRelogio();
  }

  return {
    el: raiz,
    iniciar() { traduzir(); },
    traduzir,
    abrirApp,
    get app() { return appAtual; },
    ligarRelogio(ligar) {
      clearInterval(relogioTimer);
      relogioTimer = null;
      if (ligar) { atualizarRelogio(); relogioTimer = setInterval(atualizarRelogio, 15000); }
    },
  };
}
