DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup index.js \
	    -f cjs \
	    -e fs,string.prototype.startswith,string.prototype.endswith \
	    -o $(DIST)/l20n.js
