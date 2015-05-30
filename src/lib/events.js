'use strict';

export function emit(listeners, ...args) {
  let type = args.shift();

  if (listeners[type]) {
    listeners[type].slice().forEach(
      listener => listener.apply(this, args));
  }

  if (listeners['*']) {
    listeners['*'].slice().forEach(
      listener => listener.apply(this, args));
  }
}

export function addEventListener(listeners, type, listener) {
  if (!(type in listeners)) {
    listeners[type] = [];
  }
  listeners[type].push(listener);
}

export function removeEventListener(listeners, type, listener) {
  let typeListeners = listeners[type];
  let pos = typeListeners.indexOf(listener);
  if (pos === -1) {
    return;
  }

  typeListeners.splice(pos, 1);
}
