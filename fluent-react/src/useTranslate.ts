import { useContext } from "react";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";

/*
* The `useTranslate` hook returns the FluentContext
*/
type useTranslate = () => { l10n: ReactLocalization }
export const useTranslate: useTranslate = () => {
  const l10n = useContext(FluentContext);

  return { l10n };
};

export default useTranslate;
