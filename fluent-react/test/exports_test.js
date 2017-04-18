import assert from 'assert';
import * as FluentReact from '../src/index';
import LocalizationProvider from '../src/provider';
import Localized from '../src/localized';

suite('Exports', () => {
  test('LocalizationProvider', () => {
    assert.equal(FluentReact.LocalizationProvider, LocalizationProvider);
  });

  test('Localized', () => {
    assert.equal(FluentReact.Localized, Localized);
  });
});
