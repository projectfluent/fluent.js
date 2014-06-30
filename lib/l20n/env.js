'use strict';

var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var parse = require('./parser').parse;

function Environment(id) {
  var defaultLocale = 'en-US'; // i-default
  var availableLocales = [];
  var emitter = new EventEmitter();

  this.id = id;
  this.resources = Object.create(null);
  this.supportedLocales = [defaultLocale];


  this.getContext = function(id) {
    return new Context(id || this.id, this, this.supportedLocales);
  }

  this.registerLocales = function(dLocale, aLocales) {
    defaultLocale = dLocale;
    availableLocales = aLocales;
  }

  this.requestLocales = function(requested) {
    this.supportedLocales = negotiate(availableLocales,
                                      requested,
                                      defaultLocale);

    emitter.emit('languagechange', this.supportedLocales);
  }

  this.getResource = function(url, locale, callback) {
    if (this.resources[url] && this.resources[url][locale]) {
      callback();
      return;
    }

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
