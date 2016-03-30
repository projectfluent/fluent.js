#!/usr/bin/env node

'use strict';
const program = require('commander');
const fs = require('fs');
const cheerio = require('cheerio');

require('babel-register')({
  presets: ['es2015']
});
const AST = require('../src/lib/format/ftl/ast/ast').default;
const Serializer = require('../src/lib/format/ftl/ast/serializer').default;


function extractFromHTML(err, data) {
  const res = new AST.Resource();

  const $ = cheerio.load(data.toString());
  const elements = $('*[data-l10n-id]');
  elements.each(function(index, element) {
    const id = new AST.Identifier($(this).attr('data-l10n-id'));
    const value = new AST.Pattern($(this).text());
    res.body.push(new AST.Entity(id, value));
  });

  console.log(Serializer.serialize(res));
}



program
  .version('0.0.1')
  .usage('[options] [file]')
  .parse(process.argv);

fs.readFile(program.args[0], extractFromHTML);
