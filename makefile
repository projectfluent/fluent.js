export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)

TARGETS  := all lint test build compat clean
PACKAGES := $(wildcard fluent*)

$(TARGETS): $(PACKAGES)

$(PACKAGES):
	@$(MAKE) -sC $@ $(MAKECMDGOALS)

docs:
	documentation build --shallow -f md \
	    fluent/src/*.js > docs/fluent.md
	documentation build --shallow -f md \
	    fluent-syntax/src/*.js > docs/fluent-syntax.md

.PHONY: $(TARGETS) $(PACKAGES) docs

include tools/perf/makefile
