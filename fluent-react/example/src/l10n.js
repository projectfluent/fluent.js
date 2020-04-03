import React, { Children, cloneElement, useEffect, useState } from "react";

import { negotiateLanguages } from "@fluent/langneg";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider } from "@fluent/react";

const MESSAGES_ALL = {
    "pl": `
hello = Cześć { $userName }!
hello-no-name = Witaj nieznajomy!
type-name =
    .placeholder = Twoje imię

today-date = Dziś jest {$date}.
current = Bieżący język: { $locale }
change = Zmień na { $locale }

sign-in-or-cancel = <signin>Zaloguj</signin> albo <cancel>anuluj</cancel>.
clicked-sign-in = Brawo!
clicked-cancel = OK, nieważne.
`,
    "en-US": `
hello = Hello, { $userName }!
hello-no-name = Hello, stranger!
type-name =
    .placeholder = Your name

today-date = Today is {$date}.
today-time = It's {$date}.
change-locale = Change language: <select></select>

sign-in-or-cancel = <signin>Sign in</signin> or <cancel>cancel</cancel>.
clicked-sign-in = You are now signed in.
clicked-cancel = OK, nevermind.
`,
};

export function* generateBundles(currentLocales) {
    for (let locale of currentLocales) {
        let bundle = new FluentBundle(locale);
        bundle.addResource(new FluentResource(MESSAGES_ALL[locale]));
        yield bundle;
    }
}

const DEFAULT_LOCALE = "en-US";
const AVAILABLE_LOCALES = {
    "en-US": "English",
    "pl": "Polish",
};

export function AppLocalizationProvider(props) {
    let [currentLocales, setCurrentLocales] = useState([DEFAULT_LOCALE]);
    let [l10n, setL10n] = useState(new ReactLocalization([]));

    useEffect(() => {
        changeLocales(navigator.languages);
    }, []);

    function changeLocales(userLocales) {
        let currentLocales = negotiateLanguages(
            userLocales,
            Object.keys(AVAILABLE_LOCALES),
            { defaultLocale: DEFAULT_LOCALE }
        );
        setCurrentLocales(currentLocales);

        let bundles = generateBundles(currentLocales);
        setL10n(new ReactLocalization(bundles));
    }

    return <LocalizationProvider l10n={l10n}>
        { cloneElement(
            Children.only(props.children),
            {LocaleSelect: <LocaleSelect
                currentLocales={currentLocales}
                changeLocales={changeLocales} />}
        )}
    </LocalizationProvider>;
}

function LocaleSelect(props) {
    return <select
        onChange={event => props.changeLocales([event.target.value])}
        value={props.currentLocales[0]}>
        {Object.entries(AVAILABLE_LOCALES).map(
            ([code, name]) => <option key={code} value={code}>{name}</option>
        )}
    </select>;
}
