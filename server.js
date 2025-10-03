// server.js
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Ana sayfaya bir HTML dosyası gönder.
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.IO bağlantısı kurulduğunda çalışacak kısım
io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı');

  // Tarayıcıdan 'chat message' olayı geldiğinde
  socket.on('chat message', (msg) => {
    // Mesajı bağlı olan herkese geri gönder
    io.emit('chat message', msg);
  });

  // Bir kullanıcı ayrıldığında
  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı');
  });
});

// Sunucuyu 3000 portunda başlat
server.listen(3000, () => {
  console.log('Sunucu çalışıyor: http://localhost:3000');
});