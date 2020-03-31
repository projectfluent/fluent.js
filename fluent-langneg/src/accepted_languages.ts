export function acceptedLanguages(str: string = ""): Array<string> {
  if (typeof str !== "string") {
    throw new TypeError("Argument must be a string");
  }
  const tokens = str.split(",").map(t => t.trim());
  return tokens.filter(t => t !== "").map(t => t.split(";")[0]);
}
