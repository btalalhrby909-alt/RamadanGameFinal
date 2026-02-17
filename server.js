const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomCode, username) => {
        socket.join(roomCode);
        socket.username = username;
        socket.roomCode = roomCode;

        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: [],
                curIdx: 0,
                reqChar: "",
                curCatIdx: 0,
                usedWords: []
            };
        }

        const room = rooms[roomCode];
        if (!room.players.find(p => p.name === username)) {
            room.players.push({ name: username, isOut: false, bCat: true, bChar: true });
        }

        io.to(roomCode).emit('updateGameState', room);
    });

    socket.on('submitWord', (word) => {
        const room = rooms[socket.roomCode];
        if (!room) return;

        room.usedWords.push(word);
        room.reqChar = word.slice(-1);
        room.curIdx = (room.curIdx + 1) % room.players.length;

        io.to(socket.roomCode).emit('updateGameState', room);
        io.to(socket.roomCode).emit('newMsg', { name: socket.username, text: word });
    });

    socket.on('useBomb', (type) => {
        const room = rooms[socket.roomCode];
        const p = room.players[room.curIdx];
        if (type === 'cat' && p.bCat) {
            p.bCat = false;
            room.curCatIdx = (room.curCatIdx + 1) % 4;
        } else if (type === 'char' && p.bChar) {
            p.bChar = false;
            room.reqChar = "ابجدهوزحطكلمنسعفصقرستثخذضظغ"[Math.floor(Math.random()*28)];
        }
        io.to(socket.roomCode).emit('updateGameState', room);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`Online on ${PORT}`));
