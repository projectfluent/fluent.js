# This makefile is intended to be included by each package's makefile.  The
# paths are relative to the package directory.

ROOT := $(dir $(lastword $(MAKEFILE_LIST)))
SOURCES := $(wildcard src/*)
VERSION := $(shell node -pe "require('./package.json').version")
DOC_DESTINATION := $(subst @fluent, ../html, $(PACKAGE))

export SHELL := /bin/bash
ESLINT ?= $(ROOT)node_modules/.bin/eslint
TSC ?= $(ROOT)node_modules/.bin/tsc
MOCHA ?= $(ROOT)node_modules/.bin/mocha
ROLLUP ?= $(ROOT)node_modules/.bin/rollup
TYPEDOC ?= $(ROOT)node_modules/.bin/typedoc

ROLLUP_CMD = $(ROLLUP) $(CURDIR)/esm/index.js \
	--banner "/* $(PACKAGE)@$(VERSION) */" \
	--amd.id $(PACKAGE) \
	--name $(GLOBAL) \
	--output.format umd \
	--output.file \
	$(NULL)

TYPEDOC_CMD = $(TYPEDOC) src/index.?s \
	--out $(DOC_DESTINATION) \
	--logger none \
	--hideGenerator \
	--includeVersion \
	$(NULL)

MOCHA_CMD = npx c8 $(MOCHA) \
	--recursive --ui tdd \
	$(MOCHA_EXTRA_ARGS) \
	test/**/*_test.js \
	$(NULL)

# Common maintenance tasks.
.PHONY: clean lint test build html

# The default target.
all: lint test build

# Used for pre-publishing.
dist: clean lint test build html

OK := \033[32;01m✓\033[0m
