const assert = require('assert');
const Bot = require('../bot.js');

describe('Bot class', function() {
  const bot = new Bot
  it('Should instantiate a new bot with the correct properties', function() {
    assert.equal(bot.client, !undefined);
  });
});
