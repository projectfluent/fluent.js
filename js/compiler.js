var Compiler = (function() {

  function ID(literal) {
    return function(locals) {
      return locals[literal];
    }
  }

  function NumberLiteral(literal) {
    return function(locals) {
      return literal;
    }
  }

  function StringLiteral(literal) {
    return function(locals) {
      return literal;
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
    }
  }

  function Expression(ast) {
    if (ast.type == 'conditional') return new ConditionalExpression(ast.body);
    if (ast.type == 'logical') return new LogicalExpression(ast.body);
    if (ast.type == 'binary') return new BinaryExpression(ast.body);
    if (ast.type == 'string') return new StringLiteral(ast.body);
    if (ast.type == 'number') return new NumberLiteral(ast.body);
    if (ast.type == 'id') return new ID(ast.body);
  }

  function Entity(ast) {
    return function(locals) {
      return ast;
    }
  }

  function Macro(ast) {
    var exp = new Expression(ast.body);
    var l = ast.args.length;
    return function() {
      var locals = {};
      for (var i = 0; i< l; i++) {
        locals[ast.args[i]] = arguments[i];
      }
      return exp(locals);
    };
  }

  function compile(ast, obj) {
    for (var i in ast) {
      if (1) {
        var entity = new Entity(ast[i]);
        obj[i] = entity;
      }
    }
  }

  return {
    compile: compile
  }

})();
