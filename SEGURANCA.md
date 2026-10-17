# Auditoria de segurança: 17/10/2026

Conferência do site, do repositório no GitHub e da publicação contra as regras de segurança do Lucas (Guia Mestre v1.0, complementos KipperDev de set/2026 e complementos de out/2026). Cada regra está marcada como aplicada, não aplicável (com o motivo) ou pendente.

Resultado: nenhuma falha confirmada no código. Foram feitas 6 correções de proteção e ficaram 5 pendências que dependem de ação manual do Lucas (a proteção da main e o Actions entre elas).

## Como o site funciona (superfície de ataque)

- Site estático no Cloudflare Pages: HTML, CSS e JavaScript, sem servidor próprio, sem login, sem formulário enviado ao site e sem cookies.
- Sai do navegador do visitante para fora: consulta de leitura à API pública do GitHub e, se o visitante confirmar, o link `wa.me` do WhatsApp. A medição (Umami) está desligada.
- Dados guardados: só no aparelho do visitante (idioma, passeio visto, cópia dos dados públicos do GitHub), com versão e validação em toda leitura.

## Banco de dados

**Não precisa e não tem.** Todo o conteúdo é público e fixo, e fica nos arquivos `site/conteudo/*.json`, versionados no Git. O site não recebe nada do visitante. A regra "banco separado do projeto" fica **não aplicável**. Conferido: nenhum `.db`, `.sqlite`, `.sql`, dump ou backup em todo o histórico do Git, e o `.gitignore` agora bloqueia esses tipos.

Se um dia o site ganhar algo que grave dados de visitantes (mural de recados, formulário, contagem própria), aí vale a regra inteira: banco como serviço separado (ex.: Cloudflare D1 ou Supabase), credencial só em variável de ambiente do servidor, migrations versionadas, RLS e política de privacidade atualizada antes de ir ao ar.

## Repositório no GitHub

| Regra | Situação | Evidência |
|---|---|---|
| Nada sensível no histórico | **Aplicada** | Foram varridos os 117 arquivos de todos os commits: tokens, chaves, senhas, e-mails, CPF, IPs privados e dados de saúde ou pessoais. Achados: só o número do WhatsApp (público por decisão, seção 9.2 do ARQ-002), números de teste fictícios e as próprias expressões do verificador |
| `originais/` (imagens com possíveis metadados) fora do Git | **Aplicada** | Nunca entrou em nenhum commit |
| `.gitignore` desde o início e completo | **Corrigida** | Ampliado com `.env*`, chaves (`.pem`, `.key`, `.p12`), bancos, dumps, backups, uploads, exportações, planilhas e logs |
| Varredura de segredos e push protection | **Aplicada** | `secret_scanning` e `secret_scanning_push_protection` ativos no repositório (API do GitHub) |
| Branch main protegida | **Pendente** (BLOCKED_ENVIRONMENT) | A API recusou a escrita das regras de proteção a partir deste ambiente. Passo a passo em "Pendências" |
| Repositório privado por padrão | **Exceção registrada** | Continua público por decisão do Lucas em 17/10/2026: o portfólio mostra o próprio código e os commits ao vivo. Teste do 12-Factor: o código pode ficar público sem vazar credencial, porque não existe nenhuma |
| `.env.example` | Não aplicável | O site não usa variáveis de ambiente |
| CI/CD | **Corrigida no código; não rodou** | O workflow está no repositório, mas o GitHub Actions não executou nenhuma vez (0 execuções em 17/10). Provavelmente o Actions está desligado na conta ou no repositório. `.github/workflows/testes.yml`: actions fixadas por SHA de commit (checkout v7.0.1 de julho/2026; setup-node v7.1.0 de 07/10/2026, mais de 7 dias), `permissions: contents: read`, `persist-credentials: false`, nenhum segredo e nenhum `pull_request_target` |

## Dependências e cadeia de suprimentos

| Regra | Situação | Evidência |
|---|---|---|
| Dependências mínimas | **Aplicada** | Zero pacotes npm. A única biblioteca é o Three.js r186, copiado do repositório oficial, com SHA-256 conferido por teste |
| Lockfile, `npm ci`, versões exatas, quarentena | Não aplicável hoje | Sem pacotes não há lockfile. Ficou o `.npmrc` com `ignore-scripts=true` e `save-exact=true` para o dia em que houver algum. O Playwright, usado só nos testes do PC, é instalado à mão com versão exata (1.56.1) |
| Pasta do Three.js versionada | **Corrigida** | Renomeada para `vendor/three-r186/`, o que permite cache longo sem risco de servir versão velha |

## Código do site

| Regra | Situação | Evidência |
|---|---|---|
| XSS: só `textContent`, nada de `innerHTML` | **Aplicada** | Conferido por varredura (`npm run verificar`) e por teste de mutação: trocar `textContent` por `innerHTML` faz o teste GH-07 falhar |
| CSP e cabeçalhos | **Aplicada** | Nota A+ no SecurityHeaders (site no ar em 17/10). Acrescentado `Cross-Origin-Resource-Policy: same-origin` |
| Redirecionamentos e links só por lista | **Aplicada** | `links.js` com lista fixa; teste de mutação mata o mutante "aceitar qualquer link" |
| SSRF | Não aplicável | Não há servidor: o navegador só consulta endereços fixos da API do GitHub |
| SQL, IDOR, sessão, cookies, senhas, CAPTCHA, rotas de admin | Não aplicável | Não existe banco, conta, login nem rota de servidor |
| Aleatoriedade segura | Não aplicável | O código do site não gera token nem identificador (nenhum `Math.random`) |
| Erros sem detalhes internos | **Aplicada** | Mensagens genéricas na tela. Endereços inexistentes agora devolvem 404 de verdade (`404.html`), não a página inicial com status 200 |
| Concorrência e respostas atrasadas | **Aplicada** | Números de geração no PC e no cliente do GitHub; testes PC-05, PC-06, GH-12 e GH-14 |
| Debug desligado em produção | **Aplicada** | Sem logs no console. O contador de quadros (`Ctrl + Shift + F`) só mostra números de desempenho na tela do próprio visitante |
| CORS | **Aplicada** | O Cloudflare envia `Access-Control-Allow-Origin: *` sem credenciais; é aceitável para conteúdo 100% público |
| IA/LLM | Não aplicável | O site não usa modelo de IA em execução |
| LGPD | **Corrigida** | Nova página `/privacidade/`, com controlador, dados tratados, finalidade, retenção, base legal e como exercer direitos, com link fixo no quarto. Hoje não há coleta de dados pessoais pelo site |

## Proteção da main

O fluxo usado em 17/10 já foi branch → pull request (#1) → prévia do Cloudflare aprovada → merge. A regra que obriga esse caminho ainda não está ligada no GitHub (ver pendência 1).

## Pendências que só o Lucas pode fazer

1. **Ligar o GitHub Actions e proteger a main:**
   - Settings do repositório → Actions → General → "Allow all actions and reusable workflows" → Save.
   - Settings → Rules → Rulesets → New branch ruleset. Nome "main protegida"; Enforcement "Active"; Target "Include default branch". Marque "Restrict deletions", "Require a pull request before merging" (0 aprovações), "Require status checks to pass" (adicione `testes` e `Cloudflare Pages`) e "Block force pushes". Save.
2. **2FA com app autenticador ou passkey** no GitHub, no Cloudflare, no Google e no npm (se criar conta), com os códigos de recuperação guardados fora do PC. A API não mostra se o 2FA do GitHub está ligado: **não verificado**.
3. **Push protection na conta pessoal** do GitHub: Settings → Code security → Push protection for yourself. No repositório já está ativa.
4. **Fotos reais:** só subir depois de passar pela lista da seção 9.3 do ARQ-002 (metadados removidos, crédito do fotógrafo e autorização de quem aparece). O `npm run verificar` recusa imagem com metadados.
5. **Umami:** antes de colar o ID, atualizar a página `/privacidade/`, que já avisa isso.
