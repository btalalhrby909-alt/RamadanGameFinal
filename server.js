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
                gameStarted: false,
                usedWords: []
            };
        }

        const room = rooms[roomCode];
        if (!room.players.find(p => p.name === username)) {
            room.players.push({ name: username, id: socket.id, isOut: false, bCat: true, bChar: true });
        }

        io.to(roomCode).emit('updateGameState', room);
    });

    socket.on('submitWord', (word) => {
        const room = rooms[socket.roomCode];
        if (!room) return;

        // منطق التحقق هنا أو إرساله للجميع
        room.usedWords.push(word);
        room.reqChar = word.slice(-1);
        
        // الانتقال للاعب التالي
        do {
            room.curIdx = (room.curIdx + 1) % room.players.length;
        } while (room.players[room.curIdx].isOut);

        io.to(socket.roomCode).emit('updateGameState', room);
        io.to(socket.roomCode).emit('newMsg', { name: socket.username, text: word });
    });

    socket.on('disconnect', () => {
        // يمكن إضافة منطق خروج اللاعب هنا
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
