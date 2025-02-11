const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Tamaño del canvas y tamaño del jugador
const canvasWidth = 1285;
const canvasHeight = 550;
const playerSize = 20;
const visualPlayerSize = 50;

// Variables del jugador actual
let currentPlayer = {
    x: Math.floor(Math.random() * (canvasWidth - playerSize)), 
    y: Math.floor(Math.random() * (canvasHeight - playerSize))
    
};

let moving = { up: false, down: false, left: false, right: false };
let colorNave = 'blue';
let players = {};

// Estrellas
let estrellas = [];
const maxEstrellas = 10;
const despawnTime = 20000;
const estrellaImg = new Image();
estrellaImg.src = '../images/estrella.svg';

// Conexión al servidor
const urlParams = new URLSearchParams(window.location.search);
const namespace = urlParams.get('namespace');
const socket = io(`http://localhost:3000${namespace}`, { upgrade: true });
// Recibe el ID del jugador desde el servidor
socket.on('playerID', (id) => {
    currentPlayer.id = id;
    console.log("ID del jugador:", currentPlayer.id);
});

// Recibe el estado del juego (jugadores y estrellas) cuando se conecta
socket.on('gameState', (state) => {
    console.log('Recibido gameState:', state);
    players = state.players;  // Actualiza los jugadores
    estrellas = state.estrellas; // Actualiza las estrellas
    drawPlayers();  // Dibuja los jugadores
    drawEstrellas();  // Dibuja las estrellas
});




// Dibujar las estrellas
function drawEstrellas() {
    ctx.fillStyle = 'white';
    estrellas.forEach((estrella) => {
        ctx.drawImage(estrellaImg, estrella.x, estrella.y, 50, 50);
    });
}

// Detectar colisiones con estrellas
function checkCollisions() {
    for (let i = 0; i < estrellas.length; i++) {
        const estrella = estrellas[i];

        if (
            currentPlayer.x < estrella.x + 50 &&
            currentPlayer.x + playerSize > estrella.x &&
            currentPlayer.y < estrella.y + 50 &&
            currentPlayer.y + playerSize > estrella.y
        ) {
            estrellas.splice(i, 1); // Eliminar estrella del cliente
            let score = document.getElementById('scoreboard');
            score.innerText = parseInt(score.innerText) + 1; // Incrementar puntaje

            // Emitir evento al servidor para eliminar la estrella
            socket.emit('removeEstrella', estrella);
        }
    }
}

// Dibujar los jugadores
const nauJugador = new Image();
nauJugador.src = '../images/nau3_old.png'; // Verifica que la ruta sea correcta

// Añadir la función onload para asegurarse de que la imagen se cargue antes de dibujar
nauJugador.onload = () => {
    console.log("Imagen cargada correctamente.");
    // Llamamos a la función de inicio del juego aquí después de que la imagen se haya cargado
    update();  // Inicia el ciclo de actualización
};

nauJugador.onerror = () => {
    console.log("Error al cargar la imagen.");
};

// Función para dibujar los jugadores
function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawEstrellas(); // Dibujar estrellas antes de los jugadores

    for (const id in players) {
        const player = players[id];

        ctx.save(); // Guarda el contexto

        // Mueve el origen de coordenadas al centro del jugador
        ctx.translate(player.x + visualPlayerSize / 2, player.y + visualPlayerSize / 2);

        // Aplica la rotación (Nota: usamos + en lugar de - para corregir la dirección)
        ctx.rotate(player.rotation);

        // Dibujar la nave centrada
        ctx.drawImage(nauJugador, -visualPlayerSize / 2, -visualPlayerSize / 2, visualPlayerSize, visualPlayerSize);

        ctx.restore(); // Restaura el contexto
    }
}

// Mover al jugador
let velocidad = 1; // Velocidad normal del jugador
let hipervelocitat = false;
let temps = 0;
let interval = 1000;
let powerupDuration = 5000; // Duración del powerup en milisegundos
let powerupActive = false;

// Controlar hipervelocidad
setInterval(() => {
    if (!powerupActive && !hipervelocitat) {
        temps++;
        if (temps === 10) {
            hipervelocitat = true;
            temps = 0;
        }
    }
}, interval);

setInterval(() => {
    let div = document.getElementById('hipervelocitat');
    div.innerHTML = hipervelocitat ? "Hipervelocitat disponible" : "Hipervelocitat NO disponible";
}, 1);

// Habilitar hipervelocidad con la tecla 'h'
document.addEventListener('keydown', (event) => {
    if (event.key === 'h' && hipervelocitat) {
        hipervelocitat = false;
        powerupActive = true;
        velocidad = 5;

        setTimeout(() => {
            powerupActive = false;
            velocidad = 1;
            temps = 0;
        }, powerupDuration);
    }
});

// Mover el jugador con las teclas
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') moving.up = true;
    if (event.key === 'ArrowDown') moving.down = true;
    if (event.key === 'ArrowLeft') moving.left = true;
    if (event.key === 'ArrowRight') moving.right = true;
    movePlayer();
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp') moving.up = false;
    if (event.key === 'ArrowDown') moving.down = false;
    if (event.key === 'ArrowLeft') moving.left = false;
    if (event.key === 'ArrowRight') moving.right = false;
});

// Mover al jugador en el canvas
function movePlayer() {
    if (moving.up || moving.down || moving.left || moving.right) {
        calculateAngle();  // Calcula el ángulo antes de mover
        currentPlayer.rotation = angle;  // Guarda el ángulo en el jugador actual
    }

    if (moving.up) currentPlayer.y = Math.max(0, currentPlayer.y - velocidad);
    if (moving.down) currentPlayer.y = Math.min(canvasHeight - visualPlayerSize, currentPlayer.y + velocidad);
    if (moving.left) currentPlayer.x = Math.max(0, currentPlayer.x - velocidad);
    if (moving.right) currentPlayer.x = Math.min(canvasWidth - visualPlayerSize, currentPlayer.x + velocidad);

    if (currentPlayer.id) {
        players[currentPlayer.id] = { 
            x: currentPlayer.x, 
            y: currentPlayer.y, 
            rotation: currentPlayer.rotation // Enviar la rotación correcta
        };
        socket.emit('move', { x: currentPlayer.x, y: currentPlayer.y, rotation: currentPlayer.rotation });
    }
}

// Variables para almacenar el ángulo de rotación de la nave
let angle = 0;

// Función para calcular el ángulo según la dirección del movimiento
function calculateAngle() {
    // Si se mueve hacia arriba y a la izquierda (Arriba-Izquierda)
    if (moving.up && moving.left) {
        angle = Math.PI * 1.75;  // ↖ 315° (Corregido)
    } 
    // Si se mueve hacia arriba y a la derecha (Arriba-Derecha)
    else if (moving.up && moving.right) {
        angle = Math.PI / 4;     // ↗ 45° (Correcto)
    }
    // Si se mueve hacia abajo y a la izquierda (Abajo-Izquierda)
    else if (moving.down && moving.left) {
        angle = Math.PI * 1.25;  // ↙ 225° (Corregido)
    }
    // Si se mueve hacia abajo y a la derecha (Abajo-Derecha)
    else if (moving.down && moving.right) {
        angle = Math.PI * 0.75;  // ↘ 135° (Corregido)
    }
    // Si solo se mueve hacia arriba (Arriba)
    else if (moving.up) {
        angle = 0;               // ↑ 0° (Correcto)
    }
    // Si solo se mueve hacia abajo (Abajo)
    else if (moving.down) {
        angle = Math.PI;         // ↓ 180° (Correcto)
    }
    // Si solo se mueve hacia la izquierda (Izquierda)
    else if (moving.left) {
        angle = Math.PI * 1.5;   // ← 270° (Correcto)
    }
    // Si solo se mueve hacia la derecha (Derecha)
    else if (moving.right) {
        angle = Math.PI / 2;     // → 90° (Correcto)
    }

    // Mostrar en consola para depurar
    console.log("Ángulo calculado:", angle, "Radianes, ", angle * 180 / Math.PI, "°");
}


// Actualizar el juego
function update() {
    movePlayer();
    checkCollisions();
    drawPlayers();
    requestAnimationFrame(update);
}
