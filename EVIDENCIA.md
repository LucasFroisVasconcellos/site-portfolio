# Registro de evidência: versão 0.1.0 (12/10/2026)

Formato da seção 10.9 do ARQ-002. Um teste não executado nunca aparece como PASS.

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
