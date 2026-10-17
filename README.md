# Site Portfólio (ARQ-002)

O quarto do Lucas no navegador: quatro paredes ilustradas, PC com sistema de janelas e o app do GitHub, notebook com WhatsApp, Instagram e LinkedIn, post-its, quadro digital e medalhas em 3D.

O site é estático: HTML, CSS e JavaScript puro, sem servidor e sem etapa de build. A única biblioteca é o Three.js (r186), guardada em `site/vendor/three-r186` e baixada só quando o visitante abre as medalhas.

## Pastas

| Pasta | O que tem |
|---|---|
| `site/` | Tudo o que vai ao ar (é a pasta publicada) |
| `site/js/` | Código. Os arquivos sem tela (`energia.js`, `blecaute.js`, `whatsapp.js`, `links.js`, `github/`, `armazenamento.js`, `medicao.js`) têm testes no Node |
| `site/js/itens.js` | Posição e tamanho de todas as áreas clicáveis (RNF-21) |
| `site/js/config.js` | Usuário do GitHub, número do WhatsApp, perfis e limites |
| `site/conteudo/` | Textos em PT e EN, projetos, fotos, medalhas, Instagram e LinkedIn (RNF-20) |
| `site/img/paredes/` | Ilustrações prontas (WebP sem metadados) e as paredes provisórias |
| `site/sobre/` e `site/privacidade/` | Páginas em texto: lidas por buscadores, IAs e quem não roda JavaScript |
| `originais/` | Ilustrações originais. **Fica fora do Git** (só no seu PC) |
| `scripts/` | Preparar imagens, servidor local, instantâneo do GitHub, conferência e mutação |
| `tests/` | Testes unitários (`*.test.mjs`) e no navegador (`e2e/`) |

## Rodar no PC

Precisa do Node 20 ou mais novo.

```
npm start            # abre em http://localhost:5173 com os mesmos cabeçalhos do site publicado
npm test             # testes unitários (casos BL, PC, WA, GH, SG e auditoria com valores aleatórios)
npm run verificar    # segredos, metadados das imagens, peso e CSP
npm i -D playwright  # só na primeira vez, para os testes no navegador
npx playwright install chromium
npm run test:e2e     # 22 testes no navegador
npm run mutacao      # tira cada controle de segurança e confere que algum teste falha
```

Para usar o contador de quadros por segundo (RNF-01): `Ctrl + Shift + F` no site.

## Como publicar uma mudança

A branch `main` é protegida: nada entra direto nela, e force push fica bloqueado.

1. Crie uma branch, faça a mudança e rode `npm test` e `npm run verificar`.
2. Envie a branch para o GitHub. O Cloudflare monta uma prévia com endereço próprio, para conferir no Note 10.
3. Abra o pull request. Os testes rodam sozinhos no GitHub Actions (`.github/workflows/testes.yml`).
4. Com os testes verdes, faça o merge. O Cloudflare publica a `main` em lucasfrois.pages.dev.

## Fotos reais (handebol, projetos, Instagram)

Antes de subir qualquer foto, passe pela lista da seção 9.3 do ARQ-002: sem metadados, crédito do fotógrafo e autorização de quem aparece. Depois:
- **Quadro digital:** acrescente em `site/conteudo/fotos.json`. Sem fotos, o quadro mostra só "em breve".
- **Instagram:** acrescente em `site/conteudo/instagram.json` (e a `bio`, se quiser). Sem fotos, aparece só o botão para o Instagram de verdade.
- **Projetos:** campo `imagem` em `site/conteudo/projetos.json`. Projeto sem descrição pronta não deve entrar na lista.
- Rode `npm run verificar`: ele recusa imagem com metadados.

## Trocar ou acrescentar uma parede

1. Salve a imagem do Gemini em `originais/` com o nome da parede: `frente`, `direita`, `tras` ou `esquerda` (`.png`, `.jpg` ou `.webp`).
2. Rode `python scripts/preparar_paredes.py` (precisa do Pillow: `pip install pillow`).
3. Em `site/js/itens.js`, troque a `imagem` da parede para os arquivos `-leve.webp` e `-nitido.webp`, tire o `provisoria: true` e ajuste as áreas clicáveis.

## Publicar no Cloudflare Pages

No painel do Cloudflare: Workers e Pages → Criar → Pages → Conectar ao Git → repositório `site-portfolio`.

| Campo | Valor |
|---|---|
| Framework | Nenhum |
| Comando de build | `node scripts/instantaneo.mjs` |
| Pasta de saída | `site` |

O comando de build só atualiza a cópia dos dados do GitHub; se a API falhar, ele mantém a cópia anterior e a publicação segue. Cada branch ganha um endereço de prévia para testar no Note 10.

Publicado em **https://lucasfrois.pages.dev** (projeto `lucasfrois` no Cloudflare). Se um dia trocar de domínio, atualize `og:image` e `og:url` no `index.html`.

Falta:
- Ligar a medição: criar o site no Umami e colar o ID em `config.js` (`umami.idSite`) e o endereço em `umami.hostsProducao`.
