// server.js

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const path = require('path'); 

const PORT = process.env.PORT || 3000; 

// YENİ: Hakaret Filtresi Ayarları (GLOBAL)
let isProfanityFilterEnabled = true; // Başlangıçta filtre AÇIK
const profanityList = ['oe','oç','amk','aq','nigga','nigger','aw','orospu','orospu evladı','orospu çocuğu','ananı sikiyim','sikiyim'];
const replacement = '***'; 

// YENİ: ADMIN AYARLARI
const ADMIN_SECRET_KEY = "Fiascco_Admin"; // BURAYI KENDİ ŞİFRENİZLE DEĞİŞTİRİN
// Komutlar: /filtre-ac [şifre] veya /filtre-kapat [şifre]

// Spam Engelleme Ayarları (GLOBAL)
const userSendTimes = {}; 
const MESSAGE_INTERVAL_MS = 1000; 

// KRİTİK FIX: Statik dosyaları (style.css dahil) sunması için Express'i ayarla
app.use(express.static(path.join(__dirname)));

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Hakaret Filtreleme Fonksiyonu
function filterMessage(message) {
    if (!isProfanityFilterEnabled) {
        return message; 
    }
    
    let filteredMessage = message;
    for (const word of profanityList) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi'); 
        filteredMessage = filteredMessage.replace(regex, replacement);
    }
    return filteredMessage;
}


// Ana sayfa isteği isteği...
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

  socket.on('typing', (user) => {
      socket.broadcast.emit('typing', user);
  });

  socket.on('stop_typing', (user) => {
      socket.broadcast.emit('stop_typing', user);
  });
  
  // MESAJ GÖNDERME, SPAM VE ADMIN KOMUTU KONTROLÜ
  socket.on('chat message', (msg) => {
    
    // **YENİ: Admin Komutu Kontrolü**
    if (msg.startsWith('/')) {
        const parts = msg.trim().split(/\s+/); // Komut ve şifreyi ayır
        const command = parts[0]; 
        const key = parts[1];
        
        // Şifre doğruysa işleme al
        if (key === ADMIN_SECRET_KEY) {
            let statusMessage = '';
            
            if (command === '/filtre-kapat') {
                isProfanityFilterEnabled = false;
                statusMessage = `[Sistem]: Hakaret filtresi ADMIN tarafından KAPATILDI.`;
            } else if (command === '/filtre-ac') {
                isProfanityFilterEnabled = true;
                statusMessage = `[Sistem]: Hakaret filtresi ADMIN tarafından AÇILDI.`;
            } else {
                statusMessage = `[Sistem]: Geçersiz ADMIN komutu.`;
            }

            // Durum mesajını tüm kullanıcılara gönder
            io.emit('chat message', statusMessage); 
            return; // Komut işlendi, normal mesaj olarak yayınlama
        } else if (command === '/filtre-kapat' || command === '/filtre-ac') {
            io.emit('chat message', '[Sistem]: Geçersiz şifre.');
            return;
        }
    }
    // **Admin Kontrolü Sonu**
    
    
    const now = Date.now();
    
    // 1. Spam kontrolü
    if (userSendTimes[socket.id] && (now - userSendTimes[socket.id] < MESSAGE_INTERVAL_MS)) {
        console.log(`[SPAM BLOK] Kullanıcı ${socket.id} spam yapıyor.`);
        return; 
    }
    
    // 2. Hakaret Filtresi Uygulama
    const filteredMsg = filterMessage(msg); 
    
    // Zamanı güncelle ve FİLTRELENMİŞ mesajı yayınla
    userSendTimes[socket.id] = now; 
    io.emit('chat message', filteredMsg);
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
