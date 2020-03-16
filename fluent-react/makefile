PACKAGE := @fluent/react
GLOBAL  := FluentReact

include ../common.mk

lint:
	@eslint --config $(ROOT)/eslint_ts.json --max-warnings 0 src/*.ts
	@eslint --config $(ROOT)/eslint_test.json --max-warnings 0 test/
	@echo -e " $(OK) lint"

.PHONY: compile
compile: esm/.compiled

esm/.compiled: $(SOURCES)
	@tsc
	@touch $@
	@echo -e " $(OK) esm/ compiled"

.PHONY: test
test: esm/.compiled
	@jest --collect-coverage

.PHONY: build
build: index.js compat.js

index.js: esm/.compiled
	@rollup $(CURDIR)/esm/index.js \
	    --config $(ROOT)/bundle_config.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --globals @fluent/sequence:FluentSequence,cached-iterable:CachedIterable,react:React,prop-types:PropTypes \
	    --output.file $@
	@echo -e " $(OK) $@ built"

compat.js: esm/.compiled
	@rollup $(CURDIR)/esm/index.js \
	    --config $(CURDIR)/compat_config.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --globals @fluent/sequence/compat:FluentSequence,cached-iterable/compat:CachedIterable,react:React,prop-types:PropTypes \
	    --output.file $@
	@echo -e " $(OK) $@ built"

html:
	@typedoc src \
	    --out ../html/react \
	    --mode file \
	    --excludeNotExported \
	    --excludePrivate \
	    --logger none \
	    --hideGenerator
	@echo -e " $(OK) html built"

clean:
	@rm -f esm/*.js esm/*.d.ts esm/.compiled
	@rm -f index.js compat.js
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"
