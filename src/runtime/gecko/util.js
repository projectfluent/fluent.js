import { properties, contexts, fetchFirstBundle } from '../../lib/dom/base';
import { valueFromContext } from '../../lib/format';

export { documentReady, getResourceLinks } from '../web/util';

export function createGetValue(bundles) {
  return function (id, args) {
    const ctx = contexts.get(bundles[0]);
    const [value] = valueFromContext(ctx, id, args);
    return value;
  };
}

// create nsIObserver's observe method bound to a LocalizationObserver obs
export function createObserve(obs) {
  return function observe(subject, topic, data) {
    switch (topic) {
      case 'language-registry-update': {
        const { requestBundles, createContext } = properties.get(this);
        this.interactive = requestBundles().then(
          bundles => fetchFirstBundle(bundles, createContext)
        );
        return obs.translateRoots(this);
      }
      case 'language-registry-incremental': {
        const { resId, lang, messages } = JSON.parse(data);
        return this.interactive.then(bundles => {
          const bundle = bundles[0];
          if (resId in bundle.resources && bundle.locale === lang) {
            // just overwrite any existing messages in the first bundle
            const ctx = contexts.get(bundles[0]);
            ctx.addMessages(messages);
            return obs.translateRoots(this);
          }
        });
      }
      default: {
        throw new Error(`Unknown topic: ${topic}`);
      }
    }
  }
}

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

export function postMessage(msg, data) {
  const reqId = Math.random().toString(36).replace(/[^a-z]+/g, '');

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
    }, 15000);

    window.addEventListener('mozL20nDemoResponse', onResponse);

    emit(msg, reqId, data);
  });
}

export class ResourceBundle {
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
          return postMessage('fetchResource', {
            source, resId, lang: this.lang
          });
        })
      );
    }

    return this.loaded;
  }
}
