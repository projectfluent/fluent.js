'use strict';

import fs from 'fs';
import path from 'path';

import assert from 'assert';
import FTLParser from '../../../../src/lib/format/ftl/ast/parser';
import RuntimeParser from '../../../../src/lib/format/ftl/entries/parser';
import { createEntriesFromAST }
  from '../../../../src/lib/format/ftl/entries/transformer';

var parse = FTLParser.parseResource;
var parseEntries = RuntimeParser.parseResource;

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
    const [resource] = parse(source1);
    let json = {};
    try {
      json = JSON.parse(source2);
    } catch (e) {
      throw new Error('JSON parsing error in ' + path2 + '\n\n' + e);
    }

    assert.deepEqual(resource, json, 'Error in: ' + path1);

  });
}

function compareEntries(path1, path2) {
  return Promise.all([
    readFile(path1),
    readFile(path2)
  ]).then(([source1, source2]) => {
    const result = parse(source1);
    const [entries] = createEntriesFromAST(result);
    let json = {};
    try {
      json = JSON.parse(source2);
    } catch (e) {
      throw new Error('JSON parsing error in ' + path2 + '\n\n' + e);
    }

    assert.deepEqual(entries, json, 'Error in: ' + path1);

  });
}

function compareTransformerToEntries(path) {
  return Promise.all([
    readFile(path),
  ]).then(([source]) => {
    const result = parse(source);
    const [entries] = createEntriesFromAST(result);

    let entries2 = {};
    try {
      entries2 = parseEntries(source)[0];
    } catch (e) {
      throw new Error('Error parsing ' + path + '\n\n' + e);
    }

    assert.deepEqual(entries, entries2, 'Error in: ' + path);

  });
}

var basePath = './test/lib/fixtures/parser/ftl';

describe('FTL Parser', function() {
  it('fixtures work', function(done) {
    fs.readdir(basePath, (err, paths) => {
      let tests = [];

      paths.forEach(fileName => {
        if (!fileName.endsWith('.ftl')) {
          return;
        }
        let ftlPath = path.join(basePath, fileName);
        let jsonPath = ftlPath.slice(0, -4) + '.ast.json';
        
        tests.push(compareASTs(ftlPath, jsonPath));
      });

      Promise.all(tests).then(() => { done() }, (err) => { done(err) });
    });
  });
});

describe('Transformer', function() {
  it('fixtures work', function(done) {
    fs.readdir(basePath, (err, paths) => {
      let tests = [];

      paths.forEach(fileName => {
        if (!fileName.endsWith('.ftl')) {
          return;
        }
        let ftlPath = path.join(basePath, fileName);
        let jsonPath = ftlPath.slice(0, -4) + '.entries.json';
        
        tests.push(compareEntries(ftlPath, jsonPath));
      });

      Promise.all(tests).then(() => { done() }, (err) => { done(err) });
    });
  });
});

describe('Entries Parser', function() {
  it('fixtures work', function(done) {
    fs.readdir(basePath, (err, paths) => {
      let tests = [];

      paths.forEach(fileName => {
        if (!fileName.endsWith('.ftl')) {
          return;
        }
        let ftlPath = path.join(basePath, fileName);
        
        tests.push(compareTransformerToEntries(ftlPath));
      });

      Promise.all(tests).then(() => { done() }, (err) => { done(err) });
    });
  });

  it('entity with no eol work', function() {
    const [entries] = parseEntries('key=value');
    assert.equal(Object.keys(entries).length, 1);
  });
});
