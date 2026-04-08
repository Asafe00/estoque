import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "estoque-empresa-20acc.firebaseapp.com",
  databaseURL: "https://estoque-empresa-20acc-default-rtdb.firebaseio.com",
  projectId: "estoque-empresa-20acc",
  storageBucket: "estoque-empresa-20acc.firebasestorage.app",
  messagingSenderId: "333468546043",
  appId: "1:333468546043:web:1b70d85efbfa431627915e"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };