// Teste de mutação dos controles de segurança (ARQ-002, seção 10.7).
// Remove um controle por vez e confere que pelo menos um teste falha ("mutante morto").
// Uso: npm run mutacao   (o caso de escrita como texto usa os testes no navegador)

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS = (p) => join(RAIZ, 'site/js', p);

const MUTANTES = [
  { controle: 'Lista de links (7.8)', arquivo: 'links.js', de: "  if (ehGithubDoDono(u)) return 'github';", para: "  return 'github';" },
  { controle: 'Link da API só do dono (A2)', arquivo: 'github/validar.js', de: '    if (p !== dono && !p.startsWith(`${dono}/`)) return null;\n', para: '' },
  { controle: 'Validação da API: corte da descrição', arquivo: 'github/validar.js', de: 'descricao = cortar(textoLimpo(r.description), 200)', para: 'descricao = textoLimpo(r.description)' },
  { controle: 'Validação da API: forks e privados', arquivo: 'github/validar.js', de: '  if (r.fork === true || r.private === true) return null; // Regra 5.\n', para: '' },
  { controle: 'Número de geração do PC', arquivo: 'pc/energia.js', de: '      if (minha !== geracao) return; // Regra 6: temporizador antigo é descartado.\n', para: '' },
  { controle: 'Trava de blecaute único', arquivo: 'blecaute.js', de: '      ocorreu = true;\n', para: '' },
  { controle: 'Botão travado durante o blecaute', arquivo: 'pc/energia.js', de: '      if (agora() < travadoAte) return false; // Blecaute em curso (seção 3.3, regra 3).\n', para: '' },
  { controle: 'Limite de 500 caracteres', arquivo: 'whatsapp.js', de: '  if (s.length > limite) {', para: '  if (false) {' },
  { controle: 'Remoção de caracteres inválidos', arquivo: 'whatsapp.js', de: "  s = s.replace(SURROGATE_SOLTO, '').replace(CONTROLES, '');", para: '' },
  { controle: 'Respeito ao x-ratelimit-reset', arquivo: 'github/cliente.js', de: "    if (agora() < suspensoAte) throw Object.assign(new Error('limite'), { tipo: 'limite' });\n", para: '' },
  { controle: 'Espera de 60 s no botão', arquivo: 'github/cliente.js', de: '      if (agora() - ultimaRodada < intervaloBotao) return { ignorado: true };\n', para: '' },
  { controle: 'Versão do armazenamento', arquivo: 'armazenamento.js', de: ' || obj.v !== VERSAO_ARMAZENAMENTO', para: '' },
  { controle: 'Eventos só com nome da lista', arquivo: 'medicao.js', de: '      if (!eventoValido(nome)) return false;\n', para: '' },
  { controle: 'Escrita só como texto (invariante 2)', arquivo: 'dom.js', de: 'e.textContent = String(texto);', para: 'e.innerHTML = String(texto);', e2e: true },
];

function rodar(e2e) {
  const r = e2e
    ? spawnSync(process.execPath, [join(RAIZ, 'tests/e2e/rodar.mjs')], { cwd: RAIZ, encoding: 'utf8', timeout: 600000 })
    : spawnSync(process.execPath, ['--test', '--test-reporter=dot', ...['blecaute', 'energia', 'whatsapp-links', 'github', 'geral'].map((n) => `tests/${n}.test.mjs`)], { cwd: RAIZ, encoding: 'utf8', timeout: 600000 });
  return r.status;
}

let vivos = 0;
for (const m of MUTANTES) {
  const caminho = JS(m.arquivo);
  const original = readFileSync(caminho, 'utf8');
  if (!original.includes(m.de)) {
    console.log(`ERRO   ${m.controle}: trecho não encontrado em ${m.arquivo}`);
    vivos += 1;
    continue;
  }
  try {
    writeFileSync(caminho, original.replace(m.de, m.para));
    const status = rodar(m.e2e);
    const morto = status !== 0;
    if (!morto) vivos += 1;
    console.log(`${morto ? 'MORTO ' : 'VIVO  '} ${m.controle}${m.e2e ? ' (navegador)' : ''}`);
  } finally {
    writeFileSync(caminho, original);
  }
}
console.log(`\n${MUTANTES.length - vivos}/${MUTANTES.length} mutantes mortos`);
process.exit(vivos ? 1 : 0);
