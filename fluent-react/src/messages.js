import { MessageContext } from 'fluent/compat';

export default class Messages {
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

    this.cx = new MessageContext(this.locales);
    this.cx.addMessages(messages);

    // Update all subscribed LocalizedElements.
    this.subs.forEach(comp => comp.forceUpdate());
  }
}
