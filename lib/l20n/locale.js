'use strict';

var Entity = require('./compiler').Entity;
var PropertiesParser = require('./format/properties/parser').PropertiesParser;
var io = require('./platform/io');
var getPluralRule = require('./plurals').getPluralRule;

var propertiesParser = null;

function Locale(id, ctx) {
  this.id = id;
  this.ctx = ctx;
  this.isReady = false;
  this.entries = Object.create(null);
  this.entries.__plural = getPluralRule(id);
}

Locale.prototype.getEntry = function L_getEntry(id) {
  /* jshint -W093 */

  var entries = this.entries;

  if (!(id in entries)) {
    return undefined;
  }

  if (entries[id] instanceof Entity) {
    return entries[id];
  }

  return entries[id] = new Entity(id, entries[id], entries);
};

Locale.prototype.build = function L_build(callback) {
  var sync = !callback;
  var ctx = this.ctx;
  var self = this;

  var l10nLoads = ctx.resLinks.length;

  function onL10nLoaded(err) {
    if (err) {
      ctx._emitter.emit('error', err);
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
      if (!propertiesParser) {
        propertiesParser = new PropertiesParser();
      }
      var ast = propertiesParser.parse(ctx, source);
      self.addAST(ast);
    }
    onL10nLoaded(err);
  }


  for (var i = 0; i < ctx.resLinks.length; i++) {
    var path = ctx.resLinks[i].replace('{{locale}}', this.id);
    var type = path.substr(path.lastIndexOf('.') + 1);

    switch (type) {
      case 'json':
        io.loadJSON(path, onJSONLoaded, sync);
        break;
      case 'properties':
        io.load(path, onPropLoaded, sync);
        break;
    }
  }
};

Locale.prototype.addAST = function(ast) {
  var keys = Object.keys(ast);
  for (var i = 0, key; key = keys[i]; i++) {
    this.entries[key] = ast[key];
  }
};

Locale.prototype.getEntity = function(id, ctxdata) {
  var entry = this.getEntry(id);

  if (!entry) {
    return null;
  }
  return entry.valueOf(ctxdata);
};

exports.Locale = Locale;
