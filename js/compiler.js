var Compiler = exports.Compiler = (function() {

  function Identifier(node) {
    return function(locals, env, data) {
      return env[node.name];
    };
  }

  function Variable(node) {
    return function(locals, env, data) {
      return locals[node.name] || data[node.name];
    };
  }

  function Global(node) {
    return function(locals, env, data) {
      return env.GLOBALS[node.name];
    };
  }

  function NumberLiteral(node) {
    return function(locals, env, data) {
      return node.content;
    };
  }

  function StringLiteral(node) {
    return function(locals, env, data) {
      return node.content;
    };
  }

  function ArrayLiteral(node) {
    var content = [];
    var defaultIndex = null;
    for (var i = 0, elem; elem = node.content[i]; i++) {
      content.push(new Expression(elem));
      if (elem.default)
        defaultIndex = i;
    }
    return function(locals, env, data, index) {
      var values = [];
      for (var i = 0, part; part = content[i]; i++) {
        values.push(part(locals, env, data));
      }
      if (index) try {
        return values[index];
      } catch (e) {}
      if (defaultIndex !== null) try {
        return values[defaultIndex];
      } catch (e) {}
      return values;
    };
  }

  function HashLiteral(node) {
    var content = [];
    var defaultKey = null;
    for (var i = 0, elem; elem = node.content[i]; i++) {
      content[elem.id] = new Expression(elem);
      if (elem.default)
        defaultKey = elem.id;
    }
    return function(locals, env, data, index) {
      var values = [];
      for (var key in content) {
        var value = content[key];
        values[key] = value(locals, env, data);
      }
      if (index) try {
        return values[index];
      } catch (e) {}
      if (defaultKey !== null) try {
        return values[defaultKey];
      } catch (e) {}
      return value;
    };
  }

  function ComplexString(node) {
    var content = [];
    for (var i = 0, part; part = node.content[i]; i++) {
      content.push(new Expression(part));
    }
    return function(locals, env, data) {
      var parts = [];
      for (var i = 0, part; part = content[i]; i++) {
        parts.push(part(locals, env, data));
      }
      return parts.join('');
    };
  }

  function KeyValuePair(node) {
    var value = new Expression(node.value)
    return function(locals, env, data) {
      return value(locals, env, data);
    };
  }

  function BinaryOperator(token) {
    if (token == '+') return function(left, right) {
      return left + right;
    };
    if (token == '==') return function(left, right) {
      return left == right;
    };
    // etc.
  }

  function BinaryExpression(node) {
    var left = new Expression(node.left);
    var operator = new BinaryOperator(node.operator);
    var right = new Expression(node.right);
    return function(locals) {
      return operator(left(locals), right(locals));
    };
  }

  function LogicalOperator(token) {
    if (token == '&&') return function(left, right) {
      return left && right;
    };
    if (token == '||') return function(left, right) {
      return left || right;
    };
  }

  function LogicalExpression(node) {
    var left = new Expression(node.left);
    if (node.operator) {
      var operator = new LogicalOperator(node.operator);
      var right = new Expression(node.right);
      return function(locals) {
        operator(left(locals), right(locals));
      }
    } else return left(locals);
  }

  function ConditionalExpression(node) {
    var condition = new Expression(node.condition);
    var ifTrue = new Expression(node.ifTrue);
    var ifFalse = new Expression(node.ifFalse);
    return function(locals) {
      if (condition(locals)) return ifTrue(locals);
      else return ifFalse(locals);
    };
  }

  function Expression(node) {
    if (!node) return null;

    if (node.type == 'conditionalExpression') return new ConditionalExpression(node);
    if (node.type == 'logicalExpression') return new LogicalExpression(node);
    if (node.type == 'binaryExpression') return new BinaryExpression(node);
    if (node.type == 'unaryExpression') return new UnaryExpression(node);

    if (node.type == 'callExpression') return new CallExpression(node);
    if (node.type == 'propertyExpression') return new PropertyExpression(node);
    if (node.type == 'attributeExpression') return new AttributeExpression(node);
    if (node.type == 'parenthesisExpression') return new ParenthesisExpression(node);

    if (node.type == 'keyValuePair') return new KeyValuePair(node);

    if (node.type == 'identifier') return new Identifier(node);
    if (node.type == 'variable') return new Variable(node);
    if (node.type == 'number') return new NumberLiteral(node);
    if (node.type == 'string') return new StringLiteral(node);
    if (node.type == 'complexString') return new ComplexString(node);
    if (node.type == 'array') return new ArrayLiteral(node);
    if (node.type == 'hash') return new HashLiteral(node);
  }

  function Attribute(node) {
    var value = new Expression(node.value);
    return {
      id: node.id,
      local: node.local || false,
      get: function(env, data) {
        return value(env, data);
      }
    };
  }

  function Entity(node) {
    var value = new Expression(node.value);
    //var index = new Expression(node.index);
    var attributes = {};
    for (var i = 0, attr; attr = node.attrs[i]; i++) {
      attributes[attr.id] = new Attribute(attr);
    }

    return {
      id: node.id,
      local: node.local || false,
      get: function(env, data) {
        return value(env, data);
      },
      getAttribute: function(name, env, data) {
        return attributes[name].get(env, data);
      },
      getAttributes: function(env, data) {
        var attrs = {};
        for (var i in attributes) {
          var attr = attributes[i];
          attrs[attr.id] = attr.get(env, data);
        }
        return attrs;
      },
      getEntity: function(env, data) {
        return {
          value: this.get(env, data),
          attributes: this.getAttributes(env, data),
        };
      },
    };
  }

  function Macro(node) {
    var expr = new Expression(node.expression);
    var len = node.args.length;
    return function() {
      var locals = {};
      for (var i = 0; i < len; i++) {
        locals[node.args[i]] = arguments[i];
      }
      return expr(locals);
    };
  }

  function compile(ast, obj) {
    for (var i = 0, elem; elem = ast[i]; i++) {
      if (elem.type == 'entity')
        obj[elem.id] = new Entity(elem);
      else if (elem.type == 'macro')
        obj[elem.id] = new Macro(elem);
    }
  }

  return {
    compile: compile,
  };

})();
