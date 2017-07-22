const querystring = require('querystring');
const ytdl = require('ytdl-core'); // Stream youtube mp3s
const getYoutubeSearchResults = require('./getYoutubeSearchResults');

/** Class representing youtube */
module.exports = class Youtube {
  /**
   * Create a youtube class.
   * @param {string} key - a Youtube API key 
   */
  constructor(key) {
    this.key = key;
    this.ytdl = ytdl;
    this.streamOptions = { seek: 0, volume: .07 };
    this.searchUrl = null;
    this.videoUrl = null;
    this.dispatcher = {};
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
   * @param {string} message - raw message from Discord
   */
  setVolume(message) {
    const newLevel = parseFloat(message.content.split(' ')[1], 10);
    if (newLevel > 1) {
      message.reply(
        `${ newLevel } is far too loud. 0-1 is a good range.`
      );
    } else if (isNaN(newLevel)) {
      message.reply(
        `Your volume level wasn't a number. Try again!`
      );
    }

    if (this.dispatcher) {
      // Sets the volume relative to the input stream
      // 1 is normal, 0.5 is half, 2 is double.
      this.dispatcher.setVolume(newLevel);
    }
  }

  /**
   * Stop the current stream.
   */
  stopPlayback() {
    if (this.dispatcher && this.dispatcher.end) {
      this.dispatcher.end();
      this.dispatcher = null;
    }
  }

    /**
     * Pause the current stream's playback.
     * @param {*} message - raw message from Discord 
     */
  pausePlayback(message) {
    if (this.dispatcher && this.dispatcher.pause) {
      this.dispatcher.pause();
      message.reply(
        'Song paused. Use $resume to resume playback'
      );
    }
  }

  /**
   * Resume playback of a paused stream.
   * @param {*} message - raw message from Discord
   */
  resumePlayback(message) {
    if (this.dispatcher && this.dispatcher.resume) {
      this.dispatcher.resume();
      message.reply('Resuming playback!');
    }
  }

  /**
   * Get the top search result for a given Youtube search
   * @param {*} message - raw message from Discord
   * @return {string} url - the URL of the top search result
   */
  getSearchResults(message) {
    return getYoutubeSearchResults(
      this.searchUrl,
      this.makeVideoUrl.bind(this),
      message
    );
  }

  /**
   * Take a raw discord message a parse a song name from it.
   * @param {*} message - a raw message from Discord
   * @return {string} song - the name of the requested song
   */
  parseSongNameFromMessage(message) {
    const commandAsArray = message.content.split(' ');
    const songNameSlice = commandAsArray.slice(1);
    return songNameSlice.join(' ');
  }

  /**
   * Make a query to send to the Youtube API to get search results. Returns this
   * to make methods chainable.
   * @param {*} message - a raw message from Discord
   * @return {object} this
   */
  makeSearchUrl(message) {
    const query = this.parseSongNameFromMessage(message);
    const baseUri = 'https://www.googleapis.com/youtube/v3/search?part=snippet';
    const apiKey = `key=${this.key}`;
    const searchTerms = `q=${querystring.escape(query)}`;
    this.searchUrl = [baseUri, searchTerms, apiKey].join('&');
    return this;
  }

  /**
   * Make a video url to be requested from Youtube.
   * @param {string} id - the ID of the mp3 to be streamed
   * @return {string} videoUrl - the url of the video to be streamed
   */
  makeVideoUrl(id) {
    if (typeof id !== 'string') {
      console.log('Youtube video ID must be a string.');
    }
    return `https://www.youtube.com/watch?v=${id}`;
  }

  /**
   * 
   * @param {*} message - a raw message from Discord
   * @param {string} url - the URL of the video to be streamed
   * @param {*} connection - an open voice connection in Discord
   */
  playSong(message, url, connection) {
    this.setDispatcher(null);
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

      dispatcher.on('end', message => {
        console.log('stopped because: ', message);
      });

      dispatcher.on('debug', info => {
        console.log('[DEBUG]: ', info);
      })
      // Update reference to the stream in parent class
      this.setDispatcher(dispatcher);
    });

    dispatchConnect.catch(error => {
      console.log('[ERROR]: ', error);
    });
  }
}
