class Queue {
  constructor(capacity) {
    this._capacity = capacity || Infinity;
    this._storage = {};
    this._head = 0;
    this._tail = 0;
  }

  enqueue(value) {
    if (this.count() < this.capacity) {
      this._storage[this._tail++] = value;
      return this.count();
    }

    return 'Queue is at max capacity. An element must be removed before another is added.';
  }

  dequeue() {
    const element = this._storage[this._head];

    delete this._storage[this._head];

    if (this._head < this._tail) {
      this._head++;
    }

    return element;
  }

  peek() {
    return this._storage[this._head];
  }

  count() {
    return this._tail - this._head;
  }

  contains(value) {
    for (let i = this._head; i < this._tail; i++) {
      if (this._storage[i] === value) {
        return i - this._head + 1;
      }
    }

    return null;
  }
}

export default Queue;