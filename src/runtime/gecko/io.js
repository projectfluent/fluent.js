import { L10nError } from '../../lib/errors';

const HTTP_STATUS_CODE_OK = 200;

function load(url) {
  return new Promise((resolve) => {
    const req = Components.classes['@mozilla.org/xmlextras/xmlhttprequest;1']
                      .createInstance(Ci.nsIXMLHttpRequest)

    req.mozBackgroundRequest = true;
    req.overrideMimeType('text/plain');
    req.open('GET', url, true);

    req.addEventListener('load', () => {
      if (req.status === HTTP_STATUS_CODE_OK) {
        resolve(req.responseText);
      } else {
        reject(new L10nError('Not found: ' + url));
      }
    });
    xhr.addEventListener('error', reject);
    xhr.addEventListener('timeout', reject);

    req.send(null);
  });
}

export function fetchResource(res, lang) {
  const url = res.replace('{locale}', lang);
  return load(url).catch(e => e);
}
