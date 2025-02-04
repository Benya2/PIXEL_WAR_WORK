const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridSize = 10;
let scale = 1;
let offsetX = 0, offsetY = 0;
let isDragging = false;
let startX, startY;

const pixels = new Map(); // Хранилище пикселей

canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = 1.1;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const newScale = event.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    
    offsetX = mouseX - ((mouseX - offsetX) * newScale) / scale;
    offsetY = mouseY - ((mouseY - offsetY) * newScale) / scale;
    scale = newScale;
    draw();
});

canvas.addEventListener("mousedown", (event) => {
    if (event.button === 0) { // Левая кнопка мыши - рисование
        placePixel(event.clientX, event.clientY);
    } else if (event.button === 2) { // Правая кнопка - перетаскивание
        isDragging = true;
        startX = event.clientX - offsetX;
        startY = event.clientY - offsetY;
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (isDragging) {
        offsetX = event.clientX - startX;
        offsetY = event.clientY - startY;
        draw();
    }
});

canvas.addEventListener("mouseup", () => { isDragging = false; });
canvas.addEventListener("contextmenu", (event) => event.preventDefault()); // Отключаем контекстное меню

function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawGrid();
    drawPixels();
}

function drawGrid() {
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
    for (let x = Math.floor(-offsetX / scale / gridSize) * gridSize; x < canvas.width / scale - offsetX / scale; x += gridSize) {
        ctx.moveTo(x, -offsetY / scale);
        ctx.lineTo(x, canvas.height / scale - offsetY / scale);
    }
    for (let y = Math.floor(-offsetY / scale / gridSize) * gridSize; y < canvas.height / scale - offsetY / scale; y += gridSize) {
        ctx.moveTo(-offsetX / scale, y);
        ctx.lineTo(canvas.width / scale - offsetX / scale, y);
    }
    ctx.stroke();
}

function placePixel(clientX, clientY) {
    const x = Math.floor((clientX - offsetX) / scale / gridSize) * gridSize;
    const y = Math.floor((clientY - offsetY) / scale / gridSize) * gridSize;
    pixels.set(`${x},${y}`, "black"); // Сохраняем пиксель
    draw();
}

function drawPixels() {
    pixels.forEach((color, key) => {
        const [x, y] = key.split(",").map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, gridSize, gridSize);
    });
}

draw();
