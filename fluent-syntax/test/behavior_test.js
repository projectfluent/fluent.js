import assert from 'assert';
import { join } from 'path';
import { readdir } from 'fs';
import { readfile } from './util';

import { parse } from '../src/parser';

const sigil = '^\/\/~ ';
const reDirective = new RegExp(`${sigil}(.*)[\n$]`, 'gm');

function toObject(obj, cur) {
  const [key, value] = cur.split(' ').map(tok => tok.trim());
  switch (key.toLowerCase()) {
    case 'error':
    case 'warning':
    case 'hint':
      obj.code = value;
      break
    case 'pos':
      obj.start = parseInt(value, 10);
      obj.end = parseInt(value, 10);
      break
    case 'start':
      obj.start = parseInt(value, 10);
      break
    case 'end':
      obj.end = parseInt(value, 10);
      break
    default:
      throw new Error(`Unknown preprocessor directive field: ${key}`);
  }

  return obj;
}

function* directives(source) {
  let match;
  while ((match = reDirective.exec(source)) !== null) {
    const dirline = match[1];
    const fields = dirline.split(',').map(field => field.trim());
    yield fields.reduce(toObject, {});
  }
}

function preprocess(source) {
  return {
    directives: [...directives(source)],
    source: source.replace(reDirective, ''),
  };
}

function toAnnotations(annots, cur) {
  return annots.concat(
    cur.annotations.map(
      ({code, span}) => ({ code, start: span.start, end: span.end })
    )
  );
}

const fixtures = join(__dirname, 'fixtures_behavior');

readdir(fixtures, function(err, filenames) {
  if (err) {
    throw err;
  }

  const ftlnames = filenames.filter(
    filename => filename.endsWith('.ftl')
  );

  suite('Behavior tests', function() {
    for (const filename of ftlnames) {
      const filepath = join(fixtures, filename);
      test(filename, function() {
        return readfile(filepath).then(file => {
          const { directives: expected, source } = preprocess(file);
          const ast = parse(source);
          const annotations = ast.body.reduce(toAnnotations, []);
          assert.deepEqual(
            annotations, expected,
            'Actual Annotations don\'t match the expected ones'
          );
        });
      });
    }
  });
});
