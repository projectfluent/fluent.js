import { MessageContext } from '../../fluent/src/index';

export function generateContexts(locales, resIds) {
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
