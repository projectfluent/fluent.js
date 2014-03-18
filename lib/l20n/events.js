'use strict';

function EventEmitter() {}

EventEmitter.prototype.emit = function ee_emit() {
  if (!this._listeners) {
    return;
  }
  var args = Array.prototype.slice.call(arguments);
  var type = args.shift();
  if (!this._listeners[type]) {
    return;
  }

  var typeListeners = this._listeners[type].slice();
  for (var i = 0; i < typeListeners.length; i++) {
    typeListeners[i].apply(this, args);
  }
};

EventEmitter.prototype.addEventListener = function ee_add(type, listener) {
  if (!this._listeners) {
    this._listeners = {};
  }
  if (!(type in this._listeners)) {
    this._listeners[type] = [];
  }
  this._listeners[type].push(listener);
};

EventEmitter.prototype.removeEventListener = function ee_rm(type, listener) {
  if (!this._listeners) {
    return;
  }
  var typeListeners = this._listeners[type];
  var pos = typeListeners.indexOf(listener);
  if (pos === -1) {
    return;
  }

  typeListeners.splice(pos, 1);
};
