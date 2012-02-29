var Compiler = exports.Compiler = (function() {

  function Identifier(expr) {
    return function(locals) {
      return locals[expr.name];
    }
  }

  function NumberLiteral(expr) {
    return function(locals) {
      return expr.content;
    }
  }

  function StringLiteral(expr) {
    return function(locals) {
      return expr.content;
    }
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
      get: function(globals, env) {
        return value(globals, env);
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
      get: function(globals, env) {
        return value(globals, env);
      },
      getAttribute: function(name, globals, env) {
        return attributes[name].get(globals, env);
      },
      getAttributes: function(globals, env) {
        var attrs = {};
        for (var i in attributes) {
          var attr = attributes[i];
          attrs[attr.id] = attr.get(globals, env);
        }
        return attrs;
      },
      getEntity: function(globals, env) {
        return {
          value: this.get(globals, env),
          attributes: this.getAttributes(globals, env),
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
