import assert from 'assert';
import { join } from 'path';
import { readdir } from 'fs';
import { readfile, toObject } from './index';

import FluentResource from '../src/resource';

const ftlFixtures = join(
  __dirname, '..', '..', 'fluent-syntax', 'test', 'fixtures_reference'
);
const jsonFixtures = join(__dirname, 'fixtures_reference');

readdir(ftlFixtures, function(err, filenames) {
  if (err) {
    throw err;
  }

  const ftlnames = filenames.filter(
    filename => filename.endsWith('.ftl')
  );

  suite('Reference tests', function() {
    for (const ftlfilename of ftlnames) {
      const jsonfilename = ftlfilename.replace(/ftl$/, 'json');
      const ftlpath = join(ftlFixtures, ftlfilename);
      const jsonpath = join(jsonFixtures, jsonfilename);
      test(ftlfilename, async function() {
        const [ftl, expected] = await Promise.all(
          [ftlpath, jsonpath].map(readfile)
        );
        const resource = FluentResource.fromString(ftl);
        assert.deepEqual(
          toObject(resource), JSON.parse(expected),
          'Actual Annotations don\'t match the expected ones'
        );
      });
    }
  });
});
