// attach the L20n singleton to the global object
window.L20n = require('l20n');

// hook up the HTML bindings
require('l20n/gaia');

// close the function defined in build/prefix/microrequire.js
})(window);
