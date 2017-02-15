export function error(ps, message) {
  const err = new SyntaxError(message);
  err.lineNumber = ps.getLineNumber();
  err.columnNumber = ps.getColumnNumber();
  return err;
}

export function getErrorSlice(source, start, end) {
  const len = source.length;

  let startPos;
  let sliceLen = end - start;

  if (len < sliceLen) {
    startPos = 0;
    sliceLen = len;
  } else if (start + sliceLen >= len) {
    startPos = len - sliceLen - 1;
  } else {
    startPos = start;
  }

  return startPos > 0 ?
    source.substr(startPos - 1, sliceLen) :
    source.substr(0, sliceLen);
}

function getLineNum(source, pos) {
  let ptr = 0;
  let i = 0;

  const lines = source.split('\n');

  for (const line of lines) {
    const lnlen = line.length;
    ptr += lnlen + 1;

    if (ptr > pos) {
      break;
    }
    i += 1;
  }

  return i;
}

function getErrorLines(source, start, end) {
  const l = start < end ? end - start : 1;

  const lines = source.split('\n').slice(start, start + l);

  return lines.join('\n').trimRight();
}

export function getErrorInfo(source, pos, entryStart, nextEntryStart) {
  const firstLineNum = getLineNum(source, entryStart);
  const nextEntryLine = getLineNum(source, nextEntryStart);

  const slice = getErrorLines(source, firstLineNum, nextEntryLine);

  return {
    slice: slice,
    line: firstLineNum + 1,
    pos: pos - entryStart
  };
}
