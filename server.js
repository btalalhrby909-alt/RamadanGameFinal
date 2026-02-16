const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات بسيطة للبداية
const categories = ["اسم", "حيوان", "نبات", "جماد", "بلاد"];

io.on('connection', (socket) => {
    console.log('لاعب جديد دخل السيرفر ✅');
    
    // إرسال الفئة الأولى عند الاتصال
    socket.emit('gameUpdate', {
        category: categories[0],
        char: "أ"
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على الرابط: http://localhost:${PORT}`);
});
