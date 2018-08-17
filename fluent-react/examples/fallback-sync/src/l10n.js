import 'fluent-intl-polyfill/compat';
import { FluentBundle } from 'fluent/compat';

const MESSAGES_ALL = {
  'pl': `
foo = Foo po polsku
  `,
  'en-US': `
foo = Foo in English
bar = Bar in English
  `,
};

export function* generateMessages() {
  for (const locale of ['pl', 'en-US']) {
    const bundle = new FluentBundle(locale);
    bundle.addMessages(MESSAGES_ALL[locale]);
    yield bundle;
  }
}
