interface StringMap {
    [id: string]: string;
}

interface NegotiateLanguageOptions {
    strategy?: 'filtering' | 'matching' | 'lookup',
    defaultLocale?: string,
    likelySubtags?: StringMap
}

export function negotiateLanguages(
    requestedLocales: ReadonlyArray<string>,
    availableLocales: ReadonlyArray<string>,
    options?: NegotiateLanguageOptions
): string[];

export function acceptedLanguages(
    acceptedLanguages: string
): string[];
