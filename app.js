require('dotenv').load(); // Load env vars
const http             = require('http');
const Discord          = require('discord.js'); // Discord API
const ytdl             = require('ytdl-core');  // Stream youtube mp3s
const client           = new Discord.Client();  // Sets up client discord client API
const Youtube          = require('./youtube');
const hostname         = 'localhost';
const port             = 9999;
const token            = process.env.TOKEN;
const { parseBotCommand,
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
  console.log(`Connected as ${ client.user.username }`);
});

class BotHelpers {
  static parseVoiceChannelName( message ) {
    if (!message.hasOwnProperty('content')) {
      // Maybe throw error here in try catch block
      console.log(`Message object has no property 'content'`);
      return;
    }
    const content = message.content;
    const firstSpace = content.indexOf(' ');
    return content.substr(
      content.indexOf(' ') + 1
    );
  }

  static formatHelpMessage(commands) {
    if (!Array.isArray(commands)) {
      return;
    }

    return (
`

Botsy | v0.4

Hello there!
Looks like you could use some help. Here are some useful commands:

${commands.join('\n')}

`
    );
  }
}

class Bot {
  constructor( client, Youtube ) {
    this.client = client;
    this.youtube = new Youtube(
      process.env.YOUTUBE_API_KEY
    );
    this.ytdl = ytdl;
    this.message = null;
  }

  getSearchResults() {
    return this.youtube.makeSearchUrl(this.message)
               .getSearchResults(this.message);
  }

  // Update the message
  setMessage(message) {
    this.message = message;
    return this;
  }

  setVolume() {
    return this.youtube.setVolume(this.message);
  }

  pauseYoutubeVideo() {
    return this.youtube.pausePlayback(this.message);
  }

  resumeYoutubeVideo() {
    return this.youtube.resumePlayback(this.message);
  }

  setDispatcher(dispatcher) {
    this.dispatcher = dispatcher;
    return this;
  }

  playYoutubeSong() {
    const channels = this.client.channels.get(this.message.member.voiceChannelID);
    return channels.join().then((connection) => {
      this.getSearchResults().then((url) => {
        this.youtube.playSong(
          this.message,
          url,
          this.setDispatcher.bind(this),
          connection
        );
      });
    });
  }

  /*
    @param {client} - Discord instance
    @param {Message} message instance
    @return {Promise}
  */
  joinChannel() {
    const channelName = BotHelpers.parseVoiceChannelName(this.message);
    console.log(channelName)
    const discordChannel = this.client.channels.find(
        channel => channel.name === channelName
    );
    if (!discordChannel) {
      this.message.reply(`Oops! Channel name ${ channelName } does not exist.`);
      return;
    }

    console.log(discordChannel.join())

    return discordChannel.join();
  }

}

const commandDict = (bot, message) => {
  return {
    '$join': function() {
      return bot.setMessage(message).joinChannel(client);
    },
    '$play': function() {
      return bot.setMessage(message).playYoutubeSong()
    },
    '$stop': function() {
      return bot.setMessage(message).stopPlayback();
    },
    '$volume': function() {
      return bot.setMessage(message).setVolume();
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

const bot = new Bot(
  client,
  Youtube
);

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

client.login(token);
