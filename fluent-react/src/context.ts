import { Context, createContext } from "react";
import { ReactLocalization } from "./localization.js";

export let FluentContext =
  createContext(null) as Context<ReactLocalization | null>;
