import { createContext } from "react";
import ReactLocalization from "./localization";

export default createContext({
  l10n: new ReactLocalization([]),
  parseMarkup: null
});
