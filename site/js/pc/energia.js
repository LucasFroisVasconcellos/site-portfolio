// Estados do PC (ARQ-002, seção 3.4). Não mexe na tela: quem desenha escuta aoMudar.
// Invariante 6: sempre um dos quatro estados, com no máximo um temporizador ativo.

export const ESTADOS = Object.freeze(['ligado', 'desligando', 'desligado', 'iniciando']);

export function criarEnergia({
  agendar = (fn, ms) => setTimeout(fn, ms),
  cancelar = (id) => clearTimeout(id),
  agora = () => Date.now(),
  aoMudar = () => {},
  tempoIniciando = 2500,
  tempoDesligando = 1000,
} = {}) {
  let estado = 'ligado'; // Regra 1: ao carregar, já está Ligado.
  let geracao = 0;
  let temporizador = null;
  let travadoAte = -Infinity;

  function limparTemporizador() {
    if (temporizador !== null) {
      cancelar(temporizador);
      temporizador = null;
    }
  }

  function ir(novo, motivo) {
    limparTemporizador();
    estado = novo;
    geracao += 1;
    aoMudar({ estado, geracao, motivo });
  }

  function depois(ms, proximo) {
    const minha = geracao;
    temporizador = agendar(() => {
      temporizador = null;
      if (minha !== geracao) return; // Regra 6: temporizador antigo é descartado.
      ir(proximo, 'tempo');
    }, ms);
  }

  function desligarNormal(motivo) {
    ir('desligando', motivo);
    depois(tempoDesligando, 'desligado');
  }

  return {
    get estado() { return estado; },
    get geracao() { return geracao; },
    get temporizadorAtivo() { return temporizador !== null; },
    estaTravado(t = agora()) { return t < travadoAte; },

    // Botão físico (gabinete ou monitor). Devolve true se mudou algo.
    botao() {
      if (agora() < travadoAte) return false; // Blecaute em curso (seção 3.3, regra 3).
      if (estado === 'ligado') { desligarNormal('botao'); return true; }
      if (estado === 'desligado') {
        ir('iniciando', 'botao');
        depois(tempoIniciando, 'ligado');
        return true;
      }
      return false; // Regra 2: ignorado em Desligando e Iniciando.
    },

    // "Desligar" no menu do sistema virtual (PC-08 = PC-02).
    desligarPeloMenu() {
      if (agora() < travadoAte) return false;
      if (estado !== 'ligado') return false;
      desligarNormal('menu');
      return true;
    },

    // Regra 5: blecaute leva a Desligado de qualquer estado, sem passar por Desligando.
    blecaute(duracaoTravaMs = 3000) {
      travadoAte = agora() + duracaoTravaMs;
      ir('desligado', 'blecaute');
    },
  };
}
