import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

// ====== Firebase ======
const firebaseConfig = {
  apiKey: "AIzaSyCwy4jVn9JIwXuIXVycYAv9EdPGPkgIJvA",
  authDomain: "pixellox.firebaseapp.com",
  databaseURL: "https://pixellox-default-rtdb.firebaseio.com",
  projectId: "pixellox",
  storageBucket: "pixellox.appspot.com",
  messagingSenderId: "461991610382",
  appId: "1:461991610382:web:2a5ae293dde4a754c2d45f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);

// ====== Элементы ======
const authButton = document.getElementById("authButton");
const adminPanel = document.getElementById("adminPanel");
const banUserBtn = document.getElementById("banUserBtn");

// ====== Проверка бана ======
async function isBanned(email) {
  const safeEmail = email.replace(/\./g, ",");
  const snapshot = await get(ref(rtdb, "bannedEmails/" + safeEmail));
  return snapshot.exists();
}

// ====== Авторизация ======
authButton.addEventListener("click", async () => {
  if (auth.currentUser) {
    await signOut(auth);
    return;
  }

  const action = prompt("Введите 1 для входа, 2 для регистрации:");
  if (!action || (action !== "1" && action !== "2")) return;

  const email = prompt("Email:");
  const pass = prompt("Пароль:");
  if (!email || !pass) return;

  if (await isBanned(email)) {
    alert("Этот аккаунт забанен!");
    return;
  }

  try {
    if (action === "1") {
      await signInWithEmailAndPassword(auth, email, pass);
      alert("Добро пожаловать!");
    } else {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert("Аккаунт создан!");
    }
  } catch (e) {
    alert("Ошибка: " + e.message);
  }
});

// ====== Отслеживание входа и банов ======
onAuthStateChanged(auth, (user) => {
  if (user) {
    authButton.textContent = "Выйти";

    // Проверка бана в реальном времени
    const safeEmail = user.email.replace(/\./g, ",");
    const banRef = ref(rtdb, "bannedEmails/" + safeEmail);
    onValue(banRef, (snapshot) => {
      if (snapshot.exists()) {
        alert("Вы были забанены!");
        signOut(auth);
      }
    });

    // Панель админа
    if (user.email === "logo100153@gmail.com") {
      adminPanel.style.display = "block";
    } else {
      adminPanel.style.display = "none";
    }
  } else {
    authButton.textContent = "Войти";
    adminPanel.style.display = "none";
  }
});

// ====== Бан по email ======
banUserBtn.addEventListener("click", async () => {
  if (!auth.currentUser || auth.currentUser.email !== "logo100153@gmail.com") {
    return alert("Только админ может банить!");
  }

  const email = prompt("Введите Email для бана:");
  if (!email) return;

  const safeEmail = email.replace(/\./g, ",");
  await set(ref(rtdb, "bannedEmails/" + safeEmail), true);
  alert("Пользователь забанен!");
});
