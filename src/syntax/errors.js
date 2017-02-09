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
