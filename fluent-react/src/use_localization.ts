import { useContext } from "react";
import { FluentContext } from "./context.js";
import { ReactLocalization } from "./localization.js";

export function useLocalization(): { l10n: ReactLocalization } {
  const l10n = useContext(FluentContext);

  if (!l10n) {
    throw new Error(
      "useLocalization was used without wrapping it in a " +
        "<LocalizationProvider />."
    );
  }

  return { l10n };
}
