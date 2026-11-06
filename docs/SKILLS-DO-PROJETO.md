# Skills do projeto (05/11/2026)

Escolhidas pela skill `selecionar-skills-do-projeto`. Nível do projeto: **2 – Médio** (ver `nivel.txt`).

| Skill | Para quê neste projeto | Onde está |
|---|---|---|
| `guia-seguranca` | Ler primeiro em toda mudança | Conta (ligada) |
| `nivel-de-projeto` | Nível 2 registrado em `nivel.txt` | Conta (ligada) |
| `auditor-seguranca` | Parte mecânica da auditoria pelo `.bat` (**ainda não instalado neste projeto**) | Conta + `C:\GitHub\auditor-seguranca` |
| `graphify` | Grafo do código em `graphify-out/`; consultar antes de ler arquivos | Conta + Claude Code local |
| `skill-de-design` | Esteira de design da refatoração visual (ordem abaixo) | Claude Code local |
| `superpowers:writing-plans` / `executing-plans` | Plano da refatoração e execução em partes | Claude Code local |
| `superpowers:verification-before-completion` | Provar com testes antes de dizer que terminou | Claude Code local |
| `webapp-testing` | Conferir as telas no navegador (Playwright já existe em `tests/e2e`) | Conta + Claude Code local |
| `pr` / `conventional-commit` | Branch, commits e pull request (a `main` é protegida) | Conta |
| `cloudflare` | Só se mexer em `_headers`, prévia ou domínio | Conta |
| `github-actions-hardening` | Só se mexer em `.github/workflows/` | Conta |

## Esteira de design neste projeto

Tipo do projeto: **portfólio** (não é landing page nem app/painel).

1. `emil-design-eng` → base de engenharia de design
2. `animate` → movimento (sempre respeitando `prefers-reduced-motion`)
3. `web-design-engineer` → implementação
4. ~~`landing-page-design`~~ → **não se aplica** (não é landing page)
5. `build-awwwards-quality-sites` + `cinematic-scroll-storytelling` → **aplica** (portfólio), mas sem rolagem longa: o site é um quarto com setas, então o "storytelling" entra no passeio inicial e nas transições entre paredes
6. `interface-review` + `better-*` → revisão final (acessibilidade, layout, tipografia, cores, texto)

## Regras que a refatoração não pode quebrar

- Sem build e sem dependências novas no site (decisão 3 do `DECISOES.md`); Three.js continua só nas medalhas.
- CSP do `_headers`: nada de `innerHTML`, `eval`, `<style>` ou `<script>` embutido (o `npm run verificar` confere).
- 60 FPS no Galaxy Note 10, sem laço de desenho com a cena parada.
- A cadeira de rodas não entra no quarto.
