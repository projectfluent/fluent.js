function emit(action, requestId, data) {
  document.dispatchEvent(
    new CustomEvent('mozL20nDemo', {
      bubbles: true,
      detail: {
        action, requestId, data: data || {},
      }
    })
  );
}

const HASH_RADIX = 36;
const MOZ_EVENT_TIMEOUT = 15000;

export function postMessage(msg, data) {
  const reqId = Math.random().toString(HASH_RADIX).replace(/[^a-z]+/g, '');

  return new Promise((resolve, reject) => {
    function onResponse(evt) {
      if (evt.detail.requestId === reqId) {
        clearTimeout(t);
        window.removeEventListener('mozL20nDemoResponse', onResponse);
        resolve(evt.detail.data);
      }
    }

    const t = setTimeout(() => {
      window.removeEventListener('mozL20nDemoResponse', onResponse);
      reject();
    }, MOZ_EVENT_TIMEOUT);

    window.addEventListener('mozL20nDemoResponse', onResponse);

    emit(msg, reqId, data);
  });
}

export class ContentResourceBundle {
  constructor(lang, resources) {
    this.lang = lang;
    this.loaded = false;
    this.resources = resources;

    const data = Object.keys(resources).map(
      resId => resources[resId].data
    );

    if (data.every(d => d !== null)) {
      this.loaded = Promise.resolve(data);
    }
  }

  fetch() {
    if (!this.loaded) {
      this.loaded = Promise.all(
        Object.keys(this.resources).map(resId => {
          const { source, lang } = this.resources[resId];
          return postMessage('fetchResource', { source, resId, lang });
        })
      );
    }

    return this.loaded;
  }
}

export class ChromeResourceBundle {
  constructor(lang, resources) {
    this.lang = lang;
    this.loaded = false;
    this.resources = resources;

    // Uncomment to test sync resource loading
    // Components.utils.import('resource://gre/modules/SyncPromise.jsm')
    // this.Promise = SyncPromise;
    this.Promise = Promise;

    const data = Object.keys(resources).map(
      resId => resources[resId].data
    );

    if (data.every(d => d !== null)) {
      this.loaded = this.Promise.resolve(data);
    }
  }

  fetch() {
    if (!this.loaded) {
      this.loaded = this.Promise.all(
        Object.keys(this.resources).map(resId => {
          const { source, lang } = this.resources[resId];
          return L10nRegistry.fetchResource(source, resId, lang);
        })
      );
    }

    return this.loaded;
  }
}
