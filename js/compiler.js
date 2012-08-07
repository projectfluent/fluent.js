var Compiler = (function() {

  // {{{ primary expressions

  function Identifier(node) {
    var name = node.name;
    return function(locals, env, data) {
      if (locals.__stack__.indexOf(name) > -1) {
        console.error('Circular reference')
        return '';
      }
      return env[name];
    };
  }

  function This(node) {
    return function(locals, env, data) {
      if (locals.__stack__.indexOf(locals.__this__.id) > -1) {
        console.error('Circular reference')
        return '';
      }
      return locals.__this__;
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
    var defaultKey = 0;
    node.content.forEach(function(elem, i) {
      content.push(new Expression(elem));
      if (elem.default)
        defaultKey = i;
    });
    return function(locals, env, data, index) {
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
      content[elem.id] = new Expression(elem);
      if (i == 0 || elem.default)
        defaultKey = elem.id;
    });
    return function(locals, env, data, index) {
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

  function ComplexString(node) {
    var content = [];
    node.content.forEach(function(elem) {
      content.push(new Expression(elem));
    })
    return function(locals, env, data) {
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
      return parts.join('');
    };
  }

  function KeyValuePair(node) {
    return new Expression(node.value)
  }


  // }}}
  // {{{ operators

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


  // }}}
  // {{{ logical expressions

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


  // }}}
  // {{{ member expressions

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
      var ret = expression(locals, env, data);
      if (ret instanceof Entity)
        return ret._yield(locals, env, data, [property]);
      if (ret instanceof Attribute)
        return ret._yield(locals, env, data, [property]);
      // else, `expression` is a HashLiteral
      return ret(locals, env, data, property);
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
      var entity = expression(locals, env, data);
      //if (!entity instanceof Entity)
      //  throw "Expression does not evaluate to a valid entity."
      return entity.getAttribute(attribute, env, data);
    }
  }


  // }}}
  // {{{ the base Expression class

  function Expression(node) {
    if (!node) return null;

    if (node.type == 'conditionalExpression')
      return new ConditionalExpression(node);
    if (node.type == 'logicalExpression')
      return new LogicalExpression(node);
    if (node.type == 'binaryExpression')
      return new BinaryExpression(node);
    if (node.type == 'unaryExpression')
      return new UnaryExpression(node);

    if (node.type == 'callExpression')
      return new CallExpression(node);
    if (node.type == 'propertyExpression')
      return new PropertyExpression(node);
    if (node.type == 'attributeExpression')
      return new AttributeExpression(node);
    if (node.type == 'parenthesisExpression')
      return new ParenthesisExpression(node);

    if (node.type == 'keyValuePair')
      return new KeyValuePair(node);

    if (node.type == 'identifier')
      return new Identifier(node);
    if (node.type == 'this')
      return new This(node);
    if (node.type == 'variable')
      return new Variable(node);
    if (node.type == 'number')
      return new NumberLiteral(node);
    if (node.type == 'string')
      return new StringLiteral(node);
    if (node.type == 'complexString')
      return new ComplexString(node);
    if (node.type == 'array')
      return new ArrayLiteral(node);
    if (node.type == 'hash')
      return new HashLiteral(node);
  }

  // }}}
  // {{{ entries

  function Attribute(node) {
    this.id = node.id;
    this.local = node.local || false;
    this.value = new Expression(node.value);
  }

  Attribute.prototype = {
    yield: function yield(locals, env, data, key) {
      return this.value(locals, env, data, key);
    },
    get: function get(locals, env, data, index) {
      if (index === undefined)
        index = locals['__this__'].index;
      var ret = this.yield(locals, env, data, index.shift());
      while (typeof ret !== 'string') {
        ret = ret(locals, env, data, index.shift());
      }
      return ret;
    },
  }

  function Entity(node) {
    this.id = node.id;
    this.value = new Expression(node.value);
    this.index = [];
    node.index.forEach(function(ind) {
      this.index.push(new Expression(ind));
    }, this);
    this.attributes = {};
    node.attrs.forEach(function(attr) {
      this.attributes[attr.id] = new Attribute(attr);
    }, this);
    this.local = node.local || false;
  }

  Entity.prototype = {
    _get: function _get(locals, env, data, index) {
      if (index === undefined)
        index = this.index;
      locals.__this__ = this;
      locals.__stack__ = locals.__stack__ || [];
      locals.__stack__.push(this.id); 
      return this.value(locals, env, data, index);
    },
    _yield: function _yield(locals, env, data, index) {
      locals.__resolve__ = false;
      return this._get(locals, env, data, index);
    },
    _resolve: function _resolve(locals, env, data, index) {
      locals.__resolve__ = true;
      return this._get(locals, env, data, index);
    },
    get: function get(env, data, index) {
      return this._resolve({}, env, data, index);
    },
    getAttribute: function getAttribute(name, env, data) {
      return this.attributes[name].get({ __this__: this }, env, data);
    },
    getAttributes: function getAttributes(env, data) {
      var attrs = {};
      for (var i in this.attributes) {
        var attr = this.attributes[i];
        attrs[attr.id] = attr.get({ __this__: this }, env, data);
      }
      return attrs;
    },
    getEntity: function getEntity(env, data) {
      return {
        value: this.get(env, data),
        attributes: this.getAttributes(env, data),
      };
    }
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

  // }}}
  // {{{ public API

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

  // }}}

})();
