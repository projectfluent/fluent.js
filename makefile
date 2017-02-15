export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)

DIST := $(CURDIR)/dist
OK := \033[32;01m✓\033[0m

all: lint test build

build:
	@rollup $(CURDIR)/src/index.js \
	    -f umd \
	    -n Fluent \
	    -o $(DIST)/fluent.js
	@echo -e " $(OK) dist/fluent.js built"

clean:
	@rm -rf dist/*
	@echo -e " $(OK) dist cleaned"

lint:
	@eslint --max-warnings 0 src/
	@echo -e " $(OK) src/ linted"

test:
	@mocha --recursive --require ./test/compat

docs:
	documentation build --shallow -f md \
	    src/syntax/*.js > docs/parser.md
	documentation build --shallow -f md \
	    src/intl/*.js > docs/messagecontext.md

.PHONY: test docs

include tools/perf/makefile
