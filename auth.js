import { app } from "/estoque/firebase.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const auth = getAuth(app);


// 🔹 REGISTRO
const formRegistro = document.getElementById("formRegistro");

if (formRegistro){
  formRegistro.addEventListener("submit", async function(event){
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const senha = document.getElementById("senha").value;

    // 🔥 Firebase precisa de email → adaptamos
    const email = nome + "@sistema.com";

    try {
      await createUserWithEmailAndPassword(auth, email, senha);

      alert("Usuário registrado!");
      window.location.href = "/index.html";

    } catch (erro){
      if(erro.code === "auth/email-already-in-use"){
        alert("Esse usuário já existe!");
      } else {
        alert("Erro ao registrar");
        console.error(erro);
      }
    }
  });
}


// 🔹 LOGIN
const formLogin = document.getElementById("formLogin");

if(formLogin){
  formLogin.addEventListener("submit", async function(event){
    event.preventDefault();

    const nomeDigitado = document.getElementById("loginNome").value;
    const senhaDigitada = document.getElementById("loginSenha").value;

    const email = nomeDigitado + "@sistema.com";

    try {
      await signInWithEmailAndPassword(auth, email, senhaDigitada);

      alert("Login realizado com sucesso!");
      window.location.href = "/index.html";

    } catch (erro){
      alert("Usuário ou senha inválidos!");
      console.error(erro);
    }
  });
}