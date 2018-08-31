export default function reducer(state = {
  isFetching: false,
  userLocales: ['en-US'],
  currentLocales: ['en-US'],
  bundles: null
}, action) {
  switch (action.type) {
    case 'CHANGE_LOCALES_REQUEST': {
      return {
        ...state,
        isFetching: true
      };
    }
    case 'CHANGE_LOCALES_RESPONSE': {
      const { userLocales, currentLocales, bundles } = action;
      return {
        ...state,
        isFetching: false,
        userLocales,
        currentLocales,
        bundles
      };
    }
    default:
      return state;
  }
}
