export default function reducer(state = {
  userLocales: ['en-US'],
  currentLocales: ['en-US'],
  messages: null
}, action) {
  switch (action.type) {
    case 'CHANGE_LOCALES': {
      const { userLocales, currentLocales, messages } = action;
      return {
        ...state,
        userLocales,
        currentLocales,
        messages
      };
    }
    default:
      return state;
  }
}
