'use strict';

import fs from 'fs';
import path from 'path';

import assert from 'assert';
import FTLParser from '../../../../src/lib/format/ftl/ast/parser';
import FTLSerializer from '../../../../src/lib/format/ftl/ast/serializer';

var parse = FTLParser.parseResource;

function readFile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf8', (err, data) => {
      resolve(data);
    });
  });
}

function testSerialize(path) {
  return readFile(path).then(source => {
    let [resource1] = parse(source);
    let out = FTLSerializer.serialize(resource1);
    let [resource2] = parse(out);

    assert.deepEqual(
      resource2.body, resource1.body,
      `Serialized output for ${path} should be the same`
    );
  });
}

var basePath = './test/lib/fixtures/parser/ftl';

describe('FTL Serializer', function() {
  it('fixtures work', function(done) {
    fs.readdir(basePath, (err, paths) => {
      let tests = [];

      paths.forEach(fileName => {
        if (!fileName.endsWith('.ftl') || fileName.indexOf('error') !== -1) {
          return;
        }
        let ftlPath = path.join(basePath, fileName);
        
        tests.push(testSerialize(ftlPath));
      });

      Promise.all(tests).then(() => { done() }, (err) => { done(err) });
    });
  });
});
