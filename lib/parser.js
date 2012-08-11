'use strict'
L20n.Parser = function() {
  let content = null;
  let patterns = {
    id: /^([_a-zA-Z]\w*)/,
    value: /^(["'])([^'"]*)(["'])/
  }

  function parse(string) {
    let lol = {type: 'LOL',
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
    let entry
    if (content[0] == '<') {
      content = content.substr(1)
      let id = get_identifier()
      if (content[0] == '(') {
        entry = get_macro(id)
      } else if (content[0] == '[') {
        let index = get_index()
        entry = get_entity(id, index)
      } else {
        entry = get_entity(id);
      }
    } else if (content.substr(0,2) == '/*') {
      entry = get_comment();
    } else if (content.substr(0,6) == 'import') {
      entry = get_importstatement()
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
    let uri = get_string()
    get_ws()
    if (content[0] != ')') {
      throw "ParserError"
    }
    content = content.substr(1)
    let impStmt = {
      type: 'ImportStatement',
      uri: uri
    }
    return impStmt
  }

  function get_identifier() {
    if (content[0] == '~') {
      // this expression
    }
    let match = patterns['id'].exec(content)
    if (!match)
      throw "ParserError"
    content = content.substr(match[0].length)
    let identifier = {type: 'Identifier',
                  name: match[0]}
    return identifier
  }

  function get_entity(id, index) {
    let ch = content[0]
    get_ws();
    if (content[0] == '>') {
      // empty entity
    }
    if (!/\s/g.test(ch)) {
      throw "ParserError"
    }
    let value = get_value(true)
    get_ws()
    let attrs = get_attributes()
    let entity = {
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
    let c = content[0]
    let value
    if (c == '"' || c == "'") {
      let ccc = content.substr(3)
      let quote = (ccc == '"""' || ccc == "'''")?ccc:c
      //let value = get_string()
      value = get_complex_string(quote)
    }
    return value
  }

  function get_string() {
    let match = patterns['value'].exec(content)
    if (!match) {
      throw "ParserError"
    }
    content = content.substr(match[0].length)
    return {type: 'String', content: match[2]}
  }

  function get_complex_string(quote) {
    let str_end = quote[0]
    let literal = new RegExp("^([^\\\{"+str_end+"]+)")
    let obj = []
    let buffer = ''
    content = content.substr(quote.length)
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
