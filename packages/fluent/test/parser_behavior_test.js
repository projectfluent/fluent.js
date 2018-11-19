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
          assert(resource.has(id), `Expected message "${id}" to be parsed`);

          const entry = resource.get(id);

          if (expected.value) {
            assert(hasValue(entry), `Expected ${id} to have a value`);
          } else {
            assert(!hasValue(entry), `Expected ${id} to have a null value`);
          }

          if (expected.attributes) {
            assert(hasAttrs(entry), `Expected ${id} to have attributes`);
            assert.deepEqual(
              Object.keys(expected.attributes),
              Object.keys(entry.attrs)
            );
          } else {
            assert(!hasAttrs(entry), `Expected ${id} to have zero attributes`);
          }
        }

      });
    }
  });
});

function hasValue(entry) {
  return typeof entry === 'string'
    || Array.isArray(entry)
    || entry.hasOwnProperty('value');
}

function hasAttrs(entry) {
  return typeof entry !== 'string'
    && entry.hasOwnProperty('attrs');
}
