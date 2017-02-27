import { negotiateAvailable } from './l10n';

export default function reducer(state = {
  locales: negotiateAvailable(navigator.languages)
}, action) {
  switch (action.type) {
    case 'CHANGE_LOCALE':
      return {
        ...state,
        locales: negotiateAvailable([action.value])
      };
    default:
      return state;
  }
}
