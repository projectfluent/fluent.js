import { emit, addEventListener } from '../../lib/events';

export class Client {
  constructor(remote) {
    this.id = this;
    this.remote = remote;

    const listeners = {};
    this.on = (...args) => addEventListener(listeners, ...args);
    this.emit = (...args) => emit(listeners, ...args);
  }

  method(name, ...args) {
    return this.remote[name](...args);
  }
}

export function broadcast(type, data) {
  Array.from(this.ctxs.keys()).forEach(
    client => client.emit(type, data));
}
