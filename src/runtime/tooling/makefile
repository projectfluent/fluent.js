DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup index.js \
	    -f iife \
	    -n L20n \
	    -o $(DIST)/l20n.js
