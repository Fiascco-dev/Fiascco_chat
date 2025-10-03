// server.js

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const path = require('path'); // Dosya yolu manipülasyonu için path modülünü dahil et

// Render'ın dinamik portunu kullan, yoksa varsayılan olarak 3000'i kullan
const PORT = process.env.PORT || 3000; 

// KRİTİK DÜZELTME: Bu satır, Express'e mevcut dizindeki (index.html, style.css, vs.) 
// TÜM dosyaları tarayıcılara sunmasını söyler. Bu, CSS'in yüklenmesini sağlar.
app.use(express.static(path.join(__dirname)));

// Socket.IO'yu kur ve Render/Prodüksiyon için CORS ayarlarını yap
const io = new Server(server, {
  // Bu ayar, tarayıcıların (özellikle mobil) bağlantı kurmasını garanti eder.
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Ana sayfa isteği geldiğinde index.html dosyasını gönderir.
app.get('/', (req, res) => {
  // path.join ile dosya yolunu güvenli bir şekilde oluştur
  res.sendFile(path.join(__dirname, 'index.html'));
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

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`Fiascco Sunucusu çalışıyor: Port ${PORT}`);
});
