import { useContext } from "react";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";

/*
* The `useLocalization` hook returns the FluentContext
*/
type useLocalization = () => { l10n: ReactLocalization, changeLocales: (locales: string[]) => void, currentLocales: string[] }
export const useLocalization: useLocalization = () => {
  const { l10n, changeLocales, currentLocales } = useContext(FluentContext);

  return { l10n, changeLocales, currentLocales };
};
