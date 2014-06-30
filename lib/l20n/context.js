'use strict';

var L10nError = require('./errors').L10nError;
var EventEmitter = require('./events').EventEmitter;
var Locale = require('./locale').Locale;

function Context(id) {
  this.id = id;

  var locales = {};
  var resLinks = [];
  var defaultLocale = 'en-US'; // i-default
  var supportedLocales = [defaultLocale];

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
}

exports.Context = Context;
