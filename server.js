const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات مصغرة للكلمات الصحيحة (يمكنك زيادتها)
const dictionary = {
    "أسماء": ["احمد", "محمد", "سارة", "نورة", "علي", "خالد", "فهد", "ريم", "ليان", "يوسف", "عمر", "هند"],
    "حيوان": ["اسد", "نمر", "فهد", "جمل", "خروف", "صقر", "نسر", "تمساح", "قرد", "حوت", "فيل"],
    "جماد": ["طاولة", "كرسي", "قلم", "كتاب", "جوال", "مفتاح", "جدار", "شاشة", "باب", "سيارة", "ساعة"],
    "بلاد": ["السعودية", "مصر", "الكويت", "الامارات", "قطر", "عمان", "اليمن", "العراق", "لبنان"]
};

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
                usedWords: [],
                chatHistory: [],
                timeLeft: 20,
                timer: null
            };
        }

        const room = rooms[roomCode];
        if (!room.players.find(p => p.name === username)) {
            room.players.push({ name: username, id: socket.id, isOut: false, points: 0 });
        }

        io.to(roomCode).emit('updateGameState', room);
        if (room.players.length >= 2 && !room.timer) startRoomTimer(roomCode);
    });

    socket.on('submitWord', (word) => {
        const room = rooms[socket.roomCode];
        const cats = Object.keys(dictionary);
        const currentCat = cats[room.curCatIdx];

        // التحقق من صحة الكلمة (في القاموس + تبدأ بالحرف المطلوب + لم تستخدم من قبل)
        const isExist = dictionary[currentCat].includes(word);
        const isMatch = !room.reqChar || word.startsWith(room.reqChar);
        const isNotUsed = !room.usedWords.includes(word);

        if (isExist && isMatch && isNotUsed) {
            room.usedWords.push(word);
            room.reqChar = word.slice(-1);
            room.timeLeft = 20; // إعادة ضبط الوقت
            
            // الانتقال للاعب التالي
            room.curIdx = (room.curIdx + 1) % room.players.length;
            
            // إذا اكتملت دورة كاملة، نغير الفئة
            if (room.curIdx === 0) room.curCatIdx = (room.curCatIdx + 1) % cats.length;

            io.to(socket.roomCode).emit('updateGameState', room);
        } else {
            socket.emit('errorMsg', "كلمة غير صحيحة أو مكررة!");
        }
    });

    socket.on('sendChat', (msg) => {
        io.to(socket.roomCode).emit('newChatMsg', { name: socket.username, text: msg });
    });
});

function startRoomTimer(roomCode) {
    const room = rooms[roomCode];
    room.timer = setInterval(() => {
        if (room.timeLeft > 0) {
            room.timeLeft--;
            io.to(roomCode).emit('timerUpdate', room.timeLeft);
        } else {
            eliminatePlayer(roomCode);
        }
    }, 1000);
}

function eliminatePlayer(roomCode) {
    const room = rooms[roomCode];
    const currentPlayer = room.players[room.curIdx];
    currentPlayer.isOut = true;
    
    io.to(roomCode).emit('newChatMsg', { name: "📢", text: `تم إقصاء ${currentPlayer.name}!` });

    const activePlayers = room.players.filter(p => !p.isOut);

    if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        winner.points += 1;
        io.to(roomCode).emit('newChatMsg', { name: "🏆", text: `فاز ${winner.name} بالجولة!` });

        if (winner.points >= 5) {
            room.isGameOver = true;
            io.to(roomCode).emit('gameResult', `${winner.name} هو بطل المجلس النهائي!`);
        }
    }
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`Game Server on ${PORT}`));