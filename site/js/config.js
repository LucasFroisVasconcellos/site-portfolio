// Configuração única do site (ARQ-002, seção 6.2). Nenhum segredo aqui: tudo é público.

export const CONFIG = Object.freeze({
  versao: '0.1.0',
  github: Object.freeze({
    usuario: 'LucasFroisVasconcellos',
    api: 'https://api.github.com',
    perfil: 'https://github.com/LucasFroisVasconcellos',
  }),
  // Só dígitos, com código do país (seção 7.6). Mesmo número da Calculadora de Lucro Real.
  whatsapp: '5511958153322',
  instagram: 'https://www.instagram.com/lucas_frois1/',
  linkedin: 'https://www.linkedin.com/in/lucas-frois1/',
  // Domínios https que os links de projetos podem abrir (seção 7.8).
  dominiosProjetos: Object.freeze(['github.com']),
  limites: Object.freeze({
    mensagemWhatsApp: 500,
    carregamentoMs: 20000,
    githubTempoLimiteMs: 8000,
    githubValidadeMs: 10 * 60 * 1000,
    githubIntervaloBotaoMs: 60 * 1000,
    blecauteT1Ms: 10000,
    blecauteT2Ms: 20000,
    blecauteDuracaoMs: 3000,
    pcIniciandoMs: 2500,
    pcDesligandoMs: 1000,
    trocaParedeMs: 400,
    focoMs: 600,
  }),
  // Medição (seção 6.7). Fica desligada até o Lucas criar o site no Umami e colar o ID aqui.
  umami: Object.freeze({
    idSite: '',
    endereco: 'https://cloud.umami.is/api/send',
    // Só envia eventos nestes endereços (produção). Prévias e o PC local nunca enviam.
    hostsProducao: Object.freeze([]),
  }),
});
