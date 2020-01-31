PACKAGE := @fluent/dedent
GLOBAL  := FluentDedent

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
	@nyc --reporter=text --reporter=html mocha \
	    --recursive --ui tdd \
	    --require esm \
	    test/**/*_test.js

build: index.js compat.js

index.js: esm/.compiled
	@rollup $(CURDIR)/esm/index.js \
	    --config $(ROOT)/bundle_config.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output.file $@
	@echo -e " $(OK) $@ built"

compat.js: esm/.compiled
	@rollup $(CURDIR)/esm/index.js \
	    --config $(ROOT)/compat_config.js \
	    --banner "/* $(PACKAGE)@$(VERSION) */" \
	    --amd.id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output.file $@
	@echo -e " $(OK) $@ built"

html:
	@typedoc src \
	    --out ../html/dedent \
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
