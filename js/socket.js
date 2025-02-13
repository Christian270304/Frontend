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
    players = state.players;  // Actualiza los jugadores
    estrellas = state.estrellas; // Actualiza las estrellas
    drawPlayers();  // Dibuja los jugadores
    drawEstrellas();  // Dibuja las estrellas
});