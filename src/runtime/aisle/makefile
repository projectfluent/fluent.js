DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup index.js \
	    -f amd \
	    -o $(DIST)/l20n.js
