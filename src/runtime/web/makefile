DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup index.js \
	    -c ./rollup.config.js \
	    -o $(DIST)/l20n.js
