const BotHelpers = require('./botHelpers');
const Queue = require('./Queue');

/** Class representing a bot */
module.exports = class Bot {
  /**
   * Create a bot.
   * @param {object} client - the discord client interface
   * @param {function} Youtube - a Youtube class constructor
   */
  constructor(client, Youtube) {
    this.client = client;
    this.dispatcher = null;
    this.message = null;
    this.streamOptions = { seek: 0, volume: 0.1 };
    this.youtube = new Youtube(
      process.env.YOUTUBE_API_KEY
    );
    this.queue = new Queue();
    this.autoPlay = false;
    this.speaking = false;
  }

  /**
   * Sets the dispatcher - an object which represents the stream.
   * @param {*} dispatcher - the stream or null
   */
  setDispatcher(dispatcher) {
    this.dispatcher = dispatcher;
    this.speaking = true;
    return this;
  }

  /**
   * Set the volume of the current stream.
   */
  setVolume() {
    const newLevel = parseFloat(this.message.content.split(' ')[1], 10);

    if (newLevel > 1) {
      this.message.reply(`${ newLevel } is far too loud. 0-1 is a good range.`);
      return;
    } else if (isNaN(newLevel)) {
      this.message.reply(`Your volume level wasn't a number. Try again!`);
      return;
    }

    if (this.dispatcher) {
      // Sets the volume relative to the input stream
      // 1 is normal, 0.5 is half, 2 is double.
      this.dispatcher.setVolume(newLevel);
    }
  }

  /**
   * Get a search result from youtube by making a search query
   * and sending it to Youtube's search API.
   * @return {string} url - URL for the highest ranked video based on search
    */
  getYoutubeSearchResults() {
    return this.youtube.makeSearchUrl(this.message)
                       .getSearchResults(this.message);
  }

  /**
   * Update the message.
   * @param {string} message - the new message received by the bot
   * @return {object} this - a 'this' reference
   */
  setMessage(message) {
    this.message = message;
    return this;
  }

  addSong() {
    this.getYoutubeSearchResults().then(url => {
      this.queue.add(url);
      if (!this.speaking) {
        this.playNext();
      }
    });
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;

    if (this.autoPlay) {
      this.playNext();
    } else {
      this.stop();
    }
  }

  /**
   * Stream a Youtube mp3 through an open voice connection.
   */
  play(nextSongUrl) {
    const channel = this.client.channels.get(this.message.member.voiceChannelID);

    console.log('a');

    channel.join().then(connection => {
      console.log('b');
      if (nextSongUrl) {
        this.playYoutubeSong(nextSongUrl, connection)
      } else {
        return this.getYoutubeSearchResults().then(url => {
          this.playYoutubeSong(url, connection)
        });
      }
    });
  }

  playNext() {
    if (this.queue.songs.length) {
      this.play(this.queue.dequeue());
    } else {
      this.message.reply('There are no songs in the queue! Use $add <songname> to add a song to the queue.');
    }
  }

  playYoutubeSong(url, connection) {
    const stream = this.youtube.createAudioStream(url);

    const dispatchConnect = new Promise((resolve, reject) => {
      resolve(connection.playStream(stream, this.streamOptions));
      reject('oops this does not work'); // This might break things
    });

    dispatchConnect.then(dispatcher => {
      // Update reference to the stream in parent class
      this.setDispatcher(dispatcher);

      // Log any funky errors that are thrown while streaming
      dispatcher.on('debug', debugMessage => {
        console.error(debugMessage);
      });

      dispatcher.on('end', endMessage => {
        this.dispatcher.end();
        this.speaking = false;

        if (this.autoPlay) {
          this.playNext();
        }
        console.log('[END]: stopped because: ', endMessage);
      });

      dispatcher.on('debug', info => {
        console.log('[DEBUG]: ', info);
      });

      dispatcher.on('speaking', speaking => {
        console.log(`User is speaking? ${speaking}`);
      });
    });

    dispatchConnect.catch(error => {
      console.log(stream)
      console.log('[ERROR]: ', error);
    });
  }

  /**
   * Join a voice channel. Notifies a user if they cannot join the channel
   * if the requested channel does not exist.
   * @return {*} void | promise
   */
  joinChannel() {
    const channelName = BotHelpers.parseVoiceChannelName(this.message);
    const discordChannel = this.client.channels.find(
        channel => channel.name === channelName
    );
    if (!discordChannel) {
      this.message.reply(`Oops! Channel name ${ channelName } does not exist.`);
      return;
    }

    return discordChannel.join();
  }

  /**
   * Pause the current stream's playback.
   */
  pause() {
    if (this.dispatcher && this.dispatcher.pause) {
      this.dispatcher.pause();
      this.message.reply('Song paused. Use $resume to resume playback');
    }
  }

  /**
   * Resume playback of a paused stream.
   */
  resume() {
    if (this.dispatcher && this.dispatcher.resume) {
      this.dispatcher.resume();
      this.message.reply('Resuming playback!');
    }
  }

  /**
   * Stop the current stream.
   */
  stop() {
    this.autoPlay = false;
    if (this.dispatcher && this.dispatcher.end) {
      this.dispatcher.end();
      this.dispatcher = null;
    }
  }
}
