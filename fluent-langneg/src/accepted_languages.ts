function parseAcceptLanguageEntry(entry: string): { lang: string; q: number } {
  const langWithQ = entry.split(";").map(u => u.trim());
  let q = 1.0;
  if (langWithQ.length > 1) {
    const qVal = langWithQ[1].split("=").map(u => u.trim());
    if (qVal.length === 2 && qVal[0].toLowerCase() === "q") {
      const qn = Number(qVal[1]);
      q = isNaN(qn) ? 0.0 : qn;
    }
  }
  return { lang: langWithQ[0], q };
}

export function acceptedLanguages(acceptLanguageHeader = ""): string[] {
  if (typeof acceptLanguageHeader !== "string") {
    throw new TypeError("Argument must be a string");
  }
  const tokens = acceptLanguageHeader
    .split(",")
    .map(t => t.trim())
    .filter(t => t !== "");
  const langsWithQ = Array.from(tokens.map(parseAcceptLanguageEntry).entries());
  // order by q descending, keeping the header order for equal weights
  langsWithQ.sort(([aidx, aval], [bidx, bval]) =>
    aval.q === bval.q ? aidx - bidx : bval.q - aval.q
  );
  return langsWithQ.map(([, val]) => val.lang);
}
