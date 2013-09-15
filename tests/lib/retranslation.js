var Parser = require('../../lib/l20n/parser').Parser;
var Compiler = require('../../lib/l20n/compiler').Compiler;
var RetranslationManager = require('../../lib/l20n/retranslation').RetranslationManager;
var Global = require('../../lib/l20n/platform/globals').Global;

var parser = new Parser(true);
var compiler = new Compiler();

function OneGlobal() {
  'use strict';
  Global.call(this);
  this.id = 'one';
  this._get = function _get() {
    return 1;
  };
}

OneGlobal.prototype = Object.create(Global.prototype);
OneGlobal.prototype.constructor = OneGlobal;

describe('Default globals', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var source, ast, env, retr;
  beforeEach(function() {
    source = '                                                                \
      <hour "{{ @hour }}">                                                    \
      <one "{{ @one }}">                                                      \
    ';
    ast = parser.parse(source);
    env = compiler.compile(ast);
    retr = new RetranslationManager();
    compiler.setGlobals(retr.globals);
  });

  // in node, only @hour is defined
  it('@hour should be registered', function() {
    (function(){
      env.hour.getString();
    }).should.not.throw();
  });
  it('should throw when trying to use @one', function() {
    (function(){
      env.one.getString();
    }).should.throw(/unknown global/);
  });
});

describe('Custom globals', function() {
  'use strict';
  /* jshint -W068 */

  var source, ast, env, retr;

  before(function() {
    RetranslationManager.registerGlobal(OneGlobal);
  });
  after(function() {
    RetranslationManager.deregisterGlobal(OneGlobal);
  });

  beforeEach(function() {
    source = '                                                                \
      <hour "{{ @hour }}">                                                    \
      <one "{{ @one }}">                                                      \
    ';
    ast = parser.parse(source);
    env = compiler.compile(ast);
    retr = new RetranslationManager();
    compiler.setGlobals(retr.globals);
  });

  // in node, only @hour is defined
  it('@hour should be registered', function() {
    (function(){
      env.hour.getString();
    }).should.not.throw();
  });
  it('@one should be registered', function() {
    (function(){
      env.one.getString();
    }).should.not.throw();
  });
});
