export default class MessageContext {
  hasMessage(id) {
    return true;
  }

  getMessage(id) {
    return id.toUpperCase();
  }

  format(msg) {
    return msg;
  }

  formatToParts(msg) {
    return [msg];
  }
}
