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
  const tag = code.split('-')[0];
  return ['ar', 'he', 'fa', 'ps', 'ur'].indexOf(tag) >= 0 ?
    'rtl' : 'ltr';
}

// Opera and Safari don't support it yet
if (typeof navigator !== 'undefined' && navigator.languages === undefined) {
  navigator.languages = [navigator.language];
}
