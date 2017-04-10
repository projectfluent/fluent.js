import assert from 'assert';
import { join } from 'path';
import { readdir } from 'fs';
import { readfile } from './util';
import { parse } from '../src/parser';

const sigil = '^\/\/~ ';
const reDirective = new RegExp(`${sigil}(.*)[\n$]`, 'gm');

function* directives(source) {
  let match;
  while ((match = reDirective.exec(source)) !== null) {
    yield match[1];
  }
}

export function preprocess(source) {
  return {
    directives: [...directives(source)],
    source: source.replace(reDirective, ''),
  };
}

function getCodeName(code) {
  switch (code[0]) {
    case 'E':
      return `ERROR ${code}`;
    case 'W':
      return `WARNING ${code}`;
    case 'H':
      return `HINT ${code}`;
    default:
      throw new Error('Unknown Annotation code');
  }
}

export function serializeAnnotation(annot) {
  const { code, args, span: { start, end } } = annot;
  const parts = [getCodeName(code)];

  if (start === end) {
    parts.push(`pos ${start}`);
  } else {
    parts.push(`start ${start}`, `end ${end}`);
  }

  if (args.length) {
    const prettyArgs = args.map(arg => `"${arg}"`).join(' ');
    parts.push(`args ${prettyArgs}`);
  }

  return parts.join(', ');
}

function toDirectives(annots, cur) {
  return annots.concat(cur.annotations.map(serializeAnnotation));
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
          const { directives, source } = preprocess(file);
          const expected = directives.join('\n') + '\n';
          const ast = parse(source);
          const actual = ast.body.reduce(toDirectives, []).join('\n') + '\n';
          assert.deepEqual(
            actual, expected,
            'Actual Annotations don\'t match the expected ones'
          );
        });
      });
    }
  });
});
