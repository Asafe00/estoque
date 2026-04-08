import "./firebase.js";
import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/estoque/paginas/login.html";
  }
});