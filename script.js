import { database } from "./firebase.js";
import { ref, push, get, remove, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";


const formProduto = document.getElementById("formProduto");
document.addEventListener("DOMContentLoaded", function(){
  carregarProdutos();
  mostrarProdutos();
  carregarHistorico();
  carregarMinimos();
});
if(formProduto){
  formProduto.addEventListener("submit", async function(event){
    event.preventDefault();

    const nomeProduto = document.getElementById("produto").value;
    const quantidade = document.getElementById("quantidade").value;
    const quantidadeMin = document.getElementById("quantidademin").value;

    const snapshot = await get(ref(database, "produtos"));

let existe = false;

if(snapshot.exists()){
  const produtos = snapshot.val();

  for(let id in produtos){
    if(produtos[id].nome === nomeProduto){
      existe = true;
      break;
    }
  }
}

if(existe){
  alert("Produto já existe!");
  return;
}

    // 🔹 SALVAR DIRETO NO FIREBASE
    await push(ref(database, "produtos"), {
      nome: nomeProduto,
      quantidade: Number(quantidade),
      quantidadeMinima: Number(quantidadeMin)
    });

    // 🔹 RECARREGAR
    formProduto.reset();
    carregarProdutos();
  });
}
async function carregarProdutos(){
  const listaProdutos = document.getElementById("listaProdutos");
  if(!listaProdutos) return;

  listaProdutos.innerHTML = "";

  const snapshot = await get(ref(database, "produtos"));

  if(!snapshot.exists()) return;

  const produtos = snapshot.val();

  for(let id in produtos){

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = produtos[id].nome;

    const tdQtd = document.createElement("td");
    tdQtd.textContent = produtos[id].quantidade;

    const tdAcao = document.createElement("td");

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.classList.add("botaoexcluir");

    botaoExcluir.addEventListener("click", async function(){
      await remove(ref(database, "produtos/" + id));
      carregarProdutos();
    });

    tdAcao.appendChild(botaoExcluir);

    tr.appendChild(tdNome);
    tr.appendChild(tdQtd);
    tr.appendChild(tdAcao);

    listaProdutos.appendChild(tr);
  }
}

async function mostrarProdutos(){
  const listaMovimentacao = document.getElementById("listaMovimentacao");
  if(!listaMovimentacao) return;

  listaMovimentacao.innerHTML = "";

  const snapshot = await get(ref(database, "produtos"));

  if(!snapshot.exists()) return;

  const produtos = snapshot.val();

  for(let id in produtos){

    const produto = produtos[id];

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = produto.nome;

    const tdQtd = document.createElement("td");
    tdQtd.textContent = produto.quantidade;

    const tdMov = document.createElement("td");

    const inputPessoa = document.createElement("input");
    inputPessoa.type = "text";
    inputPessoa.placeholder = "Responsável";
    inputPessoa.classList.add("input-pessoa");

    const inputNumero = document.createElement("input");
    inputNumero.type = "number";
    inputNumero.classList.add("input-numero");

    const inputConta = document.createElement("input");
    inputConta.type = "text";
    inputConta.placeholder = "Conta financeira";
    inputConta.classList.add("input-conta");

    const inputCentro = document.createElement("input");
    inputCentro.type = "text";
    inputCentro.placeholder = "Centro de custo";
    inputCentro.classList.add("input-centro");

    const botaoAdd = document.createElement("button");
    botaoAdd.textContent = "+";
    botaoAdd.classList.add("btn-add");

    const botaoRem = document.createElement("button");
    botaoRem.textContent = "-";
    botaoRem.classList.add("btn-rem");    


    // 🔹 ENTRADA
    botaoAdd.addEventListener("click", async function(){

      const valor = Number(inputNumero.value);
      const pessoa = inputPessoa.value;
      const conta = inputConta.value;
      const centro = inputCentro.value;

      if(!valor) return;

      const novaQuantidade = Number(produto.quantidade) + valor;

      // 🔹 ATUALIZA PRODUTO
      await update(ref(database, "produtos/" + id), {
        quantidade: novaQuantidade
      });

      // 🔹 SALVA HISTÓRICO
      await push(ref(database, "historico"), {
        produto: produto.nome,
        tipo: "Entrada",
        responsavel: pessoa || "Não Informado",
        quantidade: valor,
        estoqueFinal: novaQuantidade,
	contaFinanceira: conta || "Não informado",
	centroCusto: centro || "Não informado",
        data: new Date().toLocaleString()
      });
await carregarProdutos();
await mostrarProdutos();
await carregarHistorico();
await carregarMinimos();
    });

    // 🔹 SAÍDA
    botaoRem.addEventListener("click", async function(){

      const valor = Number(inputNumero.value);
      const pessoa = inputPessoa.value;
      const conta = inputConta.value;
      const centro = inputCentro.value;

      if(!valor) return;

      let novaQuantidade = Number(produto.quantidade) - valor;

      if(novaQuantidade < 0){
        novaQuantidade = 0;
      }

      // 🔹 ATUALIZA PRODUTO
      await update(ref(database, "produtos/" + id), {
        quantidade: novaQuantidade
      });

      // 🔹 SALVA HISTÓRICO
      await push(ref(database, "historico"), {
        produto: produto.nome,
        tipo: "Saída",
        responsavel: pessoa || "Não informado",
        quantidade: valor,
        estoqueFinal: novaQuantidade,
	contaFinanceira: conta || "Não informado",
	centroCusto: centro || "Não informado",
        data: new Date().toLocaleString()
      });
await carregarProdutos();
await mostrarProdutos();
await carregarHistorico();
await carregarMinimos();
    });

    tdMov.appendChild(inputPessoa);
    tdMov.appendChild(inputNumero);
    tdMov.appendChild(inputConta);
    tdMov.appendChild(inputCentro);
    tdMov.appendChild(botaoAdd);
    tdMov.appendChild(botaoRem);

    tr.appendChild(tdNome);
    tr.appendChild(tdQtd);
    tr.appendChild(tdMov);

    listaMovimentacao.appendChild(tr);
  }
}

async function carregarHistorico(){
  const listaHistorico = document.getElementById("listaHistorico");
  if(listaHistorico){

    listaHistorico.innerHTML = "";

    const snapshot = await get(ref(database, "historico"));

    if(!snapshot.exists()) return;

    const historico = snapshot.val();

    for(let id in historico){

      const item = historico[id];

      const tr = document.createElement("tr");

      const tdProduto = document.createElement("td");
      tdProduto.textContent = item.produto;

      const tdTipo = document.createElement("td");
      tdTipo.textContent = item.tipo;

      if(item.tipo === "Entrada"){
        tdTipo.classList.add("entrada");
      }
      if(item.tipo === "Saída"){
        tdTipo.classList.add("saida");
      }

      const tdResponsavel = document.createElement("td");
      tdResponsavel.textContent = item.responsavel;
   
      const tdConta = document.createElement("td");
      tdConta.textContent = item.contaFinanceira || "—";

      const tdCentro = document.createElement("td");
      tdCentro.textContent = item.centroCusto || "—";

      const tdQtd = document.createElement("td");
      tdQtd.textContent = item.quantidade;

      const tdEstoque = document.createElement("td");
      tdEstoque.textContent = item.estoqueFinal;

      const tdData = document.createElement("td");
      tdData.textContent = item.data;

      tr.appendChild(tdProduto);
      tr.appendChild(tdTipo);
      tr.appendChild(tdResponsavel);
      tr.appendChild(tdConta);    
      tr.appendChild(tdCentro);   
      tr.appendChild(tdQtd);
      tr.appendChild(tdEstoque);
      tr.appendChild(tdData);
      
      listaHistorico.appendChild(tr);
    }
  }

}

const botaoLimpar = document.getElementById("limparHistorico");

if(botaoLimpar){

  botaoLimpar.addEventListener("click", async function(){

    const confirmar = confirm("Deseja apagar todo o histórico?");

    if(confirmar){

      // 🔹 REMOVE TODA A PASTA "historico" DO FIREBASE
      await remove(ref(database, "historico"));

      carregarHistorico();
    }

  });

}


//Filtrar produtos na movimentação
const inputPesquisa = document.getElementById("pesquisaProduto");

if (inputPesquisa) {
  inputPesquisa.addEventListener("input", filtrarProdutos);
}

function filtrarProdutos() {
  const input = document.getElementById("pesquisaProduto");
  const filtro = input.value.toLowerCase();

  const linhas = document.querySelectorAll("#listaMovimentacao tr");

  linhas.forEach(linha => {
    const nomeProduto = linha.children[0].textContent.toLowerCase();

    if (nomeProduto.includes(filtro)) {
      linha.style.display = "";
    } else {
      linha.style.display = "none";
    }
  });
}


//Filtrar produtos no estoque

const inputEstoque = document.getElementById("pesquisaEstoque");

if (inputEstoque) {
  inputEstoque.addEventListener("input", filtrarEstoque);
}

function filtrarEstoque() {
  const input = document.getElementById("pesquisaEstoque");
  const filtro = input.value.toLowerCase();

  const linhas = document.querySelectorAll("#listaProdutos tr");

  linhas.forEach(linha => {
    const nomeProduto = linha.children[0].textContent.toLowerCase();

    if (nomeProduto.includes(filtro)) {
      linha.style.display = "";
    } else {
      linha.style.display = "none";
    }
  });
}

async function carregarMinimos(){
  const lista = document.getElementById("listaMinimos");
  if(!lista) return;

  lista.innerHTML = "";

  const snapshot = await get(ref(database, "produtos"));

  if(!snapshot.exists()) return;

  const produtos = snapshot.val();

  for(let id in produtos){

    const produto = produtos[id];

    const qtd = Number(produto.quantidade);
    const min = Number(produto.quantidadeMinima);

    if(qtd <= min){

      const tr = document.createElement("tr");
      tr.classList.add("linha-baixa");

      const tdNome = document.createElement("td");
      tdNome.textContent = produto.nome;

      const tdQtd = document.createElement("td");
      tdQtd.textContent = qtd;

      const tdMin = document.createElement("td");
      tdMin.textContent = min;

      const tdStatus = document.createElement("td");
      tdStatus.textContent = "REPOR";
      tdStatus.classList.add("status-baixo");

      const tdExpandir = document.createElement("td");
      const botaoExpandir = document.createElement("button");
      botaoExpandir.textContent = "▼";
      botaoExpandir.classList.add("btn-expandir");
      botaoExpandir.classList.toggle("aberto");

      tdExpandir.appendChild(botaoExpandir);

botaoExpandir.addEventListener("click", async function(){

  const proximaLinha = tr.nextSibling;

  // 🔹 SE JÁ ESTIVER ABERTO → FECHA
  if(proximaLinha && proximaLinha.classList?.contains("linha-historico")){
    proximaLinha.remove();
    botaoExpandir.textContent = "▼"; // 👈 volta pra baixo
    return;
  }

  // 🔹 MUDA A SETA PRA CIMA
  botaoExpandir.textContent = "▲";

  // 🔹 busca histórico
  const snapshotHist = await get(ref(database, "historico"));
  if(!snapshotHist.exists()) return;

  const historico = snapshotHist.val();

  // 🔹 cria linha expandida
  const trHist = document.createElement("tr");
  trHist.classList.add("linha-historico");

  const tdHist = document.createElement("td");
  tdHist.colSpan = 5; // ajusta conforme número de colunas

  let html = "<div class='box-historico'>";

  for(let h in historico){
    const item = historico[h];

    if(item.produto === produto.nome){
html += `
  <div class="item-historico">
    <b>${item.tipo}</b> | 
    Qtd: ${item.quantidade} | 
    Estoque: ${item.estoqueFinal} | 
    ${item.responsavel} | 
    ${item.contaFinanceira || "—"} | 
    ${item.centroCusto || "—"} | 
    ${item.data}
  </div>
`;
    }
  }

  html += "</div>";

  tdHist.innerHTML = html;
  trHist.appendChild(tdHist);

  // 🔹 insere logo abaixo da linha clicada
  tr.parentNode.insertBefore(trHist, tr.nextSibling);
});



      tr.appendChild(tdNome);
      tr.appendChild(tdQtd);
      tr.appendChild(tdMin);
      tr.appendChild(tdStatus);
      tr.appendChild(tdExpandir);

      lista.appendChild(tr);
    }
  }
}

