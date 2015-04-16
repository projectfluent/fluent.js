#!/usr/bin/env node

'use strict';

var fs = require('fs');
var program = require('commander');

var PropertiesParser = require('../src/lib/format/properties/parser');
var L20nSerializer = require('../src/lib/format/l20n/serializer').L20nSerializer;

var l20nSerializer = new L20nSerializer();


program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-r, --raw', 'Print raw JSON')
  .parse(process.argv);

function convertFile(err, data) {
  var source = data.toString();
  var ast = PropertiesParser.parse(null, data.toString());

  var string = l20nSerializer.serialize(ast);
  console.log(string);
}

function main(path) {
  fs.readFile(path, convertFile);
}

if (program.args.length) {
  main(program.args[0]);
}
