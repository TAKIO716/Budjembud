const mineflayer = require('mineflayer');
const Vec3 = require('vec3');

function createBot() {
  const bot = mineflayer.createBot({
    host: 'kalwi.id',
    port: 25565, //port sesuai server
    username: 'SukaTidurAja',
    auth: 'offline', //bot mu akun crack apa premi
    version: '1.18.1', //pake versi suka" lu, gw si 1.18.1
    skipValidation: true,
  });

  bot.on('login', () => {
    console.log('✅ ALT dI Lobby');
  });

  bot.once('spawn', async () => {
    console.log('🎮 ALT Telah Spawn');

    try {
      await delay(3000);
      bot.chat('/login vagar12');
      console.log('🔐 sedang /login');

      await delay(5000);
      bot.chat('/move skyblock'); //pakailah subservernya
      console.log('🌍 /move oneblock');

      await delay(5000);
      bot.chat('/home a'); //untuk home usahakan sethome dlu dari awal | jika takmau make sethome boleh ganti pake /sell all
      console.log('🏠 /home a');

      await delay(10000);
      bot.chat('/tptoggle disable'); //untuk tptoggle supaya gaada yg tp

      // Fungsi Auto Pay di bawah ini sudah dihapus sesuai permintaan

      function autoEquipPickaxe(bot) {
        setInterval(async () => {
          try {
            // Kalau bot tidak memegang netherite_pickaxe
            if (!bot.heldItem || bot.heldItem.name !== 'netherite_axe') {
              const pickaxe = bot.inventory.items().find(item => item.name === 'netherite_axe');
              if (pickaxe) {
                await bot.equip(pickaxe, 'hand');
                console.log('🔧 Auto-equip netherite_axe');
              }
            }
          } catch (err) {
            console.log('⚠️ Gagal equip pickaxe:', err.message);
          }
        }, 1000); // cek tiap 1 detik
      }
      autoEquipPickaxe(bot);

      startBlindMining(bot);
      await delay(7000);
      startAutoSell(bot);

    } catch (e) {
      console.log('❌ Error saat setup:', e.message);
      reconnect(bot);
    }
  });

  bot.on('end', () => {
    console.log('🔌 Bot disconnect, reconnect dalam 5 detik...');
    setTimeout(createBot, 5000);
  });

  bot.on('error', (err) => {
    console.log('❌ Error:', err.message);
  });
}

// Fungsi isInAcidIsland dan ensureInAcidIsland dihapus karena tidak terpakai

function reconnect(bot) {
  try {
    bot.quit();
  } catch {}
  setTimeout(createBot, 5000);
}

// Fungsi Mining TIDAK DIUBAH sesuai permintaan
function startBlindMining(bot) {
  console.log('⛏: Mining 4 arah tanpa lihat');

  const directions = [
    new Vec3(0, 0, 1),   // belakang
    new Vec3(-1, 0, 0),  // kiri
    new Vec3(0, 0, -1),  // depan
    new Vec3(1, 0, 0),   // kanan
  ];

  let directionIndex = 0;

  async function digSide(dir) {
    for (let i = 1; i <= 7; i++) {
      const offset = dir.scaled(i);

      for (let y = -2; y <= 2; y++) {
        const targetPos = bot.entity.position.offset(offset.x, y, offset.z);
        const targetBlock = bot.blockAt(targetPos);

        if (targetBlock && bot.canDigBlock(targetBlock)) {
          try {
            await bot.dig(targetBlock, 'ignore');
          } catch {}
        }
      }

      await delay(30); // Delay tiap blok ke depan
    }
  }

  async function digCycle() {
    while (true) {
      const dir = directions[directionIndex];
      await digSide(dir);
      directionIndex = (directionIndex + 1) % directions.length;
      await delay(90); //delay setiap 1 sisi USAHAKAN PAKE PICK MIRA
    }
  }

  digCycle();
}

function startAutoSell(bot) {
  console.log('💰: Auto /fix all tiap 2 detik');
  setInterval(() => {
    bot.chat('/fix');
  }, 5000); //paling aman si 2 detik JIKA TPS DROP tapi kalau server mengalami down memory penuh/cpu usage minimal [5 detik saja]
}

// Fungsi startBalancePayLoop dihapus karena tidak terpakai dan fitur auto pay

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

createBot();
