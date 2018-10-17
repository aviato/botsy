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
    '$join': () => {
      return bot.joinChannel();
    },
    '$play': () => {
      return bot.playYoutubeSong()
    },
    '$stop': () => {
      return bot.stopYoutubePlayback();
    },
    '$volume': () => {
      return bot.setYoutubeVolume();
    },
    '$pause': () => {
      return bot.pauseYoutubeVideo();
    },
    '$resume': () => {
      return bot.resumeYoutubeVideo();
    },
    '$help': () => {
      const commands = [
        '$play [songname] | play a song or video (audio only)',
        '$stop | stops playback of the current song',
        '$pause | pauses playback of the current song',
        '$resume | resumes playback of the current song',
        '$join [channelname] | join the specified channel (be sure to check your spelling - damn lazy programmer...)',
        '$volume [volumelevel - ex. 1 (full volume), ex. .5 (half volume)] | sets the volume of the current song'
      ]
      message.reply(formatHelpMessage(commands));
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
