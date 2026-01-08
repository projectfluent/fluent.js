export SHELL := /bin/bash

OK := \033[32;01m✓\033[0m

FIXTURES_FTL := $(wildcard test/fixtures_structure/*.ftl) $(wildcard test/fixtures_reference/*.ftl)
FIXTURES_AST := $(FIXTURES_FTL:.ftl=.json)

.PHONY: fixtures
fixtures: $(FIXTURES_AST)

.PHONY: $(FIXTURES_AST)
$(FIXTURES_AST): test/fixtures_%.json: test/fixtures_%.ftl
	@../tools/parse.mjs --silent --with-spans $< > $@
	@echo -e " $(OK) $@"
