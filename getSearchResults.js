const https = require('https');

const getSearchResults = (playSong, searchMeta, discordMeta, streamMeta) => {

  https.get(searchMeta.searchUrl, res => {
    const statusCode  = res.statusCode;
    const contentType = res.headers['content-type'];

    let error;

    if (statusCode !== 200) {
      error = new Error(`Request Failed.\n` +
                      `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error(`Invalid content-type.\n` +
                      `Expected application/json but received ${contentType}`);
    }

    if (error) {
      console.log(error.message);
      // consume response data to free up memory
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';

    res.on('data', (chunk) => rawData += chunk);

    res.on('end', () => {
      try {
        let parsedData = JSON.parse(rawData);

        const firstSearchResult = parsedData.items.find(item => {
          return item.id.videoId;
        });

        const result = searchMeta.resultUrl(firstSearchResult.id.videoId);
        const { message, dispatcher, channels } = discordMeta;
        const { ytdl, streamOptions } = streamMeta;
        playSong(message, result, dispatcher, channels, ytdl, streamOptions);

        message.reply(result);

      } catch (e) {
        console.log(e.message);
      }
    });
  }).on('error', e => {
    console.log(e.message);
  })
}

module.exports = getSearchResults;
