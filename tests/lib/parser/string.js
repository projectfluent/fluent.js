var Parser = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/parser').Parser :
  require('../../../lib/l20n/parser').Parser;

describe('Example', function() {
  // Strict mode has to be disabled since it disallows access
  // to arguments objects of other functions.
  /* jshint strict: false */

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var parser;
  beforeEach(function() {
    parser = new Parser();
  });

  it('string value', function() {
    var ast = parser.parse('<id "">');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].value.type.should.equal('String');
    ast.body[0].value.content.should.equal('');

    ast = parser.parse('<id """""">');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].value.type.should.equal('String');
    ast.body[0].value.content.should.equal('');

    ast = parser.parse('<id \'string\'>');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].id.name.should.equal('id');
    ast.body[0].value.content.should.equal('string');

    ast = parser.parse('<id \'\'\'string\'\'\'>');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].id.name.should.equal('id');
    ast.body[0].value.content.should.equal('string');

    ast = parser.parse('<id """string""">');
    ast.body.length.should.equal(1);
    ast.body[0].type.should.equal('Entity');
    ast.body[0].id.name.should.equal('id');
    ast.body[0].value.content.should.equal('string');

  });
  it('complex string', function() {
    /* We want to use double quotes in those tests for readability */
    /* jshint -W109 */
    var ast = parser.parse('<id "test {{ var }} test2">');
    ast.body[0].value.content[0].content.should.equal('test ');
    ast.body[0].value.content[1].name.should.equal('var');
    ast.body[0].value.content[2].content.should.equal(' test2');

    ast = parser.parse('<id "test \\\" {{ var }} test2">');
    ast.body[0].value.content[0].content.should.equal('test " ');
    ast.body[0].value.content[1].name.should.equal('var');
    ast.body[0].value.content[2].content.should.equal(' test2');

    ast = parser.parse("<id 'test \\{{ var }} test2'>");
    ast.body[0].value.content.should.equal('test {{ var }} test2');
  });
  it('complex string errors', function() {
    var strings = [
      '<id "test {{ var ">',
      '<id "test {{ var \\}} ">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
});
