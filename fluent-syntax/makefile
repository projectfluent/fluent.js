PACKAGE := @fluent/syntax
GLOBAL  := FluentSyntax

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
	    --out ../html/syntax \
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

STRUCTURE_FTL := $(wildcard test/fixtures_structure/*.ftl)
STRUCTURE_AST := $(STRUCTURE_FTL:.ftl=.json)

.PHONY: fixtures
fixtures: $(STRUCTURE_AST)

.PHONY: $(STRUCTURE_AST)
$(STRUCTURE_AST): test/fixtures_structure/%.json: test/fixtures_structure/%.ftl
	@../tools/parse.js --silent --with-spans $< > $@
	@echo -e " $(OK) $@"
