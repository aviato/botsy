const querystring = require('querystring');
const ytdl = require('ytdl-core');
const getYoutubeSearchResults = require('./getYoutubeSearchResults');

module.exports = class Youtube {
  constructor(key) {
    this.key = key;
    this.ytdl = ytdl;
    this.streamOptions = { seek: 0, volume: .07 };
    this.searchUrl = null;
    this.videoUrl = null;
    this.dispatcher = {};
  }

  setVolume(message) {
    const newLevel = parseFloat(messageContent.split(' ')[1], 10);
    if (newLevel > 1) {
      return message.reply(
        `${ newLevel } is far too loud. 0-1 is a good range.`
      );
    } else if (isNaN(newLevel)) {
      return message.reply(
        `Your volume level wasn't a number. Try again!`
      );
    }

    if (this.dispatcher.stream) {
      // Sets the volume relative to the input stream
      // 1 is normal, 0.5 is half, 2 is double.
      this.dispatcher.stream.setVolume(newLevel);
    }
  }

  stopPlayback() {
    if (this.dispatcher.stream) {
      this.dispatcher.stream.end();
    }
  }

  pausePlayback(message) {
    if (this.dispatcher.stream) {
      this.dispatcher.stream.pause();
      return message.reply(
        'Song paused. Use $resume to resume playback'
      );
    }
  }

  resumePlayback(message) {
    if (this.dispatcher.stream) {
      this.dispatcher.stream.resume();
      message.reply('Resuming playback!');
    }
  }

  getSearchResults(message) {
    return getYoutubeSearchResults(
      this.searchUrl,
      this.makeVideoUrl.bind(this),
      message
    );
  }

  parseSongNameFromMessage(message) {
    let commandAsArray = message.content.split(' '),
    songNameSlice = commandAsArray.slice(1),
    song = songNameSlice.join(' ');
    return song;
  }

  makeSearchUrl(query) {
    query = this.parseSongNameFromMessage(query)
    const baseUri = 'https://www.googleapis.com/youtube/v3/search?part=snippet';
    const apiKey = `key=${this.key}`;
    const searchTerms = `q=${querystring.escape(query)}`
    this.searchUrl = [baseUri, searchTerms, apiKey].join('&');
    return this;
  }

  makeVideoUrl(id) {
    if (typeof id !== 'string') {
      console.log('Youtube video ID must be a string.');
    }
    return `https://www.youtube.com/watch?v=${id}`;
  }

  playSong(message, url, updateDispatcher, connection) {
    console.log(url)
    const stream = this.ytdl(url, { filter: 'audioonly' });
    const dispatchConnect = new Promise((resolve, reject) => {
      resolve(connection.playStream(stream, this.streamOptions));
      reject('oops this does not work'); // This might break things
    });

    dispatchConnect.then(dispatcher => {
      // Log any funky errors that are thrown while streaming
      dispatcher.on('debug', message => {
        console.error(message);
      });

      // Update reference to the stream in parent class
      this.dispatcher = dispatcher;
    });

    dispatchConnect.catch(error => {
      console.log(error);
    });
  }
}
