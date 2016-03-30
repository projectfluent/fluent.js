
function toEntries([entries, curSection], entry) {
  if (entry.type === 'Section') {
    return [entries, entry.name];
  }

  if (curSection && !entry.ns) {
    entry.ns = curSection;
  }

  return [
    Object.assign(entries, {
      [getId(entry)]: transformEntity(entry)
    }),
    curSection
  ];
}

function transformEntity(entity) {
  return entity.value.source;
}

function getId(entry) {
  if (entry.id.namespace) {
    return `${entry.id.namespace}:${entry.id.name}`;
  }
  return entry.id.name;
}

export function createEntriesFromAST(ast) {
  const [entries] = ast.body
    .filter(entry => entry.type === 'Entity' || entry.type === 'Section')
    .reduce(toEntries, [{}, null]);
  return entries;
}
