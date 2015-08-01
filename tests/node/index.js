var Fs = require('fs');
var Path = require('path');
var Env = require('../..').Env;
var Fetch = require('../..').fetch;


var env = new Env('en-US', Fetch);
var ctx = env.createContext([
  Path.join(__dirname + '/fixtures/{locale}/entities.l20n')
]);
var langs = [
  {code: 'es-ES'},
  {code: 'en-US'},
  {code: 'fr'}
];

ctx.fetch(langs).then(init);

function init () {
  ctx.resolve(langs, 'whatCanIAsk').then(function (value) {
    console.log('SINGLE VALUE: ', value);
  });

  Promise.all([
    ctx.resolve(langs, 'whatCanIAsk'),
    ctx.resolve(langs, 'openApp'),
    ctx.resolve(langs, 'callNumber'),
    ctx.resolve(langs, 'notFound')
  ]).then(function (values) {
    console.log('MULI VALUES', values);
  });
}
