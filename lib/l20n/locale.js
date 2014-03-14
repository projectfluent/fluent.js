'use strict';

var Locale = require('./locale').Locale;
var compile = require('./compiler').compile;
var io = require('./platform/io');
var getPluralRule = require('./plurals').getPluralRule;

function Locale(id, ctx) {
  this.id = id;
  this.ctx = ctx;

  this.entries = {
    __plural: getPluralRule(id)
  };
  this.isReady = false;
  this.isPartial = false;
}

Locale.prototype.getEntry = function L_getEntry(id) {
  if (this.entries.hasOwnProperty(id)) {
    return this.entries[id];
  }
  return undefined;
};

Locale.prototype.build = function L_build(callback) {
  var sync = !callback;
  var l10nLoads = this.ctx.resLinks.length;
  var self = this;

  function onL10nLoaded() {
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
    onL10nLoaded();
  }

  function onPropLoaded(err, source) {
    if (!err) {
      self.addPropResource(source);
    }
    onL10nLoaded();
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
  compile(ast, this.entries);
};

Locale.prototype.addPropResource = function(source) {
  var ast = this.ctx._parser.parse(source);
  this.addAST(ast);

  // on buildtime, we want to keep the AST in order to serialize it into JSON
  if (this.ctx.isBuildtime) {
    if (!this.ast) {
      this.ast = {};
    }
    for (var i in ast) {
      this.ast[i] = ast[i];
    }
  }
};

