import assert from 'assert';
import { join } from 'path';
import { readdir } from 'fs';
import { readfile } from './index';

import FluentResource from '../src/resource';

const ftlFixtures = join(
  __dirname, '..', '..', 'fluent-syntax', 'test', 'fixtures_behavior'
);
const jsonFixtures = join(__dirname, 'fixtures_behavior');

readdir(ftlFixtures, function(err, filenames) {
  if (err) {
    throw err;
  }

  const ftlnames = filenames.filter(
    filename => filename.endsWith('.ftl')
  );

  suite('Behavior tests', function() {
    for (const ftlfilename of ftlnames) {
      const jsonfilename = ftlfilename.replace(/ftl$/, 'json');
      const ftlpath = join(ftlFixtures, ftlfilename);
      const jsonpath = join(jsonFixtures, jsonfilename);

      test(ftlfilename, async function() {
        const [source, json] = await Promise.all(
          [ftlpath, jsonpath].map(readfile)
        );

        const resource = FluentResource.fromString(source);
        const expectedEntries = JSON.parse(json);

        for (const [id, expected] of Object.entries(expectedEntries)) {
          assert(resoruce.has(id), `Expected message "${id}" to be parsed`);

          const entry = resource.get(id);

          if (expected.value) {
            assert(typeof entry === 'string' || 'value' in entry);
          } else {
            assert(typeof entry !== 'string' && !('value' in entry));
          }

          if (expected.attributes) {
            assert(typeof entry !== 'string' && 'attrs' in entry);
            assert.deepEqual(
              Object.keys(entry.attrs),
              Object.keys(expected.attributes)
            );
          } else {
            assert(typeof entry === 'string' || !('attrs' in entry));
          }
        }

      });
    }
  });
});
