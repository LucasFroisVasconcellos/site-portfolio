# Arquitetura do site (05/11/2026)

Desenho feito a partir do grafo do Graphify (`graphify-out/`). Para ver o grafo completo e interativo, abra `graphify-out/graph.html` no navegador.

```mermaid
flowchart TD
    CF["Cloudflare Pages<br/>pasta site/ estática + _headers (CSP)"] --> MAIN["main.js<br/>montarApp(): orquestra tudo"]
    MAIN --> Q["Quarto<br/>quarto.js · itens.js · geometria.js<br/>gestos.js · passeio.js"]
    MAIN --> PC["PC (FroisOS)<br/>energia.js · blecaute.js<br/>pc/sistema.js · pc/apps.js<br/>github/cliente.js · validar.js"]
    MAIN --> NB["Notebook<br/>notebook/notebook.js<br/>whatsapp.js · links.js"]
    MAIN --> PA["Parede<br/>parede/parede.js (post-its, quadro)<br/>parede/medalhas.js"]
    Q --> IMG["img/paredes<br/>WebP leve e nítido"]
    PC --> GH(("api.github.com<br/>cache local + github-instantaneo.json"))
    NB --> EXT(("wa.me, Instagram, LinkedIn<br/>só por links filtrados"))
    PA --> THREE["vendor/three-r186<br/>baixado só ao abrir as medalhas"]
    BASE["Base compartilhada<br/>config.js · i18n.js + conteudo/*.json<br/>dom.js · armazenamento.js · medicao.js"]
    Q -.-> BASE
    PC -.-> BASE
    NB -.-> BASE
    PA -.-> BASE
```

## Pontos que o grafo mostra

| Ponto | O que quer dizer |
|---|---|
| `montarApp()` em `main.js` tem 46 ligações (a função mais conectada) | O `main.js` concentra quase toda a orquestração. É o primeiro alvo de uma refatoração de código. |
| `el()`, `botao()` e `icone()` (em `dom.js`) vêm logo depois | Toda a interface é montada por essas três funções. Uma mudança visual passa por elas. |
| Nenhum ciclo de importação | Os módulos dependem só "para baixo" (da base). Isso precisa continuar assim. |
| Módulos sem tela (`energia`, `blecaute`, `whatsapp`, `links`, `github/`, `armazenamento`) têm testes no Node | A refatoração do front-end pode mexer nas telas sem quebrar essas regras, desde que os testes continuem verdes. |

## Fora do grafo, de propósito (`.graphifyignore`)

`site/vendor/` (Three.js de terceiros), `site/img/`, `site/conteudo/`, páginas `.html`, `.md`, `.txt` e `.github/`. O grafo fica só com o código, sem custo de extração.
