import assert from 'assert';
import * as FluentReact from '../src/index';
import LocalizationProvider from '../src/provider';
import Localized from '../src/localized';
import withLocalization from '../src/with_localization';
import ReactLocalization, { isReactLocalization } from '../src/localization';

suite('Exports', () => {
  test('LocalizationProvider', () => {
    assert.equal(FluentReact.LocalizationProvider, LocalizationProvider);
  });

  test('Localized', () => {
    assert.equal(FluentReact.Localized, Localized);
  });

  test('withLocalization', () => {
    assert.equal(FluentReact.withLocalization, withLocalization);
  });

  test('ReactLocalization', () => {
    assert.equal(FluentReact.ReactLocalization, ReactLocalization);
  });

  test('isReactLocalization', () => {
    assert.equal(FluentReact.isReactLocalization, isReactLocalization);
  });
});
