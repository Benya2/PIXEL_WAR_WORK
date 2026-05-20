// ===== Imports =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, remove, set, update, get, runTransaction, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// ===== Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyCwy4jVn9JIwXuIXVycYAv9EdPGPkgIJvA",
  authDomain: "pixellox.firebaseapp.com",
  databaseURL: "https://pixellox-default-rtdb.firebaseio.com",
  projectId: "pixellox",
  storageBucket: "pixellox.firebasestorage.app",
  messagingSenderId: "461991610382",
  appId: "1:461991610382:web:2a5ae293dde4a754c2d45f"
};
const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);
const auth = getAuth(app);
const registrationCode = "PIXEL2026";

// ===== DOM =====
const coordsDisplayEl = document.getElementById('coordsDisplay');
const colorsChoiceEl = document.getElementById('colorsChoice');
const paletteToggle = document.getElementById('paletteToggle');
const game = document.getElementById('game');
const ctx = game.getContext('2d');
const cursor = document.getElementById('cursor');
const reloadTimerEl = document.getElementById('reloadTimer');
const cooldownTimerEl = document.getElementById('cooldownTimer');
const pencilToggle = document.getElementById('pencilToggle');
const onlinePlayersEl = document.getElementById('onlinePlayers');
const adminPanel = document.getElementById('adminPanel');
const banUserBtn = document.getElementById('banUser');
const banUserInput = document.getElementById('banUserInput');
const banReasonInput = document.getElementById('banReasonInput');
const unbanUserBtn = document.getElementById('unbanUserBtn');
const adminPixelInfoBtn = document.getElementById('adminPixelInfoBtn');
const adminActivityBtn = document.getElementById('adminActivityBtn');
const pixelInfoPanel = document.getElementById('pixelInfoPanel');
const activityPanel = document.getElementById('activityPanel');
const activityCloseBtn = document.getElementById('activityCloseBtn');
const activityContent = document.getElementById('activityContent');
const myPlacementCountEl = document.getElementById('myPlacementCount');
const statsButton = document.getElementById('statsButton');
const statsPanel = document.getElementById('statsPanel');
const statsCloseBtn = document.getElementById('statsCloseBtn');
const statsContent = document.getElementById('statsContent');
const authButton = document.getElementById('authButton');
const authPanel = document.getElementById('authPanel');
const authCloseBtn = document.getElementById('authCloseBtn');
const authTabs = document.getElementById('authTabs');
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const registerForm = document.getElementById('registerForm');
const registerNickInput = document.getElementById('registerNick');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const registerCodeInput = document.getElementById('registerCode');
const profileForm = document.getElementById('profileForm');
const profileNickInput = document.getElementById('profileNick');
const profileEmailInput = document.getElementById('profileEmail');
const profilePasswordInput = document.getElementById('profilePassword');
const logoutButton = document.getElementById('logoutButton');
const authMessage = document.getElementById('authMessage');
const coordsInput = document.getElementById('coordsInput');
const addPixelBtn = document.getElementById('addPixelBtn');
const removePixelBtn = document.getElementById('removePixelBtn');

if (adminPanel) {
  const adminTitle = adminPanel.querySelector("h3");
  if (adminTitle) adminTitle.textContent = "Admin";
}


const teleportInput = document.getElementById('teleportInput');
const teleportBtn = document.getElementById('teleportBtn');

teleportBtn.addEventListener('click', () => {
  if (!auth.currentUser || auth.currentUser.email !== "logo100153@gmail.com") {
    return alert("Только админ!");
  }

  const value = teleportInput.value.trim();
  if (!value) return;

  const [xStr, yStr] = value.split(/\s+/);
  const xCell = parseInt(xStr), yCell = parseInt(yStr);

  if (Number.isNaN(xCell) || Number.isNaN(yCell)) {
    return alert("Введите корректные координаты X Y");
  }

  // переводим координаты в мировые (по сетке)
  const worldX = xCell * gridCellSize;
  const worldY = yCell * gridCellSize;

  // смещаем камеру так, чтобы указанная клетка была по центру
  camX = worldX - (game.width / 2) / scale;
  camY = worldY - (game.height / 2) / scale;

  saveCameraStateNow();
  renderAll();
});


// без сглаживания
ctx.imageSmoothingEnabled = false;

const gridCellSize = 10;
game.width = 1200;
game.height = 600;

// ===== State =====
let currentColor = "#000000";
let canPlace = true;
const pendingPixelWrites = new Set();
let isPencilActive = false;
let isShiftPressed = false;
let cooldownInterval = null;
const cooldownMaxMs = 60 * 1000;
const pixelCooldownCostMs = 400;
const cooldownFullBlockMs = 1000;
const cooldownTimerTickMs = 100;
let migrationStarted = false;
let isPixelInspectActive = false;
let lastInspectedPixelKey = "";
let inspectRequestId = 0;
let currentUserStatsUnsubscribe = null;
let currentUserDailyStatsUnsubscribe = null;
let currentBanUnsubscribers = [];
let currentUserProfileUnsubscribe = null;
let currentUserProfile = null;
const userProfileCache = new Map();
let drawingActivityUnsubscribe = null;
let drawingActivityRequestId = 0;
const drawingDeviceStorageKey = "pixel-war-device-id";
const currentDeviceId = getOrCreateDeviceId();
let drawingDeviceAllowed = false;
let drawingDeviceClaimPromise = null;
let drawingDeviceUnsubscribe = null;
let deviceCooldownKeyPromise = null;

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(drawingDeviceStorageKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(drawingDeviceStorageKey, deviceId);
  }
  return deviceId;
}

function getDeviceFingerprintSource() {
  return [
    screen.width,
    screen.height,
    screen.colorDepth,
    window.devicePixelRatio || 1,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    navigator.platform || "",
    navigator.language || "",
    Array.isArray(navigator.languages) ? navigator.languages.join(",") : "",
    navigator.hardwareConcurrency || "",
    navigator.maxTouchPoints || 0
  ].join("|");
}

async function sha256Hex(value) {
  if (!crypto.subtle) return safeKey(value).slice(0, 80);
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

function getDeviceCooldownKey() {
  if (!deviceCooldownKeyPromise) {
    deviceCooldownKeyPromise = sha256Hex(getDeviceFingerprintSource());
  }
  return deviceCooldownKeyPromise;
}

function watchDrawingDevice(user) {
  if (drawingDeviceUnsubscribe) drawingDeviceUnsubscribe();
  drawingDeviceUnsubscribe = null;
  drawingDeviceAllowed = false;
  if (!user) return;

  drawingDeviceUnsubscribe = onValue(ref(rtdb, `userProfiles/${user.uid}/drawingDevice`), snapshot => {
    const device = snapshot.val();
    drawingDeviceAllowed = !device || device.id === currentDeviceId;
  });
}

async function claimDrawingDevice(user, options = {}) {
  if (!user) return false;
  if (drawingDeviceAllowed) return true;
  if (drawingDeviceClaimPromise) return drawingDeviceClaimPromise;

  drawingDeviceClaimPromise = (async () => {
    const deviceRef = ref(rtdb, `userProfiles/${user.uid}/drawingDevice`);
    await runTransaction(deviceRef, current => {
      if (!current || current.id === currentDeviceId) {
        return {
          id: currentDeviceId,
          nick: getUserName(user),
          email: user.email || "",
          claimedAt: current?.claimedAt || Date.now(),
          lastSeen: Date.now()
        };
      }
      return current;
    });

    const snapshot = await get(deviceRef);
    const device = snapshot.val();
    drawingDeviceAllowed = !!device && device.id === currentDeviceId;
    if (!drawingDeviceAllowed && !options.silent) {
      alert("This account can draw only on its first device.");
    }
    return drawingDeviceAllowed;
  })();

  try {
    return await drawingDeviceClaimPromise;
  } finally {
    drawingDeviceClaimPromise = null;
  }
}

async function requireDrawingDevice(options = {}) {
  const user = auth.currentUser;
  if (!user) {
    if (!options.silent) alert("Login to draw!");
    return false;
  }
  return claimDrawingDevice(user, options);
}

function setPencilActive(active) {
  isPencilActive = active;
  if (pencilToggle) {
    pencilToggle.classList.toggle("active", isPencilActive);
    pencilToggle.setAttribute("aria-pressed", String(isPencilActive));
  }
}

if (pencilToggle) {
  pencilToggle.addEventListener("click", () => setPencilActive(!isPencilActive));
  pencilToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setPencilActive(!isPencilActive);
    }
  });
}

// ===== Colors (30 как в PixelPlanet) =====
function isTextInputTarget(target) {
  return target && (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

window.addEventListener("keydown", (e) => {
  if (e.key !== "Shift" || e.repeat || isShiftPressed || isTextInputTarget(e.target)) return;
  isShiftPressed = true;
  setPencilActive(!isPencilActive);
});

window.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.repeat || isTextInputTarget(e.target) || !isTemplateFollowActive) return;
  e.preventDefault();
  stopTemplateFollow();
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    isShiftPressed = false;
  }
});

window.addEventListener("blur", () => {
  isShiftPressed = false;
});

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
  div.addEventListener("click", () => selectCurrentColor(c));
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

// Итоговый "мировой" размер для рендера (масштабированный)
const SCALE_TILE = 100; // увеличение карты (поменяй 2/3/4 ...)
let WORLD_W = 20000 * SCALE_TILE;
let WORLD_H = 20000 * SCALE_TILE;

// ===== Camera / Zoom / Pan =====
let camX = 0;
let camY = 0;
let scale = 1;
const MIN_SCALE = 0.005;
const MAX_SCALE = 6;
const cameraStorageKey = "pixel-war-camera";
let cameraSaveTimeout = null;

let isPanning = false;
let lastMouseX = 0, lastMouseY = 0;
let touchMode = "";
let touchStartX = 0;
let touchStartY = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let touchMoved = false;
let lastPinchDistance = 0;
const touchPanThreshold = 8;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function loadCameraState() {
  const rawState = localStorage.getItem(cameraStorageKey);
  if (!rawState) return;

  try {
    const state = JSON.parse(rawState);
    const savedCamX = Number(state.camX);
    const savedCamY = Number(state.camY);
    const savedScale = Number(state.scale);
    if (Number.isFinite(savedCamX)) camX = savedCamX;
    if (Number.isFinite(savedCamY)) camY = savedCamY;
    if (Number.isFinite(savedScale)) scale = clamp(savedScale, MIN_SCALE, MAX_SCALE);
  } catch (err) {
    localStorage.removeItem(cameraStorageKey);
  }
}

function saveCameraState() {
  try {
    localStorage.setItem(cameraStorageKey, JSON.stringify({ camX, camY, scale }));
  } catch (err) {
    console.warn("Camera position could not be saved.");
  }
}

function scheduleCameraSave() {
  if (cameraSaveTimeout) clearTimeout(cameraSaveTimeout);
  cameraSaveTimeout = setTimeout(() => {
    cameraSaveTimeout = null;
    saveCameraState();
  }, 150);
}

function saveCameraStateNow() {
  if (cameraSaveTimeout) {
    clearTimeout(cameraSaveTimeout);
    cameraSaveTimeout = null;
  }
  saveCameraState();
}

loadCameraState();
window.addEventListener("beforeunload", saveCameraStateNow);

function screenToWorld(sx, sy) {
  const rect = game.getBoundingClientRect();
  const x = (sx - rect.left)/scale + camX;
  const y = (sy - rect.top)/scale + camY;
  return [x, y];
}

function getTouchCenter(touches) {
  const a = touches[0];
  const b = touches[1];
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2
  };
}

function getTouchDistance(touches) {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function zoomAtClientPoint(clientX, clientY, nextScale) {
  const [beforeX, beforeY] = screenToWorld(clientX, clientY);
  const rect = game.getBoundingClientRect();
  scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  camX = beforeX - (clientX - rect.left) / scale;
  camY = beforeY - (clientY - rect.top) / scale;
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

const colorNormalizeCtx = document.createElement('canvas').getContext('2d');

function cellKey(x, y) {
  return `${x}_${y}`;
}

function safeKey(value) {
  return String(value || "")
    .trim()
    .replace(/[.#$\[\]/]/g, "_")
    .slice(0, 180);
}

function todayKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kiev",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function formatDateTime(timestamp) {
  if (!timestamp) return "unknown";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

function normalizeNick(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

function getUserName(user = auth.currentUser) {
  if (!user) return "Guest";
  return currentUserProfile?.nick || user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8));
}

function getUserSummary(user = auth.currentUser) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email || "",
    nick: getUserName(user)
  };
}

async function saveUserProfile(user, fields = {}) {
  if (!user) return null;
  const previous = currentUserProfile && currentUserProfile.uid === user.uid ? currentUserProfile : {};
  const nick = normalizeNick(fields.nick || previous.nick || user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8)));
  const email = String(fields.email || user.email || previous.email || "").trim();
  const profile = {
    uid: user.uid,
    nick,
    email,
    updatedAt: Date.now()
  };
  await update(ref(rtdb, `userProfiles/${user.uid}`), profile);
  currentUserProfile = { ...previous, ...profile };
  userProfileCache.set(user.uid, { value: currentUserProfile, at: Date.now() });
  return currentUserProfile;
}

async function ensureUserProfile(user, preferredNick = "") {
  if (!user) return null;
  const snapshot = await get(ref(rtdb, `userProfiles/${user.uid}`));
  const existing = snapshot.val() || {};
  const nick = normalizeNick(preferredNick || existing.nick || user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8)));
  if (nick && user.displayName !== nick) {
    try {
      await updateProfile(user, { displayName: nick });
    } catch (err) {
      console.error(err);
    }
  }
  const profile = {
    uid: user.uid,
    nick,
    email: user.email || existing.email || "",
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  await update(ref(rtdb, `userProfiles/${user.uid}`), profile);
  currentUserProfile = profile;
  userProfileCache.set(user.uid, { value: profile, at: Date.now() });
  return profile;
}

async function updateStatsNick(user, nick) {
  if (!user || !nick) return;
  const day = todayKey();
  await update(ref(rtdb), {
    [`stats/users/${user.uid}/nick`]: nick,
    [`stats/daily/${day}/users/${user.uid}/nick`]: nick
  });
}

function watchCurrentUserProfile(user) {
  if (currentUserProfileUnsubscribe) currentUserProfileUnsubscribe();
  currentUserProfileUnsubscribe = null;
  currentUserProfile = null;

  if (!user) {
    renderAuthState(null);
    return;
  }

  currentUserProfileUnsubscribe = onValue(ref(rtdb, `userProfiles/${user.uid}`), snapshot => {
    currentUserProfile = snapshot.val() || null;
    if (currentUserProfile) {
      userProfileCache.set(user.uid, { value: currentUserProfile, at: Date.now() });
    }
    renderAuthState(user);
  });
}

async function getUserProfileByUid(uid) {
  if (!uid) return null;
  const cached = userProfileCache.get(uid);
  if (cached && Date.now() - cached.at < 60 * 1000) return cached.value;
  const snapshot = await get(ref(rtdb, `userProfiles/${uid}`));
  const profile = snapshot.val() || null;
  userProfileCache.set(uid, { value: profile, at: Date.now() });
  return profile;
}

async function incrementCounter(path) {
  await runTransaction(ref(rtdb, path), value => (Number(value) || 0) + 1);
}

async function recordPlacementStats(user, pixelKey, color) {
  const summary = getUserSummary(user);
  if (!summary) return;
  const day = todayKey();
  const baseUserPath = `stats/users/${summary.uid}`;
  const dailyUserPath = `stats/daily/${day}/users/${summary.uid}`;

  await Promise.all([
    incrementCounter(`${baseUserPath}/count`),
    incrementCounter(`${dailyUserPath}/count`),
    update(ref(rtdb, baseUserPath), {
      uid: summary.uid,
      nick: summary.nick,
      lastPixel: pixelKey,
      lastColor: color,
      lastAt: Date.now()
    }),
    update(ref(rtdb, dailyUserPath), {
      uid: summary.uid,
      nick: summary.nick,
      lastPixel: pixelKey,
      lastColor: color,
      lastAt: Date.now()
    })
  ]);
}

function pixelKeyToCellCoords(pixelKey) {
  const [xRaw, yRaw] = String(pixelKey || "").split("_");
  const x = Math.floor((Number(xRaw) || 0) / gridCellSize);
  const y = Math.floor((Number(yRaw) || 0) / gridCellSize);
  return { x, y };
}

async function activityRowsToHtml(data) {
  const rows = Object.values(data || {})
    .filter(row => row && row.uid)
    .sort((a, b) => Number(b.lastAt || 0) - Number(a.lastAt || 0))
    .slice(0, 30);

  if (!rows.length) return "<p>No activity yet.</p>";

  const renderedRows = await Promise.all(rows.map(async row => {
    let profile = null;
    try {
      profile = await getUserProfileByUid(row.uid);
    } catch (err) {
      console.error(err);
    }
    const coords = pixelKeyToCellCoords(row.lastPixel);
    return `<tr><td>${escapeHtml(profile?.nick || row.nick || row.uid || "unknown")}</td><td>${escapeHtml(profile?.email || "unknown")}</td><td>${coords.x} ${coords.y}</td><td>${escapeHtml(formatDateTime(row.lastAt))}</td></tr>`;
  }));

  return `<table class="activity-table"><thead><tr><th>Nick</th><th>Email</th><th>X Y</th><th>When</th></tr></thead><tbody>${renderedRows.join("")}</tbody></table>`;
}

function toggleDrawingActivityPanel(forceOpen) {
  if (!activityPanel || !activityContent || !adminActivityBtn) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !activityPanel.classList.contains("open");
  if (shouldOpen && !isAdminUser()) return alert("Only admin!");
  activityPanel.classList.toggle("open", shouldOpen);
  adminActivityBtn.classList.toggle("active", shouldOpen);

  if (!shouldOpen) {
    if (drawingActivityUnsubscribe) drawingActivityUnsubscribe();
    drawingActivityUnsubscribe = null;
    drawingActivityRequestId++;
    return;
  }

  activityContent.textContent = "Loading...";
  if (drawingActivityUnsubscribe) drawingActivityUnsubscribe();
  drawingActivityUnsubscribe = onValue(ref(rtdb, "stats/users"), async snapshot => {
    const requestId = ++drawingActivityRequestId;
    const html = await activityRowsToHtml(snapshot.val());
    if (requestId === drawingActivityRequestId && activityPanel.classList.contains("open")) {
      activityContent.innerHTML = html;
    }
  }, err => {
    console.error(err);
    activityContent.textContent = "Failed to load activity.";
  });
}

async function migrateOldFirestorePixels() {
  if (migrationStarted) return;
  migrationStarted = true;
  if (!confirm("Copy old Firestore pixels to Realtime Database?")) return;

  try {
    const { getFirestore, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js");
    const oldDb = getFirestore(app);
    const snapshot = await getDocs(collection(oldDb, "pixels"));
    const updates = {};

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const x = Number(d.x);
      const y = Number(d.y);
      const color = d.color;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !color) return;
      updates[cellKey(x, y)] = { x, y, color };
    });

    await update(ref(rtdb, "pixels"), updates);
    alert(`Migrated pixels: ${Object.keys(updates).length}`);
  } catch (err) {
    migrationStarted = false;
    console.error(err);
    alert("Migration failed. If Firestore quota is exceeded, try again after quota reset.");
  }
}

function normalizeColor(color) {
  colorNormalizeCtx.fillStyle = '#ffffff';
  colorNormalizeCtx.fillStyle = color || '#ffffff';
  return colorNormalizeCtx.fillStyle.toLowerCase();
}

function isWhiteColor(color) {
  return normalizeColor(color) === '#ffffff';
}

function colorToRgb(color) {
  const hex = normalizeColor(color);
  if (!/^#[0-9a-f]{6}$/.test(hex)) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

const paletteColorEntries = colors.map(color => ({
  color,
  ...colorToRgb(color)
}));

function getNearestPaletteColor(r, g, b) {
  let best = paletteColorEntries[0];
  let bestDistance = Infinity;

  for (const entry of paletteColorEntries) {
    const dr = r - entry.r;
    const dg = g - entry.g;
    const db = b - entry.b;
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }

  return best;
}

function selectCurrentColor(color) {
  currentColor = color;
  const selected = normalizeColor(color);
  document.querySelectorAll("#colorsChoice div").forEach(el => {
    el.classList.toggle("selected", normalizeColor(el.style.backgroundColor) === selected);
  });
}


function updateCoordsDisplay() {
  if (!coordsDisplayEl) return;
  const cellX = Math.floor(hoverCellX / gridCellSize);
  const cellY = Math.floor(hoverCellY / gridCellSize);
  coordsDisplayEl.textContent = `X: ${cellX}  Y: ${cellY}`;
}


// ===== Tiles setup (режем большую карту на тайлы) =====
const TILE_SIZE = 1000;
let tiles = [];

const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = TILE_SIZE;
offscreenCanvas.height = TILE_SIZE;
const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
offCtx.imageSmoothingEnabled = false;

worldMap.onload = () => {
  // реальные размеры исходной картинки
  const imgW = worldMap.naturalWidth || 20000;
  const imgH = worldMap.naturalHeight || 20000;

  // итоговые размеры мира (после увеличения)
  WORLD_W = imgW * SCALE_TILE;
  WORLD_H = imgH * SCALE_TILE;

  const tilesX = Math.ceil(imgW / TILE_SIZE);
  const tilesY = Math.ceil(imgH / TILE_SIZE);

  tiles = [];
  for (let tx = 0; tx < tilesX; tx++) {
    for (let ty = 0; ty < tilesY; ty++) {
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;
      const sw = Math.min(TILE_SIZE, imgW - sx);
      const sh = Math.min(TILE_SIZE, imgH - sy);

      offCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
      offCtx.drawImage(worldMap, sx, sy, sw, sh, 0, 0, sw, sh);

      const img = new Image();
      img.src = offscreenCanvas.toDataURL("image/png");

      // координаты назначения с учётом увеличения
      const dx = sx * SCALE_TILE;
      const dy = sy * SCALE_TILE;
      const dw = sw * SCALE_TILE;
      const dh = sh * SCALE_TILE;

      tiles.push({ img, dx, dy, dw, dh });
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

  // тайлы (только видимые)
  for (const t of tiles) {
    if (t.dx + t.dw < viewLeft || t.dx > viewRight || t.dy + t.dh < viewTop || t.dy > viewBottom) continue;
    if (t.img.complete && t.img.naturalWidth) {
      ctx.drawImage(t.img, t.dx, t.dy, t.dw, t.dh);
    } else {
      ctx.fillStyle = '#eef6ff';
      ctx.fillRect(t.dx, t.dy, t.dw, t.dh);
    }
  }

  // сетка
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
    if (!isWhiteColor(d.color)) {
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, gridCellSize, gridCellSize);
    }
  });

  // маркеры
  ctx.fillStyle='rgba(255,0,0,0.5)';
  for (const [mx,my] of markers) {
    ctx.fillRect(mx, my, gridCellSize, gridCellSize);
  }

  // hover
  ctx.fillStyle='rgba(0,0,0,0.12)';
  ctx.fillRect(hoverCellX, hoverCellY, gridCellSize, gridCellSize);

  ctx.setTransform(1,0,0,1,0,0);
}

// ===== Realtime Database pixels =====
onValue(ref(rtdb, "pixels"), snapshot => {
  pixelsCache.clear();
  const data = snapshot.val() || {};
  Object.values(data).forEach(d => {
    if (!d) return;
    const x = Number(d.x);
    const y = Number(d.y);
    const color = d.color;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !color) return;
    pixelsCache.set(cellKey(x, y), { x, y, color });
  });
  renderAll();
}, err => {
  console.error(err);
});

function updateHoverFromPoint(clientX, clientY) {
  const [wx, wy] = screenToWorld(clientX, clientY);
  [hoverCellX, hoverCellY] = snapToGrid(wx, wy);
  updateCoordsDisplay();
  updateTemplateFollowPosition();
  updatePixelInfoPanel();
  renderAll();
}

function tryPencilPlace() {
  if (!isPencilActive || isPanning || !auth.currentUser) return;
  placePixelWithHover({ silentAuth: true });
}

async function updatePixelInfoPanel() {
  if (!isPixelInspectActive || !pixelInfoPanel) return;
  const key = cellKey(hoverCellX, hoverCellY);
  if (key === lastInspectedPixelKey) return;
  lastInspectedPixelKey = key;
  const requestId = ++inspectRequestId;
  const cellX = Math.floor(hoverCellX / gridCellSize);
  const cellY = Math.floor(hoverCellY / gridCellSize);
  pixelInfoPanel.classList.add("open");
  pixelInfoPanel.innerHTML = `<strong>Pixel ${cellX}, ${cellY}</strong><br>Loading...`;

  try {
    const [pixelSnapshot, infoSnapshot] = await Promise.all([
      get(ref(rtdb, `pixels/${key}`)),
      get(ref(rtdb, `pixelInfo/${key}`))
    ]);
    if (requestId !== inspectRequestId) return;
    const pixel = pixelSnapshot.val();
    const info = infoSnapshot.val();

    if (!pixel) {
      pixelInfoPanel.innerHTML = `<strong>Pixel ${cellX}, ${cellY}</strong><br>Empty`;
      return;
    }

    const profile = info?.uid ? await getUserProfileByUid(info.uid) : null;
    if (requestId !== inspectRequestId) return;
    const nick = profile?.nick || info?.nick || "unknown";
    const email = profile?.email || info?.email || "unknown";

    pixelInfoPanel.innerHTML = `
      <strong>Pixel ${cellX}, ${cellY}</strong><br>
      Color: ${escapeHtml(pixel.color || info?.color || "unknown")}<br>
      Nick: ${escapeHtml(nick)}<br>
      Email: ${escapeHtml(email)}<br>
      Time: ${escapeHtml(formatDateTime(info?.placedAt))}<br>
      UID: ${escapeHtml(info?.uid || "unknown")}
    `;
  } catch (err) {
    console.error(err);
    if (requestId === inspectRequestId) {
      pixelInfoPanel.innerHTML = `<strong>Pixel ${cellX}, ${cellY}</strong><br>Failed to load.`;
    }
  }
}

if (adminPixelInfoBtn) {
  adminPixelInfoBtn.addEventListener("click", () => {
    isPixelInspectActive = !isPixelInspectActive;
    adminPixelInfoBtn.classList.toggle("active", isPixelInspectActive);
    if (!isPixelInspectActive) {
      lastInspectedPixelKey = "";
      if (pixelInfoPanel) pixelInfoPanel.classList.remove("open");
    } else {
      updatePixelInfoPanel();
    }
  });
}

if (adminActivityBtn) {
  adminActivityBtn.addEventListener("click", () => toggleDrawingActivityPanel());
}

if (activityCloseBtn) {
  activityCloseBtn.addEventListener("click", () => toggleDrawingActivityPanel(false));
}

// ===== Mouse handling =====
game.addEventListener('mousedown', (e)=>{
  if (e.button === 1 || e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
    isPanning = true; lastMouseX = e.clientX; lastMouseY = e.clientY;
    e.preventDefault();
  }
});
window.addEventListener('mouseup', ()=>{
  if (isPanning) saveCameraStateNow();
  isPanning = false;
});
game.addEventListener('contextmenu', (e)=> e.preventDefault());

game.addEventListener('mousemove', (e)=>{
  if (isPanning) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    camX -= dx / scale;
    camY -= dy / scale;
    lastMouseX = e.clientX; lastMouseY = e.clientY;
    scheduleCameraSave();
    renderAll();
  }
  updateHoverFromPoint(e.clientX, e.clientY);
  tryPencilPlace();
});

game.addEventListener('touchstart', (e)=>{
  e.preventDefault();

  if (e.touches.length === 2) {
    touchMode = "pinch";
    lastPinchDistance = getTouchDistance(e.touches);
    const center = getTouchCenter(e.touches);
    updateHoverFromPoint(center.x, center.y);
    return;
  }

  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  touchMode = isPencilActive ? "draw" : "pan";
  touchStartX = lastTouchX = touch.clientX;
  touchStartY = lastTouchY = touch.clientY;
  touchMoved = false;
  updateHoverFromPoint(touch.clientX, touch.clientY);

  if (touchMode === "draw") {
    if (stopTemplateFollow()) return;
    tryPencilPlace();
  }
}, { passive: false });

game.addEventListener('touchmove', (e)=>{
  e.preventDefault();

  if (e.touches.length === 2) {
    touchMode = "pinch";
    const distance = getTouchDistance(e.touches);
    const center = getTouchCenter(e.touches);
    if (lastPinchDistance > 0 && distance > 0) {
      zoomAtClientPoint(center.x, center.y, scale * (distance / lastPinchDistance));
      lastPinchDistance = distance;
      scheduleCameraSave();
      updateHoverFromPoint(center.x, center.y);
      renderAll();
    }
    return;
  }

  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  const totalDx = touch.clientX - touchStartX;
  const totalDy = touch.clientY - touchStartY;
  if (Math.hypot(totalDx, totalDy) > touchPanThreshold) {
    touchMoved = true;
  }

  if (touchMode === "draw") {
    updateHoverFromPoint(touch.clientX, touch.clientY);
    tryPencilPlace();
    return;
  }

  const dx = touch.clientX - lastTouchX;
  const dy = touch.clientY - lastTouchY;
  camX -= dx / scale;
  camY -= dy / scale;
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
  scheduleCameraSave();
  updateHoverFromPoint(touch.clientX, touch.clientY);
  renderAll();
}, { passive: false });

game.addEventListener('touchend', (e)=>{
  e.preventDefault();

  if (e.touches.length === 1) {
    const touch = e.touches[0];
    touchMode = isPencilActive ? "draw" : "pan";
    touchStartX = lastTouchX = touch.clientX;
    touchStartY = lastTouchY = touch.clientY;
    touchMoved = false;
    lastPinchDistance = 0;
    updateHoverFromPoint(touch.clientX, touch.clientY);
    return;
  }

  if (touchMode === "pan" && !touchMoved) {
    updateHoverFromPoint(touchStartX, touchStartY);
    if (!stopTemplateFollow()) {
      placePixelWithHover();
    }
  }

  if (touchMode === "pan" || touchMode === "pinch") {
    saveCameraStateNow();
  }

  touchMode = "";
  touchMoved = false;
  lastPinchDistance = 0;
}, { passive: false });

game.addEventListener('touchcancel', (e)=>{
  e.preventDefault();
  if (touchMode === "pan" || touchMode === "pinch") saveCameraStateNow();
  touchMode = "";
  touchMoved = false;
  lastPinchDistance = 0;
}, { passive: false });

game.addEventListener('wheel', (e)=>{
  e.preventDefault();
  const zoomFactor = 1.1;
  const dir = e.deltaY < 0 ? 1 : -1;
  const newScale = clamp(scale * (dir > 0 ? zoomFactor : 1/zoomFactor), MIN_SCALE, MAX_SCALE);
  if (newScale === scale) return;
  zoomAtClientPoint(e.clientX, e.clientY, newScale);

  scheduleCameraSave();
  updateHoverFromPoint(e.clientX, e.clientY);
}, { passive: false });

// ===== Drawing =====
async function placePixelWithHover(options = {}) {
  const user = auth.currentUser;
  if (!user) {
    if (!options.silentAuth) alert("Login to draw!");
    return false;
  }

  const x = hoverCellX;
  const y = hoverCellY;
  const pixelKey = cellKey(x, y);
  if (pendingPixelWrites.has(pixelKey)) return false;
  const placedPixel = pixelsCache.get(pixelKey);
  const previousPixel = placedPixel ? {...placedPixel} : null;
  let selectedColor = currentColor;
  if (isTemplateAutoColorActive) {
    selectedColor = getTemplateColorForWorldCell(x, y);
    if (!selectedColor) return false;
    selectCurrentColor(selectedColor);
  }
  const selectedWhite = isWhiteColor(selectedColor);
  if (placedPixel && normalizeColor(placedPixel.color) === normalizeColor(selectedColor)) return false;
  if (!placedPixel && selectedWhite) return false;
  if (!isCooldownReady()) return false;
  if (!drawingDeviceAllowed && !await claimDrawingDevice(user, { silent: options.silentAuth })) return false;
  if (!tryStartCooldown()) return false;
  pendingPixelWrites.add(pixelKey);
  if (selectedWhite) {
    pixelsCache.delete(pixelKey);
  } else {
    pixelsCache.set(pixelKey,{x,y,color:selectedColor});
  }
  renderAll();

  try {
    if (selectedWhite) {
      await update(ref(rtdb), {
        [`pixels/${pixelKey}`]: null,
        [`pixelInfo/${pixelKey}`]: null
      });
    } else {
      const userSummary = getUserSummary();
      const placedAt = Date.now();
      await update(ref(rtdb), {
        [`pixels/${pixelKey}`]: { x, y, color: selectedColor },
        [`pixelInfo/${pixelKey}`]: {
          x,
          y,
          color: selectedColor,
          placedAt,
          uid: userSummary.uid,
          email: userSummary.email,
          nick: userSummary.nick
        }
      });
      recordPlacementStats(auth.currentUser, pixelKey, selectedColor).catch(console.error);
    }
    return true;
  } catch(err){
    if (previousPixel) pixelsCache.set(pixelKey, previousPixel);
    else pixelsCache.delete(pixelKey);
    saveCooldownState(getCooldownMs() - pixelCooldownCostMs);
    runCooldownTimer();
    renderAll();
    console.error(err);
    return false;
  } finally {
    pendingPixelWrites.delete(pixelKey);
  }
}

game.addEventListener('click', (e)=>{
  if (isPanning || e.button !== 0) return;
  if (stopTemplateFollow()) {
    e.preventDefault();
    return;
  }
  placePixelWithHover();
});

if (cursor) cursor.style.display = 'none';

// ===== Cooldown =====
function formatCooldown(ms) {
  if (isCooldownFull(ms)) return "1:00";
  const seconds = ms > 0 ? Math.ceil(ms / 10) / 100 : 0;
  return seconds.toFixed(2);
}

function isCooldownFull(cooldownMs = getCooldownMs()) {
  return cooldownMs >= cooldownMaxMs - cooldownFullBlockMs;
}

function getCooldownStorageKey() {
  return `pixel-war-cooldown-stack:device:${currentDeviceId}`;
}

function getCooldownState() {
  const now = Date.now();
  const fallbackState = { cooldownMs: 0, updatedAt: now };
  const rawState = localStorage.getItem(getCooldownStorageKey());
  if (!rawState) return fallbackState;

  try {
    const state = JSON.parse(rawState);
    const cooldownMs = Number(state.cooldownMs);
    const updatedAt = Number(state.updatedAt);
    if (Number.isFinite(cooldownMs) && Number.isFinite(updatedAt)) {
      return {
        cooldownMs: clamp(cooldownMs - (now - updatedAt), 0, cooldownMaxMs),
        updatedAt: now
      };
    }
  } catch (err) {
    return fallbackState;
  }

  return fallbackState;
}

function getCooldownMsFromRemoteState(state) {
  const now = Date.now();
  if (!state) return 0;
  const cooldownMs = Number(state.cooldownMs);
  const updatedAt = Number(state.updatedAt);
  if (!Number.isFinite(cooldownMs) || !Number.isFinite(updatedAt)) return 0;
  return clamp(cooldownMs - (now - updatedAt), 0, cooldownMaxMs);
}

function saveCooldownState(cooldownMs) {
  localStorage.setItem(getCooldownStorageKey(), JSON.stringify({
    cooldownMs: clamp(cooldownMs, 0, cooldownMaxMs),
    updatedAt: Date.now()
  }));
}

function getCooldownMs() {
  return getCooldownState().cooldownMs;
}

function updateCooldownDisplay(cooldownMs = getCooldownMs()) {
  canPlace = !isCooldownFull(cooldownMs);
  const cooldownText = formatCooldown(cooldownMs);
  if (reloadTimerEl) {
    reloadTimerEl.innerText = `Cooldown: ${cooldownText} / 1:00`;
  }
  if (cooldownTimerEl) {
    cooldownTimerEl.innerText = cooldownText;
  }
}

function runCooldownTimer() {
  if (cooldownInterval) clearInterval(cooldownInterval);
  updateCooldownDisplay();
  if (getCooldownMs() <= 0) return;

  cooldownInterval = setInterval(() => {
    updateCooldownDisplay();
    if (getCooldownMs() <= 0) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
  }, cooldownTimerTickMs);
}

function isCooldownReady() {
  const cooldownMs = getCooldownMs();
  updateCooldownDisplay(cooldownMs);
  return !isCooldownFull(cooldownMs);
}

window.addEventListener("storage", (event) => {
  if (event.key === getCooldownStorageKey()) {
    runCooldownTimer();
  }
});

function startReload(){
  saveCooldownState(getCooldownMs() + pixelCooldownCostMs);
  runCooldownTimer();
}

function tryStartCooldown() {
  if (!isCooldownReady()) return false;
  startReload();
  return true;
}

runCooldownTimer();

function updatePlacementCorner(todayCount = 0, totalCount = 0) {
  if (!myPlacementCountEl) return;
  myPlacementCountEl.textContent = `Pixels: ${todayCount} today / ${totalCount} total`;
}

function watchCurrentUserStats(user) {
  if (currentUserStatsUnsubscribe) currentUserStatsUnsubscribe();
  if (currentUserDailyStatsUnsubscribe) currentUserDailyStatsUnsubscribe();
  currentUserStatsUnsubscribe = null;
  currentUserDailyStatsUnsubscribe = null;

  if (!user) {
    updatePlacementCorner(0, 0);
    return;
  }

  let total = 0;
  let today = 0;
  const render = () => updatePlacementCorner(today, total);
  currentUserStatsUnsubscribe = onValue(ref(rtdb, `stats/users/${user.uid}/count`), snapshot => {
    total = Number(snapshot.val()) || 0;
    render();
  });
  currentUserDailyStatsUnsubscribe = onValue(ref(rtdb, `stats/daily/${todayKey()}/users/${user.uid}/count`), snapshot => {
    today = Number(snapshot.val()) || 0;
    render();
  });
}

function statsRowsToHtml(data) {
  const rows = Object.values(data || {})
    .filter(row => row && Number(row.count) > 0)
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
    .slice(0, 20);

  if (!rows.length) return "<p>No pixels yet.</p>";

  return `<table class="stats-table"><thead><tr><th>Nick</th><th>Pixels</th><th>Last</th></tr></thead><tbody>${
    rows.map(row => `<tr><td>${escapeHtml(row.nick || row.uid || "unknown")}</td><td>${Number(row.count) || 0}</td><td>${escapeHtml(formatDateTime(row.lastAt))}</td></tr>`).join("")
  }</tbody></table>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function showStatsPanel() {
  if (!statsPanel || !statsContent) return;
  statsPanel.classList.add("open");
  statsContent.textContent = "Loading...";

  try {
    const day = todayKey();
    const [todaySnapshot, totalSnapshot] = await Promise.all([
      get(ref(rtdb, `stats/daily/${day}/users`)),
      get(ref(rtdb, "stats/users"))
    ]);
    statsContent.innerHTML = `
      <h4>Today (${escapeHtml(day)})</h4>
      ${statsRowsToHtml(todaySnapshot.val())}
      <h4>All time</h4>
      ${statsRowsToHtml(totalSnapshot.val())}
    `;
  } catch (err) {
    console.error(err);
    statsContent.textContent = "Failed to load stats.";
  }
}

if (statsButton) statsButton.addEventListener("click", showStatsPanel);
if (statsCloseBtn) statsCloseBtn.addEventListener("click", () => statsPanel.classList.remove("open"));

// ===== Auth panel =====
let authMode = "login";

function setAuthMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message || "";
  authMessage.style.color = isError ? "#b00020" : "#444";
}

function setAuthMode(mode) {
  authMode = mode;
  const user = auth.currentUser;
  const isProfile = mode === "profile" && !!user;

  showLoginBtn?.classList.toggle("active", mode === "login");
  showRegisterBtn?.classList.toggle("active", mode === "register");
  loginForm?.classList.toggle("active", mode === "login" && !user);
  registerForm?.classList.toggle("active", mode === "register" && !user);
  profileForm?.classList.toggle("active", isProfile);

  if (authTabs) authTabs.style.display = user ? "none" : "grid";
  logoutButton?.classList.toggle("visible", !!user);
  if (user && profileNickInput && profileEmailInput) {
    profileNickInput.value = getUserName(user);
    profileEmailInput.value = user.email || currentUserProfile?.email || "";
    if (profilePasswordInput) profilePasswordInput.value = "";
  }
}

function renderAuthState(user) {
  if (!authButton) return;
  if (user) {
    authButton.textContent = getUserName(user);
    setAuthMode("profile");
  } else {
    authButton.textContent = "Log In / Register";
    setAuthMode(authMode === "register" ? "register" : "login");
  }
}

if (authButton) {
  authButton.addEventListener("click", () => {
    authPanel?.classList.toggle("open");
    setAuthMode(auth.currentUser ? "profile" : authMode);
    setAuthMessage("");
  });
}

if (authCloseBtn) {
  authCloseBtn.addEventListener("click", () => authPanel?.classList.remove("open"));
}
if (showLoginBtn) showLoginBtn.addEventListener("click", () => setAuthMode("login"));
if (showRegisterBtn) showRegisterBtn.addEventListener("click", () => setAuthMode("register"));
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    setAuthMessage("Logged out.");
    setAuthMode("login");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAuthMessage("Logging in...");
    try {
      await signInWithEmailAndPassword(auth, loginEmailInput.value.trim(), loginPasswordInput.value);
      loginPasswordInput.value = "";
      setAuthMessage("Logged in.");
      authPanel?.classList.remove("open");
    } catch (err) {
      setAuthMessage(err.message, true);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nick = normalizeNick(registerNickInput.value);
    if (!nick) return setAuthMessage("Enter a nick.", true);
    if ((registerCodeInput?.value || "").trim() !== registrationCode) {
      return setAuthMessage("Wrong registration code.", true);
    }
    setAuthMessage("Creating account...");
    try {
      const credential = await createUserWithEmailAndPassword(auth, registerEmailInput.value.trim(), registerPasswordInput.value);
      await updateProfile(credential.user, { displayName: nick });
      await ensureUserProfile(credential.user, nick);
      await updateStatsNick(credential.user, nick);
      registerPasswordInput.value = "";
      if (registerCodeInput) registerCodeInput.value = "";
      setAuthMessage("Account created. You can draw now.");
      setAuthMode("profile");
    } catch (err) {
      setAuthMessage(err.message, true);
    }
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return setAuthMessage("Login first.", true);

    const nick = normalizeNick(profileNickInput.value);
    const nextEmail = profileEmailInput.value.trim();
    const currentEmail = user.email || "";
    if (!nick) return setAuthMessage("Enter a nick.", true);
    if (!nextEmail) return setAuthMessage("Enter an email.", true);

    setAuthMessage("Saving...");
    try {
      if (user.displayName !== nick) {
        await updateProfile(user, { displayName: nick });
      }

      if (nextEmail !== currentEmail) {
        if (!profilePasswordInput.value) {
          throw new Error("Enter your current password to change email.");
        }
        const credential = EmailAuthProvider.credential(currentEmail, profilePasswordInput.value);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, nextEmail);
      }

      await saveUserProfile(auth.currentUser || user, { nick, email: nextEmail });
      await updateStatsNick(auth.currentUser || user, nick);
      profilePasswordInput.value = "";
      renderAuthState(auth.currentUser || user);
      trackOnlinePlayer(auth.currentUser || user);
      watchCurrentUserBan(auth.currentUser || user);
      setAuthMessage("Profile saved.");
    } catch (err) {
      setAuthMessage(err.message, true);
    }
  });
}

// ===== Auth state (admin panel) =====
onAuthStateChanged(auth, async user => {
  if (user) {
    await ensureUserProfile(user);
    watchCurrentUserProfile(user);
    watchDrawingDevice(user);
    claimDrawingDevice(user, { silent: true }).catch(console.error);
    trackOnlinePlayer(user);
    if (isAdminUser(user)) {
      adminPanel.style.display = "block";
      if (new URLSearchParams(location.search).has("migratePixels")) {
        migrateOldFirestorePixels();
      }
    } else {
      adminPanel.style.display = "none";
      toggleDrawingActivityPanel(false);
    }
  } else {
    watchCurrentUserProfile(null);
    watchDrawingDevice(null);
    adminPanel.style.display = "none";
    toggleDrawingActivityPanel(false);
  }
  renderAuthState(user);
  watchCurrentUserStats(user);
  watchSavedTemplates(user);
  watchCurrentUserBan(user);
  runCooldownTimer();
});

// ===== Admin: coords input + preview =====
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
        if (px >= 0 && py >= 0 && px <= WORLD_W - gridCellSize && py <= WORLD_H - gridCellSize) {
          markers.push([px, py]);
        }
      }
    }
  });
  renderAll();
}


// ===== Mobile buttons for camera & zoom =====
const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");

const moveSpeed = 50; // пикселей за нажатие
const zoomFactorBtn = 1.2;

function moveCamera(dx, dy){
  camX += dx / scale;
  camY += dy / scale;
  saveCameraStateNow();
  renderAll();
}

upBtn.addEventListener('click', ()=> moveCamera(0, -moveSpeed));
downBtn.addEventListener('click', ()=> moveCamera(0, moveSpeed));
leftBtn.addEventListener('click', ()=> moveCamera(-moveSpeed, 0));
rightBtn.addEventListener('click', ()=> moveCamera(moveSpeed, 0));

zoomInBtn.addEventListener('click', ()=>{
  const newScale = clamp(scale * zoomFactorBtn, MIN_SCALE, MAX_SCALE);
  scale = newScale;
  saveCameraStateNow();
  renderAll();
});
zoomOutBtn.addEventListener('click', ()=>{
  const newScale = clamp(scale / zoomFactorBtn, MIN_SCALE, MAX_SCALE);
  scale = newScale;
  saveCameraStateNow();
  renderAll();
});



coordsInput.addEventListener('input', parseCoords);

async function adminApplyPixels(mode) {
  if (!auth.currentUser || auth.currentUser.email !== "logo100153@gmail.com") {
    return alert("Только админ!");
  }
  parseCoords();
  let count = 0;
  for (const [x,y] of markers) {
    const key = cellKey(x, y);
    if (mode === 'add') {
      const userSummary = getUserSummary();
      const placedAt = Date.now();
      await update(ref(rtdb), {
        [`pixels/${key}`]: { x, y, color: currentColor },
        [`pixelInfo/${key}`]: {
          x,
          y,
          color: currentColor,
          placedAt,
          uid: userSummary.uid,
          email: userSummary.email,
          nick: userSummary.nick
        }
      });
      recordPlacementStats(auth.currentUser, key, currentColor).catch(console.error);
      count++;
    } else {
      await update(ref(rtdb), {
        [`pixels/${key}`]: null,
        [`pixelInfo/${key}`]: null
      });
      count++;
    }
  }
  alert(`${mode==='add'?'Добавлено':'Удалено'} пикселей: ${count}`);
}

addPixelBtn.addEventListener('click', ()=>adminApplyPixels('add'));
removePixelBtn.addEventListener('click', ()=>adminApplyPixels('remove'));


// Функция для отслеживания онлайн игроков
function isAdminUser(user = auth.currentUser) {
  return !!user && user.email === "logo100153@gmail.com";
}

function getBanPaths(target) {
  const value = String(target || "").trim();
  if (!value) return [];
  if (value.includes("@")) return [`bansByEmail/${safeKey(value.toLowerCase())}`];
  return [`bans/${safeKey(value)}`];
}

async function checkCurrentUserBan(user) {
  if (!user || isAdminUser(user)) return;
  const checks = [get(ref(rtdb, `bans/${safeKey(user.uid)}`))];
  if (user.email) checks.push(get(ref(rtdb, `bansByEmail/${safeKey(user.email.toLowerCase())}`)));

  try {
    const snapshots = await Promise.all(checks);
    const ban = snapshots.map(snapshot => snapshot.val()).find(Boolean);
    if (ban) {
      alert(`You are banned${ban.reason ? `: ${ban.reason}` : "."}`);
      await signOut(auth);
    }
  } catch (err) {
    console.error(err);
  }
}

function watchCurrentUserBan(user) {
  currentBanUnsubscribers.forEach(unsubscribe => unsubscribe());
  currentBanUnsubscribers = [];
  if (!user || isAdminUser(user)) return;

  const handleBanSnapshot = async (snapshot) => {
    const ban = snapshot.val();
    if (!ban || !auth.currentUser || auth.currentUser.uid !== user.uid) return;
    alert(`You are banned${ban.reason ? `: ${ban.reason}` : "."}`);
    await signOut(auth);
  };

  currentBanUnsubscribers.push(onValue(ref(rtdb, `bans/${safeKey(user.uid)}`), handleBanSnapshot));
  if (user.email) {
    currentBanUnsubscribers.push(onValue(ref(rtdb, `bansByEmail/${safeKey(user.email.toLowerCase())}`), handleBanSnapshot));
  }
}

async function setBanState(shouldBan) {
  if (!isAdminUser()) return alert("Only admin!");
  const target = (banUserInput && banUserInput.value.trim()) || prompt("UID or email:");
  if (!target) return;

  const updates = {};
  for (const path of getBanPaths(target)) {
    updates[path] = shouldBan ? {
      target,
      reason: banReasonInput ? banReasonInput.value.trim() : "",
      by: auth.currentUser.email,
      at: Date.now()
    } : null;
  }

  await update(ref(rtdb), updates);
  alert(shouldBan ? "User banned." : "User unbanned.");
}

if (banUserBtn) {
  const cleanBanUserBtn = banUserBtn.cloneNode(true);
  banUserBtn.replaceWith(cleanBanUserBtn);
  cleanBanUserBtn.textContent = "Ban";
  cleanBanUserBtn.addEventListener("click", () => setBanState(true).catch(console.error));
}
if (unbanUserBtn) unbanUserBtn.addEventListener("click", () => setBanState(false).catch(console.error));

function trackOnlinePlayer(user = auth.currentUser) {
  if (!user) return;

  const userRef = ref(rtdb, 'onlineUsers/' + user.uid);

  // Устанавливаем пользователя как онлайн
  set(userRef, {
    uid: user.uid,
    nick: getUserName(user),
    lastSeen: Date.now()
  });

  // Удаляем при отключении
  onDisconnect(userRef).remove();
}

// Вызываем при логине
// Обновляем счётчик онлайн игроков
function updateOnlinePlayers() {
  const usersRef = ref(rtdb, 'onlineUsers/');
  onValue(usersRef, snapshot => {
    const data = snapshot.val();
    const count = data ? Object.keys(data).length : 0;
    onlinePlayersEl.innerText = `Online players: ${count}`;
  });
}

updateOnlinePlayers();








const overlay = document.getElementById("overlayTemplate");
const templateViewport = document.getElementById("templateViewport");
const templatePanelToggle = document.getElementById("templatePanelToggle");
const templateControls = document.getElementById("templateControls");
const fileInput = document.getElementById("templateFile");
const opacityRange = document.getElementById("opacityRange");
const coordX = document.getElementById("coordX");
const coordY = document.getElementById("coordY");
const applyCoordsBtn = document.getElementById("applyCoords");
const toggleBtn = document.getElementById("toggleBtn");
const clearTemplateBtn = document.getElementById("clearTemplate");
const followTemplateBtn = document.getElementById("followTemplateBtn");
const autoTemplateColorBtn = document.getElementById("autoTemplateColorBtn");
const saveTemplateBtn = document.getElementById("saveTemplateBtn");
const savedTemplatesList = document.getElementById("savedTemplatesList");
const templateStorageKey = "pixel-war-template";

let templateX = 0;
let templateY = 0;
let templateOpacity = 0.5;
let templateVisible = true;
let templatePixelData = null;
let isTemplateFollowActive = false;
let isTemplateAutoColorActive = false;
let savedTemplatesUnsubscribe = null;

function hasTemplateImage() {
  return !!overlay.getAttribute("src");
}

function setTemplateCoords(x, y, shouldSave = false) {
  templateX = Math.max(0, Math.floor(Number(x) || 0));
  templateY = Math.max(0, Math.floor(Number(y) || 0));
  coordX.value = String(templateX);
  coordY.value = String(templateY);
  updateTemplatePosition();
  if (shouldSave) saveTemplateState();
}

function updateTemplateFollowPosition() {
  if (!isTemplateFollowActive || !hasTemplateImage()) return;
  setTemplateCoords(
    Math.floor(hoverCellX / gridCellSize),
    Math.floor(hoverCellY / gridCellSize)
  );
}

function stopTemplateFollow() {
  if (!isTemplateFollowActive) return false;
  updateTemplateFollowPosition();
  isTemplateFollowActive = false;
  saveTemplateState();
  syncTemplateControls();
  return true;
}

function getTemplateColorForWorldCell(worldX, worldY) {
  if (!isTemplateAutoColorActive || !templatePixelData) return null;
  const cellX = Math.floor(worldX / gridCellSize);
  const cellY = Math.floor(worldY / gridCellSize);
  const imageX = cellX - templateX;
  const imageY = cellY - templateY;

  if (
    imageX < 0 ||
    imageY < 0 ||
    imageX >= templatePixelData.width ||
    imageY >= templatePixelData.height
  ) {
    return null;
  }

  return templatePixelData.colors[imageY * templatePixelData.width + imageX] || null;
}

function readTemplatePixelsFromImage(img) {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const imageCtx = canvas.getContext("2d", { willReadFrequently: true });
  imageCtx.imageSmoothingEnabled = false;
  imageCtx.drawImage(img, 0, 0, width, height);

  const imageData = imageCtx.getImageData(0, 0, width, height);
  const templateColors = new Array(width * height);
  for (let i = 0, p = 0; i < templateColors.length; i++, p += 4) {
    if (imageData.data[p + 3] < 16) {
      templateColors[i] = null;
      continue;
    }
    templateColors[i] = getNearestPaletteColor(
      imageData.data[p],
      imageData.data[p + 1],
      imageData.data[p + 2]
    ).color;
  }

  return { width, height, colors: templateColors };
}

function quantizeTemplateImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const imageCtx = canvas.getContext("2d", { willReadFrequently: true });
      imageCtx.imageSmoothingEnabled = false;
      imageCtx.drawImage(img, 0, 0, width, height);

      const imageData = imageCtx.getImageData(0, 0, width, height);
      const templateColors = new Array(width * height);
      for (let i = 0, p = 0; i < templateColors.length; i++, p += 4) {
        if (imageData.data[p + 3] < 16) {
          imageData.data[p + 3] = 0;
          templateColors[i] = null;
          continue;
        }

        const nearest = getNearestPaletteColor(
          imageData.data[p],
          imageData.data[p + 1],
          imageData.data[p + 2]
        );
        imageData.data[p] = nearest.r;
        imageData.data[p + 1] = nearest.g;
        imageData.data[p + 2] = nearest.b;
        imageData.data[p + 3] = 255;
        templateColors[i] = nearest.color;
      }

      imageCtx.putImageData(imageData, 0, 0);
      resolve({
        src: canvas.toDataURL("image/png"),
        pixels: { width, height, colors: templateColors }
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

function saveTemplateState() {
  try {
    localStorage.setItem(templateStorageKey, JSON.stringify({
      src: overlay.getAttribute("src") || "",
      x: templateX,
      y: templateY,
      opacity: templateOpacity,
      visible: templateVisible
    }));
  } catch (err) {
    console.warn("Template is too large to save locally.");
  }
}

function getTemplateSaveSize(src) {
  return Math.ceil((src || "").length * 0.75);
}

async function saveTemplateToAccount() {
  if (!auth.currentUser) return alert("Login to save templates.");
  const src = overlay.getAttribute("src") || "";
  if (!src) return;
  if (getTemplateSaveSize(src) > 220000) {
    return alert("Template is too large to save. Use a smaller image.");
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const templateName = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "template.png";
  await set(ref(rtdb, `templates/${auth.currentUser.uid}/${id}`), {
    id,
    name: templateName.slice(0, 80),
    src,
    x: templateX,
    y: templateY,
    opacity: templateOpacity,
    visible: templateVisible,
    width: templatePixelData ? templatePixelData.width : 0,
    height: templatePixelData ? templatePixelData.height : 0,
    createdAt: Date.now()
  });
}

function renderSavedTemplates(data) {
  if (!savedTemplatesList) return;
  const templates = Object.values(data || {})
    .filter(item => item && item.src)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  templateControls.classList.toggle("has-saved-templates", templates.length > 0);
  if (!templates.length) {
    savedTemplatesList.innerHTML = '<div class="saved-template-meta">No saved templates.</div>';
    return;
  }

  savedTemplatesList.innerHTML = templates.map(template => `
    <div class="saved-template-item" data-template-id="${escapeHtml(template.id)}">
      <img src="${template.src}" alt="">
      <div class="saved-template-meta">
        <div>${escapeHtml(template.name || "template")}</div>
        <div>${escapeHtml(formatDateTime(template.createdAt))}</div>
        <div>X ${Number(template.x) || 0}, Y ${Number(template.y) || 0}</div>
      </div>
      <div class="saved-template-actions">
        <button type="button" data-template-action="load">Load</button>
        <button type="button" data-template-action="delete">Del</button>
      </div>
    </div>
  `).join("");
}

function watchSavedTemplates(user) {
  if (savedTemplatesUnsubscribe) savedTemplatesUnsubscribe();
  savedTemplatesUnsubscribe = null;
  if (!savedTemplatesList) return;

  if (!user) {
    templateControls.classList.remove("has-saved-templates");
    savedTemplatesList.innerHTML = '<div class="saved-template-meta">Login to save templates.</div>';
    return;
  }

  savedTemplatesUnsubscribe = onValue(ref(rtdb, `templates/${user.uid}`), snapshot => {
    renderSavedTemplates(snapshot.val());
  });
}

if (saveTemplateBtn) {
  saveTemplateBtn.addEventListener("click", () => saveTemplateToAccount().catch(err => {
    console.error(err);
    alert("Could not save template.");
  }));
}

if (savedTemplatesList) {
  savedTemplatesList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-template-action]");
    const item = event.target.closest(".saved-template-item");
    if (!button || !item || !auth.currentUser) return;

    const id = item.dataset.templateId;
    if (!id) return;
    if (button.dataset.templateAction === "delete") {
      await remove(ref(rtdb, `templates/${auth.currentUser.uid}/${id}`));
      return;
    }

    const snapshot = await get(ref(rtdb, `templates/${auth.currentUser.uid}/${id}`));
    const template = snapshot.val();
    if (!template || !template.src) return;
    templateX = Number(template.x) || 0;
    templateY = Number(template.y) || 0;
    templateOpacity = Number.isFinite(Number(template.opacity)) ? Number(template.opacity) : 0.5;
    templateVisible = template.visible !== false;
    setTemplateSrc(template.src);
    syncTemplateControls();
    saveTemplateState();
  });
}

function syncTemplateControls() {
  const hasTemplate = hasTemplateImage();
  if (!hasTemplate) {
    isTemplateFollowActive = false;
    isTemplateAutoColorActive = false;
  }

  coordX.value = String(templateX);
  coordY.value = String(templateY);
  opacityRange.value = String(templateOpacity);
  overlay.style.opacity = templateOpacity;
  toggleBtn.textContent = templateVisible ? "Hide" : "Show";
  templateControls.classList.toggle("has-template", hasTemplate);
  followTemplateBtn.classList.toggle("active", isTemplateFollowActive);
  autoTemplateColorBtn.classList.toggle("active", isTemplateAutoColorActive);
  followTemplateBtn.textContent = isTemplateFollowActive ? "Stop" : "Move";
  autoTemplateColorBtn.textContent = isTemplateAutoColorActive ? "Auto*" : "Auto";
}

function setTemplatePanelOpen(open) {
  templateControls.classList.toggle("open", open);
  templatePanelToggle.classList.toggle("active", open);
  templatePanelToggle.setAttribute("aria-expanded", String(open));
}

function setTemplateSrc(src) {
  if (src) {
    overlay.src = src;
  } else {
    overlay.removeAttribute("src");
    templatePixelData = null;
    templateVisible = false;
    isTemplateFollowActive = false;
    isTemplateAutoColorActive = false;
  }
  templateVisible = !!src && templateVisible;
  syncTemplateControls();
  updateTemplatePosition();
}

function loadTemplateState() {
  const rawState = localStorage.getItem(templateStorageKey);
  if (!rawState) {
    syncTemplateControls();
    updateTemplatePosition();
    return;
  }

  try {
    const state = JSON.parse(rawState);
    templateX = Number.isFinite(Number(state.x)) ? Number(state.x) : 0;
    templateY = Number.isFinite(Number(state.y)) ? Number(state.y) : 0;
    templateOpacity = Number.isFinite(Number(state.opacity)) ? Number(state.opacity) : 0.5;
    templateVisible = state.visible !== false;
    syncTemplateControls();
    setTemplateSrc(state.src || "");
  } catch (err) {
    syncTemplateControls();
    updateTemplatePosition();
  }
}

templatePanelToggle.addEventListener("click", () => {
  setTemplatePanelOpen(!templateControls.classList.contains("open"));
});

// загрузка картинки
fileInput.addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event)=>{
    try {
      const processedTemplate = await quantizeTemplateImage(event.target.result);
      templatePixelData = processedTemplate.pixels;
      templateVisible = true;
      setTemplateSrc(processedTemplate.src);
      syncTemplateControls();
      saveTemplateState();
    } catch (err) {
      console.error(err);
      alert("Template image failed to load.");
    }
  };
  reader.readAsDataURL(file);
});

// прозрачность
opacityRange.addEventListener("input", ()=>{
  templateOpacity = Number(opacityRange.value);
  updateTemplatePosition();
  saveTemplateState();
});

// координаты
function applyTemplateCoords() {
  setTemplateCoords(parseInt(coordX.value), parseInt(coordY.value), true);
}

applyCoordsBtn.addEventListener("click", applyTemplateCoords);
coordX.addEventListener("change", applyTemplateCoords);
coordY.addEventListener("change", applyTemplateCoords);

// показать/скрыть
toggleBtn.addEventListener("click", ()=>{
  if (!hasTemplateImage()) return;
  templateVisible = !templateVisible;
  syncTemplateControls();
  updateTemplatePosition();
  saveTemplateState();
});

followTemplateBtn.addEventListener("click", () => {
  if (!hasTemplateImage()) return;
  if (isTemplateFollowActive) {
    stopTemplateFollow();
    return;
  }
  isTemplateFollowActive = true;
  updateTemplateFollowPosition();
  syncTemplateControls();
});

autoTemplateColorBtn.addEventListener("click", () => {
  if (!hasTemplateImage() || !templatePixelData) return;
  isTemplateAutoColorActive = !isTemplateAutoColorActive;
  syncTemplateControls();
});

clearTemplateBtn.addEventListener("click", () => {
  overlay.removeAttribute("src");
  fileInput.value = "";
  templatePixelData = null;
  templateVisible = false;
  isTemplateFollowActive = false;
  isTemplateAutoColorActive = false;
  localStorage.removeItem(templateStorageKey);
  syncTemplateControls();
  updateTemplatePosition();
});

// обновление позиции
function updateTemplatePosition(){
  const rect = game.getBoundingClientRect();
  templateViewport.style.left = `${rect.left}px`;
  templateViewport.style.top = `${rect.top}px`;
  templateViewport.style.width = `${rect.width}px`;
  templateViewport.style.height = `${rect.height}px`;

  overlay.style.opacity = templateOpacity;
  if (!overlay.getAttribute("src") || !templateVisible) {
    templateViewport.style.display = "none";
    overlay.style.display = "none";
    return;
  }

  const screenX = (templateX * gridCellSize - camX) * scale;
  const screenY = (templateY * gridCellSize - camY) * scale;
  templateViewport.style.display = "block";
  overlay.style.display = "block";
  overlay.style.transform = `translate(${screenX}px, ${screenY}px) scale(${scale * gridCellSize})`;
  overlay.style.transformOrigin = "top left";
}

// перерисовка вместе с картой
overlay.addEventListener("load", () => {
  templatePixelData = readTemplatePixelsFromImage(overlay);
  syncTemplateControls();
  updateTemplatePosition();
});
window.addEventListener("resize", updateTemplatePosition);

const oldRenderAll = renderAll;
renderAll = function(){
  oldRenderAll();
  updateTemplatePosition();
};

loadTemplateState();
