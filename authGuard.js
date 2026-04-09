import { app } from "/estoque/firebase.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const auth = getAuth(app);

const paginasPublicas = ["login.html", "registrar.html"];

const ehPublica = paginasPublicas.some(pagina =>
  paginaAtual.includes(pagina)
);

if (!ehPublica) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/estoque/paginas/login.html";
    }
  });
}