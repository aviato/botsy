const BotHelpers = require('./botHelpers');

module.exports = class Bot {
  constructor( client, Youtube ) {
    this.client = client;
    this.youtube = new Youtube(
      process.env.YOUTUBE_API_KEY
    );
    this.message = null;
  }

  getYoutubeSearchResults() {
    return this.youtube.makeSearchUrl(this.message)
               .getSearchResults(this.message);
  }

  // Update the message
  setMessage(message) {
    this.message = message;
    return this;
  }

  setYoutubeVolume() {
    return this.youtube.setVolume(this.message);
  }

  pauseYoutubeVideo() {
    return this.youtube.pausePlayback(this.message);
  }

  resumeYoutubeVideo() {
    return this.youtube.resumePlayback(this.message);
  }

  playYoutubeSong() {
    const channels = this.client.channels.get(this.message.member.voiceChannelID);
    return channels.join().then((connection) => {
      this.getYoutubeSearchResults().then((url) => {
        this.youtube.playSong(
          this.message,
          url,
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
    const discordChannel = this.client.channels.find(
        channel => channel.name === channelName
    );
    if (!discordChannel) {
      this.message.reply(`Oops! Channel name ${ channelName } does not exist.`);
      return;
    }

    return discordChannel.join();
  }

  stopYoutubePlayback() {
    return this.youtube.stopPlayback();
  }
}
