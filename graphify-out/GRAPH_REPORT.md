# Graph Report - site-portfolio  (2026-11-05)

## Corpus Check
- Corpus is ~23,601 words - fits in a single context window. You may not need a graph.

## Summary
- 321 nodes · 769 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Geometria e enquadramento
- Notebook e DOM
- Cliente GitHub e cache
- Orquestração do quarto
- Scripts de teste e mutação
- Links seguros e WhatsApp
- Gestos, idioma e main
- Verificação do build
- Energia e blecaute
- package.json
- Medalhas 3D
- Preparo das ilustrações

## God Nodes (most connected - your core abstractions)
1. `montarApp()` - 46 edges
2. `el()` - 31 edges
3. `criarQuarto()` - 29 edges
4. `criarSistema()` - 23 edges
5. `criarNotebook()` - 20 edges
6. `botao()` - 17 edges
7. `criarClienteGitHub()` - 16 edges
8. `iniciar()` - 15 edges
9. `icone()` - 14 edges
10. `registrarApps()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `simular()` --calls--> `criarBlecaute()`  [EXTRACTED]
  tests/blecaute.test.mjs → site/js/blecaute.js
- `nova()` --calls--> `criarEnergia()`  [EXTRACTED]
  tests/energia.test.mjs → site/js/pc/energia.js
- `cliente()` --calls--> `criarArmazenamento()`  [EXTRACTED]
  tests/github.test.mjs → site/js/armazenamento.js
- `cliente()` --calls--> `criarClienteGitHub()`  [EXTRACTED]
  tests/github.test.mjs → site/js/github/cliente.js
- `montarApp()` --calls--> `criarBlecaute()`  [EXTRACTED]
  site/js/main.js → site/js/blecaute.js

## Import Cycles
- None detected.

## Communities (13 total, 1 thin omitted)

### Community 0 - "Geometria e enquadramento"
Cohesion: 0.10
Nodes (32): caixaDoQuad(), enquadrarEspiada(), enquadrarFoco(), enquadrarParede(), matrix3dCSS(), matrizTela(), transformCSS(), formatar() (+24 more)

### Community 1 - "Notebook e DOM"
Cohesion: 0.14
Nodes (36): botao(), el(), icone(), criarNotebook(), abrirApp(), atualizarRelogio(), cabecalhoApp(), horaAgora() (+28 more)

### Community 2 - "Cliente GitHub e cache"
Cohesion: 0.14
Nodes (30): criarArmazenamento(), VERSAO_ARMAZENAMENTO, criarClienteGitHub(), atualizarAgora(), chamar(), lerCache(), reserva(), rodada() (+22 more)

### Community 3 - "Orquestração do quarto"
Cohesion: 0.12
Nodes (32): itemPorId(), paredeVizinha(), montarApp(), abrirMenu(), agendarBlecaute(), apertarEnergia(), atualizarAvisoGire(), atualizarNomeParede() (+24 more)

### Community 4 - "Scripts de teste e mutação"
Cohesion: 0.08
Nodes (11): cliente, DESTINO, MUTANTES, RAIZ, PORTA, RAIZ, TIPOS, largura (+3 more)

### Community 5 - "Links seguros e WhatsApp"
Cohesion: 0.19
Nodes (22): CONFIG, tempoRelativo(), abrirExterno(), analisar(), criarLink(), destinoPermitido(), ehExato(), ehGithubDoDono() (+14 more)

### Community 6 - "Gestos, idioma e main"
Cohesion: 0.12
Nodes (20): instalarGestos(), limitarDeslocamento(), limitarZoom(), aplicarTextos(), criarI18n(), idiomaInicial(), IDIOMAS, armazenamento (+12 more)

### Community 7 - "Verificação do build"
Cohesion: 0.10
Nodes (19): achados, arquivos, cab, comMeta, faltando, gz, leves, PADROES (+11 more)

### Community 8 - "Energia e blecaute"
Cohesion: 0.23
Nodes (9): criarBlecaute(), criarEnergia(), depois(), desligarNormal(), ir(), limparTemporizador(), ESTADOS, simular() (+1 more)

### Community 9 - "package.json"
Cohesion: 0.13
Nodes (14): description, engines, node, name, private, scripts, instantaneo, mutacao (+6 more)

### Community 10 - "Medalhas 3D"
Cohesion: 0.30
Nodes (13): criarPainelMedalhas(), ajustarTamanho(), aplicarTexturas(), desenhar(), desenharInfo(), escolher(), modo2D(), montar3D() (+5 more)

### Community 11 - "Preparo das ilustrações"
Cohesion: 0.31
Nodes (4): achar_original(), main(), preparar(), salvar_sem_metadados()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `montarApp()` connect `Orquestração do quarto` to `Geometria e enquadramento`, `Notebook e DOM`, `Cliente GitHub e cache`, `Links seguros e WhatsApp`, `Gestos, idioma e main`, `Energia e blecaute`, `Medalhas 3D`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `montarApp()` (e.g. with `comecar()` and `voltar()`) actually correct?**
  _`montarApp()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Geometria e enquadramento` be split into smaller, more focused modules?**
  _Cohesion score 0.10101010101010101 - nodes in this community are weakly interconnected._
- **Why does `criarQuarto()` connect `Geometria e enquadramento` to `Gestos, idioma e main`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `criarQuarto()` (e.g. with `carregarImagens()` and `encaixarTela()`) actually correct?**
  _`criarQuarto()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Notebook e DOM` be split into smaller, more focused modules?**
  _Cohesion score 0.14304993252361672 - nodes in this community are weakly interconnected._
- **Why does `criarClienteGitHub()` connect `Cliente GitHub e cache` to `Orquestração do quarto`, `Scripts de teste e mutação`, `Gestos, idioma e main`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._