# This makefile is intended to be included by each package's makefile.  The
# paths are relative to the package directory.

ROOT := $(CURDIR)/..
SOURCES := $(wildcard src/*)
VERSION := $(shell node -pe "require('./package.json').version")

export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(ROOT)/node_modules/.bin:$(PATH)

# Common maintenance tasks.
.PHONY: clean lint test build html

# The default target.
all: lint test build

# Used for pre-publishing.
dist: clean lint test build html

_lint:
	@eslint --config $(ROOT)/eslint_js.json --max-warnings 0 src/
	@eslint --config $(ROOT)/eslint_test.json --max-warnings 0 test/
	@echo -e " $(OK) lint"

_html:
ifneq (,$(wildcard ./.esdoc.json))
	@esdoc
	@echo -e " $(OK) html built"
endif

_clean:
	@rm -f index.js compat.js
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"

deps:
	@npm install
	@echo -e " $(OK) deps installed"

depsclean:
	@rm -rf node_modules
	@echo -e " $(OK) deps clean"

OK := \033[32;01m✓\033[0m
