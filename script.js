const colorsChoice = document.querySelector('#colorsChoice')
const game = document.querySelector('#game')
const cursor = document.querySelector('#cursor')

game.width = 1200
game.height = 600
const gridCellSize = 10

const ctx = game.getContext('2d');

// Создаём отдельный canvas для рисования сетки
const gridCanvas = document.createElement('canvas');
gridCanvas.width = game.width;
gridCanvas.height = game.height;
const gridCtx = gridCanvas.getContext('2d');

// Добавляем gridCanvas в DOM, чтобы он был рядом с основным canvas
game.parentElement.appendChild(gridCanvas);

const colorList = [
    "#FFEBEE", "#FCE4EC", "#F3E5F5", "#B39DDB", "#9FA8DA", "#90CAF9", "#81D4FA", "#80DEEA",
    "#4DB6AC", "#66BB6A", "#9CCC65", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722",
    "#A1887F", "#E0E0E0", "#90A4AE", "#000"
]
let currentColorChoice = colorList[9]

const firebaseConfig = {
    apiKey: "AIzaSyBrpdr3nJyghyxFq45P5cuJIbpOY6sV1zo",
    authDomain: "pixel-war-b9db6.firebaseapp.com",
    projectId: "pixel-war-b9db6",
    storageBucket: "pixel-war-b9db6.firebasestorage.app",
    messagingSenderId: "235773191644",
    appId: "1:235773191644:web:53b48f845ae04e0cef9b19"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig)
const db = firebase.firestore()

// Генерация палитры цветов
colorList.forEach(color => {
    const colorItem = document.createElement('div')
    colorItem.style.backgroundColor = color
    colorsChoice.appendChild(colorItem)

    colorItem.addEventListener('click', () => {
        currentColorChoice = color

        colorItem.innerHTML = `<i class="fa-solid fa-check"></i>`

        setTimeout(() => {
            colorItem.innerHTML = ""
        }, 1000)
    })
})

// Рисуем пиксель
function createPixel(x, y, color) {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.fillRect(x, y, gridCellSize, gridCellSize)
}

// Добавляем пиксель в игру и в Firestore
function addPixelIntoGame() {
    const x = cursor.offsetLeft
    const y = cursor.offsetTop - game.offsetTop

    createPixel(x, y, currentColorChoice)

    const pixel = {
        x,
        y,
        color: currentColorChoice
    }

    const pixelRef = db.collection('pixels').doc(`${pixel.x}-${pixel.y}`)
    pixelRef.set(pixel, { merge: true })
}

cursor.addEventListener('click', function (event) {
    addPixelIntoGame()
})
game.addEventListener('click', function () {
    addPixelIntoGame()
})

// Функция рисования сетки
function drawGrids(ctx, width, height, cellWidth, cellHeight) {
    ctx.beginPath()
    ctx.strokeStyle = "#ccc"

    for (let i = 0; i <= width; i += cellWidth) {
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
    }

    for (let i = 0; i <= height; i += cellHeight) {
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
    }
    ctx.stroke()
}

// Рисуем сетку на gridCtx
drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize)

// Двигаем курсор
game.addEventListener('mousemove', function (event) {
    const cursorLeft = event.clientX - (cursor.offsetWidth / 2)
    const cursorTop = event.clientY - (cursor.offsetHeight / 2)

    cursor.style.left = Math.floor(cursorLeft / gridCellSize) * gridCellSize + "px"
    cursor.style.top = Math.floor(cursorTop / gridCellSize) * gridCellSize + "px"
})

// Слушаем изменения в Firestore и обновляем картину
db.collection('pixels').onSnapshot(function (querySnapshot) {
    querySnapshot.docChanges().forEach(function (change) {
        const { x, y, color } = change.doc.data()

        createPixel(x, y, color)
    })
})
