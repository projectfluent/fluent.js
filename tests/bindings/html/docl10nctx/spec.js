describe('Localization', function() {
  'use strict';
  it('test sentence should be "Test sentence"', function() {
    var node = document.querySelector('[data-l10n-id="test"]');
    expect(node.textContent).toEqual('Test sentence');
  });
});
describe('JS API', function() {
  'use strict';
  it('value from context should be "Test sentence"', function() {
    // TODO where is it defined?
    /* global getEntity: false */
    expect(getEntity('test')).toEqual('Test sentence');
  });
});
