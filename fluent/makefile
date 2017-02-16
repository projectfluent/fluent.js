export SHELL := /bin/bash
export PATH  := $(CURDIR)/../node_modules/.bin:$(PATH)

OK := \033[32;01m✓\033[0m

PACKAGE := fluent
GLOBAL  := Fluent

all: lint test build

build:
	@rollup $(CURDIR)/src/index.js \
	    -f umd \
	    -n $(GLOBAL) \
	    -o $(PACKAGE).js
	@echo -e " $(OK) $(PACKAGE) built"

clean:
	@rm $(PACKAGE).js
	@echo -e " $(OK) $(PACKAGE) cleaned"

lint:
	@eslint --max-warnings 0 src/
	@echo -e " $(OK) $(PACKAGE) linted"

test:
	@mocha --recursive --require ./test/compat

.PHONY: test
