import * as FluentReact from '../src/index';
import LocalizationProvider from '../src/provider';
import Localized from '../src/localized';
import withLocalization from '../src/with_localization';

describe('Exports', () => {
  test('LocalizationProvider', () => {
    expect(FluentReact.LocalizationProvider).toBe(LocalizationProvider);
  });

  test('Localized', () => {
    expect(FluentReact.Localized).toBe(Localized);
  });

  test('withLocalization', () => {
    expect(FluentReact.withLocalization).toBe(withLocalization);
  });
});
