const BotHelpers = require('./botHelpers');

/** Class representing a bot */
module.exports = class Bot {
  /**
   * Create a bot.
   * @param {object} client - the discord client interface
   * @param {function} Youtube - a Youtube class constructor
   */
  constructor( client, Youtube ) {
    this.client = client;
    this.youtube = new Youtube(
      process.env.YOUTUBE_API_KEY
    );
    this.message = null;
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

  /**
   * Set the volume of the current Youtube stream.
   */
  setYoutubeVolume() {
    this.youtube.setVolume(this.message);
  }

  /**
   * Pauses the current Youtube stream.
   */
  pauseYoutubeVideo() {
    this.youtube.pausePlayback(this.message);
  }

  /**
   * Resumes the current Youtube stream.
   */
  resumeYoutubeVideo() {
    this.youtube.resumePlayback(this.message);
  }

  /**
   * Stream a Youtube mp3 through an open voice connection.
   */
  playYoutubeSong() {
    const channel = this.client.channels.get(this.message.member.voiceChannelID);
    channel.join().then((connection) => {
      this.getYoutubeSearchResults().then((url) => {
        this.youtube.playSong(
          this.message,
          url,
          connection
        );
      });
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
   * Stop the currently playing Youtube stream.
   */
  stopYoutubePlayback() {
    this.youtube.stopPlayback();
  }
}
