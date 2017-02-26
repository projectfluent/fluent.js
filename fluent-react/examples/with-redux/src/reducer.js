import { negotiateLanguages, MESSAGES_ALL } from './l10n';

const defaultLocale = negotiateLanguages(navigator.language)[0];

export default function reducer(state = {
  locales: [defaultLocale],
  messages: MESSAGES_ALL[defaultLocale]
}, action) {
  switch (action.type) {
    case 'CHANGE_LOCALE':
      const locales = negotiateLanguages(action.value);
      return {
        ...state,
        locales,
        messages: MESSAGES_ALL[locales[0]]
      };
    default:
      return state;
  }
}
