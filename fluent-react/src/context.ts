import { createContext } from "react";
import { ReactLocalization } from "./localization";

const defaultValue = {
  l10n: new ReactLocalization([], null),
  changeLocales: (_changeLocales: string[]) => undefined as void,
  currentLocales: [] as string[],
};

export let FluentContext = createContext(defaultValue);
