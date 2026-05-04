import { database } from "./firebase.js";
import { ref, push, onValue, get, remove, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { getAuth, signOut } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const auth = getAuth();

window.logout = function(){
  signOut(auth);
};

const formProduto = document.getElementById("formProduto");
document.addEventListener("DOMContentLoaded", function(){
  carregarProdutos();
  mostrarProdutos();
  carregarHistorico();
  carregarMinimos();
  atualizarDashboard();
  iniciarConfig();
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


async function carregarProdutos() {
  const listaProdutos = document.getElementById("listaProdutos");
  const listaCadastro = document.getElementById("listaProdutosCadastro");

  if (listaProdutos) listaProdutos.innerHTML = "";
  if (listaCadastro) listaCadastro.innerHTML = "";

  const snapshot = await get(ref(database, "produtos"));
  if (!snapshot.exists()) return;

  const produtos = snapshot.val();

  // KPIs
  let totalProdutos = 0, totalUnidades = 0, totalAlertas = 0;

  for (let id in produtos) {
    const p = produtos[id];
    const qtd = Number(p.quantidade);
    const min = Number(p.quantidadeMinima);
    totalProdutos++;
    totalUnidades += qtd;
    if (qtd <= min) totalAlertas++;

    // ── TABELA ESTOQUE ──
    if (listaProdutos) {
      const tr = document.createElement("tr");

      const tdNome = document.createElement("td");
      tdNome.textContent = p.nome;

      const tdQtd = document.createElement("td");
      tdQtd.textContent = qtd;

      const tdMin = document.createElement("td");
      tdMin.textContent = min;

      const tdStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.textContent = qtd <= min ? "Baixo" : "OK";
      badge.className = qtd <= min ? "status-baixo" : "status-ok";
      tdStatus.appendChild(badge);

      const tdAcao = document.createElement("td");
      const botaoExcluir = document.createElement("button");
      botaoExcluir.textContent = "Excluir";
      botaoExcluir.classList.add("btn-excluir");
      botaoExcluir.addEventListener("click", async function () {
        await remove(ref(database, "produtos/" + id));
        carregarProdutos();
        mostrarProdutos();
        carregarMinimos();
      });
      tdAcao.appendChild(botaoExcluir);

      tr.append(tdNome, tdQtd, tdMin, tdStatus, tdAcao);
      listaProdutos.appendChild(tr);
    }

    // ── TABELA CADASTRO ──
    if (listaCadastro) {
      const tr = document.createElement("tr");
      const tdNome = document.createElement("td");
      tdNome.textContent = p.nome;
      const tdQtd = document.createElement("td");
      tdQtd.textContent = qtd;
      const tdAcao = document.createElement("td");
      const botaoExcluir = document.createElement("button");
      botaoExcluir.textContent = "Excluir";
      botaoExcluir.classList.add("btn-excluir");
      botaoExcluir.addEventListener("click", async function () {
        await remove(ref(database, "produtos/" + id));
        carregarProdutos();
        mostrarProdutos();
        carregarMinimos();
      });
      tdAcao.appendChild(botaoExcluir);
      tr.append(tdNome, tdQtd, tdAcao);
      listaCadastro.appendChild(tr);
    }
  }

  // Atualiza KPIs
  const el = (id) => document.getElementById(id);
  if (el("kpiTotal")) el("kpiTotal").textContent = totalProdutos;
  if (el("kpiUnidades")) el("kpiUnidades").textContent = totalUnidades;
  if (el("kpiAlertas")) el("kpiAlertas").textContent = totalAlertas;

  const badge = document.getElementById("badgeAlertas");
  if (badge) {
    badge.textContent = totalAlertas;
    badge.setAttribute("data-count", totalAlertas);
  }
}


async function mostrarProdutos() {
  const listaMovimentacao = document.getElementById("listaMovimentacao");
  if (!listaMovimentacao) return;

  listaMovimentacao.innerHTML = "";

  const snapshot = await get(ref(database, "produtos"));
  if (!snapshot.exists()) return;

  const produtos = snapshot.val();

  for (let id in produtos) {
    const produto = produtos[id];
    const tr = document.createElement("tr");

    // Produto
    const tdNome = document.createElement("td");
    tdNome.textContent = produto.nome;

    // Estoque
    const tdQtd = document.createElement("td");
    tdQtd.textContent = produto.quantidade;

    // Responsável
    const tdResp = document.createElement("td");
    const inputPessoa = document.createElement("input");
    inputPessoa.type = "text";
    inputPessoa.placeholder = "Responsável";
    inputPessoa.classList.add("mov-input");
    tdResp.appendChild(inputPessoa);

    // Quantidade
    const tdNum = document.createElement("td");
    const inputNumero = document.createElement("input");
    inputNumero.type = "number";
    inputNumero.min = "1";
    inputNumero.placeholder = "0";
    inputNumero.classList.add("mov-input");
    tdNum.appendChild(inputNumero);

   // Conta Financeira — SUBSTITUIR o bloco de inputConta
	const tdConta = document.createElement("td");
	const inputConta = document.createElement("select");
	inputConta.classList.add("mov-input");

	const optContaDefault = document.createElement("option");
	optContaDefault.value = "";
	optContaDefault.textContent = "Conta financeira";
	optContaDefault.disabled = true;
	optContaDefault.selected = true;
	inputConta.appendChild(optContaDefault);

	const snapContas = await get(ref(database, "contasFinanceiras"));
	if (snapContas.exists()) {
  	Object.values(snapContas.val()).forEach(c => {
    	const opt = document.createElement("option");
    	opt.value = c.nome;
    	opt.textContent = c.nome;
    	inputConta.appendChild(opt);
  	});
	}
	tdConta.appendChild(inputConta);

// Centro de Custo — SUBSTITUIR o bloco de inputCentro
const tdCentro = document.createElement("td");
const inputCentro = document.createElement("select");
inputCentro.classList.add("mov-input");

const optCentroDefault = document.createElement("option");
optCentroDefault.value = "";
optCentroDefault.textContent = "Centro de custo";
optCentroDefault.disabled = true;
optCentroDefault.selected = true;
inputCentro.appendChild(optCentroDefault);

const snapCentros = await get(ref(database, "centrosDeCusto"));
if (snapCentros.exists()) {
  Object.values(snapCentros.val()).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.nome;
    opt.textContent = c.nome;
    inputCentro.appendChild(opt);
  });
}
tdCentro.appendChild(inputCentro);

    // Ações
    const tdAcoes = document.createElement("td");
    const botaoAdd = document.createElement("button");
    botaoAdd.textContent = "+";
    botaoAdd.classList.add("btn-add");
    const botaoRem = document.createElement("button");
    botaoRem.textContent = "−";
    botaoRem.classList.add("btn-rem");

    const wrapAcoes = document.createElement("div");
    wrapAcoes.classList.add("mov-actions");
    wrapAcoes.append(botaoAdd, botaoRem);
    tdAcoes.appendChild(wrapAcoes);

    // Entrada
    botaoAdd.addEventListener("click", async function () {
      const valor = Number(inputNumero.value);
      if (!valor || valor <= 0) return;
      const estoqueAnterior = produto.quantidade;
      const novaQuantidade = Number(produto.quantidade) + valor;
      await update(ref(database, "produtos/" + id), { quantidade: novaQuantidade });
      await push(ref(database, "historico"), {
        produto: produto.nome, tipo: "Entrada",
        responsavel: inputPessoa.value || "Não informado",
        quantidade: valor, estoqueAnterior, estoqueFinal: novaQuantidade,
        contaFinanceira: inputConta.value || "Não informado",
        centroCusto: inputCentro.value || "Não informado",
        data: new Date().toLocaleString("pt-BR")
      });
      await Promise.all([carregarProdutos(), mostrarProdutos(), carregarHistorico(), carregarMinimos(), atualizarDashboard()]);
    });

    // Saída
    botaoRem.addEventListener("click", async function () {
      const valor = Number(inputNumero.value);
      if (!valor || valor <= 0) return;
      const estoqueAnterior = produto.quantidade;
      let novaQuantidade = Math.max(0, Number(produto.quantidade) - valor);
      await update(ref(database, "produtos/" + id), { quantidade: novaQuantidade });
      await push(ref(database, "historico"), {
        produto: produto.nome, tipo: "Saída",
        responsavel: inputPessoa.value || "Não informado",
        quantidade: valor, estoqueAnterior, estoqueFinal: novaQuantidade,
        contaFinanceira: inputConta.value || "Não informado",
        centroCusto: inputCentro.value || "Não informado",
        data: new Date().toLocaleString("pt-BR")
      });
      await Promise.all([carregarProdutos(), mostrarProdutos(), carregarHistorico(), carregarMinimos(), atualizarDashboard()]);
    });

    tr.append(tdNome, tdQtd, tdResp, tdNum, tdConta, tdCentro, tdAcoes);
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
    botaoExpandir.textContent = "▼"; // volta pra baixo
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

let html = `
  <table class="tabela-historico">
    <thead>
      <tr>
        <th>Operação</th>
	<th>Responsável</th>
	<th>Conta Financeira</th>
	<th>Centro de Custo</th>
	<th>Quantidade</th>
	<th>Estoque após</th>
	<th>Data</th>
      </tr>
    </thead>
    <tbody>
`;

const listaFiltrada = [];

// 🔹 filtra só o produto atual
for(let h in historico){
  const item = historico[h];

  if(item.produto === produto.nome){
    listaFiltrada.push(item);
  }
}

// 🔹 ordena (se tiver timestamp usa ele, senão tenta pela data)
listaFiltrada.sort((a, b) => {
  if(a.timestamp && b.timestamp){
    return b.timestamp - a.timestamp;
  }
  return new Date(b.data) - new Date(a.data);
});

// 🔹 pega só os 5 últimos
const ultimos = listaFiltrada.slice(0, 5);

for(let item of ultimos){
  html += `
    <tr>
      <td class="${item.tipo === 'Entrada' ? 'entrada' : 'saida'}">
  	${item.tipo}
      </td>
      <td>${item.responsavel}</td>
      <td>${item.contaFinanceira || "—"}</td>
      <td>${item.centroCusto || "—"}</td>
      <td>${item.quantidade}</td>
      <td>${item.estoqueFinal}</td>
      <td>${item.data}</td>
    </tr>
  `;
}

  html += `
    </tbody>
  </table>
`;

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

async function atualizarDashboard() {
  // Últimas movimentações
  const dashHist = document.getElementById("dashHistorico");
  if (dashHist) {
    const snap = await get(ref(database, "historico"));
    dashHist.innerHTML = "";
    if (snap.exists()) {
      const items = Object.values(snap.val()).reverse().slice(0, 5);
      items.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.produto}</td>
          <td><span class="tipo-${item.tipo === 'Entrada' ? 'entrada' : 'saida'}">${item.tipo}</span></td>
          <td>${item.quantidade}</td>
          <td>${item.data}</td>`;
        dashHist.appendChild(tr);
      });
    }
  }

  // Alertas no dashboard
  const dashAlertas = document.getElementById("dashAlertas");
  if (dashAlertas) {
    const snap = await get(ref(database, "produtos"));
    dashAlertas.innerHTML = "";
    if (snap.exists()) {
      const produtos = snap.val();
      let count = 0;
      for (let id in produtos) {
        const p = produtos[id];
        if (Number(p.quantidade) <= Number(p.quantidadeMinima)) {
          count++;
          dashAlertas.innerHTML += `
            <div class="alert-item">
              <div>
                <div class="alert-item-name">${p.nome}</div>
                <div class="alert-item-qty">Qtd: ${p.quantidade} / Mín: ${p.quantidadeMinima}</div>
              </div>
              <span class="alert-tag">Repor</span>
            </div>`;
        }
      }
      if (count === 0) dashAlertas.innerHTML = `<div class="empty-state">Nenhum alerta no momento ✓</div>`;
    }
  }

  // KPI movimentações
  const snap = await get(ref(database, "historico"));
  const kpiMov = document.getElementById("kpiMovimentacoes");
  if (kpiMov) kpiMov.textContent = snap.exists() ? Object.keys(snap.val()).length : 0;
}


function iniciarConfig() {
  renderizarConfig("contaFinanceira");
  renderizarConfig("centroCusto");
}

const titulos = {
  contaFinanceira: "Conta Financeira",
  centroCusto: "Centro de Custo",
};

const caminhos = {
  contaFinanceira: "contasFinanceiras",
  centroCusto: "centrosDeCusto",
};

const viewIds = {
  contaFinanceira: "listaContasView",
  centroCusto: "listaCentrosView",
};

function renderizarConfig(tipo) {
  const caminho = caminhos[tipo];
  const container = document.getElementById(viewIds[tipo]);
  if (!container) return;

  onValue(ref(database, caminho), (snapshot) => {
    const dados = snapshot.val();
    container.innerHTML = "";

    if (dados) {
      Object.entries(dados).forEach(([id, item]) => {
        const div = document.createElement("div");
        div.className = "config-item-row";
        div.innerHTML = `
          <span class="config-dot"></span>
          <span class="config-item-nome">${item.nome}</span>
          <button class="btn-excluir-config" data-id="${id}" data-tipo="${tipo}">×</button>
        `;
        div.querySelector(".btn-excluir-config").addEventListener("click", async function () {
          const confirmar = confirm(`Remover "${item.nome}"?`);
          if (confirmar) await remove(ref(database, `${caminho}/${id}`));
        });
        container.appendChild(div);
      });
    }

    // Campo inline para adicionar
    const addRow = document.createElement("div");
    addRow.className = "config-add-row";
    addRow.innerHTML = `
      <input type="text" class="config-add-input" placeholder="Novo ${titulos[tipo]}..."/>
      <button class="config-add-btn">+</button>
    `;
    addRow.querySelector(".config-add-btn").addEventListener("click", async function () {
      const input = addRow.querySelector(".config-add-input");
      const nome = input.value.trim();
      if (!nome) return;
      await push(ref(database, caminho), { nome });
      input.value = "";
    });
    addRow.querySelector(".config-add-input").addEventListener("keydown", async function (e) {
      if (e.key === "Enter") {
        const nome = this.value.trim();
        if (!nome) return;
        await push(ref(database, caminho), { nome });
        this.value = "";
      }
    });
    container.appendChild(addRow);
  });
}


let popupAtual = null;

function abrirPopup(tipo) {
    popupAtual = tipo;
    document.getElementById('popupTitulo').textContent = titulos[tipo];
    document.getElementById('popupAdicionarTitulo').textContent = 'Novo: ' + titulos[tipo];
    document.getElementById('popupPesquisa').value = '';
    escutarLista(tipo);
    document.getElementById('overlayPopup').classList.add('ativo');
    document.getElementById('popupPrincipal').classList.add('ativo');
}

function fecharPopup() {
    document.getElementById('overlayPopup').classList.remove('ativo');
    document.getElementById('popupPrincipal').classList.remove('ativo');
    fecharPopupAdicionar();
    popupAtual = null;
}

function abrirPopupAdicionar() {
    document.getElementById('popupNovoNome').value = '';
    document.getElementById('popupAdicionar').classList.add('ativo');
}

function fecharPopupAdicionar() {
    document.getElementById('popupAdicionar').classList.remove('ativo');
}

async function adicionarItem() {
    const nome = document.getElementById('popupNovoNome').value.trim();
    if (!nome || !popupAtual) return;

    const caminho = caminhos[popupAtual];
    const refDb = ref(database, caminho);

    await push(refDb, { nome });
    fecharPopupAdicionar();
}

function escutarLista(tipo) {
    const caminho = caminhos[tipo];
    const refDb = ref(database, caminho);

    onValue(refDb, (snapshot) => {
        const dados = snapshot.val();
        const itens = dados ? Object.values(dados).map(d => d.nome) : [];
        const filtro = document.getElementById('popupPesquisa').value;
        renderizarLista(itens, filtro);
    });
}

function renderizarLista(itens, filtro = '') {
    const lista = document.getElementById('popupLista');
    const filtrados = itens.filter(i => i.toLowerCase().includes(filtro.toLowerCase()));
    lista.innerHTML = filtrados.length
        ? filtrados.map(i => `<div class="popup-lista-item">${i}</div>`).join('')
        : `<div style="color:#475569;font-size:13px;padding:10px;">Nenhum item encontrado.</div>`;
}

document.getElementById('popupPesquisa').addEventListener('input', e => {
    if (!popupAtual) return;
    const refDb = ref(database, caminhos[popupAtual]);
    onValue(refDb, (snapshot) => {
        const dados = snapshot.val();
        const itens = dados ? Object.values(dados).map(d => d.nome) : [];
        renderizarLista(itens, e.target.value);
    }, { onlyOnce: true });
});

window.abrirPopup = abrirPopup;
window.fecharPopup = fecharPopup;
window.abrirPopupAdicionar = abrirPopupAdicionar;
window.fecharPopupAdicionar = fecharPopupAdicionar;
window.adicionarItem = adicionarItem;