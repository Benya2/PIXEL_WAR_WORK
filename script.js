import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Email админа
const adminEmail = "logo100153@gmail.com";

const adminPanel = document.getElementById("admin-panel");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Вход
loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        checkAdmin(email);
    } catch (err) {
        alert(err.message);
    }
});

// Регистрация
registerBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        alert("Аккаунт создан!");
    } catch (err) {
        alert(err.message);
    }
});

// Выход
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    adminPanel.style.display = "none";
    logoutBtn.style.display = "none";
});

// Проверка админа
function checkAdmin(email) {
    if (email === adminEmail) {
        adminPanel.style.display = "block";
    }
    logoutBtn.style.display = "inline-block";
}

// Бан игрока
document.getElementById("banBtn").addEventListener("click", async () => {
    const email = document.getElementById("banEmail").value;
    if (!email) return alert("Введите email");
    await setDoc(doc(db, "banned", email), { banned: true });
    alert(`Игрок ${email} забанен`);
});

// Очистка зоны
document.getElementById("clearBtn").addEventListener("click", () => {
    const x = parseInt(document.getElementById("clearX").value);
    const y = parseInt(document.getElementById("clearY").value);
    const size = parseInt(document.getElementById("clearSize").value);
    alert(`Зона (${x},${y}) размером ${size} очищена (здесь будет логика)`);
});

// Установка пикселя
document.getElementById("placePixelBtn").addEventListener("click", () => {
    const x = parseInt(document.getElementById("pixelX").value);
    const y = parseInt(document.getElementById("pixelY").value);
    const color = document.getElementById("pixelColor").value;
    alert(`Поставлен пиксель в (${x},${y}) цветом ${color} (здесь будет логика)`);
});
