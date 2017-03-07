const youtube = (key, encoder) => {
  // Generate a youtube video URI for getting a list of search results
  const searchUriGenerator = () => {
    const baseUri = 'https://www.googleapis.com/youtube/v3/search?part=snippet';
    const apiKey = `key=${key}`;
    return query => {
      const searchTerms = `q=${encoder.escape(query)}`
      return [baseUri, searchTerms, apiKey].join('&');
    }
  };

  const generateVideoLink = id => {
    if (typeof id !== 'string') {
      throw new Error('Youtube video ID must be a string.');
    }

    return `https://www.youtube.com/watch?v=${id}`;
  };

  // TODO: write method for getting YT playlist
  // Return the API for the youtube object
  return {
    generateSearchUri: searchUriGenerator(),
    generateVideoLink
  };
};

module.exports = youtube;
