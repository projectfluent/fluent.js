// Polyfill NodeList.prototype[Symbol.iterator] for Chrome.
// See https://code.google.com/p/chromium/issues/detail?id=401699
if (typeof NodeList === 'function' && !NodeList.prototype[Symbol.iterator]) {
  NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
}

// Opera and Safari don't support it yet
if (typeof navigator !== 'undefined' && navigator.languages === undefined) {
  navigator.languages = [navigator.language];
}
