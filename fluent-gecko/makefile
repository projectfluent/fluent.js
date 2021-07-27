PACKAGE := fluent-gecko

include ../common.mk

# Expand a package name ("fluent") into a version tag ("fluent@0.10.0").
version = $(1)@$(shell node -e "\
	console.log(require('../$(1)/package.json').version)")

lint:
	@$(ESLINT) --max-warnings 0 src/
	@echo -e " $(OK) lint"

test: ;

.PHONY: build
build: $(SOURCES)
	@$(ROLLUP) --config rollup.config.mjs
	@echo -e " $(OK) built"

clean:
	@rm -rf dist
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"

html: ;
