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
    this.searchUrl = null;
    this.videoUrl = null;
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

  createAudioStream(url) {
    return this.ytdl(url, { filter: 'audioonly' });
  }

}
