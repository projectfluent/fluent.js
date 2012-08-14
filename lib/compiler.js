(function() {

  function _resolve(expr, locals, env, data, index) {
    if (!expr || typeof expr === 'string' || typeof expr === 'number') {
      return expr;
    }
    if (expr._resolve) {
      // it's an Entity or an Attribute
      return expr._resolve(data, index);
    }
    var index = index || [];
    var key = index.shift();
    var current = expr(locals, env, data, key);
    return _resolve(current, locals, env, data, index);
  }
  function _yield(expr, locals, env, data, key) {
    if (!expr || typeof expr === 'string' || typeof expr === 'number') {
      return expr;
    }
    var current = expr(locals, env, data);
    if (current._yield) {
      // it's an Entity or an Attribute
      return current._yield(data, key);
    }
    return current(locals, env, data, key);
  }

  function Identifier(node) {
    var name = node.name;
    return function identifier(locals, env, data) {
      return env.entries[name];
    };
  }
  function ThisExpression(node) {
    return function thisExpression(locals, env, data) {
      return locals.__this__;
    };
  }
  function VariableExpression(node) {
    return function variableExpression(locals, env, data) {
      var value = locals[node.id.name];
      if (value !== undefined)
        return value;
      return data[node.id.name];
    };
  }
  function GlobalsExpression(node) {
    return function globalsExpression(locals, env, data) {
      return env.globals[node.id.name];
    };
  }
  function NumberLiteral(node) {
    return function numberLiteral(locals, env, data) {
      return node.value;
    };
  }
  function StringLiteral(node) {
    return function stringLiteral(locals, env, data) {
      return node.content;
    };
  }
  function ArrayLiteral(node) {
    var content = [];
    var defaultKey = 0;
    node.content.forEach(function(elem, i) {
      content.push(new Expression(elem));
      if (elem.default)
        defaultKey = i;
    });
    return function arrayLiteral(locals, env, data, key) {
      key = _resolve(key, locals, env, data);
      if (key && content[key]) {
        return content[key];
      } else {
        return content[defaultKey];
      }
    };
  }
  function HashLiteral(node) {
    var content = [];
    var defaultKey = null;
    node.content.forEach(function(elem, i) {
      content[elem.key.name] = new HashItem(elem);
      if (i == 0 || elem.default)
        defaultKey = elem.key.name;
    });
    return function hashLiteral(locals, env, data, key) {
      key = _resolve(key, locals, env, data);
      if (key && content[key]) {
        return content[key];
      } else {
        return content[defaultKey];
      }
    };
  }
  function HashItem(node) {
    // return the value expression right away
    // the `key` and the `default` flag logic is done in `HashLiteral`
    return new Expression(node.value)
  }
  function ComplexString(node) {
    var content = [];
    node.content.forEach(function(elem) {
      content.push(new Expression(elem));
    });
    // Every complexString needs to have its own `dirty` flag whose state 
    // persists across multiple calls to the given complexString.  On the other 
    // hand, `dirty` must not be shared by all complexStrings.  Hence the need 
    // to define `dirty` as a variable available in the closure.  Note that the 
    // anonymous function is a self-invoked one and it returns the closure 
    // immediately.
    return function(locals, env, data) {
      var dirty = false;
      return function complexString(locals, env, data) {
        if (dirty) {
          throw new Error("Cyclic reference detected");
        }
        dirty = true;
        var parts = [];
        content.forEach(function(elem) {
          var part = _resolve(elem, locals, env, data);
          parts.push(part);
        });
        dirty = false;
        return parts.join('');
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
  }
  function LogicalOperator(token) {
    if (token == '&&') return function andOperator(left, right) {
      return left && right;
    };
    if (token == '||') return function orOperator(left, right) {
      return left || right;
    };
  }
  function UnaryExpression(node) {
    var operator = new UnaryOperator(node.operator.token);
    var argument = new Expression(node.argument);
    return function unaryExpression(locals, env, data) {
      return operator(argument(locals, env, data));
    };
  }
  function BinaryExpression(node) {
    var left = new Expression(node.left);
    var operator = new BinaryOperator(node.operator.token);
    var right = new Expression(node.right);
    return function binaryExpression(locals, env, data) {
      return operator(
        _resolve(left, locals, env, data), 
        _resolve(right, locals, env, data)
      );
    };
  }
  function LogicalExpression(node) {
    var left = new Expression(node.left);
    if (node.operator) {
      var operator = new LogicalOperator(node.operator.token);
      var right = new Expression(node.right);
      return function logicalExpression(locals, env, data) {
        operator(left(locals, env, data), right(locals, env, data));
      }
    } else return left;
  }
  function ConditionalExpression(node) {
    var test = new Expression(node.test);
    var consequent = new Expression(node.consequent);
    var alternate = new Expression(node.alternate);
    return function conditionalExpression(locals, env, data) {
      if (test(locals, env, data))
        return consequent(locals, env, data);
      return alternate(locals, env, data);
    };
  }

  function CallExpression(node) {
    var callee = new Expression(node.callee);
    var args = [];
    node.arguments.forEach(function(elem, i) {
      args.push(new Expression(elem));
    });
    return function callExpression(locals, env, data) {
      var resolved_args = [];
      args.forEach(function(arg, i) {
        resolved_args.push(arg(locals, env, data));
      });
      // rely entirely on the platform implementation to detect recursion
      return callee(locals, env, data)(resolved_args, env, data);
    };
  }
  function PropertyExpression(node) {
    var expression = new Expression(node.expression);
    var property;
    var computed = node.computed;
    if (computed) {
      property = new Expression(node.property);
    } else {
      property = node.property.name;
    }
    return function propertyExpression(locals, env, data) {
      var prop = _resolve(property, locals, env, data);
      return _yield(expression, locals, env, data, prop);
    }
  }
  function AttributeExpression(node) {
    var expression = new Expression(node.expression);
    var attribute;
    var computed = node.computed;
    if (computed) {
      attribute = new Expression(node.attribute);
    } else {
      attribute = node.attribute.name;
    }
    return function attributeExpression(locals, env, data) {
      var attr = _resolve(attribute, locals, env, data);
      var entity = expression(locals, env, data);
      //if (!entity instanceof Entity)
      //  throw "Expression does not evaluate to a valid entity."
      return entity.attributes[attr];
    }
  }
  function ParenthesisExpression(node) {
    return new Expression(node.expression);
  }

  function Expression(node) {
    var EXPRESSION_TYPES = {
      // primary expressions
      'Identifier': Identifier,
      'ThisExpression': ThisExpression,
      'VariableExpression': VariableExpression,
      'GlobalsExpression': GlobalsExpression,
      'Literal': NumberLiteral,
      'String': StringLiteral,
      'Array': ArrayLiteral,
      'Hash': HashLiteral,
      'HashItem': HashItem,
      'ComplexString': ComplexString,

      // logical expressions
      'UnaryExpression': UnaryExpression,
      'BinaryExpression': BinaryExpression,
      'LogicalExpression': LogicalExpression,
      'ConditionalExpression': ConditionalExpression,

      // member expressions
      'CallExpression': CallExpression,
      'PropertyExpression': PropertyExpression,
      'AttributeExpression': AttributeExpression,
      'ParenthesisExpression': ParenthesisExpression,
    };
    if (!node) 
      return null;
    return new EXPRESSION_TYPES[node.type](node);
  }

  function Attribute(node, entity) {
    this.key = node.key.name;
    this.local = node.local || false;
    this.value = new Expression(node.value);
    this.entity = entity;
  }
  Attribute.prototype._yield = function A_yield(data, key) {
    var locals = {
      __this__: this.entity,
    };
    return this.value(locals, this.entity.env, data, key);
  };
  Attribute.prototype._resolve = function A_resolve(data, index) {
    var index = index || locals.__this__.index;
    var locals = {
      __this__: this.entity,
    };
    return _resolve(this.value, locals, this.entity.env, data, index);
  };
  Attribute.prototype.toString = function toString(data) {
    return this._resolve(data);
  };

  function Entity(node, env) {
    this.id = node.id;
    this.value = new Expression(node.value);
    this.index = [];
    node.index.forEach(function(ind) {
      this.index.push(new Expression(ind));
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
    var index = index || this.index;
    var locals = {
      __this__: this,
    };
    return _resolve(this.value, locals, this.env, data, index);
  };
  Entity.prototype.toString = function toString(data) {
    return this._resolve(data);
  };

  function Macro(node) {
    var expression = new Expression(node.expression);
    return function(args, env, data) {
      var locals = {};
      node.args.forEach(function(arg, i) {
        locals[arg.id.name] = args[i];
      });
      return expression(locals, env, data);
    };
  }

  var Compiler;

  if (typeof exports !== 'undefined') {
    Compiler = exports;
  } else {
    Compiler = this.L20n.Compiler = {};
  }

  Compiler.compile = function compile(ast, entries, globals) {
    var env = {
      entries: entries,
      globals: globals,
    };
    for (var i = 0, entry; entry = ast[i]; i++) {
      if (entry.type == 'Entity') {
        env.entries[entry.id.name] = new Entity(entry, env);
      } else if (entry.type == 'Macro')
        env.entries[entry.id.name] = new Macro(entry);
    }
  }

})(this);
