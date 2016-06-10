DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup index.js \
	    -f cjs \
	    -e fs \
	    -o $(DIST)/l20n.js
