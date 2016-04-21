'use strict';

import assert from 'assert';
import FTLParser from '../../../../src/lib/format/ftl/ast/parser';
import FTLSerializer from '../../../../src/lib/format/ftl/ast/serializer';

var equal = require('deep-equal');
var fs = require('fs');
var path = require('path');

var parse = FTLParser.parseResource;

function readFile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf8', (err, data) => {
      resolve(data);
    });
  });
}

function testSerialize(path1) {
  return Promise.all([
    readFile(path1),
  ]).then(([source1]) => {
    let ftl = parse(source1);
    let out = FTLSerializer.serialize(ftl);
    let ftl2 = parse(out);

    assert.deepEqual(ftl.body, ftl2.body, `Serialized output for ${path1} should be the same`);
  });
}

var basePath = './tests/lib/fixtures/parser/ftl';


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
