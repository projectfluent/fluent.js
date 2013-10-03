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

  it('hash value', function() {
    var ast = parser.parse('<id {a: "b", a2: "c", d: "d" }>');
    ast.body.length.should.equal(1);
    ast.body[0].value.content.length.should.equal(3);
    ast.body[0].value.content[0].value.content.should.equal('b');
    
    ast = parser.parse('<id {a: "2", b: "3"} >');
    ast.body.length.should.equal(1);
    ast.body[0].value.content.length.should.equal(2);
    ast.body[0].value.content[0].value.content.should.equal('2');
    ast.body[0].value.content[1].value.content.should.equal('3');
  });
  it('hash value with trailing comma', function() {
    var ast = parser.parse('<id {a: "2", b: "3", } >');
    ast.body.length.should.equal(1);
    ast.body[0].value.content.length.should.equal(2);
    ast.body[0].value.content[0].value.content.should.equal('2');
    ast.body[0].value.content[1].value.content.should.equal('3');
  });
  it('nested hash value', function() {
    var ast = parser.parse('<id {a: "foo", b: {a2: "p"}}>');
    ast.body.length.should.equal(1);
    ast.body[0].value.content.length.should.equal(2);
    ast.body[0].value.content[0].value.content.should.equal('foo');
    ast.body[0].value.content[1].value.content[0].key.name.should.equal('a2');
    ast.body[0].value.content[1].value.content[0].value.content.should.equal('p');
  });
  it('hash with default', function() {
    var ast = parser.parse('<id {a: "v", *b: "c"}>');
    ast.body[0].value.content[1].default.should.equal(true);
  });
  it('hash errors', function() {
    var strings = [
      '<id {}>',
      '<id {a: 2}>',
      '<id {a: "d">',
      '<id a: "d"}>',
      '<id {{a: "d"}>',
      '<id {a: "d"}}>',
      '<id {a:} "d"}>',
      '<id {2}>',
      '<id {"a": "foo"}>',
      '<id {"a": \'foo\'}>',
      '<id {2: "foo"}>',
      '<id {a:"foo"b:"foo"}>',
      '<id {a }>',
      '<id {a: 2, b , c: 3 } >',
      '<id {*a: "v", *b: "c"}>',
      '<id {}>',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
});
