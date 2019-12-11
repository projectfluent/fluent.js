import { createContext } from "react";
import ReactLocalization from "./localization";

export default createContext(new ReactLocalization([]));
