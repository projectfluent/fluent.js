import assert from 'assert';
import { ftl } from './util';

import { FluentParser, FluentSerializer } from '../src';

suite('Parse entry', function() {
  setup(function() {
    this.parser = new FluentParser();
  });

  test('simple message', function() {
    const input = ftl`
      foo = Foo
    `;
    const output = {
      "comment": null,
      "span": {
        "start": 0,
        "end": 9,
        "type": "Span"
      },
      "value": {
        "elements": [
          {
            "type": "TextElement",
            "value": "Foo",
            "span": {
              "start": 6,
              "end": 9,
              "type": "Span"
            }
          }
        ],
        "type": "Pattern",
        "span": {
          "start": 6,
          "end": 9,
          "type": "Span"
        }
      },
      "annotations": [],
      "attributes": [],
      "type": "Message",
      "id": {
        "type": "Identifier",
        "name": "foo",
        "span": {
          "start": 0,
          "end": 3,
          "type": "Span"
        }
      }
    };

    const message = this.parser.parseEntry(input)
    assert.deepEqual(message, output)
  });
});


suite('Serialize entry', function() {
  setup(function() {
    this.serializer = new FluentSerializer();
  });

  test('simple message', function() {
    const input = {
      "comment": null,
      "span": {
        "start": 0,
        "end": 9,
        "type": "Span"
      },
      "value": {
        "elements": [
          {
            "type": "TextElement",
            "value": "Foo"
          }
        ],
        "type": "Pattern",
        "span": {
          "start": 6,
          "end": 9,
          "type": "Span"
        }
      },
      "annotations": [],
      "attributes": [],
      "type": "Message",
      "id": {
        "type": "Identifier",
        "name": "foo",
        "span": {
          "start": 0,
          "end": 3,
          "type": "Span"
        }
      }
    };
    const output = ftl`
      foo = Foo
    `;

    const message = this.serializer.serializeEntry(input)
    assert.deepEqual(message, output)
  });
});
