const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// مخزن النقاط: { roomCode: { username: points } }
const roomData = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomCode, username) => {
        socket.join(roomCode);
        socket.username = username;
        socket.roomCode = roomCode;

        if (!roomData[roomCode]) roomData[roomCode] = { scores: {}, currentRound: { cat: 'اسم', char: 'أ' } };
        if (!roomData[roomCode].scores[username]) roomData[roomCode].scores[username] = 0;

        io.to(roomCode).emit('gameUpdate', { 
            category: roomData[roomCode].currentRound.cat, 
            char: roomData[roomCode].currentRound.char, 
            allScores: roomData[roomCode].scores 
        });
    });

    socket.on('submitAnswer', (ans) => {
        if (socket.roomCode && socket.username) {
            roomData[socket.roomCode].scores[socket.username] += 10; // إضافة 10 نقاط
            
            io.to(socket.roomCode).emit('chatMessage', { 
                name: socket.username, 
                text: ans 
            });

            io.to(socket.roomCode).emit('updateScores', roomData[socket.roomCode].scores);
        }
    });
});

// السطر الأهم لحل مشكلة Render (استخدام المنفذ 0.0.0.0)
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل بنجاح على المنفذ: ${PORT}`);
});