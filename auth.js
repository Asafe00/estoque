import { database } from "./firebase.js";
import { ref, push, get } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// 🔹 REGISTRO
const formRegistro = document.getElementById("formRegistro");

if (formRegistro){
  formRegistro.addEventListener("submit", async function(event){
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const senha = document.getElementById("senha").value;

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

    await push(ref(database, "usuarios"), {
      nome: nome,
      senha: senha
    });

    alert("Usuário registrado!");
    window.location.href = "/index.html";
  });
}

// 🔹 LOGIN
const formLogin = document.getElementById("formLogin");

if(formLogin){
  formLogin.addEventListener("submit", async function(event){
    event.preventDefault();

    const nomeDigitado = document.getElementById("loginNome").value;
    const senhaDigitada = document.getElementById("loginSenha").value;

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