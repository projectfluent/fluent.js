export { documentReady, getResourceLinks } from '../web/util';

export function getXULResourceLinks(doc) {
  return Array.prototype.map.call(
    doc.querySelectorAll('messagebundle'),
    el => el.getAttribute('src'));
}
