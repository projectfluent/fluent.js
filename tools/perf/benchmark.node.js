var fs = require('fs');

require('../../fluent-intl-polyfill');
var Fluent = require('../../fluent');
var FluentSyntax = require('../../fluent-syntax');

var ftlCode = fs.readFileSync(__dirname + '/workload-low.ftl').toString();

var args = {};

function ms([seconds, nanoseconds]) {
  return Math.round((seconds * 1e9 + nanoseconds) / 1e3) / 1e3;
}

var cumulative = {};
var start = process.hrtime();

cumulative.ftlParseStart = process.hrtime(start);
var resource = FluentSyntax.parse(ftlCode);
cumulative.ftlParseEnd = process.hrtime(start);

cumulative.ftlEntriesParseStart = process.hrtime(start);
var [entries] = Fluent._parse(ftlCode);
cumulative.ftlEntriesParseEnd = process.hrtime(start);

var ctx = new Fluent.MessageContext('en-US');
var errors = ctx.addMessages(ftlCode);

cumulative.format = process.hrtime(start);
for (const [id, message] of ctx.messages) {
  ctx.format(message, args, errors);
  if (message.attrs) {
    for (const name in message.attrs) {
      ctx.format(message.attrs[name], args, errors)
    }
  }
}
cumulative.formatEnd = process.hrtime(start);

var results = {
  "parse full AST (ms)": ms(cumulative.ftlParseEnd) - ms(cumulative.ftlParseStart),
  "parse runtime AST (ms)": ms(cumulative.ftlEntriesParseEnd) - ms(cumulative.ftlEntriesParseStart),
  "format (ms)": ms(cumulative.formatEnd) - ms(cumulative.format),
};
console.log(JSON.stringify(results));
