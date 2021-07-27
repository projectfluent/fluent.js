export SHELL := /bin/bash
GH_PAGES ?= $(CURDIR)/node_modules/.bin/gh-pages

TARGETS  := all dist test build html

# The order matters: dedent > bundle > sequence > others
PACKAGES := fluent-dedent fluent-bundle fluent-sequence fluent-dom fluent-gecko fluent-langneg fluent-react fluent-syntax

$(TARGETS): $(PACKAGES)

$(PACKAGES):
	@echo
	@echo -e "$(ARR) $@"
	@$(MAKE) -sC $@ $(MAKECMDGOALS)

.PHONY: $(TARGETS) $(PACKAGES)

deploy-html:
	$(GH_PAGES) -d html

clean: $(PACKAGES)
	@echo
	@rm -rf html
	@echo -e "$(OK) html $@"

lint:
	@npm run lint
	@echo -e "$(OK) lint"

include tools/perf/makefile

ARR := \033[34;01m→\033[0m
OK := \033[32;01m✓\033[0m
