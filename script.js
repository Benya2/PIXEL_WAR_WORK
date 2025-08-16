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

// отключаем сглаживание (чтобы не было мыла)
ctx.imageSmoothingEnabled = false;

const gridCellSize = 10;
game.width = 1200;
game.height = 600;

// ===== State =====
let currentColor = "#000000";
let canPlace = true;
const reloadTime = 5;

// ===== Colors =====
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

// ===== World map background =====
const worldMap = new Image();
worldMap.src = 'world.png';
const worldWidth = 20000;
const worldHeight = 20000;

// ===== Camera / Zoom / Pan =====
let camX = 0;
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

let hoverCellX = 0, hoverCellY = 0;
const pixelsCache = new Map();
let markers = [];

// ===== Tiles setup =====
const TILE_SIZE = 1000;
const SCALE_TILE = 2; // <<< во сколько раз увеличиваем тайлы
const tilesX = Math.ceil(worldWidth / TILE_SIZE);
const tilesY = Math.ceil(worldHeight / TILE_SIZE);
const tiles = [];
const offscreenCanvas = document.createElement('canvas');
const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
offscreenCanvas.width = TILE_SIZE;
offscreenCanvas.height = TILE_SIZE;
offCtx.imageSmoothingEnabled = false;

worldMap.onload = () => {
  for (let tx = 0; tx < tilesX; tx++) {
    for (let ty = 0; ty < tilesY; ty++) {
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;
      const sw = Math.min(TILE_SIZE, worldWidth - sx);
      const sh = Math.min(TILE_SIZE, worldHeight - sy);

      offCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
      offCtx.drawImage(worldMap, sx, sy, sw, sh, 0, 0, sw, sh);

      const img = new Image();
      img.src = offscreenCanvas.toDataURL("image/png");
      tiles.push({ img, x: sx, y: sy, w: sw, h: sh });
    }
  }
  renderAll();
};

// ===== Grid + Draw =====
function renderAll() {
  ctx.imageSmoothingEnabled = false;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,game.width,game.height);
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);

  const viewLeft = camX;
  const viewTop = camY;
  const viewRight = camX + game.width / scale;
  const viewBottom = camY + game.height / scale;

  // draw tiles
  for (const tile of tiles) {
    if (tile.x + tile.w < viewLeft || tile.x > viewRight || tile.y + tile.h < viewTop || tile.y > viewBottom) continue;
    if (tile.img.complete && tile.img.naturalWidth) {
      ctx.drawImage(
        tile.img, 
        tile.x, tile.y, tile.w, tile.h,
        tile.x, tile.y, tile.w * SCALE_TILE, tile.h * SCALE_TILE
      );
    } else {
      ctx.fillStyle = '#eef6ff';
      ctx.fillRect(tile.x, tile.y, tile.w * SCALE_TILE, tile.h * SCALE_TILE);
    }
  }

  // сетка
  ctx.beginPath();
  ctx.strokeStyle = "#ccc";
  let startX = Math.floor(viewLeft / gridCellSize) * gridCellSize;
  for (let x = startX; x <= viewRight; x += gridCellSize) { ctx.moveTo(x, viewTop); ctx.lineTo(x, viewBottom); }
  let startY = Math.floor(viewTop / gridCellSize) * gridCellSize;
  for (let y = startY; y <= viewBottom; y += gridCellSize) { ctx.moveTo(viewLeft, y); ctx.lineTo(viewRight, y); }
  ctx.stroke();

  // pixels
  pixelsCache.forEach(d => {
    if (d.color !== "#FFFFFF") {
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, gridCellSize, gridCellSize);
    }
  });

  // markers
  ctx.fillStyle='rgba(255,0,0,0.5)';
  for(const [mx,my] of markers) ctx.fillRect(mx,my,gridCellSize,gridCellSize);

  // hover
  ctx.fillStyle='rgba(0,0,0,0.12)';
  ctx.fillRect(hoverCellX,hoverCellY,gridCellSize,gridCellSize);

  ctx.setTransform(1,0,0,1,0,0);
}

// ... (остальной код без изменений, Firestore, mouse, auth и т.д.)

// ===== Firestore subscription =====
onSnapshot(collection(db,"pixels"), snapshot=>{
  pixelsCache.clear();
  snapshot.forEach(docSnap=>{const d=docSnap.data(); pixelsCache.set(`${d.x}-${d.y}`, d);});
  renderAll();
});

// ===== Mouse handling =====
game.addEventListener('mousedown', e=>{
  if(e.button===1||e.button===2||e.shiftKey||e.ctrlKey||e.metaKey||e.altKey){
    isPanning=true; lastMouseX=e.clientX; lastMouseY=e.clientY; e.preventDefault();
  }
});
window.addEventListener('mouseup', ()=>{isPanning=false;});
game.addEventListener('contextmenu', e=>e.preventDefault());
game.addEventListener('mousemove', e=>{
  if(isPanning){
    const dx=e.clientX-lastMouseX, dy=e.clientY-lastMouseY;
    camX-=dx/scale; camY-=dy/scale; lastMouseX=e.clientX; lastMouseY=e.clientY; renderAll();
  }
  const [wx,wy]=screenToWorld(e.clientX,e.clientY);
  [hoverCellX,hoverCellY]=snapToGrid(wx,wy);
  renderAll();
});
game.addEventListener('wheel', e=>{
  e.preventDefault();
  const zoomFactor=1.1;
  const [beforeX,beforeY]=screenToWorld(e.clientX,e.clientY);
  const dir=e.deltaY<0?1:-1;
  const newScale=clamp(scale*(dir>0?zoomFactor:1/zoomFactor),MIN_SCALE,MAX_SCALE);
  if(newScale===scale) return;
  scale=newScale;
  const rect=game.getBoundingClientRect();
  camX=beforeX-(e.clientX-rect.left)/scale;
  camY=beforeY-(e.clientY-rect.top)/scale;
  renderAll();
},{passive:false});

// ===== Drawing =====
async function placePixelWithHover() {
  if(!auth.currentUser) return alert("Login to draw!");
  if(!canPlace) return;
  canPlace=false;
  const x=hoverCellX, y=hoverCellY;
  const pixelRef=doc(db,"pixels",`${x}-${y}`);
  try{
    if(currentColor==="#FFFFFF") await deleteDoc(pixelRef);
    else await setDoc(pixelRef,{x,y,color:currentColor});
  }catch(err){console.error(err);}
  startReload();
}
game.addEventListener('click', e=>{if(isPanning||e.button!==0) return; placePixelWithHover();});
if(cursor) cursor.style.display='none';

// ===== Cooldown =====
function startReload(){
  let t=reloadTime;
  reloadTimerEl.innerText=`Reload: ${t} sec`;
  const interval=setInterval(()=>{
    t--;
    if(t<=0){
      clearInterval(interval);
      canPlace=true;
      reloadTimerEl.innerText="Ready!";
    } else reloadTimerEl.innerText=`Reload: ${t} sec`;
  },1000);
}

// ===== Auth button =====
authButton.addEventListener('click', async ()=>{
  if(auth.currentUser){await signOut(auth); return;}
  const action=prompt("Enter 1 to sign in, or 2 to create a new account:");
  if(!action|| (action!=="1" && action!=="2")) return;
  const email=prompt("Email:"), pass=prompt("Password:");
  if(!email||!pass) return;
  try{
    if(action==="1"){
      await signInWithEmailAndPassword(auth,email,pass);
      alert("Come in!");
    } else{
      await createUserWithEmailAndPassword(auth,email,pass);
      alert("Account created!");
    }
  }catch(e){alert(e.message);}
});

// ===== Auth state =====
onAuthStateChanged(auth,user=>{
  if(user){
    authButton.textContent="Log Out";
    adminPanel.style.display=(user.email==="logo100153@gmail.com")?"block":"none";
  }
  else{
    authButton.textContent="Log In";
    adminPanel.style.display="none";
  }
});

// ===== Admin: coords input + preview =====
function parseCoords(){
  markers=[];
  const value=coordsInput.value.trim();
  if(!value){renderAll(); return;}
  value.split(",").forEach(part=>{
    const [xCellStr,yCellStr,wCellStr,hCellStr]=part.trim().split(/\s+/);
    const xCell=parseInt(xCellStr), yCell=parseInt(yCellStr);
    const wCell=parseInt(wCellStr||'1'), hCell=parseInt(hCellStr||'1');
    if(isNaN(xCell)||isNaN(yCell)||isNaN(wCell)||isNaN(hCell)) return;
    const startX=xCell*gridCellSize, startY=yCell*gridCellSize;
    for(let dx=0; dx<wCell; dx++){
      for(let dy=0; dy<hCell; dy++){
        const px=startX+dx*gridCellSize, py=startY+dy*gridCellSize;
        if(px>=0&&py>=0&&px<=worldWidth-gridCellSize&&py<=worldHeight-gridCellSize) markers.push([px,py]);
      }
    }
  });
  renderAll();
}
coordsInput.addEventListener('input', parseCoords);

async function adminApplyPixels(mode){
  if(!auth.currentUser || auth.currentUser.email!=="logo100153@gmail.com") return alert("Только админ!");
  parseCoords();
  let count=0;
  for(const [x,y] of markers){
    const pixelRef=doc(db,"pixels",`${x}-${y}`);
    if(mode==='add'){await setDoc(pixelRef,{x,y,color:currentColor}); count++;}
    else{await deleteDoc(pixelRef); count++;}
  }
  alert(`${mode==='add'?'Добавлено':'Удалено'} пикселей: ${count}`);
}
addPixelBtn.addEventListener('click', ()=>adminApplyPixels('add'));
removePixelBtn.addEventListener('click', ()=>adminApplyPixels('remove'));

clearAllPixelsBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser) return alert("Только админ!");
  const snapshot=await getDocs(collection(db,"pixels"));
  snapshot.forEach(doc=>deleteDoc(doc.ref));
});

banUserBtn.addEventListener('click', ()=>{
  if(!auth.currentUser) return alert("Только админ!");
  const userId=prompt("Введите UserID для бана:");
  if(!userId) return;
  const userRef=ref(rtdb,'users/'+userId);
  remove(userRef).then(()=>alert("Пользователь забанен!")).catch(e=>console.error(e));
});

