import assert from 'assert';
import { join } from 'path';
import { readdirSync, readFileSync} from 'fs';

import {FluentResource} from '../esm/resource';

const ftlFixtures = join(
  __dirname, '..', '..', 'fluent-syntax', 'test', 'fixtures_reference'
);
const jsonFixtures = join(__dirname, 'fixtures_reference');

let filenames = readdirSync(ftlFixtures);
let ftlnames = filenames.filter(
  filename => filename.endsWith('.ftl')
);

suite('Reference tests', function() {
  for (const ftlfilename of ftlnames) {
    const jsonfilename = ftlfilename.replace(/ftl$/, 'json');
    const ftlpath = join(ftlFixtures, ftlfilename);
    const jsonpath = join(jsonFixtures, jsonfilename);
    test(ftlfilename, function() {
      let ftl = readFileSync(ftlpath, "utf8");
      let expected = readFileSync(jsonpath, "utf8");
      let resource = new FluentResource(ftl);
      assert.deepEqual(resource, JSON.parse(expected));
    });
  }
});
