load('../../fluent/fluent.js');
load('../../fluent-syntax/fluent-syntax.js');

var ftlCode = read('./workload-low.ftl');
var args = {}

function ms(time) {
  // time is in milliseconds with decimals
  return Math.round(time * 1e3) / 1e3;
}

var times = {};

times.ftlParseStart = Date.now();
var resource = FluentSyntax.parse(ftlCode);
times.ftlParseEnd = Date.now();

times.ftlEntriesParseStart = Date.now();
var [entries] = Fluent._parse(ftlCode);
times.ftlEntriesParseEnd = Date.now();

var bundle = new Fluent.FluentBundle('en-US');
var errors = bundle.addMessages(ftlCode);

times.format = Date.now();
for (const [id, message] of bundle.messages) {
  bundle.format(message, args, errors);
  if (message.attrs) {
    for (const name in message.attrs) {
      bundle.format(message.attrs[name], args, errors)
    }
  }
}
times.formatEnd = Date.now();

var results = {
  "parse full AST (ms)": ms(times.ftlParseEnd - times.ftlParseStart),
  "parse runtime AST (ms)": ms(times.ftlEntriesParseEnd - times.ftlEntriesParseStart),
  "format (ms)": ms(times.formatEnd - times.format),
};

print(JSON.stringify(results));
