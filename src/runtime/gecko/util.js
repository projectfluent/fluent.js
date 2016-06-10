import { contexts } from '../../lib/dom/base';
import { valueFromContext } from '../../lib/format';

export { documentReady, getResourceLinks, getMeta } from '../web/util';

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
      case 'language-create':
      case 'language-update': {
        this.interactive = this.interactive.then(bundles => {
          // just overwrite any existing messages in the first bundle
          const ctx = contexts.get(bundles[0]);
          ctx.addMessages(data);
          return bundles;
        });
        return obs.translateRoots(this);
      }
      default: {
        throw new Error(`Unknown topic: ${topic}`);
      }
    }
  }
}
