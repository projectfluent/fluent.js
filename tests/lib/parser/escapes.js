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

  it('string value quotes', function() {
    /* We want to use double quotes in those tests for readability */
    /* jshint -W109 */
    var ast = parser.parse('<id "\\"">');
    ast.body[0].value.content.should.equal('"');

    ast = parser.parse("<id '\\''>");
    ast.body[0].value.content.should.equal("'");

    ast = parser.parse('<id """\\"\\"\\"""">');
    ast.body[0].value.content.should.equal('"""');

    ast = parser.parse('<id "str\\"ing">');
    ast.body[0].value.content.should.equal('str"ing');

    ast = parser.parse("<id 'str\\'ing'>");
    ast.body[0].value.content.should.equal("str'ing");

    ast = parser.parse('<id """str"ing""">');
    ast.body[0].value.content.should.equal('str"ing');

    ast = parser.parse('<id """str\'ing""">');
    ast.body[0].value.content.should.equal('str\'ing');

    ast = parser.parse("<id '''str\"ing'''>");
    ast.body[0].value.content.should.equal("str\"ing");

    ast = parser.parse('<id """"string\\"""">');
    ast.body[0].value.content.should.equal('"string"');

    ast = parser.parse("<id ''''string\\''''>");
    ast.body[0].value.content.should.equal("'string'");

    ast = parser.parse("<id 'test \\{{ more'>");
    ast.body[0].value.content.should.equal("test {{ more");

    ast = parser.parse('<id "test \\{{ \\\"more\\\" }}">');
    ast.body[0].value.content.should.equal("test {{ \"more\" }}");

    ast = parser.parse('<id "test \\\\{{ \"more\" }}">');
    ast.body[0].value.content[1].content.should.equal("more");

    ast = parser.parse('<id "test \\\\\\{{ \\"more\\" }}">');
    ast.body[0].value.content.should.equal("test \\{{ \"more\" }}");

    ast = parser.parse('<id "test \\\\\\{{ \\"more\\" }}\\\\">');
    ast.body[0].value.content.should.equal("test \\{{ \"more\" }}\\");

    ast = parser.parse("<id 'test \\\\ more'>");
    ast.body[0].value.content.should.equal("test \\ more");

    ast = parser.parse("<id 'test \\a more'>");
    ast.body[0].value.content.should.equal("test a more");

    ast = parser.parse("<id 'test more\\\\'>");
    ast.body[0].value.content.should.equal("test more\\");

    ast = parser.parse("<id 'test more\\\\\\''>");
    ast.body[0].value.content.should.equal("test more\\'");

    ast = parser.parse("<id '\\'test more'>");
    ast.body[0].value.content.should.equal("'test more");

    ast = parser.parse('<id " \\\\">');
    ast.body[0].value.content.should.equal(' \\');
  });
  it('unescape unicode', function() {
    /* We want to use double quotes in those tests for readability */
    /* jshint -W109 */
    var ast = parser.parse("<id 'string \\ua0a0 foo'>");
    ast.body[0].value.content.should.equal('string ꂠ foo');

    ast = parser.parse("<id 'string \\ua0a0 {{ foo }} foo \\ua0a0'>");
    ast.body[0].value.content[0].content.should.equal('string ꂠ ');
    ast.body[0].value.content[2].content.should.equal(' foo ꂠ');
  });

  it('nested strings', function() {
    var ast = parser.parse('<id "{{ "Foo" }}">');
    ast.body[0].value.content[0].type.should.equal('String');

    ast = parser.parse('<id "{{ "{{ bar }}" }}">');
    ast.body[0].value.content[0].type.should.equal('ComplexString');
    ast.body[0].value.content[0].content[0].type.should.equal('Identifier');

    ast = parser.parse('<id "{{ "{{ \'Foo\' }}" }}">');
    ast.body[0].value.content[0].type.should.equal('ComplexString');
    ast.body[0].value.content[0].content[0].type.should.equal('String');

    ast = parser.parse('<id "{{ "{{ "Foo" }}" }}">');
    ast.body[0].value.content[0].type.should.equal('ComplexString');
    ast.body[0].value.content[0].content[0].type.should.equal('String');

    ast = parser.parse('<id "{{ "{{ "{{ bar }}" }}" }}">');
    ast.body[0].value.content[0].type.should.equal('ComplexString');
    ast.body[0].value.content[0].content[0].type.should.equal('ComplexString');
    ast.body[0].value.content[0].content[0].content[0].type.should.equal('Identifier');

    ast = parser.parse('<id """ \
      {{ "{{ \'Foo\' }}" }} \
    """>');
    ast.body[0].value.content[1].type.should.equal('ComplexString');
    ast.body[0].value.content[1].content[0].type.should.equal('String');
  });
});
describe('Errors', function() {
  // Strict mode has to be disabled since it disallows access
  // to arguments objects of other functions.
  /* jshint strict: false */

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */
  var parser;
  beforeEach(function() {
    parser = new Parser(true);
  });
  it('unescaped identifier in placeable', function() {
    (function() {
      parser.parse('<id "{{ \\"Foo\\" }}">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('unescaped identifier in placeable, nested', function() {
    (function() {
      parser.parse('<id "{{ \\"{{ bar }}\\" }}">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('unescaped identifier in placeable, nested x2', function() {
    (function() {
      parser.parse('<id "{{ \\"{{ \'Foo\' }}\\" }}">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('unescaped identifier in placeable, nested x2', function() {
    (function() {
      parser.parse('<id "{{ \\"{{ \\"Foo\\" }}\\" }}">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('unescaped identifier in placeable, nested x3', function() {
    (function() {
      parser.parse('<id "{{ \\"{{ \'{{ bar }}\' }}\\" }}">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('unescaped string in escaped placeable', function() {
    (function() {
      parser.parse('<id " da \\{{ "foo" }}">');
    }).should.throw(/Expected ">"*/i);
  });
  it('double escaped placeable', function() {
    (function() {
      parser.parse('<id "\\\\{{ \\"foo\\" }}">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('triple escaped placeable', function() {
    (function() {
      parser.parse('<id "\\\\\\{{ "foo" }}">');
    }).should.throw(/Expected ">"*/i);
  });
  it('triple escaped placeable with escaped backslash at the end', function() {
    (function() {
      parser.parse('<id "\\\\\\{{ "foo" }}\\">');
    }).should.throw(/Expected ">"*/i);
  });
});
