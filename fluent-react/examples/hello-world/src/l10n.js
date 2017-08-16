import React from 'react';
import 'fluent-intl-polyfill/compat';
import { MessageContext } from 'fluent/compat';
import negotiateLanguages from 'fluent-langneg/compat';
import { Placeholder } from 'fluent-react/compat';

const MESSAGES_ALL = {
  'pl': `
title = Witaj świecie!
learn-more =
    Odwiedź { LINK("dokumentację", title: "Wiki", href: "http://example.com") },
    aby dowiedzieć się więcej o { LINK("fluent-react") }.
  `,
  'en-US': `
title = Hello, world!
learn-more =
    Consult the { LINK("documentation", title: "Wiki") } to learn more
    about fluent-react.
  `,
};

export function* generateMessages(userLocales) {
  // Choose locales that are best for the user.
  const currentLocales = negotiateLanguages(
    userLocales,
    ['en-US', 'pl'],
    { defaultLocale: 'en-US' }
  );

  for (const locale of currentLocales) {
    const cx = new MessageContext(locale, {
      functions: {
        // Text is the only positional argument we care about.
        // Title is the only named argument we care about.
        // This gives us filtering unsafe props (like href) for free!
        LINK: function([text], {title}) {
          return <Placeholder title={title}>{text}</Placeholder>;
        }
      }
    });
    cx.addMessages(MESSAGES_ALL[locale]);
    yield cx;
  }
}

