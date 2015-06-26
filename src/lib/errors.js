'use strict';

export function L10nError(message, id, lang) {
  this.name = 'L10nError';
  this.message = message;
  this.id = id;
  this.lang = lang;
}
L10nError.prototype = Object.create(Error.prototype);
L10nError.prototype.constructor = L10nError;
