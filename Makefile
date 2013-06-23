MOCHA_OPTS=
REPORTER?=dot
NODE=node
MOCHA=./node_modules/.bin/mocha
JSCOVERAGE=./node_modules/.bin/jscoverage
DOCCO=./node_modules/.bin/docco

SAMPLESIZE?=500
REFERENCE?=tools/perf/reference.json
LIB_FILES = \
  tests/lib/*.js \
  tests/lib/context/*.js \
  tests/lib/compiler/*.js \
  tests/integration/*.js

BINDINGS?=html

.PHONY: build
build:
	$(NODE) build/Makefile.js $(BINDINGS)

.PHONY: test
test:
	@$(MOCHA) --require should --reporter $(REPORTER) $(LIB_FILES)

.PHONY: watch
watch:
	@$(MOCHA) --require should --reporter min --watch --growl $(LIB_FILES)


.PHONY: reference
reference:
	@$(NODE) ./tools/perf --sample $(SAMPLESIZE) --raw > $(REFERENCE)
	@cat $(REFERENCE)


.PHONY: perf
perf:
ifneq ($(wildcard $(REFERENCE)),)
	@$(NODE) ./tools/perf --sample $(SAMPLESIZE) --compare $(REFERENCE)
else
	@$(NODE) ./tools/perf --sample $(SAMPLESIZE)
endif

.PHONY: coverage
coverage: build/cov
	@mkdir -p dist/docs
	@L20N_COV=1 $(MAKE) test REPORTER=html-cov > dist/docs/coverage.html

build/cov: lib 
	@rm -rf build/cov
	@mkdir build/cov
	@$(JSCOVERAGE) lib build/cov/lib

.PHONY: docs
docs: lib bindings
	@mkdir -p dist/docs
	$(DOCCO) --output dist/docs/lib lib/*.js \
	                                lib/l20n/*.js \
		                            lib/l20n/platform/*.js
	$(DOCCO) --output dist/docs/lib/client lib/client/l20n/platform/*.js
	$(DOCCO) --output dist/docs/bindings bindings/l20n/*.js
	@touch dist/docs

.PHONY: gh-pages
gh-pages: dist/docs
	./build/gh-pages.sh
