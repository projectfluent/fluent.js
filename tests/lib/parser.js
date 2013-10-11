var should = require('should');
var Parser = process.env.L20N_COV
  ? require('../../build/cov/lib/l20n/parser').Parser
  : require('../../lib/l20n/parser').Parser;

describe('Example', function() {
  var parser;
  beforeEach(function() {
    parser = new Parser();
  });

  it('string value', function() {
    var ast = parser.parse("id = string");
    should.not.exist(ast.body['id'].type);
    ast.body['id'].value.content.should.equal('string');
  });
  it('basic errors', function() {
    var strings = [
      "",
      "id",
      "id ",
      "id =",
      "+id",
      "=id",
    ];

    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      Object.keys(ast.body).length.should.equal(0);
    }
  });
  it('basic attributes', function() {
    var ast = parser.parse("id.attr1 = foo");
    ast.body['id'].attrs['attr1'].value.content.should.equal('foo');
  });
  it('plural macro', function() {
    var ast = parser.parse("id = {[ plural(m) ]} \nid[one] = foo");
    ast.body['id'].value.type.should.equal('Hash');
    ast.body['id'].value.content[0].type.should.equal('HashItem');
    ast.body['id'].value.content[0].value.content.should.equal('foo');
    ast.body['id'].index.length.should.equal(1);
    ast.body['id'].index[0].type.should.equal('CallExpression');
    ast.body['id'].index[0].callee.type.should.equal('Identifier');
    ast.body['id'].index[0].callee.name.should.equal('plural');
    ast.body['id'].index[0].arguments.length.should.equal(1);
    ast.body['id'].index[0].arguments[0].type.should.equal('Identifier');
    ast.body['id'].index[0].arguments[0].name.should.equal('m');
  });
  it('plural macro errors', function() {
    var strings = [
      'id = {[ plural(m) ] \nid[one] = foo',
      'id = {[ plural(m) \nid[one] = foo',
      'id = { plural(m) ]} \nid[one] = foo',
      'id = plural(m) ]} \nid[one] = foo',
      'id = {[ m ]} \nid[one] = foo',
      'id = {[ plural ]} \nid[one] = foo',
      'id = {[ plural() ]} \nid[one] = foo',
      'id = {[ plural(m ]} \nid[one] = foo',
      'id = {[ pluralm) ]} \nid[one] = foo',
      'id = {[ watch(m) ]} \nid[one] = foo',

    ];
    var errorsThrown = 0;
    parser.addEventListener('error', function() {
      errorsThrown += 1;
    });

    for (var i in strings) {
      var ast = parser.parse(strings[i]);
    } 
    errorsThrown.should.equal(strings.length);
  });
  it('comment', function() {
    var ast = parser.parse('#test');
    Object.keys(ast.body).length.should.equal(0);
  });
  it('comment errors', function() {
    var strings = [
      ' # foo',
      ' ## foo',
      'f# foo',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      Object.keys(ast.body).length.should.equal(0);
    }  
  });
  it('complex string', function() {
    var ast = parser.parse('test = test {{ var }} test2');
    ast.body['test'].value.content[0].content.should.equal('test ');
    ast.body['test'].value.content[1].name.should.equal('var');
    ast.body['test'].value.content[2].content.should.equal(' test2');

    var ast = parser.parse("test = test \\\" {{ var }} test2");
    ast.body['test'].value.content[0].content.should.equal('test " ');
    ast.body['test'].value.content[1].name.should.equal('var');
    ast.body['test'].value.content[2].content.should.equal(' test2');
  });
  it('complex string errors', function() {
    var strings = [
      ['test = test {{ var ', 'Expected "}}"'],
      ['test = test {{ var } ', 'Expected "}}"'],
      ['test = test {{ var } }', 'Expected "}}"'],
      ['test = test {{ var }} {{', 'Expected "}}"'],
      ['test = test {{ var }} {{}', 'Expected "}}"'],
      ['test = test {{ {{ }}', 'Expected "}}"'],
      ['test = test {{ {{ } }}', 'Expected "}}"'],
      ['test = test {{ {{ } }}}', 'Expected "}}"'],
      ['test = test {{{ }', 'Expected "}}"'],
    ];

    var errorsThrown = 0;
    parser.addEventListener('error', function() {
      errorsThrown += 1;
    });

    for (var i in strings) {
      var ast = parser.parse(strings[i][0]);
    }
    errorsThrown.should.equal(strings.length);
  });
});
