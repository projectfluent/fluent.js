DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup index.js \
	    -f iife \
	    -o $(DIST)/l20n.js
	rollup api.js \
	    -f cjs \
	    -o $(DIST)/l20n-common.js
