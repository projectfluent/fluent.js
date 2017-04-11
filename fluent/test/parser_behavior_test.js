import assert from 'assert';
import { join } from 'path';
import { readdir } from 'fs';
import { readfile } from '../../fluent-syntax/test/util';
import { preprocess, serializeAnnotation }
  from '../../fluent-syntax/test/behavior_test';
import parse from '../src/parser';

// Use behavior tests fixtures from fluent-syntax.
const fixtures = join(
  __dirname, '..', '..', 'fluent-syntax', 'test','fixtures_behavior'
);

readdir(fixtures, function(err, filenames) {
  if (err) {
    throw err;
  }

  const ftlnames = filenames.filter(
    filename => filename.endsWith('.ftl')
  );

  suite('Behavior tests', function() {
    for (const filename of ftlnames) {
      const filepath = join(fixtures, filename);
      test.skip(filename, function() {
        return readfile(filepath).then(file => {
          const { directives, source } = preprocess(file);
          const expected = directives.join('\n') + '\n';
          const [entries, annots] = parse(source);
          const actual = annots.map(serializeAnnotation).join('\n') + '\n';
          assert.deepEqual(
            actual, expected,
            'Actual Annotations don\'t match the expected ones'
          );
        });
      });
    }
  });
});
