export default function acceptedLanguages(acceptLanguageHeader = "") {
  if (typeof acceptLanguageHeader !== "string") {
    throw new TypeError("Argument must be a string");
  }
  const tokens = acceptLanguageHeader.split(",").map(t => t.trim());
  const langsWithQ = [];
  tokens.filter(t => t !== "").forEach((t, index) => {
    const langWithQ = t.split(";").map(u => u.trim());
    if (langWithQ[0].length > 0) {
      let q = 1.0;
      if (langWithQ.length > 1) {
        const qVal = langWithQ[1].split("=").map(u => u.trim());
        if (qVal.length === 2 && qVal[0].toLowerCase() === "q") {
          const qn = Number(qVal[1]);
          q = !isNaN(qn) ? qn : q;
        }
      }
      langsWithQ.push({ index: index, lang: langWithQ[0], q });
    }
  });
  // order by q descending, keeping the header order for equal weights
  langsWithQ.sort((a, b) => a.q === b.q ? a.index - b.index : b.q - a.q);
  return langsWithQ.map(t => t.lang);
}
