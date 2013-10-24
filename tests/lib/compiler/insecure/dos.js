var Parser = require('../../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV ?
  require('../../../../build/cov/lib/l20n/compiler').Compiler :
  require('../../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

// Bug 803931 - Compiler is vulnerable to the billion laughs attack
describe('Reference bombs', function() {
  'use strict';
  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.compile(ast);
  });

  describe('Billion Laughs', function(){
    before(function() {
      source = '                                                              \
        <lol0 "LOL">                                                          \
        <lol1 "{{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}}"> \
        <lol2 "{{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}}"> \
        <lol3 "{{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}}"> \
        <lol4 "{{lol3}} {{lol3}} {{lol3}} {{lol3}} {{lol3}} {{lol3}} {{lol3}} {{lol3}} {{lol3}} {{lol3}}"> \
        <lol5 "{{lol4}} {{lol4}} {{lol4}} {{lol4}} {{lol4}} {{lol4}} {{lol4}} {{lol4}} {{lol4}} {{lol4}}"> \
        <lol6 "{{lol5}} {{lol5}} {{lol5}} {{lol5}} {{lol5}} {{lol5}} {{lol5}} {{lol5}} {{lol5}} {{lol5}}"> \
        <lol7 "{{lol6}} {{lol6}} {{lol6}} {{lol6}} {{lol6}} {{lol6}} {{lol6}} {{lol6}} {{lol6}} {{lol6}}"> \
        <lol8 "{{lol7}} {{lol7}} {{lol7}} {{lol7}} {{lol7}} {{lol7}} {{lol7}} {{lol7}} {{lol7}} {{lol7}}"> \
        <lol9 "{{lol8}} {{lol8}} {{lol8}} {{lol8}} {{lol8}} {{lol8}} {{lol8}} {{lol8}} {{lol8}} {{lol8}}"> \
        <lolz "{{ lol9 }}">                                                   \
      ';
    });
    it('throws', function() {
      function brokenFun() {
        env.lolz.getString();
      }
      brokenFun.should.throw(/too many characters/);
    });
  });
});
