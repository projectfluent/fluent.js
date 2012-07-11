var Compiler = exports.Compiler = (function() {


  // primary expressions

  function Identifier(node, resolve) {
    if (resolve === undefined)
      resolve = true;
    return function(locals, env, data) {
      var entry = env[node.name];
      if (entry.get && resolve)
        return entry.get(env, data);
      return entry;
    };
  }

  function This(node) {
    return function(locals, env, data) {
      return locals['__this__'].get(env, data);
    };
  }

  function Variable(node) {
    return function(locals, env, data) {
      var value = locals[node.name];
      if (value !== undefined)
        return value;
      return data[node.name];
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
    var defaultIndex = 0;
    node.content.forEach(function(elem, i) {
      content.push(new Expression(elem));
      if (elem.default)
        defaultIndex = i;
    });
    return function(locals, env, data, index) {
      var i = index.shift();
      if (typeof i == 'function')
        i = i(locals, env, data);
      try {
        return content[i](locals, env, data, index);
      } catch (e) {
        return content[defaultIndex](locals, env, data, index);
      }
    };
  }

  function HashLiteral(node) {
    var content = [];
    var defaultKey = null;
    node.content.forEach(function(elem, i) {
      content[elem.id] = new Expression(elem);
      if (i == 0 || elem.default)
        defaultKey = elem.id;
    });
    return function(locals, env, data, index) {
      var key = index.shift();
      if (typeof key == 'function')
        key = key(locals, env, data);
      try {
        return content[key](locals, env, data, index);
      } catch (e) {
        return content[defaultKey](locals, env, data, index);
      }
    };
  }

  function ComplexString(node) {
    var content = [];
    node.content.forEach(function(elem) {
      content.push(new Expression(elem));
    })
    return function(locals, env, data) {
      var parts = [];
      content.forEach(function(elem) {
        parts.push(elem(locals, env, data));
      })
      return parts.join('');
    };
  }

  function KeyValuePair(node) {
    var value = new Expression(node.value)
    return value;
  }


  // operators

  function UnaryOperator(token) {
    if (token == '-') return function(operand) {
      return -operand;
    };
    if (token == '+') return function(operand) {
      return +operand;
    };
    if (token == '!') return function(operand) {
      return !operand;
    };
  }

  function BinaryOperator(token) {
    if (token == '==') return function(left, right) {
      return left == right;
    };
    if (token == '!=') return function(left, right) {
      return left != right;
    };
    if (token == '<') return function(left, right) {
      return left < right;
    };
    if (token == '<=') return function(left, right) {
      return left <= right;
    };
    if (token == '>') return function(left, right) {
      return left > right;
    };
    if (token == '>=') return function(left, right) {
      return left >= right;
    };
    if (token == '+') return function(left, right) {
      return left + right;
    };
    if (token == '-') return function(left, right) {
      return left - right;
    };
    if (token == '*') return function(left, right) {
      return left * right;
    };
    if (token == '/') return function(left, right) {
      return left / right;
    };
    if (token == '%') return function(left, right) {
      return left % right;
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


  // logical expressions

  function UnaryExpression(node) {
    var operator = new UnaryOperator(node.operator);
    var operand = new Expression(node.operand);
    return function(locals, env, data) {
      return operator(operand(locals, env, data));
    };
  }

  function BinaryExpression(node) {
    var left = new Expression(node.left);
    var operator = new BinaryOperator(node.operator);
    var right = new Expression(node.right);
    return function(locals, env, data) {
      return operator(left(locals, env, data), right(locals, env, data));
    };
  }

  function LogicalExpression(node) {
    var left = new Expression(node.left);
    if (node.operator) {
      var operator = new LogicalOperator(node.operator);
      var right = new Expression(node.right);
      return function(locals, env, data) {
        operator(left(locals, env, data), right(locals, env, data));
      }
    } else return left;
  }

  function ConditionalExpression(node) {
    var test = new Expression(node.test);
    var consequent = new Expression(node.consequent);
    var alternate = new Expression(node.alternate);
    return function(locals, env, data) {
      if (test(locals, env, data))
        return consequent(locals, env, data);
      return alternate(locals, env, data);
    };
  }


  // member expressions

  function CallExpression(node) {
    var callee = new Expression(node.callee);
    var args = [];
    node.arguments.forEach(function(elem, i) {
      args.push(new Expression(elem));
    });
    return function(locals, env, data) {
      var resolved_args = [];
      args.forEach(function(arg, i) {
        resolved_args.push(arg(locals, env, data));
      });
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
    return function(locals, env, data) {
      return expression(locals, env, data, property);
    }
  }


  function AttributeExpression(node) {
    var expression = new Expression(node.expression, false);
    var computed = node.computed;
    if (computed)
      var attribute = new Expression(node.attribute);
    else
      var attribute = node.attribute.name;
    return function(locals, env, data) {
      return expression(locals, env, data).getAttribute(attribute, env, data);
    }
  }


  // the base Expression class

  function Expression(node, resolve) {
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

    if (node.type == 'identifier') return new Identifier(node, resolve);
    if (node.type == 'this') return new This(node, resolve);
    if (node.type == 'variable') return new Variable(node);
    if (node.type == 'number') return new NumberLiteral(node);
    if (node.type == 'string') return new StringLiteral(node);
    if (node.type == 'complexString') return new ComplexString(node);
    if (node.type == 'array') return new ArrayLiteral(node);
    if (node.type == 'hash') return new HashLiteral(node);
  }


  // entries

  function Attribute(node) {
    var value = new Expression(node.value);
    return {
      id: node.id,
      local: node.local || false,
      get: function(locals, env, data) {
        return value(locals, env, data);
      }
    };
  }

  function Entity(node) {
    var value = new Expression(node.value);
    var index = [];
    node.index.forEach(function(ind) {
      index.push(new Expression(ind));
    });
    var attributes = {};
    node.attrs.forEach(function(attr) {
      attributes[attr.id] = new Attribute(attr);
    });

    return {
      id: node.id,
      value: value,
      index: index,
      attributes: attributes,
      local: node.local || false,
      get: function(env, data, index) {
        index = index || this.index || [];
        return this.value({ __this__: this }, env, data, index);
      },
      getAttribute: function(name, env, data) {
        return this.attributes[name].get({ __this__: this }, env, data);
      },
      getAttributes: function(env, data) {
        var attrs = {};
        for (var i in this.attributes) {
          var attr = this.attributes[i];
          attrs[attr.id] = attr.get({ __this__: this }, env, data);
        }
        return attrs;
      },
      getEntity: function(env, data) {
        return {
          value: this.get(env, data),
          attributes: this.getAttributes(env, data),
        };
      }
    };
  }

  function Macro(node) {
    var expression = new Expression(node.expression);
    return function(args, env, data) {
      var locals = {};
      node.args.forEach(function(arg, i) {
        locals[arg.name] = args[i];
      });
      return expression(locals, env, data);
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
