export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)

TARGETS  := all dist lint test build compat clean docs deps depsclean
PACKAGES := $(wildcard fluent*)

ARR := \033[34;01m→\033[0m

$(TARGETS): $(PACKAGES)

$(PACKAGES):
	@echo
	@echo -e "$(ARR) $@"
	@$(MAKE) -sC $@ $(MAKECMDGOALS)

.PHONY: $(TARGETS) $(PACKAGES)

include tools/perf/makefile
