// Criação de elementos sem innerHTML: todo texto entra como textContent (invariante 2).

export function el(tag, opcoes = {}, ...filhos) {
  const e = document.createElement(tag);
  const { classe, texto, attrs, on, dados, estilo } = opcoes;
  if (classe) e.className = classe;
  if (texto !== undefined && texto !== null) e.textContent = String(texto);
  if (attrs) for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : String(v));
  if (dados) for (const [k, v] of Object.entries(dados)) e.dataset[k] = String(v);
  if (estilo) {
    for (const [k, v] of Object.entries(estilo)) {
      if (k.startsWith('--')) e.style.setProperty(k, v); else e.style[k] = v;
    }
  }
  if (on) for (const [ev, fn] of Object.entries(on)) e.addEventListener(ev, fn);
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) e.append(f);
  return e;
}

export function icone(nome, classe = 'icone') {
  return el('img', { classe, attrs: { src: `img/icones/${nome}.svg`, alt: '', draggable: 'false', width: 64, height: 64 } });
}

export function botao(texto, on, classe = '', attrs = {}) {
  return el('button', { classe, texto, attrs: { type: 'button', ...attrs }, on: { click: on } });
}
