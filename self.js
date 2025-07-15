const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');
const TelegramBot = require('node-telegram-bot-api');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = require('mineflayer-pathfinder').goals;

const telegramToken = '7995481536:AAFjf4oGaMK9HR-4oWO2GIa06TO2nwsX1yk';
const chatId = '6105537437';

const botTele = new TelegramBot(telegramToken, { polling: true });

let mcBot;
let autoSellInterval;
let miningInterval;
let autoSellOn = false;
let miningOn = false;
let swingMiningOn = false;
let swingMiningInterval;
let digMiningInterval;
let digMiningOn = false;
let digMiningTimer;
let miningOffset;
let miningPos;
let miningIndex;

async function startNextDig() {
  if (!digMiningOn) return;

  const target = miningPos.plus(miningOffset.scaled(miningIndex)).offset(0, 1, 0);
  const block = mcBot.blockAt(target);

  if (block && mcBot.canDigBlock(block)) {
    try {
      await mcBot.dig(block);
      console.log(`✅ Block ${block.name} di ${target} ke-break`);
    } catch (err) {
      console.log(`❌ Error dig: ${err.message}`);
    }
  }

  miningIndex++;
  if (miningIndex > 5) miningIndex = 1;

  miningPos = mcBot.entity.position.floored();
  startNextDig(); // lanjut langsung tanpa delay
}

function getDigDelay(blockName) {
  switch (blockName) {
    case 'stone':
      return 750;
    case 'iron_ore':
    case 'gold_ore':
    case 'diamond_ore':
    case 'copper_ore':
    case 'lapis_ore':
    case 'redstone_ore':
      return 1500;
    case 'ancient_debris':
      return 25000;
    default:
      return 1500; // default aman
  }
}

function digWithProgress(target, delay) {
  mcBot.swingArm('right');
  mcBot._client.write('block_dig', { status: 0, location: target, face: 1 });

  const startTime = Date.now();

  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    // kirim progress fake packet tiap 50ms
    mcBot._client.write('block_dig', { status: 1, location: target, face: 1 });

    if (elapsed >= delay) {
      clearInterval(progressInterval);
      mcBot._client.write('block_dig', { status: 2, location: target, face: 1 });
    }
  }, 50);
}

function startBot() {
  mcBot = mineflayer.createBot({
    host: 'kalwi.id',
    port: 25565,
    username: 'FyzoOx',
    auth: 'offline',
    version: '1.18.1',
    skipValidation: true
  });

mcBot.loadPlugin(pathfinder);

  mcBot.on('login', () => {
  console.log('✅ Bot login!');
  botTele.sendMessage(chatId, `✅ Bot login sebagai ${mcBot.username}`);

  // Auto login dulu
  setTimeout(() => mcBot.chat('/login bangsat'), 2000);

  // Tunggu 3 detik sebelum move server
  setTimeout(() => {
    mcBot.chat('/move acidisland');
    botTele.sendMessage(chatId, `🗺️ Pindah ke server acidisland`);
  }, 5000);  // 1 detik login + 3 detik jeda = 4000 ms
});

  mcBot.on('spawn', () => {
    const pos = mcBot.entity.position;
    botTele.sendMessage(chatId, `📍 Bot spawn di: ${pos}`);
  });

  mcBot.on('death', () => {
    console.log('💀 Respawn...');
    setTimeout(() => mcBot.emit('respawn'), 500);
  });

  mcBot.on('end', () => {
    console.log('🔄 Reconnecting...');
    clearInterval(autoSellInterval);
    clearInterval(miningInterval);
    setTimeout(startBot, 3000);
  });

  // /chat pesan
  botTele.onText(/\/chat (.+)/, (msg, match) => {
    if (msg.chat.id.toString() !== chatId) return;
    const pesan = match[1];
    mcBot.chat(pesan);
    botTele.sendMessage(chatId, `📨 Chat: ${pesan}`);
  });

// /getid
botTele.onText(/\/getid/, (msg) => {
  botTele.sendMessage(msg.chat.id, `🆔 Chat ID: ${msg.chat.id}`);
});

  // /auto on & /auto off
  botTele.onText(/\/auto (on|off)/, (msg, match) => {
    if (msg.chat.id.toString() !== chatId) return;
    const mode = match[1];
    if (mode === 'on') {
      if (autoSellOn) return botTele.sendMessage(chatId, `ℹ️ Auto sell sudah aktif.`);
      autoSellOn = true;
      autoSellInterval = setInterval(() => {
        if (mcBot && mcBot.player) mcBot.chat('/sell all');
      }, 3000);
      botTele.sendMessage(chatId, `💰 Auto /sell all aktif tiap 3 detik.`);
    } else {
      autoSellOn = false;
      clearInterval(autoSellInterval);
      botTele.sendMessage(chatId, `🛑 Auto /sell all dimatikan.`);
    }
  });

  // /mine on & /mine off
  botTele.onText(/\/mine (on|off)(?: (north|south|east|west))?(?: (\w+))?/, (msg, match) => {
  if (msg.chat.id.toString() !== chatId) return;

  const mode = match[1];
  const arah = match[2];
  const targetNick = match[3]; // nama bot opsional di command

  // Kalau ada target nick, dan bukan nick bot ini, skip command-nya
  if (targetNick && targetNick !== mcBot.username) return;

  if (mode === 'on') {
    if (digMiningOn) return botTele.sendMessage(chatId, `⛏️ ${mcBot.username} mining udah aktif.`);
    if (!arah) return botTele.sendMessage(chatId, `❌ Kasih arah. Contoh: /mine on east ${mcBot.username}`);

    if (!mcBot.heldItem || !mcBot.heldItem.name.includes('pickaxe')) {
      return botTele.sendMessage(chatId, '❌ Bot belum pegang pickaxe!');
    }

    let yaw = 0;

    switch (arah) {
      case 'south': yaw = 0; miningOffset = new Vec3(0, 0, 1); break;
      case 'west':  yaw = Math.PI / 2; miningOffset = new Vec3(-1, 0, 0); break;
      case 'north': yaw = Math.PI; miningOffset = new Vec3(0, 0, -1); break;
      case 'east':  yaw = -Math.PI / 2; miningOffset = new Vec3(1, 0, 0); break;
      default:
        return botTele.sendMessage(chatId, `❌ Arah nggak valid. Pilih: north, south, east, west`);
    }

    mcBot.look(yaw, 0, true);
    digMiningOn = true;
    miningPos = mcBot.entity.position.floored();
    miningIndex = 1;

    startNextDig();
    botTele.sendMessage(chatId, `⛏️ ${mcBot.username} mulai mining ke ${arah}.`);

  } else {
    digMiningOn = false;
    clearTimeout(digMiningTimer);
    botTele.sendMessage(chatId, `🛑 ${mcBot.username} stop mining.`);
  }
});

  // /hadap arah
  botTele.onText(/\/hadap (north|south|east|west)/, (msg, match) => {
    if (msg.chat.id.toString() !== chatId) return;
    const arah = match[1];
    let yaw = 0;
    switch (arah) {
      case 'south': yaw = 0; break;
      case 'west': yaw = Math.PI / 2; break;
      case 'north': yaw = Math.PI; break;
      case 'east': yaw = -Math.PI / 2; break;
    }
    mcBot.look(yaw, 0, true);
    botTele.sendMessage(chatId, `🔄 Bot menghadap ${arah}`);
  });

  // /help
  botTele.onText(/\/help/, (msg) => {
    if (msg.chat.id.toString() !== chatId) return;
    botTele.sendMessage(chatId, `
📜 Daftar Command:
- /chat [pesan] ➝ Kirim chat ke game
- /auto on/off ➝ Auto /sell all tiap 3 detik
- /mine on/off ➝ Auto mining 5 block depan
- /hadap [north|south|east|west] ➝ Menghadap arah
- /help ➝ Lihat command ini
    `);
  });

let lastBalance = 'Belum dicek'; // nyimpen info uang

// Baca chat dari server buat nangkep /bal
mcBot.on('message', (jsonMsg) => {
  const msg = jsonMsg.toString();
  if (msg.includes('Balance')) {
    lastBalance = msg;
    botTele.sendMessage(chatId, `💰 ${msg}`);
  }
});

// /info buat kirim status bot ke Telegram
botTele.onText(/\/info/, (msg) => {
  if (msg.chat.id.toString() !== chatId) return;

  const pos = mcBot.entity.position;
  const health = mcBot.health;
  const hunger = mcBot.food;
  const yaw = mcBot.entity.yaw;
  let arah = '';

  if (yaw >= -Math.PI / 4 && yaw < Math.PI / 4) arah = 'South';
  else if (yaw >= Math.PI / 4 && yaw < (3 * Math.PI) / 4) arah = 'West';
  else if (yaw >= -(3 * Math.PI) / 4 && yaw < -Math.PI / 4) arah = 'East';
  else arah = 'North';

  const inventoryItems = mcBot.inventory.items();
  const itemList = inventoryItems.map(i => `${i.count}x ${i.name}`).join(', ') || 'Kosong';


  // Kirim command /bal buat ambil saldo terbaru
  mcBot.chat('/bal');

  // Kirim info ke Telegram
botTele.sendMessage(chatId, `
📊 Status Bot:
📍 Posisi: ${pos}
🧭 Menghadap: ${arah}
❤️ Health: ${health}
🍗 Hunger: ${hunger}
🎒 Inventory: ${inventoryItems.length} item
📦 Isi: ${itemList}
💰 Uang (last): ${lastBalance}
`);
});

// /move x y z
botTele.onText(/\/move (-?\d+\.?\d*) (-?\d+\.?\d*) (-?\d+\.?\d*)/, (msg, match) => {
  if (msg.chat.id.toString() !== chatId) return;

  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);
  const z = parseFloat(match[3]);

  mcBot.pathfinder.setGoal(new GoalNear(x, y, z, 0.2)); // 0.2 tolerance super dekat

  botTele.sendMessage(chatId, `📍 Menuju ke ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
});

// /xp
botTele.onText(/\/xp/, (msg) => {
  if (msg.chat.id.toString() !== chatId) return;

  if (mcBot.player) {
    const xpLevel = mcBot.experience.level;
    botTele.sendMessage(chatId, `📊 Level XP bot saat ini: ${xpLevel}`);
  } else {
    botTele.sendMessage(chatId, '⚠️ Bot belum online.');
  }
});

// /hold
botTele.onText(/\/hold (.+)/, (msg, match) => {
  if (msg.chat.id.toString() !== chatId) return;
  const itemName = match[1];
  const item = mcBot.inventory.items().find(i => i.name === itemName);

  if (item) {
    mcBot.equip(item, 'hand').then(() => {
      botTele.sendMessage(chatId, `✅ Memegang item: ${item.name}`);
    }).catch(() => {
      botTele.sendMessage(chatId, `❌ Gagal memegang item.`);
    });
  } else {
    botTele.sendMessage(chatId, `❌ Item ${itemName} tidak ditemukan di inventory.`);
  }
});

// /qall
botTele.onText(/\/qall/, (msg) => {
  if (msg.chat.id.toString() !== chatId) return;

  const items = mcBot.inventory.items();
  if (items.length === 0) {
    return botTele.sendMessage(chatId, `📦 Inventory kosong.`);
  }

  items.forEach(item => {
    mcBot.tossStack(item).catch(()=>{});
  });

  botTele.sendMessage(chatId, `🗑️ Semua item dibuang dari inventory.`);
});



}

startBot();
