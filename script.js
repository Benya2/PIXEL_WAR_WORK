import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// ---------------- Firebase ----------------
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
const auth = getAuth(app);

// ---------------- DOM ----------------
const colorsChoiceEl = document.getElementById('colorsChoice');
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

game.width = 1200;
game.height = 600;

// ---------------- Переменные ----------------
let currentColor = "#000000";
let canPlace = true;
const reloadTime = 5;
const gridCellSize = 10;

let cameraX = -600; // центр карты по X
let cameraY = -300; // центр карты по Y
let scale = 1; // зум

let dragging = false;
let dragStart = {x:0, y:0};
let cameraStart = {x:0, y:0};

// ---------------- Цвета ----------------
const colors = ["#FFFFFF","#B39DDB","#9FA8DA","#90CAF9","#81D4FA","#80DEEA","#4DB6AC","#66BB6A","#9CCC65","#CDDC39","#FFEB3B","#FFC107","#FF9800","#FF5722","#A1887F","#E0E0E0","#000000"];
colors.forEach(c=>{
  const div = document.createElement('div');
  div.style.backgroundColor = c;
  div.addEventListener('click', ()=> {
    currentColor = c;
    document.querySelectorAll('#colorsChoice div').forEach(el=>el.classList.remove('selected'));
    div.classList.add('selected');
  });
  colorsChoiceEl.appendChild(div);
});

// ---------------- Камера и курсор ----------------
function screenToWorld(x, y){
  return {x: Math.floor(cameraX + x / (gridCellSize*scale)), y: Math.floor(cameraY + y / (gridCellSize*scale))};
}
function worldToScreen(x, y){
  return {x: (x - cameraX)*gridCellSize*scale, y: (y - cameraY)*gridCellSize*scale};
}

game.addEventListener('mousemove', e=>{
  const rect = game.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  const world = screenToWorld(mx, my);
  const screen = worldToScreen(world.x, world.y);
  cursor.style.left = screen.x + "px";
  cursor.style.top = screen.y + "px";
  cursor.style.width = gridCellSize*scale + "px";
  cursor.style.height = gridCellSize*scale + "px";

  if(dragging){
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    cameraX = cameraStart.x - dx/(gridCellSize*scale);
    cameraY = cameraStart.y - dy/(gridCellSize*scale);
    render();
  }
});

game.addEventListener('mousedown', e=>{
  if(e.button===2){ // ПКМ для перемещения
    dragging = true;
    dragStart = {x: e.clientX, y: e.clientY};
    cameraStart = {x: cameraX, y: cameraY};
  }
});
game.addEventListener('mouseup', e=>{
  if(e.button===2) dragging = false;
});

game.addEventListener('wheel', e=>{
  const rect = game.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const worldBefore = screenToWorld(mx, my);

  scale *= e.deltaY < 0 ? 1.1 : 0.9;
  if(scale < 0.5) scale=0.5;
  if(scale > 5) scale=5;

  const worldAfter = screenToWorld(mx, my);
  cameraX += worldBefore.x - worldAfter.x;
  cameraY += worldBefore.y - worldAfter.y;

  render();
  e.preventDefault();
});

// ---------------- Рисование ----------------
let pixelsCache = new Map();

async function loadVisiblePixels(){
  const viewLeft = Math.floor(cameraX);
  const viewTop = Math.floor(cameraY);
  const viewRight = Math.ceil(cameraX + game.width/(gridCellSize*scale));
  const viewBottom = Math.ceil(cameraY + game.height/(gridCellSize*scale));

  const q1 = query(collection(db,"pixels"), 
      where("x", ">=", viewLeft),
      where("x", "<=", viewRight));
  const snapshot = await getDocs(q1);

  pixelsCache.clear();
  snapshot.forEach(doc=>{
    const d = doc.data();
    if(d.y >= viewTop && d.y <= viewBottom)
      pixelsCache.set(`${d.x}-${d.y}`, d.color);
  });
}

function render(){
  ctx.clearRect(0,0,game.width,game.height);

  // Сетка
  ctx.beginPath();
  ctx.strokeStyle = "#ccc";
  for(let x=Math.floor(cameraX); x<cameraX + game.width/(gridCellSize*scale); x++){
    const sx = (x - cameraX)*gridCellSize*scale;
    ctx.moveTo(sx,0);
    ctx.lineTo(sx,game.height);
  }
  for(let y=Math.floor(cameraY); y<cameraY + game.height/(gridCellSize*scale); y++){
    const sy = (y - cameraY)*gridCellSize*scale;
    ctx.moveTo(0,sy);
    ctx.lineTo(game.width,sy);
  }
  ctx.stroke();

  // Пиксели
  pixelsCache.forEach((color,key)=>{
    const [x,y] = key.split("-").map(Number);
    const screen = worldToScreen(x,y);
    ctx.fillStyle = color;
    ctx.fillRect(screen.x, screen.y, gridCellSize*scale, gridCellSize*scale);
  });
}

// ---------------- Пиксель (клик) ----------------
game.addEventListener('click', async ()=>{
  if(!auth.currentUser) return alert("Login to draw!");
  if(!canPlace) return;
  canPlace = false;

  const world = screenToWorld(parseInt(cursor.style.left), parseInt(cursor.style.top));
  const x = world.x;
  const y = world.y;
  const pixelRef = doc(db,"pixels",`${x}-${y}`);
  try{
    if(currentColor==="#FFFFFF") await deleteDoc(pixelRef);
    else await setDoc(pixelRef,{x,y,color:currentColor});
  }catch(err){console.error(err);}
  startReload();
  await loadVisiblePixels();
  render();
});

// ---------------- Кулдаун ----------------
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

// ---------------- Авторизация ----------------
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
    if (action === "1") await signInWithEmailAndPassword(auth,email,pass);
    else await createUserWithEmailAndPassword(auth,email,pass);
    alert("Success!");
  } catch(e){ alert(e.message); }
});

onAuthStateChanged(auth, user => {
  if(user){
    authButton.textContent = "Log Out";
    if(user.email==="logo100153@gmail.com") adminPanel.style.display="block";
    else adminPanel.style.display="none";
  }else{
    authButton.textContent = "Log In";
    adminPanel.style.display="none";
  }
});

// ---------------- Админка ----------------
let markers = [];

function parseCoords(){
  markers=[];
  const value = coordsInput.value.trim();
  if(!value) return;
  value.split(",").forEach(part=>{
    let [xCell, yCell, wCell, hCell] = part.trim().split(/\s+/);
    let startX = parseInt(xCell);
    let startY = parseInt(yCell);
    let width = parseInt(wCell) || 1;
    let height = parseInt(hCell) || 1;
    for(let dx=0; dx<width; dx++){
      for(let dy=0; dy<height; dy++){
        markers.push([startX+dx, startY+dy]);
      }
    }
  });
}

function drawMarkers(){
  markers.forEach(([x,y])=>{
    const screen = worldToScreen(x,y);
    ctx.fillStyle = "rgba(255,0,0,0.5)";
    ctx.fillRect(screen.x,screen.y,gridCellSize*scale,gridCellSize*scale);
  });
}

coordsInput.addEventListener('input', ()=>{
  parseCoords();
  render();
  drawMarkers();
});

addPixelBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser || auth.currentUser.email!=="logo100153@gmail.com") return alert("Только админ!");
  parseCoords();
  for(let [x,y] of markers){
    const pixelRef = doc(db,"pixels",`${x}-${y}`);
    await setDoc(pixelRef,{x,y,color:currentColor});
  }
  await loadVisiblePixels();
  render();
  alert(`Добавлено пикселей: ${markers.length}`);
});

removePixelBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser || auth.currentUser.email!=="logo100153@gmail.com") return alert("Только админ!");
  parseCoords();
  for(let [x,y] of markers){
    const pixelRef = doc(db,"pixels",`${x}-${y}`);
    await deleteDoc(pixelRef);
  }
  await loadVisiblePixels();
  render();
  alert(`Удалено пикселей: ${markers.length}`);
});

// ---------------- Очистка карты ----------------
clearAllPixelsBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser || auth.currentUser.email!=="logo100153@gmail.com") return alert("Только админ!");
  const snapshot = await getDocs(collection(db,"pixels"));
  snapshot.forEach(doc=>deleteDoc(doc.ref));
  pixelsCache.clear();
  render();
});

// ---------------- Бан пользователя ----------------
banUserBtn.addEventListener('click', ()=>{
  if(!auth.currentUser) return alert("Только админ!");
  const userId = prompt("Введите UserID для бана:");
  if(!userId) return;
  alert("Бан пользователя не реализован в этом примере, нужно RTDB или Cloud Functions.");
});

// ---------------- Начальная загрузка ----------------
(async ()=>{
  await loadVisiblePixels();
  render();
})();
