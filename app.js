require('dotenv').load(); // Load env vars
const http             = require('http');
const querystring      = require('querystring');
const Discord          = require('discord.js'); // Discord API
const ytdl             = require('ytdl-core');  // Stream youtube mp3s
const client              = new Discord.Client();  // Sets up client discord client API
const youtube          = require('./youtube');
const hostname         = 'localhost';
const port             = 9999;
const token            = process.env.TOKEN;
const streamOptions    = { seek: 0, volume: .07 };
const dispatcher       = {}; // Stores reference to the mp3 stream
const yt               = youtube(process.env.YOUTUBE_API_KEY, querystring);
const getSearchResults = require('./getSearchResults');
const { parseCommand,
        parseVoiceChannelName,
        parseSong,
        playSong,
        volumeLevel,
        joinChannel,
        isConductor,
        formatHelpMessage }  = require('./helpers');


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

client.on('ready', () => {
  console.log(`Login in as ${ client.user.username }`);
});

const BotGenerator = ({ client, ytdl, streamOptions, dispatcher }) => {
  return message => {
    return {
      '$join': function() {
        joinChannel(client, parseVoiceChannelName(message), message);
      },
      '$play': function() {
        let song = parseSong(message.content);
        getSearchResults(
          playSong,
          yt.generateSearchUri(song),
          yt.generateVideoLink,
          message,
          dispatcher,
          client.channels,
          ytdl,
          streamOptions
        );
      },
      '$stop': function() {
        if (dispatcher.stream) {
          dispatcher.stream.end();
        }
      },
      '$volume': function() {
        const newLevel = volumeLevel(message.content);

        if (newLevel > 1) {
          message.reply(`${ newLevel } is far too loud. 0-1 is a good range.`);
          return;
        } else if (isNaN(newLevel)) {
          message.reply(`Your volume level wasn't a number. Try again!`);
          return;
        }

        if (dispatcher.stream) {
          // Sets the volume relative to the input stream
          // 1 is normal, 0.5 is half, 2 is double.
          dispatcher.stream.setVolume(newLevel);
        }
      },
      '$pause': function() {
        if (dispatcher.stream) {
          dispatcher.stream.pause();
          message.reply('Song paused. Use $resume to resume playback');
        }
      },
      '$resume': function() {
        if (dispatcher.stream) {
          dispatcher.stream.resume();
          message.reply('Resuming playback!');
        }
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
};

const botGenerator = BotGenerator({
  client,
  ytdl,
  streamOptions,
  dispatcher
});

client.on('message', message => {
  const guild = client.guilds.get(process.env.GUILD_ID);

  if (!guild.available || message.author.bot) return;

  const conductors = guild.roles.get(process.env.CONDUCTOR_ID).members;
  const command    = parseCommand(message.content);
  const channels   = client.channels;

  if (!conductors.find(conductor => conductor.user.username === message.author.username)) {
    message.reply('Ah ah ah... you didn\'t say the magic word!');
    return;
  }

  const bot = botGenerator(message);

  if (typeof bot[command] === 'function') {
    bot[command]();
  } else if (!bot[command] && command[0] === '$') {
    message.reply('Command not found. Use $help to list available commands.');
  }

});

client.login(token);
