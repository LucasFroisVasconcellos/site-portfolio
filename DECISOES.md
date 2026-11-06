# Decisões desta versão (0.1.0, 12/10/2026)

O que mudou em relação ao ARQ-002 v1.1 e por quê. Todo controle deixado de fora está aqui, de propósito.

## Pedidas pelo Lucas

1. **Notebook no lugar do celular virtual.** O notebook em cima da mesa ganhou a tela inicial e os três aplicativos emulados (WhatsApp, Instagram, LinkedIn). Valem as regras da seção 3.6 (sempre ligado, abre na tela inicial, rascunho só na memória) e o notebook continua aceso no blecaute, porque tem bateria. A tela dele é 800 × 500, deitada, por isso o aviso "Gire o celular" vale também para ela. O evento de medição virou `abrir-notebook`.
2. **Duas paredes por enquanto.** Frente (PC) e direita (guarda-roupa) usam as ilustrações do Gemini. Trás e esquerda são desenhos provisórios, com um aviso na própria parede, só para o quadro digital, as medalhas e as setas funcionarem desde já.

## Técnicas

3. **Sem Vite e sem build.** O ambiente onde o site foi feito não tinha acesso ao npm. O site ficou em JavaScript puro com módulos nativos, que o Cloudflare Pages serve direto da pasta `site/`. Ganho: zero dependências instaladas, nada para auditar com `npm audit`, nenhum lockfile necessário. O Three.js r186 foi copiado do repositório oficial, com a licença e o SHA-256 conferidos por teste (`vendor/three-r186/VERSAO.txt`).
4. **O quarto é desenhado com CSS, não com WebGL.** As paredes são imagens vistas de frente; mover e ampliar imagem é o que o navegador faz de mais leve. Resultado: nenhuma chamada de desenho, nenhuma luz, texto das telas sempre nítido e nenhum risco do R2 (HTML sobre 3D no iPhone). O Three.js ficou só nas medalhas (RF-31), baixado quando o visitante as abre. Por isso:
   - RF-08 (sem WebGL 2): o quarto abre mesmo sem WebGL; só as medalhas caem para 2D. A mensagem com os links aparece para navegadores sem módulos JavaScript ou sem JavaScript.
   - RNF-06 e RNF-07 (chamadas de desenho e memória de textura) deixam de se aplicar ao quarto.
   - RNF-16 (perda do contexto gráfico) vale para as medalhas e foi testado.
   - O CSS3DRenderer não foi usado: as telas são encaixadas com uma homografia própria (`geometria.js`, testada).
5. **Resolução do monitor: 1200 × 720 (compacta 800 × 480)**, no lugar de 1280 × 720, para casar com a proporção da tela desenhada na ilustração (16:10) sem distorcer.
6. **No foco das telas a ilustração ampliada fica desfocada nas bordas**, com uma vinheta escura. As ilustrações têm 1024 px de largura; ampliadas 20 vezes ficam serrilhadas. Com imagens de 2560 px isso melhora.
7. **Em tela deitada e larga (celular deitado), os botões do foco ficam em colunas nas laterais**, para não cobrir a tela do PC ou do notebook.
8. **"Parado não gasta bateria" (RNF-08) tem duas exceções conscientes:** o contorno dos itens pulsa sem parar (exigido pelo RF-04) e os relógios do PC e do notebook atualizam a cada 15 s. As duas param quando a aba fica oculta (o pulso é animação de CSS, que o navegador já pausa). A cena não tem nenhum laço de desenho.
9. **Botão de ligar:** é o gabinete na mesa. No foco do monitor desligado aparece também um botão de ligar no canto da tela.
10. **Sistema virtual se chama FroisOS**, com logotipo próprio (seção 9.4).
11. **Textos dos post-its, do LinkedIn e dos projetos são rascunhos** montados com o que o Lucas já contou (UFSCar, Tribal Wars, Python e SQL, ciência de dados, handebol). A versão final entra na Fase 7. Fotos, medalhas e Instagram usam imagens de marcação.
12. **Medição desligada** até existir o ID do site no Umami (`config.js`). Sem ID, nada é enviado.
13. **Checagem duplicada do limite da API removida.** A auditoria de mutação mostrou que a suspensão por `x-ratelimit-reset` era conferida em dois lugares e nenhum teste distinguia os dois. Ficou um único ponto (`chamar()`), que cobre todos os caminhos e agora é morto pelo teste GH-02.

## Auditoria de 17/10/2026

14. **Nada de marcação no ar.** Textos "Fase 7", "a completar", "a definir" e as imagens de marcação saíram. Sem fotos reais, o quadro digital mostra só "em breve" e o Instagram mostra só o botão para o perfil verdadeiro. O projeto "Gerenciador de mercado" saiu da lista até ter descrição. A imagem do projeto "Este site" é uma captura real do próprio site. Um teste impede texto de marcação de voltar.
15. **Páginas em texto `/sobre/` e `/privacidade/`.** Não são a versão 2D recusada: são o conteúdo para buscadores, IAs e quem não roda JavaScript, com link fixo no quarto (canto superior esquerdo e menu "Ir para").
16. **O brilho dos itens pulsa 3 vezes (4,5 s)** ao chegar em cada parede e depois fica aceso parado (WCAG 2.2.2 e bateria). Isso substitui o pulso contínuo do RF-04.
17. **Pinça do navegador liberada no quarto.** No modo Foco das telas, a pinça continua sendo a do próprio site (RF-24).
18. **Telas menores no celular em pé:** PC com 640 × 384 e notebook com 640 × 400, com fonte maior. O texto do PC passou de 7,9 px para 10,5 px no Note 10 em pé. O aviso "Gire o celular" continua.
19. **Repositório continua público** (decisão do Lucas, 17/10/2026), como exceção à regra de repositório privado, porque o portfólio mostra o próprio código.
20. **Sem banco de dados**: não é necessário; o motivo está em `SEGURANCA.md`.
21. **Testes no navegador ficam fora do GitHub Actions.** O CI roda os testes unitários e a conferência do build sem instalar nada, então não entra código de terceiros no pipeline. Os 30 testes do Playwright rodam no PC (`npm run test:e2e`).

## Visual, novembro de 2026

22. **Paredes em alta resolução com IA.** Frente e direita ampliadas 3× com Real-ESRGAN (`realesr-animevideov3`) e servidas em 2560 px. Arquivos com versão no nome (`-v2`, `-v3`) porque o `_headers` guarda `/img/*` por 7 dias.
23. **Objetos da parede do PC feitos em código** (`objetos.js`): monitor, notebook e gabinete em SVG, copiando forma, cor e posição da ilustração; o fundo da frente não tem mais esses objetos. Os 4 post-its viraram itens separados, com o título escrito neles (legível sem clicar); clicar abre aquele post-it grande.
24. **Exceção consciente ao RNF-08:** as ventoinhas do gabinete giram com o PC ligado. Param com o PC desligado, com a parede fora da tela, com a aba oculta e com "reduzir movimento".
25. **Sem contorno amarelo nos itens.** O próprio objeto (monitor, notebook, gabinete, post-its, quadro, medalhas) é o botão; só quem navega pelo teclado vê um contorno, para saber onde está (WCAG 2.4.7). Substitui o RF-04 e a decisão 16.
26. **Post-its realistas, no tamanho do desenho:** desenhados em SVG (`objetos.js`) com papel, faixa de cola, canto levantado, sombra e letra à mão (Caveat, licença OFL, em `fontes/`). O título e o texto inteiro ficam escritos neles, pequenos na parede; o clique aproxima a câmera até dar para ler (sem cartão por cima).
27. **Cores fixas:** `color-scheme: only light` (meta e CSS) contra o modo escuro automático do navegador. Como o Samsung Internet pode ignorar isso, as cores importantes do quarto ficam em SVG, que ele não escurece. CSS e JS com `no-cache` para ninguém ver visual antigo guardado.
28. **Interface nova (entrega 3):** a mesma tinta preta e os mesmos objetos do desenho. Nome numa fita crepe, nome da parede num post-it, botões e setas com contorno de caneta e sombra chapada, idioma escolhido em tinta. Letra da interface: Shantell Sans (OFL, em `fontes/`). No celular estreito, só o nome na fita (Sobre e Privacidade ficam no menu "Ir para").
29. **Bilhete ao passar o mouse:** cada objeto mostra um bilhete com o nome e o que ele faz. Só em telas com mouse; no toque, o clique já abre o objeto.
30. **Projetos no PC:** ERP Associações (o principal, com link do GitHub) e o Auditor de segurança (repositório privado, sem link) entram na pasta Projetos.
31. **Instagram e LinkedIn no notebook (entrega 4):** montados a partir das capturas de tela do próprio Lucas. Instagram: foto de perfil, bio, número de publicações e a grade em 5 colunas na proporção 3:4, como no app. A foto com outra pessoa não foi publicada (ARQ-002 9.3): a posição dela vira "ver no Instagram" e abre o perfil de verdade. LinkedIn: capa, foto, título, cidade e faculdade; nada de terceiros (quem visitou o perfil, sugestões de pessoas).
32. **Palco com `overflow: clip`:** com `hidden`, o navegador rolava o palco ao focar um botão da tela do notebook durante o passeio de abertura, e a tela ficava cortada à esquerda. `clip` não permite essa rolagem. Teste RF-05/IG/LI cobre o caso.
33. **FroisOS em papel e tinta (entrega 5):** área de trabalho com o fundo azul antigo (pedido do Lucas), janelas com borda de tinta e sombra chapada, barra de título cor de fita (amarelo post-it na janela ativa), barra de tarefas de papel, menu e botões com contorno de caneta. Letra Shantell Sans nos títulos, menus e barra; o texto longo das janelas continua na letra do sistema, para ler melhor. A tela inicial do notebook ficou como estava (não fazia parte da entrega).
34. **Fundo do foco com buraco:** o escurecido em volta da tela no foco tinha forma de elipse e sujava as bordas da própria tela. Agora é um buraco do tamanho da tela (quarto.js passa a posição em variáveis CSS): escurece só a ilustração em volta.
35. **Sem aviso de "Simulação" no notebook:** a pedido do Lucas, saem o selo "Simulação" e as faixas amarelas do WhatsApp, do Instagram e do LinkedIn (o SG-07 deixa de valer para o notebook). O que continua: o perfil é o dele, nada é coletado, o WhatsApp só abre depois da confirmação de envio e os botões "Abrir no..." levam ao site de verdade. O aviso do app GitHub no PC ficou.
