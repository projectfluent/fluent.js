Setting up L20n for development
===============================

Cloning
-------

    git clone https://github.com/l20n/l20n.js.git


Running tests
-------------

    make test
    make watch


Serverside L20n in Node.js (using npm)
--------------------------------------

In your l20n.js clone:

    sudo npm link
    cd ../some/other/project
    npm link l20n

In your other project you can now require L20n:

    var L20n = require('l20n');
    var ctx = L20n.getContext();


Clientside L20n for Development
-------------------------------

If you want to hack on L20n locally, you don't have to `make build` after every 
edit.  L20n follows the AMD naming scheme and can be used with module loaders 
like [RequireJS][].

[RequireJS]: http://requirejs.org/

```html
<script src="require.js"></script>
<script>
  require.config({ 
    baseUrl: '../path/to/lib/', // tell RequireJS where to look for L20n
    paths: {
      'l20n/platform': 'client/l20n/platform'
    }
  });
  require(['l20n'], function(L20n) {
    var ctx = L20n.getContext();
    // write the rest of your code here
  });
</script> 
```


Clientside L20n with HTML Bindings for Development
--------------------------------------------------

If you want to hack on L20n locally, you don't have to `make build` after every 
edit.  L20n follows the AMD naming scheme and can be used with module loaders 
like [RequireJS][].

[RequireJS]: http://requirejs.org/

```html
<script src="require.js"></script>
<script>
  require.config({ 
    baseUrl: '../path/to/lib/', // tell RequireJS where to look for L20n
    paths: {
      'l20n/platform': 'client/l20n/platform',
      'l20n/html': '../bindings/l20n/html',
    }
  });
  require(['l20n/html'], function(L20n) {
    // l20n/html also exports the L20n singleton, similar to the l20n module
    var ctx = L20n.getContext();
  });

  // or, if you don't need to execute a callback
  require(['l20n/html']);

</script> 
```
