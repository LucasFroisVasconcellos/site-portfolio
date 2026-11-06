# Plano da refatoração do front-end (05/11/2026)

Escolha do Lucas: **código e visual**, nesta ordem, feita no **Claude Code do PC** com a esteira `skill-de-design`.
Ponto de partida: `main` em `555cef8`, 69 testes unitários passando e `npm run verificar` com tudo PASS (conferido em 05/11/2026).

## Parte A – Código (o visitante não vê diferença)

Cada item é uma branch e um pull request pequenos.

1. **A1 – Dividir o `main.js` (562 linhas). FEITO em 05/11/2026 (branch `refatora/a1-dividir-main`).** O `main.js` ficou com 143 linhas: carregamento, ligação dos módulos e início. O resto foi para `site/js/app/`:
   - `carregamento.js` (arquivos de conteúdo, barra de progresso, erro)
   - `telas.js` (PC, notebook, parede de trás, tamanho da tela, aba oculta)
   - `modos.js` (modos, girar, foco, voltar)
   - `menu.js` (menu "Ir para")
   - `passeio-app.js` (passeio)
   - `blecaute-app.js` (blecaute e aviso "Ligue o PC")
   - `teclado-gestos.js` (teclado e gestos)
   - `idioma.js` (troca de idioma)
   - `fps.js` (contador de quadros)
   - Os módulos conversam por um objeto `ctx` compartilhado (estado em `ctx.estado`); nenhum módulo de `app/` importa outro.
   - Resultado: `montarApp()` saiu de 46 ligações no grafo; o maior módulo novo (`instalarModos`) tem 14. Sem ciclos. 69 testes unitários, `verificar` e 30 testes no navegador passando.
2. **A2 – Organizar o CSS.** Criar `estilos/tokens.css` com cores, fontes, espaçamentos, raios e tempos de animação usados nos 6 arquivos, e trocar valores repetidos pelas variáveis. Sem mudar nenhum valor.
3. **A3 – Conferir.** `npm test`, `npm run verificar`, `npm run test:e2e` e `graphify update .`. O grafo não pode ganhar ciclo de importação.

## Parte B – Visual (com a esteira)

1. **B1 – Direção visual.** A esteira propõe a direção (tipografia, cores, ícones, movimento) a partir dos tokens do A2, respeitando o estilo SketchUp das ilustrações. O Lucas aprova antes de codar.
2. **B2 – FroisOS (PC).** Janelas, barra de tarefas, app do GitHub.
3. **B3 – Notebook.** Tela inicial e os apps de WhatsApp, Instagram e LinkedIn.
4. **B4 – Quarto.** Setas, menu "Ir para", destaque dos itens, aviso "Gire o celular", tela de carregamento.
5. **B5 – Parede.** Post-its, quadro digital e painel das medalhas.
6. **B6 – Revisão.** `interface-review` + `better-*`, depois o auditor (Auditoria) e o teste no Note 10 pela prévia do Cloudflare.

## Prompt para colar no Claude Code

Abra o Claude Code em `C:\GitHub\site-portfolio` e cole:

```
Vamos refatorar o front-end do site-portfolio. Leia primeiro, nesta ordem:
CLAUDE.md, nivel.txt, docs/SKILLS-DO-PROJETO.md, docs/PLANO-REFATORACAO.md,
docs/ARQUITETURA.md e DECISOES.md. Use o grafo do Graphify antes de abrir arquivos.
Siga a skill guia-seguranca e a skill-de-design (projeto do tipo portfólio).
Comece pela parte A1 numa branch nova (refatora/a1-dividir-main), em entregas pequenas.
Depois de cada entrega rode npm test e npm run verificar e me mostre a evidência
(o que passou, o que não foi testado e por quê). Não suba nada para a main.
```
