import { Localization, contexts, translateDocument }
  from '../../bindings/html';
import { valueFromContext } from '../../lib/format';

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/IntlMessageContext.jsm');

const functions = {
  OS: function() {
    switch (Services.appinfo.OS) {
      case 'WINNT':
        return 'win';
      case 'Linux':
        return 'lin';
      case 'Darwin':
        return 'mac';
      case 'Android':
        return 'android';
      default:
        return 'other';
    }
  }
};

function createContext(lang) {
  return new MessageContext(lang, { functions });
}

export class GeckoLocalization extends Localization {
  constructor(doc, requestBundles) {
    super(doc, requestBundles, createContext);

    this.interactive.then(bundles => {
      this.getValue = function(id, args) {
        return valueFromContext(contexts.get(bundles[0]), id, args)[0];
      };
    });
  }

  observe(subject, topic, data) {
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
}
