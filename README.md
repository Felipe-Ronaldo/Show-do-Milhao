# Milhão Estelar

Jogo de perguntas e respostas inspirado no Show do Milhão, com tema de **ciência e natureza** e visual de painel de nave espacial (azul-noite, dourado e ciano). O jogador responde 15 perguntas, da mais fácil à mais difícil, acumulando prêmios de R$ 1.000 até R$ 1.000.000.

**Jogo publicado:** `COLE_AQUI_O_LINK_DO_GITHUB_PAGES`
**Repositório:** `COLE_AQUI_O_LINK_DO_REPOSITORIO`

## Tema e tecnologias

- Tema: ciência e natureza, com a história de uma nave que avança a cada acerto.
- APIs: Open Trivia DB (perguntas) e MyMemory (tradução).
- [Three.js](https://threejs.org/) (WebGL) para a cena 3D de fundo, em `cena3d.js`.
- HTML5 (estrutura das 3 telas), CSS3 (identidade visual, grid, responsivo) e JavaScript (lógica e API).
- Fontes do Google Fonts: Unbounded e Nunito.

## Como o jogo funciona

1. **Início:** o botão "Decolar" chama a API e carrega as perguntas.
2. **Jogo:** mostra uma pergunta por vez, com 4 alternativas, a escada de prêmios e o prêmio já garantido.
3. **Ajudas:** "50:50" (elimina 2 alternativas erradas, uma vez por jogo) e "Parar" (leva o prêmio acumulado).
4. **Regras:** acertou, sobe um degrau. Errou, leva metade do prêmio acumulado. Acertar as 15 dá R$ 1.000.000.
5. **Resultado:** tela final com o prêmio e botão para jogar de novo.

## API utilizada e como é consultada

Usei a [Open Trivia DB](https://opentdb.com/), que fornece perguntas de múltipla escolha gratuitas e sem chave de acesso. Ela é usada para **todas** as perguntas e alternativas do jogo.

No `script.js`, a função `buscarPerguntas()` (comentários `[API]`):

1. Monta a URL `https://opentdb.com/api.php?amount=15&category=17&type=multiple&encode=url3986`. Ela pede 15 perguntas da categoria Ciência e Natureza, com 4 alternativas, e codifica os textos para evitar símbolos quebrados.
2. Usa `fetch()` com `await` para enviar a requisição e esperar a resposta, e `await resposta.json()` para converter em objeto.
3. Confere se `response_code` é 0 e se vieram 15 perguntas. Se não, mostra uma mensagem de erro na tela inicial.
4. Usa `.map()` para transformar cada item em um objeto do jogo: `question` vira o enunciado, `correct_answer` e `incorrect_answers` são juntadas e embaralhadas (função `embaralhar`), e `difficulty` é usado para ordenar da mais fácil para a mais difícil.
5. Ao responder, o código compara o botão clicado com `correct_answer` para decidir se acertou.

### Tradução para português (segunda API)

A Open Trivia DB só tem perguntas em inglês. Por isso, antes de cada pergunta aparecer, a função `traduzir()` envia o enunciado e as 4 alternativas para a API gratuita [MyMemory](https://mymemory.translated.net/) (`fetch` com `await`, de inglês para pt-BR). A resposta é decodificada e usada na tela, e a resposta certa traduzida é a que o jogo compara com o clique do jogador. Se a tradução falhar ou acabar a cota gratuita diária, o jogo continua com o texto original em inglês.

Observação: a Open Trivia DB permite 1 requisição a cada 5 segundos. Por isso, se der erro ao iniciar, o jogo pede para aguardar antes de tentar de novo.

## Cena 3D

O arquivo `cena3d.js` usa Three.js para desenhar um espaço em 3D atrás do jogo: estrelas, asteroides, uma lua, um planeta com anéis e uma nave feita só com formas geométricas. A cada resposta certa, o `script.js` chama `Cena3D.acertou()` e a nave avança em direção ao planeta (a câmera acompanha e o campo de visão aumenta, dando efeito de velocidade). Ao errar, a nave gira e uma luz vermelha acende. Ao chegar na pergunta 15, a nave alcança o planeta. A câmera também reage ao movimento do mouse. O CSS ainda acrescenta letras em 3D no título e uma animação de perspectiva nos painéis. Se o navegador não tiver WebGL, o jogo funciona normalmente sem a cena.

## Etapas de desenvolvimento

1. Planejamento: tema, nome, paleta de cores e telas (início, jogo, resultado).
2. Estrutura em `index.html`, `style.css` e `script.js`.
3. Lógica: pontuação, verificação de respostas, 50:50, parar e fim de jogo.
4. Integração com a API Open Trivia DB.
5. Testes locais e no endereço publicado.
6. Publicação no GitHub Pages.

## Uso de Inteligência Artificial

- **Ferramenta:** Claude (Anthropic).
- **Principais prompts:** *(substitua pelos seus, com suas palavras)*
  - "Desenvolva um jogo inspirado no Show do Milhão com HTML, CSS e JavaScript em arquivos separados, consumindo a API opentdb.com com fetch, async e await."
  - "Explique linha por linha a função buscarPerguntas."
  - "Como faço para o jogo mostrar uma mensagem quando a API falhar?"
- **Contribuição da IA:** gerou a estrutura inicial, ajudou a organizar a lógica de pontuação e a tratar erros da API, e explicou o código. Eu testei, li e adaptei o que foi gerado.

## Como executar

**Localmente:** baixe a pasta, abra o `index.html` no navegador (é preciso internet para a API e as fontes). Se o navegador bloquear, use a extensão Live Server do VS Code.

**Publicar no GitHub Pages:** envie os 4 arquivos para um repositório público, vá em *Settings > Pages*, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`, e salve. Em 1 a 2 minutos o link aparece na mesma página. Cole-o acima e teste o jogo por ele.
