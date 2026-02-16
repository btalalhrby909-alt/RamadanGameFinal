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
// مخرن للنقاط
const scores = {}; 

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomCode, username) => {
        socket.join(roomCode);
        socket.username = username;
        socket.roomCode = roomCode;
        
        // تعيين نقطة صفر للاعب الجديد إذا لم تكن موجودة
        if (!scores[roomCode]) scores[roomCode] = {};
        if (!scores[roomCode][username]) scores[roomCode][username] = 0;

        console.log(`✅ ${username} دخل الغرفة: ${roomCode}`);
        
        // إرسال الحرف الحالي وتحديث النقاط للجميع
        io.to(roomCode).emit('gameUpdate', { 
            category: 'اسم', 
            char: 'أ', 
            allScores: scores[roomCode] 
        });
    });

    socket.on('submitAnswer', (ans) => {
        if (socket.roomCode) {
            // زيادة نقطة لكل إجابة (كمثال بسيط)
            scores[socket.roomCode][socket.username] += 10; 

            io.to(socket.roomCode).emit('chatMessage', { 
                name: socket.username, 
                text: ans,
                points: scores[socket.roomCode][socket.username]
            });
            
            // تحديث قائمة النقاط عند الجميع
            io.to(socket.roomCode).emit('updateScores', scores[socket.roomCode]);
        }
    });
});
