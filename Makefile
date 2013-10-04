MOCHA_OPTS=
REPORTER?=dot
NODE=node
MOCHA=./node_modules/.bin/mocha
JSCOVERAGE=./node_modules/.bin/jscoverage
DOCCO=./node_modules/.bin/docco

SAMPLESIZE?=150
REFERENCE?=tools/perf/reference.json
ifneq ($(JSSHELL),)
BENCHMARK = $(JSSHELL) benchmark.jsshell.js
else 
BENCHMARK = $(NODE) benchmark.node.js
endif


LIB_FILES = \
  tests/lib/parser.js \
  tests/lib/compiler/*.js \
  tests/lib/context/*.js \
  tests/integration/*.js
ifeq ($(INSECURE), 1)
LIB_FILES += tests/lib/compiler/insecure/*.js
endif

BINDINGS?=webl10n

.PHONY: build
build: install-git-hook
	$(NODE) build/Makefile.js $(BINDINGS)

.PHONY: test
test: install-git-hook
	@$(MOCHA) --require should --reporter $(REPORTER) $(LIB_FILES)

.PHONY: watch
watch: install-git-hook
	@$(MOCHA) --require should --reporter min --watch --growl $(LIB_FILES)


.PHONY: reference
reference:
	@$(NODE) ./tools/perf/run $(BENCHMARK) \
        --sample $(SAMPLESIZE) \
        --raw > $(REFERENCE)
	@cat $(REFERENCE)


.PHONY: perf
perf:
ifneq ($(wildcard $(REFERENCE)),)
	@$(NODE) ./tools/perf/run $(BENCHMARK) \
        --sample $(SAMPLESIZE) \
        --compare $(REFERENCE)
else
	@$(NODE) ./tools/perf/run $(BENCHMARK) \
        --sample $(SAMPLESIZE)
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

lint: install-git-hook
	@gjslint --disable 1 --nojsdoc \
	    -r bindings \
	    -r lib \
	    -x lib/l20n/intl.js

.PHONY: install-git-hook
install-git-hook:
	@cp tools/hooks/pre-commit .git/hooks/pre-commit

.PHONY: gh-pages
gh-pages: dist/docs
	./build/gh-pages.sh
