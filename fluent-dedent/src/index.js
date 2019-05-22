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
 * @returns string
 */
export default function ftl(strings) {
  let lines = strings[0].split("\n");
  let [first, last] = [lines.shift(), lines.pop()];

  if (!RE_BLANK.test(first)) {
    throw new RangeError("Content must start on a new line.");
  }
  if (!RE_BLANK.test(last)) {
    throw new RangeError("Closing delimiter must appear on a new line.");
  }

  let commonIndent = last.length;
  function dedent(line, idx) {
    let indent = line.slice(0, commonIndent);
    if (!RE_BLANK.test(indent)) {
      throw new RangeError(`Insufficient indentation in line ${idx}.`);
    }
    return line.slice(commonIndent);
  }

  return lines.map(dedent).join("\n");
}
