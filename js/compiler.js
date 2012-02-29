var Compiler = exports.Compiler = (function() {

  function Identifier(expr) {
    return function(locals, env, data) {
      return locals[expr.name] || env[expr.name];
    };
  }

  function Variable(expr) {
    return function(locals, env, data) {
      return data[expr.name];
    };
  }

  function Global(expr) {
    return function(locals, env, data) {
      return env.GLOBALS[expr.name];
    };
  }

  function NumberLiteral(expr) {
    return function(locals, env, data) {
      return expr.content;
    };
  }

  function StringLiteral(expr) {
    return function(locals, env, data) {
      return expr.content;
    };
  }

  function ArrayLiteral(expr) {
    return function(locals, env, data, index) {
      return expr.content[index];
    };
  }

  function HashLiteral(expr) {
    return function(locals, env, data,  index) {
      return expr.content[index];
    };
  }

  function ComplexString(expr) {
    var contents = [];
    for (var i = 0, part; part = expr.content[i]; i++) {
      contents.push(new Expression(part));
    }
    return function(locals, env, data) {
      var parts = [];
      for (var i = 0, part; part = contents[i]; i++) {
        parts.push(part(locals, env, data));
      }
      return parts.join('');
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

  function BinaryExpression(ast) {
    var left = new Expression(ast.left);
    var operator = new BinaryOperator(ast.operator);
    var right = new Expression(ast.right);
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

  function LogicalExpression(ast) {
    var left = new Expression(ast.left);
    if (ast.operator) {
      var operator = new LogicalOperator(ast.operator);
      var right = new Expression(ast.right);
      return function(locals) {
        operator(left(locals), right(locals));
      }
    } else return left(locals);
  }

  function ConditionalExpression(ast) {
    var condition = new Expression(ast.condition);
    var ifTrue = new Expression(ast.ifTrue);
    var ifFalse = new Expression(ast.ifFalse);
    return function(locals) {
      if (condition(locals)) return ifTrue(locals);
      else return ifFalse(locals);
    };
  }

  function Expression(expr) {
    if (!expr) return null;

    if (expr.type == 'conditionalExpression') return new ConditionalExpression(expr);
    if (expr.type == 'logicalExpression') return new LogicalExpression(expr);
    if (expr.type == 'binaryExpression') return new BinaryExpression(expr);
    if (expr.type == 'unaryExpression') return new UnaryExpression(expr);

    if (expr.type == 'callExpression') return new CallExpression(expr);
    if (expr.type == 'propertyExpression') return new PropertyExpression(expr);
    if (expr.type == 'attributeExpression') return new AttributeExpression(expr);
    if (expr.type == 'parenthesisExpression') return new ParenthesisExpression(expr);

    if (expr.type == 'string') return new StringLiteral(expr);
    if (expr.type == 'complexString') return new ComplexString(expr);
    if (expr.type == 'number') return new NumberLiteral(expr);
    if (expr.type == 'identifier') return new Identifier(expr);
    if (expr.type == 'variable') return new Variable(expr);
  }

  function Attribute(ast) {
    var value = new Expression(ast.value);
    return {
      id: ast.id,
      local: ast.local || false,
      get: function(env, data) {
        return value(env, data);
      }
    };
  }

  function Entity(ast) {
    var value = new Expression(ast.value);
    //var index = new Expression(ast.index);
    var attributes = {};
    for (var i = 0, attr; attr = ast.attrs[i]; i++) {
      attributes[attr.id] = new Attribute(attr);
    }

    return {
      id: ast.id,
      local: ast.local || false,
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

  function Macro(ast) {
    var expr = new Expression(ast.expression);
    var len = ast.args.length;
    return function() {
      var locals = {};
      for (var i = 0; i < len; i++) {
        locals[ast.args[i]] = arguments[i];
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
