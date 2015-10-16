'use strict';

// Polyfill NodeList.prototype[Symbol.iterator] for Chrome.
// See https://code.google.com/p/chromium/issues/detail?id=401699
if (typeof NodeList === 'function' && !NodeList.prototype[Symbol.iterator]) {
  NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
}

// A document.ready shim
// https://github.com/whatwg/html/issues/127
export function documentReady() {
  if (document.readyState !== 'loading') {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    document.addEventListener('readystatechange', function onrsc() {
      document.removeEventListener('readystatechange', onrsc);
      resolve();
    });
  });
}

// Intl.Locale
export function getDirection(code) {
  return ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'].indexOf(code) >= 0 ?
    'rtl' : 'ltr';
}
