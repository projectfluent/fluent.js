import assert from 'assert';
import { ftl } from './util';

import { parseEntry } from '../src/parser';
import { serializeEntry } from '../src/serializer';


suite('Parse entry', function() {
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

    const message = parseEntry(input)
    assert.deepEqual(message, output)
  });
});


suite('Serialize entry', function() {
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

    const message = serializeEntry(input)
    assert.deepEqual(message, output)
  });
});
