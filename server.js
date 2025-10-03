// server.js

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const path = require('path'); 

const PORT = process.env.PORT || 3000; 

// YENİ: Spam Engelleme (Anti-Spam) Ayarları (GLOBAL)
// Bu değişken, her kullanıcının son mesaj gönderme zamanını tutar.
const userSendTimes = {}; 
// Bu değişken, mesajlar arası minimum süreyi (milisaniye cinsinden) tanımlar.
const MESSAGE_INTERVAL_MS = 1000; // 1000 milisaniye = 1 saniye

// KRİTİK FIX: Statik dosyaları (style.css dahil) sunması için Express'i ayarla
app.use(express.static(path.join(__dirname)));

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Ana sayfa isteği geldiğinde index.html dosyasını gönderir.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO bağlantısı kurulduğunda çalışacak kısım
io.on('connection', (socket) => {
  
  const updateOnlineCount = () => {
    const count = io.engine.clientsCount; 
    io.emit('online_count', count); 
  };

  console.log('Yeni bir kullanıcı bağlandı');
  updateOnlineCount(); 

  // YAZIYOR SİNYALİ
  socket.on('typing', (user) => {
      socket.broadcast.emit('typing', user);
  });

  // YAZMAYI BIRAKTI SİNYALİ
  socket.on('stop_typing', (user) => {
      socket.broadcast.emit('stop_typing', user);
  });
  
  // MESAJ GÖNDERME ve SPAM KONTROLÜ
  socket.on('chat message', (msg) => {
    const now = Date.now();
    
    // Spam kontrolü
    if (userSendTimes[socket.id] && (now - userSendTimes[socket.id] < MESSAGE_INTERVAL_MS)) {
        console.log(`[SPAM BLOK] Kullanıcı ${socket.id} spam yapıyor.`);
        return; // Spam ise mesajı yayınlamadan çık
    }
    
    // Zamanı güncelle ve mesajı yayınla
    userSendTimes[socket.id] = now; 
    io.emit('chat message', msg);
  });

  // Bir kullanıcı ayrıldığında
  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı');
    updateOnlineCount(); 
  });
});

server.listen(PORT, () => {
  console.log(`Fiascco Sunucusu çalışıyor: Port ${PORT}`);
});
