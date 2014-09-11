'use strict';

var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var parse = require('./parser').parse;

function Env(id) {
  this.id = id;

  this.default = 'i-default';
  this.available = ['i-default'];
  this.supported = ['i-default'];

  this._registered = undefined;
  this._emitter = new EventEmitter();
  this._resources = Object.create(null);
}

Env.prototype.register = function(manifest) {
  // XXX async request to lang pack service to get more available languages
  setTimeout(function() {
    this.default = manifest.default_locale;
    this.available = Object.keys(manifest.locales);
    this._emitter.emit('availablelanguageschange', this.available);
  }.bind(this));
};

Env.prototype.request = function(langs) {
  // XXX this should be a proper language negotiation
  if (this.available.indexOf(langs[0]) === -1 ||
      langs[0] === this.default) {
    this.supported = [this.default];
  } else {
    this.supported = [langs[0], this.default];
  }
};

Env.prototype.getContext = function(resPaths) {
  return new Context(this, resPaths);
};

Env.prototype.getResource = function(url, locale, callback) {
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
};

Env.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Env.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};

exports.Env = Env;
