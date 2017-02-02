export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)

DIST := $(CURDIR)/dist
OK := \033[32;01m✓\033[0m

all: lint build

build:
	@rollup $(CURDIR)/src/lib/index.js \
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
	@mocha \
	    --recursive \
	    --reporter dot \
	    --require ./test/compat \
	    test/**/*_test.js

docs:
	documentation build --shallow -f md \
	    src/ftl/**/*.js > docs/parser.md
	documentation build --shallow -f md \
	    src/intl/*.js > docs/messagecontext.md

.PHONY: test docs

include tools/perf/makefile
