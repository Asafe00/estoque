import { database } from "./firebase.js";
import { ref, push, get, remove, update, onValue }
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { getAuth, signOut }
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const auth = getAuth();
window.logout = function(){ signOut(auth); };

// ─── Cache local ────────────────────────────────────────────────
let cacheProdutos  = {};   // { id: { nome, quantidade, quantidadeMinima } }
let cacheHistorico = {};   // { id: { … } }

// ─── Inicialização ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function(){
  mostrarCarregando(true);

  // UMA só viagem para produtos + UMA para histórico, em paralelo
  const [snapProd, snapHist] = await Promise.all([
    get(ref(database, "produtos")),
    get(ref(database, "historico"))
  ]);

  cacheProdutos  = snapProd.exists()  ? snapProd.val()  : {};
  cacheHistorico = snapHist.exists()  ? snapHist.val()  : {};

  renderizarEstoque();
  renderizarMovimentacao();
  renderizarHistorico();
  renderizarMinimos();

  mostrarCarregando(false);
});

function mostrarCarregando(ativo){
  const el = document.getElementById("loadingIndicator");
  if(el) el.style.display = ativo ? "block" : "none";
}

// ─── Formulário: adicionar produto ──────────────────────────────
const formProduto = document.getElementById("formProduto");
if(formProduto){
  formProduto.addEventListener("submit", async function(e){
    e.preventDefault();

    const nome  = document.getElementById("produto").value.trim();
    const qtd   = Number(document.getElementById("quantidade").value);
    const min   = Number(document.getElementById("quantidademin").value);

    // Verifica duplicata no cache local — sem ir ao Firebase
    const existe = Object.values(cacheProdutos).some(p => p.nome === nome);
    if(existe){ alert("Produto já existe!"); return; }

    const novoRef = await push(ref(database, "produtos"), {
      nome, quantidade: qtd, quantidadeMinima: min
    });

    // Atualiza cache e re-renderiza sem nova requisição
    cacheProdutos[novoRef.key] = { nome, quantidade: qtd, quantidadeMinima: min };

    formProduto.reset();
    renderizarEstoque();
    renderizarMovimentacao();
    renderizarMinimos();
  });
}

// ─── Render: tabela de estoque ──────────────────────────────────
function renderizarEstoque(){
  const lista = document.getElementById("listaProdutos");
  if(!lista) return;

  lista.innerHTML = "";

  for(let id in cacheProdutos){
    const p = cacheProdutos[id];

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = p.nome;

    const tdQtd = document.createElement("td");
    tdQtd.textContent = p.quantidade;

    const tdAcao = document.createElement("td");
    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.classList.add("botaoexcluir");
    botaoExcluir.addEventListener("click", async function(){
      await remove(ref(database, "produtos/" + id));
      delete cacheProdutos[id];           // remove do cache
      renderizarEstoque();
      renderizarMovimentacao();
      renderizarMinimos();
    });

    tdAcao.appendChild(botaoExcluir);
    tr.append(tdNome, tdQtd, tdAcao);
    lista.appendChild(tr);
  }
}

// ─── Render: tabela de movimentação ─────────────────────────────
function renderizarMovimentacao(){
  const lista = document.getElementById("listaMovimentacao");
  if(!lista) return;

  lista.innerHTML = "";

  for(let id in cacheProdutos){
    const produto = cacheProdutos[id];

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = produto.nome;

    const tdQtd = document.createElement("td");
    tdQtd.textContent = produto.quantidade;
    tdQtd.dataset.id = id;               // marca para atualização pontual

    const tdMov = document.createElement("td");

    const inputPessoa  = criarInput("text",   "Responsável",      "input-pessoa");
    const inputNumero  = criarInput("number", "",                 "input-numero");
    const inputConta   = criarInput("text",   "Conta financeira", "input-conta");
    const inputCentro  = criarInput("text",   "Centro de custo",  "input-centro");

    const botaoAdd = document.createElement("button");
    botaoAdd.textContent = "+";
    botaoAdd.classList.add("btn-add");

    const botaoRem = document.createElement("button");
    botaoRem.textContent = "-";
    botaoRem.classList.add("btn-rem");

    async function registrarMovimentacao(tipo){
      const valor = Number(inputNumero.value);
      if(!valor) return;

      const estoqueAnterior = Number(produto.quantidade);
      let novaQtd = tipo === "Entrada"
        ? estoqueAnterior + valor
        : Math.max(0, estoqueAnterior - valor);

      const entrada = {
        produto: produto.nome,
        tipo,
        responsavel: inputPessoa.value || "Não informado",
        quantidade: valor,
        estoqueAnterior,
        estoqueFinal: novaQtd,
        contaFinanceira: inputConta.value || "Não informado",
        centroCusto: inputCentro.value || "Não informado",
        data: new Date().toLocaleString(),
        timestamp: Date.now()
      };

      // Duas escritas em paralelo
      const [, novoHistRef] = await Promise.all([
        update(ref(database, "produtos/" + id), { quantidade: novaQtd }),
        push(ref(database, "historico"), entrada)
      ]);

      // Atualiza cache
      cacheProdutos[id].quantidade = novaQtd;
      cacheHistorico[novoHistRef.key] = entrada;

      // Atualiza SOMENTE as células afetadas — sem recarregar nada
      tdQtd.textContent = novaQtd;
      produto.quantidade = novaQtd;   // mantém referência local em sincronia

      // Histórico e mínimos precisam refletir a mudança
      renderizarHistorico();
      renderizarMinimos();

      inputNumero.value = "";
    }

    botaoAdd.addEventListener("click", () => registrarMovimentacao("Entrada"));
    botaoRem.addEventListener("click", () => registrarMovimentacao("Saída"));

    tdMov.append(inputPessoa, inputNumero, inputConta, inputCentro, botaoAdd, botaoRem);
    tr.append(tdNome, tdQtd, tdMov);
    lista.appendChild(tr);
  }
}

// ─── Render: histórico ───────────────────────────────────────────
function renderizarHistorico(){
  const lista = document.getElementById("listaHistorico");
  if(!lista) return;

  lista.innerHTML = "";

  // Ordena do mais recente para o mais antigo
  const itens = Object.values(cacheHistorico).sort((a, b) =>
    (b.timestamp || 0) - (a.timestamp || 0)
  );

  for(let item of itens){
    const tr = document.createElement("tr");

    const tdTipo = document.createElement("td");
    tdTipo.textContent = item.tipo;
    tdTipo.classList.add(item.tipo === "Entrada" ? "entrada" : "saida");

    tr.append(
      td(item.produto),
      tdTipo,
      td(item.responsavel),
      td(item.contaFinanceira || "—"),
      td(item.centroCusto    || "—"),
      td(item.quantidade),
      td(item.estoqueFinal),
      td(item.data)
    );

    lista.appendChild(tr);
  }
}

// ─── Render: mínimos ─────────────────────────────────────────────
function renderizarMinimos(){
  const lista = document.getElementById("listaMinimos");
  if(!lista) return;

  lista.innerHTML = "";

  for(let id in cacheProdutos){
    const produto = cacheProdutos[id];
    const qtd = Number(produto.quantidade);
    const min = Number(produto.quantidadeMinima);

    if(qtd > min) continue;

    const tr = document.createElement("tr");
    tr.classList.add("linha-baixa");

    const tdExpandir = document.createElement("td");
    const botaoExpandir = document.createElement("button");
    botaoExpandir.textContent = "▼";
    botaoExpandir.classList.add("btn-expandir");

    botaoExpandir.addEventListener("click", function(){
      const proxima = tr.nextSibling;

      if(proxima?.classList?.contains("linha-historico")){
        proxima.remove();
        botaoExpandir.textContent = "▼";
        return;
      }

      botaoExpandir.textContent = "▲";

      // Usa o cache local — sem nova requisição ao Firebase
      const filtrado = Object.values(cacheHistorico)
        .filter(h => h.produto === produto.nome)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);

      const trHist = document.createElement("tr");
      trHist.classList.add("linha-historico");

      const tdHist = document.createElement("td");
      tdHist.colSpan = 5;
      tdHist.innerHTML = `
        <table class="tabela-historico">
          <thead><tr>
            <th>Operação</th><th>Responsável</th><th>Conta Financeira</th>
            <th>Centro de Custo</th><th>Quantidade</th><th>Estoque após</th><th>Data</th>
          </tr></thead>
          <tbody>
            ${filtrado.map(item => `
              <tr>
                <td class="${item.tipo === 'Entrada' ? 'entrada' : 'saida'}">${item.tipo}</td>
                <td>${item.responsavel}</td>
                <td>${item.contaFinanceira || "—"}</td>
                <td>${item.centroCusto || "—"}</td>
                <td>${item.quantidade}</td>
                <td>${item.estoqueFinal}</td>
                <td>${item.data}</td>
              </tr>`).join("")}
          </tbody>
        </table>`;

      trHist.appendChild(tdHist);
      tr.parentNode.insertBefore(trHist, tr.nextSibling);
    });

    tdExpandir.appendChild(botaoExpandir);
    tr.append(td(produto.nome), td(qtd), td(min), tdStatus(), tdExpandir);
    lista.appendChild(tr);
  }
}

// ─── Limpar histórico ────────────────────────────────────────────
const botaoLimpar = document.getElementById("limparHistorico");
if(botaoLimpar){
  botaoLimpar.addEventListener("click", async function(){
    if(!confirm("Deseja apagar todo o histórico?")) return;
    await remove(ref(database, "historico"));
    cacheHistorico = {};
    renderizarHistorico();
  });
}

// ─── Filtros de busca ────────────────────────────────────────────
const inputPesquisa = document.getElementById("pesquisaProduto");
if(inputPesquisa){
  inputPesquisa.addEventListener("input", function(){
    filtrarLinhas("listaMovimentacao", this.value);
  });
}

const inputEstoque = document.getElementById("pesquisaEstoque");
if(inputEstoque){
  inputEstoque.addEventListener("input", function(){
    filtrarLinhas("listaProdutos", this.value);
  });
}

function filtrarLinhas(tabelaId, filtro){
  const f = filtro.toLowerCase();
  document.querySelectorAll(`#${tabelaId} tr`).forEach(linha => {
    linha.style.display =
      linha.children[0]?.textContent.toLowerCase().includes(f) ? "" : "none";
  });
}

// ─── Helpers ─────────────────────────────────────────────────────
function td(texto){
  const el = document.createElement("td");
  el.textContent = texto;
  return el;
}

function tdStatus(){
  const el = document.createElement("td");
  el.textContent = "REPOR";
  el.classList.add("status-baixo");
  return el;
}

function criarInput(tipo, placeholder, classe){
  const el = document.createElement("input");
  el.type = tipo;
  el.placeholder = placeholder;
  el.classList.add(classe);
  return el;
}