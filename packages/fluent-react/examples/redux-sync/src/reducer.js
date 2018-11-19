export default function reducer(state = {
  userLocales: ['en-US'],
  currentLocales: ['en-US'],
  bundles: null
}, action) {
  switch (action.type) {
    case 'CHANGE_LOCALES': {
      const { userLocales, currentLocales, bundles } = action;
      return {
        ...state,
        userLocales,
        currentLocales,
        bundles
      };
    }
    default:
      return state;
  }
}
