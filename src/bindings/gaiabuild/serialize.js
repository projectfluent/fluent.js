'use strict';

export function serializeEntries(langEntries, sourceEntries) {
  return Object.keys(sourceEntries).map(id => {
    let sourceEntry = sourceEntries[id];
    let langEntry = langEntries[id];
    return (langEntry && areEntityStructsEqual(sourceEntry, langEntry)) ?
      serializeEntry(langEntries[id], id) :
      serializeEntry(sourceEntries[id], id);
  });
}

function serializeEntry(entry, id) {
  if (typeof entry === 'string') {
    return { $i: id, $v: entry };
  }

  let node = {
    $i: entry.id,
  };

  if (entry.value !== null) {
    node.$v = entry.value;
  }

  if (entry.index !== null) {
    node.$x = entry.index;
  }

  for (let key in entry.attrs) {
    node[key] = serializeAttribute(entry.attrs[key]);
  }

  return node;
}

function serializeAttribute(attr) {
  if (typeof attr === 'string') {
    return attr;
  }

  let node = {};

  if (attr.value !== null) {
    node.$v = attr.value;
  }

  if (attr.index !== null) {
    node.$x = attr.index;
  }

  return node;
}

function areEntityStructsEqual(entity1, entity2) {
  let keys1 = Object.keys(entity1);
  let keys2 = Object.keys(entity2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let i = 0; i < keys1.length; i++) {
    if (keys2.indexOf(keys1[i]) === -1) {
      return false;
    }
  }

  return true;
}
