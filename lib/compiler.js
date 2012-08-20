// This is L20n's on-the-fly compiler.  It takes the AST produced by the parser 
// and uses it to create a set of JavaScript objects representing entities and 
// functions representing macros and other expressions.
//
// The module defines a `Compiler` singleton with a single method: `compile`.
// The result of the compilation is stored on the `entries` object passed as 
// the second argument to the `compile` funciton.  The third argument is 
// `globals`, an object whose properties provide information about the runtime 
// environment, e.g., the current hour, operating system etc.
//
// Main concepts
// -------------
//
// **Entities** and **attributes** are objects which are publicly available.  
// Their `toString` method is designed to be used by the L20n context to get 
// a string value of the entity, given the cotext data passed to the method.
//
// All other symbols defined by the grammar are implemented as expression 
// functions.  The naming convention is:
//
//   - capitalized first letters denote **expressions constructors**, e.g.
//   `PropertyExpression`.
//   - camel-case denotes **expression functions** returned by the 
//   constructors, e.g.
//   `propertyExpression`.
//
// ### Constructors
//
// The constructor is called for every node in the AST.  It stores the 
// components of the expression which are constant and do not depend on the 
// calling context, such as the data passed by the developer to the `toString` 
// method.
// 
// ### Expression functions
//
// The constructor, when called, returns an expression function, which, in 
// turn, is called every time the expression needs to be evaluated.  The 
// evaluation call is context-dependend.  Every expression function takes three 
// mandatory arguments and one optional one:
//
// - `locals`, which stores the information about the currently evaluated 
// entity (`locals.__this__`).  It also stores the arguments passed to macros.
// - `env`, which combines `entries` (all other entities and macros) and 
// `globals` passed to `Compiler.compile`.
// - `data`, which is an object with data passed to the context by the 
// developer.  The developer can define data on the context, or pass it on 
// a per-call basis.
// - `key` (optional), which is a string or a number passed to an 
// `ArrayLiteral` or a `HashLiteral` expression denoting the member of the 
// array or the hash to return.  The member will be another expression function 
// which can then be evaluated further.
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
// takes into account the new value of `locals`.
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
// a string that reads "About ".
//
// On to the second member, the propertyExpression <3>.  We bubble down 
// `locals` again and proceed to evaluate the `expression` field, which is an 
// `identifier`.  Note that we don't _resolve_ it to a string; we _evaluate_ it 
// to something that can be further used in other expressions, in this case, an 
// **entity** called `brandName`.
//
//
//
//
//
//  If locales bubbles up, why doesn't it go all the way up to about?
// - _resolve
  
// Isolate the code by using an immediately-invoked function expression.
// Invoke it via `(function(){ ... }).call(this)` so that inside of the IIFE, 
// `this` references the global object.
(function() {
  'use strict';

  var Compiler;
  
  // Depending on the environment the script is run in, define `Compiler` as 
  // the exports object which can be `required` as a module, or as a member of 
  // the L20n object defined on the global object in the browser, i.e. 
  // `window`.
  if (typeof exports !== 'undefined') {
    Compiler = exports;
  } else {
    Compiler = this.L20n.Compiler = {};
  }

  // `Compiler.compile` is the only publicly visible method.  It takes three 
  // arguments: `ast`, the AST produced by the parser; `entries`, an object 
  // which will be populted with compiled entities and macros (their `id`s will 
  // be used asthe  keys of the `entries` object; and `globals`, an object 
  // whose properties can be accessed to get information about the runtime 
  // environment.
  Compiler.compile = function compile(ast, entries, globals) {
    // `entries` and `globals` are grouped into an `env` object throught the 
    // file
    var env = {
      entries: entries,
      globals: globals,
    };
    for (var i = 0, entry; entry = ast[i]; i++) {
      if (entry.type == 'Entity') {
        env.entries[entry.id.name] = new Entity(entry, env);
      } else if (entry.type == 'Macro') {
        env.entries[entry.id.name] = new Macro(entry);
      }
    }
  }

  // The Entity object.
  function Entity(node, env) {
    this.id = node.id;
    this.value = Expression(node.value);
    this.index = [];
    node.index.forEach(function(ind) {
      this.index.push(Expression(ind));
    }, this);
    this.attributes = {};
    for (var key in node.attrs) {
      this.attributes[key] = new Attribute(node.attrs[key], this);
    }
    this.local = node.local || false;
    this.env = env;
  }
  Entity.prototype._yield = function E_yield(data, key) {
    var locals = {
      __this__: this,
    };
    return this.value(locals, this.env, data, key);
  };
  Entity.prototype._resolve = function E_resolve(data, index) {
    index = index || this.index;
    var locals = {
      __this__: this,
    };
    return _resolve(this.value, locals, this.env, data, index);
  };
  Entity.prototype.toString = function toString(data) {
    return this._resolve(data);
  };

  function Attribute(node, entity) {
    this.key = node.key.name;
    this.local = node.local || false;
    this.value = Expression(node.value);
    this.entity = entity;
  }
  Attribute.prototype._yield = function A_yield(data, key) {
    var locals = {
      __this__: this.entity,
    };
    return this.value(locals, this.entity.env, data, key);
  };
  Attribute.prototype._resolve = function A_resolve(data, index) {
    index = index || this.entity.index;
    var locals = {
      __this__: this.entity,
    };
    return _resolve(this.value, locals, this.entity.env, data, index);
  };
  Attribute.prototype.toString = function toString(data) {
    return this._resolve(data);
  };

  function Macro(node) {
    var expression = Expression(node.expression);
    return function(locals, env, data, args) {
      node.args.forEach(function(arg, i) {
        locals[arg.id.name] = args[i];
      });
      return expression(locals, env, data);
    };
  }

  // The 'dispatcher' expression constructor.  Other expression constructors 
  // call this to create expression functions for their components.  For 
  // instance, `ConditionalExpression` calls `Expression` to create expression 
  // functions for its `test`, `consequent` and `alternate` symbols.
  function Expression(node) {
    var EXPRESSION_TYPES = {
      // Primary expressions.
      'Identifier': Identifier,
      'ThisExpression': ThisExpression,
      'VariableExpression': VariableExpression,
      'GlobalsExpression': GlobalsExpression,

      // Value expressions.
      'Literal': NumberLiteral,
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

  function _resolve(expr, locals, env, data, index) {
    // Bail out early if it's a primitive value or `null`.  This is exactly 
    // what we want.
    if (!expr || 
        typeof expr === 'boolean' || 
        typeof expr === 'string' || 
        typeof expr === 'number') {
      return expr;
    }
    // Check if `expr` knows how to resolve itself (if it's an Entity or an 
    // Attribute).
    if (expr._resolve) {
      return expr._resolve(data, index);
    }
    index = index || [];
    var key = index.shift();
    // `var [locals, current] = expr(...)` is not ES5 (V8 doesn't support it)
    var current = expr(locals, env, data, key);
    locals = current[0], current = current[1];
    return _resolve(current, locals, env, data, index);
  }

  function Identifier(node) {
    var name = node.name;
    return function identifier(locals, env, data) {
      var entity = env.entries[name]
      return [{ __this__: entity }, entity]
    };
  }
  function ThisExpression(node) {
    return function thisExpression(locals, env, data) {
      return [locals, locals.__this__];
    };
  }
  function VariableExpression(node) {
    return function variableExpression(locals, env, data) {
      var value = locals[node.id.name];
      if (value !== undefined)
        return value;
      return [locals, data[node.id.name]];
    };
  }
  function GlobalsExpression(node) {
    return function globalsExpression(locals, env, data) {
      return [locals, env.globals[node.id.name]];
    };
  }
  function NumberLiteral(node) {
    return function numberLiteral(locals, env, data) {
      return [locals, node.value];
    };
  }
  function StringLiteral(node) {
    return function stringLiteral(locals, env, data) {
      return [locals, node.content];
    };
  }
  function ArrayLiteral(node) {
    var content = [];
    node.content.forEach(function(elem, i) {
      content.push(Expression(elem));
    });
    return function arrayLiteral(locals, env, data, key) {
      key = _resolve(key, locals, env, data);
      if (key && content[key]) {
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
    node.content.forEach(function(elem, i) {
      content[elem.key.name] = HashItem(elem);
      if (i == 0 || elem.default)
        defaultKey = elem.key.name;
    });
    return function hashLiteral(locals, env, data, key) {
      key = _resolve(key, locals, env, data);
      if (key && content[key]) {
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
    node.content.forEach(function(elem) {
      content.push(Expression(elem));
    });
    // Every complexString needs to have its own `dirty` flag whose state 
    // persists across multiple calls to the given complexString.  On the other 
    // hand, `dirty` must not be shared by all complexStrings.  Hence the need 
    // to define `dirty` as a variable available in the closure.  Note that the 
    // anonymous function is a self-invoked one and it returns the closure 
    // immediately.
    return function() {
      var dirty = false;
      return function complexString(locals, env, data) {
        if (dirty) {
          throw new Error("Cyclic reference detected");
        }
        dirty = true;
        var parts = [];
        content.forEach(function resolveElemOfComplexString(elem) {
          var part = _resolve(elem, locals, env, data);
          parts.push(part);
        });
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
    return function unaryExpression(locals, env, data) {
      return [locals, operator(_resolve(argument, locals, env, data))];
    };
  }
  function BinaryExpression(node) {
    var left = Expression(node.left);
    var operator = BinaryOperator(node.operator.token);
    var right = Expression(node.right);
    return function binaryExpression(locals, env, data) {
      return [locals, operator(
        _resolve(left, locals, env, data), 
        _resolve(right, locals, env, data)
      )];
    };
  }
  function LogicalExpression(node) {
    var left = Expression(node.left);
    var operator = LogicalOperator(node.operator.token);
    var right = Expression(node.right);
    return function logicalExpression(locals, env, data) {
      return [locals, operator(
        _resolve(left, locals, env, data), 
        _resolve(right, locals, env, data)
      )];
    }
  }
  function ConditionalExpression(node) {
    var test = Expression(node.test);
    var consequent = Expression(node.consequent);
    var alternate = Expression(node.alternate);
    return function conditionalExpression(locals, env, data) {
      if (_resolve(test, locals, env, data)) {
        return consequent(locals, env, data);
      }
      return alternate(locals, env, data);
    };
  }

  function CallExpression(node) {
    var callee = Expression(node.callee);
    var args = [];
    node.arguments.forEach(function(elem, i) {
      args.push(Expression(elem));
    });
    return function callExpression(locals, env, data) {
      var evaluated_args = [];
      args.forEach(function(arg, i) {
        evaluated_args.push(arg(locals, env, data));
      });
      // callee is an expression pointing to a macro, e.g. an identifier
      // XXX what if it doesn't point to a macro?
      var macro = callee(locals, env, data);
      locals = macro[0], macro = macro[1];
      // rely entirely on the platform implementation to detect recursion
      return macro(locals, env, data, evaluated_args);
    };
  }
  function PropertyExpression(node) {
    var expression = Expression(node.expression);
    var property = node.computed ? 
      Expression(node.property) : 
      node.property.name;
    return function propertyExpression(locals, env, data) {
      var prop = _resolve(property, locals, env, data);
      var parent = expression(locals, env, data);
      locals = parent[0], parent = parent[1];
      if (parent._yield) {
        // it's an Entity or an Attribute
        return parent._yield(data, prop);
      }
      return parent(locals, env, data, prop);
    }
  }
  function AttributeExpression(node) {
    // XXX looks similar to PropertyExpression, but it's actually closer to 
    // Identifier
    var expression = Expression(node.expression);
    var attribute = node.computed ? 
      Expression(node.attribute) : 
      node.attribute.name;
    return function attributeExpression(locals, env, data) {
      var attr = _resolve(attribute, locals, env, data);
      var entity = expression(locals, env, data);
      locals = entity[0], entity = entity[1];
      // XXX what if it's not an entity?
      return [locals, entity.attributes[attr]];
    }
  }
  function ParenthesisExpression(node) {
    return Expression(node.expression);
  }

}).call(this);
