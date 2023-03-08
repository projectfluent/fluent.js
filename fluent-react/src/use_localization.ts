import { useContext } from "react";
import { FluentContext } from "./context.js";
import { ReactLocalization } from "./localization.js";

/**
 * The `useLocalization` hook returns the FluentContext
 */
type useLocalization = () => { l10n: ReactLocalization };
export const useLocalization: useLocalization = () => {
  const l10n = useContext(FluentContext);

  if (!l10n) {
    throw new Error(
      "useLocalization was used without wrapping it in a " +
        "<LocalizationProvider />."
    );
  }

  return { l10n };
};
