import { negotiateLanguages } from './l10n';

export default function reducer(state = {
  locales: negotiateLanguages(navigator.language)
}, action) {
  switch (action.type) {
    case 'CHANGE_LOCALE':
      return {
        ...state,
        locales: negotiateLanguages(action.value)
      };
    default:
      return state;
  }
}
