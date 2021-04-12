import { createContext } from "react";
import { ReactLocalization } from "./localization";

export let FluentContext =
  createContext(null) as React.Context<ReactLocalization | null>;
