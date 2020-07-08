import React from "react";
import { useLocalization } from "@fluent/react";
import { AVAILABLE_LOCALES } from "./l10n";

export function LanguageSelector() {
    const { changeLocales, currentLocales } = useLocalization()

    return (
        <select
            onChange={event => changeLocales([event.target.value])}
            value={currentLocales[0]}>
            {Object.entries(AVAILABLE_LOCALES).map(
                ([code, name]) => <option key={code} value={code}>{name}</option>
            )}
        </select>
    );
}
