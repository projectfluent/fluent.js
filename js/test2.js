var obj = [];
var asts = {
  'path1': {
  'type': 'LOL',
  'body': [
  {
    "type": "ImportStatement", 
    "uri": {
      "type": "String", 
      "content": "path3"
    }
  }, 
  {
    "type": "Entity", 
    "id": {
      "type": "Identifier", 
      "name": "foo"
    }, 
    "index": [], 
    "value": {
      "type": "String", 
      "content": "value"
    }, 
    "attrs": {}, 
    "local": false
  }
  ]
  },
  'path2': {
  'type': 'LOL',
  'body': []
  },
  'path3': {
    'type': 'LOL',
    'body': [
      {
        'type': 'Entity',
        'id': {
          'type': 'Identifier',
          'name': 'foo2'
        },
        'index': [],
        'value': {
          'type': 'String',
          'content': 'value'
        },
        'attrs': {},
        'local': false
      }
    ]
  }
}



var ctx = L20n.getContext();

ctx.__addResourceAST('path1')

ctx.__addResourceAST('path2')

ctx.__addResourceAST('path1')

ctx.onReady = function() {
  console.log('-- ready!')
  console.log(ctx.getAST());
}

//Compiler.compile(ast, obj);

//console.log('01 Firefox', obj['brandName1'].get(obj));
