import { Resource, parse, serialize } from 'fluent-syntax';

/*
 * Merge text files into one file.
 */
export function mergeFiles(...files) {
  const resources = files.map(parse);
  const merged = resources.reduce(merge);
  return serialize(merged);
}

/*
 * Merge AST trees into one tree.
 */
export function mergeResources(...resources) {
  const merged = resources.reduce(merge);
  return merged;
}

/*
 * Merge messages of two resources.
 *
 * The first resource is treated as the reference. Sections and Junk entries
 * are ignored.
 */
function merge(res1, res2) {
  const body = [];

  for (const message of messages(res1)) {
    const other = findMessage(res2, message.id.name);
    if (other) {
      body.push(other);
    } else {
      body.push(message);
    }
  }

  const merged = new Resource(body, res1.comment);
  merged.source = serialize(merged);

  return merged;
}

/*
 * Find a message in `res` by its `id`.
 */
function findMessage(res, id) {
  for (const message of messages(res)) {
    if (message.id.name === id) {
      return message;
    }
  }

  return null;
}

/*
 * Create an iterator over Resource's messages.
 */
function* messages(res) {
  for (const entry of res.body) {
    if (entry.type === 'Message') {
      yield entry;
    }
  }
}
