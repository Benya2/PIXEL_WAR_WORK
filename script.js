import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// 🔹 Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwy4jVn9JIwXuIXVycYAv9EdPGPkgIJvA",
  authDomain: "pixellox.firebaseapp.com",
  projectId: "pixellox",
  storageBucket: "pixellox.firebasestorage.app",
  messagingSenderId: "461991610382",
  appId: "1:461991610382:web:2a5ae293dde4a754c2d45f",
  measurementId: "G-YC8KLBZC2V"
};

// 🔹 Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 HTML элементы
const adminPanel = document.getElementById("adminPanel");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const authStatus = document.getElementById("authStatus");
const banBtn = document.getElementById("banBtn");
const banEmail = document.getElementById("banEmail");
const clearAllBtn = document.getElementById("clearAllBtn");

// 🔹 Регистрация
registerBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    authStatus.textContent = "Регистрация успешна!";
  } catch (err) {
    authStatus.textContent = err.message;
  }
});

// 🔹 Вход
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    authStatus.textContent = "Вход успешен!";
  } catch (err) {
    authStatus.textContent = err.message;
  }
});

// 🔹 Проверка админа
onAuthStateChanged(auth, (user) => {
  if (user && user.email === "logo100153@gmail.com") {
    adminPanel.style.display = "flex";
  } else {
    adminPanel.style.display = "none";
  }
});

// 🔹 Бан игрока (заглушка, нужно будет дописать логику)
banBtn.addEventListener("click", () => {
  alert(`Игрок ${banEmail.value} забанен (фейк, допиши Firestore-логику)`);
});

// 🔹 Очистка всей карты
clearAllBtn.addEventListener("click", async () => {
  if (!confirm("Вы уверены, что хотите удалить все пиксели?")) return;
  const pixelsRef = collection(db, "pixels");
  const snapshot = await getDocs(pixelsRef);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "pixels", docSnap.id));
  }
  alert("Карта очищена!");
});

// 🔹 Здесь твой код игры с пикселями...
// (нужно вставить сюда твой рабочий canvas-скрипт)
