const https = require('https');

const getYoutubeSearchResults = (searchUrl, makeVideoUrl) => {
  return new Promise((resolve, reject) => {
    https.get(searchUrl, res => {
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
          
          const firstVideoSearchResult = parsedData.items.find(item => {
            return item.id && item.id.kind === 'youtube#video' && item.id.videoId;
          });

          const song = {
            ytid: firstVideoSearchResult.id.videoId,
            name: firstVideoSearchResult.snippet.title,
            url: makeVideoUrl(
              firstVideoSearchResult.id.videoId
            ),
            plays: 1
          }

          resolve(song);

        } catch (e) {
          console.log('[ERROR]:', e.message);
        }
      });
    }).on('error', e => {
      console.log('[ERROR]: ', e.message);
    })
  });
}

module.exports = getYoutubeSearchResults;
