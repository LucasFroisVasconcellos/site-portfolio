# Registro de evidência

Formato da seção 10.9 do ARQ-002. Um teste não executado nunca aparece como PASS.

## Versão 0.2.0: auditoria de 17/10/2026

Auditoria de qualidade (10 itens) e de segurança (regras de out/2026), com as correções aplicadas. O detalhe da segurança está em `SEGURANCA.md`.

| Bloco | Resultado |
|---|---|
| Testes unitários (`npm test`) | 69/69 PASS |
| Testes no navegador (`npm run test:e2e`, Chromium 141) | 30/30 PASS |
| Mutação dos controles (`npm run mutacao`) | 14/14 mutantes mortos |
| Conferência do build (`npm run verificar`) | 9/9 PASS |

### Os 10 itens da auditoria de qualidade

| Item | Antes | Agora | Evidência |
|---|---|---|---|
| Responsivo | PASS | PASS | 10 tamanhos de 320 a 2560 px: sem rolagem lateral, controles sem sobreposição, áreas de toque de 44 px. Páginas de texto sem rolagem lateral em 320 px |
| Acessibilidade | FAIL | PASS no laboratório | h1 visível; pinça do navegador liberada; brilho para em 4,5 s; texto do PC no celular em pé de 7,9 para 10,5 px; nenhum par de texto e fundo abaixo de 4,5:1; teclado e nomes de botões testados. Leitor de tela real: **NOT_TESTED** (falta TalkBack no Note 10) |
| Desempenho | FAIL | Melhorou; **FAIL** pela meta | Laboratório com 4G lento e processador 4x mais lento: maior elemento (LCP) de 3,8 para 2,8 s (a meta do Google é 2,5 s); quarto pronto de 4,2 para 3,4 s; 50 requisições, 306 kB; layout sem saltos (CLS 0). Cache confirmado no ar (prévia): imagens com `max-age=604800`. Lighthouse no site publicado: **NOT_TESTED** |
| Imagens WebP, abaixo de 300 KB | FAIL técnico | FAIL técnico (aceito) | Todas abaixo de 300 KB (a maior tem 66 KB). Só a `previa.jpg` não é WebP, de propósito: é a imagem de prévia do link, e o WhatsApp lê JPG com mais segurança |
| Vídeos WebM | N/A | N/A | O site não tem vídeo |
| Imagens reais | FAIL | **FAIL** (depende do Lucas) | Imagens de marcação removidas e captura real do próprio site no projeto. Faltam as fotos de handebol, de perfil e dos outros projetos |
| Design e texto | FAIL | PASS | Nenhum texto de marcação no ar (teste automático). Ressalva: as duas paredes provisórias continuam com o aviso de provisória |
| SEO | FAIL | PASS (prévia) | Na prévia do Cloudflare: `robots.txt` em texto, `sitemap.xml` em XML e endereço inexistente com **404** de verdade. Canonical, dados estruturados, h1 e `/sobre/`. Indexação real no Google: **NOT_TESTED** (Search Console) |
| GEO | FAIL | PASS (prévia) | `/sobre/` legível sem JavaScript, com projetos, ferramentas, formação, conquistas e contato; dados estruturados Person e ProfilePage |
| Privacidade | FAIL | PASS | `/privacidade/` com controlador, dados, finalidade, retenção, base legal e direitos, com link fixo no quarto |
| Domínio, SSL, HTTPS | FAIL / PASS / PASS | FAIL / PASS / PASS | Ainda sem domínio próprio. Certificado válido nas conexões. `http://lucasfrois.pages.dev/` responde **301** para https (conferido em 17/10), com HSTS de 1 ano. Validade e protocolos do certificado: **NOT_TESTED** (o SSL Labs não terminou) |

### Pendências registradas

| Pendência | Situação | Motivo |
|---|---|---|
| Fotos reais | ACCEPTED_EVIDENCE_GAP | Dependem do Lucas e da lista da seção 9.3 |
| Domínio próprio | ACCEPTED_EVIDENCE_GAP | Custa dinheiro; fica para depois |
| Ilustrações das paredes em 2560 px | ACCEPTED_EVIDENCE_GAP | As originais têm 1024 px; precisam ser geradas de novo |
| Three.js minificado | ACCEPTED_EVIDENCE_GAP | O repositório oficial não traz a versão minificada; ela só vem no pacote npm, que não estava acessível. Hoje é baixado só ao abrir as medalhas |
| 2FA nas contas | NOT_TESTED | A API não mostra; o Lucas precisa conferir |

---

## Versão 0.1.0 (12/10/2026)

## Resumo

| Bloco | Resultado |
|---|---|
| Testes unitários (`npm test`) | 67/67 PASS |
| Testes no navegador (`npm run test:e2e`, Chromium 141) | 25/25 PASS |
| Mutação dos controles (`npm run mutacao`) | 14/14 mutantes mortos |
| Conferência do build (`npm run verificar`) | 8/8 PASS |

## Casos da seção 10

| Caso | Resultado | Onde |
|---|---|---|
| BL-01 a BL-12 | PASS | Unitário, com relógio simulado; BL-01, BL-02, BL-08, BL-09 e BL-12 também no navegador |
| PC-01 a PC-08 | PASS | Unitário; PC-01 a PC-04 e PC-07 também no navegador |
| GH-01 a GH-14 | PASS | Unitário com respostas simuladas; GH-07 e GH-08 também no navegador |
| WA-01 a WA-09 | PASS | Unitário; WA-01, WA-06, WA-07 e WA-08 também no navegador |
| SG-01 | PASS | `npm run verificar` |
| SG-02 | PASS | Unitário e navegador |
| SG-03 | BLOCKED_ENVIRONMENT | Os cabeçalhos estão no `_headers` e o servidor local os aplica (nenhuma violação de CSP em 25 testes), mas o endereço publicado ainda não existe |
| SG-04 | ACCEPTED_EVIDENCE_GAP | Sem dependências npm, não há o que o `npm audit` conferir. O Three.js vendorizado tem o SHA-256 conferido por teste |
| SG-05 a SG-07 | PASS | Navegador e `npm run verificar` |

## Auditoria adversária (seção 10.7)

| Técnica | Resultado | Observação |
|---|---|---|
| 100.000 respostas aleatórias no validador do GitHub | PASS | Nenhuma exceção; limites respeitados |
| 100.000 textos aleatórios no link do WhatsApp | PASS | Link sempre com o número fixo e só o parâmetro `text` |
| 100.000 sequências de 50 eventos no PC e no blecaute | PASS | Invariantes 5 e 6 em todos os passos |
| Concorrência: toques rápidos, consulta cancelada ao desligar, resposta atrasada | PASS | PC-05, PC-06, GH-12, GH-14 |
| Concorrência: aba oculta no meio da consulta, duas abas no mesmo cache | NOT_TESTED | Coberto só por leitura de código (resposta descartada pela geração; cache validado em toda leitura) |
| Mutação dos controles | PASS | 14/14. A primeira rodada achou 2 mutantes vivos (geração do PC e limite da API): viraram um teste novo e uma correção, ver DECISOES.md item 13 |

## Requisitos

| Requisito | Resultado | Observação |
|---|---|---|
| RF-01 | PASS no Chromium (412×869, 869×412, 320×568, 1366×768, 2560×1440) | Falta conferir no Note 10 de verdade |
| RF-02 a RF-07, RF-09 a RF-23, RF-25 a RF-32, RF-35, RF-36 | PASS | Testes no navegador ou capturas de tela conferidas |
| RF-08 | PASS por inspeção | Mensagem para navegador sem módulos ou sem JavaScript; ver DECISOES.md item 4 |
| RF-24 (pinça) | NOT_TESTED | Gesto de dois dedos só dá para conferir no aparelho |
| RF-33 (tradutor do Chrome) | NOT_TESTED | Conferência manual |
| RF-34 (medição) | PASS no unitário | Desligada até ter o ID do Umami |
| RNF-01, RNF-02 (fluidez) | NOT_TESTED | Medir no Note 10 e no PC com `Ctrl + Shift + F` |
| RNF-03 (tempo até o quarto) | NOT_TESTED | Medir com Lighthouse no endereço publicado |
| RNF-04, RNF-05 | PASS | 50,6 kB de código comprimido; 2,43 MB no total |
| RNF-09 (navegadores) | NOT_TESTED | Só Chromium aqui; faltam Edge, Firefox, Chrome do Android e navegador do Instagram |
| RNF-10 a RNF-13 | PASS | 44 px de toque e teclado testados no navegador |
| RNF-16, RNF-17 | PASS | Navegador |
| RNF-18 | BLOCKED_ENVIRONMENT | Igual ao SG-03 |
| iPhone e Android de entrada | NOT_TESTED | Não há aparelho |
