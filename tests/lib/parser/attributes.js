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

  it('basic attributes', function() {
    var ast = parser.parse('<id attr1: "foo">');
    ast.body[0].attrs.length.should.equal(1);
    ast.body[0].attrs[0].key.name.should.equal('attr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');

    ast = parser.parse('<id attr1: "foo" attr2: "foo2"    >');
    ast.body[0].attrs.length.should.equal(2);
    ast.body[0].attrs[0].key.name.should.equal('attr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');

    ast = parser.parse('<id attr1: "foo" attr2: "foo2" attr3: "foo3" >');
    ast.body[0].attrs.length.should.equal(3);
    ast.body[0].attrs[0].key.name.should.equal('attr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');
    ast.body[0].attrs[1].key.name.should.equal('attr2');
    ast.body[0].attrs[1].value.content.should.equal('foo2');
    ast.body[0].attrs[2].key.name.should.equal('attr3');
    ast.body[0].attrs[2].value.content.should.equal('foo3');

    ast = parser.parse('<id "value" attr1: "foo">');
    ast.body[0].value.content.should.equal('value');
    ast.body[0].attrs[0].key.name.should.equal('attr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');

  });
  it('camelCase attributes', function() {
    var ast = parser.parse('<id "value" atTr1: "foo">');
    ast.body[0].value.content.should.equal('value');
    ast.body[0].attrs[0].key.name.should.equal('atTr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');

    ast = parser.parse('<id atTr1: "foo">');
    ast.body[0].attrs[0].key.name.should.equal('atTr1');
    ast.body[0].attrs[0].value.content.should.equal('foo');
  });
  it('attributes with indexes', function() {
    var ast = parser.parse('<id attr[2]: "foo">');
    ast.body[0].attrs[0].index[0].value.should.equal(2);

    ast = parser.parse('<id attr[2+3?"foo":"foo2"]: "foo">');
    ast.body[0].attrs[0].index[0].test.left.value.should.equal(2);
    ast.body[0].attrs[0].index[0].test.right.value.should.equal(3);

    ast = parser.parse('<id attr[2, 3]: "foo">');
    ast.body[0].attrs[0].index[0].value.should.equal(2);
    ast.body[0].attrs[0].index[1].value.should.equal(3);
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
  it('missing attribute id error', function() {
    (function() {
      parser.parse('<id : "foo">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('attribute id starting with an integer', function() {
    (function() {
      parser.parse('<id 2: >');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('attribute with no value', function() {
    (function() {
      parser.parse('<id a: >');
    }).should.throw(/Unknown value type*/i);
  });
  it('mistaken entity id for attribute id', function() {
    (function() {
      parser.parse('<id: "">');
    }).should.throw(/Expected white space*/i);
  });
  it('attribute with no value', function() {
    (function() {
      parser.parse('<id a: b:>');
    }).should.throw(/Unknown value type*/i);
  });
  it('follow up attribute with no id', function() {
    (function() {
      parser.parse('<id a: "foo" "heh">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('integer value', function() {
    (function() {
      parser.parse('<id a: 2>');
    }).should.throw(/Unknown value type*/i);
  });
  it('string as id', function() {
    (function() {
      parser.parse('<id "a": "a">');
    }).should.throw(/Expected ">"*/i);
  });
  it('string as id', function() {
    (function() {
      parser.parse('<id "a": \'a\'>');
    }).should.throw(/Expected ">"*/i);
  });
  it('integer id', function() {
    (function() {
      parser.parse('<id 2: "a">');
    }).should.throw(/Identifier has to start with [a-zA-Z_]*/i);
  });
  it('no white space between attributes', function() {
    (function() {
      parser.parse('<id a2:"a"a3:"v">');
    }).should.throw(/Expected ">"*/i);
  });
});
