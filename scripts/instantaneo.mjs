// Gera site/github-instantaneo.json (ARQ-002, seção 7.3, reserva 3) consultando a API
// pública sem chave. Se a API falhar, mantém o arquivo anterior e termina sem erro,
// para nunca quebrar a publicação. Uso: npm run instantaneo
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarClienteGitHub } from '../site/js/github/cliente.js';
import { validarPacote } from '../site/js/github/validar.js';
import { CONFIG } from '../site/js/config.js';

const DESTINO = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'github-instantaneo.json');

const cliente = criarClienteGitHub({ usuario: CONFIG.github.usuario, api: CONFIG.github.api, tempoLimite: 15000 });
const r = await cliente.abrir();
if (r.origem !== 'api' || !validarPacote(r.dados)) {
  console.log(`Instantâneo mantido: API indisponível (${r.erro ?? 'sem dados'}).`);
  try { console.log(`Arquivo atual de ${JSON.parse(readFileSync(DESTINO, 'utf8')).hora}.`); } catch { /* sem arquivo */ }
  process.exit(0);
}
writeFileSync(DESTINO, `${JSON.stringify(r.dados, null, 2)}\n`);
console.log(`Instantâneo gravado: ${r.dados.repos.length} repositórios, ${r.dados.commits.length} commits (${r.dados.hora}).`);
