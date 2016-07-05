// See docs/compat.md for more information on providing polyfills which are 
// required for l20n.js to work in legacy browsers.
//
// The following are simple fixes which aren't included in any of the popular 
// polyfill libraries.

// IE, Safari and Opera don't support it yet
if (typeof navigator !== 'undefined' && navigator.languages === undefined) {
  navigator.languages = [navigator.language];
}

// iOS Safari doesn't even have the Intl object defined
if (typeof Intl === 'undefined') {
  window.Intl = {};
}
