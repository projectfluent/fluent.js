var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Expressions', function(){
  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.compile(ast);
  });

  describe('maths', function(){
    before(function() {
      source = '                                                              \
        <double($n) { $n + $n }>                                              \
        <quadruple($n) { double(double($n)) }>                                \
        <fib($n) { $n == 0 ?                                                  \
                     0 :                                                      \
                     $n == 1 ?                                                \
                       1 :                                                    \
                       fib($n - 1) + fib($n - 2) }>                           \
        <fac($n) { $n == 0 ?                                                  \
                     1 :                                                      \
                     $n * fac($n - 1) }>                                      \
      ';
    });
    it('doubles', function() {
      // args are passed as [locals, value] tuple
      var value = env.double._call([[null, 3]]);
      value[1].should.equal(6);
    });
    it('quadruples', function() {
      var value = env.quadruple._call([[null, 3]]);
      value[1].should.equal(12);
    });
    it('calculates the nth Fibonacci number', function() {
      var value = env.fib._call([[null, 12]]);
      value[1].should.equal(144);
    });
    it('calculates the factorial', function() {
      var value = env.fac._call([[null, 5]]);
      value[1].should.equal(120);
    });
  });

  describe('plural', function(){
    before(function() {
      source = '                                                              \
        <plural($n) {                                                         \
          $n == 0 ? "zero" :                                                  \
            $n == 1 ? "one" :                                                 \
              $n % 10 >= 2 &&                                                 \
              $n % 10 <= 4 &&                                                 \
              ($n % 100 < 10 || $n % 100 >= 20) ? "few" :                     \
                "many" }>                                                     \
      ';
    });
    it('is zero', function() {
      // args are passed as [locals, value] tuple
      var value = env.plural._call([[null, 0]]);
      value[1].should.equal('zero');
    });
    it('is one', function() {
      var value = env.plural._call([[null, 1]]);
      value[1].should.equal('one');
    });
    it('is few for 2', function() {
      var value = env.plural._call([[null, 2]]);
      value[1].should.equal('few');
    });
    it('is many for 5', function() {
      var value = env.plural._call([[null, 5]]);
      value[1].should.equal('many');
    });
    it('is many for 11', function() {
      var value = env.plural._call([[null, 11]]);
      value[1].should.equal('many');
    });
    it('is few for 22', function() {
      var value = env.plural._call([[null, 22]]);
      value[1].should.equal('few');
    });
    it('is many for 101', function() {
      var value = env.plural._call([[null, 101]]);
      value[1].should.equal('many');
    });
    it('is few for 102', function() {
      var value = env.plural._call([[null, 102]]);
      value[1].should.equal('few');
    });
    it('is many for 111', function() {
      var value = env.plural._call([[null, 111]]);
      value[1].should.equal('many');
    });
    it('is many for 121', function() {
      var value = env.plural._call([[null, 121]]);
      value[1].should.equal('many');
    });
    it('is few for 122', function() {
      var value = env.plural._call([[null, 122]]);
      value[1].should.equal('few');
    });
  });

  //shape guards
  describe('unary -', function() {
    before(function() {
      source = '                                                              \
        <expr($n) { -$n }>                                                    \
      ';
    });
    it('negates the arithmetic value of the argument', function() {
      var value = env.expr._call([[null, 1]]);
      value[1].should.equal(-1);
    });
    it('throws if the argument is a string', function() {
      (function() {
        env.expr._call([[null, 'foo']]);
      }).should.throw(/takes a number/);
    });
    it('throws if the argument is a boolean', function() {
      (function() {
        env.expr._call([[null, true]]);
      }).should.throw(/takes a number/);
    });
    it('throws if the argument is null', function() {
      (function() {
        env.expr._call([[null, null]]);
      }).should.throw(/takes a number/);
    });
  });

  describe('unary +', function() {
    before(function() {
      source = '                                                              \
        <expr($n) { +$n }>                                                    \
      ';
    });
    it('returns the arithmetic value of the argument', function() {
      var value = env.expr._call([[null, 1]]);
      value[1].should.equal(1);
    });
    it('throws if the argument is a string', function() {
      (function() {
        env.expr._call([[null, 'foo']]);
      }).should.throw(/takes a number/);
    });
    it('throws if the argument is a boolean', function() {
      (function() {
        env.expr._call([[null, true]]);
      }).should.throw(/takes a number/);
    });
    it('throws if the argument is null', function() {
      (function() {
        env.expr._call([[null, null]]);
      }).should.throw(/takes a number/);
    });
  });

  describe('unary !', function() {
    before(function() {
      source = '                                                              \
        <expr($n) { !$n }>                                                    \
      ';
    });
    it('negates the logical value of the argument', function() {
      var value = env.expr._call([[null, true]]);
      value[1].should.equal(false);
    });
    it('throws if the argument is a string', function() {
      (function() {
        env.expr._call([[null, 'foo']]);
      }).should.throw(/takes a boolean/);
    });
    it('throws if the argument is a number', function() {
      (function() {
        env.expr._call([[null, 1]]);
      }).should.throw(/takes a boolean/);
    });
    it('throws if the argument is null', function() {
      (function() {
        env.expr._call([[null, null]]);
      }).should.throw(/takes a boolean/);
    });
  });

  describe('binary ==', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n == $k }>                                           \
      ';
    });
    it('returns true if the number values of the arguments are equal', function() {
      var value = env.expr._call([[null, 1], [null, 1]]);
      value[1].should.equal(true);
    });
    it('returns false if the number values of the arguments are not equal', function() {
      var value = env.expr._call([[null, 1], [null, 2]]);
      value[1].should.equal(false);
    });
    it('returns true if the string values of the arguments are equal', function() {
      var value = env.expr._call([[null, 'foo'], [null, 'foo']]);
      value[1].should.equal(true);
    });
    it('returns false if the string values of the arguments are not equal', function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      value[1].should.equal(false);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
  });

  describe('binary !=', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n != $k }>                                           \
      ';
    });
    it('returns false if the number values of the arguments are equal', function() {
      var value = env.expr._call([[null, 1], [null, 1]]);
      value[1].should.equal(false);
    });
    it('returns true if the number values of the arguments are not equal', function() {
      var value = env.expr._call([[null, 1], [null, 2]]);
      value[1].should.equal(true);
    });
    it('returns false if the string values of the arguments are equal', function() {
      var value = env.expr._call([[null, 'foo'], [null, 'foo']]);
      value[1].should.equal(false);
    });
    it('returns true if the string values of the arguments are not equal', function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      value[1].should.equal(true);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
  });

  describe('binary <', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n < $k }>                                            \
      ';
    });
    it('returns true if the number value of arg1 is less than that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 2]]);
      value[1].should.equal(true);
    });
    it('returns false if the number value of arg1 is equal to that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 1]]);
      value[1].should.equal(false);
    });
    it('returns false if the number value of arg1 is greater than that of arg2', function() {
      var value = env.expr._call([[null, 2], [null, 1]]);
      value[1].should.equal(false);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('binary <=', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n <= $k }>                                           \
      ';
    });
    it('returns true if the number value of arg1 is less than that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 2]]);
      value[1].should.equal(true);
    });
    it('returns true if the number value of arg1 is equal to that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 1]]);
      value[1].should.equal(true);
    });
    it('returns false if the number value of arg1 is greater than that of arg2', function() {
      var value = env.expr._call([[null, 2], [null, 1]]);
      value[1].should.equal(false);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('binary >', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n > $k }>                                            \
      ';
    });
    it('returns false if the number value of arg1 is less than that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 2]]);
      value[1].should.equal(false);
    });
    it('returns false if the number value of arg1 is equal to that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 1]]);
      value[1].should.equal(false);
    });
    it('returns true if the number value of arg1 is greater than that of arg2', function() {
      var value = env.expr._call([[null, 2], [null, 1]]);
      value[1].should.equal(true);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('binary >=', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n >= $k }>                                           \
      ';
    });
    it('returns false if the number value of arg1 is less than that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 2]]);
      value[1].should.equal(false);
    });
    it('returns true if the number value of arg1 is equal to that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 1]]);
      value[1].should.equal(true);
    });
    it('returns true if the number value of arg1 is greater than that of arg2', function() {
      var value = env.expr._call([[null, 2], [null, 1]]);
      value[1].should.equal(true);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('binary +', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n + $k }>                                            \
      ';
    });
    it('returns the sum of the number values of the arguments', function() {
      var value = env.expr._call([[null, 1], [null, 1]]);
      value[1].should.equal(2);
    });
    it('concatenates the string values of the arguments', function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      value[1].should.equal('foobar');
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers or two strings/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers or two strings/);
    });
  });

  describe('binary -', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n - $k }>                                            \
      ';
    });
    it('returns the result of the substraction of the number value of arg1 from that of arg2', function() {
      var value = env.expr._call([[null, 1], [null, 2]]);
      value[1].should.equal(-1);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('binary *', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n * $k }>                                            \
      ';
    });
    it('returns the result of the multiplication of the number value of arg1 by that of arg2', function() {
      var value = env.expr._call([[null, 3], [null, 2]]);
      value[1].should.equal(6);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('binary /', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n / $k }>                                            \
      ';
    });
    it('returns the result of the division of the number value of arg1 by that of arg2', function() {
      var value = env.expr._call([[null, 6], [null, 2]]);
      value[1].should.equal(3);
    });
    it('throws if the second argument is 0' , function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, 0]]);
      }).should.throw(/Division by zero/);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('binary %', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n % $k }>                                            \
      ';
    });
    it('returns the number value of arg1 modulo the number value of arg2', function() {
      var value = env.expr._call([[null, 11], [null, 10]]);
      value[1].should.equal(1);
    });
    it('throws if the second argument is 0' , function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, 0]]);
      }).should.throw(/Modulo zero/);
    });
    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two bools', function() {
      (function() {
      var value = env.expr._call([[null, true], [null, true]]);
      }).should.throw(/takes two numbers/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two numbers/);
    });
  });

  describe('logical ||', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n || $k }>                                           \
      ';
    });
    it('returns true if both of the arguments are true', function() {
      var value = env.expr._call([[null, true], [null, true]]);
      value[1].should.equal(true);
    });
    it('returns true if one of the arguments is true', function() {
      var value = env.expr._call([[null, true], [null, false]]);
      value[1].should.equal(true);
    });
    it('returns false if none of the arguments is true', function() {
      var value = env.expr._call([[null, false], [null, false]]);
      value[1].should.equal(false);
    });

    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are two numbers', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, 0]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two booleans/);
    });
  });

  describe('logical &&', function() {
    before(function() {
      source = '                                                              \
        <expr($n, $k) { $n && $k }>                                           \
      ';
    });
    it('returns true if both of the arguments are true', function() {
      var value = env.expr._call([[null, true], [null, true]]);
      value[1].should.equal(true);
    });
    it('returns false if one of the arguments is false', function() {
      var value = env.expr._call([[null, true], [null, false]]);
      value[1].should.equal(false);
    });
    it('returns false if none of the arguments is true', function() {
      var value = env.expr._call([[null, false], [null, false]]);
      value[1].should.equal(false);
    });

    it('throws if the arguments are a string and a number', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 1]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a string and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, true]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a string and a null', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, null]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a number and a bool', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, true]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are a number and a null', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, null]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are two strings', function() {
      (function() {
      var value = env.expr._call([[null, 'foo'], [null, 'bar']]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are two numbers', function() {
      (function() {
      var value = env.expr._call([[null, 1], [null, 0]]);
      }).should.throw(/takes two booleans/);
    });
    it('throws if the arguments are two nulls', function() {
      (function() {
      var value = env.expr._call([[null, null], [null, null]]);
      }).should.throw(/takes two booleans/);
    });
  });

  describe('conditional', function() {
    before(function() {
      source = '                                                              \
        <expr($n) { $n ? 1 : 0 }>                                             \
      ';
    });
    it('returns consequent if the argument is true', function() {
      var value = env.expr._call([[null, true]]);
      value[1].should.equal(1);
    });
    it('returns alternate if the argument is false', function() {
      var value = env.expr._call([[null, false]]);
      value[1].should.equal(0);
    });
    it('throws if the argument is a string', function() {
      (function() {
        env.expr._call([[null, 'foo']]);
      }).should.throw(/test a boolean/);
    });
    it('throws if the argument is a number', function() {
      (function() {
        env.expr._call([[null, 1]]);
      }).should.throw(/test a boolean/);
    });
    it('throws if the argument is null', function() {
      (function() {
        env.expr._call([[null, null]]);
      }).should.throw(/test a boolean/);
    });
  });

});
