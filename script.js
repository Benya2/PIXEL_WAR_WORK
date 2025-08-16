// ===== Imports =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getDatabase, ref, remove } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// ===== Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyCwy4jVn9JIwXuIXVycYAv9EdPGPkgIJvA",
  authDomain: "pixellox.firebaseapp.com",
  projectId: "pixellox",
  storageBucket: "pixellox.firebasestorage.app",
  messagingSenderId: "461991610382",
  appId: "1:461991610382:web:2a5ae293dde4a754c2d45f"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// ===== DOM =====
const colorsChoiceEl = document.getElementById('colorsChoice');
const paletteToggle = document.getElementById('paletteToggle');
const game = document.getElementById('game');
const ctx = game.getContext('2d');
const cursor = document.getElementById('cursor');
const reloadTimerEl = document.getElementById('reloadTimer');
const adminPanel = document.getElementById('adminPanel');
const clearAllPixelsBtn = document.getElementById('clearAllPixels');
const banUserBtn = document.getElementById('banUser');
const authButton = document.getElementById('authButton');
const coordsInput = document.getElementById('coordsInput');
const addPixelBtn = document.getElementById('addPixelBtn');
const removePixelBtn = document.getElementById('removePixelBtn');

const gridCellSize = 10;
game.width = 1200;
game.height = 600;

// ===== State =====
let currentColor = "#000000";
let canPlace = true;
const reloadTime = 5;

// ===== Colors (30 как в PixelPlanet) =====
const colors = [
  "rgb(255, 255, 255)", "rgb(96, 64, 40)", "rgb(228, 228, 228)", "rgb(245, 223, 176)",
  "rgb(196, 196, 196)", "rgb(255, 248, 137)", "rgb(136, 136, 136)", "rgb(229, 217, 0)",
  "rgb(78, 78, 78)", "rgb(148, 224, 68)", "rgb(0, 0, 0)", "rgb(2, 190, 1)",
  "rgb(244, 179, 174)", "rgb(104, 131, 56)", "rgb(255, 167, 209)", "rgb(0, 101, 19)",
  "rgb(255, 84, 178)", "rgb(202, 227, 255)", "rgb(255, 101, 101)", "rgb(0, 211, 221)",
  "rgb(229, 0, 0)", "rgb(0, 131, 199)", "rgb(154, 0, 0)", "rgb(0, 0, 234)",
  "rgb(254, 164, 96)", "rgb(25, 25, 115)", "rgb(229, 149, 0)", "rgb(207, 110, 228)",
  "rgb(160, 106, 66)", "rgb(130, 0, 128)"
];

colorsChoiceEl.innerHTML = "";
colors.forEach(c => {
  const div = document.createElement("div");
  div.style.backgroundColor = c;
  div.addEventListener("click", () => {
    currentColor = c;
    document.querySelectorAll("#colorsChoice div").forEach(el => el.classList.remove("selected"));
    div.classList.add("selected");
  });
  colorsChoiceEl.appendChild(div);
});

// ===== Palette toggle =====
const colorsChoice = document.getElementById("colorsChoice");
const togglePalette = document.getElementById("togglePalette");

togglePalette.addEventListener("click", () => {
  if (colorsChoice.style.display === "none") {
    colorsChoice.style.display = "grid";
  } else {
    colorsChoice.style.display = "none";
  }
});

// --- дальше идёт твой старый код без изменений (отрисовка, камера, база, админка и т.д.) ---


// ===== World map background (как в pixelplanet — карта стран) =====
// Положи рядом файл world.png (например 1200x600). Можно больше — всё равно зум/панорамирование.
const worldMap = new Image();
worldMap.src = 'world.png';
worldMap.onload = () => renderAll();

// ===== World size =====
const WORLD_WIDTH = 20000;
const WORLD_HEIGHT = 20000;

const gridCellSize = 10;
game.width = 1200;   // размер экрана
game.height = 600;   // размер экрана

// ===== Camera / Zoom / Pan =====
let camX = 0;  // мировые координаты (px)
let camY = 0;
let scale = 1;
const MIN_SCALE = 0.25;
const MAX_SCALE = 6;

let isPanning = false;
let lastMouseX = 0, lastMouseY = 0;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function screenToWorld(sx, sy) {
  const rect = game.getBoundingClientRect();
  const x = (sx - rect.left)/scale + camX;
  const y = (sy - rect.top)/scale + camY;
  return [x, y];
}
function snapToGrid(wx, wy) {
  return [
    Math.floor(wx / gridCellSize) * gridCellSize,
    Math.floor(wy / gridCellSize) * gridCellSize
  ];
}

// Наведённая клетка
let hoverCellX = 0, hoverCellY = 0;

// ===== Pixels cache (для быстрого рендера) =====
const pixelsCache = new Map(); // key: "x-y" -> {x,y,color}

// ===== Admin markers =====
let markers = []; // элементы: [x,y] в МИРОВЫХ px (кратно gridCellSize)

// ===== Grid + Draw =====
function renderAll() {
  // сброс и очистка
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,game.width,game.height);

  // трансформа камеры
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);

  const viewLeft = camX;
  const viewTop = camY;
  const viewRight = camX + game.width / scale;
  const viewBottom = camY + game.height / scale;

  // фон карта мира
  if (worldMap.complete && worldMap.naturalWidth) {
    // растянем на размер мира (0..game.width x 0..game.height)
    ctx.drawImage(worldMap, 0, 0, game.width, game.height);
  } else {
    // запасной фон
    ctx.fillStyle = '#eef6ff';
    ctx.fillRect(0,0,game.width,game.height);
  }

  // сетка (только в видимой области)
  ctx.beginPath();
  ctx.strokeStyle = "#ccc";
  let startX = Math.floor(viewLeft / gridCellSize) * gridCellSize;
  for (let x = startX; x <= viewRight; x += gridCellSize) {
    ctx.moveTo(x, viewTop);
    ctx.lineTo(x, viewBottom);
  }
  let startY = Math.floor(viewTop / gridCellSize) * gridCellSize;
  for (let y = startY; y <= viewBottom; y += gridCellSize) {
    ctx.moveTo(viewLeft, y);
    ctx.lineTo(viewRight, y);
  }
  ctx.stroke();

  // пиксели
  pixelsCache.forEach(d=>{
    if (d.color !== "#FFFFFF") {
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, gridCellSize, gridCellSize);
    }
  });

  // админ-маркеры
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  for (const [mx,my] of markers) {
    ctx.fillRect(mx, my, gridCellSize, gridCellSize);
  }

  // подсветка наведённой клетки
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(hoverCellX, hoverCellY, gridCellSize, gridCellSize);

  // сброс трансформа
  ctx.setTransform(1,0,0,1,0,0);
}

// ===== Firestore subscription (замена старого прямого рисования) =====
onSnapshot(collection(db,"pixels"), snapshot=>{
  pixelsCache.clear();
  snapshot.forEach(docSnap=>{
    const d = docSnap.data();
    pixelsCache.set(`${d.x}-${d.y}`, d);
  });
  renderAll();
});

// ===== Mouse handling (hover, pan, zoom) =====
game.addEventListener('mousedown', (e)=>{
  // панорамирование: правая/средняя кнопка или модификаторы
  if (e.button === 1 || e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
    isPanning = true; lastMouseX = e.clientX; lastMouseY = e.clientY;
    e.preventDefault();
  }
});
window.addEventListener('mouseup', ()=>{ isPanning = false; });
game.addEventListener('contextmenu', (e)=> e.preventDefault());

game.addEventListener('mousemove', (e)=>{
  if (isPanning) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    camX -= dx / scale;
    camY -= dy / scale;
    lastMouseX = e.clientX; lastMouseY = e.clientY;
    renderAll();
  }
  const [wx, wy] = screenToWorld(e.clientX, e.clientY);
  [hoverCellX, hoverCellY] = snapToGrid(wx, wy);
  renderAll();
});

game.addEventListener('wheel', (e)=>{
  e.preventDefault();
  const zoomFactor = 1.1;
  const [beforeX, beforeY] = screenToWorld(e.clientX, e.clientY);
  const dir = e.deltaY < 0 ? 1 : -1; // вверх — приблизить
  const newScale = clamp(scale * (dir > 0 ? zoomFactor : 1/zoomFactor), MIN_SCALE, MAX_SCALE);
  if (newScale === scale) return;
  scale = newScale;

  // держим точку под курсором на месте
  const rect = game.getBoundingClientRect();
  camX = beforeX - (e.clientX - rect.left)/scale;
  camY = beforeY - (e.clientY - rect.top)/scale;
  renderAll();
}, { passive: false });

// ===== Drawing (click to place) =====
async function placePixelWithHover() {
  if(!auth.currentUser) return alert("Login to draw!");
  if(!canPlace) return;
  canPlace = false;
  const x = hoverCellX;
  const y = hoverCellY;
  const pixelRef = doc(db,"pixels",`${x}-${y}`);
  try {
    if (currentColor==="#FFFFFF") await deleteDoc(pixelRef);
    else await setDoc(pixelRef,{x,y,color:currentColor});
  } catch(err){ console.error(err); }
  startReload();
}

game.addEventListener('click', (e)=>{
  // если в режиме панорамирования — не ставим пиксель
  if (isPanning || e.button !== 0) return;
  placePixelWithHover();
});

// Спрячем старый DOM-курсор, т.к. подсветка теперь рисуется на холсте
if (cursor) cursor.style.display = 'none';

// ===== Cooldown =====
function startReload(){
  let t = reloadTime;
  reloadTimerEl.innerText = `Reload: ${t} сек`;
  const interval = setInterval(()=>{
    t--;
    if(t<=0){
      clearInterval(interval);
      canPlace = true;
      reloadTimerEl.innerText = "Ready!";
    } else reloadTimerEl.innerText = `Reload: ${t} сек`;
  },1000);
}

// ===== Auth button =====
authButton.addEventListener('click', async () => {
  if (auth.currentUser) {
    await signOut(auth);
    return;
  }
  const action = prompt("Enter 1 to sign in, or 2 to create a new account:");
  if (!action || (action !== "1" && action !== "2")) return;

  const email = prompt("Email:");
  const pass = prompt("Password:");
  if (!email || !pass) return;

  try {
    if (action === "1") {
      await signInWithEmailAndPassword(auth, email, pass);
      alert("Come in!");
    } else if (action === "2") {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert("Account created!");
    }
  } catch (e) {
    alert(e.message);
  }
});

// ===== Auth state (admin panel) =====
onAuthStateChanged(auth, user => {
  if (user) {
    authButton.textContent = "Log Out";
    if (user.email === "logo100153@gmail.com") {
      adminPanel.style.display = "block";
    } else {
      adminPanel.style.display = "none";
    }
  } else {
    authButton.textContent = "Log In";
    adminPanel.style.display = "none";
  }
});

// ===== Admin: coords input in cells + preview =====
function parseCoords() {
  markers = [];
  const value = coordsInput.value.trim();
  if (!value) { renderAll(); return; }

  value.split(",").forEach(part => {
    const [xCellStr, yCellStr, wCellStr, hCellStr] = part.trim().split(/\s+/);
    const xCell = parseInt(xCellStr), yCell = parseInt(yCellStr);
    const wCell = parseInt(wCellStr || '1'), hCell = parseInt(hCellStr || '1');
    if (Number.isNaN(xCell) || Number.isNaN(yCell) || Number.isNaN(wCell) || Number.isNaN(hCell)) return;

    const startX = xCell * gridCellSize;
    const startY = yCell * gridCellSize;
    for (let dx = 0; dx < wCell; dx++) {
      for (let dy = 0; dy < hCell; dy++) {
        const px = startX + dx * gridCellSize;
        const py = startY + dy * gridCellSize;
        if (px >= 0 && py >= 0 && px <= game.width - gridCellSize && py <= game.height - gridCellSize) {
          markers.push([px, py]);
        }
      }
    }
  });
  renderAll();
}

coordsInput.addEventListener('input', parseCoords);

async function adminApplyPixels(mode) { // 'add' | 'remove'
  if (!auth.currentUser || auth.currentUser.email !== "logo100153@gmail.com") {
    return alert("Только админ!");
  }
  parseCoords();
  let count = 0;
  for (const [x,y] of markers) {
    const pixelRef = doc(db,"pixels",`${x}-${y}`);
    if (mode === 'add') { await setDoc(pixelRef, {x,y,color:currentColor}); count++; }
    else { await deleteDoc(pixelRef); count++; }
  }
  alert(`${mode==='add'?'Добавлено':'Удалено'} пикселей: ${count}`);
}

addPixelBtn.addEventListener('click', ()=>adminApplyPixels('add'));
removePixelBtn.addEventListener('click', ()=>adminApplyPixels('remove'));

// ===== Admin: clear map =====
clearAllPixelsBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser) return alert("Только админ!");
  const snapshot = await getDocs(collection(db,"pixels"));
  snapshot.forEach(doc=>deleteDoc(doc.ref));
});

// ===== Admin: ban user by id =====
banUserBtn.addEventListener('click', ()=>{
  if(!auth.currentUser) return alert("Только админ!");
  const userId = prompt("Введите UserID для бана:");
  if(!userId) return;
  const userRef = ref(rtdb,'users/'+userId);
  remove(userRef).then(()=>alert("Пользователь забанен!")).catch(e=>console.error(e));
});




