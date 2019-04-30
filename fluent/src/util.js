const RE_NOT_BLANK = /\S/;
const RE_INDENTION = /^\s*/;

/**
 * Template literal tag for dedenting FTL code.
 *
 * Calculate the common indent of non-blank lines. Then, trim it from the front
 * of all lines. Blank lines with whitespace characters in them are trimmed
 * too. If they're shorter than the common indent, only the line break is kept.
 *
 * @param {Array<string>} strings
 * @returns string
 */
export function ftl([code]) {
  let indents = code
    .split("\n")
    .filter(line => RE_NOT_BLANK.test(line))
    .map(line => RE_INDENTION.exec(line)[0].length);
  let commonLength = Math.min(...indents);
  let commonIndent = new RegExp(`^[ \\t]{0,${commonLength}}`, "gm");
  return code.replace(commonIndent, "");
}
