'use strict';

var L10nError = require('./errors').L10nError;
var EventEmitter = require('./events').EventEmitter;
var Locale = require('./locale').Locale;

function Context(id, parentEnv, supportedLocs) {
  this.id = id;
  this.env = parentEnv;
  this.resLinks = [];

  var locales = Object.create(null);
  var emitter = new EventEmitter();

  this.addResource = function(url, callback) {
    this.resLinks.push(url);

    var locale = getLocale.call(this, this.env.supportedLocales[0], function(locale) {
      locale.addResource(url, callback);
    });

  } 

  this.get = function(id, args, callback) {
    getWithFallback.call(this, id, function(entry) {
      var str;
      if (entry) {
        str = entry.toString(args);
      } else {
        str = '';
      }
      callback(str);
    });
  }

  // Events

  this.addEventListener = function addEventListener(type, listener) {
    emitter.addEventListener(type, listener);
  };

  this.removeEventListener = function removeEventListener(type, listener) {
    emitter.removeEventListener(type, listener);
  };

  /* private */

  function getWithFallback(id, callback) {
    var locale = getLocale.call(this, this.env.supportedLocales[0], function(locale) {
      var entry = locale.getEntry(id);

      callback(entry);
    });
  }

  function getLocale(code, callback) {
    if (locales[code]) {
      callback(locales[code]);
      return;
    }

    var locale = new Locale(code, this);

    locale.build(function() {
      locales[code] = locale;
      callback(locale);
    });
  };

  function updateLocales(locs) {
    if (locales[this.env.supportedLocales[0]]) {
      emitter.emit('languagechange');
      return;
    };

    getLocale.call(this, this.env.supportedLocales[0], function() {
      emitter.emit('languagechange', this.env.supportedLocales);
    }.bind(this));
  }

  parentEnv.addEventListener('languagechange', updateLocales.bind(this));
}

exports.Context = Context;
