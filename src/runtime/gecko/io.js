const { classes: Cc, interfaces: Ci } = Components;

export const resIndex = {
  '/global/aboutSupport.ftl': {
    'en-US': [
      'chrome://global/locale/aboutSupport.en-US.ftl',
    ],
    'pl': [
      'chrome://global/locale/aboutSupport.pl.ftl',
    ]
  },
  '/branding/brand.ftl': {
    'en-US': [
      'chrome://branding/locale/brand.en-US.ftl',
    ],
    'pl': [
      'chrome://branding/locale/brand.pl.ftl',
    ]
  },
  '/global/resetProfile.ftl': {
    'en-US': [
      'chrome://global/locale/resetProfile.en-US.ftl',
    ],
    'pl': [
      'chrome://global/locale/resetProfile.pl.ftl',
    ]
  },
  '/browser/aboutDialog.ftl': {
    'en-US': [
      'chrome://browser/locale/aboutDialog.en-US.ftl',
    ],
    'pl': [
      'chrome://browser/locale/aboutDialog.pl.ftl',
    ]
  },
};


const HTTP_STATUS_CODE_OK = 200;

function load(url) {
  return new Promise((resolve, reject) => {
    const req = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
      .createInstance(Ci.nsIXMLHttpRequest);

    req.mozBackgroundRequest = true;
    req.overrideMimeType('text/plain');
    req.open('GET', url, true);

    req.addEventListener('load', () => {
      if (req.status === HTTP_STATUS_CODE_OK) {
        resolve(req.responseText);
      } else {
        reject(new Error('Not found: ' + url));
      }
    });
    req.addEventListener('error', reject);
    req.addEventListener('timeout', reject);

    req.send(null);
  });
}

export function fetchResource(resId, lang) {
  const url = resIndex[resId][lang][0];
  return load(url).catch(e => e);
}
