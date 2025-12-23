const mineflayer = require('mineflayer');
const TelegramBot = require('node-telegram-bot-api');
const Vec3 = require('vec3');

// ============================================
// CONFIGURATION
// ============================================
const TELEGRAM_TOKEN = '8254154333:AAGqvoXsDhiW5rsfp5S6gvn665sClOkwAiU';
const TELEGRAM_CHAT_ID = '6296519503';

const POSITION_CHECK_INTERVAL_MS = 10000; // 10 detik
const SERVER_CHECK_INTERVAL_MS = 10000;   // 10 detik
const POSITION_TOLERANCE = 50;            // 50 block
const COORDINATE_SAVE_TOLERANCE = 5;      // Toleransi 5 block untuk save koordinat
const TELEGRAM_SPAM_INTERVAL_MS = 3000;   // 3 detik
const MINECRAFT_SPAM_INTERVAL_MS = 7000;  // 7 detik

// ============================================
// GLOBAL STATE
// ============================================
let positionCheckInterval = null;
let serverCheckInterval = null;
let telegramSpamInterval = null;
let minecraftSpamInterval = null;

let savedIslandPosition = null;
let islandPositionSaved = false;
let eventActive = false;
let eventStartTime = null;

// ============================================
// TELEGRAM BOT INITIALIZATION
// ============================================
const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// ============================================
// HELPER FUNCTIONS
// ============================================
function saveIslandCoordinates(bot) {
  if (!bot || !bot.entity || !bot.entity.position) return;
  
  const currentPos = bot.entity.position;
  const newCoords = {
    x: Math.floor(currentPos.x),
    y: Math.floor(currentPos.y),
    z: Math.floor(currentPos.z)
  };
  
  // Jika belum ada koordinat tersimpan, langsung simpan
  if (!savedIslandPosition) {
    savedIslandPosition = newCoords;
    islandPositionSaved = true;
    console.log(`📍 Koordinat island tersimpan: X=${newCoords.x}, Y=${newCoords.y}, Z=${newCoords.z}`);
    return;
  }
  
  // Hitung jarak dari koordinat lama
  const distance = Math.sqrt(
    Math.pow(currentPos.x - savedIslandPosition.x, 2) +
    Math.pow(currentPos.y - savedIslandPosition.y, 2) +
    Math.pow(currentPos.z - savedIslandPosition.z, 2)
  );
  
  // Hanya update jika jarak > toleransi
  if (distance > COORDINATE_SAVE_TOLERANCE) {
    savedIslandPosition = newCoords;
    console.log(`📍 Koordinat island diperbarui: X=${newCoords.x}, Y=${newCoords.y}, Z=${newCoords.z} (jarak: ${Math.floor(distance)} block)`);
  } else {
    console.log(`📍 Koordinat tidak diupdate (jarak: ${Math.floor(distance)} block < toleransi ${COORDINATE_SAVE_TOLERANCE})`);
  }
}
function startTelegramSpam() {
  if (telegramSpamInterval) return;
  
  console.log('📱 Memulai spam Telegram...');
  
  // Kirim segera
  sendTelegramMessage('🚨 250% EVENT SUDAH DIMULAI 🚨');
  
  // Lalu spam setiap 3 detik
  telegramSpamInterval = setInterval(() => {
    if (!eventActive) {
      stopTelegramSpam();
      return;
    }
    sendTelegramMessage('🚨 250% EVENT SUDAH DIMULAI 🚨');
  }, TELEGRAM_SPAM_INTERVAL_MS);
}

function stopTelegramSpam() {
  if (telegramSpamInterval) {
    clearInterval(telegramSpamInterval);
    telegramSpamInterval = null;
    console.log('📱 Spam Telegram dihentikan');
  }
}

function startMinecraftSpam(bot) {
  if (minecraftSpamInterval) return;
  
  console.log('💬 Memulai spam Minecraft chat...');
  
  // Kirim segera
  bot.chat('/is tc 250% SELL EVENT');
  
  // Lalu spam setiap 7 detik
  minecraftSpamInterval = setInterval(() => {
    if (!eventActive || !bot || !bot.player) {
      stopMinecraftSpam();
      return;
    }
    bot.chat('/is tc 250% SELL EVENT');
  }, MINECRAFT_SPAM_INTERVAL_MS);
}

function stopMinecraftSpam() {
  if (minecraftSpamInterval) {
    clearInterval(minecraftSpamInterval);
    minecraftSpamInterval = null;
    console.log('💬 Spam Minecraft chat dihentikan');
  }
}

function sendTelegramMessage(text) {
  telegramBot.sendMessage(TELEGRAM_CHAT_ID, text).catch(err => {
    console.error('❌ Error kirim Telegram:', err.message);
  });
}

// ============================================
// BOT CREATION
// ============================================
function createBot() {
  const bot = mineflayer.createBot({
    host: 'play.kampungeles.id',
    port: 25565,
    username: 'KyaNaaV1',
    auth: 'offline',
    version: '1.18.1',
    skipValidation: true
  });

  bot.on('login', () => {
    console.log('✅ Bot berhasil login ke server.');
  });

  bot.once('spawn', () => {
    console.log('🎮 Bot sudah spawn.');

    setTimeout(() => {
      if (!bot || !bot.player) return;
      bot.chat('/login alt123');
      console.log('🔐 Kirim: /login alt123');

      setTimeout(() => {
        if (!bot || !bot.player) return;
        bot.chat('/move tycoon');
        console.log('🌍 Kirim: /move tycoon');

        setTimeout(() => {
          if (!bot || !bot.player) return;
          bot.chat('/is');
          console.log('🏠 Kirim: /is');

          setTimeout(() => {
            if (bot && bot.player && bot.entity && bot.entity.position) {
              saveIslandCoordinates(bot);
              
              startPositionCheck(bot);
              startServerCheck(bot);
              console.log('✅ Bot siap dan monitoring aktif!');
            }
          }, 3000);
        }, 3000);
      }, 3000);
    }, 3000);
  });

  bot.on('error', (err) => {
    console.error('❌ Error:', err.message);
    cleanup();
  });

  bot.on('kicked', (reason) => {
    console.log('⚠️ Bot di-kick dari server:', reason);
    cleanup();
  });

  bot.on('end', () => {
    console.log('🔌 Bot disconnect. Coba reconnect 5 detik lagi...');
    cleanup();
    setTimeout(() => {
      createBot();
    }, 5000);
  });

  bot.on('message', (message) => {
    const msg = message.toString();
    
    // ========================================
    // DETEKSI EVENT START
    // ========================================
    if (msg.includes('A 250% sᴇʟʟ ᴘʀɪᴄᴇ ᴇᴠᴇɴᴛ has started! It ends in 03:00 seconds!')) {
      console.log('🎉 EVENT 250% SELL DIMULAI!');
      eventActive = true;
      eventStartTime = Date.now();
      
      // Mulai spam sistem
      startTelegramSpam();
      startMinecraftSpam(bot);
    }
    
    // ========================================
    // DETEKSI EVENT END
    // ========================================
    if (msg.includes('A 250% sᴇʟʟ ᴘʀɪᴄᴇ ᴇᴠᴇɴᴛ has ended!')) {
      console.log('🛑 EVENT 250% SELL BERAKHIR!');
      eventActive = false;
      eventStartTime = null;
      
      // Hentikan spam
      stopTelegramSpam();
      stopMinecraftSpam();
      
      // Kirim notifikasi selesai
      bot.chat('/is chat 250% SELL DAH HABIS!');
      console.log('📢 Kirim: /is chat 250% SELL DAH HABIS!');
    }
  });

  return bot;
}

// ============================================
// POSITION CHECK
// ============================================
function startPositionCheck(bot) {
  if (positionCheckInterval) clearInterval(positionCheckInterval);
  console.log(`📍 Starting position check loop every ${POSITION_CHECK_INTERVAL_MS / 1000} detik`);
  
  positionCheckInterval = setInterval(() => {
    if (!bot || !bot.player || !bot.entity || !bot.entity.position) return;
    if (!islandPositionSaved || !savedIslandPosition) return;

    try {
      const currentPos = bot.entity.position;
      const distance = Math.sqrt(
        Math.pow(currentPos.x - savedIslandPosition.x, 2) +
        Math.pow(currentPos.y - savedIslandPosition.y, 2) +
        Math.pow(currentPos.z - savedIslandPosition.z, 2)
      );

      console.log(`📍 Posisi: X=${Math.floor(currentPos.x)}, Y=${Math.floor(currentPos.y)}, Z=${Math.floor(currentPos.z)} | Jarak: ${Math.floor(distance)} block`);

      if (distance > POSITION_TOLERANCE) {
        console.log(`⚠️ Bot terlalu jauh dari island, kirim /is`);
        bot.chat('/is');
      }
    } catch (err) {
      console.error('❌ Error saat check position:', err.message);
    }
  }, POSITION_CHECK_INTERVAL_MS);
}

// ============================================
// SERVER CHECK (LOBBY DETECTION)
// ============================================
function startServerCheck(bot) {
  if (serverCheckInterval) clearInterval(serverCheckInterval);
  
  serverCheckInterval = setInterval(() => {
    if (!bot || !bot.player || !bot.inventory) return;
    
    try {
      const hotbarItems = [];
      for (let i = 36; i <= 44; i++) {
        const item = bot.inventory.slots[i];
        if (item) hotbarItems.push(item.name);
      }
      
      const lobbyItems = ['compass', 'book', 'amethyst_shard', 'chest', 'diamond_sword', 'clock'];
      const hasLobbyItem = hotbarItems.some(i => lobbyItems.includes(i));
      
      if (hasLobbyItem) {
        console.log('⚠️ Terdeteksi di lobby, kirim /move tycoon');
        bot.chat('/move tycoon');
        
        // Reset event state
        eventActive = false;
        stopTelegramSpam();
        stopMinecraftSpam();
        
        setTimeout(() => {
          if (bot && bot.player) {
            bot.chat('/is');
            console.log('🏠 Kembali ke island setelah dari lobby');
            
            setTimeout(() => {
              if (bot && bot.entity && bot.entity.position && islandPositionSaved) {
                saveIslandCoordinates(bot);
              }
            }, 2000);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Error saat check inventory:', err.message);
    }
  }, SERVER_CHECK_INTERVAL_MS);
}

// ============================================
// CLEANUP
// ============================================
function cleanup() {
  if (positionCheckInterval) {
    clearInterval(positionCheckInterval);
    positionCheckInterval = null;
  }
  if (serverCheckInterval) {
    clearInterval(serverCheckInterval);
    serverCheckInterval = null;
  }
  
  stopTelegramSpam();
  stopMinecraftSpam();
  
  savedIslandPosition = null;
  islandPositionSaved = false;
  eventActive = false;
  eventStartTime = null;
}

// ============================================
// PROCESS HANDLERS
// ============================================
process.on('SIGINT', () => {
  console.log('\n👋 Bot dihentikan oleh user');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  cleanup();
});

// ============================================
// START BOT
// ============================================
createBot();