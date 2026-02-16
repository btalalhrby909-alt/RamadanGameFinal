const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};
const categories = ["أسماء", "حيوانات", "نباتات", "جماد", "بلاد"];

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomCode, username) => {
        socket.join(roomCode);
        socket.username = username;
        socket.roomCode = roomCode;

        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: [],
                scores: {},
                usedWords: [],
                currentCategoryIndex: 0,
                currentChar: "",
                turnIndex: 0,
                gameStarted: false,
                activePlayers: []
            };
        }

        if (!rooms[roomCode].players.includes(username)) {
            rooms[roomCode].players.push(username);
            rooms[roomCode].scores[username] = 0;
        }

        io.to(roomCode).emit('updateData', rooms[roomCode]);
    });

    socket.on('startGame', () => {
        const room = rooms[socket.roomCode];
        if (room) {
            room.gameStarted = true;
            room.activePlayers = [...room.players];
            room.usedWords = [];
            room.turnIndex = 0;
            room.currentCategoryIndex = 0;
            room.currentChar = "أبجدهوزحطيكلمنصعفصقرستثخذضظغ"[Math.floor(Math.random() * 28)];
            sendUpdate(socket.roomCode);
        }
    });

    socket.on('submitAnswer', (word) => {
        const room = rooms[socket.roomCode];
        const currentPlayer = room.activePlayers[room.turnIndex];

        if (socket.username !== currentPlayer) return;

        // فحص التكرار والحرف الأخير
        if (room.usedWords.includes(word) || !word.startsWith(room.currentChar)) {
            // إقصاء اللاعب إذا أخطأ
            room.activePlayers.splice(room.turnIndex, 1);
            io.to(socket.roomCode).emit('chatMessage', { name: "النظام", text: `❌ إقصاء ${socket.username}! الكلمة خطأ أو مكررة.` });
        } else {
            room.usedWords.push(word);
            room.currentChar = word.slice(-1); // الحرف الجديد هو آخر حرف
            room.turnIndex = (room.turnIndex + 1) % room.activePlayers.length;
        }

        // فحص انتهاء الجولة (بقاء لاعب واحد)
        if (room.activePlayers.length === 1) {
            const winner = room.activePlayers[0];
            room.scores[winner] += 1;
            io.to(socket.roomCode).emit('chatMessage', { name: "النظام", text: `🏆 ${winner} فاز بالجولة وحصل على نقطة!` });
            
            // فحص الفوز النهائي (5 نقاط)
            if (room.scores[winner] >= 5) {
                io.to(socket.roomCode).emit('chatMessage', { name: "النظام", text: `🎊 ${winner} هو بطل اللعبة النهائي!` });
                room.gameStarted = false;
            } else {
                // تغيير الفئة وبدء جولة جديدة
                room.currentCategoryIndex = (room.currentCategoryIndex + 1) % categories.length;
                room.activePlayers = [...room.players];
                room.turnIndex = 0;
            }
        }

        sendUpdate(socket.roomCode);
    });
});

function sendUpdate(roomCode) {
    const room = rooms[roomCode];
    io.to(roomCode).emit('updateData', {
        ...room,
        category: categories[room.currentCategoryIndex]
    });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
