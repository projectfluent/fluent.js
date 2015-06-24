'use strict';

export function serializeEntries(entries) {
  return Object.keys(entries).map(id => {
    return serializeEntry(entries[id], id);
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
