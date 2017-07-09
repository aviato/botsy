require('dotenv').load(); // Load env vars
const https = require('https');
const Discord = require('discord.js'); // Discord API
const client = new Discord.Client();  // Sets up client discord client API
const Youtube = require('./youtube');
const hostname = 'localhost';
const port = 9999;
const Bot = require('./bot');
const { parseBotCommand,
        isConductor,
        formatHelpMessage }  = require('./helpers');

// Basic web server
const server = https.createServer( ( req, res ) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World \n');
});

// Log when a connection is made
server.listen( port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

client.on('ready', () => {
  console.log(`Connected as ${ client.user.username }`);
});

// Translate bot commands into method calls
const commandDict = (bot, message) => {
  return {
    '$join': function() {
      return bot.setMessage(message).joinChannel(client);
    },
    '$play': function() {
      return bot.setMessage(message).playYoutubeSong()
    },
    '$stop': function() {
      //console.log('here is the... bot instance?', bot.setMessage(message));
      return bot.setMessage(message).stopYoutubePlayback();
    },
    '$volume': function() {
      return bot.setMessage(message).setYoutubeVolume();
    },
    '$pause': function() {
      return bot.setMessage(message).pauseYoutubeVideo();
    },
    '$resume': function() {
      return bot.setMessage(message).resumeYoutubeVideo();
    },
    '$help': function() {
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
  const command    = parseBotCommand(message.content);
  const channels   = client.channels;

  if (!conductors.find(conductor => conductor.user.username === message.author.username)) {
    message.reply('Ah ah ah... you didn\'t say the magic word!');
    return;
  }

  const commands = commandDict(bot, message);

  if (typeof commands[command] === 'function') {
    commands[command]();
  } else if (!commands[command] && command[0] === '$') {
    message.reply('Command not found. Use $help to list available commands.');
  }
});

client.login(process.env.TOKEN);
