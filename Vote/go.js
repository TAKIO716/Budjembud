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

  startBot("a.js");

  await delay(3000);

  startBot("a2.js");

  await delay(3000);
  
  startBot("a3.js");

  await delay(3000);
  
  startBot("a4.js");

  await delay(3000);
  
  startBot("a5.js");

  await delay(3000);
  
  startBot("a6.js");
  
  await delay(3000);
  
  startBot("a7.js");
  
  await delay(3000);
  
  startBot("a8.js");
    
};

runBots();