PACKAGE := @fluent/sequence
GLOBAL  := FluentSequence

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
	@$(MAKE) mocha-test

.PHONY: build
build: index.js

index.js: esm/.compiled
	@$(ROLLUP) $(CURDIR)/esm/index.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output.format umd \
	    --output.file $@
	@echo -e " $(OK) $@ built"

html:
	@$(TYPEDOC) src \
	    --out ../html/sequence \
	    --mode file \
	    --excludeNotExported \
	    --excludePrivate \
	    --logger none \
	    --hideGenerator
	@echo -e " $(OK) html built"

clean:
	@rm -f esm/*.js esm/*.d.ts esm/.compiled
	@rm -f index.js
	@rm -rf ../html/sequence
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"
