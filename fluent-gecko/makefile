PACKAGE := fluent-gecko

include ../common.mk

# Expand a package name ("fluent") into a version tag ("fluent@0.10.0").
version = $(1)@$(shell node -e "\
	console.log(require('../$(1)/package.json').version)")

lint:
	@$(ESLINT) --config $(ROOT)/eslint_js.json --max-warnings 0 src/
	@echo -e " $(OK) lint"

test: ;

.PHONY: build
build: FluentSyntax.jsm fluent-react.js

FluentSyntax.jsm: $(SOURCES)
	$(MAKE) -sC ../fluent-syntax compile
	@$(ROLLUP) $(CURDIR)/src/fluent-syntax.js \
	    --config ./xpcom_config.js \
	    --no-treeshake \
	    --no-freeze \
	    --output.intro "/* $(call version,fluent-syntax) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

fluent-react.js: $(SOURCES)
	$(MAKE) -sC ../fluent-react compile
	@$(ROLLUP) $(CURDIR)/src/fluent-react.js \
	    --config ./vendor_config.js \
	    --output.intro "/* $(call version,fluent-react) */" \
	    --output.file ./dist/$@
	@echo -e " $(OK) $@ built"

clean:
	@rm -rf dist
	@rm -rf .nyc_output coverage
	@echo -e " $(OK) clean"

html: ;
