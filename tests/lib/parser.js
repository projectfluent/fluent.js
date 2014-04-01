var should = require('should');

var parse = process.env.L20N_COV
  ? require('../../build/cov/lib/l20n/parser').parse.bind(null, null)
  : require('../../lib/l20n/parser').parse.bind(null,null);

describe('Example', function() {
  it('string value', function() {
    var ast = parse("id = string");
    should.not.exist(ast['id'].type);
    ast['id'].should.equal('string');
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
      var ast = parse(strings[i]);
      Object.keys(ast).length.should.equal(0);
    }
  });
  it('basic attributes', function() {
    var ast = parse("id.attr1 = foo");
    ast['id']['attr1'].should.equal('foo');
  });
  it('plural macro', function() {
    var ast = parse("id = {[ plural(m) ]} \nid[one] = foo");
    ast['id']['_'].should.be.an.instanceOf(Object);
    ast['id']['_']['one'].should.equal('foo');
    ast['id']['_index'].length.should.equal(2);
    ast['id']['_index'][0].should.equal('plural');
    ast['id']['_index'][1].should.equal('m');
  });
  it.skip('plural macro errors', function() {
    var strings = [
      'id = {[ plural(m) ] \nid[one] = foo',
      'id = {[ plural(m) \nid[one] = foo',
      'id = { plural(m) ]} \nid[one] = foo',
      'id = plural(m) ]} \nid[one] = foo',
      'id = {[ m ]} \nid[one] = foo',
      'id = {[ plural ]} \nid[one] = foo',
      'id = {[ plural(m ]} \nid[one] = foo',
      'id = {[ pluralm) ]} \nid[one] = foo',

    ];
    var errorsThrown = 0;

    for (var i in strings) {
      try {
        parse(strings[i]);
      } catch (e) {
        errorsThrown += 1;
      }
    } 
    errorsThrown.should.equal(strings.length);
  });
  it('comment', function() {
    var ast = parse('#test');
    Object.keys(ast).length.should.equal(0);
  });
  it('comment errors', function() {
    var strings = [
      ' # foo',
      ' ## foo',
      'f# foo',
    ];
    for (var i in strings) {
      var ast = parse(strings[i]);
      Object.keys(ast).length.should.equal(0);
    }  
  });
});
