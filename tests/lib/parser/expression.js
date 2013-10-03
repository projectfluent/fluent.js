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
  it('expression', function() {
    var ast = parser.parse('<id[0 == 1 || 1] "foo">');
    ast.body[0].index[0].operator.token.should.equal('||');
    ast.body[0].index[0].left.operator.token.should.equal('==');

    ast = parser.parse('<id[a == b == c] "foo">');
    ast.body[0].index[0].operator.token.should.equal('==');
    ast.body[0].index[0].left.operator.token.should.equal('==');

    ast = parser.parse('<id[ a == b || c == d || e == f ] "foo"  >');
    ast.body[0].index[0].operator.token.should.equal('||');
    ast.body[0].index[0].left.operator.token.should.equal('||');
    ast.body[0].index[0].right.operator.token.should.equal('==');

    ast = parser.parse('<id[0 && 1 || 1] "foo">');
    ast.body[0].index[0].operator.token.should.equal('||');
    ast.body[0].index[0].left.operator.token.should.equal('&&');

    ast = parser.parse('<id[0 && (1 || 1)] "foo">');
    ast.body[0].index[0].operator.token.should.equal('&&');
    ast.body[0].index[0].right.expression.operator.token.should.equal('||');

    ast = parser.parse('<id[1 || 1 && 0] "foo">');
    ast.body[0].index[0].operator.token.should.equal('||');
    ast.body[0].index[0].right.operator.token.should.equal('&&');

    ast = parser.parse('<id[1 + 2] "foo">');
    ast.body[0].index[0].operator.token.should.equal('+');
    ast.body[0].index[0].left.value.should.equal(1);
    ast.body[0].index[0].right.value.should.equal(2);

    ast = parser.parse('<id[1 + 2 - 3 > 4 < 5 <= a >= "d" * 3 / q % 10] "foo">');
    ast.body[0].index[0].operator.token.should.equal('>=');

    ast = parser.parse('<id[! +1] "foo">');
    ast.body[0].index[0].operator.token.should.equal('!');
    ast.body[0].index[0].argument.operator.token.should.equal('+');
    ast.body[0].index[0].argument.argument.value.should.equal(1);

    ast = parser.parse('<id[1+2] "foo">');
    ast.body[0].index[0].operator.token.should.equal('+');
    ast.body[0].index[0].left.value.should.equal(1);
    ast.body[0].index[0].right.value.should.equal(2);

    ast = parser.parse('<id[(1+2)] "foo">');
    ast.body[0].index[0].expression.operator.token.should.equal('+');
    ast.body[0].index[0].expression.left.value.should.equal(1);
    ast.body[0].index[0].expression.right.value.should.equal(2);

    ast = parser.parse('<id[id2["foo"]] "foo2">');
    ast.body.length.should.equal(1);
    ast.body[0].value.content.should.equal('foo2');
    ast.body[0].index[0].expression.name.should.equal('id2');
    ast.body[0].index[0].property.content.should.equal('foo');

    ast = parser.parse('<id[id["foo"]] "foo">');
    //ast = parser.parse('<id[id["foo"]]>');
    ast.body.length.should.equal(1);
    //ast.body[0].value.should.be(null);
    ast.body[0].index[0].expression.name.should.equal('id');
    ast.body[0].index[0].property.content.should.equal('foo');
  });
  it('expression errors', function() {
    var strings = [
      '<id[1+()] "foo">',
      '<id[1<>2] "foo">',
      '<id[1+=2] "foo">',
      '<id[>2] "foo">',
      '<id[1==] "foo">',
      '<id[1+ "foo">',
      '<id[2==1+] "foo">',
      '<id[2==3+4 "fpp">',
      '<id[2==3+ "foo">',
      '<id[2>>2] "foo">',
      '<id[1 ? 2 3] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('logical expression', function() {
    var ast = parser.parse('<id[0 || 1] "foo">');
    ast.body[0].index[0].operator.token.should.equal('||');
    ast.body[0].index[0].left.value.should.equal(0);
    ast.body[0].index[0].right.value.should.equal(1);

    ast = parser.parse('<id[0 || 1 && 2 || 3] "foo">');
    ast.body[0].index[0].operator.token.should.equal('||');
    ast.body[0].index[0].left.operator.token.should.equal('||');
    ast.body[0].index[0].right.value.should.equal(3);
    ast.body[0].index[0].left.left.value.should.equal(0);
    ast.body[0].index[0].left.right.left.value.should.equal(1);
    ast.body[0].index[0].left.right.right.value.should.equal(2);
    ast.body[0].index[0].left.right.operator.token.should.equal('&&');
  });
  it('logical expression errors', function() {
    var strings = [
      '<id[0 || && 1] "foo">',
      '<id[0 | 1] "foo">',
      '<id[0 & 1] "foo">',
      '<id[|| 1] "foo">',
      '<id[0 ||] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('binary expression', function() {
    var ast = parser.parse('<id[a / b * c] "foo">');
    ast.body[0].index[0].operator.token.should.equal('*');
    ast.body[0].index[0].left.operator.token.should.equal('/');

    ast = parser.parse('<id[8 * 9 % 11] "foo">');
    ast.body[0].index[0].operator.token.should.equal('%');
    ast.body[0].index[0].left.operator.token.should.equal('*');

    ast = parser.parse('<id[6 + 7 - 8 * 9 / 10 % 11] "foo">');
    ast.body[0].index[0].operator.token.should.equal('-');
    ast.body[0].index[0].left.operator.token.should.equal('+');
    ast.body[0].index[0].right.operator.token.should.equal('%');

    ast = parser.parse('<id[0 == 1 != 2 > 3 < 4 >= 5 <= 6 + 7 - 8 * 9 / 10 % 11] "foo">');
    ast.body[0].index[0].operator.token.should.equal('!=');
    ast.body[0].index[0].left.operator.token.should.equal('==');
    ast.body[0].index[0].right.operator.token.should.equal('<=');

  });
  it('binary expression errors', function() {
    var strings = [
      '<id[1 \\ 2] "foo">',
      '<id[1 ** 2] "foo">',
      '<id[1 * / 2] "foo">',
      '<id[1 !> 2] "foo">',
      '<id[1 <* 2] "foo">',
      '<id[1 += 2] "foo">',
      '<id[1 %= 2] "foo">',
      '<id[1 ^ 2] "foo">',
      '<id 2 < 3 "foo">',
      '<id 2 > 3 "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('unary expression', function() {
    var ast = parser.parse('<id[! + - 1] "foo">');
    ast.body[0].index[0].operator.token.should.equal('!');
    ast.body[0].index[0].argument.operator.token.should.equal('+');
    ast.body[0].index[0].argument.argument.operator.token.should.equal('-');
  });
  it('unary expression errors', function() {
    var strings = [
      '<id[a ! v] "foo">',
      '<id[!] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('call expression', function() {
    var ast = parser.parse('<id[foo()] "foo">');
    ast.body[0].index[0].callee.name.should.equal('foo');
    ast.body[0].index[0].arguments.length.should.equal(0);

    ast = parser.parse('<id[foo(d, e, f, g)] "foo">');
    ast.body[0].index[0].callee.name.should.equal('foo');
    ast.body[0].index[0].arguments.length.should.equal(4);
    ast.body[0].index[0].arguments[0].name.should.equal('d');
    ast.body[0].index[0].arguments[1].name.should.equal('e');
    ast.body[0].index[0].arguments[2].name.should.equal('f');
    ast.body[0].index[0].arguments[3].name.should.equal('g');
  });
  it('call expression errors', function() {
    var strings = [
      '<id[1+()] "foo">',
      '<id[foo(fo fo)] "foo">',
      '<id[foo(()] "foo">',
      '<id[foo(())] "foo">',
      '<id[foo())] "foo">',
      '<id[foo("ff)] "foo">',
      '<id[foo(ff")] "foo">',
      '<id[foo(a, b, )] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('member expression', function() {
    var ast = parser.parse('<id[x["d"]] "foo">');
    ast.body[0].index[0].expression.name.should.equal('x');
    ast.body[0].index[0].property.content.should.equal('d');

    ast = parser.parse('<id[x.d] "foo">');
    ast.body[0].index[0].expression.name.should.equal('x');
    ast.body[0].index[0].property.name.should.equal('d');

    ast = parser.parse('<id[a||b.c] "foo">');
    ast.body[0].index[0].operator.token.should.equal('||');
    ast.body[0].index[0].right.expression.name.should.equal('b');

    parser.parse('<id[ x.d ] "foo" >');
    parser.parse('<id[ x[ "d" ] ] "foo" >');
    parser.parse('<id[ x["d"] ] "foo" >');
    parser.parse('<id[x["d"]["e"]] "foo" >');
    parser.parse('<id[! (a?b:c)["d"]["e"]] "foo" >');
  });
  it('member expression errors', function() {
    var strings = [
      '<id[x[[]] "foo">',
      '<id[x[] "foo">',
      '<id[x[1 "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('attribute expression', function() {
    var ast = parser.parse('<id[x::["d"]] "foo">');
    ast.body[0].index[0].expression.name.should.equal('x');
    ast.body[0].index[0].attribute.content.should.equal('d');

    ast = parser.parse('<id[x::d] "foo">');
    ast.body[0].index[0].expression.name.should.equal('x');
    ast.body[0].index[0].attribute.name.should.equal('d');
  });
  it('attribute expression errors', function() {
    var strings = [
      '<id[x:::d] "foo">',
      '<id[x[::"d"]] "foo">',
      '<id[x[::::d]] "foo">',
      '<id[x:::[d]] "foo">',
      '<id[x.y::z] "foo">',
      '<id[x::y::z] "foo">',
      '<id[x.y::["z"]] "foo">',
      '<id[x::y::["z"]] "foo">',
      '<id[x::[1 "foo">',
      '<id[x()::attr1] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('parenthesis expression', function() {
    var ast = parser.parse('<id[(1 + 2) * 3] "foo">');
    ast.body[0].index[0].operator.token.should.equal('*');
    ast.body[0].index[0].left.expression.operator.token.should.equal('+');

    ast = parser.parse('<id[(1) + ((2))] "foo">');
    ast.body[0].index[0].operator.token.should.equal('+');
    ast.body[0].index[0].right.expression.expression.value.should.equal(2);

    ast = parser.parse('<id[(a||b).c] "foo">');
    ast.body[0].index[0].expression.expression.operator.token.should.equal('||');
    ast.body[0].index[0].property.name.should.equal('c');

    ast = parser.parse('<id[!(a||b).c] "foo">');
    ast.body[0].index[0].operator.token.should.equal('!');
    ast.body[0].index[0].argument.expression.expression.operator.token.should.equal('||');
    ast.body[0].index[0].argument.property.name.should.equal('c');

    ast = parser.parse('<id[a().c] "foo">');
    ast.body[0].index[0].expression.callee.name.should.equal('a');
    ast.body[0].index[0].property.name.should.equal('c');
  });
  it('parenthesis expression errors', function() {
    var strings = [
      '<id[1+()] "foo">',
      '<id[(+)*(-)] "foo">',
      '<id[(!)] "foo">',
      '<id[(())] "foo">',
      '<id[(] "foo">',
      '<id[)] "foo">',
      '<id[1+(2] "foo">',
      '<id[a().c.[d]()] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('primary expression', function() {
    var ast = parser.parse('<id[$foo] "foo">');
    ast.body[0].index[0].id.name.should.equal('foo');

    ast = parser.parse('<id[@foo] "foo">');
    ast.body[0].index[0].id.name.should.equal('foo');

    ast = parser.parse('<id[~] "foo">');
    ast.body[0].index[0].type.should.equal('ThisExpression');
  });
  it('literal expression', function() {
    var ast = parser.parse('<id[012] "foo">');
    ast.body[0].index[0].value.should.equal(12);
  });
  it('literal expression errors', function() {
    var strings = [
      '<id[012x1] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
  it('value expression', function() {
    var ast = parser.parse('<id["foo"] "foo">');
    ast.body[0].index[0].content.should.equal('foo');

    ast = parser.parse('<id[{a: "foo", b: "foo2"}] "foo">');
    ast.body[0].index[0].content[0].value.content.should.equal('foo');
    ast.body[0].index[0].content[1].value.content.should.equal('foo2');
  });
  it('value expression errors', function() {
    var strings = [
      '<id[[0, 1]] "foo">',
      '<id["foo] "foo">',
      '<id[foo"] "foo">',
      '<id[["foo]] "foo">',
      '<id[{"a": "foo"}] "foo">',
      '<id[{a: 0}] "foo">',
      '<id[{a: "foo"] "foo">',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      ast.body[0].type.should.equal('JunkEntry');
    }
  });
});
