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
      var ast = parser.parse(strings[i]);
      Object.keys(ast).length.should.equal(0);
    }
  });
  it('basic attributes', function() {
    var ast = parser.parse("id.attr1 = foo");
    ast['id']['attr1'].should.equal('foo');
  });
  it('plural macro', function() {
    var ast = parser.parse("id = {[ plural(m) ]} \nid[one] = foo");
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
    parser._emitter.addEventListener('error', function() {
      errorsThrown += 1;
    });

    for (var i in strings) {
      var ast = parser.parse(strings[i]);
    } 
    errorsThrown.should.equal(strings.length);
  });
  it('comment', function() {
    var ast = parser.parse('#test');
    Object.keys(ast).length.should.equal(0);
  });
  it('comment errors', function() {
    var strings = [
      ' # foo',
      ' ## foo',
      'f# foo',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      Object.keys(ast).length.should.equal(0);
    }  
  });
});
