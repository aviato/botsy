const parseSong = messageContent => {
  let commandAsArray = messageContent.split(' '),
      songNameSlice  = commandAsArray.slice(1),
      song           = songNameSlice.join(' ');

  return song;
};

const setVolume = (options, level) => {
  options.volume = level;
};

const parseCommand = messageContent => {
  return messageContent.split(' ')[0];
};

const parseVoiceChannelName = message => {
  if (!message.hasOwnProperty('content')) {
    throw new Error(`Message object has no property 'content'`);
    return;
  }
  const content = message.content;
  const firstSpace = content.indexOf(' ');
  return content.substr(
    content.indexOf(' ') + 1
  );
};

const joinChannel = (bot, channelName, message) => {
  const discordChannel = bot.channels.find(channel => channel.name === channelName);

  if (!discordChannel) {
    message.reply(`Oops! Channel name ${ channelName } does not exist.`);
    return;
  }

  discordChannel.join();
};

const isConductor = (idConstant, id) => {
  return id === idConstant;
};

const playSong = (message, url, dispatcherRef, channels, ytdl, streamOptions) => {
  let channel = channels.get(message.member.voiceChannelID);
  channel.join()
  .then( connection => {
    const stream          = ytdl(url, { filter: 'audioonly' });
    const dispatchConnect = new Promise((resolve, reject) => {
      resolve(connection.playStream(stream, streamOptions));
    });

    dispatchConnect.then(dispatcher => {
      // Log any funky errors that are thrown while streaming
      dispatcher.on('debug', message => {
        console.error(message);
      });

      // Store a reference to the stream so that it can be modified at runtime
      dispatcherRef.song = dispatcher;
    });

    dispatchConnect.catch(error => {
      console.log(error);
    });

  })
  .catch(error => {
    console.error(error);
  });
};

module.exports = {
  parseSong,
  playSong,
  setVolume,
  parseCommand,
  joinChannel,
  parseVoiceChannelName,
  isConductor
};
