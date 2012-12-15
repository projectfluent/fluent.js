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
// - `key` (optional), which is a number or a string passed to an 
// `ArrayLiteral` or a `HashLiteral` expression denoting the member of the 
// array or the hash to return.  The member will be another expression function 
// which can then be evaluated further.
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
// When `entity.toString(ctxdata)` is called by a third-party code, we need to 
// resolve the whole `complexString` <1> to return a single string value.  This 
// is what **resolving** means and it involves some recursion.  On the other 
// hand, **evaluating** means _to call the expression once and use what it 
// returns_.
// 
// `toString` sets `locals.__this__` to the current entity, `about` and tells 
// the `complexString` <1> to _resolve_ itself.
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
// `about` entity.  All components of any `complexString` are _resolved_ by 
// the compiler until a primitive value is returned.  This logic lives in the 
// `_resolve` function.

//
// Inline comments
// ---------------
//
// Isolate the code by using an immediately-invoked function expression.
// Invoke it via `(function(){ ... }).call(this)` so that inside of the IIFE, 
// `this` references the global object.
(function() {
  'use strict';

  function Compiler(Emitter, Parser) {

    // Public

    this.compile = compile;
    this.setGlobals = setGlobals;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    this.Error = CompilerError;

    // Private

    var _emitter = Emitter ? new Emitter() : null;
    var _parser = Parser ? new Parser() : null;
    var _env = {};
    var _globals;

    // Public API functions

    function compile(ast) {
      _env = {};
      var types = {
        Entity: Entity,
        Macro: Macro,
      };
      for (var i = 0, entry; entry = ast.body[i]; i++) {
        var constructor = types[entry.type];
        if (constructor) {
          _env[entry.id.name] = new constructor(entry);
        }
      }
      return _env;
    }

    function setGlobals(globals) {
      _globals = globals;
      return true;
    }

    function addEventListener(type, listener) {
      if (!_emitter) {
        throw Error("Emitter not available");
      }
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      if (!_emitter) {
        throw Error("Emitter not available");
      }
      return _emitter.removeEventListener(type, listener);
    }


    // The Entity object.
    function Entity(node) {
      this.id = node.id.name;
      this.value = Expression(node.value);
      this.local = node.local || false;
      this.index = [];
      this.attributes = {};
      var i;
      for (i = 0; i < node.index.length; i++) {
        this.index.push(Expression(node.index[i]));
      }
      for (i = 0; i < node.attrs.length; i++) {
        var attr = node.attrs[i];
        this.attributes[attr.key.name] = new Attribute(attr, this);
      }
    }
    // Entities are wrappers around their value expression.  _Yielding_ from the 
    // entity is identical to _evaluating_ its value with the appropriate value 
    // of `locals.__this__`.  See `PropertyExpression` for an example usage.
    Entity.prototype._yield = function E_yield(ctxdata, key) {
      var locals = {
        __this__: this,
      };
      return this.value(locals, ctxdata, key);
    };
    // Calling `entity._resolve` will _resolve_ its value to a primitive value.  
    // See `ComplexString` for an example usage.
    Entity.prototype._resolve = function E_resolve(ctxdata, index) {
      index = index || this.index.slice();
      var locals = {
        __this__: this,
      };
      return _resolve(this.value, locals, ctxdata, index);
    };
    // `toString` is the only method that is supposed to be used by the L20n's 
    // context.
    Entity.prototype.toString = function toString(ctxdata) {
      return this._resolve(ctxdata);
    };

    function Attribute(node, entity) {
      this.key = node.key.name;
      this.local = node.local || false;
      this.value = Expression(node.value);
      this.entity = entity;
    }
    Attribute.prototype._yield = function A_yield(ctxdata, key) {
      var locals = {
        __this__: this.entity,
      };
      return this.value(locals, ctxdata, key);
    };
    Attribute.prototype._resolve = function A_resolve(ctxdata, index) {
      index = index || this.entity.index.slice();
      var locals = {
        __this__: this.entity,
      };
      return _resolve(this.value, locals, ctxdata, index);
    };
    Attribute.prototype.toString = function toString(ctxdata) {
      return this._resolve(ctxdata);
    };

    function Macro(node) {
      var expression = Expression(node.expression);
      return function(locals, ctxdata, args) {
        for (var i = 0; i < node.args.length; i++) {
          locals[node.args[i].id.name] = args[i];
        }
        return expression(locals, ctxdata);
      };
    }

    var EXPRESSION_TYPES = {
      // Primary expressions.
      'Identifier': Identifier,
      'ThisExpression': ThisExpression,
      'VariableExpression': VariableExpression,
      'GlobalsExpression': GlobalsExpression,

      // Value expressions.
      'Number': NumberLiteral,
      'String': StringLiteral,
      'Array': ArrayLiteral,
      'Hash': HashLiteral,
      'HashItem': HashItem,
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
      'ParenthesisExpression': ParenthesisExpression,
    };

    // The 'dispatcher' expression constructor.  Other expression constructors 
    // call this to create expression functions for their components.  For 
    // instance, `ConditionalExpression` calls `Expression` to create expression 
    // functions for its `test`, `consequent` and `alternate` symbols.
    function Expression(node) {
      // An entity can have no value.  It will be resolved to `null`.
      if (!node) {
        return null;
      }
      try {
        var expr = EXPRESSION_TYPES[node.type](node);
      } catch(e) {
        throw new Error('Unknown expression type');
      }
      return expr;
    }

    function _resolve(expr, locals, ctxdata, index) {
      // Bail out early if it's a primitive value or `null`.  This is exactly 
      // what we want.
      if (!expr || 
          typeof expr === 'string' || 
          typeof expr === 'boolean' || 
          typeof expr === 'number') {
        return expr;
      }
      // Check if `expr` knows how to resolve itself (if it's an Entity or an 
      // Attribute).
      if (expr._resolve) {
        return expr._resolve(ctxdata, index);
      }
      index = index || [];
      var key = index.shift();
      var current = expr(locals, ctxdata, key);
      locals = current[0], current = current[1];
      return _resolve(current, locals, ctxdata, index);
    }

    function Identifier(node) {
      var name = node.name;
      return function identifier(locals, ctxdata) {
        if (!_env.hasOwnProperty(name)) {
          throw Error("Reference to an unknown entry: " + name);
        }
        return [{ __this__: _env[name] }, _env[name]];
      };
    }
    function ThisExpression(node) {
      return function thisExpression(locals, ctxdata) {
        return [locals, locals.__this__];
      };
    }
    function VariableExpression(node) {
      var name = node.id.name;
      return function variableExpression(locals, ctxdata) {
        if (locals.hasOwnProperty(name)) {
          return locals[name];
        }
        if (!ctxdata.hasOwnProperty(name)) {
          throw Error("Reference to an unknown variable: " + name);
        }
        return [locals, ctxdata[name]];
      };
    }
    function GlobalsExpression(node) {
      var name = node.id.name;
      return function globalsExpression(locals, ctxdata) {
        if (!_globals.hasOwnProperty(name)) {
          throw Error("Reference to an unknown global: " + name);
        }
        return [locals, _globals[name]];
      };
    }
    function NumberLiteral(node) {
      return function numberLiteral(locals, ctxdata) {
        return [locals, node.value];
      };
    }
    function StringLiteral(node) {
      var parsed, complex;
      return function stringLiteral(locals, ctxdata) {
        if (!complex) {
          parsed = _parser.parseString(node.content);
          if (parsed.type == 'String') {
            return [locals, parsed.content];
          }
          complex = ComplexString(parsed);
        }
        return [locals, _resolve(complex, locals, ctxdata)];
      };
    }
    function ArrayLiteral(node) {
      var content = [];
      for (var i = 0; i < node.content.length; i++) {
        content.push(Expression(node.content[i]));
      }
      return function arrayLiteral(locals, ctxdata, key) {
        key = _resolve(key, locals, ctxdata);
        if (content.hasOwnProperty(key)) {
          return [locals, content[key]];
        } else {
          // For Arrays, the default key is always 0.  The syntax does not allow 
          // specifying a different default with an asterisk, like in hashes.
          return [locals, content[0]];
        }
      };
    }
    function HashLiteral(node) {
      var content = [];
      var defaultKey = null;
      for (var i = 0; i < node.content.length; i++) {
        var elem = node.content[i];
        content[elem.key.name] = HashItem(elem);
        if (i == 0 || elem['default']) {
          defaultKey = elem.key.name;
        }
      }
      return function hashLiteral(locals, ctxdata, key) {
        key = _resolve(key, locals, ctxdata);
        if (content.hasOwnProperty(key)) {
          return [locals, content[key]];
        } else {
          return [locals, content[defaultKey]];
        }
      };
    }
    function HashItem(node) {
      // return the value expression right away
      // the `key` and the `default` flag logic is done in `HashLiteral`
      return Expression(node.value)
    }
    function ComplexString(node) {
      var content = [];
      for (var i = 0; i < node.content.length; i++) {
        content.push(Expression(node.content[i]));
      }
      // Every complexString needs to have its own `dirty` flag whose state 
      // persists across multiple calls to the given complexString.  On the other 
      // hand, `dirty` must not be shared by all complexStrings.  Hence the need 
      // to define `dirty` as a variable available in the closure.  Note that the 
      // anonymous function is a self-invoked one and it returns the closure 
      // immediately.
      return function() {
        var dirty = false;
        return function complexString(locals, ctxdata) {
          if (dirty) {
            throw new Error("Cyclic reference detected");
          }
          dirty = true;
          var parts = [];
          for (var i = 0; i < content.length; i++) {
            parts.push(_resolve(content[i], locals, ctxdata));
          }
          dirty = false;
          return [locals, parts.join('')];
        }
      }();
    }

    function UnaryOperator(token) {
      if (token == '-') return function negativeOperator(argument) {
        return -argument;
      };
      if (token == '+') return function positiveOperator(argument) {
        return +argument;
      };
      if (token == '!') return function notOperator(argument) {
        return !argument;
      };
      throw new Error("Unknown token: " + token);
    }
    function BinaryOperator(token) {
      if (token == '==') return function equalOperator(left, right) {
        return left == right;
      };
      if (token == '!=') return function notEqualOperator(left, right) {
        return left != right;
      };
      if (token == '<') return function lessThanOperator(left, right) {
        return left < right;
      };
      if (token == '<=') return function lessThanEqualOperator(left, right) {
        return left <= right;
      };
      if (token == '>') return function greaterThanOperator(left, right) {
        return left > right;
      };
      if (token == '>=') return function greaterThanEqualOperator(left, right) {
        return left >= right;
      };
      if (token == '+') return function addOperator(left, right) {
        return left + right;
      };
      if (token == '-') return function substractOperator(left, right) {
        return left - right;
      };
      if (token == '*') return function multiplyOperator(left, right) {
        return left * right;
      };
      if (token == '/') return function devideOperator(left, right) {
        return left / right;
      };
      if (token == '%') return function moduloOperator(left, right) {
        return left % right;
      };
      throw new Error("Unknown token: " + token);
    }
    function LogicalOperator(token) {
      if (token == '&&') return function andOperator(left, right) {
        return left && right;
      };
      if (token == '||') return function orOperator(left, right) {
        return left || right;
      };
      throw new Error("Unknown token: " + token);
    }
    function UnaryExpression(node) {
      var operator = UnaryOperator(node.operator.token);
      var argument = Expression(node.argument);
      return function unaryExpression(locals, ctxdata) {
        return [locals, operator(_resolve(argument, locals, ctxdata))];
      };
    }
    function BinaryExpression(node) {
      var left = Expression(node.left);
      var operator = BinaryOperator(node.operator.token);
      var right = Expression(node.right);
      return function binaryExpression(locals, ctxdata) {
        return [locals, operator(
          _resolve(left, locals, ctxdata), 
          _resolve(right, locals, ctxdata)
        )];
      };
    }
    function LogicalExpression(node) {
      var left = Expression(node.left);
      var operator = LogicalOperator(node.operator.token);
      var right = Expression(node.right);
      return function logicalExpression(locals, ctxdata) {
        return [locals, operator(
          _resolve(left, locals, ctxdata), 
          _resolve(right, locals, ctxdata)
        )];
      }
    }
    function ConditionalExpression(node) {
      var test = Expression(node.test);
      var consequent = Expression(node.consequent);
      var alternate = Expression(node.alternate);
      return function conditionalExpression(locals, ctxdata) {
        if (_resolve(test, locals, ctxdata)) {
          return consequent(locals, ctxdata);
        }
        return alternate(locals, ctxdata);
      };
    }

    function CallExpression(node) {
      var callee = Expression(node.callee);
      var args = [];
      for (var i = 0; i < node.arguments.length; i++) {
        args.push(Expression(node.arguments[i]));
      }
      return function callExpression(locals, ctxdata) {
        var evaluated_args = [];
        for (var i = 0; i < args.length; i++) {
          evaluated_args.push(args[i](locals, ctxdata));
        }
        // callee is an expression pointing to a macro, e.g. an identifier  
        // XXX what if it doesn't point to a macro?
        var macro = callee(locals, ctxdata);
        locals = macro[0], macro = macro[1];
        // rely entirely on the platform implementation to detect recursion
        return macro(locals, ctxdata, evaluated_args);
      };
    }
    function PropertyExpression(node) {
      var expression = Expression(node.expression);
      var property = node.computed ? 
        Expression(node.property) : 
        node.property.name;
      return function propertyExpression(locals, ctxdata) {
        var prop = _resolve(property, locals, ctxdata);
        var parent = expression(locals, ctxdata);
        locals = parent[0], parent = parent[1];
        // If `parent` is an Entity or an Attribute, evaluate its value via the 
        // `_yield` method.  This will ensure the correct value of 
        // `locals.__this__`.
        if (parent._yield) {
          return parent._yield(ctxdata, prop);
        }
        // If `parent` is an object passed by the developer to the context (i.e., 
        // `expression` was a `VariableExpression`), simply return the member of 
        // the object corresponding to `prop`.  We don't really care about 
        // `locals` here.
        if (typeof parent !== 'function') {
          return [locals, parent[prop]];
        }
        return parent(locals, ctxdata, prop);
      }
    }
    function AttributeExpression(node) {
      // XXX looks similar to PropertyExpression, but it's actually closer to 
      // Identifier
      var expression = Expression(node.expression);
      var attribute = node.computed ? 
        Expression(node.attribute) : 
        node.attribute.name;
      return function attributeExpression(locals, ctxdata) {
        var attr = _resolve(attribute, locals, ctxdata);
        var entity = expression(locals, ctxdata);
        locals = entity[0], entity = entity[1];
        // XXX what if it's not an entity?
        return [locals, entity.attributes[attr]];
      }
    }
    function ParenthesisExpression(node) {
      return Expression(node.expression);
    }

  }

  // CompilerError class

  function CompilerError(message, entry) {
    this.name = 'CompilerError';
    this.message = message;
    this.entry = entry;
  }
  CompilerError.prototype = Object.create(Error.prototype);
  CompilerError.prototype.constructor = CompilerError;

  // Expose the Compiler constructor

  // Depending on the environment the script is run in, define `Compiler` as 
  // the exports object which can be `required` as a module, or as a member of 
  // the L20n object defined on the global object in the browser, i.e. 
  // `window`.

  this.Compiler = Compiler;
}).call(this);
