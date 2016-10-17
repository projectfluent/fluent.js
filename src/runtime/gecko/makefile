DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup IntlMessageContext.jsm \
		-c ./xpcom.rollup.config.js \
		-o $(DIST)/IntlMessageContext.jsm
	rollup l20n.js \
		-c ./rollup.config.js \
		-o $(DIST)/l20n.js
	rollup l20n-chrome-xbl.js \
		-c ./rollup.config.js \
		-o $(DIST)/l20n-chrome-xbl.js
	rollup l20n-content-html.js \
		-c ./rollup.config.js \
		-o $(DIST)/l20n-content-html.js
