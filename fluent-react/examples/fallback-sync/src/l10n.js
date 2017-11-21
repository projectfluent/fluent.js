import 'fluent-intl-polyfill';
import { MessageContext } from 'fluent';

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
    const cx = new MessageContext(locale);
    cx.addMessages(MESSAGES_ALL[locale]);
    yield cx;
  }
}
