import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// 🔑 Твои ключи Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwy4jVn9JIwXuIXVycYAv9EdPGPkgIJvA",
  authDomain: "pixellox.firebaseapp.com",
  projectId: "pixellox",
  storageBucket: "pixellox.firebasestorage.app",
  messagingSenderId: "461991610382",
  appId: "1:461991610382:web:2a5ae293dde4a754c2d45f",
  measurementId: "G-YC8KLBZC2V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Регистрация
registerBtn.addEventListener('click', () => {
    createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .catch(err => alert(err.message));
});

// Вход
loginBtn.addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .catch(err => alert(err.message));
});

// Выход
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Проверка состояния
onAuthStateChanged(auth, user => {
    if (user) {
        logoutBtn.style.display = 'inline-block';
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
    } else {
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
    }
});

// 🎨 Тут можно будет добавить код рисования для PixelPlanet
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = "white";
ctx.fillRect(100, 100, 50, 50);
