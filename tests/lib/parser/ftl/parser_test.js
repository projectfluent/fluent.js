'use strict';

import assert from 'assert';
import FTLParser from '../../../../src/lib/format/ftl/ast/parser';

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

function compareASTs(path1, path2) {
  return Promise.all([
    readFile(path1),
    readFile(path2)
  ]).then(([source1, source2]) => {
    let ftl = parse(source1);
    let json = JSON.parse(source2);

    assert.deepEqual(ftl, json);
  });
}

var basePath = './tests/lib/fixtures/parser/ftl';


describe('FTL Parser', function() {
  it('fixtures work', function(done) {
    fs.readdir(basePath, (err, paths) => {
      let tests = [];

      paths.forEach(fileName => {
        if (!fileName.endsWith('.ftl')) {
          return;
        }
        let ftlPath = path.join(basePath, fileName);
        let jsonPath = ftlPath.slice(0, -4) + '.json';
        
        tests.push(compareASTs(ftlPath, jsonPath));
      });

      Promise.all(tests).then(() => { done() }, (err) => { done(err) });
    });
  });
});
