export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)

TARGETS  := all dist lint test build html deps depsclean
PACKAGES := fluent-bundle # Only build fluent-bundle, since that's the only one we're using.

$(TARGETS): $(PACKAGES)

$(PACKAGES):
	@echo
	@echo -e "$(ARR) $@"
	@$(MAKE) -sC $@ $(MAKECMDGOALS)

.PHONY: $(TARGETS) $(PACKAGES)

deploy-html:
	gh-pages -d html

clean: $(PACKAGES)
	@echo
	@rm -rf html
	@echo -e "$(OK) html $@"

include tools/perf/makefile

ARR := \033[34;01m→\033[0m
OK := \033[32;01m✓\033[0m
