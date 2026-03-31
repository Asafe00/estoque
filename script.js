import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import { 
  getDatabase, 
  ref, 
  push, 
  get, 
  remove, 
  update
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSt1sx09eqlcOpvjw8JpmzDaDvN5JBqTQ",
  authDomain: "estoque-empresa-20acc.firebaseapp.com",
  databaseURL: "https://estoque-empresa-20acc-default-rtdb.firebaseio.com",
  projectId: "estoque-empresa-20acc",
  storageBucket: "estoque-empresa-20acc.firebasestorage.app",
  messagingSenderId: "333468546043",
  appId: "1:333468546043:web:1b70d85efbfa431627915e"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log("Projeto Firebase:", firebaseConfig.projectId);
console.log("Database URL:", firebaseConfig.databaseURL);


const formRegistro = document.getElementById("formRegistro");

if (formRegistro){
  formRegistro.addEventListener("submit", async function(event){
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const senha = document.getElementById("senha").value;

    // 🔹 BUSCAR USUÁRIOS NO FIREBASE
    const snapshot = await get(ref(database, "usuarios"));

    let usuarioExiste = false;

    if (snapshot.exists()) {
      const usuarios = snapshot.val();

      for (let id in usuarios) {
        if (usuarios[id].nome === nome) {
          usuarioExiste = true;
          break;
        }
      }
    }

    if (usuarioExiste){
      alert("Esse nome já está cadastrado!");
      return;
    }

    // 🔹 SALVAR NO FIREBASE
    await push(ref(database, "usuarios"), {
      nome: nome,
      senha: senha
    });

    alert("Usuário registrado!");
  });
}

const formLogin = document.getElementById("formLogin");

if(formLogin){

  formLogin.addEventListener("submit", async function(event){
    event.preventDefault();

    const nomeDigitado = document.getElementById("loginNome").value;
    const senhaDigitada = document.getElementById("loginSenha").value;

    // 🔹 BUSCAR USUÁRIOS NO FIREBASE
    const snapshot = await get(ref(database, "usuarios"));

    let usuarioEncontrado = false;

    if (snapshot.exists()) {
      const usuarios = snapshot.val();

      for (let id in usuarios) {
        if (
          usuarios[id].nome === nomeDigitado &&
          usuarios[id].senha === senhaDigitada
        ){
          usuarioEncontrado = true;
          break;
        }
      }
    }

    if(usuarioEncontrado){
      alert("Login realizado com sucesso!");
      window.location.href = "/index.html";
    } else {
      alert("Usuário não encontrado!");
    }

  });
}


const formProduto = document.getElementById("formProduto");
document.addEventListener("DOMContentLoaded", function(){
  carregarProdutos();
  mostrarProdutos();
});
if(formProduto){
  formProduto.addEventListener("submit", async function(event){
    event.preventDefault();

    const nomeProduto = document.getElementById("produto").value;
    const quantidade = document.getElementById("quantidade").value;

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
      quantidade: Number(quantidade)
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
      carregarProdutos(); // ✅ aqui sim faz sentido
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

    const botaoAdd = document.createElement("button");
    botaoAdd.textContent = "+";
    botaoAdd.classList.add("btn-add");

    const botaoRem = document.createElement("button");
    botaoRem.textContent = "-";
    botaoRem.classList.add("btn-rem");

    const inputConta = document.createElement("input");
    inputConta.type = "text";
    inputConta.placeholder = "Conta financeira";
    inputConta.classList.add("input-conta");

    const inputCentro = document.createElement("input");
    inputCentro.type = "text";
    inputCentro.placeholder = "Centro de custo";
    inputCentro.classList.add("input-centro");

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

      mostrarProdutos();
      carregarHistorico();
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

      mostrarProdutos();
      carregarHistorico();
    });

    tdMov.appendChild(inputPessoa);
    tdMov.appendChild(inputNumero);
    tdMov.appendChild(botaoAdd);
    tdMov.appendChild(botaoRem);
    tdMov.appendChild(inputConta);
    tdMov.appendChild(inputCentro);

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

  carregarHistorico();
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