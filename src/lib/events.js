export function emit(listeners, ...args) {
  const type = args.shift();

  if (listeners['*']) {
    listeners['*'].slice().forEach(
      listener => listener.apply(this, args));
  }

  if (listeners[type]) {
    listeners[type].slice().forEach(
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
  const typeListeners = listeners[type];
  const pos = typeListeners.indexOf(listener);
  if (pos === -1) {
    return;
  }

  typeListeners.splice(pos, 1);
}
