export SHELL := /bin/bash
export PATH  := $(CURDIR)/../node_modules/.bin:$(PATH)

PACKAGE := fluent
GLOBAL  := Fluent

all: lint test build

lint:
	@eslint --max-warnings 0 src/
	@echo -e " $(OK) $@"

test:
	@mocha --recursive --require ./test/setup

build: $(PACKAGE).js compat.js

clean:
	@rm -f $(PACKAGE).js compat.js
	@echo -e " $(OK) clean"

docs: docs/api.md

.PHONY: all lint test build clean docs

SOURCES := $(wildcard src/*)

$(PACKAGE).js: $(SOURCES)
	@rollup $(CURDIR)/src/index.js \
	    --format umd \
	    --id $(PACKAGE) \
	    --name $(GLOBAL) \
	    --output $@
	@echo -e " $(OK) $@ built"

compat.js: $(PACKAGE).js
	@babel --presets latest $< > $@
	@echo -e " $(OK) $@ built"


docs/api.md: $(SOURCES)
	@documentation build --shallow -f md $(SOURCES) > docs/api.md
	@echo -e " $(OK) $@ built"

OK := \033[32;01m✓\033[0m
