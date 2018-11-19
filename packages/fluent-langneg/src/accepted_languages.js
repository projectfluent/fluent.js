export default function acceptedLanguages(string = "") {
  if (typeof string !== "string") {
    throw new TypeError("Argument must be a string");
  }
  const tokens = string.split(",").map(t => t.trim());
  return tokens.filter(t => t !== "").map(t => t.split(";")[0]);
}
