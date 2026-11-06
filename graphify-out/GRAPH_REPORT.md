# Graph Report - site-portfolio  (2026-11-06)

## Corpus Check
- 49 files · ~28,067 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 4, .woff2 2)

## Summary
- 374 nodes · 904 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f106cf7a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Geometria e enquadramento
- Cliente GitHub e cache
- instalarModos
- instantaneo.mjs
- Links seguros e WhatsApp
- main.js
- Verificação do build
- Energia e blecaute
- package.json
- Medalhas 3D
- Preparo das ilustrações
- teclado-gestos.js
- rodar.mjs
- servidor.mjs
- objetos.js

## God Nodes (most connected - your core abstractions)
1. `criarQuarto()` - 38 edges
2. `el()` - 29 edges
3. `criarSistema()` - 23 edges
4. `criarNotebook()` - 19 edges
5. `botao()` - 17 edges
6. `criarClienteGitHub()` - 16 edges
7. `icone()` - 14 edges
8. `svg()` - 14 edges
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
- `montarApp()` --calls--> `instalarBlecaute()`  [EXTRACTED]
  site/js/main.js → site/js/app/blecaute-app.js

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "Geometria e enquadramento"
Cohesion: 0.11
Nodes (38): caixaDoQuad(), enquadrarEspiada(), enquadrarFoco(), enquadrarParede(), matrix3dCSS(), matrizTela(), transformCSS(), itensDaParede() (+30 more)

### Community 2 - "Cliente GitHub e cache"
Cohesion: 0.14
Nodes (30): criarArmazenamento(), VERSAO_ARMAZENAMENTO, criarClienteGitHub(), atualizarAgora(), chamar(), lerCache(), reserva(), rodada() (+22 more)

### Community 3 - "instalarModos"
Cohesion: 0.36
Nodes (8): instalarModos(), atualizarAvisoGire(), atualizarNomeParede(), definirModo(), focar(), girar(), precisaGirar(), voltar()

### Community 4 - "instantaneo.mjs"
Cohesion: 0.20
Nodes (4): cliente, DESTINO, MUTANTES, RAIZ

### Community 5 - "Links seguros e WhatsApp"
Cohesion: 0.09
Nodes (60): CONFIG, botao(), el(), icone(), tempoRelativo(), abrirExterno(), analisar(), criarLink() (+52 more)

### Community 6 - "main.js"
Cohesion: 0.08
Nodes (37): enderecoNoChrome(), instalarAvisoEscuro(), samsungComTemaEscuro(), ARQUIVOS, carregarJSON(), mostrarErroCarregamento(), progresso(), criarContadorFps() (+29 more)

### Community 7 - "Verificação do build"
Cohesion: 0.10
Nodes (19): achados, arquivos, cab, comMeta, faltando, gz, leves, PADROES (+11 more)

### Community 8 - "Energia e blecaute"
Cohesion: 0.11
Nodes (23): instalarBlecaute(), agendarBlecaute(), atualizarSetaLigue(), condicoesBlecaute(), entrada(), executarBlecaute(), mostrarLigue(), reavaliarBlecaute() (+15 more)

### Community 9 - "package.json"
Cohesion: 0.13
Nodes (14): description, engines, node, name, private, scripts, instantaneo, mutacao (+6 more)

### Community 10 - "Medalhas 3D"
Cohesion: 0.30
Nodes (13): criarPainelMedalhas(), ajustarTamanho(), aplicarTexturas(), desenhar(), desenharInfo(), escolher(), modo2D(), montar3D() (+5 more)

### Community 11 - "Preparo das ilustrações"
Cohesion: 0.31
Nodes (4): achar_original(), main(), preparar(), salvar_sem_metadados()

### Community 13 - "teclado-gestos.js"
Cohesion: 0.46
Nodes (4): instalarTecladoEGestos(), instalarGestos(), limitarDeslocamento(), limitarZoom()

### Community 14 - "rodar.mjs"
Cohesion: 0.17
Nodes (4): largura, RAIZ, resultados, servidor

### Community 15 - "servidor.mjs"
Cohesion: 0.29
Nodes (3): PORTA, RAIZ, TIPOS

### Community 16 - "objetos.js"
Cohesion: 0.25
Nodes (20): criarObjetos(), criarPostitsSvg(), ELIPSE_LADO, escreverPostits(), filtroSombra(), gabinete(), gabineteLado(), larguraTexto() (+12 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarQuarto()` connect `Geometria e enquadramento` to `objetos.js`, `main.js`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `criarQuarto()` (e.g. with `carregarImagens()` and `encaixarTela()`) actually correct?**
  _`criarQuarto()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Geometria e enquadramento` be split into smaller, more focused modules?**
  _Cohesion score 0.10606060606060606 - nodes in this community are weakly interconnected._
- **Why does `criarSistema()` connect `Links seguros e WhatsApp` to `main.js`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `criarSistema()` (e.g. with `abrir()` and `fechar()`) actually correct?**
  _`criarSistema()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Cliente GitHub e cache` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Why does `instalarTelas()` connect `main.js` to `Energia e blecaute`, `Cliente GitHub e cache`, `Medalhas 3D`, `Links seguros e WhatsApp`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._