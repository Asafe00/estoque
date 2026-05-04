import { app } from "/estoque/firebase.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";


const auth = getAuth(app);

const paginaAtual = window.location.pathname;

const paginasPublicas = ["login.html", "registrar.html"];

const ehPublica = paginasPublicas.some(pagina =>
  paginaAtual.includes(pagina)
);

if (!ehPublica) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/estoque/paginas/login.html";
    } else {
    // Usa displayName se existir, senão usa o e-mail antes do @
    const nome = user.displayName || user.email.split("@")[0];
    if (window.setUserDisplay) window.setUserDisplay(nome);
  }
  });
}