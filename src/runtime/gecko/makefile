DIST := $(CURDIR)/../../../dist/bundle/$(shell basename $(CURDIR))

build:
	rollup IntlMessageContext.jsm \
    -c ./xpcom.rollup.config.js \
		-o $(DIST)/IntlMessageContext.jsm
	rollup l20n-content-html.js \
		-c ./rollup.config.js \
		-o $(DIST)/l20n-content-html.js
	rollup l20n-chrome-html.js \
		-c ./rollup.config.js \
		-o $(DIST)/l20n-chrome-html.js
	rollup l20n-chrome-xul.js \
		-c ./rollup.config.js \
		-o $(DIST)/l20n-chrome-xul.js
	rollup l20n-chrome-xbl.js \
		-c ./rollup.config.js \
		-o $(DIST)/l20n-chrome-xbl.js
