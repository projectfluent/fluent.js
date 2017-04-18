export default class MessageContext {
  constructor() {
    this.messages = {
      has(id) {
        return true;
      },
      get(id) {
        return id.toUpperCase();
      },
    };
  }

  format(msg) {
    return msg;
  }

  formatToParts(msg) {
    return [msg];
  }
}
