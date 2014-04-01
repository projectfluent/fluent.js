'use strict';

var Entity = require('./compiler').Entity;
var parse = require('./parser').parse;
var io = require('./platform/io');
var getPluralRule = require('./plurals').getPluralRule;

function Locale(id, ctx) {
  this.id = id;
  this.ctx = ctx;
  this.isReady = false;
  this.entries = {
    __plural: getPluralRule(id)
  };
}

Locale.prototype.getEntry = function L_getEntry(id) {
  if (!this.entries.hasOwnProperty(id)) {
    return undefined;
  }
  if (this.entries[id] instanceof Entity) {
    return this.entries[id];
  }
  return this.entries[id] = new Entity(id, this.entries[id], this.entries);
};

Locale.prototype.build = function L_build(callback) {
  var sync = !callback;
  var l10nLoads = this.ctx.resLinks.length;
  var self = this;

  function onL10nLoaded(err) {
    if (err) {
      self.ctx._emitter.emit('error', err);
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
    if (!err) {
      self.addAST(json);
    }
    onL10nLoaded(err);
  }

  function onPropLoaded(err, source) {
    if (!err) {
      self.addPropResource(source);
    }
    onL10nLoaded(err);
  }


  for (var i = 0; i < this.ctx.resLinks.length; i++) {
    var path = this.ctx.resLinks[i].replace('{{locale}}', this.id);
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
  for (var id in ast) {
    if (ast.hasOwnProperty(id)) {
      this.entries[id] = ast[id];
    }
  }
};

Locale.prototype.addPropResource = function(source) {
  var ast = parse(this.ctx, source);
  this.addAST(ast);

  // on buildtime, we want to keep the AST in order to serialize it into JSON
  if (this.ctx.isBuildtime) {
    if (!this.ast) {
      this.ast = {};
    }
    for (var id in ast) {
      if (ast.hasOwnProperty(id)) {
        this.ast[id] = ast[id];
      }
    }
  }
};

Locale.prototype.getEntity = function(id, ctxdata) {
  var entry = this.getEntry(id);

  if (entry === null) {
    return null;
  }
  return entry.valueOf(ctxdata);
};

exports.Locale = Locale;
