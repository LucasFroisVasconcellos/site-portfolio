# Decisões desta versão (0.1.0, 12/10/2026)

O que mudou em relação ao ARQ-002 v1.1 e por quê. Todo controle deixado de fora está aqui, de propósito.

## Pedidas pelo Lucas

1. **Notebook no lugar do celular virtual.** O notebook em cima da mesa ganhou a tela inicial e os três aplicativos emulados (WhatsApp, Instagram, LinkedIn). Valem as regras da seção 3.6 (sempre ligado, abre na tela inicial, rascunho só na memória) e o notebook continua aceso no blecaute, porque tem bateria. A tela dele é 800 × 500, deitada, por isso o aviso "Gire o celular" vale também para ela. O evento de medição virou `abrir-notebook`.
2. **Duas paredes por enquanto.** Frente (PC) e direita (guarda-roupa) usam as ilustrações do Gemini. Trás e esquerda são desenhos provisórios, com um aviso na própria parede, só para o quadro digital, as medalhas e as setas funcionarem desde já.

## Técnicas

3. **Sem Vite e sem build.** O ambiente onde o site foi feito não tinha acesso ao npm. O site ficou em JavaScript puro com módulos nativos, que o Cloudflare Pages serve direto da pasta `site/`. Ganho: zero dependências instaladas, nada para auditar com `npm audit`, nenhum lockfile necessário. O Three.js r186 foi copiado do repositório oficial, com a licença e o SHA-256 conferidos por teste (`vendor/three/VERSAO.txt`).
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
