const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

let clients = [];
let gameState = {
    board: Array(5).fill(null).map(() => Array(5).fill(null)),
    currentPlayer: null,
    players: {}
};

server.on('connection', (ws) => {
    if (clients.length < 2) {
        clients.push(ws);
        console.log('New client connected');
        
        if (clients.length === 1) {
            gameState.players[ws] = 'Player 1';
            gameState.currentPlayer = 'Player 1';
        } else {
            gameState.players[ws] = 'Player 2';
            gameState.currentPlayer = 'Player 1';
        }

        ws.send(JSON.stringify({ type: 'gameState', data: gameState }));

        ws.on('message', (message) => {
            console.log('Received message:', message);
            const msg = JSON.parse(message);

            if (msg.type === 'move') {
                console.log('Move received:', msg);
                if (gameState.players[ws] === gameState.currentPlayer) {
                    // Handle move logic here
                    const { row, col } = msg;
                    if (gameState.board[row][col] === null) {
                        gameState.board[row][col] = gameState.currentPlayer;
                        gameState.currentPlayer = gameState.currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';
                        broadcast(JSON.stringify({ type: 'gameState', data: gameState }));
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Cell already taken' }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
                }
            }
        });

        ws.on('close', () => {
            clients = clients.filter(client => client !== ws);
            console.log('Client disconnected');
            if (clients.length === 0) {
                gameState = {
                    board: Array(5).fill(null).map(() => Array(5).fill(null)),
                    currentPlayer: null,
                    players: {}
                };
            } else if (clients.length === 1) {
                // Reassign the remaining player as Player 1
                gameState.players[clients[0]] = 'Player 1';
                gameState.currentPlayer = 'Player 1';
                broadcast(JSON.stringify({ type: 'gameState', data: gameState }));
            }
        });
    } else {
        ws.close(); // Reject extra clients
    }
});

function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

console.log('WebSocket server is running on ws://localhost:8080');
