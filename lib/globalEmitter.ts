import EventEmitter from 'events';

declare global {
  var globalEmitter: EventEmitter;
}

if (!global.globalEmitter) {
  global.globalEmitter = new EventEmitter();
  global.globalEmitter.setMaxListeners(0);

  setInterval(() => {
    global.globalEmitter.emit('keepalive');
  }, 5000);
}

const globalEmitter: EventEmitter = global.globalEmitter;

export default globalEmitter;