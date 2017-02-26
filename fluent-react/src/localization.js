import { MessageContext } from 'fluent';

export default class Localization {
  constructor(locales, messages) {
    this.subs = new Set();
    this.createContext(locales, messages);
  }

  subscribe(comp) {
    this.subs.add(comp);
  }

  unsubscribe(comp) {
    this.subs.delete(comp);
  }

  createContext(locales, messages) {
    this.locales = locales;
    this.messages = messages;

    const locale = locales;
    this.cx = new MessageContext(locale);
    this.cx.addMessages(messages);

    // Update all subscribed LocalizedElements.
    this.subs.forEach(comp => comp.forceUpdate());
  }
}
