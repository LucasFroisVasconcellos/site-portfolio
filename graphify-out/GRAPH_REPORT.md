# Graph Report - site-portfolio  (2026-11-05)

## Corpus Check
- 46 files · ~24,162 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .css 6, (none) 4, .xml 1)

## Summary
- 337 nodes · 800 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a79f69b8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Geometria e enquadramento
- Notebook e DOM
- Cliente GitHub e cache
- instalarBlecaute
- instantaneo.mjs
- Links seguros e WhatsApp
- Gestos, idioma e main
- Verificação do build
- Energia e blecaute
- package.json
- Medalhas 3D
- Preparo das ilustrações
- geral.test.mjs
- rodar.mjs
- servidor.mjs

## God Nodes (most connected - your core abstractions)
1. `el()` - 31 edges
2. `criarQuarto()` - 29 edges
3. `criarSistema()` - 23 edges
4. `criarNotebook()` - 20 edges
5. `botao()` - 17 edges
6. `criarClienteGitHub()` - 16 edges
7. `instalarModos()` - 14 edges
8. `icone()` - 14 edges
9. `instalarBlecaute()` - 13 edges
10. `iniciar()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `simular()` --calls--> `criarBlecaute()`  [EXTRACTED]
  tests/blecaute.test.mjs → site/js/blecaute.js
- `nova()` --calls--> `criarEnergia()`  [EXTRACTED]
  tests/energia.test.mjs → site/js/pc/energia.js
- `cliente()` --calls--> `criarArmazenamento()`  [EXTRACTED]
  tests/github.test.mjs → site/js/armazenamento.js
- `cliente()` --calls--> `criarClienteGitHub()`  [EXTRACTED]
  tests/github.test.mjs → site/js/github/cliente.js
- `instalarBlecaute()` --calls--> `criarBlecaute()`  [EXTRACTED]
  site/js/app/blecaute-app.js → site/js/blecaute.js

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "Geometria e enquadramento"
Cohesion: 0.17
Nodes (22): caixaDoQuad(), enquadrarEspiada(), enquadrarFoco(), enquadrarParede(), matrix3dCSS(), matrizTela(), transformCSS(), itensDaParede() (+14 more)

### Community 1 - "Notebook e DOM"
Cohesion: 0.26
Nodes (20): icone(), criarSistema(), abrir(), alternarMenu(), aplicarResolucao(), arrastar(), atualizarRelogio(), atualizarTarefas() (+12 more)

### Community 2 - "Cliente GitHub e cache"
Cohesion: 0.14
Nodes (30): criarArmazenamento(), VERSAO_ARMAZENAMENTO, criarClienteGitHub(), atualizarAgora(), chamar(), lerCache(), reserva(), rodada() (+22 more)

### Community 3 - "instalarBlecaute"
Cohesion: 0.20
Nodes (14): instalarBlecaute(), agendarBlecaute(), atualizarSetaLigue(), condicoesBlecaute(), entrada(), executarBlecaute(), mostrarLigue(), reavaliarBlecaute() (+6 more)

### Community 4 - "instantaneo.mjs"
Cohesion: 0.20
Nodes (4): cliente, DESTINO, MUTANTES, RAIZ

### Community 5 - "Links seguros e WhatsApp"
Cohesion: 0.12
Nodes (41): CONFIG, botao(), el(), tempoRelativo(), abrirExterno(), analisar(), criarLink(), destinoPermitido() (+33 more)

### Community 6 - "Gestos, idioma e main"
Cohesion: 0.12
Nodes (23): ARQUIVOS, carregarJSON(), mostrarErroCarregamento(), progresso(), criarContadorFps(), instalarIdioma(), instalarPasseio(), instalarTecladoEGestos() (+15 more)

### Community 7 - "Verificação do build"
Cohesion: 0.10
Nodes (19): achados, arquivos, cab, comMeta, faltando, gz, leves, PADROES (+11 more)

### Community 8 - "Energia e blecaute"
Cohesion: 0.21
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

### Community 13 - "geral.test.mjs"
Cohesion: 0.09
Nodes (27): instalarMenu(), abrirMenu(), fecharMenu(), irParaItem(), montarMenu(), instalarModos(), atualizarAvisoGire(), atualizarNomeParede() (+19 more)

### Community 14 - "rodar.mjs"
Cohesion: 0.17
Nodes (4): largura, RAIZ, resultados, servidor

### Community 15 - "servidor.mjs"
Cohesion: 0.29
Nodes (3): PORTA, RAIZ, TIPOS

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarQuarto()` connect `Geometria e enquadramento` to `geral.test.mjs`, `Gestos, idioma e main`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `criarQuarto()` (e.g. with `carregarImagens()` and `encaixarTela()`) actually correct?**
  _`criarQuarto()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Cliente GitHub e cache` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Why does `criarSistema()` connect `Notebook e DOM` to `Links seguros e WhatsApp`, `Gestos, idioma e main`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `criarSistema()` (e.g. with `abrir()` and `fechar()`) actually correct?**
  _`criarSistema()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Links seguros e WhatsApp` be split into smaller, more focused modules?**
  _Cohesion score 0.11689291101055807 - nodes in this community are weakly interconnected._
- **Why does `instalarTelas()` connect `Gestos, idioma e main` to `Notebook e DOM`, `Cliente GitHub e cache`, `instalarBlecaute`, `Links seguros e WhatsApp`, `Energia e blecaute`, `Medalhas 3D`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._