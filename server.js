const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

// نظام الغرف واللاعبين
io.on('connection', (socket) => {
    console.log('🚀 لاعب جديد دخل السيرفر ✅');

    socket.on('joinRoom', (roomCode, username) => {
        socket.join(roomCode);
        socket.username = username;
        socket.roomCode = roomCode;
        console.log(`✅ ${username} دخل الغرفة: ${roomCode}`);
        io.to(roomCode).emit('chatMessage', { name: 'النظام', text: `${username} دخل التحدي!` });
    });

    socket.on('submitAnswer', (ans) => {
        if (socket.roomCode) {
            io.to(socket.roomCode).emit('chatMessage', { name: socket.username, text: ans });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ لاعب غادر السيرفر');
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على الرابط : http://localhost:${PORT}`);
});
