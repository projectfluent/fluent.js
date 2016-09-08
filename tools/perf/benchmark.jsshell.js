load('../../dist/bundle/tooling/l20n.js');

var ftlCode = read('./example.ftl');
var args = {};

function micro(time) {
  // time is in milliseconds with decimals
  return Math.round(time * 1000);
}

var times = {};

times.ftlParseStart = dateNow();
var [resource] = L20n.FTLASTParser.parseResource(ftlCode);
times.ftlParseEnd = dateNow();

times.ftlEntriesParseStart = dateNow();
var [entries] = L20n.FTLEntriesParser.parseResource(ftlCode);
times.ftlEntriesParseEnd = dateNow();

var ctx = new Intl.MessageContext('en-US');
var errors = ctx.addMessages(ftlCode);

times.format = dateNow();
for (let id of ctx.messages.keys()) {
  const message = ctx.messages.get(id);

  ctx.format(message, args, errors);
  if (message.traits) {
    for (let trait of message.traits) {
      ctx.format(trait.val, args, errors)
    }
  }
}
times.formatEnd = dateNow();

var results = {
  parseFTL: micro(times.ftlParseEnd - times.ftlParseStart),
  parseFTLEntries: micro(times.ftlEntriesParseEnd - times.ftlEntriesParseStart),
  format: micro(times.formatEnd - times.format),
};

print(JSON.stringify(results));
