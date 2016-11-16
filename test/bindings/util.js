'use strict';

/* global window, document, assert */

describe('getResourceLinks', function() {
  it('should return an empty array if no l10n links in head', function() {
    const head = document.createElement('head');

    const result = L20n.getResourceLinks(head);

    assert.ok(result.constructor === Map);
    assert.equal(result.size, 0);
  });

  it('should collect all l10n links from head', function() {
    const links = [
      'locales/test.{locale}.l20n',
      '/shared/date/date.{locale}.l20n'];
      const head = document.createElement('head');

      for (const i in links) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'localization');
        link.setAttribute('href', links[i]);
        head.appendChild(link);
      }

      const result = L20n.getResourceLinks(head);

      assert.equal(result.size, 1);

      const main = result.get('main');
      assert.equal(main[0], links[0]);
      assert.equal(main[1], links[1]);
  });
});
