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
  it('basic errors', function() {
    var strings = [
      '< "str\\"ing">',
      '<>',
      '<id',
      '<id ',
      'id>',
      '<id "value>',
      '<id value">',
      '<id \'value>',
      '<id value\'',
      '<id\'value\'>',
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
  it('index', function() {
    //var ast = parser.parse("<id[]>");
    //ast.body.length.should.equal(1);
    //ast.body[0].index.length.should.equal(0);
    //var ast = parser.parse("<id[ ] >");
    var ast = parser.parse('<id["foo"] "foo2">');
    ast.body[0].index[0].content.should.equal('foo');
    ast.body[0].value.content.should.equal('foo2');

    ast = parser.parse('<id[2] "foo2">');
    ast.body[0].index[0].value.should.equal(2);
    ast.body[0].value.content.should.equal('foo2');

    ast = parser.parse('<id[2, "foo", 3] "foo2">');
    ast.body[0].index[0].value.should.equal(2);
    ast.body[0].index[1].content.should.equal('foo');
    ast.body[0].index[2].value.should.equal(3);
    ast.body[0].value.content.should.equal('foo2');
  });
  it('index errors', function() {
    var strings = [
      '<id[ "foo">',
      '<id] "foo">',
      '<id[ \'] "foo">',
      '<id{ ] "foo">',
      '<id[ } "foo">',
      '<id[" ] "["a"]>',
      '<id[a]["a"]>',
      '<id["foo""foo"] "fo">',
      '<id[a, b, ] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('macro', function() {
    var ast = parser.parse('<id($n) {2}>');
    ast.body.length.should.equal(1);
    ast.body[0].args.length.should.equal(1);
    ast.body[0].expression.value.should.equal(2);

    ast = parser.parse('<id( $n, $m, $a ) {2}  >');
    ast.body.length.should.equal(1);
    ast.body[0].args.length.should.equal(3);
    ast.body[0].expression.value.should.equal(2);
  });
  it('macro errors', function() {
    var strings = [
      '<id (n) {2}>',
      '<id ($n) {2}>',
      '<(n) {2}>',
      '<id(() {2}>',
      '<id()) {2}>',
      '<id[) {2}>',
      '<id(] {2}>',
      '<id(-) {2}>',
      '<id(2+2) {2}>',
      '<id("a") {2}>',
      '<id(\'a\') {2}>',
      '<id(2) {2}>',
      '<_id($n) {2}>',
      '<id($n) 2}>',
      '<id($n',
      '<id($n ',
      '<id($n)',
      '<id($n) ',
      '<id($n) {',
      '<id($n) { ',
      '<id($n) {2',
      '<id($n) {2}',
      '<id(nm nm) {2}>',
      '<id($n) {}>',
      '<id($n, $m ,) {2}>',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('comment', function() {
    var ast = parser.parse('/* test */');
    ast.body[0].content.should.equal(' test ');
  });
  it('comment errors', function() {
    var strings = [
      '/* foo ',
      'foo */',
      '<id /* test */ "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('identifier', function() {
    /*var ast = parser.parse('<id>');
    ast.body.length.should.equal(1);
    ast.body[0].id.name.should.equal('id');
    
    ast = parser.parse('<ID>');
    ast.body.length.should.equal(1);
    ast.body[0].id.name.should.equal('ID');*/
  });
  it('identifier errors', function() {
    var strings = [
      '<i`d "foo">',
      '<0d "foo">',
      '<09 "foo">',
      '<i!d "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });

  it('throwOnErrors', function() {
    var parser = new Parser(true);

    (function() {
      ast = parser.parse('<id<');
    }).should.throw('Expected white space at pos 3: "<id<"');

    var ast = parser.parse('<id "value"> <id2 "value2">');
    ast.body[1].value.content.should.equal('value2');
  });

  it('import', function() {
    var ast = parser.parse('import("./foo.lol")');
    ast.body[0].type.should.equal('ImportStatement');
    ast.body[0].uri.content.should.equal('./foo.lol');
  });
  it('import errors', function() {
    var strings = [
      '@import("foo.lol")',
      'import)(',
      'import(()',
      'import("foo.lol"]',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('addEventListener', function() {
    parser.addEventListener('change', function() {
    });

    (function() {
      var parser = new Parser(true);
      parser.addEventListener('change', function() {
      });
    }).should.throw('Emitter not available');
  });

  it('removeEventListener', function() {
    //parser.removeEventListener('change', function(ev) {
    //});

    (function() {
      var parser = new Parser(true);
      parser.removeEventListener('change', function() {
      });
    }).should.throw('Emitter not available');
  });
});

