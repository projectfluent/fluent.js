import 'fluent-intl-polyfill/compat';
import { MessageContext } from 'fluent/compat';

const MESSAGES_ALL = {
  'pl': `
foo = Foo po polsku
  `,
  'en-US': `
foo = Foo in English
bar = Bar in English
  `,
};


// create-react-app is rather outdated at this point when it comes to modern JS
// support. It's not configured to understand async generators. The function
// below is equivalent to the following generator function:
//
//     export async function* generateMessages() {
//       for (const locale of ['pl', 'en-US']) {
//         const cx = new MessageContext(locale);
//         cx.addMessages(MESSAGES_ALL[locale]);
//         yield cx;
//       }
//    }

export function generateMessages() {
  const locales = ["pl", "en-US"];
  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      const locale = locales.shift();

      if (locale === undefined) {
        return {value: undefined, done: true};
      }

      const cx = new MessageContext(locale);
      cx.addMessages(MESSAGES_ALL[locale]);
      return {value: cx, done: false};
    }
  };
}
