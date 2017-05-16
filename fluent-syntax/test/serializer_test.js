import assert from 'assert';
import { ftl } from './util';

import { parse, serialize } from '../src';


function pretty(text) {
  const res = parse(text);
  return serialize(res);
}

suite('Serializer', function() {
  test('simple message', function() {
    const input = ftl`
      foo = Foo
    `;
    assert.equal(pretty(input), input);
  });

  test('two simple messages', function() {
    const input = ftl`
      foo = Foo
      bar = Bar
    `;
    assert.equal(pretty(input), input);
  });

  test('simple multiline message', function() {
    const input = ftl`
      foo =
          Foo
          Bar
    `;
    assert.equal(pretty(input), input);
  });

  test('message reference', function() {
    const input = ftl`
      foo = Foo { bar }
    `;
    assert.equal(pretty(input), input);
  });

  test('external argument', function() {
    const input = ftl`
      foo = Foo { $bar }
    `;
    assert.equal(pretty(input), input);
  });

  test('number element', function() {
    const input = ftl`
      foo = Foo { 1 }
    `;
    assert.equal(pretty(input), input);
  });

  test('string element', function() {
    const input = ftl`
      foo = Foo { "bar" }
    `;
    assert.equal(pretty(input), input);
  });

  test('variant expression', function() {
    const input = ftl`
      foo = Foo { bar[baz] }
    `;
    assert.equal(pretty(input), input);
  });

  test('attribute expression', function() {
    const input = ftl`
      foo = Foo { bar.baz }
    `;
    assert.equal(pretty(input), input);
  });

  test('section', function() {
    const input = ftl`
      foo = Foo


      [[ Section Header ]]

      bar = Bar
    `;
    assert.equal(pretty(input), input);
  });

  test('resource comment', function() {
    const input = ftl`
      // A multiline
      // resource comment.

      foo = Foo
    `;
    assert.equal(pretty(input), input);
  });

  test('message comment', function() {
    const input = ftl`
      // A multiline
      // message comment.
      foo = Foo
    `;
    assert.equal(pretty(input), input);
  });

  test('section comment', function() {
    const input = ftl`
      foo = Foo


      // A multiline
      // section comment.
      [[ Section Header ]]

      bar = Bar
    `;
    assert.equal(pretty(input), input);
  });

  test('multiline with placeable', function() {
    const input = ftl`
      foo =
          Foo { bar }
          Baz
    `;
    assert.equal(pretty(input), input);
  });

  test('tag', function() {
    const input = ftl`
      foo = Foo
          #tag
    `;
    assert.equal(pretty(input), input);
  });

  test('multiple tag', function() {
    const input = ftl`
      foo = Foo
          #tag1
          #tag2
    `;
    assert.equal(pretty(input), input);
  });

  test('messages with tags', function() {
    const input = ftl`
      foo = Foo
          #tag1
      bar = Bar
          #tag2
    `;
    assert.equal(pretty(input), input);
  });

  test('attribute', function() {
    const input = ftl`
      foo
          .attr = Foo Attr
    `;
    assert.equal(pretty(input), input);
  });

  test('multiline attribute', function() {
    const input = ftl`
      foo
          .attr =
              Foo Attr
              Continued
    `;
    assert.equal(pretty(input), input);
  });

  test('two attribute', function() {
    const input = ftl`
      foo
          .attr-a = Foo Attr A
          .attr-b = Foo Attr B
    `;
    assert.equal(pretty(input), input);
  });

  test('value and attributes', function() {
    const input = ftl`
      foo = Foo Value
          .attr-a = Foo Attr A
          .attr-b = Foo Attr B
    `;
    assert.equal(pretty(input), input);
  });

  test('multiline value and attributes', function() {
    const input = ftl`
      foo =
          Foo Value
          Continued
          .attr-a = Foo Attr A
          .attr-b = Foo Attr B
    `;
    assert.equal(pretty(input), input);
  });

  test('select expression without selector', function() {
    const input = ftl`
      foo = {
             *[a] A
              [b] B
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('select expression', function() {
    const input = ftl`
      foo = { sel ->
             *[a] A
              [b] B
          }
    `;
    assert.equal(pretty(input), input);
  });

  // XXX Parsing Error
  test.skip('multiline variant with first line inline', function() {
    const input = ftl`
      foo = {
             *[a] AAA
                  BBB
          }
    `;
    assert.equal(pretty(input), input);
  });

  // XXX Parsing Error
  test.skip('multiline variant', function() {
    const input = ftl`
      foo = {
             *[a]
                 AAA
                 BBB
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('variant key words', function() {
    const input = ftl`
      foo = {
             *[a b c] A B C
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('variant key number', function() {
    const input = ftl`
      foo = {
             *[1] 1
          }
    `;
    assert.equal(pretty(input), input);
  });

  // XXX The Serializer doesn't know te value is multiline
  test.skip('select expression in simple multiline value', function() {
    const input = ftl`
      foo =
          Foo { sel ->
             *[a] A
              [b] B
          }
    `;
    assert.equal(pretty(input), input);
  });

  // XXX None of the Text elements contain a new-line, so the serializer outputs
  // a single-line value.
  test('select expression in simple multiline value (current)', function() {
    const input = ftl`
      foo =
          Foo { sel ->
             *[a] A
              [b] B
          }
    `;
    const output = ftl`
      foo = Foo { sel ->
             *[a] A
              [b] B
          }
    `;
    assert.equal(pretty(input), output);
  });

  test('select expression in multiline value', function() {
    const input = ftl`
      foo =
          Foo
          Bar { sel ->
             *[a] A
              [b] B
          }
    `;
    assert.equal(pretty(input), input);
  });

  // XXX Parsing Error
  test.skip('nested select expression', function() {
    const input = ftl`
      foo = { sel_a ->
             *[a] { sel_b ->
                 *[b] Foo
              }
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('selector message reference', function() {
    const input = ftl`
      foo = { bar ->
             *[a] A
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('selector external argument', function() {
    const input = ftl`
      foo = { $bar ->
             *[a] A
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('selector number expression', function() {
    const input = ftl`
      foo = { 1 ->
             *[a] A
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('selector string expression', function() {
    const input = ftl`
      foo = { "bar" ->
             *[a] A
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('selector variant expression', function() {
    const input = ftl`
      foo = { bar[baz] ->
             *[a] A
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('selector attribute expression', function() {
    const input = ftl`
      foo = { bar.baz ->
             *[a] A
          }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression', function() {
    const input = ftl`
      foo = { FOO() }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with string expression', function() {
    const input = ftl`
      foo = { FOO("bar") }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with number expression', function() {
    const input = ftl`
      foo = { FOO(1) }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with message reference', function() {
    const input = ftl`
      foo = { FOO(bar) }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with external argument', function() {
    const input = ftl`
      foo = { FOO($bar) }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with number named argument', function() {
    const input = ftl`
      foo = { FOO(bar: 1) }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with string named argument', function() {
    const input = ftl`
      foo = { FOO(bar: "bar") }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with two positional arguments', function() {
    const input = ftl`
      foo = { FOO(bar, baz) }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with two named arguments', function() {
    const input = ftl`
      foo = { FOO(bar: "bar", baz: "baz") }
    `;
    assert.equal(pretty(input), input);
  });

  test('call expression with positional and named arguments', function() {
    const input = ftl`
      foo = { FOO(bar, baz: "baz", 1) }
    `;
    assert.equal(pretty(input), input);
  });
});
