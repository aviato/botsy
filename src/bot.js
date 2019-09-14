const BotHelpers = require('./botHelpers');
const Queue = require('./queue');
const MongoClient = require('mongodb').MongoClient;

/**
 * The Bot is a high-level abstraction of the functionality provided by Botsy.
 * With the Bot class you can play songs from Youtube, adjust the volume, add and remove songs form the song queue, etc.
 */
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
    this.volume = .20;
    this.streamOptions = { seek: 0, volume: this.volume };
    this.youtube = new Youtube(
      process.env.YOUTUBE_API_KEY
    );
    this.queue = new Queue();
    this.autoPlay = false;
    this.shufflePlay = false;

    if (process.env.MONGODB_ADDRESS) {
      const dbClient = new MongoClient(process.env.MONGODB_ADDRESS);

      dbClient.connect(err => {
        const db = dbClient.db('botsy');
        this._songs = db.collection('songs');
        console.log('Successfully connected to db!');
      });
    }
  }

  /**
   * Sets the dispatcher - an object which represents the stream.
   * @param {*} dispatcher - the stream or null
   */
  setDispatcher(dispatcher) {
    this.dispatcher = dispatcher;
    return this;
  }

  /**
   * Set the volume of the current stream.
   */
  setVolume() {
    let rawSoundLevel = parseInt(this.message.content.split(' ')[1], 10);

    if (isNaN(rawSoundLevel)) {
      return this.message.reply(`Volume level: ${this.volume * 100}.`);
    }

    if (rawSoundLevel > 100) {
      return this.message.reply('Cannot exceed maximum volume level (100).');
    } else if (rawSoundLevel < 0) {
      return this.message.reply('Cannot set volume below minimum volume threshold (0).');
    } 

    const normalizedSoundLevel = (rawSoundLevel / 200);

    if (normalizedSoundLevel > this.volume) {
      this.message.reply(`Turning volume up to ${normalizedSoundLevel * 200}.`);
    } else if (normalizedSoundLevel < this.volume) {
      this.message.reply(`Turning volume down to ${normalizedSoundLevel * 200}.`);
    }

    this.volume = normalizedSoundLevel;

    if (this.dispatcher) {
      // Sets the volume relative to the input stream
      this.dispatcher.setVolume(normalizedSoundLevel);
    }
  }

  /**
   * Get a search result from youtube by making a search query
   * and sending it to Youtube's search API.
   * @return {string} url - URL for the highest ranked video based on search
    */
  getYoutubeSearchResults() {
    return this.youtube.makeSearchUrl(this.message).getSearchResults();
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
    this.getYoutubeSearchResults().then(song => {
      this.queue.add(song);
      this.listSongsInQueue();
    });
  }

  skipSong() {
    this.playNext();
  }

  listSongsInQueue() {
    if (this.queue.songs.length) {
      this.message.reply(
        `
Here are the songs currently in queue:
${this.queue.showList().join('\n')}
`);
    } else {
      this.message.reply('The queue is currently empty. Try using $add to add songs to the queue.');
    }
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;

    if (this.autoPlay) {
      this.message.reply('Autoplay enabled.')
      this.playNext();
    } else {
      this.message.reply('Autoplay disabled.');
      this.stop();
    }
  }

  toggleShufflePlay() {
    this.shufflePlay = !this.shufflePlay;
    const shufflePlayStatus = this.shufflePlay ? 'enabled' : 'disabled';
    this.message.reply('Shuffle play ' + shufflePlayStatus);
  }

  /**
   * Stream a Youtube mp3 through an open voice connection.
   */
  play(nextSong) {
    const channel = this.client.channels.get(this.message.member.voiceChannelID);

    channel.join().then(connection => {

      if (nextSong && nextSong.url) {
        this.message.reply(nextSong.url);
        this.playYoutubeSong(nextSong, connection);
      } else {
        return this.getYoutubeSearchResults().then(song => {
          this.message.reply(song.url);
          this.playYoutubeSong(song, connection)
        });
      }
    });
  }

  playNext() {
    if (this.queue.songs.length) {
      console.log(this.queue.songs);
      this.play(this.queue.dequeue(this.shufflePlay));
    } else {
      this.message.reply('There are no songs in the queue! Use $add <songname> to add a song to the queue.');
    }
  }

  addOrUpdateSongInDB(song) {
    if (!this._songs) {
      console.log('DB has not been set up. Song tracking is not enabled.');
      return;
    }

    this._songs.findOne({ ytid: song.ytid }, (err, doc) => {
      if (doc) {
        this._songs.updateOne({ ytid: song.ytid }, { $inc: { plays: 1 } });
      } else {
        this._songs.insertOne(song);
      }
    });

  }

  playYoutubeSong(song, connection) {
    this.addOrUpdateSongInDB(song);
    const stream = this.youtube.createAudioStream(song.url);
    const dispatchConnect = new Promise((resolve, reject) => {
      resolve(connection.playStream(stream, this.streamOptions));
      reject('oops this does not work'); // This might break things
    });

    dispatchConnect.then(dispatcher => {
      console.log('dispatcher: ', dispatcher)
      // Update reference to the stream
      this.setDispatcher(dispatcher);

      // Log any funky errors that are thrown while streaming
      dispatcher.on('debug', debugMessage => {
        console.error(debugMessage);
      });

      dispatcher.on('end', endMessage => {
        // This event will fire asynchronously, which causes a bug when skipping songs in autoplay mode.
        // The work around for this is to set a timeout to ensure that the event won't fire for a dispatcher
        // that should be replaced.
        setTimeout(() => {
          if (this.autoPlay && dispatcher === this.dispatcher) {
            console.log('in the if statement')
            this.playNext();
          }
        }, 0);

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
      this.message.reply(`Oops! Channel name ${channelName} does not exist.`);
      return;
    }

    return discordChannel.join()
      .then(connection => console.log(`Connected to ${channelName}.`))
      .catch(console.error);
  }

  /**
   * Pause the current stream's playback.
   */
  pause() {
    if (this.dispatcher && this.dispatcher.pause) {
      this.dispatcher.pause();
      this.message.reply('Song paused. Use $resume to resume playback.');
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

  displayMostPlayedSongs() {
    if (this._songs === null) {
      this.message.reply('DB setup is required to track most played songs.');
      return;
    }

    const includeURL = this.message.content.split(' ')[1];

    this._songs.find({}).toArray((err, docs) => {
      if (docs) {
        const sanitizedDocs = docs.sort((a, b) => b.plays - a.plays)
          .slice(0, 10)
          .filter(doc => doc !== undefined)
          .map((doc, i) => {
            let listItem = `${i + 1}). ${doc.name} (${doc.plays} plays)`;

            if (includeURL === 'true') {
              listItem = listItem + ` [${doc.url}]`;
            }

            return listItem;
          });
        this.message.reply(
          `
The most played songs are:
${ sanitizedDocs.join('\n')}
`
        );
      }
    });
  }
}
