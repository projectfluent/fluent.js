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
      Macro: Macro
    };

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
      this.value = node.value;
      this.index = node.index;
      this.attributes = {};

      for (var i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes[i];
        this.attributes[attr.key.name] = attr;
      }
    }

    function getArg(id, env, args) {
      if (args && id in args) {
        return args[id];
      } else if (id in env) {
        var subentity = env[id].get();
        return subentity.value;
      }
    }

    function getValue(entity, env, args) {
      var value = entity.value;
      if (value.type === 'String') {
        return value.content;
      } else if (value.type === 'ComplexString') {
        var v = [];
        value.body.forEach(function (chunk) {
          switch (chunk.type) {
            case 'String':
              v.push(chunk.content);
              break;
            case 'Identifier':
              var arg = getArg(chunk.name, env, args);
              if (arg) {
                v.push(arg);
              } else {
                v.push('{{' + chunk.name + '}}');
              }
              break;
          }
        }, this);
        return v.join('');
      } else if (value.type === 'Hash') {
        var key = null;
        if (entity.index) {
          var macro = env[entity.index[0].callee.name];
          var i = entity.index[0].arguments[0].name;
          var index = getArg(i, env, args);
          var key = macro._call(index);
        }
        for (var hi in value.content) {
          if (value.content[hi].key === key) {
            return getValue(value.content[hi], env, args);
          }
        }
        return getValue(value.content[hi], env, args);
      }
    }

    Entity.prototype.get = function E_get(args) {
      var attrs = {};

      for (var key in this.attributes) {
        attrs[key] = getValue(this.attributes[key], this.env, args);
      }

      return {
        value: getValue(this, this.env, args),
        attributes: attrs
      };
    };

    function addEventListener(type, listener) {
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      return _emitter.removeEventListener(type, listener);
    }
  }

  function Macro(node, env) {
    this.id = node.id.name;
    this.env = env;
    this.expression = node.expression;
    this.args = node.args;
  }

  Macro.prototype._call = function M_call(arg) {
    return this.expression(arg);
  };

  exports.Compiler = Compiler;
});
