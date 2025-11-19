// aiEvaluationQueue.js
// Simple in-memory queue for async AI evaluation jobs (replace with Redis/bullMQ for production)
const queue = [];

module.exports = {
  enqueue(job) {
    queue.push(job);
  },
  dequeue() {
    return queue.shift();
  },
  isEmpty() {
    return queue.length === 0;
  },
  size() {
    return queue.length;
  },
  clear() {
    queue.length = 0;
  },
  getAll() {
    return [...queue];
  },
};
