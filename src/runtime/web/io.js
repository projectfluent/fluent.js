import { L10nError } from '../../lib/errors';

const HTTP_STATUS_CODE_OK = 200;

function load(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }

    xhr.open('GET', url, true);

    xhr.addEventListener('load', e => {
      if (e.target.status === HTTP_STATUS_CODE_OK ||
          e.target.status === 0) {
        resolve(e.target.response);
      } else {
        reject(new L10nError('Not found: ' + url));
      }
    });
    xhr.addEventListener('error', reject);
    xhr.addEventListener('timeout', reject);

    // the app: protocol throws on 404, see https://bugzil.la/827243
    try {
      xhr.send(null);
    } catch (e) {
      if (e.name === 'NS_ERROR_FILE_NOT_FOUND') {
        // the app: protocol throws on 404, see https://bugzil.la/827243
        reject(new L10nError('Not found: ' + url));
      } else {
        throw e;
      }
    }
  });
}

export function fetchResource(res, { code }) {
  const url = res.replace('{locale}', code);
  return load(url);
}
