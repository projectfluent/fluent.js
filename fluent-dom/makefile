PACKAGE := @fluent/dom
GLOBAL := FluentDOM
DEPS    := cached-iterable:CachedIterable

include ../common.mk

lint:
	@eslint --config $(ROOT)/eslint_js.json --max-warnings 0 src/
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
	@nyc --reporter=text --reporter=html mocha \
	    --recursive --ui tdd \
	    --require esm \
	    --require ./test/index \
	    test/**/*_test.js

.PHONY: build
build: index.js

index.js: esm/.compiled
	@rollup $(CURDIR)/esm/index.js \
		--banner "/* $(PACKAGE)@$(VERSION) */" \
		--amd.id $(PACKAGE) \
		--name $(GLOBAL) \
		--globals $(DEPS) \
		--output.format umd \
		--output.file $@
	@echo -e " $(OK) $@ built"

html:
	@typedoc src \
	    --out ../html/dom \
	    --mode file \
	    --excludeNotExported \
	    --excludePrivate \
	    --logger none \
	    --hideGenerator
	@echo -e " $(OK) html built"

clean:
	@rm -f esm/*.js esm/*.d.ts esm/.compiled
	@rm -f index.js
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"
