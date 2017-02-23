import { MessageContext } from 'fluent';

export default class Localization {
  constructor(locales, requestMessages) {
    this.subs = new Set();
    this.requestMessages = requestMessages;
    this.setLocales(locales);
  }

  subscribe(comp) {
    this.subs.add(comp);
  }

  unsubscribe(comp) {
    this.subs.delete(comp);
  }

  setLocales(locales) {
    // take the first locale for now
    const [locale] = locales;
    // requestMessages may be sync or async
    const request = this.requestMessages(locale);
    return Promise.resolve(request).then(
      messages => this.createContext(locale, messages)
    );
  }

  createContext(locale, messages) {
    this.locale = locale;
    this.cx = new MessageContext(locale);
    this.cx.addMessages(messages);

    this.subs.forEach(comp => comp.forceUpdate());
  }
}
