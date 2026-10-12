// Leitura e gravação no aparelho (ARQ-002, seção 6.9). Tudo em try/catch: com o
// armazenamento bloqueado o site funciona, só não lembra as preferências (RNF-17).

const PREFIXO = 'site-portfolio:';
export const VERSAO_ARMAZENAMENTO = 1;

function localStorageSeguro() {
  try {
    const ls = globalThis.localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

export function criarArmazenamento(store = localStorageSeguro()) {
  return {
    // validar(dado) devolve o dado limpo ou null; dado inválido é apagado.
    ler(chave, validar = (d) => d) {
      if (!store) return null;
      try {
        const bruto = store.getItem(PREFIXO + chave);
        if (bruto === null || bruto === undefined) return null;
        if (typeof bruto !== 'string' || bruto.length > 500000) throw new Error('formato');
        const obj = JSON.parse(bruto);
        if (!obj || typeof obj !== 'object' || obj.v !== VERSAO_ARMAZENAMENTO || !('d' in obj)) {
          throw new Error('versao');
        }
        const limpo = validar(obj.d);
        if (limpo === null || limpo === undefined) throw new Error('invalido');
        return limpo;
      } catch {
        try { store.removeItem(PREFIXO + chave); } catch { /* bloqueado */ }
        return null;
      }
    },
    gravar(chave, dado) {
      if (!store) return false;
      try {
        store.setItem(PREFIXO + chave, JSON.stringify({ v: VERSAO_ARMAZENAMENTO, d: dado }));
        return true;
      } catch {
        return false;
      }
    },
    remover(chave) {
      if (!store) return;
      try { store.removeItem(PREFIXO + chave); } catch { /* bloqueado */ }
    },
  };
}
