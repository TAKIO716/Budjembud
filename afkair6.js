const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

// Deklarasi interval variables
let serverCheckInterval = null;
const SPAWN_POSITION = { x: 0, y: 99, z: -16 }; // Posisi referensi
const SEARCH_RADIUS = 20; // Radius pencarian air dari spawn position
const SERVER_CHECK_INTERVAL_MS = 5000; // 5 detik

function createBot() {
  const bot = mineflayer.createBot({
    host: 'play.kampungeles.id',
    port: 25565,
    username: 'KyaNaaV6',
    auth: 'offline',
    version: '1.18.1',
    skipValidation: true
  });

  // Load pathfinder plugin
  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log('✅ Bot berhasil login ke server.');
  });

  bot.once('spawn', () => {
    console.log('🎮 Bot sudah spawn.');

    // Langkah 1: Kirim /login
    setTimeout(() => {
      if (!bot || !bot.player) return;
      bot.chat('/login alt123');
      console.log('🔐 Kirim: /login');

      // Langkah 2: /move tycoon
      setTimeout(() => {
        if (!bot || !bot.player) return;
        bot.chat('/move tycoon');
        console.log('🌍 Kirim: /move tycoon');

        // Langkah 3: Cari dan pergi ke air terdekat
        setTimeout(() => {
          if (!bot || !bot.player) return;
          findAndGoToNearestWater(bot);
          
          // Start server check loop
          startServerCheck(bot);
          console.log('✅ Bot siap dan monitoring aktif!');
        }, 3000); // Tunggu /move selesai
      }, 3000); // Tunggu login selesai
    }, 3000); // Tunggu spawn selesai
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
      createBot(); // 🔁 Reconnect ulang dari awal
    }, 5000);
  });

  // Log chat dari game ke console
  bot.on('message', (message) => {
    const msg = message.toString();
    console.log('📨 Chat:', msg);
  });

  return bot;
}

function findAndGoToNearestWater(bot) {
  try {
    console.log('💧 Mencari genangan air terdekat...');
    
    // Posisi referensi untuk pencarian
    const refPos = new Vec3(SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z);
    let nearestWater = null;
    let minDistance = Infinity;

    // Cari air dalam radius
    for (let x = -SEARCH_RADIUS; x <= SEARCH_RADIUS; x++) {
      for (let y = -5; y <= 5; y++) { // Cari di range Y yang wajar
        for (let z = -SEARCH_RADIUS; z <= SEARCH_RADIUS; z++) {
          const pos = refPos.offset(x, y, z);
          const block = bot.blockAt(pos);
          
          if (block && block.name === 'water') {
            // Cek apakah ini genangan 1 block (air dengan block solid di bawahnya)
            const blockBelow = bot.blockAt(pos.offset(0, -1, 0));
            const blockAbove = bot.blockAt(pos.offset(0, 1, 0));
            
            // Pastikan ada ground di bawah dan bukan air dalam (air di atas juga air)
            if (blockBelow && blockBelow.name !== 'water' && blockBelow.name !== 'air' &&
                (!blockAbove || blockAbove.name === 'air')) {
              
              const distance = pos.distanceTo(refPos);
              if (distance < minDistance) {
                minDistance = distance;
                nearestWater = pos;
              }
            }
          }
        }
      }
    }

    if (nearestWater) {
      console.log(`💧 Menemukan air di: X=${nearestWater.x}, Y=${nearestWater.y}, Z=${nearestWater.z}`);
      console.log(`📏 Jarak dari spawn: ${minDistance.toFixed(2)} block`);
      goToPosition(bot, nearestWater);
    } else {
      console.log('⚠️ Tidak menemukan genangan air, tetap di posisi spawn');
      const fallbackPos = new Vec3(SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z);
      goToPosition(bot, fallbackPos);
    }
    
  } catch (err) {
    console.error('❌ Error saat mencari air:', err.message);
  }
}

function goToPosition(bot, targetPos) {
  try {
    console.log(`🎯 Menuju koordinat: X=${targetPos.x}, Y=${targetPos.y}, Z=${targetPos.z}`);
    
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    movements.canDig = false; // Jangan menggali block
    movements.allow1by1towers = false; // Jangan membuat tower
    bot.pathfinder.setMovements(movements);
    
    // Target: berdiri TEPAT di posisi air
    const goal = new goals.GoalBlock(targetPos.x, targetPos.y, targetPos.z);
    bot.pathfinder.setGoal(goal);
    
    bot.once('goal_reached', () => {
      console.log('✅ Bot sudah sampai dan berdiri di air! AFK mode aktif.');
    });
    
    // Timeout jika pathfinding gagal
    setTimeout(() => {
      if (bot.pathfinder.isMoving()) {
        console.log('⚠️ Pathfinding timeout, mencoba pendekatan alternatif');
        bot.pathfinder.setGoal(null);
        
        // Coba goal yang lebih fleksibel
        const nearGoal = new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 1);
        bot.pathfinder.setGoal(nearGoal);
      }
    }, 15000); // 15 detik timeout
    
  } catch (err) {
    console.error('❌ Error saat pergi ke koordinat:', err.message);
  }
}

function startServerCheck(bot) {
  if (serverCheckInterval) clearInterval(serverCheckInterval);
  console.log('🔍 Starting server check loop');
  
  serverCheckInterval = setInterval(() => {
    if (!bot || !bot.player || !bot.inventory) {
      console.log('⚠️ Bot tidak tersedia, skip check');
      return;
    }
    
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
        
        setTimeout(() => {
          if (bot && bot.player) {
            console.log('🎯 Kembali ke air setelah dari lobby');
            findAndGoToNearestWater(bot);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Error saat check inventory:', err.message);
    }
  }, SERVER_CHECK_INTERVAL_MS);
}

function cleanup() {
  if (serverCheckInterval) {
    clearInterval(serverCheckInterval);
    serverCheckInterval = null;
    console.log('🧹 Server check loop dibersihkan');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Bot dihentikan oleh user');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  cleanup();
});

// Jalankan bot pertama kali
createBot();