// Contadores do blecaute (ARQ-002, seção 3.3), com relógio injetado.
// Entrada: mouse, toque, tecla ou roda. Ação: tudo isso menos mover o mouse.
// Invariante 5: o blecaute acontece no máximo uma vez por carregamento.

export function criarBlecaute({ t1 = 10000, t2 = 20000 } = {}) {
  let condicoesOk = false;
  let ocorreu = false;
  let ultimaEntrada = 0;
  let ultimaAcao = 0;

  return {
    get ocorreu() { return ocorreu; },
    get contando() { return condicoesOk && !ocorreu; },

    // Chamado sempre que uma das 5 condições muda. Se alguma falha, os contadores zeram.
    condicoes(ok, agora) {
      const novo = Boolean(ok);
      if (novo && !condicoesOk) {
        ultimaEntrada = agora;
        ultimaAcao = agora;
      }
      condicoesOk = novo;
    },

    // tipo: 'movimento' (só mouse) ou 'acao'.
    entrada(tipo, agora) {
      if (!condicoesOk || ocorreu) return;
      ultimaEntrada = agora;
      if (tipo === 'acao') ultimaAcao = agora;
    },

    // Hora em que o blecaute dispara se nada mais acontecer, ou null.
    proximoDisparo() {
      if (!condicoesOk || ocorreu) return null;
      return Math.min(ultimaEntrada + t1, ultimaAcao + t2);
    },

    // Devolve true uma única vez, quando chega a hora.
    verificar(agora) {
      const hora = this.proximoDisparo();
      if (hora === null || agora < hora) return false;
      ocorreu = true;
      return true;
    },
  };
}
