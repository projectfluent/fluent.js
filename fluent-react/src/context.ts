import { createContext } from "react";
import { ReactLocalization } from "./localization";

export let FluentContext = createContext(new ReactLocalization([], null));
