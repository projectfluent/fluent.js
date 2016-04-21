export SHELL := /bin/bash
export PATH  := $(CURDIR)/node_modules/.bin:$(PATH)
export OK := \033[32;01m✓\033[0m

RUNTIMES := $(wildcard src/runtime/*)

.PHONY: build
build: $(RUNTIMES)

.PHONY: $(RUNTIMES)
$(RUNTIMES):
	@$(MAKE) -s -C $@
	@echo -e " $(OK) $@ built"

.PHONY: clean
clean:
	@rm -rf dist/*
	@echo -e " $(OK) dist/ clean"

.PHONY: lint
lint:
	eslint src/
