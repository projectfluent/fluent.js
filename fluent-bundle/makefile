export SHELL := /bin/bash

OK := \033[32;01m✓\033[0m

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
