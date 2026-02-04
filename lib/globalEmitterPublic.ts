import EventEmitter from 'events';

declare global {
  var globalEmitterPublic: EventEmitter & { latestRealtimeMetrics?: any };
}

if (!global.globalEmitterPublic) {
  const emitter = new EventEmitter() as EventEmitter & { latestRealtimeMetrics?: any };
  emitter.setMaxListeners(0);

  setInterval(() => {
    emitter.emit('keepalive');
  }, 5000);

  global.globalEmitterPublic = emitter;
}

const globalEmitterPublic = global.globalEmitterPublic;

const originalEmit = globalEmitterPublic.emit.bind(globalEmitterPublic);
globalEmitterPublic.emit = (event: string, ...args: any[]) => {
  if (event === 'realtime-metrics') {
    globalEmitterPublic.latestRealtimeMetrics = args[0];
  }
  return originalEmit(event, ...args);
};

export default globalEmitterPublic;
