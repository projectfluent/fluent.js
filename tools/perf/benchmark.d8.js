load('../../fluent-intl-polyfill/node_modules/intl-pluralrules/polyfill.js');
load('../../fluent/fluent.js');
load('../../fluent-syntax/fluent-syntax.js');

var ftlCode = read('./workload-low.ftl');
var args = {}

function micro(time) {
  // time is in milliseconds
  return Math.round(time * 1000);
}

var times = {};

times.ftlParseStart = Date.now();
var resource = FluentSyntax.parse(ftlCode);
times.ftlParseEnd = Date.now();

times.ftlEntriesParseStart = Date.now();
var [entries] = Fluent._parse(ftlCode);
times.ftlEntriesParseEnd = Date.now();

var ctx = new Fluent.MessageContext('en-US');
var errors = ctx.addMessages(ftlCode);

times.format = Date.now();
for (const [id, message] of ctx.messages) {
  ctx.format(message, args, errors);
  if (message.attrs) {
    for (const name in message.attrs) {
      ctx.format(message.attrs[name], args, errors)
    }
  }
}
times.formatEnd = Date.now();

var results = {
  parseFTL: micro(times.ftlParseEnd - times.ftlParseStart),
  parseFTLEntries: micro(times.ftlEntriesParseEnd - times.ftlEntriesParseStart),
  format: micro(times.formatEnd - times.format),
};

print(JSON.stringify(results));
