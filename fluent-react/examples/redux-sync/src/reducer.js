import { negotiateLanguages, MESSAGES_ALL } from './l10n';

const defaultLocales = negotiateLanguages(navigator.language);

export default function reducer(state = {
  locales: defaultLocales,
  messages: MESSAGES_ALL[defaultLocales[0]]
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
