PACKAGE := @fluent/bundle
GLOBAL  := FluentBundle

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

.PHONY: build
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
	    --out ../html/bundle \
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

BEHAVIOR_FTL := $(wildcard ../fluent-syntax/test/fixtures_behavior/*.ftl)
REFERENCE_FTL := $(wildcard ../fluent-syntax/test/fixtures_reference/*.ftl)
STRUCTURE_FTL := $(wildcard ../fluent-syntax/test/fixtures_structure/*.ftl)
BEHAVIOR_JSON := $(BEHAVIOR_FTL:../fluent-syntax/test/fixtures_behavior/%.ftl=test/fixtures_behavior/%.json)
REFERENCE_JSON := $(REFERENCE_FTL:../fluent-syntax/test/fixtures_reference/%.ftl=test/fixtures_reference/%.json)
STRUCTURE_JSON := $(STRUCTURE_FTL:../fluent-syntax/test/fixtures_structure/%.ftl=test/fixtures_structure/%.json)

.PHONY: fixtures
fixtures: $(BEHAVIOR_JSON) $(REFERENCE_JSON) $(STRUCTURE_JSON)

.PHONY: $(BEHAVIOR_JSON)
$(BEHAVIOR_JSON): test/fixtures_behavior/%.json: ../fluent-syntax/test/fixtures_behavior/%.ftl
	@node test/fixtures_behavior/make_fixtures.js -- $< > $@
	@echo -e " $(OK) $@"

.PHONY: $(REFERENCE_JSON)
$(REFERENCE_JSON): test/fixtures_reference/%.json: ../fluent-syntax/test/fixtures_reference/%.ftl
	@../tools/parse.js --runtime --silent $< > $@
	@echo -e " $(OK) $@"

.PHONY: $(STRUCTURE_JSON)
$(STRUCTURE_JSON): test/fixtures_structure/%.json: ../fluent-syntax/test/fixtures_structure/%.ftl
	@../tools/parse.js --runtime --silent $< > $@
	@echo -e " $(OK) $@"
