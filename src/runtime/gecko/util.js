import { contexts } from '../../bindings/dom/base';

export { documentReady, getResourceLinks, getMeta } from '../web/util';

export function observe(subject, topic, data) {
  switch (topic) {
    case 'language-update': {
      this.interactive = this.interactive.then(bundles => {
        // just overwrite any existing messages in the first bundle
        const ctx = contexts.get(bundles[0]);
        ctx.addMessages(data);
        return bundles;
      });
      return this.interactive.then(
        bundles => translateDocument(this, bundles)
      );
    }
    default: {
      throw new Error(`Unknown topic: ${topic}`);
    }
  }
}
