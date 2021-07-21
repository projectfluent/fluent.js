import assert from 'assert';
import translateElement from '../esm/overlay.js';
import {elem} from './index';

suite('Applying translations', function() {
  test('Skipping sanitization for the title element', function() {
    const element = elem('title')``;
    const translation = {
      value: '<input type="text"/> - HTML: Input Element',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '&lt;input type="text"/&gt; - HTML: Input Element'
    );
  });
});
