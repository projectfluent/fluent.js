import React, { Children, cloneElement, useEffect, useState } from "react";

import { negotiateLanguages } from "@fluent/langneg";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider } from "@fluent/react";

// Parcel decorates filenames with cache-busting hashes.
import ftl from '../public/*.ftl';

const DEFAULT_LOCALE = "en-US";
const AVAILABLE_LOCALES = {
    "en-US": "English",
    "pl": "Polish",
};

async function fetchMessages(locale) {
    let response = await fetch(ftl[locale]);
    let messages = await response.text();
    return [locale, messages];
}

function* lazilyParsedBundles(fetchedMessages) {
    for (let [locale, messages] of fetchedMessages) {
        let resource = new FluentResource(messages);
        let bundle = new FluentBundle(locale);
        bundle.addResource(resource);
        yield bundle;
    }
}

export function AppLocalizationProvider(props) {
    let [currentLocales, setCurrentLocales] = useState([DEFAULT_LOCALE]);
    let [l10n, setL10n] = useState(null);

    useEffect(() => {
        changeLocales(navigator.languages);
    }, []);

    async function changeLocales(userLocales) {
        let currentLocales = negotiateLanguages(
            userLocales,
            Object.keys(AVAILABLE_LOCALES),
            { defaultLocale: DEFAULT_LOCALE }
        );
        setCurrentLocales(currentLocales);

        let fetchedMessages = await Promise.all(
            currentLocales.map(fetchMessages)
        );

        let bundles = lazilyParsedBundles(fetchedMessages);
        setL10n(new ReactLocalization(bundles));
    }

    if (l10n === null) {
        return <div>Loading…</div>;
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
