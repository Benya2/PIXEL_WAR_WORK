import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Firebase
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

// Элементы
const colorsChoiceEl = document.getElementById('colorsChoice');
const game = document.getElementById('game');
const ctx = game.getContext('2d');
const cursor = document.getElementById('cursor');
const reloadTimerEl = document.getElementById('reloadTimer');
const adminPanel = document.getElementById('adminPanel');
const clearAllPixelsBtn = document.getElementById('clearAllPixels');
const banUserBtn = document.getElementById('banUser');
const authButton = document.getElementById('authButton');
const gridCellSize = 10;
game.width = 1200;
game.height = 600;

// Переменные
let currentColor = "#000000";
let canPlace = true;
const reloadTime = 5;

// Цвета
const colors = ["#FFFFFF","#B39DDB","#9FA8DA","#90CAF9","#81D4FA","#80DEEA","#4DB6AC","#66BB6A","#9CCC65","#CDDC39","#FFEB3B","#FFC107","#FF9800","#FF5722","#A1887F","#E0E0E0","#000000"];
colors.forEach(c=>{
  const div = document.createElement('div');
  div.style.backgroundColor = c;
  div.addEventListener('click', ()=>{
    currentColor = c;
    document.querySelectorAll('#colorsChoice div').forEach(el=>el.classList.remove('selected'));
    div.classList.add('selected');
  });
  colorsChoiceEl.appendChild(div);
});

// Сетка
function drawGrid() {
  ctx.clearRect(0,0,game.width,game.height);
  ctx.beginPath();
  ctx.strokeStyle = "#ccc";
  for(let i=0;i<=game.width;i+=gridCellSize){
    ctx.moveTo(i,0);
    ctx.lineTo(i,game.height);
  }
  for(let j=0;j<=game.height;j+=gridCellSize){
    ctx.moveTo(0,j);
    ctx.lineTo(game.width,j);
  }
  ctx.stroke();
}

// Подписка на пиксели
onSnapshot(collection(db,"pixels"), snapshot=>{
  drawGrid();
  snapshot.forEach(doc=>{
    const d = doc.data();
    if(d.color!=="#FFFFFF"){
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x,d.y,gridCellSize,gridCellSize);
    }
  });
});

// Курсор по клеткам
game.addEventListener('mousemove', e=>{
  const rect = game.getBoundingClientRect();
  let x = Math.floor((e.clientX - rect.left)/gridCellSize)*gridCellSize;
  let y = Math.floor((e.clientY - rect.top)/gridCellSize)*gridCellSize;

  // Ограничения
  if(x<0) x=0;
  if(y<0) y=0;
  if(x>game.width-gridCellSize) x=game.width-gridCellSize;
  if(y>game.height-gridCellSize) y=game.height-gridCellSize;

  cursor.style.left = x+"px";
  cursor.style.top = y+"px";
});

// Рисование пикселя
async function placePixel() {
  if(!auth.currentUser) return alert("Войдите чтобы рисовать!");
  if(!canPlace) return;
  canPlace = false;
  const x = parseInt(cursor.style.left);
  const y = parseInt(cursor.style.top);
  const pixelRef = doc(db,"pixels",`${x}-${y}`);
  try{
    if(currentColor==="#FFFFFF") await deleteDoc(pixelRef);
    else await setDoc(pixelRef,{x,y,color:currentColor});
  } catch(err){ console.error(err); }
  startReload();
}

// Кулдаун
function startReload(){
  let t = reloadTime;
  reloadTimerEl.innerText = `Перезарядка: ${t} сек`;
  const interval = setInterval(()=>{
    t--;
    if(t<=0){
      clearInterval(interval);
      canPlace = true;
      reloadTimerEl.innerText = "Готово!";
    } else reloadTimerEl.innerText = `Перезарядка: ${t} сек`;
  },1000);
}

game.addEventListener('click', placePixel);
cursor.addEventListener('click', placePixel);

// Авторизация
authButton.addEventListener('click', async ()=>{
  if(auth.currentUser){ await signOut(auth); return; }
  const email = prompt("Email:");
  const pass = prompt("Password:");
  if(!email||!pass) return;
  try{
    await signInWithEmailAndPassword(auth,email,pass);
    alert("Вошли!");
  }catch(e){
    if(e.code==="auth/user-not-found"){
      await createUserWithEmailAndPassword(auth,email,pass);
      alert("Аккаунт создан!");
    } else alert(e.message);
  }
});

onAuthStateChanged(auth,user=>{
  if(user){
    authButton.textContent="Log Out";
    adminPanel.style.display="block";
  } else {
    authButton.textContent="Log In";
    adminPanel.style.display="none";
  }
});

// Очистка карты
clearAllPixelsBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser) return alert("Только админ!");
  const snapshot = await getDocs(collection(db,"pixels"));
  snapshot.forEach(doc=>deleteDoc(doc.ref));
});

// Бан пользователя (по UserID)
banUserBtn.addEventListener('click', ()=>{
  if(!auth.currentUser) return alert("Только админ!");
  const userId = prompt("Введите UserID для бана:");
  if(!userId) return;
  const userRef = ref(rtdb,'users/'+userId);
  remove(userRef).then(()=>alert("Пользователь забанен!")).catch(e=>console.error(e));
});
