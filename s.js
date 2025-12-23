const mineflayer = require('mineflayer');

// Fungsi untuk menghasilkan username acak
function generateRandomUsername() {
  const prefix = '404_';
  const randomNum = Math.floor(Math.random() * 100000); // Angka acak 0-99999
  return prefix + randomNum;
}

// Fungsi utama untuk menjalankan siklus bot
async function runBotCycle() {
  // Loop tanpa henti
  while (true) {
    const username = generateRandomUsername();
    console.log(`[${new Date().toLocaleTimeString()}] Mencoba membuat bot dengan nama: ${username}`);

    // Membuat instance bot baru
    const bot = mineflayer.createBot({
      host: 'play.kampungeles.id', // Alamat server
      port: 25565,                 // Port server (biasanya 25565)
      version: '1.18.1',           // Versi Minecraft
      username: username,          // Username yang sudah diacak
      skipValidation: true,        // Sesuai permintaan
      auth: 'offline'              // Penting! Karena server menggunakan register/login
    });

    // Promise untuk menunggu sampai bot selesai siklusnya (baik berhasil maupun error)
    await new Promise((resolve, reject) => {
      // Event saat bot berhasil login
      bot.on('login', () => {
        console.log(`[${username}] Berhasil masuk ke server.`);

        // Jeda 1 detik sebelum register, agar bot siap menerima perintah
        setTimeout(() => {
          console.log(`[${username}] Melakukan /register...`);
          bot.chat('/register bot123 bot123');
        }, 1000);

        // Jeda 2 detik setelah register, lalu lakukan /move
        setTimeout(() => {
          console.log(`[${username}] Melakukan /move tycoon...`);
          bot.chat('/move tycoon');
        }, 3000); // 1 detik (sebelumnya) + 2 detik (jeda)

        // Jeda 3 detik setelah /move, lalu keluar
        setTimeout(() => {
          console.log(`[${username}] Siklus selesai, akan keluar dari server.`);
          bot.end();
        }, 6000); // 3 detik (sebelumnya) + 3 detik (jeda)
      });

      // Event jika bot terputus (baik secara sengaja atau tidak)
      bot.on('end', (reason) => {
        console.log(`[${username}] Keluar dari server. Alasan: ${reason || 'Tidak ada alasan'}`);
        resolve(); // Selesaikan promise agar loop bisa berlanjut
      });

      // Event jika terjadi error (misalnya koneksi gagal, bot dikick)
      bot.on('error', (err) => {
        console.error(`[${username}] Terjadi error: ${err.message}`);
        // Jika error, kita juga selesaikan promise agar bot bisa mencoba lagi dengan nama baru
        resolve(); 
      });
    });

    // Jeda 5 detik sebelum membuat bot baru, agar tidak terlalu spam
    console.log('Menunggu 5 detik sebelum membuat bot baru...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Menjalankan fungsi utama
runBotCycle().catch(console.error);
