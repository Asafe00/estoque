import { app } from "/estoque/firebase.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const auth = getAuth(app);

const paginaAtual = window.location.pathname;

if (paginaAtual.includes("login.html") ||
    paginaAtual.includes("registrar.html") {
  // 👉 se estiver no login, não faz nada
} else {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/estoque/paginas/login.html";
    }
  });
}