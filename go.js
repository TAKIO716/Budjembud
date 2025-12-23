const { spawn } = require("child_process");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startBot = (filename) => {

  console.log(`Menjalankan ${filename}...`);

  const bot = spawn("node", [filename], { stdio: "inherit" });

  bot.on("close", (code) => {

    console.log(`${filename} selesai dengan code ${code}`);

  });

};

const runBots = async () => {

  startBot("fycafk2.js");

  await delay(3000);

  startBot("afkair.js");

  await delay(3000);
  
  startBot("afkair2.js");

  await delay(3000);
  
  startBot("afkair3.js");

  await delay(3000);
  
  startBot("afkair4.js");

  await delay(3000);
  
  startBot("afkair5.js");

  await delay(3000);

  startBot("afkair6.js");

  await delay(3000);
  
  startBot("afkair7.js");

  await delay(3000);
  
  startBot("afkair8.js");

  await delay(3000);
  
  startBot("afkair9.js");

  await delay(3000);
    
};

runBots();