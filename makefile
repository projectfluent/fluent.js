export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)

RUNTIMES := $(wildcard src/runtime/*)

.PHONY: build
build: $(RUNTIMES)

.PHONY: $(RUNTIMES)
$(RUNTIMES):
	$(MAKE) -C $@

.PHONY: clean
clean:
	rm -rf dist/*

.PHONY: lint
lint:
	eslint src/
