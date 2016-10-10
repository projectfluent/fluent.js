export {
  documentReady as HTMLDocumentReady, getResourceLinks
} from '../web/util';

export function XULDocumentReady() {
  if (document.readyState !== 'uninitialized') {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    document.addEventListener('readystatechange', function onrsc() {
      document.removeEventListener('readystatechange', onrsc);
      resolve();
    });
  });
}
