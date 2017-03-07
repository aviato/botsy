const songQueue = () => {
  // Storage for all the songs
  const storage = {};

  let counter, front, back;
  counter = 0;
  front   = 1;
  back    = 0;

  // Add a song to the queue
  storage.enqueue = url => {
    counter++;
    back++;
    storage[back] = url;
  };

  // Remove the song from the queue and return it
  storage.dequeue = () => {
    const nextSong = storage[front];
    delete storage[front++];
    if (counter) counter--;
    return nextSong;
  };

  // Return the size of the queue
  storage.size = () => counter;

  return storage;
};

