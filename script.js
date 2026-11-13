/* ============================================================
   MILHÃO ESTELAR - lógica do jogo
   ============================================================ */

// Prêmios de cada pergunta (15 níveis, como no Show do Milhão)
const PREMIOS = [1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000,
                 40000, 50000, 100000, 200000, 300000, 500000, 1000000];
const MARCOS = [4, 9]; // índices das perguntas 5 e 10 (marcos de destaque)
const ORDEM_DIF = { easy: 0, medium: 1, hard: 2 };
const NOME_DIF = { easy: "fácil", medium: "média", hard: "difícil" };

// Estado do jogo
let perguntas = [];
let indice = 0;
let respondeu = false;
let usou5050 = false;

// Atalho para pegar elementos da página
const $ = (id) => document.getElementById(id);

// Controla a cena 3D (cena3d.js). Se o 3D não carregar, o jogo segue normalmente.
function cena(metodo, ...args) {
  if (window.Cena3D) window.Cena3D[metodo](...args);
}

const formatar = (v) => "R$ " + v.toLocaleString("pt-BR");

/* ------------------------------------------------------------
   CONSUMO DA API (Open Trivia DB)
   Esta função faz a requisição com fetch() + async/await,
   decodifica o JSON recebido e o transforma em objetos que o
   jogo usa (pergunta, alternativas embaralhadas e resposta certa).
   ------------------------------------------------------------ */
async function buscarPerguntas() {
  // category=17 -> Ciência e Natureza | type=multiple -> 4 alternativas
  // encode=url3986 -> evita erros com caracteres especiais (&quot; etc.)
  const url = "https://opentdb.com/api.php?amount=15&category=17&type=multiple&encode=url3986";

  // [API] fetch envia a requisição e await espera a resposta chegar
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("Falha na conexão (código " + resposta.status + ")");

  // [API] converte a resposta em objeto JavaScript
  const dados = await resposta.json();
  if (dados.response_code !== 0 || dados.results.length < 15) {
    throw new Error("A API não retornou perguntas suficientes.");
  }

  // [API] usa os dados recebidos: decodifica os textos e guarda pergunta, resposta certa e erradas
  const lista = dados.results.map((item) => {
    const certa = decodeURIComponent(item.correct_answer);
    const erradas = item.incorrect_answers.map(decodeURIComponent);
    return {
      texto: decodeURIComponent(item.question),
      dificuldade: item.difficulty,
      certa: certa,
      incorretas: erradas,
      alternativas: null, // montadas (e embaralhadas) depois da tradução
    };
  });

  // Ordena da mais fácil para a mais difícil (dados da API: campo "difficulty")
  lista.sort((a, b) => ORDEM_DIF[a.dificuldade] - ORDEM_DIF[b.dificuldade]);
  return lista;
}

/* ------------------------------------------------------------
   SEGUNDA API: tradução para português (MyMemory)
   A Open Trivia DB só tem perguntas em inglês. Cada pergunta é
   traduzida com fetch() quando vai aparecer na tela. Se a
   tradução falhar, o jogo continua com o texto em inglês.
   ------------------------------------------------------------ */
async function traduzirTexto(texto) {
  // [API] consulta a MyMemory: en -> pt-BR
  const url = "https://api.mymemory.translated.net/get?langpair=" +
              encodeURIComponent("en|pt-BR") + "&q=" + encodeURIComponent(texto);
  const resposta = await fetch(url);
  const dados = await resposta.json();
  if (Number(dados.responseStatus) !== 200) throw new Error("Tradução indisponível");
  return decodificarHtml(dados.responseData.translatedText);
}

// A tradução pode devolver símbolos como &#39; -> converte para texto normal
function decodificarHtml(texto) {
  const area = document.createElement("textarea");
  area.innerHTML = texto;
  return area.value;
}

async function traduzir(p) {
  if (p.alternativas) return; // já foi traduzida
  const original = [p.texto, p.certa, ...p.incorretas];
  let t = original;
  try {
    // Tenta traduzir tudo em uma requisição só (uma linha para cada texto)
    const junto = original.join("\n");
    if (junto.length <= 450) {
      const linhas = (await traduzirTexto(junto)).split("\n").map((l) => l.trim()).filter(Boolean);
      if (linhas.length === original.length) t = linhas;
    }
    // Se não deu certo, traduz cada texto separadamente
    if (t === original) t = await Promise.all(original.map(traduzirTexto));
  } catch (erro) {
    console.warn("Sem tradução, usando inglês:", erro.message);
    t = original;
  }
  p.texto = t[0];
  p.certa = t[1];
  p.alternativas = embaralhar(t.slice(1));
}

// Algoritmo de Fisher-Yates para embaralhar uma lista
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/* ------------------------------------------------------------
   TELAS
   ------------------------------------------------------------ */
function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.remove("ativa"));
  $(id).classList.add("ativa");
}

async function iniciarJogo() {
  $("msg-erro").textContent = "";
  $("btn-iniciar").disabled = true;
  $("btn-iniciar").textContent = "Carregando...";
  try {
    perguntas = await buscarPerguntas(); // chama a API
    indice = 0;
    usou5050 = false;
    cena("reiniciar");
    $("btn-5050").disabled = false;
    montarEscada();
    mostrarTela("tela-jogo");
    mostrarPergunta();
  } catch (erro) {
    // A API gratuita limita 1 requisição a cada 5 segundos
    $("msg-erro").textContent = "Não foi possível carregar as perguntas. Aguarde 5 segundos e tente de novo. (" + erro.message + ")";
  }
  $("btn-iniciar").disabled = false;
  $("btn-iniciar").textContent = "Decolar";
}

function montarEscada() {
  const ol = $("escada");
  ol.innerHTML = "";
  PREMIOS.forEach((valor, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${i + 1}</span><span>${formatar(valor)}</span>`;
    if (MARCOS.includes(i) || i === 14) li.classList.add("marco");
    ol.appendChild(li);
  });
}

function atualizarEscada() {
  [...$("escada").children].forEach((li, i) => {
    li.classList.toggle("feita", i < indice);
    li.classList.toggle("atual", i === indice);
  });
}

// Prêmio que o jogador já garantiu (acertos até agora)
const premioGarantido = () => (indice === 0 ? 0 : PREMIOS[indice - 1]);

async function mostrarPergunta() {
  const p = perguntas[indice];
  respondeu = true; // bloqueia cliques enquanto traduz
  $("num-pergunta").textContent = `${indice + 1} de 15`;
  $("dificuldade").textContent = NOME_DIF[p.dificuldade];
  $("premio-atual").textContent = formatar(premioGarantido());
  $("pergunta").textContent = "Traduzindo a pergunta...";
  $("alternativas").innerHTML = "";
  $("feedback").textContent = "";
  $("btn-proxima").hidden = true;
  $("btn-parar").disabled = true;
  $("btn-5050").disabled = true;
  atualizarEscada();

  await traduzir(p); // [API] traduz a pergunta e as alternativas

  // reinicia a animação de entrada do painel
  const painel = document.querySelector(".painel");
  painel.classList.remove("entra");
  void painel.offsetWidth;
  painel.classList.add("entra");

  respondeu = false;
  $("pergunta").textContent = p.texto;
  $("btn-parar").disabled = false;
  $("btn-5050").disabled = usou5050;

  // Cria um botão para cada alternativa vinda da API
  const caixa = $("alternativas");
  caixa.innerHTML = "";
  p.alternativas.forEach((alt) => {
    const b = document.createElement("button");
    b.className = "alt";
    b.textContent = alt;
    b.addEventListener("click", () => responder(b, alt));
    caixa.appendChild(b);
  });
}

/* ------------------------------------------------------------
   VERIFICAÇÃO DAS RESPOSTAS E PONTUAÇÃO
   ------------------------------------------------------------ */
function responder(botao, escolhida) {
  if (respondeu) return;
  respondeu = true;
  const p = perguntas[indice];
  const botoes = [...document.querySelectorAll(".alt")];
  botoes.forEach((b) => (b.disabled = true));
  $("btn-parar").disabled = true;
  $("btn-5050").disabled = true;

  // Compara a escolha com a resposta certa recebida da API
  if (escolhida === p.certa) {
    botao.classList.add("certa");
    indice++;
    cena("acertou", indice); // nave avança no 3D
    if (indice === PREMIOS.length) {
      cena("vitoria");
      return fimDeJogo("Você é um milionário estelar!", PREMIOS[14], "Respondeu as 15 perguntas sem errar. Missão cumprida!");
    }
    $("feedback").textContent = "Resposta certa! Você garantiu " + formatar(premioGarantido()) + ".";
    $("premio-atual").textContent = formatar(premioGarantido());
    $("btn-proxima").hidden = false;
  } else {
    botao.classList.add("errada");
    cena("errou"); // nave gira no 3D
    botoes.find((b) => b.textContent === p.certa).classList.add("certa");
    // Errou: leva metade do que já tinha garantido
    const premio = Math.floor(premioGarantido() / 2);
    $("feedback").textContent = "Resposta errada. A certa era: " + p.certa;
    setTimeout(() => fimDeJogo("A nave perdeu o rumo", premio,
      "Quem erra leva metade do prêmio acumulado."), 2200);
  }
}

function proxima() {
  mostrarPergunta();
}

// Ajuda 50:50 - esconde duas alternativas erradas (uso único)
function usar5050() {
  if (usou5050 || respondeu) return;
  usou5050 = true;
  $("btn-5050").disabled = true;
  const certa = perguntas[indice].certa;
  const erradas = [...document.querySelectorAll(".alt")].filter((b) => b.textContent !== certa);
  embaralhar(erradas).slice(0, 2).forEach((b) => {
    b.classList.add("oculta");
    b.disabled = true;
  });
}

function parar() {
  if (respondeu) return;
  fimDeJogo("Você pousou com segurança", premioGarantido(),
    indice === 0 ? "Parou antes de começar. A próxima viagem pode ser maior!" : "Você parou depois de " + indice + " acerto(s) e levou o prêmio acumulado.");
}

function fimDeJogo(titulo, premio, texto) {
  $("fim-titulo").textContent = titulo;
  $("fim-premio").textContent = formatar(premio);
  $("fim-texto").textContent = texto;
  mostrarTela("tela-fim");
}

/* ------------------------------------------------------------
   EVENTOS
   ------------------------------------------------------------ */
$("btn-iniciar").addEventListener("click", iniciarJogo);
$("btn-proxima").addEventListener("click", proxima);
$("btn-5050").addEventListener("click", usar5050);
$("btn-parar").addEventListener("click", parar);
$("btn-reiniciar").addEventListener("click", () => {
  cena("reiniciar");
  mostrarTela("tela-inicio");
});
