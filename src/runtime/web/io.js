import { L10nError } from '../../lib/errors';

const HTTP_STATUS_CODE_OK = 200;

function load(type, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType(type);
    }

    xhr.open('GET', url, true);

    if (type === 'application/json') {
      xhr.responseType = 'json';
    }

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

const io = {
  app: function(code, ver, path, type) {
    switch (type) {
      case 'text':
        return load('text/plain', path);
      case 'json':
        return load('application/json', path);
      default:
        throw new L10nError('Unknown file type: ' + type);
    }
  },
};

export function fetchResource(res, { code, src, ver }) {
  const url = res.replace('{locale}', code);
  const type = res.endsWith('.json') ? 'json' : 'text';
  return io[src](code, ver, url, type);
}
