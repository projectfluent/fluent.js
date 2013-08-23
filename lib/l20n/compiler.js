if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('./events').EventEmitter;
  var Parser = require('./parser').Parser;

  function Compiler() {

    // Public

    this.compile = compile;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    var _emitter = new EventEmitter();

    var _entryTypes = {
      Entity: Entity,
    }

    function compile(ast, env) {
      if (!env) {
        env = {};
      }

      for (var i = 0, entry; entry = ast.body[i]; i++) {
        var constructor = _entryTypes[entry.type];
        if (constructor) {
          try {
            env[entry.id.name]  = new constructor(entry, env);
          } catch (e) {
            requireCompilerError(e);
          }
        }
      }

      return env;
    }

    function Entity(node, env) {
      this.id = node.id.name;
      this.env = env;
      this.value = node.value.content;
    }

    Entity.prototype.get = function E_get() {
      var entity = {
        value: this.value
      };
      return entity;
    }

    function addEventListener(type, listener) {
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      return _emitter.removeEventListener(type, listener);
    }
  }

  exports.Compiler = Compiler;
});
