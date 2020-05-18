PACKAGE := @fluent/react
GLOBAL  := FluentReact
JEST    ?= node_modules/.bin/jest

include ../common.mk

lint:
	@$(ESLINT) --config $(ROOT)/eslint_ts.json --max-warnings 0 src/*.ts
	@$(ESLINT) --config $(ROOT)/eslint_test.json --max-warnings 0 test/
	@echo -e " $(OK) lint"

.PHONY: compile
compile: esm/.compiled

esm/.compiled: $(SOURCES)
	@$(TSC)
	@touch $@
	@echo -e " $(OK) esm/ compiled"

.PHONY: test
test: esm/.compiled
	@$(JEST) --collect-coverage

.PHONY: build
build: index.js

index.js: esm/.compiled
	@$(ROLLUP) $(CURDIR)/esm/index.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --globals @fluent/sequence:FluentSequence,cached-iterable:CachedIterable,react:React,prop-types:PropTypes \
	    --output.format umd \
	    --output.file $@
	@echo -e " $(OK) $@ built"

html:
	@$(TYPEDOC) src \
	    --out ../html/react \
	    --mode file \
	    --excludeNotExported \
	    --excludePrivate \
	    --logger none \
	    --hideGenerator
	@echo -e " $(OK) html built"

clean:
	@rm -f esm/*.js esm/*.d.ts esm/.compiled
	@rm -f index.js
	@rm -rf ../html/react
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"
