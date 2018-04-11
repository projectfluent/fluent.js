export function elem(name) {
  return function(str) {
    const element = document.createElement(name);
    element.innerHTML = str;
    return element;
  }
}
