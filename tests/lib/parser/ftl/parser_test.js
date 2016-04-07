'use strict';

import assert from 'assert';
import FTLParser from '../../../../src/lib/format/ftl/ast/parser';
import { default as RuntimeParser }
  from '../../../../src/lib/format/ftl/entries/parser';
import { createEntriesFromAST }
  from '../../../../src/lib/format/ftl/entries/transformer';

var equal = require('deep-equal');
var fs = require('fs');
var path = require('path');

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
    let ftl = parse(source1);
    ftl._errors = [];
    let json = {};
    try {
      json = JSON.parse(source2);
    } catch (e) {
      throw new Error('JSON parsing error in ' + path2 + '\n\n' + e);
    }

    assert.deepEqual(ftl, json, 'Error in: ' + path1);

  });
}

function compareEntries(path1, path2) {
  return Promise.all([
    readFile(path1),
    readFile(path2)
  ]).then(([source1, source2]) => {
    let ftl = parse(source1);
    let entries = createEntriesFromAST(ftl);
    entries._errors = [];
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
    let ftl = parse(source);
    let entries = createEntriesFromAST(ftl);
    entries._errors = [];

    let entries2 = parseEntries(source);
    entries2._errors = [];

    assert.deepEqual(entries, entries2, 'Error in: ' + path);

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
});
