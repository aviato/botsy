module.exports = class Queue {
  constructor(capacity) {
    this.songs = [];
    this.shufflePlay = false;
  }

  add(song) {
    this.songs.push(song);
  }

  dequeue() {
    return this.songs.shift();
  }

  list() {
    return this.songs.map((song, index) => `${index + 1}). ${song}`);
  }

}