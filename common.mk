# This makefile is intended to be included by each package's makefile.  The
# paths are relative to the package directory.

ROOT := $(CURDIR)/..

export SHELL := /bin/bash
export PATH  := $(ROOT)/node_modules/.bin:$(PATH)

# The default target.
all: lint test build

# Used for pre-publishing.
dist: lint test build compat docs

lint:
	@eslint --max-warnings 0 src/
	@echo -e " $(OK) $@"

test:
	@mocha --recursive --require ./test/setup

html:
	@jsdoc -c $(ROOT)/.jsdoc.json -R README.md -r \
	    -d $(ROOT)/html/$(PACKAGE) src
	@echo -e " $(OK) $@ built"

md: docs/api.md

deps:
	@npm install
	@echo -e " $(OK) $@ installed"

depsclean:
	@rm -rf node_modules
	@echo -e " $(OK) $@"

.PHONY: test docs

SOURCES := $(wildcard src/*)

docs/api.md: $(SOURCES)
	@jsdoc2md --files $(SOURCES) --separators > $@
	@echo -e " $(OK) $@ built"

OK := \033[32;01m✓\033[0m
