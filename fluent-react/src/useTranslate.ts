import { useContext } from "react";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";

// Implementation of null object pattern for ReactLocalization
const fallbackL10n: ReactLocalization = {
  getString: id => id,
  getBundle: () => null,
  bundles: [],
  parseMarkup: null,
  reportError: () => undefined,
};

/*
* The `useTranslate` hook returns the FluentContext
*/
type useTranslate = () => { l10n: ReactLocalization }
export const useTranslate: useTranslate = () => {
  const l10n = useContext(FluentContext);

  if (!l10n) {
    return { l10n: fallbackL10n };
  }

  return { l10n };
};

export default useTranslate;
