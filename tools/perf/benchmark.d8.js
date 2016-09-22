load('../../dist/bundle/jsshell/l20n.js');

var ftlCode = read('./workload-low.ftl');
var args = {}

function micro(time) {
  // time is in milliseconds
  return Math.round(time * 1000);
}

var times = {};

times.ftlParseStart = Date.now();
var [resource] = L20n.FTLASTParser.parseResource(ftlCode);
times.ftlParseEnd = Date.now();

times.ftlEntriesParseStart = Date.now();
var [entries] = L20n.FTLEntriesParser.parse(null, ftlCode);
times.ftlEntriesParseEnd = Date.now();

var ctx = new Intl.MessageContext('en-US');
var errors = ctx.addMessages(ftlCode);

times.format = Date.now();
for (let id of ctx.messages.keys()) {
  const message = ctx.messages.get(id);

  ctx.format(message, args, errors);
  if (message.traits) {
    for (let trait of message.traits) {
      ctx.format(trait.val, args, errors)
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
