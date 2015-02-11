'use strict';
/* global navigator */

var Resolver = require('./resolver.js');
var PropertiesParser = require('./format/properties/parser');
var io = require('./platform/io');
var getPluralRule = require('./plurals').getPluralRule;
var PSEUDO_STRATEGIES = require('./pseudo.js').PSEUDO_STRATEGIES;
var walkContent = require('./util.js').walkContent;

function Locale(id, ctx) {
  this.id = id;
  this.ctx = ctx;
  this.isReady = false;
  this.isPseudo = PSEUDO_STRATEGIES.hasOwnProperty(id);
  this.entries = Object.create(null);
  this.entries.__plural = getPluralRule(this.isPseudo ?
                                        this.ctx.defaultLocale : id);
}

var bindingsIO = {
  extra: function(id, ver, path, type, callback, errback) {
    if (type === 'properties') {
      type = 'text';
    }
    navigator.mozApps.getLocalizationResource(id, ver, path, type).
      then(callback.bind(null, null), errback);
  },
  app: function(id, ver, path, type, callback, errback, sync) {
    switch (type) {
      case 'properties':
        io.load(path, callback, sync);
        break;
      case 'json':
        io.loadJSON(path, callback, sync);
        break;
    }
  },
};

Locale.prototype.build = function L_build(callback) {
  var sync = !callback;
  var ctx = this.ctx;
  var self = this;

  var l10nLoads = ctx.resLinks.length;

  function onL10nLoaded(err) {
    if (err) {
      ctx._emitter.emit('fetcherror', err);
    }
    if (--l10nLoads <= 0) {
      self.isReady = true;
      if (callback) {
        callback();
      }
    }
  }

  if (l10nLoads === 0) {
    onL10nLoaded();
    return;
  }

  function onJSONLoaded(err, json) {
    if (!err && json) {
      self.addAST(json);
    }
    onL10nLoaded(err);
  }

  function onPropLoaded(err, source) {
    if (!err && source) {
      var ast = PropertiesParser.parse(ctx, source);
      self.addAST(ast);
    }
    onL10nLoaded(err);
  }

  var idToFetch = this.isPseudo ? ctx.defaultLocale : this.id;
  var appVersion = null;
  var source = 'app';
  if (typeof(navigator) !== 'undefined') {
    source = navigator.mozL10n._config.localeSources[this.id] || 'app';
    appVersion = navigator.mozL10n._config.appVersion;
  }

  for (var i = 0; i < ctx.resLinks.length; i++) {
    var resLink = decodeURI(ctx.resLinks[i]);
    var path = resLink.replace('{locale}', idToFetch);
    var type = path.substr(path.lastIndexOf('.') + 1);

    var cb;
    switch (type) {
      case 'json':
        cb = onJSONLoaded;
        break;
      case 'properties':
        cb = onPropLoaded;
        break;
    }
    bindingsIO[source](this.id,
      appVersion, path, type, cb, onL10nLoaded, sync);
  }
};

function createPseudoEntry(node, entries) {
  return Resolver.createEntry(
    walkContent(node, PSEUDO_STRATEGIES[this.id].translate),
    entries);
}

Locale.prototype.addAST = function(ast) {
  /* jshint -W084 */

  var createEntry = this.isPseudo ?
    createPseudoEntry.bind(this) : Resolver.createEntry;

  for (var i = 0, node; node = ast[i]; i++) {
    this.entries[node.$i] = createEntry(node, this.entries);
  }
};

exports.Locale = Locale;
