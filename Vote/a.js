const mineflayer = require('mineflayer')

const names = [
  'Alex','Steve','Daniel','Michael','James','Robert','David','John',
  'Chris','Mark','Andrew','Kevin','Ryan','Jason','Brian','Lucas',
  'Noah','Ethan','Liam','Oliver','Leo','Mateo','Santiago','Juan',
  'Carlos','Diego','Miguel','Ivan','Dmitry','Sergey','Andrei',
  'Yuki','Kenji','Hiro','Takeshi','Akira','Minho','Jisoo','Taeyang',
  'Ahmed','Omar','Hassan','Ali','Yusuf','Amir','Adam','Zayn'
]

function randomName() {
  return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 999)
}

const delay = ms => new Promise(res => setTimeout(res, ms))

async function startBot() {
  const username = randomName()
  console.log(`\n[BOOT] Starting bot: ${username}`)

  const bot = mineflayer.createBot({
    host: 'play.kampungeles.id',
    username,
    version: '1.18.1',
    skipValidation: true
  })

  bot.once('spawn', async () => {
    console.log('[SPAWN] Bot spawned')

    await delay(2000)
    console.log('[CMD] /register alt123 alt123')
    bot.chat('/register alt123 alt123')

    await delay(3000)
    console.log('[CMD] /move tycoon')
    bot.chat('/move tycoon')

    await delay(4000)
    console.log('[CMD] /is rate AsKqanaa')
    bot.chat('/is rate AsKqanaa')
  })

  // DEBUG CHAT
  bot.on('message', msg => {
    console.log('[CHAT]', msg.toString())
  })

  // GUI / CHEST DEBUG
  bot.on('windowOpen', async (window) => {
    console.log('\n[GUI OPENED]')
    console.log('Type  :', window.type)
    console.log('Title :', window.title)
    console.log('Slots :', window.slots.length)

    const slot7 = window.slots[7]
    console.log('[SLOT 7]', slot7 ? slot7.name + ' x' + slot7.count : 'EMPTY')

    try {
      await delay(1000)
      console.log('[ACTION] Clicking slot 7')
      bot.clickWindow(7, 0, 0)

      await delay(1000)
      console.log('[ACTION] Closing chest')
      bot.closeWindow(window)

      await delay(1000)
      console.log('[QUIT] Disconnecting bot')
      bot.quit()
    } catch (e) {
      console.log('[ERROR GUI]', e.message)
      bot.quit()
    }
  })

  bot.on('end', (reason) => {
    console.log(`[END] Bot disconnected | Reason: ${reason}`)
    setTimeout(startBot, 3000)
  })

  bot.on('kicked', reason => {
    console.log('[KICKED]', reason)
  })

  bot.on('error', err => {
    console.log('[ERROR]', err.message)
  })
}

startBot()
