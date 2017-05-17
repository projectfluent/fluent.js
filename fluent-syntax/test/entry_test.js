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
      "tags": null,
      "value": {
        "elements": [
          {
            "type": "TextElement",
            "value": "Foo"
          }
        ],
        "type": "Pattern"
      },
      "annotations": [],
      "attributes": null,
      "type": "Message",
      "id": {
        "type": "Identifier",
        "name": "foo"
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
      "tags": null,
      "value": {
        "elements": [
          {
            "type": "TextElement",
            "value": "Foo"
          }
        ],
        "type": "Pattern"
      },
      "annotations": [],
      "attributes": null,
      "type": "Message",
      "id": {
        "type": "Identifier",
        "name": "foo"
      }
    };
    const output = ftl`
      foo = Foo
    `;

    const message = this.serializer.serializeEntry(input)
    assert.deepEqual(message, output)
  });
});
