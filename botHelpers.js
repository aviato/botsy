module.exports = class BotHelpers {
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
