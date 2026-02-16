io.on('connection', (socket) => {
    console.log('🚀 لاعب جديد اتصل بالشبكة');

    socket.on('joinRoom', (roomCode, username) => {
        socket.join(roomCode); // اللاعب يدخل غرفة محددة بالكود
        socket.username = username;
        socket.roomCode = roomCode;
        console.log(`✅ ${username} دخل الغرفة: ${roomCode}`);
        
        // إرسال تنبيه للغرفة فقط
        io.to(roomCode).emit('chatMessage', { name: 'النظام', text: `${username} دخل التحدي!` });
    });

    socket.on('submitAnswer', (ans) => {
        // إرسال الإجابة فقط لأشخاص في نفس الغرفة
        io.to(socket.roomCode).emit('chatMessage', { name: socket.username, text: ans });
    });
});
