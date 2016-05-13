#!/usr/bin/env node

'use strict';
const program = require('commander');
const fs = require('fs');
const cheerio = require('cheerio');
const esprima = require('esprima');
const esprimaWalk = require('esprima-walk');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

const AST = require('../src/lib/format/ftl/ast/ast').default;
const Serializer = require('../src/lib/format/ftl/ast/serializer').default;

function trimString(str) {
  return str.split('\n').map(line => {
    return line.trim();
  }).join('\n');
}

function extractFromHTML(err, data) {
  const res = new AST.Resource();

  const $ = cheerio.load(data.toString());
  const elements = $('*[data-l10n-id]');
  elements.each(function(index, element) {

    const id = new AST.Identifier($(this).attr('data-l10n-id'));
    const value = new AST.Pattern(trimString($(this).text().trim()));

    const traits = [];

    for (let i in element.attribs) {
      if (i === 'title') {
        const id = new AST.Identifier(i, 'html');
        const value = new AST.Pattern($(this).attr(i));
        const trait = new AST.Member(id, value);
        traits.push(trait);
      }
    }
    res.body.push(new AST.Entity(id, value, traits));
  });

  console.log(Serializer.serialize(res));
}

function extractFromJS(err, data) {
  const res = new AST.Resource();

  const ast = esprima.parse(data.toString());

  esprimaWalk(ast, node => {
    if (node.type === 'CallExpression') {
      if (node.callee.object.type === 'MemberExpression' &&
          node.callee.object.object.type === 'Identifier' &&
          node.callee.object.object.name === 'document' &&
          node.callee.object.property.type === 'Identifier' &&
          node.callee.object.property.name === 'l10n') {

        if(node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'formatValue') {
          const id = node.arguments[0].value;
          const source = node.arguments[1].value;

          res.body.push(new AST.Entity(
            new AST.Identifier(id),
            new AST.Pattern(source)
          ));
        }
        if(node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'setAttributes') {
          const id = node.arguments[1].value;
          const source = node.arguments[2].value;

          res.body.push(new AST.Entity(
            new AST.Identifier(id),
            new AST.Pattern(source)
          ));
        }
      }
    }
  });

  console.log(Serializer.serialize(res));
}


program
  .version('0.0.1')
  .usage('[options] [file]')
  .parse(process.argv);

if (program.args[0].endsWith('.html')) {
  fs.readFile(program.args[0], extractFromHTML);
}
if (program.args[0].endsWith('.js')) {
  fs.readFile(program.args[0], extractFromJS);
}
