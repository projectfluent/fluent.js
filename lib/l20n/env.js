'use strict';

var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var parse = require('./parser').parse;

function Environment(id) {
  this.id = id;
  this.resources = Object.create(null);

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

  this.getResource = function(url, locale, callback) {
    var path = url.replace('{locale}', locale);
    var type = path.substr(path.lastIndexOf('.') + 1);

    switch (type) {
      case 'properties':
        io.load(path, function(err, source) {
          if (!this.resources[url]) {
            this.resources[url] = Object.create(null);
          }
          this.resources[url][locale] = parse(null, source);
          callback();
        }.bind(this));
        break;
    }
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
