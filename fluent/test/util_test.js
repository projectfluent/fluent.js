'use strict';

import assert from 'assert';

import { ftl } from '../src/util';

suite('ftl dedent helper', function() {
  suite('EOLs at extremes', function() {
    test('no EOLs', function() {
      assert.equal(
        ftl`foo = Foo`,
        'foo = Foo'
      );
    });

    test('start with EOL, no indent, end without EOL', function() {
      assert.equal(
        ftl`
foo = Foo`,
        '\nfoo = Foo'
      );
    });

    test('start with EOL, no indent, end with EOL', function() {
      assert.equal(
        ftl`
foo = Foo
`,
        '\nfoo = Foo\n'
      );
    });

    test('start with EOL, no indent, end with EOL and indent', function() {
      assert.equal(
        ftl`
foo = Foo
    `,
        '\nfoo = Foo\n    '
      );
    });

    test('start with EOL, indent, end without EOL', function() {
      assert.equal(
        ftl`
          foo = Foo`,
        '\nfoo = Foo'
      );
    });

    test('start with EOL, indent, end with EOL', function() {
      assert.equal(
        ftl`
          foo = Foo
`,
        '\nfoo = Foo\n'
      );
    });

    test('start with EOL, indent, end with EOL and smaller indent', function() {
      assert.equal(
        ftl`
          foo = Foo
    `,
        '\nfoo = Foo\n'
      );
    });

    test('start with EOL, indent, end with EOL and same indent', function() {
      assert.equal(
        ftl`
          foo = Foo
          `,
        '\nfoo = Foo\n'
      );
    });

    test('start with EOL, indent, end with EOL and larger indent', function() {
      assert.equal(
        ftl`
          foo = Foo
              `,
        '\nfoo = Foo\n    '
      );
    });
  });

  suite('non-blank lines', function() {
    test('same indent', function() {
      assert.equal(
        ftl`
          foo = Foo
          bar = Bar
        `,
        '\nfoo = Foo\nbar = Bar\n'
      );
    });

    test('smallest common indent', function() {
      assert.equal(
        ftl`
          foo = Foo
      bar = Bar
        `,
        '\n    foo = Foo\nbar = Bar\n  '
      );
    });

    test('multiline pattern', function() {
      assert.equal(
        ftl`
          foo =
              Foo
              Bar
        `,
        '\nfoo =\n    Foo\n    Bar\n'
      );
    });

    test('select expression on the same line as id', function() {
      assert.equal(
        ftl`
          foo = { $num ->
              [one] One
             *[other] Other
          }
        `,
        '\nfoo = { $num ->\n    [one] One\n   *[other] Other\n}\n'
      );
    });

    test('select expression on a new line', function() {
      assert.equal(
        ftl`
          foo =
              { $num ->
                  [one] One
                 *[other] Other
              }
        `,
        '\nfoo =\n    { $num ->\n        [one] One\n       *[other] Other\n    }\n'
      );
    });
  });

  suite('leading blank lines', function() {
    test('empty', function() {
      assert.equal(
        ftl`

          foo = Foo
        `,
        '\n\nfoo = Foo\n'
      );
    });

    test('smaller indent', function() {
      assert.equal(
        ftl`
    
          foo = Foo
        `,
        '\n\nfoo = Foo\n'
      );
    });

    test('same indent', function() {
      assert.equal(
        ftl`
          
          foo = Foo
        `,
        '\n\nfoo = Foo\n'
      );
    });

    test('larger indent', function() {
      assert.equal(
        ftl`
              
          foo = Foo
        `,
        '\n    \nfoo = Foo\n'
      );
    });
  });

  suite('middle blank lines', function() {
    test('empty', function() {
      assert.equal(
        ftl`
          foo = Foo

          bar = Bar
        `,
        '\nfoo = Foo\n\nbar = Bar\n'
      );
    });

    test('smaller indent', function() {
      assert.equal(
        ftl`
          foo = Foo
    
          bar = Bar
        `,
        '\nfoo = Foo\n\nbar = Bar\n'
      );
    });

    test('same indent', function() {
      assert.equal(
        ftl`
          foo = Foo
          
          bar = Bar
        `,
        '\nfoo = Foo\n\nbar = Bar\n'
      );
    });

    test('larger indent', function() {
      assert.equal(
        ftl`
          foo = Foo
              
          bar = Bar
        `,
        '\nfoo = Foo\n    \nbar = Bar\n'
      );
    });
  });

  suite('trailing blank lines', function() {
    test('empty', function() {
      assert.equal(
        ftl`
          foo = Foo

        `,
        '\nfoo = Foo\n\n'
      );
    });

    test('smaller indent', function() {
      assert.equal(
        ftl`
          foo = Foo
    
        `,
        '\nfoo = Foo\n\n'
      );
    });

    test('same indent', function() {
      assert.equal(
        ftl`
          foo = Foo
          
        `,
        '\nfoo = Foo\n\n'
      );
    });

    test('larger indent', function() {
      assert.equal(
        ftl`
          foo = Foo
              
        `,
        '\nfoo = Foo\n    \n'
      );
    });
  });
});
