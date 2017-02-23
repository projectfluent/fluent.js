export { default as LocalizationProvider } from './provider';
export { default as LocalizedElement } from './element';

export function negotiate(lang = 'en') {
  const first = lang.split('-')[0];

  switch (first.toLowerCase()) {
    case 'pl':
      return 'pl';
    default:
      return 'en';
  }
}
