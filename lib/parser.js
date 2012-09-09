(function() {
  'use strict';

  var Parser;

  if (typeof exports !== 'undefined') {
    Parser = exports;
  } else {
    Parser = this.L20n.Parser = {};
  }

  Parser.parse = function parse(string) {
    var lol = {type: 'LOL',
               body: []}
    content = string
    get_ws();
    while (content) {
      lol.body.push(get_entry())
      get_ws();
    }
    return lol
  }

  var content = null;
  var patterns = {
    id: /^([_a-zA-Z]\w*)/,
    value: /^(["'])([^'"]*)(["'])/,
    ws: /^\s+/
  };


  function get_ws() {
    content = content.replace(patterns['ws'], '')  
  }

  function get_entry() {
    var entry
    if (content[0] == '<') {
      content = content.substr(1)
      var id = get_identifier()
      if (content[0] == '(') {
        entry = get_macro(id)
      } else if (content[0] == '[') {
        var index = get_index()
        entry = get_entity(id, index)
      } else {
        entry = get_entity(id);
      }
    } else if (content.substr(0,2) == '/*') {
      entry = get_comment();
    } else if (content.substr(0,6) == 'import') {
      entry = get_importstatement()
    } else {
      throw "ParserError at get_entry"
    }
    return entry
  }

  function get_importstatement() {
    content = content.substr(6)
    get_ws()
    if (content[0] != '(') {
      throw "ParserError"
    }
    content = content.substr(1)
    get_ws()
    var uri = get_string()
    get_ws()
    if (content[0] != ')') {
      throw "ParserError"
    }
    content = content.substr(1)
    var impStmt = {
      type: 'ImportStatement',
      uri: uri
    }
    return impStmt
  }

  function get_identifier() {
    if (content[0] == '~') {
      // this expression
    }
    var match = patterns['id'].exec(content)
    if (!match)
      throw "ParserError at get_identifier"
    content = content.substr(match[0].length)
    var identifier = {type: 'Identifier',
                  name: match[0]}
    return identifier
  }

  function get_entity(id, index) {
    var ch = content[0]
    get_ws();
    if (content[0] == '>') {
      // empty entity
    }
    if (!/\s/g.test(ch)) {
      throw "ParserError at get_entity"
    }
    var value = get_value(true)
    get_ws()
    var attrs = get_attributes()
    var entity = {
      type: 'Entity',
      id: id,
      value: value,
      index: index || [],
      attrs: attrs,
      local: (id.name[0] == '_')
    }
    return entity
  }

  function get_macro(id) {
    if (id.name[0] == '_') {
      throw "ParserError at get_macro"
    }
    var idlist = []
    content = content.substr(1)
    get_ws()
    if (content[0] == ')') {
      content = content.substr(1)
    } else {
      while (1) {
        idlist.push(get_variable())
        get_ws()
        if (content[0] == ',') {
          content = content.substr(1)
          get_ws()
        } else if (content[0] == ')') {
          content = content.substr(1)
          break
        } else {
          throw "ParserError at get_macro"
        }
      }
    }
    get_ws()
    // we should check if the ws was empty and throw ParserError here
    if (content[0] != '{') {
      throw "ParserError at get_macro"
    }
    content = content.substr(1)
    get_ws()
    var exp = get_expression()
    get_ws()
    if (content[0] != '}') {
      throw "ParserError at get_macro"
    }
    content = content.substr(1)
    get_ws()
    var attrs = get_attributes()
    var macro =  {
      'type': 'Macro',
      'id': id,
      'args': idlist,
      'expression': exp
    }
    // macro.attrs
    return macro
  }

  function get_value(none) {
    var c = content[0]
    var value
    if (c == '"' || c == "'") {
      var ccc = content.substr(3)
      var quote = (ccc == '"""' || ccc == "'''")?ccc:c
      //var value = get_string()
      value = get_complex_string(quote)
    } else if (c == '[') {
      value = get_array()
    } else if (c == '{') {
      value = get_hash()
    }
    return value
  }

  function get_string() {
    var match = patterns['value'].exec(content)
    if (!match) {
      throw "ParserError at get_string"
    }
    content = content.substr(match[0].length)
    return {type: 'String', content: match[2]}
  }

  function get_complex_string(quote) {
    var str_end = quote[0]
    var literal = new RegExp("^([^\\\{"+str_end+"]+)")
    var obj = []
    var buffer = ''
    content = content.substr(quote.length)
    var i = 0
    while (content.substr(0, quote.length) != quote) {
      i++;
      if (i>20)
        break
      if (content[0] == str_end) {
        buffer += content[0]
        content = content.substr(1)
      }
      if (content[0] == '\\') {
        var jump = content.substr(1, 3) == '{{' ? 3 : 2;
        buffer += content.substr(1, jump)
        content = content.substr(jump)
      }
      if (content.substr(0, 2) == '{{') {
        content = content.substr(2)
        if (buffer) {
          var string = {type: 'String', content: buffer}
          obj.push(string)
          buffer = ''
        }
        get_ws()
        var expr = get_expression()
        obj.push(expr)
        if (content.substr(0, 2) != '}}') {
          throw "ParserError at get_complex_string"
        }
        content = content.substr(2)
      }
      var m = literal.exec(content)
      if (m) {
        buffer = m[1]
        content = content.substr(m[0].length)
      }
    }
    if (buffer) {
      var string = {type: 'String', content: buffer}
      obj.push(string)
    }
    content = content.substr(quote.length)
    if (obj.length == 1 && obj[0].type == 'String') {
      return obj[0]
    }
    var cs = {type: 'ComplexString', content: obj}
    return cs
  }

  function get_hash() {
    content = content.substr(1)
    get_ws()
    if (content[0] == '}') {
      var h = {type: 'Hash', content: []}
      return h
    }
    var hash = []
    while (1) {
      var defitem = false
      if (content[0] == '*') {
        content = content.substr(1)
          defitem = true
      }
      var hi = get_kvp('HashItem')
      hi.default = defitem
      hash.push(hi)
      get_ws()
      if (content[0] == ',') {
        content = content.substr(1)
        get_ws()
      } else if (content[0] == '}') {
        break
      } else {
        throw "ParserError in get_hash"
      }
    }
    content = content.substr(1)
    var h = {type: 'Hash', content: hash}
    return h
  }

  function get_kvp(cl) {
    var key = get_identifier()
    get_ws()
    if (content[0] != ':') {
      throw "ParserError"
    }
    content = content.substr(1)
    get_ws()
    var val = get_value()
    var kvp = {type: cl, key: key, value: val}
    return kvp
  }

  function get_attributes() {
    if (content[0] == '>') {
      content = content.substr(1)
      return {}
    }
    var attrs = {}
    while (1) {
      var attr = get_kvp('Attribute')
      attr.local = attr.key.name[0] == '_'
      attrs[attr.key.name] = attr
      var ch = content[0]
      get_ws()
      if (content[0] == '>') {
        content = content.substr(1)
        break
      } else if (!/^\s/.test(ch)) {
        throw "ParserError"
      }
    }
    return attrs
  }

  function get_index() {
    content = content.substr(1)
    get_ws()
    var index = []
    if (content[0] == ']') {
      content = content.substr(1)
      return index
    }
    while (1) {
      var expression = get_expression()
      index.push(expression)
      get_ws()
      if (content[0] == ',') {
        content = content.substr(1)
      } else if (content[0] == ']') {
        break
      } else {
        throw "ParserError in get_index"
      }
    }
    content = content.substr(1)
    return index
  }

  function get_expression() {
    return get_conditional_expression()
    var exp = get_primary_expression()
    get_ws()
    return exp
  }

  function get_conditional_expression() {
    var or_expression = get_or_expression()
    get_ws()
    if (content[0] != '?') {
      return or_expression
    }
    content = content.substr(1)
    var consequent = get_expression()
    get_ws()
    if (content[0] != ':') {
      throw "ParserError in get_conditional_expression"
    }
    content = content.substr(1)
    get_ws()
    var alternate = get_expression()
    var cons_exp = {
      'type': 'ConditionalExpression',
      'test': or_expression,
      'consequent': consequent,
      'alternate': alternate
    }
    return cons_exp
  }

  function get_prefix_expression(token, token_length, cl, op, nxt) {
    var exp = nxt()
    get_ws()
    while (token.indexOf(content.substr(0, token_length)) !== -1) {
      var t = content.substr(0, token_length)
      content = content.substr(token_length)
      get_ws()
      op.token = t
      cl.left = exp
      cl.right = nxt()
      get_ws()
    }
    return exp
  }

  function get_or_expression() {
    var token=['||',]
    var cl = {
      'type': 'LogicalExpression',
    }
    var op = {
      'type': 'LogicalOperator',
    }
    return get_prefix_expression(token, 2, cl, op, get_and_expression)
  }

  function get_and_expression() {
    var token=['&&',]
    var cl = {
      'type': 'LogicalExpression',
    }
    var op = {
      'type': 'LogicalOperator',
    }
    return get_prefix_expression(token, 2, cl, op, get_equality_expression)
  }

  function get_equality_expression() {
    var token=['==',]
    var cl = {
      'type': 'BinaryExpression',
    }
    var op = {
      'type': 'BinaryOperator',
    }
    return get_prefix_expression(token, 2, cl, op, get_member_expression)
  }

  function get_member_expression() {
    var exp = get_primary_expression()
    var match = content.match(/^(\w*)/)
    var ws_post_id = ""

    if (match) {
      ws_post_id = match[1]
      content = content.substr(ws_post_id.length)
    }
    get_ws()
    var matched = false
    while (1) {
      if (['.[', '..'].indexOf(content.substr(2)) !== -1) {
        exp = get_attr_expression(exp, ws_post_id)
        matched = true
      } else if (['[', '.'].indexOf(content[0]) !== -1) {
        exp = get_property_expression(exp, ws_post_id)
        matched = true
      } else if (content[0] == '(') {
        exp = get_call_expression(exp, ws_post_id)
        matched = true
      } else {
        break
      }
    }
    if (!matched) {
      content = ws_post_id + content
    }
    return exp
  }

  function get_primary_expression() {
    // number
    var match = content.match(/^(\d+)/)
    if (match) {
      var d = parseInt(match[1])
      content = content.substr(match[1].length)
      return {
        'type': 'Literal',
        'value': d
      }
    }
    // value
    if (["'",'"','{','['].indexOf(content[0]) !== -1) {
      return get_value()
    }
    // variable
    if (content[0] == '$') {
      return get_variable()
    }
    // globals
    if (content[0] == '@') {
      content = content.substr(1)
      var id = get_identifier()
      var ge = {type: 'GlobalsExpression', id: id}
      return ge
    }
    return get_identifier()
  }

  function get_variable() {
    content = content.substr(1)
    var id = get_identifier()
    var ve = {type: 'VariableExpression', id: id}
    return ve
  }

  function get_property_expression(idref, ws_post_id) {
    var d= content[0]
    if (d == '[') {
      content = content.substr(1)
      get_ws()
      var exp = get_member_expression()
      get_ws()
      if (content[0] != ']') {
        throw "ParserError in get_property_expression"
      }
      content = content.substr(1)
      var prop = {
        'type': 'PropertyExpression',
        'expression': idref,
        'property': exp,
        'computed': true
      }
      return prop
    } else if (d == '.') {
      content = content.substr(1)
      var prop = get_identifier()
      var pe = {
        'type': 'PropertyExpression',
        'expression': idref,
        'property': prop,
        'computed': false
      }
      return pe
    } else {
      throw "ParserError in get_property_expression"
    }
  }

  function get_call_expression(callee, ws_post_id) {
    var mcall = {
      'type': 'CallExpression',
      'callee': callee,
      'arguments': [],
    }
    content = content.substr(1)
    get_ws()
    if (content[0] == ')') {
      content = content.substr(1)
        return mcall
    }
    while (1) {
      var exp = get_expression()
      mcall.arguments.push(exp)
      get_ws()
      if (content[0] == ',') {
        content = content.substr(1)
        get_ws()
      } else if (content[0] == ')') {
        break
      } else {
        throw "ParserError in get_call_expression"
      }
    }
    content = content.substr(1)
    return mcall
  }

}).call(this); 
