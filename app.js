require('dotenv').load(); // Load env vars
const http          = require('http');
const Discord       = require('discord.js'); // Discord API
const ytdl          = require('ytdl-core');  // Stream youtube mp3
const bot           = new Discord.Client();  // Sets up bot discord client API
const youtube       = require('./youtube');
const hostname      = 'localhost';
const port          = 9999;
const token         = process.env.TOKEN;
const streamOptions = { seek: 0, volume: 0.5 };
const dispatcher    = {}; // Stores reference to the mp3
const yt            = youtube(process.env.YOUTUBE_API_KEY);
const { parseCommand,
        parseVoiceChannelName,
        parseSong,
        playSong,
        setVolume,
        joinChannel,
        isConductor }  = require('./helpers');
const getSearchResults = require('./getSearchResults');

// Basic web server
const server = http.createServer( ( req, res ) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World \n');
});

// Log when a connection is made
server.listen( port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

bot.on('ready', () => {
  console.log(`Login in as ${ bot.user.username }`);
});

const Commands = ({ bot, ytdl, streamOptions, dispatcher, message }) => {
  return {
    '$join': function() {
      joinChannel(bot, parseVoiceChannelName(message), message);
    },
    '$play': function() {
      let song = parseSong(message.content);
      getSearchResults(
        playSong,
        yt.generateSearchUri(song),
        yt.generateVideoLink,
        message,
        dispatcher,
        bot.channels,
        ytdl,
        streamOptions
      );
    },
    '$stop': function() {
      if (dispatcher.song) {
        dispatcher.song.end();
      }
    },
    '$volume': function() {
      setVolume(streamOptions, message.content.split(' ')[1]);
    }
  };
};

bot.on('message', message => {
  const theMatrix  = bot.guilds.get(process.env.MATRIX_GUILD_ID);
  const conductors = theMatrix.roles.get(process.env.CONDUCTOR_ID).members;
  const command    = parseCommand(message.content);
  const channels   = bot.channels; // Collection of channels

  if (!conductors.find(conductor => conductor.user.username === message.author.username)) {
    return;
  }

  const isUndefined = value => value === undefined;
  const anyUndefined = (object, keyNames) => {
    for (let i = 0, keyName = keyNames[i]; i < keyNames.length; i++) {
      if (isUndefined(object[keyName])) {
        return true;
      }
    }
    return false;
  };

  const commands = Commands({
    bot,
    ytdl,
    streamOptions,
    dispatcher,
    message
  });

  if (typeof commands[command] === 'function') {
    commands[command](channels);
  }

});

bot.login(token);
