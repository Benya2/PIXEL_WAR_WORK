import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, getDocs, collection, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const game = document.getElementById("game");
const ctx = game.getContext("2d");
game.width = 1200;
game.height = 600;

const gridSize = 10;
let currentColor = "#000000";

// Панель цветов
const colors = ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];
const colorsChoice = document.getElementById("colorsChoice");
colors.forEach(c => {
    const div = document.createElement("div");
    div.style.backgroundColor = c;
    div.addEventListener("click", () => currentColor = c);
    colorsChoice.appendChild(div);
});

// Курсор
const cursor = document.getElementById("cursor");
game.addEventListener("mousemove", e => {
    const rect = game.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left) / gridSize) * gridSize;
    let y = Math.floor((e.clientY - rect.top) / gridSize) * gridSize;
    cursor.style.left = rect.left + x + "px";
    cursor.style.top = rect.top + y + "px";
});

// Отрисовка сетки
function drawGrid() {
    ctx.clearRect(0, 0, game.width, game.height);
    ctx.strokeStyle = "#ddd";
    for (let x = 0; x < game.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, game.height);
        ctx.stroke();
    }
    for (let y = 0; y < game.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(game.width, y);
        ctx.stroke();
    }
}

// Загрузка пикселей из Firebase
function loadPixels() {
    onSnapshot(collection(db, "pixels"), snapshot => {
        drawGrid();
        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, gridSize, gridSize);
        });
    });
}
loadPixels();

// Ставим пиксель
game.addEventListener("click", e => {
    const rect = game.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left) / gridSize) * gridSize;
    let y = Math.floor((e.clientY - rect.top) / gridSize) * gridSize;
    setDoc(doc(db, "pixels", `${x}_${y}`), { x, y, color: currentColor });
});

// Авторизация
document.getElementById("authButton").addEventListener("click", async () => {
    await signInWithPopup(auth, provider);
});

onAuthStateChanged(auth, user => {
    if (user) {
        if (user.email === "logo100153@gmail.com") {
            document.getElementById("adminPanel").style.display = "block";
        }
    }
});

// Админка
document.getElementById("banBtn").addEventListener("click", () => {
    const email = document.getElementById("banEmail").value;
    alert(`Пользователь ${email} забанен (здесь можно добавить бан в Firebase)`);
});

document.getElementById("clearAreaBtn").addEventListener("click", async () => {
    const pixels = await getDocs(collection(db, "pixels"));
    pixels.forEach(async (docSnap) => {
        const p = docSnap.data();
        if (p.x < 200 && p.y < 200) { // Пример: область 200x200
            await deleteDoc(doc(db, "pixels", docSnap.id));
        }
    });
});

document.getElementById("clearMapBtn").addEventListener("click", async () => {
    const pixels = await getDocs(collection(db, "pixels"));
    pixels.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "pixels", docSnap.id));
    });
});
