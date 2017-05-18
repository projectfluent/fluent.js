
export default function aceptedLanguages(string = '') {
  if (typeof string !== 'string') {
    throw new TypeError('Argument must be a string');
  }
  const tokens = string.split(',').map(t => t.trim());
  return tokens.filter(t => t !== '').map(t => {
    return t.split(';')[0];
  });
}
