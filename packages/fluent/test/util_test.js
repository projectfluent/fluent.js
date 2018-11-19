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
        'foo = Foo'
      );
    });

    test('start with EOL, no indent, end with EOL', function() {
      assert.equal(
        ftl`
  foo = Foo
  `,
        'foo = Foo'
      );
    });

    test('start with EOL, no indent, end with EOL and smaller indent', function() {
      assert.equal(
        ftl`
  foo = Foo
        `,
        'foo = Foo'
      );
    });

    test('start with EOL, no indent, end with EOL and same indent', function() {
      assert.equal(
        ftl`
  foo = Foo
          `,
        'foo = Foo'
      );
    });

    test('start with EOL, indent, end without EOL', function() {
      assert.equal(
        ftl`
          foo = Foo`,
        'foo = Foo'
      );
    });

    test('start with EOL, indent, end with EOL', function() {
      assert.equal(
        ftl`
          foo = Foo
  `,
        'foo = Foo'
      );
    });

    test('start with EOL, indent, end with EOL and smaller indent', function() {
      assert.equal(
        ftl`
          foo = Foo
        `,
        'foo = Foo'
      );
    });

    test('start with EOL, indent, end with EOL and same indent', function() {
      assert.equal(
        ftl`
          foo = Foo
          `,
        'foo = Foo'
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
        'foo = Foo\nbar = Bar'
      );
    });

    test('smallest common indent', function() {
      assert.equal(
        ftl`
          foo = Foo
      bar = Bar
        `,
        '    foo = Foo\nbar = Bar'
      );
    });

    test('multiline pattern', function() {
      assert.equal(
        ftl`
          foo =
              Foo
              Bar
        `,
        'foo =\n    Foo\n    Bar'
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
        'foo = { $num ->\n    [one] One\n   *[other] Other\n}'
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
        'foo =\n    { $num ->\n        [one] One\n       *[other] Other\n    }'
      );
    });
  });
});
