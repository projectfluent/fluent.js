import { useContext } from "react";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";

/*
* The `useLocalization` hook returns the FluentContext
*/
type useLocalization = () => { l10n: ReactLocalization }
export const useLocalization: useLocalization = () => {
  const l10n = useContext(FluentContext);

  return { l10n };
};

export default useLocalization;
