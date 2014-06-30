'use strict';

var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;

function Environment(id) {
  this.id = id;

  var availableLocales = [];
  var defaultLocale = 'en-US'; // i-default
  var supportedLocales = [defaultLocale];
  var emitter = new EventEmitter();

  this.getContext = function(id) {
    return new Context(id || this.id, this, supportedLocales);
  }

  this.registerLocales = function(dLocale, aLocales) {
    defaultLocale = dLocale;
    availableLocales = aLocales;
  }

  this.requestLocales = function(requested) {
    var supportedLocales = negotiate(availableLocales,
                                     requested,
                                     defaultLocale);

    emitter.emit('languagechange', supportedLocales);
  }

  // Events

  this.addEventListener = function addEventListener(type, listener) {
    emitter.addEventListener(type, listener);
  };

  this.removeEventListener = function removeEventListener(type, listener) {
    emitter.removeEventListener(type, listener);
  };

  /* Private */
  function negotiate(available, requested, defaultLocale) {
    if (available.indexOf(requested[0]) === -1 ||
        requested[0] === defaultLocale) {
      return [defaultLocale];
    } else {
      return [requested[0], defaultLocale];
    }
  }
}
exports.Environment = Environment;
