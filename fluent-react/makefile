PACKAGE := @fluent/react
GLOBAL  := FluentReact
JEST    ?= node_modules/.bin/jest

include ../common.mk

lint:
	@$(ESLINT) --config $(ROOT)/eslint_ts.yaml --max-warnings 0 src/*.ts
	@$(ESLINT) --config $(ROOT)/eslint_test.yaml --max-warnings 0 test/
	@echo -e " $(OK) lint"

.PHONY: compile
compile: esm/.compiled

esm/.compiled: $(SOURCES)
	@$(TSC)
	@echo '{ "type": "module" }' > esm/package.json
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
	@$(TYPEDOC_CMD)
	@echo -e " $(OK) html built"

clean:
	@rm -f esm/*.js esm/*.d.ts esm/.compiled
	@rm -f index.js
	@rm -rf $(DOC_DESTINATION)
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"
