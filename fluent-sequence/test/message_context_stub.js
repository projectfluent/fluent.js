export default class MessageContext {
  _setMessages(ids) {
    this.ids = ids;
  }

  hasMessage(id) {
    return this.ids.includes(id);
  }

  getMessage(id) {
    if (this.hasMessage(id)) {
      return id.toUpperCase();
    }
  }

  format(msg) {
    return msg;
  }
}
