const socket = io(`http://localhost:3000`, {
    transports: ['websocket']
});

let players = {};
let estrellas = {};
let currentPlayer = {};

socket.on('connect', () => {
    console.log('Conectado al servidor', socket.id);

    currentPlayer = {
        id: socket.id,
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600)
    };
    socket.emit('newPlayer', currentPlayer);
});

// Recibe estado del juego
socket.on('gameState', (gameState) => {
    console.log('Recibido gameState:', gameState);
    estrellas = gameState.estrellas;
    players = gameState.players;
});
