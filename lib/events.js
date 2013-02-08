(function() {
  'use strict';

  function EventEmitter() {
    this._listeners = {};
  }

  EventEmitter.prototype.emit = function ee_emit() {
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var typeListeners = this._listeners[type];
    if (!typeListeners || !typeListeners.length) {
      return false;
    }
    typeListeners.forEach(function(listener) {
      listener.apply(this, args);
    }, this);
    return true;
  }

  EventEmitter.prototype.addEventListener = function ee_add(type, listener) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
    return this;
  }

  EventEmitter.prototype.removeEventListener = function ee_remove(type, listener) {
    var typeListeners = this._listeners[type];
    var pos = typeListeners.indexOf(listener);
    if (pos === -1) {
      return this;
    }
    listeners.splice(pos, 1);
    return this;
  }

  this.EventEmitter = EventEmitter;
}).call(L20n);
