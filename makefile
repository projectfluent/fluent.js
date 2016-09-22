export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)
export OK := \033[32;01m✓\033[0m

RUNTIMES := $(wildcard src/runtime/*)

all: lint build

build: $(RUNTIMES)

$(RUNTIMES):
	@$(MAKE) -s -C $@
	@echo -e " $(OK) $@ built"

clean:
	@rm -rf dist/*
	@echo -e " $(OK) dist cleaned"

lint:
	@eslint --max-warnings 0 src/
	@echo -e " $(OK) src/ linted"

test-lib:
	@mocha \
	    --recursive \
	    --reporter dot \
	    --require ./test/compat \
	    test/lib/parser/ftl

test-browser:
	karma start test/karma.conf.js

docs:
	documentation build --shallow -f md \
	    src/lib/**/*.js > docs/localization.md
	documentation build --shallow -f md \
	    src/ftl/**/*.js > docs/parser.md
	documentation build --shallow -f md \
	    src/intl/*.js > docs/messagecontext.md

.PHONY: $(RUNTIMES) docs

include tools/perf/makefile
