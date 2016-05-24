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

const AST = require('../src/ftl/ast/ast').default;
const Parser = require('../src/ftl/entries/parser').default;
const Serializer = require('../src/ftl/ast/serializer').default;

function trimString(str) {
  return str.split('\n').map(line => {
    return line.trim();
  }).join('\n');
}

function extractFromHTML(data) {
  const entities = {};

  const $ = cheerio.load(data, {
    xmlMode: true
  });
  const elements = $('*[data-l10n-id]');
  elements.each(function(index, element) {
    const id = $(this).attr('data-l10n-id');
    const sourceValue = $(this).text();
    entities[id] = sourceValue;
  });

  return entities;
}

function extractFromJS(data) {
  const entities = {};

  const ast = esprima.parse(data);

  esprimaWalk(ast, node => {
    if (node.type === 'CallExpression') {
      if (node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'MemberExpression' &&
          node.callee.object.object.type === 'Identifier' &&
          node.callee.object.object.name === 'document' &&
          node.callee.object.property.type === 'Identifier' &&
          node.callee.object.property.name === 'l10n') {

        if(node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'getValue') {
          if (node.arguments[0].type === 'Literal') {
            const id = node.arguments[0].value;
            const source = '';
            entities[id] = source;
          }
        }
        if(node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'setAttributes') {
          const id = node.arguments[1].value;
          const source = '';

          entities[id] = source;
        }
      }
    }
  });

  return entities;
}

function checkEntities(files) {
  let ftl = Parser.parseResource(files[0])[0];
  let html = extractFromHTML(files[1]);
  let js = extractFromJS(files[2]);

  const presentKeys = Object.keys(html).concat(Object.keys(js));
  const ftlKeys = Object.keys(ftl);

  console.log('Missing entities:');
  const missingKeys = presentKeys.filter(key => !ftlKeys.includes(key));
  console.log(missingKeys);
  console.log('Obsolete entities:');
  const obsoleteKeys = ftlKeys.filter(key => !presentKeys.includes(key));
  console.log(obsoleteKeys);
  console.log('done');
}


function readFile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, (err, data) => {
      resolve(data.toString());
    });
  });
}

program
  .version('0.0.1')
  .usage('[options] [file]')
  .parse(process.argv);


let files = [];

for (let i = 0; i < program.args.length; i++) {
  files.push(readFile(program.args[i]));
}

Promise.all(files).then(checkEntities);
