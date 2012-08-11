(function() {

  function Identifier(node) {
    var name = node.name;
    return function identifier(locals, env, data) {
      return env[name];
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
      return env.__globals__[node.id.name];
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
    return function arrayLiteral(locals, env, data, index) {
      var index = index || [];
      var key = index.shift();
      if (typeof key == 'function')
        key = key(locals, env, data);
      if (key && content[key])
        var member = content[key];
      else
        var member = content[defaultKey];
      if (locals.__resolve__)
        return member(locals, env, data, index);
      else
        return member;
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
    return function hashLiteral(locals, env, data, index) {
      var index = index || [];
      var key = index.shift();
      if (typeof key == 'function')
        key = key(locals, env, data); // XXX __resolve__ = true ?
      if (key && content[key])
        var member = content[key];
      else
        var member = content[defaultKey];
      if (locals.__resolve__)
        return member(locals, env, data, index);
      else
        return member;
    };
  }
  function HashItem(node) {
    // return the value expression right away
    // the `key` and the `default` flag logic is done in `HashLiteral`
    return new Expression(node.value)
  }
  function ComplexString(node) {
    var dirty = false;
    var content = [];
    node.content.forEach(function(elem) {
      content.push(new Expression(elem));
    })
    return function complexString(locals, env, data) {
      if (dirty)
        throw "Error: Cyclic reference detected";
      dirty = true;
      var parts = [];
      content.forEach(function(elem) {
        var part = elem(locals, env, data);
        while (typeof part !== 'string') {
          if (part instanceof Entity)
            part = part._resolve(locals, env, data);
          else
            part = part(locals, env, data);
        }
        parts.push(part);
      })
      dirty = false
      return parts.join('');
    };
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
      return operator(left(locals, env, data), right(locals, env, data));
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
    var computed = node.computed;
    if (computed)
      var property = new Expression(node.property);
    else
      var property = node.property.name;
    return function propertyExpression(locals, env, data) {
      // XXX: if computed call the property with __resolve__ = true
      var ret = expression(locals, env, data);
      if (ret instanceof Entity)
        return ret._yield(env, data, property);
      if (ret instanceof Attribute)
        return ret._yield(locals, env, data, property);
      // else, `expression` is a HashLiteral
      // XXX what if __resolve__ is true here?
      return ret(locals, env, data, [property]);
    }
  }
  function AttributeExpression(node) {
    var expression = new Expression(node.expression);
    var computed = node.computed;
    if (computed)
      var attribute = new Expression(node.attribute);
    else
      var attribute = node.attribute.name;
    return function attributeExpression(locals, env, data) {
      var entity = expression(locals, env, data);
      //if (!entity instanceof Entity)
      //  throw "Expression does not evaluate to a valid entity."

      // XXX: if computed call the attribute with __resolve__ = true
      return entity.getAttribute(attribute, env, data);
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

  function Attribute(node) {
    this.key = node.key.name;
    this.local = node.local || false;
    this.value = new Expression(node.value);
  }
  Attribute.prototype._get = function _get(locals, env, data, index) {
    var index = index || locals['__this__'].index;
    return this.value(locals, env, data, index);
  };
  Attribute.prototype._yield = function _yield(locals, env, data, key) {
    locals.__resolve__ = false;
    return this._get(locals, env, data, [key]);
  };
  Attribute.prototype._resolve = function _resolve(locals, env, data, index) {
    locals.__resolve__ = true;
    return this._get(locals, env, data, index);
  };

  function Entity(node) {
    this.id = node.id;
    this.value = new Expression(node.value);
    this.index = [];
    node.index.forEach(function(ind) {
      this.index.push(new Expression(ind));
    }, this);
    this.attributes = {};
    for (var key in node.attrs) {
      this.attributes[key] = new Attribute(node.attrs[key]);
    }
    this.local = node.local || false;
  }
  Entity.prototype._get = function _get(locals, env, data, index) {
    var index = index || this.index;
    locals.__this__ = this;
    return this.value(locals, env, data, index);
  };
  Entity.prototype._yield = function _yield(env, data, key) {
    var locals = {
      '__resolve__': false,
    };
    return this._get(locals, env, data, [key]);
  };
  Entity.prototype._resolve = function _resolve(env, data, index) {
    var locals = {
      '__resolve__': true,
    };
    return this._get(locals, env, data, index);
  };
  Entity.prototype.get = function get(env, data, index) {
    return this._resolve(env, data, index);
  };
  Entity.prototype.getAttribute = function getAttribute(name, env, data) {
    return this.attributes[name]._resolve({ __this__: this }, env, data);
  },
  Entity.prototype.getAttributes = function getAttributes(env, data) {
    var attrs = {};
    for (var i in this.attributes) {
      var attr = this.attributes[i];
      attrs[attr.key] = attr._resolve({ __this__: this }, env, data);
    }
    return attrs;
  };
  Entity.prototype.getEntity = function getEntity(env, data) {
    return {
      value: this.get(env, data),
      attributes: this.getAttributes(env, data),
    };
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

  Compiler.compile = function compile(ast, obj) {
    for (var i = 0, elem; elem = ast[i]; i++) {
      if (elem.type == 'Entity')
        obj[elem.id.name] = new Entity(elem);
      else if (elem.type == 'Macro')
        obj[elem.id.name] = new Macro(elem);
    }
  }

})(this);
