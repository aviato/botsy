module.exports = class Queue {
  constructor(capacity) {
    this.songs = [];
    this.shufflePlay = false;
  }

  add(song) {
    this.songs.push(song);
  }

  dequeue(random) {
    if (random) {
      const randomIndex = Math.floor(Math.random() * this.songs.length);
      return this.songs.splice(randomIndex, 1)[0];
    } else {
      return this.songs.shift();
    }
  }

  showList() {
    return this.songs.map((song, index) => `${index + 1}). ${song.name}`);
  }

}