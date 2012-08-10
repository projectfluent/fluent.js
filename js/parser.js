L20n.Parser = function() {
  var content = null;
  var patterns = {
    id: /^([_a-zA-Z]\w*)/,
    value: /^(["'])([^'"]*)(["'])/
  }

  function parse(string) {
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

  function get_ws() {
    content = content.replace(/^\s+/,"")  
  }

  function get_entry() {
    if (content[0] == '<') {
      content = content.substr(1)
      id = get_identifier()
      if (content[0] == '(') {
        var entry = get_macro(id)
      } else if (content[0] == '[') {
        var index = get_index()
        var entry = get_entity(id, index)
      } else {
        var entry = get_entity(id);
      }
    } else if (content.substr(0,2) == '/*') {
      var entry = get_comment();
    } else if (content.substr(0,6) == 'import') {
      var entry = get_importstatement()
    } else {
      throw "ParserError"
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
      throw "ParserError"
    content = content.substr(match[0].length)
    identifier = {type: 'Identifier',
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
      throw "ParserError"
    }
    var value = get_value(true)
    get_ws()
    attrs = get_attributes()
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

  function get_value(none) {
    var c = content[0]
    if (c == '"' || c == "'") {
      var ccc = content.substr(3)
      var quote = (ccc == '"""' || ccc == "'''")?ccc:c
      var value = get_string()
    }
    return value
  }

  function get_string() {
    var match = patterns['value'].exec(content)
    if (!match) {
      throw "ParserError"
    }
    content = content.substr(match[0].length)
    return {type: 'String', content: match[2]}
  }

  function get_attributes() {
    if (content[0] == '>') {
      content = content.substr(1)
      return {}
    }
  }

  return {
    parse: parse,
  }
} 
