// Link do WhatsApp (ARQ-002, seção 7.6). Função pura: testada nos casos WA e por fuzzing.

export const LIMITE_MENSAGEM = 500;

const SURROGATE_SOLTO = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
// Controles invisíveis (menos tab e quebra de linha), que só atrapalham.
const CONTROLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// Remove o que faria encodeURIComponent falhar e corta no limite.
export function limparMensagem(texto, limite = LIMITE_MENSAGEM) {
  let s = typeof texto === 'string' ? texto : '';
  s = s.replace(SURROGATE_SOLTO, '').replace(CONTROLES, '');
  if (s.length > limite) {
    s = s.slice(0, limite).replace(SURROGATE_SOLTO, '');
  }
  return s;
}

export function podeEnviar(texto) {
  return /\S/u.test(limparMensagem(texto));
}

export function numeroValido(numero) {
  return typeof numero === 'string' && /^[1-9]\d{9,14}$/.test(numero);
}

// Devolve o link ou null. O número nunca vem do visitante.
export function linkWhatsApp(numero, texto) {
  if (!numeroValido(numero)) throw new Error('Número do WhatsApp inválido em config.js');
  const mensagem = limparMensagem(texto);
  if (!/\S/u.test(mensagem)) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
