import { properties, contexts, fetchFirstBundle } from '../../lib/dom/base';
import { valueFromContext } from '../../lib/format';

export {
  documentReady as HTMLDocumentReady, getResourceLinks
} from '../web/util';

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
            obs.translateRoots(this);
          }
          return bundles;
        });
      }
      default: {
        throw new Error(`Unknown topic: ${topic}`);
      }
    }
  }
}
