'use strict';

export default class MockResourceBundle {
  constructor(lang) {
    this.lang = lang;
  }

  fetch() {
    return this.loaded;
  }
}

export function withData(data) {
  return function(bundle) {
    bundle.loaded = Promise.resolve(data);
    return bundle;
  }
}

