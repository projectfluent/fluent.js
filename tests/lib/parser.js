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
});
