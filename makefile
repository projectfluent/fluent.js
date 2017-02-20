export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)

TARGETS  := all lint test build compat docs clean
PACKAGES := $(wildcard fluent*)

$(TARGETS): $(PACKAGES)

$(PACKAGES):
	@$(MAKE) -sC $@ $(MAKECMDGOALS)

.PHONY: $(TARGETS) $(PACKAGES)

include tools/perf/makefile
