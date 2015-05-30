'use strict';

export function L10nError(message, id, code) {
  this.name = 'L10nError';
  this.message = message;
  this.id = id;
  this.code = code;
}
L10nError.prototype = Object.create(Error.prototype);
L10nError.prototype.constructor = L10nError;
