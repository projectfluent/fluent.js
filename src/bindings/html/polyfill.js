'use strict';

// Polyfill NodeList.prototype[Symbol.iterator] for Chrome.
// See https://code.google.com/p/chromium/issues/detail?id=401699
if (!NodeList.prototype[Symbol.iterator]) {
  NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
}
