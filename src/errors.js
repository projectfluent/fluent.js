/**
 * An `L10nError` with information about language and message ID in which
 * the error happened.
 */
export class L10nError extends Error {
  constructor(message, id, lang) {
    super();
    this.name = 'L10nError';
    this.message = message;
    this.id = id;
    this.lang = lang;
  }
}
