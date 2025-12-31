import React from "react";
import { createRoot } from "react-dom/client";

import { AppLocalizationProvider } from "./l10n";
import { App } from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(
  <AppLocalizationProvider>
    <App />
  </AppLocalizationProvider>
);
