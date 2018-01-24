import assert from 'assert';
import { ftl } from './util';

import { FluentParser, FluentSerializer } from '../src';


suite('Serialize resource', function() {
  let pretty;

  setup(function() {
    const parser = new FluentParser();
    const serializer = new FluentSerializer({
      withJunk: false
    });

    pretty = function pretty(text) {
      const res = parser.parse(text);
      return serializer.serialize(res);
    }
  });

  test('invalid resource', function() {
    const serializer = new FluentSerializer();
    assert.throws(
      () => serializer.serialize(null),
      /Cannot read property 'type'/
    );
    assert.throws(
      () => serializer.serialize({}),
      /Unknown resource type/
    );
  });

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

  test('resource comment', function() {
    const input = ftl`
      ### A multiline
      ### resource comment.

      foo = Foo
    `;
    assert.equal(pretty(input), input);
  });

  test('message comment', function() {
    const input = ftl`
      # A multiline
      # message comment.
      foo = Foo
    `;
    assert.equal(pretty(input), input);
  });

  test('group comment', function() {
    const input = ftl`
      foo = Foo

      ## Comment Header
      ##
      ## A multiline
      ## section comment.

      bar = Bar
    `;
    assert.equal(pretty(input), input);
  });

  test('standalone comment', function() {
    const input = ftl`
      foo = Foo

      # A Standalone Comment

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
      foo = { $sel ->
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
          Foo { $sel ->
             *[a] A
              [b] B
          }
    `;
    const output = ftl`
      foo = Foo { $sel ->
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
          Bar { $sel ->
             *[a] A
              [b] B
          }
    `;
    assert.equal(pretty(input), input);
  });

  // XXX Parsing Error
  test.skip('nested select expression', function() {
    const input = ftl`
      foo = { $a ->
             *[a] { $b ->
                 *[b] Foo
              }
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

  test('selector attribute expression', function() {
    const input = ftl`
      foo = { -bar.baz ->
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

suite('Serialize expression', function() {
  let pretty;

  setup(function() {
    const parser = new FluentParser();
    const serializer = new FluentSerializer({
      withJunk: false
    });

    pretty = function pretty(text) {
      const {value: {elements: [placeable]}} = parser.parseEntry(text);
      return serializer.serializeExpression(placeable.expression);
    }
  });

  test('invalid expression', function() {
    const serializer = new FluentSerializer();
    assert.throws(
      () => serializer.serializeExpression(null),
      /Cannot read property 'type'/
    );
    assert.throws(
      () => serializer.serializeExpression({}),
      /Unknown expression type/
    );
  });

  test('string expression', function() {
    const input = ftl`
      foo = { "str" }
    `;
    assert.equal(pretty(input), '"str"');
  });

  test('number expression', function() {
    const input = ftl`
      foo = { 3 }
    `;
    assert.equal(pretty(input), '3');
  });

  test('message reference', function() {
    const input = ftl`
      foo = { msg }
    `;
    assert.equal(pretty(input), 'msg');
  });

  test('external argument', function() {
    const input = ftl`
      foo = { $ext }
    `;
    assert.equal(pretty(input), '$ext');
  });

  test('attribute expression', function() {
    const input = ftl`
      foo = { msg.attr }
    `;
    assert.equal(pretty(input), 'msg.attr');
  });

  test('variant expression', function() {
    const input = ftl`
      foo = { -msg[variant] }
    `;
    assert.equal(pretty(input), '-msg[variant]');
  });

  test('call expression', function() {
    const input = ftl`
      foo = { BUILTIN(3.14, kwarg: "value") }
    `;
    assert.equal(pretty(input), 'BUILTIN(3.14, kwarg: "value")');
  });

  test('select expression', function() {
    const input = ftl`
      foo =
          { $num ->
              *[one] One
          }
    `;
    assert.equal(pretty(input), '$num ->\n   *[one] One\n');
  });
});
