# This makefile is intended to be included by each package's makefile.  The
# paths are relative to the package directory.

export SHELL := /bin/bash
export PATH  := $(CURDIR)/../node_modules/.bin:$(PATH)

# The default target.
all: lint test build

# Used for pre-publishing.
dist: lint test build compat docs

lint:
	@eslint --max-warnings 0 src/
	@echo -e " $(OK) $@"

test:
	@mocha --recursive --require ./test/setup

docs: docs/api.md

.PHONY: all dist lint test build compat clean docs

SOURCES := $(wildcard src/*)

docs/api.md: $(SOURCES)
	@documentation build --shallow -f md $(SOURCES) > docs/api.md
	@echo -e " $(OK) $@ built"

OK := \033[32;01m✓\033[0m
