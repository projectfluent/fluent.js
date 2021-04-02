import React, { Children, useEffect, useState, ReactNode } from "react";

import { negotiateLanguages } from "@fluent/langneg";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider } from "@fluent/react";

// Parcel decorates filenames with cache-busting hashes.
const ftl = require("../public/*.ftl");

const DEFAULT_LOCALE = "en-US";
export const AVAILABLE_LOCALES = {
    "en-US": "English",
    "pl": "Polish",
};

async function fetchMessages(locale: string): Promise<[string, string]> {
    let response = await fetch(ftl[locale]);
    let messages = await response.text();
    return [locale, messages];
}

function* lazilyParsedBundles(fetchedMessages: Array<[string, string]>) {
    for (let [locale, messages] of fetchedMessages) {
        let resource = new FluentResource(messages);
        let bundle = new FluentBundle(locale);
        bundle.addResource(resource);
        yield bundle;
    }
}

interface AppLocalizationProviderProps {
  children: ReactNode;
}

export function AppLocalizationProvider(props: AppLocalizationProviderProps) {
    let [l10n, setL10n] = useState<ReactLocalization | null>(null);

    useEffect(() => {
        changeLocales(navigator.languages as Array<string>);
    }, []);

    async function changeLocales(userLocales: Array<string>) {
        let currentLocales = negotiateLanguages(
            userLocales,
            Object.keys(AVAILABLE_LOCALES),
            { defaultLocale: DEFAULT_LOCALE }
        );

        let fetchedMessages = await Promise.all(
            currentLocales.map(fetchMessages)
        );

        let bundles = lazilyParsedBundles(fetchedMessages);
        setL10n(new ReactLocalization(bundles));
    }

    if (l10n === null) {
        return <div>Loading…</div>;
    }

    return (
        <LocalizationProvider l10n={l10n} changeLocales={changeLocales} initialLocales={navigator.languages}>
            {Children.only(props.children)}
        </LocalizationProvider>
    );
}
