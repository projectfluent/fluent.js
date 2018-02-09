import assert from 'assert';

import { ftl } from './util';
import { mergeFiles } from '../src';

suite('mergeFiles', function() {
  test('overwrite existing messages', function() {
    const res1 = ftl`
      foo = Foo
      bar = Bar
    `;

    const res2 = ftl`
      foo = FOO
    `;

    const merged = mergeFiles(res1, res2);

    assert.equal(merged, ftl`
      foo = FOO
      bar = Bar
    `);
  });

  test('ignore obsolete messages', function() {
    const res1 = ftl`
      foo = Foo
    `;

    const res2 = ftl`
      foo = FOO
      bar = BAR
    `;

    const merged = mergeFiles(res1, res2);

    assert.equal(merged, ftl`
      foo = FOO
    `);
  });
});
