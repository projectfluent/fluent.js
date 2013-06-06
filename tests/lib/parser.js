var should = require('should');
var Parser = process.env.L20N_COV
  ? require('../../build/cov/lib/l20n/parser').Parser
  : require('../../lib/l20n/parser').Parser;

describe('Example', function() {
  var parser;
  beforeEach(function() {
    parser = new Parser();
  });

  it('empty entity', function() {
    var ast = parser.parse('<id>');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('JunkEntry');
  });
  it('empty entity with white space', function() {
    var ast = parser.parse('<id >');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('JunkEntry');
  });
  it('string value', function() {
    var ast = parser.parse("<id 'string'>");
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].id.name.should.equal('id');
    ast.body[0].value.content.should.equal('string');

    var ast = parser.parse('<id "string">');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].id.name.should.equal('id');
    ast.body[0].value.content.should.equal('string');

    var ast = parser.parse("<id '''string'''>");
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].id.name.should.equal('id');
    ast.body[0].value.content.should.equal('string');

    var ast = parser.parse('<id """string""">');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].id.name.should.equal('id');
    ast.body[0].value.content.should.equal('string');
  });
  it.skip('string value quotes', function() {
    var ast = parser.parse('<id "str\\"ing">');
    ast.body[0].value.content.should.equal('str"ing');

    var ast = parser.parse("<id 'str\\'ing'>");
    ast.body[0].value.content.should.equal("str'ing");

    var ast = parser.parse('<id """str"ing""">');
    ast.body[0].value.content.should.equal('str"ing');

    var ast = parser.parse("<id '''str'ing'''>");
    ast.body[0].value.content.should.equal("str'ing");

    var ast = parser.parse('<id """"string\\"""">');
    ast.body[0].value.content.should.equal('"string"');

    var ast = parser.parse("<id ''''string\\''''>");
    ast.body[0].value.content.should.equal("'string'");

    var ast = parser.parse("<id 'test \{{ more'>");
    ast.body[0].value.content.should.equal("test {{ more");

    var ast = parser.parse("<id 'test \\\\ more'>");
    ast.body[0].value.content.should.equal("test \ more");

    var ast = parser.parse("<id 'test \\a more'>");
    ast.body[0].value.content.should.equal("test \\a more");
  });
  it('basic errors', function() {
    var strings = [
      '< "str\\"ing">',
      "<>",
      "<id",
      "id>",
      '<id "value>',
      '<id value">',
      "<id 'value>",
      "<id value'",
      "<id'value'>",
      '<id"value">',
      '<id """value"""">',
      '< id "value">',
      '<()>',
      '<+s>',
      '<id-id2>',
      '<-id>',
      '<id 2>',
      '<"id">',
      '<\'id\'>',
      '<2>',
      '<09>',
    ];

    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('basic attributes', function() {
    var ast = parser.parse("<id attr1: 'foo'>");
    ast.body[0].attrs.length.should.equal(1);
    ast.body[0].attrs[0].key.name.should.equal('attr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');

    ast = parser.parse("<id attr1: 'foo' attr2: 'foo2'    >");
    ast.body[0].attrs.length.should.equal(2);
    ast.body[0].attrs[0].key.name.should.equal('attr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');

    ast = parser.parse("<id attr1: 'foo' attr2: 'foo2' attr3: 'foo3' >");
    ast.body[0].attrs.length.should.equal(3);
    ast.body[0].attrs[0].key.name.should.equal('attr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');
    ast.body[0].attrs[1].key.name.should.equal('attr2');
    ast.body[0].attrs[1].value.content.should.equal('foo2');
    ast.body[0].attrs[2].key.name.should.equal('attr3');
    ast.body[0].attrs[2].value.content.should.equal('foo3');
  });
  it('attributes with indexes', function() {
    var ast = parser.parse("<id attr[2]: 'foo'>");
    ast.body[0].attrs[0].index[0].value.should.equal(2);

    ast = parser.parse("<id attr[2+3?'foo':'foo2']: 'foo'>");
    ast.body[0].attrs[0].index[0].test.left.value.should.equal(2);
    ast.body[0].attrs[0].index[0].test.right.value.should.equal(3);

    ast = parser.parse("<id attr[2, 3]: 'foo'>");
    ast.body[0].attrs[0].index[0].value.should.equal(2);
    ast.body[0].attrs[0].index[1].value.should.equal(3);
  });
  it('atribute errors', function() {
    var strings = [
      '<id : "foo">',
      "<id 2: >",
      "<id a: >",
      "<id: ''>",
      "<id a: b:>",
      "<id a: 'foo' 'heh'>",
      "<id a: 2>",
      "<id 'a': 'a'>",
      "<id \"a\": 'a'>",
      "<id 2: 'a'>",
      "<id a2:'a'a3:'v'>", 
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('hash value', function() {
    var ast = parser.parse("<id {}>");
    ast.body.length.should.equal(1);
    ast.body[0].value.content.length.should.equal(0);
    
    var ast = parser.parse("<id {a: 'b', a2: 'c', d: 'd' }>");
    ast.body.length.should.equal(1);
    ast.body[0].value.content.length.should.equal(3);
    ast.body[0].value.content[0].value.content.should.equal('b');
    
    var ast = parser.parse("<id {a: '2', b: '3'} >");
    ast.body.length.should.equal(1);
    ast.body[0].value.content.length.should.equal(2);
    ast.body[0].value.content[0].value.content.should.equal('2');
    ast.body[0].value.content[1].value.content.should.equal('3');
  });
  describe('detecting non-complex (simple) strings', function() {
    it('should return not-complex for simple strings', function() {
      var ast = parser.parse("<id 'string'>");
      ast.body[0].value.should.have.property('isNotComplex', true);
    });
    it('should return maybe-complex for complex strings', function() {
      var ast = parser.parse("<id '{{ reference }}'>");
      should.not.exist(ast.body[0].value.isNotComplex);
    });
    it('should return maybe-complex for simple strings with braces escaped', function() {
      var ast = parser.parse("<id '\\{{ string }}'>");
      should.not.exist(ast.body[0].value.isNotComplex);

      var ast = parser.parse("<id '\\\\{{ string }}'>");
      should.not.exist(ast.body[0].value.isNotComplex);
    });
    it('should return not-complex for simple strings with braces not next to each other', function() {
      var ast = parser.parse("<id '{a{ string }}'>");
      ast.body[0].value.should.have.property('isNotComplex', true);

      var ast = parser.parse("<id '{\\{ string }}'>");
      ast.body[0].value.should.have.property('isNotComplex', true);

      var ast = parser.parse("<id '{\\\\{ string }}'>");
      ast.body[0].value.should.have.property('isNotComplex', true);
    });
  });
});
