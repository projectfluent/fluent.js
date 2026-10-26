const entryRegexp =
  //      locale     ;    q     = qval
  /(?:^|,)([^,;]+)(?:;\s*[qQ]\s*=([^,;]+))?/g;

export function acceptedLanguages(acceptLanguageHeader = ""): string[] {
  if (typeof acceptLanguageHeader !== "string") {
    throw new TypeError("Argument must be a string");
  }

  const langsWithQ: Array<{ lang: string; q: number; index: number }> = [];
  for (const token of acceptLanguageHeader.matchAll(entryRegexp)) {
    const lang = token[1].trim();
    if (lang === "") {
      continue;
    }
    const q = token[2] ? parseFloat(token[2]) || 0 : 1;
    langsWithQ.push({ lang, q, index: token.index });
  }

  // order by q descending, keeping the header order for equal weights
  langsWithQ.sort((a, b) => (a.q === b.q ? a.index - b.index : b.q - a.q));

  return langsWithQ.map(val => val.lang);
}
