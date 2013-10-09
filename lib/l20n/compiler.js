// This is L20n's on-the-fly compiler.  It takes the AST produced by the parser 
// and uses it to create a set of JavaScript objects and functions representing 
// entities and macros and other expressions.
//
// The module defines a `Compiler` singleton with a single method: `compile`.
// The result of the compilation is stored on the `entries` object passed as 
// the second argument to the `compile` function.  The third argument is 
// `globals`, an object whose properties provide information about the runtime 
// environment, e.g., the current hour, operating system etc.
//
// Main concepts
// -------------
//
// **Entities** and **attributes** are objects which are publicly available.  
// Their `toString` method is designed to be used by the L20n context to get 
// a string value of the entity, given the context data passed to the method.
//
// All other symbols defined by the grammar are implemented as expression 
// functions.  The naming convention is:
//
//   - capitalized first letters denote **expressions constructors**, e.g.
//   `PropertyExpression`.
//   - camel-case denotes **expression functions** returned by the 
//   constructors, e.g. `propertyExpression`.
//
// ### Constructors
//
// The constructor is called for every node in the AST.  It stores the 
// components of the expression which are constant and do not depend on the 
// calling context (an example of the latter would be the data passed by the 
// developer to the `toString` method).
// 
// ### Expression functions
//
// The constructor, when called, returns an expression function, which, in 
// turn, is called every time the expression needs to be evaluated.  The 
// evaluation call is context-dependend.  Every expression function takes two 
// mandatory arguments and one optional one:
//
// - `locals`, which stores the information about the currently evaluated 
// entity (`locals.__this__`).  It also stores the arguments passed to macros.
// - `ctxdata`, which is an object with data passed to the context by the 
// developer.  The developer can define data on the context, or pass it on 
// a per-call basis.
// - `key` (optional), which is a number or a string passed to a `HashLiteral` 
// expression denoting the member of the hash to return.  The member will be 
// another expression function which can then be evaluated further.
//
//
// Bubbling up the new _current_ entity
// ------------------------------------
//
// Every expression function returns an array [`newLocals`, `evaluatedValue`].
// The reason for this, and in particular for returning `newLocals`, is 
// important for understanding how the compiler works.
//
// In most of the cases. `newLocals` will be the same as the original `locals` 
// passed to the expression function during the evaluation call.  In some 
// cases, however, `newLocals.__this__` will reference a different entity than 
// `locals.__this__` did.  On runtime, as the compiler traverses the AST and 
// goes deeper into individual branches, when it hits an `identifier` and 
// evaluates it to an entity, it needs to **bubble up** this find back to the 
// top expressions in the chain.  This is so that the evaluation of the 
// top-most expressions in the branch (root being at the very top of the tree) 
// takes into account the new value of `__this__`.
//
// To illustrate this point, consider the following example.
//
// Two entities, `brandName` and `about` are defined as such:
// 
//     <brandName {
//       short: "Firefox",
//       long: "Mozilla {{ ~ }}"
//     }>
//     <about "About {{ brandName.long }}">
//
// Notice two `complexString`s: `about` references `brandName.long`, and 
// `brandName.long` references its own entity via `~`.  This `~` (meaning, the 
// current entity) must always reference `brandName`, even when called from 
// `about`.
//
// The AST for the `about` entity looks like this:
//
//     [Entity]
//       .id[Identifier]
//         .name[unicode "about"]
//       .index
//       .value[ComplexString]                      <1>
//         .content
//           [String]                               <2>
//             .content[unicode "About "]
//           [PropertyExpression]                   <3>
//             .expression[Identifier]              <4>
//               .name[unicode "brandName"]
//             .property[Identifier]
//               .name[unicode "long"]
//             .computed[bool=False]
//       .attrs
//       .local[bool=False]
//
// During the compilation the compiler will walk the AST top-down to the 
// deepest terminal leaves and will use expression constructors to create 
// expression functions for the components.  For instance, for `about`'s value, 
// the compiler will call `ComplexString()` to create an expression function 
// `complexString` <1> which will be assigned to the entity's value. The 
// `ComplexString` construtor, before it returns the `complexString` <1>, will 
// in turn call other expression constructors to create `content`: 
// a `stringLiteral` and a `propertyExpression`.  The `PropertyExpression` 
// contructor will do the same, etc...
//
// When `entity.getString(ctxdata)` is called by a third-party code, we need to 
// resolve the whole `complexString` <1> to return a single string value.  This 
// is what **resolving** means and it involves some recursion.  On the other 
// hand, **evaluating** means _to call the expression once and use what it 
// returns_.
// 
// The identifier expression sets `locals.__this__` to the current entity, 
// `about`, and tells the `complexString` <1> to _resolve_ itself.
//
// In order to resolve the `complexString` <1>, we start by resolving its first 
// member <2> to a string.  As we resolve deeper down, we bubble down `locals` 
// set by `toString`.  The first member of `content` turns out to simply be 
// a string that reads `About `.
//
// On to the second member, the propertyExpression <3>.  We bubble down 
// `locals` again and proceed to evaluate the `expression` field, which is an 
// `identifier`.  Note that we don't _resolve_ it to a string; we _evaluate_ it 
// to something that can be further used in other expressions, in this case, an 
// **entity** called `brandName`.
//
// Had we _resolved_ the `propertyExpression`, it would have resolve to 
// a string, and it would have been impossible to access the `long` member.  
// This leads us to an important concept:  the compiler _resolves_ expressions 
// when it expects a primitive value (a string, a number, a bool).  On the 
// other hand, it _evaluates_ expressions (calls them only once) when it needs 
// to work with them further, e.g. in order to access a member of the hash.
//
// This also explains why in the above example, once the compiler hits the 
// `brandName` identifier and changes the value of `locals.__this__` to the 
// `brandName` entity, this value doesn't bubble up all the way up to the 
// `about` entity.  All components of any `complexString` are _resolved_ by the 
// compiler until a primitive value is returned.  This logic lives in the 
// `_resolve` function.

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports) {
  // TODO change newcap to true?
  /* jshint strict: false, newcap: false */
  var EventEmitter = require('./events').EventEmitter;

  function Compiler() {

    // Public

    this.compile = compile;
    this.setGlobals = setGlobals;
    this.addEventListener = addEvent;
    this.removeEventListener = removeEvent;

    // Private

    var MAX_PLACEABLE_LENGTH = 2500;

    var _emitter = new EventEmitter();
    var _globals = null;
    var _references = {
      globals: {}
    };

    var _entryTypes = {
      Entity: Entity,
      Macro: Macro
    };

    // Public API functions

    function compile(ast, env) {
      if (!env) {
        env = {};
      }
      for (var i = 0, entry; entry = ast.body[i]; i++) {
        var Constructor = _entryTypes[entry.type];
        if (Constructor) {
          try {
            env[entry.id.name] = new Constructor(entry, env);
          } catch (e) {
            // rethrow non-compiler errors;
            requireCompilerError(e);
            // or, just ignore the error;  it's been already emitted
          }
        }
      }
      return env;
    }

    function setGlobals(globals) {
      _globals = globals;
      return true;
    }

    function addEvent(type, listener) {
      return _emitter.addEventListener(type, listener);
    }

    function removeEvent(type, listener) {
      return _emitter.removeEventListener(type, listener);
    }

    // utils

    function emit(Ctor, message, entry, source) {
      var e = new Ctor(message, entry, source);
      _emitter.emit('error', e);
      return e;
    }

    // The Entity object.
    function Entity(node, env) {
      this.id = node.id.name;
      this.env = env;
      this.local = node.local || false;
      this.index = null;
      this.attributes = null;
      this.publicAttributes = null;
      var i;
      if (node.index) {
        this.index = [];
        for (i = 0; i < node.index.length; i++) {
          this.index.push(IndexExpression(node.index[i], this));
        }
      }
      if (node.attrs) {
        this.attributes = {};
        this.publicAttributes = [];
        for (i = 0; i < node.attrs.length; i++) {
          var attr = node.attrs[i];
          this.attributes[attr.key.name] = new Attribute(attr, this);
          if (!attr.local) {
            this.publicAttributes.push(attr.key.name);
          }
        }
      }
      // Bug 817610 - Optimize a fast path for String entities in the Compiler
      if (node.value && node.value.type === 'String') {
        this.value = node.value.content;
      } else {
        this.value = LazyExpression(node.value, this, this.index);
      }
    }

    Entity.prototype.getString = function E_getString(ctxdata) {
      try {
        var locals = {
          __this__: this,
          __env__: this.env
        };
        return _resolve(this.value, locals, ctxdata);
      } catch (e) {
        requireCompilerError(e);
        // `ValueErrors` are not emitted in `StringLiteral` where they are 
        // created, because if the string in question is being evaluated in an 
        // index, we'll emit an `IndexError` instead.  To avoid duplication, 
        // `ValueErrors` are only be emitted if they actually make it to 
        // here.  See `IndexExpression` for an example of why they wouldn't.
        if (e instanceof ValueError) {
          _emitter.emit('error', e);
        }
        throw e;
      }
    };

    Entity.prototype.get = function E_get(ctxdata) {
      // reset `_references` to an empty state
      _references.globals = {};
      // evaluate the entity and its attributes;  if any globals are used in 
      // the process, `toString` will populate `_references.globals` 
      // accordingly.
      var entity = {
        value: this.getString(ctxdata),
        attributes: {}
      };
      if (this.publicAttributes) {
        entity.attributes = {};
        for (var i = 0, attr; attr = this.publicAttributes[i]; i++) {
          entity.attributes[attr] = this.attributes[attr].getString(ctxdata);
        }
      }
      entity.globals = _references.globals;
      return entity;
    };


    function Attribute(node, entity) {
      this.key = node.key.name;
      this.local = node.local || false;
      this.index = null;
      if (node.index) {
        this.index = [];
        for (var i = 0; i < node.index.length; i++) {
          this.index.push(IndexExpression(node.index[i], this));
        }
      }
      if (node.value && node.value.type === 'String') {
        this.value = node.value.content;
      } else {
        this.value = LazyExpression(node.value, entity, this.index);
      }
      this.entity = entity;
    }

    Attribute.prototype.getString = function A_getString(ctxdata) {
      try {
        var locals = {
          __this__: this.entity,
          __env__: this.entity.env
        };
        return _resolve(this.value, locals, ctxdata);
      } catch (e) {
        requireCompilerError(e);
        if (e instanceof ValueError) {
          _emitter.emit('error', e);
        }
        throw e;
      }
    };

    function Macro(node, env) {
      this.id = node.id.name;
      this.env = env;
      this.local = node.local || false;
      this.expression = LazyExpression(node.expression, this);
      this.args = node.args;
    }
    Macro.prototype._call = function M_call(args, ctxdata) {
      var locals = {
        __this__: this,
        __env__: this.env
      };
      // the number of arguments passed must equal the macro's arity
      if (this.args.length !== args.length) {
        throw new RuntimeError(this.id + '() takes exactly ' +
                               this.args.length + ' argument(s) (' +
                               args.length + ' given)');
      }
      for (var i = 0; i < this.args.length; i++) {
        locals[this.args[i].id.name] = args[i];
      }
      var final = this.expression(locals, ctxdata);
      locals = final[0];
      final = final[1];
      return [locals, _resolve(final, locals, ctxdata)];
    };


    var EXPRESSION_TYPES = {
      // Primary expressions.
      'Identifier': Identifier,
      'ThisExpression': ThisExpression,
      'VariableExpression': VariableExpression,
      'GlobalsExpression': GlobalsExpression,

      // Value expressions.
      'Number': NumberLiteral,
      'String': StringLiteral,
      'Hash': HashLiteral,
      'HashItem': Expression,
      'ComplexString': ComplexString,

      // Logical expressions.
      'UnaryExpression': UnaryExpression,
      'BinaryExpression': BinaryExpression,
      'LogicalExpression': LogicalExpression,
      'ConditionalExpression': ConditionalExpression,

      // Member expressions.
      'CallExpression': CallExpression,
      'PropertyExpression': PropertyExpression,
      'AttributeExpression': AttributeExpression,
      'ParenthesisExpression': ParenthesisExpression
    };

    // The 'dispatcher' expression constructor.  Other expression constructors 
    // call this to create expression functions for their components.  For 
    // instance, `ConditionalExpression` calls `Expression` to create
    // expression functions for its `test`, `consequent` and `alternate` 
    // symbols.
    function Expression(node, entry, index) {
      // An entity can have no value.  It will be resolved to `null`.
      if (!node) {
        return null;
      }
      if (!EXPRESSION_TYPES[node.type]) {
        throw emit('CompilationError', 'Unknown expression type' + node.type);
      }
      if (index) {
        index = index.slice();
      }
      return EXPRESSION_TYPES[node.type](node, entry, index);
    }

    function LazyExpression(node, entry, index) {
      // An entity can have no value.  It will be resolved to `null`.
      if (!node) {
        return null;
      }
      var expr;
      return function(locals, ctxdata, prop) {
        if (!expr) {
          expr = Expression(node, entry, index);
        }
        return expr(locals, ctxdata, prop);
      };
    }

    function _resolve(expr, locals, ctxdata) {
      // Bail out early if it's a primitive value or `null`.  This is exactly 
      // what we want.
      if (typeof expr === 'string' ||
          typeof expr === 'boolean' ||
          typeof expr === 'number' ||
          !expr) {
        return expr;
      }

      // Check if `expr` is an Entity or an Attribute
      if (expr.value !== undefined) {
        return _resolve(expr.value, locals, ctxdata);
      }

      // Check if `expr` is an expression
      if (typeof expr === 'function') {
        var current = expr(locals, ctxdata);
        locals = current[0];
        current = current[1];
        return _resolve(current, locals, ctxdata);
      }

      // Throw if `expr` is a macro
      if (expr.expression) {
        throw new RuntimeError('Uncalled macro: ' + expr.id);
      }

      // Throw if `expr` is a non-primitive from ctxdata or a global
      throw new RuntimeError('Cannot resolve ctxdata or global of type ' +
                             typeof expr);

    }

    function Identifier(node) {
      var name = node.name;
      return function identifier(locals) {
        if (!locals.__env__.hasOwnProperty(name)) {
          throw new RuntimeError('Reference to an unknown entry: ' + name);
        }
        // The only thing we care about here is the new `__this__` so we 
        // discard any other local variables.  Note that because this is an 
        // assignment to a local variable, the original `locals` passed is not 
        // changed.
        locals = {
          __this__: locals.__env__[name],
          __env__: locals.__env__
        };
        return [locals, locals.__this__];
      };
    }
    function ThisExpression() {
      return function thisExpression(locals) {
        return [locals, locals.__this__];
      };
    }
    function VariableExpression(node) {
      var name = node.id.name;
      return function variableExpression(locals, ctxdata) {
        if (locals.hasOwnProperty(name)) {
          // locals[name] is already a [locals, value] tuple on its own
          return locals[name];
        }
        if (!ctxdata || !ctxdata.hasOwnProperty(name)) {
          throw new RuntimeError('Reference to an unknown variable: ' + name);
        }
        return [locals, ctxdata[name]];
      };
    }
    function GlobalsExpression(node) {
      var name = node.id.name;
      return function globalsExpression(locals) {
        if (!_globals) {
          throw new RuntimeError('No globals set (tried @' + name + ')');
        }
        if (!_globals.hasOwnProperty(name)) {
          throw new RuntimeError('Reference to an unknown global: ' + name);
        }
        var value;
        try {
          value = _globals[name].get();
        } catch (e) {
          throw new RuntimeError('Cannot evaluate global ' + name);
        }
        _references.globals[name] = true;
        return [locals, value];
      };
    }
    function NumberLiteral(node) {
      return function numberLiteral(locals) {
        return [locals, node.value];
      };
    }
    function StringLiteral(node) {
      return function stringLiteral(locals, ctxdata, key) {
        // if a key was passed, throw;  checking arguments is more reliable 
        // than testing the value of key because if the key comes from context 
        // data it can be any type, also undefined
        if (key !== undefined) {
          throw new RuntimeError('Cannot get property of a string: ' + key);
        }
        return [locals, node.content];
      };
    }

    function ComplexString(node, entry) {
      var content = [];
      for (var i = 0; i < node.content.length; i++) {
        content.push(Expression(node.content[i], entry));
      }

      // Every complexString needs to have its own `dirty` flag whose state 
      // persists across multiple calls to the given complexString.  On the 
      // other hand, `dirty` must not be shared by all complexStrings.  Hence 
      // the need to define `dirty` as a variable available in the closure.  
      // Note that the anonymous function is a self-invoked one and it returns 
      // the closure immediately.
      return (function() {
        var dirty = false;
        return function complexString(locals, ctxdata, key) {
          if (key !== undefined) {
            throw new RuntimeError('Cannot get property of a string: ' + key);
          }
          if (dirty) {
            throw new RuntimeError('Cyclic reference detected');
          }
          dirty = true;
          var parts = [];
          try {
            for (var i = 0; i < content.length; i++) {
              var part = _resolve(content[i], locals, ctxdata);
              if (typeof part !== 'string' && typeof part !== 'number') {
                throw new RuntimeError('Placeables must be strings or ' +
                                       'numbers');
              }
              if (part.length > MAX_PLACEABLE_LENGTH) {
                throw new RuntimeError('Placeable has too many characters, ' +
                                       'maximum allowed is ' +
                                       MAX_PLACEABLE_LENGTH);
              }
              parts.push(part);
            }
          } catch (e) {
            requireCompilerError(e);
            // only throw, don't emit yet.  If the `ValueError` makes it to 
            // `getString()` it will be emitted there.  It might, however, be 
            // cought by `IndexExpression` and changed into a `IndexError`.  
            // See `IndexExpression` for more explanation.
            throw new ValueError(e.message, entry, node.source);
          } finally {
            dirty = false;
          }
          return [locals, parts.join('')];
        };
      })();
    }

    function IndexExpression(node, entry) {
      var expression = Expression(node, entry);

      // This is analogous to `ComplexString` in that an individual index can 
      // only be visited once during the resolution of an Entity.  `dirty` is 
      // set in a closure context of the returned function.
      return (function() {
        var dirty = false;
        return function indexExpression(locals, ctxdata) {
          if (dirty) {
            throw new RuntimeError('Cyclic reference detected');
          }
          dirty = true;
          var retval;
          try {
            // We need to resolve `expression` here so that we catch errors 
            // thrown deep within.  Without `_resolve` we might end up with an 
            // unresolved Entity object, and no "Cyclic reference detected" 
            // error would be thown.
            retval = _resolve(expression, locals, ctxdata);
          } catch (e) {
            // If it's an `IndexError` thrown deeper within `expression`, it 
            // has already been emitted by its `indexExpression`.  We can 
            // safely re-throw it here.
            if (e instanceof IndexError) {
              throw e;
            }

            // Otherwise, make sure it's a `RuntimeError` or a `ValueError` and 
            // throw and emit an `IndexError`.
            //
            // If it's a `ValueError` we want to replace it by an `IndexError` 
            // here so that `ValueErrors` from the index don't make their way 
            // up to the context.  The context only cares about ValueErrors 
            // thrown by the value of the entity it has requested, not entities 
            // used in the index.
            //
            // To illustrate this point with an example, consider the following 
            // two strings, where `foo` is a missing entity.
            //
            //     <prompt1["remove"] {
            //       remove: "Remove {{ foo }}?",
            //       keep: "Keep {{ foo }}?"
            //     }>
            //
            // `prompt1` will throw a `ValueError`.  The context can use it to 
            // display the source of the entity, i.e. `Remove {{ foo }}?`.  The 
            // index resolved properly, so at least we know that we're showing 
            // the right variant of the entity.
            //
            //     <prompt2["{{ foo }}"] {
            //       remove: "Remove file?",
            //       keep: "Keep file?"
            //     }>
            //
            // On the other hand, `prompt2` will throw an `IndexError`.  This 
            // is a more serious scenario for the context.  We should not 
            // assume that we know which variant to show to the user.  In fact, 
            // in the above (much contrived, but still) example, showing the 
            // incorrect variant will likely lead to data loss.  The context 
            // should be more strict in this case and should not try to recover 
            // from this error too hard.
            requireCompilerError(e);
            throw emit(IndexError, e.message, entry);
          } finally {
            dirty = false;
          }
          return [locals, retval];
        };
      })();
    }

    function HashLiteral(node, entry, index) {
      var content = {};
      // if absent, `defaultKey` and `defaultIndex` are undefined
      var defaultKey;
      var defaultIndex = index ? index.shift() : undefined;
      for (var i = 0; i < node.content.length; i++) {
        var elem = node.content[i];
        // use `elem.value` to skip `HashItem` and create the value right away
        content[elem.key.name] = Expression(elem.value, entry, index);
        if (elem.default) {
          defaultKey = elem.key.name;
        }
      }
      return function hashLiteral(locals, ctxdata, prop) {
        var keysToTry = [prop, defaultIndex, defaultKey];
        var keysTried = [];
        for (var i = 0; i < keysToTry.length; i++) {
          var key = _resolve(keysToTry[i], locals, ctxdata);
          if (key === undefined) {
            continue;
          }
          if (typeof key !== 'string') {
            throw emit(IndexError, 'Index must be a string', entry);
          }
          keysTried.push(key);
          if (content.hasOwnProperty(key)) {
            return [locals, content[key]];
          }
        }

        // If no valid key was found, throw an `IndexError`
        var message;
        if (keysTried.length) {
          message = 'Hash key lookup failed ' +
                        '(tried "' + keysTried.join('", "') + '").';
        } else {
          message = 'Hash key lookup failed.';
        }
        throw emit(IndexError, message, entry);
      };
    }


    function UnaryOperator(token, entry) {
      if (token === '-') return function negativeOperator(argument) {
        if (typeof argument !== 'number') {
          throw new RuntimeError('The unary - operator takes a number');
        }
        return -argument;
      };
      if (token === '+') return function positiveOperator(argument) {
        if (typeof argument !== 'number') {
          throw new RuntimeError('The unary + operator takes a number');
        }
        return +argument;
      };
      if (token === '!') return function notOperator(argument) {
        if (typeof argument !== 'boolean') {
          throw new RuntimeError('The ! operator takes a boolean');
        }
        return !argument;
      };
      throw emit(CompilationError, 'Unknown token: ' + token, entry);
    }
    function BinaryOperator(token, entry) {
      if (token === '==') return function equalOperator(left, right) {
        if ((typeof left !== 'number' || typeof right !== 'number') &&
            (typeof left !== 'string' || typeof right !== 'string')) {
          throw new RuntimeError('The == operator takes two numbers or ' +
                                 'two strings');
        }
        return left === right;
      };
      if (token === '!=') return function notEqualOperator(left, right) {
        if ((typeof left !== 'number' || typeof right !== 'number') &&
            (typeof left !== 'string' || typeof right !== 'string')) {
          throw new RuntimeError('The != operator takes two numbers or ' +
                                 'two strings');
        }
        return left !== right;
      };
      if (token === '<') return function lessThanOperator(left, right) {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new RuntimeError('The < operator takes two numbers');
        }
        return left < right;
      };
      if (token === '<=') return function lessThanEqualOperator(left, right) {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new RuntimeError('The <= operator takes two numbers');
        }
        return left <= right;
      };
      if (token === '>') return function greaterThanOperator(left, right) {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new RuntimeError('The > operator takes two numbers');
        }
        return left > right;
      };
      if (token === '>=') {
        return function greaterThanEqualOperator(left, right) {
          if (typeof left !== 'number' || typeof right !== 'number') {
            throw new RuntimeError('The >= operator takes two numbers');
          }
          return left >= right;
        };
      }
      if (token === '+') return function addOperator(left, right) {
        if ((typeof left !== 'number' || typeof right !== 'number') &&
            (typeof left !== 'string' || typeof right !== 'string')) {
          throw new RuntimeError('The + operator takes two numbers or ' +
                                 'two strings');
        }
        return left + right;
      };
      if (token === '-') return function substractOperator(left, right) {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new RuntimeError('The - operator takes two numbers');
        }
        return left - right;
      };
      if (token === '*') return function multiplyOperator(left, right) {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new RuntimeError('The * operator takes two numbers');
        }
        return left * right;
      };
      if (token === '/') return function devideOperator(left, right) {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new RuntimeError('The / operator takes two numbers');
        }
        if (right === 0) {
          throw new RuntimeError('Division by zero not allowed.');
        }
        return left / right;
      };
      if (token === '%') return function moduloOperator(left, right) {
        if (typeof left !== 'number' || typeof right !== 'number') {
          throw new RuntimeError('The % operator takes two numbers');
        }
        if (right === 0) {
          throw new RuntimeError('Modulo zero not allowed.');
        }
        return left % right;
      };
      throw emit(CompilationError, 'Unknown token: ' + token, entry);
    }
    function LogicalOperator(token, entry) {
      if (token === '&&') return function andOperator(left, right) {
        if (typeof left !== 'boolean' || typeof right !== 'boolean') {
          throw new RuntimeError('The && operator takes two booleans');
        }
        return left && right;
      };
      if (token === '||') return function orOperator(left, right) {
        if (typeof left !== 'boolean' || typeof right !== 'boolean') {
          throw new RuntimeError('The || operator takes two booleans');
        }
        return left || right;
      };
      throw emit(CompilationError, 'Unknown token: ' + token, entry);
    }
    function UnaryExpression(node, entry) {
      var operator = UnaryOperator(node.operator.token, entry);
      var argument = Expression(node.argument, entry);
      return function unaryExpression(locals, ctxdata) {
        return [locals, operator(_resolve(argument, locals, ctxdata))];
      };
    }
    function BinaryExpression(node, entry) {
      var left = Expression(node.left, entry);
      var operator = BinaryOperator(node.operator.token, entry);
      var right = Expression(node.right, entry);
      return function binaryExpression(locals, ctxdata) {
        return [locals, operator(
          _resolve(left, locals, ctxdata),
          _resolve(right, locals, ctxdata)
        )];
      };
    }
    function LogicalExpression(node, entry) {
      var left = Expression(node.left, entry);
      var operator = LogicalOperator(node.operator.token, entry);
      var right = Expression(node.right, entry);
      return function logicalExpression(locals, ctxdata) {
        return [locals, operator(
          _resolve(left, locals, ctxdata),
          _resolve(right, locals, ctxdata)
        )];
      };
    }
    function ConditionalExpression(node, entry) {
      var test = Expression(node.test, entry);
      var consequent = Expression(node.consequent, entry);
      var alternate = Expression(node.alternate, entry);
      return function conditionalExpression(locals, ctxdata) {
        var tested = _resolve(test, locals, ctxdata);
        if (typeof tested !== 'boolean') {
          throw new RuntimeError('Conditional expressions must test a ' +
                                 'boolean');
        }
        if (tested === true) {
          return consequent(locals, ctxdata);
        }
        return alternate(locals, ctxdata);
      };
    }

    function CallExpression(node, entry) {
      var callee = Expression(node.callee, entry);
      var args = [];
      for (var i = 0; i < node.arguments.length; i++) {
        args.push(Expression(node.arguments[i], entry));
      }
      return function callExpression(locals, ctxdata) {
        var evaluated_args = [];
        for (var i = 0; i < args.length; i++) {
          evaluated_args.push(args[i](locals, ctxdata));
        }
        // callee is an expression pointing to a macro, e.g. an identifier
        var macro = callee(locals, ctxdata);
        locals = macro[0];
        macro = macro[1];
        if (!macro.expression) {
          throw new RuntimeError('Expected a macro, got a non-callable.');
        }
        // Rely entirely on the platform implementation to detect recursion.
        // `Macro::_call` assigns `evaluated_args` to members of `locals`.
        return macro._call(evaluated_args, ctxdata);
      };
    }
    function PropertyExpression(node, entry) {
      var expression = Expression(node.expression, entry);
      var property = node.computed ?
        Expression(node.property, entry) :
        node.property.name;
      return function propertyExpression(locals, ctxdata) {
        var prop = _resolve(property, locals, ctxdata);
        if (typeof prop !== 'string') {
          throw new RuntimeError('Property name must evaluate to a string: ' +
                                 prop);
        }
        var parent = expression(locals, ctxdata);
        locals = parent[0];
        parent = parent[1];

        // At this point, `parent` can be anything and we need to do some 
        // type-checking to handle erros gracefully (bug 883664) and securely 
        // (bug 815962).

        // If `parent` is an Entity or an Attribute, `locals` has been 
        // correctly set up by Identifier
        if (parent && parent.value !== undefined) {
          if (typeof parent.value !== 'function') {
            throw new RuntimeError('Cannot get property of a ' +
                                   typeof parent.value + ': ' + prop);
          }
          return parent.value(locals, ctxdata, prop);
        }

        // If it's a hashLiteral or stringLiteral inside a hash, just call it
        if (typeof parent === 'function') {
          return parent(locals, ctxdata, prop);
        }
        if (parent && parent.expression) {
          throw new RuntimeError('Cannot get property of a macro: ' + prop);
        }

        // If `parent` is an object passed by the developer to the context 
        // (i.e., `expression` was a `VariableExpression`) or a global, return 
        // the member of the object corresponding to `prop`
        if (typeof parent === 'object') {
          if (parent === null) {
            throw new RuntimeError('Cannot get property of a null: ' + prop);
          }
          if (Array.isArray(parent)) {
            throw new RuntimeError('Cannot get property of an array: ' + prop);
          }
          if (!parent.hasOwnProperty(prop)) {
            throw new RuntimeError(prop + ' is not defined on the object.');
          }
          return [locals, parent[prop]];
        }

        // otherwise it's a primitive
        throw new RuntimeError('Cannot get property of a ' + typeof parent +
                               ': ' + prop);
      };
    }
    function AttributeExpression(node, entry) {
      var expression = Expression(node.expression, entry);
      var attribute = node.computed ?
        Expression(node.attribute, entry) :
        node.attribute.name;
      return function attributeExpression(locals, ctxdata) {
        var attr = _resolve(attribute, locals, ctxdata);
        var entity = expression(locals, ctxdata);
        locals = entity[0];
        entity = entity[1];
        if (!entity.attributes) {
          throw new RuntimeError('Cannot get attribute of a non-entity: ' +
                                 attr);
        }
        if (!entity.attributes.hasOwnProperty(attr)) {
          throw new RuntimeError(entity.id + ' has no attribute ' + attr);
        }
        return [locals, entity.attributes[attr]];
      };
    }
    function ParenthesisExpression(node, entry) {
      return Expression(node.expression, entry);
    }

  }

  Compiler.Error = CompilerError;
  Compiler.CompilationError = CompilationError;
  Compiler.RuntimeError = RuntimeError;
  Compiler.ValueError = ValueError;
  Compiler.IndexError = IndexError;


  // `CompilerError` is a general class of errors emitted by the Compiler.
  function CompilerError(message) {
    this.name = 'CompilerError';
    this.message = message;
  }
  CompilerError.prototype = Object.create(Error.prototype);
  CompilerError.prototype.constructor = CompilerError;

  // `CompilationError` extends `CompilerError`.  It's a class of errors 
  // which happen during compilation of the AST.
  function CompilationError(message, entry) {
    CompilerError.call(this, message);
    this.name = 'CompilationError';
    this.entry = entry.id;
  }
  CompilationError.prototype = Object.create(CompilerError.prototype);
  CompilationError.prototype.constructor = CompilationError;

  // `RuntimeError` extends `CompilerError`.  It's a class of errors which 
  // happen during the evaluation of entries, i.e. when you call 
  // `entity.toString()`.
  function RuntimeError(message) {
    CompilerError.call(this, message);
    this.name = 'RuntimeError';
  }
  RuntimeError.prototype = Object.create(CompilerError.prototype);
  RuntimeError.prototype.constructor = RuntimeError;

  // `ValueError` extends `RuntimeError`.  It's a class of errors which 
  // happen during the composition of a ComplexString value.  It's easier to 
  // recover from than an `IndexError` because at least we know that we're 
  // showing the correct member of the hash.
  function ValueError(message, entry, source) {
    RuntimeError.call(this, message);
    this.name = 'ValueError';
    this.entry = entry.id;
    this.source = source;
  }
  ValueError.prototype = Object.create(RuntimeError.prototype);
  ValueError.prototype.constructor = ValueError;

  // `IndexError` extends `RuntimeError`.  It's a class of errors which 
  // happen during the lookup of a hash member.  It's harder to recover 
  // from than `ValueError` because we en dup not knowing which variant of the 
  // entity value to show and in case the meanings are divergent, the 
  // consequences for the user can be serious.
  function IndexError(message, entry) {
    RuntimeError.call(this, message);
    this.name = 'IndexError';
    this.entry = entry.id;
  }
  IndexError.prototype = Object.create(RuntimeError.prototype);
  IndexError.prototype.constructor = IndexError;

  function requireCompilerError(e) {
    if (!(e instanceof CompilerError)) {
      throw e;
    }
  }

  exports.Compiler = Compiler;

});
