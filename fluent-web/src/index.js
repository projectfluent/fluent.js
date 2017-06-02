import DOMLocalization from '../../fluent-dom/src/dom_localization';
import negotiateLanguages from '../../fluent-langneg/src/index';
import { MessageContext } from '../../fluent/src/context';

function documentReady() {
  const rs = document.readyState;
  if (rs === 'interactive' || rs === 'completed') {
    return Promise.resolve();
  }

  return new Promise(
    resolve => document.addEventListener(
      'readystatechange', resolve, { once: true }
    )
  );
}

function getMeta(elem) {
  return {
    available: elem.querySelector('meta[name="availableLanguages"]')
      .getAttribute('content')
      .split(','),
    default: elem.querySelector('meta[name="defaultLanguage"]')
      .getAttribute('content'),
  };
}

function getResourceLinks(elem) {
  return Array.prototype.map.call(
    elem.querySelectorAll('link[rel="localization"]'),
    el => el.getAttribute('href')
  );
}

function cachedIterable(iterable) {
  const cache = [];
  return {
    [Symbol.iterator]() {
      return {
        ptr: 0,
        next() {
          if (cache.length <= this.ptr) {
            cache.push(iterable.next());
          }
          return cache[this.ptr++];
        }
      };
    },
  }
}

function generateContexts(locales, resIds) {
  return locales.map(locale => {
    return {
      _ctx: null,
      async ready() {
        if (!this._ctx) {
          this._ctx = this.load();
        }
        return this._ctx;
      },
      async load() {
        const ctx = new MessageContext([locale]);
        for (let resId of resIds) {
          let source =
            await fetch(resId.replace('{locale}', locale)).then(d => d.text());
          ctx.addMessages(source);
        }
        return ctx;
      }
    };
  });
}

function generateMessages(id, resIds) {
  const locales = negotiateLanguages(
    navigator.languages,
    meta.available,
    {
      defaultLocale: meta.default
    }
  ); 
  return generateContexts(locales, resIds);
}

function createLocalization(resIds) {
  document.l10n = new DOMLocalization(MutationObserver, resIds, generateMessages);

  document.l10n.ready = documentReady().then(() => {
    document.l10n.connectRoot(document.documentElement);
    return document.l10n.translateRoots().then(() => {
      document.body.style.display = 'block';
    });
  });
}

const resIds = getResourceLinks(document.head || document);
const meta = getMeta(document.head);
createLocalization(resIds);
