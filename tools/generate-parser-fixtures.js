#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var program = require('commander');
var prettyjson = require('prettyjson');

var lib = require('./lib');

program
  .version('0.0.1')
  .usage('[options] [file]')
  .parse(process.argv);


var basePath = './test/lib/fixtures/parser/ftl';

fs.readdir(basePath, (err, paths) => {
  paths.forEach(fileName => {
    if (!fileName.endsWith('ftl')) {
      return;
    }
    let fullPath = path.join(basePath, fileName);

    fs.readFile(path.join(basePath, fileName), 'utf8', function (err, data) {
      if (err) {
        return console.log(err);
      }
      
      let [resource, errors] = lib.parse('ftl', 'ast', data.toString());
      let jsonOutput = JSON.stringify(resource, null, 2);

      let outputPath = fullPath.slice(0, -4) + '.ast.json';
      fs.writeFile(outputPath, jsonOutput, function(err) {
        if (err) {
          return console.log(err);
        }

        console.log(`${outputPath} saved.`);
      });

      let [entries] = lib.transform('ftl', 'entries', [resource]);

      let jsonEntriesOutput = JSON.stringify(entries, null, 2);

      let entriesOutputPath = fullPath.slice(0, -4) + '.entries.json';
      fs.writeFile(entriesOutputPath, jsonEntriesOutput, function(err) {
        if(err) {
          return console.log(err);
        }

        console.log(`${entriesOutputPath} saved.`);
      });

    });
  });
});
