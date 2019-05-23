// A blank line may contain spaces and tabs.
const RE_BLANK = /^[ \t]*$/;

/**
 * Template literal tag for dedenting Fluent code.
 *
 * Strip the indent of the last line from each line of the input. Remove the
 * first and the last line from the output. The snippet must start on a new
 * line and it must end on a line of its own, with the closing delimiter on a
 * next line.
 *
 * @param {Array<string>} strings
 * @param {...any} values
 * @returns string
 */
export default function ftl(strings, ...values) {
  let code = strings.reduce((acc, cur) => acc + values.shift() + cur);
  let lines = code.split("\n");
  let [first, commonIndent] = [lines.shift(), lines.pop()];

  if (!RE_BLANK.test(first)) {
    throw new RangeError("Content must start on a new line.");
  }
  if (!RE_BLANK.test(commonIndent)) {
    throw new RangeError("Closing delimiter must appear on a new line.");
  }

  function dedent(line, idx) {
    let lineIndent = line.slice(0, commonIndent.length);
    if (lineIndent.length === 0) {
      // Empty blank lines are preserved even if technically they are not
      // indented at all. This also short-circuits the dedentation logic when
      // commonIndent.length is 0, i.e. when all indents should be kept.
      return line;
    }
    if (lineIndent !== commonIndent) {
      // The indentation of the line must match commonIndent exacty.
      throw new RangeError(`Insufficient indentation in line ${idx}.`);
    }
    // Strip commonIndent.
    return line.slice(commonIndent.length);
  }

  return lines.map(dedent).join("\n");
}
