'use strict';

var L10nError = require('./errors').L10nError;
var EventEmitter = require('./events').EventEmitter;
var Locale = require('./locale').Locale;

function Context(id, parentEnv, supportedLocs) {
  this.id = id;
  this.env = parentEnv;

  var locales = {};
  var resLinks = [];
  var supportedLocales = supportedLocs;
  var emitter = new EventEmitter();

  this.addResource = function(url, callback) {
    resLinks.push(url);

    var locale = getLocale.call(this, supportedLocales[0]);

    locale.addResource(url, callback);
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

  this._updateLocales = function(locales) {
    supportedLocales = locales;
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
    var locale = getLocale.call(this, supportedLocales[0]);

    var entry = locale.getEntry(id);

    callback(entry);
  }

  function getLocale(code) {
    /* jshint -W093 */

    if (locales[code]) {
      return locales[code];
    }

    return locales[code] = new Locale(code, this);
  };


  parentEnv.addEventListener('languagechange', this._updateLocales.bind(this));
}

exports.Context = Context;
