const colorsChoice = document.querySelector('#colorsChoice');
const game = document.querySelector('#game');
const cursor = document.querySelector('#cursor');
const authButton = document.querySelector('#authButton');  // Кнопка для аутентификации

game.width = 1200;
game.height = 600;
const gridCellSize = 10;

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
];
let currentColorChoice = colorList[9];

const firebaseConfig = {
  apiKey: "AIzaSyAtpMIFFcilesRPHEwlIYXyQhBfGPyKrC0",
  authDomain: "yosiki-bb1ae.firebaseapp.com",
  projectId: "yosiki-bb1ae",
  storageBucket: "yosiki-bb1ae.firebasestorage.app",
  messagingSenderId: "701005418429",
  appId: "1:701005418429:web:7593d4f61f332f9ce88cd4",
  measurementId: "G-2V4S6LZ3EN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Логика аутентификации
authButton.addEventListener('click', () => {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            console.log('User signed in:', user);
            alert('You are now logged in!');
            authButton.textContent = 'Log Out'; // Меняем текст кнопки на "Выйти"
        })
        .catch(error => {
            console.error(error);
            alert('Failed to sign in. Please check your credentials.');
        });
});

// Логика выхода
auth.onAuthStateChanged(user => {
    if (user) {
        authButton.textContent = 'Log Out'; // Кнопка "Выйти"
    } else {
        authButton.textContent = 'Log In'; // Кнопка "Войти"
    }
});

colorList.forEach(color => {
    const colorItem = document.createElement('div');
    colorItem.style.backgroundColor = color;
    colorsChoice.appendChild(colorItem);

    colorItem.addEventListener('click', () => {
        currentColorChoice = color;

        colorItem.innerHTML = `<i class="fa-solid fa-check"></i>`;

        setTimeout(() => {
            colorItem.innerHTML = "";
        }, 1000);
    });
});

function createPixel(x, y, color) {
    ctx.beginPath();

    if (color.toUpperCase() === "#FFFFFF") {
        // Ещё меньший отступ — теперь 3 пикселя со всех сторон
        const inset = 3;
        ctx.fillStyle = color;
        ctx.fillRect(
            x + inset,
            y + inset,
            gridCellSize - inset * 2,
            gridCellSize - inset * 2
        );
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, gridCellSize, gridCellSize);
    }
}




// Добавляем пиксель в игру и в Firestore
function addPixelIntoGame() {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to place pixels!');
        return;
    }

    const x = cursor.offsetLeft;
    const y = cursor.offsetTop - game.offsetTop;
    const pixelKey = `${x}-${y}`;
    const pixelRef = db.collection('pixels').doc(pixelKey);

    const isWhite = currentColorChoice.toUpperCase() === "#FFFFFF";

    if (isWhite) {
        // Удаляем текущий белый пиксель
        pixelRef.delete()
            .then(() => {
                console.log(`✅ Удалён белый пиксель: ${pixelKey}`);
                deletePixel(x, y);
            })
            .catch(err => {
                console.error("❌ Ошибка при удалении белого пикселя:", err);
            });

        // Удаляем пиксель под ним
        const belowY = y + gridCellSize;
        const belowKey = `${x}-${belowY}`;
        const belowRef = db.collection('pixels').doc(belowKey);

        belowRef.get().then(doc => {
            if (doc.exists) {
                belowRef.delete().then(() => {
                    console.log(`✅ Удалён пиксель под белым: ${belowKey}`);
                    deletePixel(x, belowY);
                }).catch(err => {
                    console.error("❌ Ошибка при удалении нижнего пикселя:", err);
                });
            }
        });

        // НИЧЕГО НЕ СОХРАНЯЕМ! — просто return
        return;
    }

    // 🟩 Обычная логика, если цвет НЕ белый
    pixelRef.get().then(docSnapshot => {
        if (docSnapshot.exists) {
            pixelRef.delete().then(() => {
                console.log(`🔁 Старый пиксель удалён: ${pixelKey}`);
            }).catch(err => {
                console.error("❌ Ошибка при удалении:", err);
            });
        }

        const newPixel = { x, y, color: currentColorChoice };
        pixelRef.set(newPixel, { merge: true })
            .then(() => {
                console.log(`✅ Установлен новый пиксель: ${pixelKey}`);
                createPixel(x, y, currentColorChoice);
            })
            .catch(err => {
                console.error("❌ Ошибка при установке пикселя:", err);
            });
    }).catch(error => {
        console.error("❌ Ошибка при получении пикселя:", error);
    });
}


// Функция рисования сетки
function drawGrids(ctx, width, height, cellWidth, cellHeight) {
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";

    for (let i = 0; i <= width; i += cellWidth) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
    }

    for (let i = 0; i <= height; i += cellHeight) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
    }
    ctx.stroke();
}

// Рисуем сетку на gridCtx
drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize);

// Двигаем курсор
game.addEventListener('mousemove', function (event) {
    const cursorLeft = event.clientX - (cursor.offsetWidth / 2);
    const cursorTop = event.clientY - (cursor.offsetHeight / 2);

    cursor.style.left = Math.floor(cursorLeft / gridCellSize) * gridCellSize + "px";
    cursor.style.top = Math.floor(cursorTop / gridCellSize) * gridCellSize + "px";
});

// Получаем все пиксели из Firestore один раз при загрузке
function loadPixels() {
    db.collection('pixels').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const { x, y, color } = doc.data();
            createPixel(x, y, color);
        });
    });
}

loadPixels();
