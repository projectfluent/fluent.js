PACKAGE := @fluent/syntax
GLOBAL  := FluentSyntax

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
	    --out ../html/syntax \
	    --mode file \
	    --excludeNotExported \
	    --excludePrivate \
	    --logger none \
	    --hideGenerator
	@echo -e " $(OK) html built"

clean:
	@rm -f esm/*.js esm/*.d.ts esm/.compiled
	@rm -f index.js
	@rm -rf ../html/syntax
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
