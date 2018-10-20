require('dotenv').load(); // Load env vars
const https = require('https');
const Discord = require('discord.js'); // Discord API
const client = new Discord.Client();  // Sets up client discord client API
const Youtube = require('./src/youtube');
const hostname = 'localhost';
const port = 9999;
const Bot = require('./src/bot');
const { parseBotCommand,
        isConductor,
        formatHelpMessage }  = require('./src/helpers');
const BotHelpers = require('./src/botHelpers');

// Basic web server
const server = https.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World \n');
});

// Log when a connection is made
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

client.on('ready', () => {
  console.log(`Connected as ${ client.user.username }`);
});

// Translate bot commands into method calls
const commandDict = bot => {
  return {
    '$add': () => bot.addSong(), // add song to the back of the queue
    '$skip': () => bot.skipSong(), // stop playing the currently playing and play next song
    '$showQueue': () => bot.showQueue(), // display queue
    '$shuffle': () => bot.toggleShuffleMode(), // toggles shuffle mode
    '$autoplay': () => bot.toggleAutoPlay(),
    '$join': () => bot.joinChannel(),
    '$play': () => bot.play(),
    '$stop': () => bot.stop(),
    '$volume': () => bot.setVolume(),
    '$pause': () => bot.pause(),
    '$resume': () => bot.resume(),
    '$help': () => {
      const commands = [
        '$play <songname>       Play a song or video on Youtube (audio only)',
        '$stop                  Stop playback',
        '$pause                 Pause playback',
        '$resume                Resume playback',
        '$join <channelname>    Join the specified channel (be sure to check your spelling and punctuation)',
        '$volume <volume level> Set volume (ex: 1 [max], .5 [half])'
      ]
      bot.message.reply(BotHelpers.formatHelpMessage(commands));
    }
  };
};

const bot = new Bot(client, Youtube);

client.on('message', message => {
  const guild = client.guilds.get(process.env.GUILD_ID);

  if (!guild.available || message.author.bot) return;

  const conductors = guild.roles.get(process.env.CONDUCTOR_ID).members;
  const command = parseBotCommand(message.content);
  const channels = client.channels;
  const commands = commandDict(bot.setMessage(message));

  if (typeof commands[command] === 'function') {
    // If user has no conductor role 
    if (!conductors.find(conductor => conductor.user.username === message.author.username)) {
      message.reply('Ah ah ah... you didn\'t say the magic word!');
      return;
    } else {
      commands[command]();
    }
  } else if (!commands[command] && command[0] === '$') {
    message.reply('Command not found. Use $help to list available commands.');
  }
});

client.login(process.env.TOKEN);
