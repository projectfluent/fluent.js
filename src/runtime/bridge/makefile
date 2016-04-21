DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup service.js \
	    -f iife \
		-o $(DIST)/l20n-service.js
	rollup client.js \
		-f iife \
		-o $(DIST)/l20n-client.js
