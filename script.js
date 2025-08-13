// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

// Элементы
const game = document.getElementById("game");
const ctx = game.getContext("2d");
const cursor = document.getElementById("cursor");
const colorsChoice = document.getElementById("colorsChoice");
const adminPanel = document.getElementById("adminPanel");

// Размеры сетки
const gridCellSize = 10;
game.width = 1200;
game.height = 600;

let currentColor = "#ff5a5f";
let isDrawing = false;

// Цвета
colorsChoice.querySelectorAll("div").forEach(div => {
  div.addEventListener("click", () => {
    currentColor = div.dataset.color;
  });
});

// Отрисовка сетки
function drawGrid() {
  ctx.clearRect(0, 0, game.width, game.height);
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < game.width; x += gridCellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, game.height);
    ctx.stroke();
  }
  for (let y = 0; y < game.height; y += gridCellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(game.width, y);
    ctx.stroke();
  }
}

// Загрузка пикселей
onSnapshot(collection(db, "pixels"), snapshot => {
  drawGrid();
  snapshot.forEach(doc => {
    const { x, y, color } = doc.data();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridCellSize, gridCellSize);
  });
});

// Ставим пиксель
async function placePixel(mouseX, mouseY) {
  const gridX = Math.floor(mouseX / gridCellSize) * gridCellSize;
  const gridY = Math.floor(mouseY / gridCellSize) * gridCellSize;
  await setDoc(doc(db, "pixels", `${gridX}_${gridY}`), {
    x: gridX,
    y: gridY,
    color: currentColor
  });
}

// Обработка кликов
game.addEventListener("mousedown", e => {
  isDrawing = true;
  placePixel(e.offsetX, e.offsetY);
});
game.addEventListener("mouseup", () => isDrawing = false);
game.addEventListener("mousemove", e => {
  cursor.style.left = `${e.pageX}px`;
  cursor.style.top = `${e.pageY}px`;
  if (isDrawing) {
    placePixel(e.offsetX, e.offsetY);
  }
});

// Авторизация
onAuthStateChanged(auth, user => {
  if (user) {
    if (user.email === "logo100153@gmail.com") {
      adminPanel.style.display = "block";
    }
  }
});

// Очистка всей карты
document.getElementById("clearAllBtn").addEventListener("click", async () => {
  if (confirm("Вы уверены, что хотите удалить все пиксели?")) {
    const pixels = await getDocs(collection(db, "pixels"));
    pixels.forEach(async pixel => {
      await deleteDoc(doc(db, "pixels", pixel.id));
    });
  }
});
