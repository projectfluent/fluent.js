'use strict';

function L10nError(message, id, loc) {
  this.name = 'L10nError';
  this.message = message;
  this.id = id;
  this.loc = loc;
}
L10nError.prototype = Object.create(Error.prototype);
L10nError.prototype.constructor = L10nError;

exports.L10nError = L10nError;
