var fs = require('fs');
var Fluent = require('../../fluent');
var FluentSyntax = require('../../fluent-syntax');

var ftlCode = fs.readFileSync(__dirname + '/workload-low.ftl').toString();

var args = {};

function micro(time) {
  // time is [seconds, nanoseconds]
  return Math.round((time[0] * 1e9 + time[1]) / 1000);
}

var cumulative = {};
var start = process.hrtime();

cumulative.ftlParseStart = process.hrtime(start);
var [resource] = FluentSyntax.parse(ftlCode);
cumulative.ftlParseEnd = process.hrtime(start);

cumulative.ftlEntriesParseStart = process.hrtime(start);
var [entries] = Fluent._parse(ftlCode);
cumulative.ftlEntriesParseEnd = process.hrtime(start);

var ctx = new Intl.MessageContext('en-US');
var errors = ctx.addMessages(ftlCode);

cumulative.format = process.hrtime(start);
for (let id of ctx.messages.keys()) {
  const message = ctx.messages.get(id);

  ctx.format(message, args, errors);
  if (message.traits) {
    for (let trait of message.traits) {
      ctx.format(trait.val, args, errors)
    }
  }
}
cumulative.formatEnd = process.hrtime(start);

var results = {
  parseFTL: micro(cumulative.ftlParseEnd) - micro(cumulative.ftlParseStart),
  parseFTLEntries: micro(cumulative.ftlEntriesParseEnd) - micro(cumulative.ftlEntriesParseStart),
  format: micro(cumulative.formatEnd) - micro(cumulative.format),
};
console.log(JSON.stringify(results));
