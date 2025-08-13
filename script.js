import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

const game = document.querySelector('#game');
const ctx = game.getContext('2d');
const colorsChoice = document.querySelector('#colorsChoice');
const cursor = document.querySelector('#cursor');
const authButton = document.querySelector('#authButton');
const adminPanel = document.querySelector('#adminPanel');

const banBtn = document.getElementById("banUser");
const clearAreaBtn = document.getElementById("clearArea");
const clearMapBtn = document.getElementById("clearMap");

let currentUser = null;
let selectedColor = "#000000";

game.width = 1200;
game.height = 600;

const gridCellSize = 10;

const colors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"];
colors.forEach(color => {
    const div = document.createElement("div");
    div.style.backgroundColor = color;
    div.addEventListener("click", () => selectedColor = color);
    colorsChoice.appendChild(div);
});

function drawGrid() {
    ctx.strokeStyle = "#ccc";
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
drawGrid();

game.addEventListener("mousemove", e => {
    cursor.style.left = e.pageX + "px";
    cursor.style.top = e.pageY + "px";
});

game.addEventListener("click", async e => {
    if (!currentUser) return alert("Войдите, чтобы рисовать!");
    const rect = game.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gridCellSize);
    const y = Math.floor((e.clientY - rect.top) / gridCellSize);

    await setDoc(doc(db, "pixels", `${x}_${y}`), { color: selectedColor });
    ctx.fillStyle = selectedColor;
    ctx.fillRect(x * gridCellSize, y * gridCellSize, gridCellSize, gridCellSize);
});

authButton.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
});

onAuthStateChanged(auth, user => {
    currentUser = user;
    if (user?.email === "logo100153@gmail.com") {
        adminPanel.style.display = "block";
    } else {
        adminPanel.style.display = "none";
    }
});

banBtn.addEventListener("click", async () => {
    if (currentUser?.email !== "logo100153@gmail.com") return;
    const email = document.getElementById("banEmail").value;
    await setDoc(doc(db, "banned", email), { banned: true });
    alert(`Игрок ${email} забанен`);
});

clearAreaBtn.addEventListener("click", async () => {
    if (currentUser?.email !== "logo100153@gmail.com") return;
    const pixels = await getDocs(collection(db, "pixels"));
    pixels.forEach(async (p) => await deleteDoc(p.ref));
    ctx.clearRect(0, 0, game.width, game.height);
    drawGrid();
});

clearMapBtn.addEventListener("click", async () => {
    if (currentUser?.email !== "logo100153@gmail.com") return;
    const pixels = await getDocs(collection(db, "pixels"));
    pixels.forEach(async (p) => await deleteDoc(p.ref));
    ctx.clearRect(0, 0, game.width, game.height);
    drawGrid();
});
